import { decodeIcoDib } from './decodeIcoDib';
import { InvalidIcoFileError } from './InvalidIcoFileError';
import type { IcoPayloadKind, ParsedIcoEntry, ParsedIcoFile } from './icoTypes';

const ICO_HEADER_SIZE = 6;
const ICO_DIRECTORY_ENTRY_SIZE = 16;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export function parseIcoBuffer(buffer: Buffer): ParsedIcoFile {
  if (buffer.byteLength < ICO_HEADER_SIZE) {
    throw new InvalidIcoFileError(
      'The ICO file is smaller than the ICONDIR header.',
    );
  }

  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );
  const reserved = view.getUint16(0, true);
  const type = view.getUint16(2, true);
  const count = view.getUint16(4, true);

  if (reserved !== 0) {
    throw new InvalidIcoFileError('ICONDIR.reserved must be 0.');
  }

  if (type !== 1) {
    throw new InvalidIcoFileError(
      'Only icon containers with type 1 are supported.',
    );
  }

  if (count === 0) {
    throw new InvalidIcoFileError('The ICO file does not contain any entries.');
  }

  const directorySize = ICO_HEADER_SIZE + count * ICO_DIRECTORY_ENTRY_SIZE;

  if (buffer.byteLength < directorySize) {
    throw new InvalidIcoFileError('The ICO directory table is truncated.');
  }

  const entries: ParsedIcoEntry[] = [];

  for (let index = 0; index < count; index += 1) {
    const entryOffset = ICO_HEADER_SIZE + index * ICO_DIRECTORY_ENTRY_SIZE;
    const rawWidth = view.getUint8(entryOffset);
    const rawHeight = view.getUint8(entryOffset + 1);
    const colorCount = view.getUint8(entryOffset + 2);
    const entryReserved = view.getUint8(entryOffset + 3);
    const planes = view.getUint16(entryOffset + 4, true);
    const bitCount = view.getUint16(entryOffset + 6, true);
    const bytesInRes = view.getUint32(entryOffset + 8, true);
    const imageOffset = view.getUint32(entryOffset + 12, true);

    if (entryReserved !== 0) {
      throw new InvalidIcoFileError(
        `Entry ${index} has a non-zero reserved byte.`,
      );
    }

    if (bytesInRes === 0) {
      throw new InvalidIcoFileError(`Entry ${index} has an empty payload.`);
    }

    const imageEnd = imageOffset + bytesInRes;

    if (imageEnd > buffer.byteLength) {
      throw new InvalidIcoFileError(
        `Entry ${index} points outside the ICO file boundary.`,
      );
    }

    const payload = buffer.subarray(imageOffset, imageEnd);
    const payloadKind = detectPayloadKind(payload);
    const normalizedWidth = normalizeDimension(rawWidth);
    const normalizedHeight = normalizeDimension(rawHeight);
    const dibMetadata =
      payloadKind === 'dib'
        ? decodeIcoDib(payload, normalizedWidth, normalizedHeight)
        : null;

    entries.push({
      id: `ico-entry-${index}`,
      index,
      width: dibMetadata?.width ?? normalizedWidth,
      height: dibMetadata?.height ?? normalizedHeight,
      colorCount,
      planes: dibMetadata?.planes ?? planes,
      bitCount: dibMetadata?.bitCount ?? bitCount,
      bytesInRes,
      imageOffset,
      payloadKind,
      payload,
      previewDataUrl: createPreviewDataUrl(payload, payloadKind, dibMetadata),
    });
  }

  assertNonOverlappingRanges(entries);

  return { entries };
}

function normalizeDimension(value: number): number {
  return value === 0 ? 256 : value;
}

function detectPayloadKind(payload: Buffer): IcoPayloadKind {
  if (
    payload.length >= PNG_SIGNATURE.length &&
    payload.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    return 'png';
  }

  return 'dib';
}

function createPreviewDataUrl(
  payload: Buffer,
  payloadKind: IcoPayloadKind,
  dibMetadata: { readonly previewDataUrl: string | null } | null,
): string | null {
  if (payloadKind === 'png') {
    return `data:image/png;base64,${payload.toString('base64')}`;
  }

  return dibMetadata?.previewDataUrl ?? null;
}

function assertNonOverlappingRanges(entries: readonly ParsedIcoEntry[]): void {
  const sortedRanges = [...entries].sort(
    (left, right) => left.imageOffset - right.imageOffset,
  );

  for (let index = 1; index < sortedRanges.length; index += 1) {
    const previousEntry = sortedRanges[index - 1];
    const currentEntry = sortedRanges[index];

    if (!previousEntry || !currentEntry) {
      continue;
    }

    const previousEnd = previousEntry.imageOffset + previousEntry.bytesInRes;

    if (currentEntry.imageOffset < previousEnd) {
      throw new InvalidIcoFileError(
        'Two ICO entries overlap in the source file.',
      );
    }
  }
}
