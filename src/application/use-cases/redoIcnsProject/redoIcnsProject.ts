import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

export function redoIcnsProject(
  session: IcnsProjectSession,
): IcnsProjectSession {
  if (session.redoStack.length === 0) {
    return session;
  }

  const nextChunks = session.redoStack.at(-1) ?? session.workingChunks;

  return {
    ...session,
    workingChunks: nextChunks,
    undoStack: [...session.undoStack, session.workingChunks],
    redoStack: session.redoStack.slice(0, -1),
    isDirty: nextChunks !== session.savedChunks,
  };
}
