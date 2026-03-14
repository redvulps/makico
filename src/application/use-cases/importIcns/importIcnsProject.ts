import path from 'node:path';

import { deriveIcnsDiagnostics } from '@infrastructure/codecs/icns/deriveIcnsDiagnostics';
import { parseIcnsBuffer } from '@infrastructure/codecs/icns/parseIcnsBuffer';
import type { ParsedIcnsChunk } from '@infrastructure/codecs/icns/icnsTypes';
import type { IcnsProjectDto } from '@shared/dto/iconProject';

export interface IcnsProjectSession {
  readonly id: string;
  readonly format: 'icns';
  readonly name: string;
  readonly sourcePath: string | null;
  readonly importedAt: string;
  readonly containerDiagnostics: readonly string[];
  readonly savedChunks: readonly ParsedIcnsChunk[];
  readonly workingChunks: readonly ParsedIcnsChunk[];
  readonly undoStack: readonly (readonly ParsedIcnsChunk[])[];
  readonly redoStack: readonly (readonly ParsedIcnsChunk[])[];
  readonly isDirty: boolean;
}

interface ImportIcnsProjectInput {
  readonly projectId: string;
  readonly filePath: string | null;
  readonly sourceName?: string | null;
  readonly bytes: Buffer;
}

export function importIcnsProject(
  input: ImportIcnsProjectInput,
): IcnsProjectSession {
  const importedAt = new Date().toISOString();
  const parsed = parseIcnsBuffer(input.bytes);
  const fallbackName = `makico-import-${input.projectId}.icns`;

  return {
    id: input.projectId,
    format: 'icns',
    name: input.filePath
      ? path.basename(input.filePath)
      : input.sourceName
        ? path.basename(input.sourceName)
        : fallbackName,
    sourcePath: input.filePath,
    importedAt,
    containerDiagnostics: parsed.containerDiagnostics,
    savedChunks: parsed.chunks,
    workingChunks: parsed.chunks,
    undoStack: [],
    redoStack: [],
    isDirty: false,
  };
}

export function mapIcnsProjectSessionToDto(
  session: IcnsProjectSession,
): IcnsProjectDto {
  const canonicalExportSlotCount = new Set(
    session.workingChunks
      .filter((chunk) => chunk.isSupported && chunk.slot?.isCanonical)
      .map((chunk) => chunk.slot?.chunkType),
  ).size;

  return {
    id: session.id,
    format: session.format,
    name: session.name,
    sourcePath: session.sourcePath,
    importedAt: session.importedAt,
    isDirty: session.isDirty,
    canUndo: session.undoStack.length > 0,
    canRedo: session.redoStack.length > 0,
    chunkCount: session.workingChunks.length,
    imageChunkCount: session.workingChunks.filter((chunk) => chunk.isImageChunk)
      .length,
    supportedSlotCount: session.workingChunks.filter(
      (chunk) => chunk.isSupported,
    ).length,
    canonicalExportSlotCount,
    diagnostics: deriveIcnsDiagnostics(
      session.containerDiagnostics,
      session.workingChunks,
    ),
    chunks: session.workingChunks.map((chunk, index) => ({
      id: chunk.id,
      index,
      type: chunk.type,
      offset: chunk.offset,
      byteLength: chunk.byteLength,
      payloadLength: chunk.payloadLength,
      payloadFamily: chunk.payloadFamily,
      isKnownType: chunk.isKnownType,
      isImageChunk: chunk.isImageChunk,
      isSupported: chunk.isSupported,
      note: chunk.note,
      slot: chunk.slot
        ? {
            label: chunk.slot.label,
            pointSize: chunk.slot.pointSize,
            scale: chunk.slot.scale,
            pixelWidth: chunk.slot.pixelWidth,
            pixelHeight: chunk.slot.pixelHeight,
            chunkType: chunk.slot.chunkType,
            isCanonical: chunk.slot.isCanonical,
          }
        : null,
      previewDataUrl: chunk.previewDataUrl,
    })),
  };
}
