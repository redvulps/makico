import type { IcoProjectSession } from '../importIco/importIcoProject';

interface CreateIcoProjectInput {
  readonly projectId: string;
}

export function createIcoProject(
  input: CreateIcoProjectInput,
): IcoProjectSession {
  return {
    id: input.projectId,
    format: 'ico',
    name: 'Untitled Icon.ico',
    sourcePath: null,
    importedAt: new Date().toISOString(),
    savedEntries: [],
    workingEntries: [],
    undoStack: [],
    redoStack: [],
    isDirty: false,
  };
}
