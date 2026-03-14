import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

export function undoIcnsProject(
  session: IcnsProjectSession,
): IcnsProjectSession {
  if (session.undoStack.length === 0) {
    return session;
  }

  const previousChunks = session.undoStack.at(-1) ?? session.workingChunks;

  return {
    ...session,
    workingChunks: previousChunks,
    undoStack: session.undoStack.slice(0, -1),
    redoStack: [...session.redoStack, session.workingChunks],
    isDirty: previousChunks !== session.savedChunks,
  };
}
