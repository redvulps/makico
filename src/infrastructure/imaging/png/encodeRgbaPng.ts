import { deflateSync } from 'node:zlib';

import { crc32 } from './crc32';

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export function encodeRgbaPng(
  rgba: Uint8Array,
  width: number,
  height: number,
): Buffer {
  if (width <= 0 || height <= 0) {
    throw new Error('PNG dimensions must be positive.');
  }

  const expectedLength = width * height * 4;

  if (rgba.length !== expectedLength) {
    throw new Error(
      `RGBA buffer length ${rgba.length} does not match ${expectedLength}.`,
    );
  }

  const scanlineLength = width * 4;
  const rawImage = Buffer.alloc((scanlineLength + 1) * height);

  for (let row = 0; row < height; row += 1) {
    const rawRowOffset = row * (scanlineLength + 1);
    const rgbaRowOffset = row * scanlineLength;

    rawImage[rawRowOffset] = 0;
    Buffer.from(
      rgba.subarray(rgbaRowOffset, rgbaRowOffset + scanlineLength),
    ).copy(rawImage, rawRowOffset + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

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
