import { encodeRgbaPng } from '@infrastructure/imaging/png/encodeRgbaPng';

import { InvalidIcoFileError } from './InvalidIcoFileError';

const BITMAPINFOHEADER_SIZE = 40;
const BI_RGB = 0;

interface DecodedIcoDib {
  readonly width: number;
  readonly height: number;
  readonly planes: number;
  readonly bitCount: number;
  readonly previewDataUrl: string | null;
}

export function decodeIcoDib(
  payload: Buffer,
  expectedWidth: number,
  expectedHeight: number,
): DecodedIcoDib {
  if (payload.length < BITMAPINFOHEADER_SIZE) {
    throw new InvalidIcoFileError(
      'The ICO DIB payload is smaller than a BITMAPINFOHEADER.',
    );
  }

  const view = new DataView(
    payload.buffer,
    payload.byteOffset,
    payload.byteLength,
  );
  const headerSize = view.getUint32(0, true);

  if (headerSize < BITMAPINFOHEADER_SIZE || headerSize > payload.length) {
    throw new InvalidIcoFileError('The ICO DIB header size is invalid.');
  }

  const width = view.getInt32(4, true);
  const storedHeight = view.getInt32(8, true);
  const planes = view.getUint16(12, true);
  const bitCount = view.getUint16(14, true);
  const compression = view.getUint32(16, true);
  const colorTableSize = getColorTableSize(view, bitCount);
  const normalizedWidth = Math.abs(width);
  const normalizedHeight = normalizeHeight(storedHeight, expectedHeight);
  const topDown = storedHeight < 0;

  if (normalizedWidth !== expectedWidth) {
    throw new InvalidIcoFileError(
      'The ICO entry width does not match the DIB header width.',
    );
  }

  const xorRowStride = getRowStride(normalizedWidth, bitCount);
  const xorByteLength = xorRowStride * normalizedHeight;
  const xorOffset = headerSize + colorTableSize;

  if (xorOffset + xorByteLength > payload.length) {
    throw new InvalidIcoFileError('The ICO DIB pixel array is truncated.');
  }

  if (compression !== BI_RGB) {
    return {
      width: normalizedWidth,
      height: normalizedHeight,
      planes,
      bitCount,
      previewDataUrl: null,
    };
  }

  if (!supportsPreviewBitDepth(bitCount)) {
    return {
      width: normalizedWidth,
      height: normalizedHeight,
      planes,
      bitCount,
      previewDataUrl: null,
    };
  }

  const rgba = decodeRgbaPixels({
    payload,
    view,
    headerSize,
    colorTableSize,
    width: normalizedWidth,
    height: normalizedHeight,
    bitCount,
    xorOffset,
    xorRowStride,
    topDown,
  });

  const andMaskOffset = xorOffset + xorByteLength;
  applyAndMask(payload, rgba, normalizedWidth, normalizedHeight, andMaskOffset);

  return {
    width: normalizedWidth,
    height: normalizedHeight,
    planes,
    bitCount,
    previewDataUrl: `data:image/png;base64,${encodeRgbaPng(rgba, normalizedWidth, normalizedHeight).toString('base64')}`,
  };
}

function normalizeHeight(storedHeight: number, expectedHeight: number): number {
  const absoluteHeight = Math.abs(storedHeight);

  if (absoluteHeight === expectedHeight * 2) {
    return expectedHeight;
  }

  if (absoluteHeight === expectedHeight) {
    return expectedHeight;
  }

  throw new InvalidIcoFileError(
    'The ICO entry height does not match the DIB header height.',
  );
}

function getColorTableSize(view: DataView, bitCount: number): number {
  if (bitCount > 8) {
    return 0;
  }

  const colorCount = view.getUint32(32, true);
  const paletteEntries = colorCount > 0 ? colorCount : 1 << bitCount;

  return paletteEntries * 4;
}

function getRowStride(width: number, bitCount: number): number {
  return Math.floor((width * bitCount + 31) / 32) * 4;
}

interface DecodeRgbaPixelsInput {
  readonly payload: Buffer;
  readonly view: DataView;
  readonly headerSize: number;
  readonly colorTableSize: number;
  readonly width: number;
  readonly height: number;
  readonly bitCount: number;
  readonly xorOffset: number;
  readonly xorRowStride: number;
  readonly topDown: boolean;
}

function decodeRgbaPixels(input: DecodeRgbaPixelsInput): Uint8Array {
  switch (input.bitCount) {
    case 32:
      return decode32Bit(input);
    case 24:
      return decode24Bit(input);
    case 8:
      return decodeIndexed(input, 8);
    case 4:
      return decodeIndexed(input, 4);
    case 1:
      return decodeIndexed(input, 1);
    default:
      throw new InvalidIcoFileError(
        `Unsupported ICO DIB bit depth ${input.bitCount}.`,
      );
  }
}

function supportsPreviewBitDepth(bitCount: number): boolean {
  return (
    bitCount === 32 ||
    bitCount === 24 ||
    bitCount === 8 ||
    bitCount === 4 ||
    bitCount === 1
  );
}

