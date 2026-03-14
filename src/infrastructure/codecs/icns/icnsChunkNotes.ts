import type { ParsedIcnsChunk, ParsedIcnsSlot } from './icnsTypes';

export function getIcnsChunkNote(
  type: string,
  payloadFamily: ParsedIcnsChunk['payloadFamily'],
  slot: ParsedIcnsSlot | null,
  isKnownType: boolean,
): string | null {
  if (payloadFamily === 'tableOfContents') {
    return 'Auxiliary table-of-contents chunk.';
  }

  if (slot && payloadFamily === 'png' && !slot.isCanonical) {
    return 'Recognized non-canonical ICNS slot outside the Apple app icon set.';
  }

  if (slot && payloadFamily === 'jpeg2000') {
    return 'Recognized JPEG 2000 payload. Decode support is not implemented yet.';
  }

  if (payloadFamily === 'legacyRgb') {
    return 'Recognized legacy packed RGB chunk family. Decode support is not implemented yet.';
  }

  if (payloadFamily === 'legacyArgb') {
    return 'Recognized legacy ARGB chunk family. Decode support is not implemented yet.';
  }

  if (payloadFamily === 'mask') {
    return 'Recognized legacy alpha-mask chunk family. Decode support is not implemented yet.';
  }

  if (slot && payloadFamily === 'unknown') {
    return 'Known ICNS slot with an unsupported payload signature.';
  }

  if (!slot && payloadFamily === 'png') {
    return 'PNG-backed chunk without a mapped semantic slot.';
  }

  if (!isKnownType) {
    return `Unknown ICNS chunk type "${type}".`;
  }

  return null;
}

export function shouldIncludeIcnsChunkInDiagnostics(
  payloadFamily: ParsedIcnsChunk['payloadFamily'],
  slot: ParsedIcnsSlot | null,
  isKnownType: boolean,
  note: string | null,
): boolean {
  if (!note) {
    return false;
  }

  if (payloadFamily === 'tableOfContents') {
    return false;
  }

  if (slot && payloadFamily === 'png') {
    return !slot.isCanonical;
  }

  return !isKnownType || payloadFamily !== 'png';
}
