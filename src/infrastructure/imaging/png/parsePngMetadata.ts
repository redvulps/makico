import { InvalidPngFileError } from './InvalidPngFileError';

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export interface PngMetadata {
  readonly width: number;
  readonly height: number;
  readonly bitDepth: number;
  readonly colorType: number;
}

/**
 * Extracts width, height, bit depth, and color type from a PNG file's IHDR chunk.
 *
 * Only reads the first 33 bytes — does not decode pixel data or validate the full file.
 */
export function parsePngMetadata(bytes: Buffer): PngMetadata {
  if (bytes.length < 33) {
    throw new InvalidPngFileError(
      'The PNG file is too small to contain an IHDR chunk.',
    );
  }

  if (!bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new InvalidPngFileError(
      'The selected file is not a valid PNG image.',
    );
  }

  const ihdrLength = bytes.readUInt32BE(8);
  const ihdrType = bytes.subarray(12, 16).toString('ascii');

  if (ihdrType !== 'IHDR' || ihdrLength !== 13) {
    throw new InvalidPngFileError(
      'The PNG file does not contain a valid IHDR chunk.',
    );
  }

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes.readUInt8(24),
    colorType: bytes.readUInt8(25),
  };
}
