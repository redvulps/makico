import { parsePngMetadata } from '@infrastructure/imaging/png/parsePngMetadata';

import { InvalidIcoFileError } from './InvalidIcoFileError';
import type { ParsedIcoEntry } from './icoTypes';

/**
 * Creates a new ICO entry from raw PNG bytes.
 *
 * Reads dimensions and color type from the PNG's IHDR chunk to populate the
 * ICO directory fields. Rejects images outside the 1–256 pixel range.
 */
export function createPngIcoEntry(
  entryId: string,
  pngBytes: Buffer,
): ParsedIcoEntry {
  const metadata = parsePngMetadata(pngBytes);

  if (
    metadata.width < 1 ||
    metadata.width > 256 ||
    metadata.height < 1 ||
    metadata.height > 256
  ) {
    throw new InvalidIcoFileError(
      'ICO PNG replacement images must be between 1 and 256 pixels in both dimensions.',
    );
  }

  return {
    id: entryId,
    index: 0,
    width: metadata.width,
    height: metadata.height,
    colorCount: 0,
    planes: 1,
    bitCount: metadata.colorType === 6 || metadata.colorType === 4 ? 32 : 24,
    bytesInRes: pngBytes.length,
    imageOffset: 0,
    payloadKind: 'png',
    payload: pngBytes,
    previewDataUrl: `data:image/png;base64,${pngBytes.toString('base64')}`,
  };
}
