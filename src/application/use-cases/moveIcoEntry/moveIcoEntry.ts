import { InvalidIcoFileError } from '@infrastructure/codecs/ico/InvalidIcoFileError';

import type { IcoProjectSession } from '../importIco/importIcoProject';

export type IcoEntryMoveDirection = 'up' | 'down';

export function moveIcoEntry(
  session: IcoProjectSession,
  entryId: string,
  direction: IcoEntryMoveDirection,
): IcoProjectSession {
  const currentIndex = session.workingEntries.findIndex((entry) => {
    return entry.id === entryId;
  });

  if (currentIndex === -1) {
    throw new InvalidIcoFileError('The requested ICO entry was not found.');
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= session.workingEntries.length) {
    throw new InvalidIcoFileError(
      'The requested ICO entry move would exceed the container order boundaries.',
    );
  }

  const nextEntries = [...session.workingEntries];
  const [movedEntry] = nextEntries.splice(currentIndex, 1);

  if (!movedEntry) {
    throw new InvalidIcoFileError('The requested ICO entry was not found.');
  }

  nextEntries.splice(targetIndex, 0, movedEntry);

  return {
    ...session,
    workingEntries: nextEntries,
    isDirty: true,
  };
}
