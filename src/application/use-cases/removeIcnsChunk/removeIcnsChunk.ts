import { InvalidIcnsFileError } from '@infrastructure/codecs/icns/InvalidIcnsFileError';

import type { IcnsProjectSession } from '../importIcns/importIcnsProject';

export function removeIcnsChunk(
  session: IcnsProjectSession,
  chunkId: string,
): IcnsProjectSession {
  const nextChunks = session.workingChunks.filter(
    (chunk) => chunk.id !== chunkId,
  );

  if (nextChunks.length === session.workingChunks.length) {
    throw new InvalidIcnsFileError('The requested ICNS chunk was not found.');
  }

  return {
    ...session,
    workingChunks: nextChunks.map((chunk, index) => ({
      ...chunk,
      index,
    })),
    isDirty: true,
  };
}
