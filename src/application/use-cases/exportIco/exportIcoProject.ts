import { encodeIcoEntries } from '@infrastructure/codecs/ico/encodeIcoEntries';

import type { IcoProjectSession } from '../importIco/importIcoProject';

export function exportIcoProject(session: IcoProjectSession): Buffer {
  return encodeIcoEntries(session.workingEntries);
}