function decode32Bit(input: DecodeRgbaPixelsInput): Uint8Array {
  const rgba = new Uint8Array(input.width * input.height * 4);
  let hasMeaningfulAlpha = false;

  for (let y = 0; y < input.height; y += 1) {
    const sourceRow = input.topDown ? y : input.height - 1 - y;
    const rowOffset = input.xorOffset + sourceRow * input.xorRowStride;

    for (let x = 0; x < input.width; x += 1) {
      const sourceOffset = rowOffset + x * 4;
      const targetOffset = (y * input.width + x) * 4;
      const blue = readByte(input.payload, sourceOffset);
      const green = readByte(input.payload, sourceOffset + 1);
      const red = readByte(input.payload, sourceOffset + 2);
      const alpha = readByte(input.payload, sourceOffset + 3);

      rgba[targetOffset] = red;
      rgba[targetOffset + 1] = green;
      rgba[targetOffset + 2] = blue;
      rgba[targetOffset + 3] = alpha;

      if (alpha !== 0) {
        hasMeaningfulAlpha = true;
      }
    }
  }

  if (!hasMeaningfulAlpha) {
    for (let offset = 3; offset < rgba.length; offset += 4) {
      rgba[offset] = 0xff;
    }
  }

  return rgba;
}

function decode24Bit(input: DecodeRgbaPixelsInput): Uint8Array {
  const rgba = new Uint8Array(input.width * input.height * 4);

  for (let y = 0; y < input.height; y += 1) {
    const sourceRow = input.topDown ? y : input.height - 1 - y;
    const rowOffset = input.xorOffset + sourceRow * input.xorRowStride;

    for (let x = 0; x < input.width; x += 1) {
      const sourceOffset = rowOffset + x * 3;
      const targetOffset = (y * input.width + x) * 4;

      rgba[targetOffset] = readByte(input.payload, sourceOffset + 2);
      rgba[targetOffset + 1] = readByte(input.payload, sourceOffset + 1);
      rgba[targetOffset + 2] = readByte(input.payload, sourceOffset);
      rgba[targetOffset + 3] = 0xff;
    }
  }

  return rgba;
}

function decodeIndexed(
  input: DecodeRgbaPixelsInput,
  bitsPerPixel: 8 | 4 | 1,
): Uint8Array {
  const paletteOffset = input.headerSize;
  const paletteEntries = input.colorTableSize / 4;
  const rgba = new Uint8Array(input.width * input.height * 4);

  if (paletteOffset + input.colorTableSize > input.payload.length) {
    throw new InvalidIcoFileError('The ICO DIB palette is truncated.');
  }

  for (let y = 0; y < input.height; y += 1) {
    const sourceRow = input.topDown ? y : input.height - 1 - y;
    const rowOffset = input.xorOffset + sourceRow * input.xorRowStride;

    for (let x = 0; x < input.width; x += 1) {
      const paletteIndex = readPaletteIndex(
        input.payload,
        rowOffset,
        x,
        bitsPerPixel,
      );

      if (paletteIndex >= paletteEntries) {
        throw new InvalidIcoFileError(
          'The ICO DIB palette index is out of bounds.',
        );
      }

      const paletteEntryOffset = paletteOffset + paletteIndex * 4;
      const targetOffset = (y * input.width + x) * 4;

      rgba[targetOffset] = readByte(input.payload, paletteEntryOffset + 2);
      rgba[targetOffset + 1] = readByte(input.payload, paletteEntryOffset + 1);
      rgba[targetOffset + 2] = readByte(input.payload, paletteEntryOffset);
      rgba[targetOffset + 3] = 0xff;
    }
  }

  return rgba;
}

function readPaletteIndex(
  payload: Buffer,
  rowOffset: number,
  x: number,
  bitsPerPixel: 8 | 4 | 1,
): number {
  if (bitsPerPixel === 8) {
    return readByte(payload, rowOffset + x);
  }

  if (bitsPerPixel === 4) {
    const byte = readByte(payload, rowOffset + Math.floor(x / 2));

    return x % 2 === 0 ? byte >> 4 : byte & 0x0f;
  }

  const byte = readByte(payload, rowOffset + Math.floor(x / 8));
  const shift = 7 - (x % 8);

  return (byte >> shift) & 0x01;
}

function applyAndMask(
  payload: Buffer,
  rgba: Uint8Array,
  width: number,
  height: number,
  andMaskOffset: number,
): void {
  const maskRowStride = getRowStride(width, 1);
  const maskByteLength = maskRowStride * height;
  const remainingBytes = payload.length - andMaskOffset;

  if (remainingBytes === 0) {
    return;
  }

  if (remainingBytes < maskByteLength) {
    throw new InvalidIcoFileError('The ICO DIB AND mask is truncated.');
  }

  for (let y = 0; y < height; y += 1) {
    const sourceRow = height - 1 - y;
    const rowOffset = andMaskOffset + sourceRow * maskRowStride;

    for (let x = 0; x < width; x += 1) {
      const byte = readByte(payload, rowOffset + Math.floor(x / 8));
      const shift = 7 - (x % 8);
      const isTransparent = ((byte >> shift) & 0x01) === 1;

      if (isTransparent) {
        rgba[(y * width + x) * 4 + 3] = 0;
      }
    }
  }
}

function readByte(payload: Buffer, offset: number): number {
  const value = payload[offset];

  if (value === undefined) {
    throw new InvalidIcoFileError('The ICO DIB payload ended unexpectedly.');
  }

  return value;
}
