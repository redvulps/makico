import type { IcoProjectSession } from '../importIco/importIcoProject';

export function redoIcoProject(session: IcoProjectSession): IcoProjectSession {
  if (session.redoStack.length === 0) {
    return session;
  }

  const nextEntries = session.redoStack.at(-1) ?? session.workingEntries;

  return {
    ...session,
    workingEntries: nextEntries,
    undoStack: [...session.undoStack, session.workingEntries],
    redoStack: session.redoStack.slice(0, -1),
    isDirty: nextEntries !== session.savedEntries,
  };
}
