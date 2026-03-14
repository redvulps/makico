import type { IcoProjectSession } from '../importIco/importIcoProject';

export function undoIcoProject(session: IcoProjectSession): IcoProjectSession {
  if (session.undoStack.length === 0) {
    return session;
  }

  const previousEntries = session.undoStack.at(-1) ?? session.workingEntries;

  return {
    ...session,
    workingEntries: previousEntries,
    undoStack: session.undoStack.slice(0, -1),
    redoStack: [...session.redoStack, session.workingEntries],
    isDirty: previousEntries !== session.savedEntries,
  };
}
