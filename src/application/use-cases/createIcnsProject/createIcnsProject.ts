import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

interface CreateIcnsProjectInput {
  readonly projectId: string;
}

export function createIcnsProject(
  input: CreateIcnsProjectInput,
): IcnsProjectSession {
  return {
    id: input.projectId,
    format: 'icns',
    name: 'Untitled Icon.icns',
    sourcePath: null,
    importedAt: new Date().toISOString(),
    containerDiagnostics: [],
    savedChunks: [],
    workingChunks: [],
    undoStack: [],
    redoStack: [],
    isDirty: false,
  };
}
