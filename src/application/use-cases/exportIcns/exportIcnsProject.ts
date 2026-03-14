import { parsePngMetadata } from '@infrastructure/imaging/png/parsePngMetadata';
import { encodeIcnsChunks } from '@infrastructure/codecs/icns/encodeIcnsChunks';
import { IcnsExportError } from '@infrastructure/codecs/icns/IcnsExportError';
import { getCanonicalIcnsSlots } from '@infrastructure/codecs/icns/icnsSlotMap';

import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

export function exportIcnsProject(session: IcnsProjectSession): Buffer {
  const exportableChunks = getCanonicalIcnsSlots()
    .map((slot) => {
      const sourceChunk = [...session.workingChunks].reverse().find((chunk) => {
        return (
          chunk.payloadFamily === 'png' &&
          chunk.slot?.chunkType === slot.chunkType &&
          chunk.slot.isCanonical
        );
      });

      if (!sourceChunk) {
        return null;
      }

      const pngMetadata = parsePngMetadata(sourceChunk.payload);

      if (
        pngMetadata.width !== slot.pixelWidth ||
        pngMetadata.height !== slot.pixelHeight
      ) {
        throw new IcnsExportError(
          `The ${slot.chunkType} slot requires a ${slot.pixelWidth}x${slot.pixelHeight} PNG payload.`,
        );
      }

      return {
        type: slot.chunkType,
        payload: sourceChunk.payload,
      };
    })
    .filter((chunk) => chunk !== null);

  if (exportableChunks.length === 0) {
    throw new IcnsExportError(
      'The current ICNS project does not contain any canonical PNG-backed slots that can be exported.',
    );
  }

  return encodeIcnsChunks(exportableChunks);
}
