import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

export function resetIcnsProject(
  session: IcnsProjectSession,
): IcnsProjectSession {
  return {
    ...session,
    workingChunks: session.savedChunks,
    isDirty: false,
  };
}
