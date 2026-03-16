import { deflateSync } from 'node:zlib';

import { crc32 } from './crc32';
import { InvalidPngFileError } from './InvalidPngFileError';

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const PNG_BIT_DEPTH_8 = 8;
const PNG_COLOR_TYPE_RGBA = 6;
const PNG_COMPRESSION_DEFLATE = 0;
const PNG_FILTER_ADAPTIVE = 0;
const PNG_INTERLACE_NONE = 0;
const PNG_FILTER_NONE = 0;

/**
 * Encodes raw RGBA pixel data into a minimal valid PNG file.
 *
 * Produces an 8-bit RGBA PNG with no filtering and default (deflate) compression.
 * The output is suitable for embedding in ICO/ICNS containers or writing directly to disk.
 */
export function encodeRgbaPng(
  rgba: Uint8Array,
  width: number,
  height: number,
): Buffer {
  if (width <= 0 || height <= 0) {
    throw new InvalidPngFileError('PNG dimensions must be positive.');
  }

  const expectedLength = width * height * 4;

  if (rgba.length !== expectedLength) {
    throw new InvalidPngFileError(
      `RGBA buffer length ${rgba.length} does not match ${expectedLength}.`,
    );
  }

  const scanlineLength = width * 4;
  const rawImage = Buffer.alloc((scanlineLength + 1) * height);

  for (let row = 0; row < height; row += 1) {
    const rawRowOffset = row * (scanlineLength + 1);
    const rgbaRowOffset = row * scanlineLength;

    rawImage[rawRowOffset] = PNG_FILTER_NONE;
    Buffer.from(
      rgba.subarray(rgbaRowOffset, rgbaRowOffset + scanlineLength),
    ).copy(rawImage, rawRowOffset + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(PNG_BIT_DEPTH_8, 8);
  ihdr.writeUInt8(PNG_COLOR_TYPE_RGBA, 9);
  ihdr.writeUInt8(PNG_COMPRESSION_DEFLATE, 10);
  ihdr.writeUInt8(PNG_FILTER_ADAPTIVE, 11);
  ihdr.writeUInt8(PNG_INTERLACE_NONE, 12);

  const compressed = deflateSync(rawImage);

  return Buffer.concat([
    PNG_SIGNATURE,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  const crcValue = crc32(Buffer.concat([typeBuffer, data]));
  crcBuffer.writeUInt32BE(crcValue, 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}
