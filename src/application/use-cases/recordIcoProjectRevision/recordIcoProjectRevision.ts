import type { IcoProjectSession } from '../importIco/importIcoProject';

export function recordIcoProjectRevision(
  previousSession: IcoProjectSession,
  nextSession: IcoProjectSession,
): IcoProjectSession {
  if (previousSession.workingEntries === nextSession.workingEntries) {
    return nextSession;
  }

  return {
    ...nextSession,
    undoStack: [...previousSession.undoStack, previousSession.workingEntries],
    redoStack: [],
  };
}
