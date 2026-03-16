import path from 'node:path';

import { parseIcoBuffer } from '@infrastructure/codecs/ico/parseIcoBuffer';
import type { ParsedIcoEntry } from '@infrastructure/codecs/ico/icoTypes';
import type { IcoProjectDto } from '@shared/dto/iconProject';

export interface IcoProjectSession {
  readonly id: string;
  readonly format: 'ico';
  readonly name: string;
  readonly sourcePath: string | null;
  readonly importedAt: string;
  /** The entries as they were at the last save (or import). Used as the reset/diff baseline. */
  readonly savedEntries: readonly ParsedIcoEntry[];
  /** The entries reflecting all unsaved edits. This is what the UI renders. */
  readonly workingEntries: readonly ParsedIcoEntry[];
  readonly undoStack: readonly (readonly ParsedIcoEntry[])[];
  readonly redoStack: readonly (readonly ParsedIcoEntry[])[];
  readonly isDirty: boolean;
}

interface ImportIcoProjectInput {
  readonly projectId: string;
  readonly filePath: string | null;
  readonly sourceName?: string | null;
  readonly bytes: Buffer;
}

/** Parses an ICO file buffer and creates a new project session with undo/redo stacks. */
export function importIcoProject(
  input: ImportIcoProjectInput,
): IcoProjectSession {
  const importedAt = new Date().toISOString();
  const parsed = parseIcoBuffer(input.bytes);
  const fallbackName = `makico-import-${input.projectId}.ico`;

  return {
    id: input.projectId,
    format: 'ico',
    name: input.filePath
      ? path.basename(input.filePath)
      : input.sourceName
        ? path.basename(input.sourceName)
        : fallbackName,
    sourcePath: input.filePath,
    importedAt,
    savedEntries: parsed.entries,
    workingEntries: parsed.entries,
    undoStack: [],
    redoStack: [],
    isDirty: false,
  };
}

export function mapIcoProjectSessionToDto(
  session: IcoProjectSession,
): IcoProjectDto {
  return {
    id: session.id,
    format: session.format,
    name: session.name,
    sourcePath: session.sourcePath,
    importedAt: session.importedAt,
    isDirty: session.isDirty,
    canUndo: session.undoStack.length > 0,
    canRedo: session.redoStack.length > 0,
    entryCount: session.workingEntries.length,
    entries: session.workingEntries.map((entry, index) => ({
      id: entry.id,
      index,
      width: entry.width,
      height: entry.height,
      colorCount: entry.colorCount,
      planes: entry.planes,
      bitCount: entry.bitCount,
      bytesInRes: entry.bytesInRes,
      payloadKind: entry.payloadKind,
      previewDataUrl: entry.previewDataUrl,
    })),
  };
}
