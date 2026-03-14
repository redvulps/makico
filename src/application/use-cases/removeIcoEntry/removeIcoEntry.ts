import { InvalidIcoFileError } from '@infrastructure/codecs/ico/InvalidIcoFileError';

import type { IcoProjectSession } from '../importIco/importIcoProject';

export function removeIcoEntry(
  session: IcoProjectSession,
  entryId: string,
): IcoProjectSession {
  if (session.workingEntries.length <= 1) {
    throw new InvalidIcoFileError(
      'An ICO project must retain at least one entry.',
    );
  }

  const nextEntries = session.workingEntries.filter(
    (entry) => entry.id !== entryId,
  );

  if (nextEntries.length === session.workingEntries.length) {
    throw new InvalidIcoFileError('The requested ICO entry was not found.');
  }

  return {
    ...session,
    workingEntries: nextEntries,
    isDirty: true,
  };
}
