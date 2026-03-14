import { createPngIcoEntry } from '@infrastructure/codecs/ico/createPngIcoEntry';
import { InvalidIcoFileError } from '@infrastructure/codecs/ico/InvalidIcoFileError';

import type { IcoProjectSession } from '../importIco/importIcoProject';

export function replaceIcoEntryWithPng(
  session: IcoProjectSession,
  entryId: string,
  pngBytes: Buffer,
): IcoProjectSession {
  let didReplace = false;

  const nextEntries = session.workingEntries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }

    didReplace = true;

    return createPngIcoEntry(entry.id, pngBytes);
  });

  if (!didReplace) {
    throw new InvalidIcoFileError('The requested ICO entry was not found.');
  }

  return {
    ...session,
    workingEntries: nextEntries,
    isDirty: true,
  };
}
