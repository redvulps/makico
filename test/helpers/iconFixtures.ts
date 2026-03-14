import { encodeIcnsChunks } from '@infrastructure/codecs/icns/encodeIcnsChunks';
import { createPngIcoEntry } from '@infrastructure/codecs/ico/createPngIcoEntry';
import { encodeIcoEntries } from '@infrastructure/codecs/ico/encodeIcoEntries';
import type { ParsedIcoEntry } from '@infrastructure/codecs/ico/icoTypes';
import { encodeRgbaPng } from '@infrastructure/imaging/png/encodeRgbaPng';

interface RgbaColor {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
  readonly alpha: number;
}

const DEFAULT_COLOR: RgbaColor = {
  red: 0x47,
  green: 0x8a,
  blue: 0x75,
  alpha: 0xff,
};

export function createSolidPng(
  width: number,
  height: number,
  color: RgbaColor = DEFAULT_COLOR,
): Buffer {
  const rgba = new Uint8Array(width * height * 4);

  for (let offset = 0; offset < rgba.length; offset += 4) {
    rgba[offset] = color.red;
    rgba[offset + 1] = color.green;
    rgba[offset + 2] = color.blue;
    rgba[offset + 3] = color.alpha;
  }

  return encodeRgbaPng(rgba, width, height);
}

export function createPngBackedIcoBuffer(
  width: number,
  height: number,
  color?: RgbaColor,
): Buffer {
  const png = createSolidPng(width, height, color);
  const entry = createPngIcoEntry(`png-${width}x${height}`, png);

  return encodeIcoEntries([entry]);
}

export function createDibBackedIcoBuffer(
  width: number,
  height: number,
  color: RgbaColor = DEFAULT_COLOR,
): Buffer {
  const payload = create32BitDibPayload(width, height, color);
  const entry: ParsedIcoEntry = {
    id: `dib-${width}x${height}`,
    index: 0,
    width,
    height,
    colorCount: 0,
    planes: 1,
    bitCount: 32,
    bytesInRes: payload.length,
    imageOffset: 0,
    payloadKind: 'dib',
    payload,
    previewDataUrl: null,
  };

  return encodeIcoEntries([entry]);
}

export function createIcnsBuffer(
  chunks: readonly {
    readonly type: string;
    readonly payload: Buffer;
  }[],
): Buffer {
  return encodeIcnsChunks(chunks);
}

function create32BitDibPayload(
  width: number,
  height: number,
  color: RgbaColor,
): Buffer {
  const bitmapInfoHeader = Buffer.alloc(40);
  const xorStride = width * 4;
  const xorByteLength = xorStride * height;
  const andMaskStride = Math.floor((width + 31) / 32) * 4;
  const andMask = Buffer.alloc(andMaskStride * height);
  const xorBitmap = Buffer.alloc(xorByteLength);

  bitmapInfoHeader.writeUInt32LE(40, 0);
  bitmapInfoHeader.writeInt32LE(width, 4);
  bitmapInfoHeader.writeInt32LE(height * 2, 8);
  bitmapInfoHeader.writeUInt16LE(1, 12);
  bitmapInfoHeader.writeUInt16LE(32, 14);
  bitmapInfoHeader.writeUInt32LE(0, 16);
  bitmapInfoHeader.writeUInt32LE(xorByteLength, 20);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = (height - 1 - y) * xorStride;

    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowOffset + x * 4;
      xorBitmap[pixelOffset] = color.blue;
      xorBitmap[pixelOffset + 1] = color.green;
      xorBitmap[pixelOffset + 2] = color.red;
      xorBitmap[pixelOffset + 3] = color.alpha;
    }
  }

  return Buffer.concat([bitmapInfoHeader, xorBitmap, andMask]);
}
