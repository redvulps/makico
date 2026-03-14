import { parsePngMetadata } from '@infrastructure/imaging/png/parsePngMetadata';
import { IcnsExportError } from '@infrastructure/codecs/icns/IcnsExportError';
import {
  getIcnsChunkNote,
  shouldIncludeIcnsChunkInDiagnostics,
} from '@infrastructure/codecs/icns/icnsChunkNotes';

import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

export function replaceIcnsChunkWithPng(
  session: IcnsProjectSession,
  chunkId: string,
  pngBytes: Buffer,
): IcnsProjectSession {
  let didReplace = false;

  const nextChunks = session.workingChunks.map((chunk) => {
    if (chunk.id !== chunkId) {
      return chunk;
    }

    if (!chunk.slot) {
      throw new IcnsExportError(
        'The selected ICNS chunk does not map to a semantic slot and cannot be replaced yet.',
      );
    }

    const pngMetadata = parsePngMetadata(pngBytes);

    if (
      pngMetadata.width !== chunk.slot.pixelWidth ||
      pngMetadata.height !== chunk.slot.pixelHeight
    ) {
      throw new IcnsExportError(
        `The ${chunk.slot.label} slot requires a ${chunk.slot.pixelWidth}x${chunk.slot.pixelHeight} PNG image.`,
      );
    }

    didReplace = true;

    const note = getIcnsChunkNote(chunk.type, 'png', chunk.slot, true);

    return {
      ...chunk,
      byteLength: pngBytes.byteLength + 8,
      payloadLength: pngBytes.byteLength,
      payloadFamily: 'png' as const,
      isKnownType: true,
      isImageChunk: true,
      isSupported: true,
      note,
      includeInDiagnostics: shouldIncludeIcnsChunkInDiagnostics(
        'png',
        chunk.slot,
        true,
        note,
      ),
      previewDataUrl: `data:image/png;base64,${pngBytes.toString('base64')}`,
      payload: pngBytes,
    };
  });

  if (!didReplace) {
    throw new IcnsExportError('The requested ICNS chunk was not found.');
  }

  return {
    ...session,
    workingChunks: nextChunks,
    isDirty: true,
  };
}
