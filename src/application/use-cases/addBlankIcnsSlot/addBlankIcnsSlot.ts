import { IcnsExportError } from '@infrastructure/codecs/icns/IcnsExportError';
import { getIcnsSlotByChunkType } from '@infrastructure/codecs/icns/icnsSlotMap';
import { createTransparentPng } from '@infrastructure/imaging/png/createTransparentPng';

import type { IcnsProjectSession } from '../importIcns/importIcnsProject';
import { addIcnsSlotFromPng } from '../addIcnsSlotFromPng/addIcnsSlotFromPng';

export function addBlankIcnsSlot(
  session: IcnsProjectSession,
  chunkId: string,
  chunkType: string,
): IcnsProjectSession {
  const slot = getIcnsSlotByChunkType(chunkType);

  if (!slot?.isCanonical) {
    throw new IcnsExportError(
      'Only canonical Apple ICNS slots can be created through this workflow.',
    );
  }

  const pngBytes = createTransparentPng(slot.pixelWidth, slot.pixelHeight);

  return addIcnsSlotFromPng(session, chunkId, chunkType, pngBytes);
}
