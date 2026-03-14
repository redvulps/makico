import { createPngIcoEntry } from '@infrastructure/codecs/ico/createPngIcoEntry';
import { InvalidIcoFileError } from '@infrastructure/codecs/ico/InvalidIcoFileError';

import type { IcoProjectSession } from '../importIco/importIcoProject';

export function addIcoEntryFromPng(
  session: IcoProjectSession,
  entryId: string,
  pngBytes: Buffer,
  afterEntryId: string | null,
): IcoProjectSession {
  const nextEntry = createPngIcoEntry(entryId, pngBytes);

  if (afterEntryId === null) {
    return {
      ...session,
      workingEntries: [...session.workingEntries, nextEntry],
      isDirty: true,
    };
  }

  const insertAfterIndex = session.workingEntries.findIndex((entry) => {
    return entry.id === afterEntryId;
  });

  if (insertAfterIndex === -1) {
    throw new InvalidIcoFileError(
      'The requested insertion point for the new ICO entry was not found.',
    );
  }

  const nextEntries = [...session.workingEntries];
  nextEntries.splice(insertAfterIndex + 1, 0, nextEntry);

  return {
    ...session,
    workingEntries: nextEntries,
    isDirty: true,
  };
}
