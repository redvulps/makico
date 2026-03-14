import path from 'node:path';

import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

export function markIcnsProjectSaved(
  session: IcnsProjectSession,
  outputPath: string,
): IcnsProjectSession {
  return {
    ...session,
    name: path.basename(outputPath),
    sourcePath: outputPath,
    savedChunks: session.workingChunks,
    isDirty: false,
  };
}
