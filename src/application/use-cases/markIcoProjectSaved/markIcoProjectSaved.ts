import path from 'node:path';

import type { IcoProjectSession } from '../importIco/importIcoProject';

export function markIcoProjectSaved(
  session: IcoProjectSession,
  outputPath: string,
): IcoProjectSession {
  return {
    ...session,
    name: path.basename(outputPath),
    sourcePath: outputPath,
    savedEntries: session.workingEntries,
    isDirty: false,
  };
}
