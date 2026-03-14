import { createTransparentPng } from '@infrastructure/imaging/png/createTransparentPng';

import type { IcoProjectSession } from '../importIco/importIcoProject';
import { addIcoEntryFromPng } from '../addIcoEntryFromPng/addIcoEntryFromPng';

export function addBlankIcoEntry(
  session: IcoProjectSession,
  entryId: string,
  size: number,
  afterEntryId: string | null,
): IcoProjectSession {
  const pngBytes = createTransparentPng(size, size);

  return addIcoEntryFromPng(session, entryId, pngBytes, afterEntryId);
}
