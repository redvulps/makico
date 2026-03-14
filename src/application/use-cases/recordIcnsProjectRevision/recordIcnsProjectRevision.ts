import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

export function recordIcnsProjectRevision(
  previousSession: IcnsProjectSession,
  nextSession: IcnsProjectSession,
): IcnsProjectSession {
  if (previousSession.workingChunks === nextSession.workingChunks) {
    return nextSession;
  }

  return {
    ...nextSession,
    undoStack: [...previousSession.undoStack, previousSession.workingChunks],
    redoStack: [],
  };
}
