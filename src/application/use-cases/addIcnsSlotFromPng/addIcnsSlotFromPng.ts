import { IcnsExportError } from '@infrastructure/codecs/icns/IcnsExportError';
import {
  getCanonicalIcnsSlots,
  getIcnsSlotByChunkType,
} from '@infrastructure/codecs/icns/icnsSlotMap';
import { parsePngMetadata } from '@infrastructure/imaging/png/parsePngMetadata';
import type { ParsedIcnsChunk } from '@infrastructure/codecs/icns/icnsTypes';

import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

export function addIcnsSlotFromPng(
  session: IcnsProjectSession,
  chunkId: string,
  chunkType: string,
  pngBytes: Buffer,
): IcnsProjectSession {
  const slot = getIcnsSlotByChunkType(chunkType);

  if (!slot?.isCanonical) {
    throw new IcnsExportError(
      'Only canonical Apple ICNS slots can be created through this workflow.',
    );
  }

  const hasSlotAlready = session.workingChunks.some((chunk) => {
    return chunk.slot?.chunkType === chunkType;
  });

  if (hasSlotAlready) {
    throw new IcnsExportError(
      `The ${slot.label} slot already exists in this ICNS session. Replace the existing chunk instead of adding a duplicate slot.`,
    );
  }

  const pngMetadata = parsePngMetadata(pngBytes);

  if (
    pngMetadata.width !== slot.pixelWidth ||
    pngMetadata.height !== slot.pixelHeight
  ) {
    throw new IcnsExportError(
      `The ${slot.label} slot requires a ${slot.pixelWidth}x${slot.pixelHeight} PNG image.`,
    );
  }

  const nextChunk: ParsedIcnsChunk = {
    id: chunkId,
    index: 0,
    type: chunkType,
    offset: 0,
    byteLength: pngBytes.byteLength + 8,
    payloadLength: pngBytes.byteLength,
    payloadFamily: 'png',
    isKnownType: true,
    isImageChunk: true,
    isSupported: true,
    note: 'New canonical ICNS slot added in the current session.',
    includeInDiagnostics: false,
    slot,
    previewDataUrl: `data:image/png;base64,${pngBytes.toString('base64')}`,
    payload: pngBytes,
  };

  const nextEntries = [...session.workingChunks];
  const insertIndex = resolveInsertIndex(nextEntries, chunkType);

  nextEntries.splice(insertIndex, 0, nextChunk);

  return {
    ...session,
    workingChunks: reindexIcnsChunks(nextEntries),
    isDirty: true,
  };
}

function resolveInsertIndex(
  chunks: readonly ParsedIcnsChunk[],
  targetChunkType: string,
): number {
  const canonicalChunkOrder = new Map(
    getCanonicalIcnsSlots().map(
      (slot, index) => [slot.chunkType, index] as const,
    ),
  );
  const targetOrder = canonicalChunkOrder.get(targetChunkType);

  if (targetOrder === undefined) {
    return chunks.length;
  }

  let lastLowerCanonicalIndex = -1;

  for (const [index, chunk] of chunks.entries()) {
    const chunkOrder = chunk.slot
      ? canonicalChunkOrder.get(chunk.slot.chunkType)
      : undefined;

    if (chunkOrder !== undefined && chunkOrder < targetOrder) {
      lastLowerCanonicalIndex = index;
    }
  }

  if (lastLowerCanonicalIndex >= 0) {
    return lastLowerCanonicalIndex + 1;
  }

  const firstHigherCanonicalIndex = chunks.findIndex((chunk) => {
    const chunkOrder = chunk.slot
      ? canonicalChunkOrder.get(chunk.slot.chunkType)
      : undefined;

    return chunkOrder !== undefined && chunkOrder > targetOrder;
  });

  return firstHigherCanonicalIndex === -1
    ? chunks.length
    : firstHigherCanonicalIndex;
}

function reindexIcnsChunks(
  chunks: readonly ParsedIcnsChunk[],
): readonly ParsedIcnsChunk[] {
  return chunks.map((chunk, index) => ({
    ...chunk,
    index,
  }));
}
