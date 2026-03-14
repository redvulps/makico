import type { IcoProjectSession } from '../importIco/importIcoProject';

export function resetIcoProject(session: IcoProjectSession): IcoProjectSession {
  return {
    ...session,
    workingEntries: session.savedEntries,
    isDirty: false,
  };
}
