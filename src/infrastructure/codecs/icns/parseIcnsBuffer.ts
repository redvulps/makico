import { getIcnsSlotByChunkType, getKnownIcnsChunkTypes } from './icnsSlotMap';
import {
  getIcnsChunkNote,
  shouldIncludeIcnsChunkInDiagnostics,
} from './icnsChunkNotes';
import { InvalidIcnsFileError } from './InvalidIcnsFileError';
import type {
  IcnsPayloadFamily,
  ParsedIcnsChunk,
  ParsedIcnsFile,
} from './icnsTypes';

const ICNS_HEADER_SIZE = 8;
const ICNS_CHUNK_HEADER_SIZE = 8;
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const JPEG2000_SIGNATURE = Buffer.from([
  0x00, 0x00, 0x00, 0x0c, 0x6a, 0x50, 0x20, 0x20, 0x0d, 0x0a, 0x87, 0x0a,
]);
const JPEG2000_CODESTREAM_SIGNATURE = Buffer.from([0xff, 0x4f, 0xff, 0x51]);
const LEGACY_RGB_CHUNK_TYPES = new Set(['is32', 'il32', 'ih32', 'it32']);
const LEGACY_ARGB_CHUNK_TYPES = new Set(['ARGB']);
const MASK_CHUNK_TYPES = new Set(['s8mk', 'l8mk', 'h8mk', 't8mk']);
const AUXILIARY_CHUNK_TYPES = new Set(['TOC ']);
const KNOWN_CHUNK_TYPES = new Set([
  ...getKnownIcnsChunkTypes(),
  ...LEGACY_RGB_CHUNK_TYPES,
  ...LEGACY_ARGB_CHUNK_TYPES,
  ...MASK_CHUNK_TYPES,
  ...AUXILIARY_CHUNK_TYPES,
]);

/**
 * Parses a raw ICNS file buffer into structured chunk metadata.
 *
 * Validates the "icns" magic header, iterates through each chunk, classifies
 * the payload family (PNG, JPEG 2000, legacy RGB, mask, etc.), maps known
 * chunk types to their slot definitions, and generates PNG previews where possible.
 */
export function parseIcnsBuffer(buffer: Buffer): ParsedIcnsFile {
  if (buffer.byteLength < ICNS_HEADER_SIZE) {
    throw new InvalidIcnsFileError(
      'The ICNS file is smaller than the required header.',
    );
  }

  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  );
  const magic = buffer.subarray(0, 4).toString('ascii');
  const declaredFileLength = view.getUint32(4, false);

  if (magic !== 'icns') {
    throw new InvalidIcnsFileError('The ICNS header magic must be "icns".');
  }

  if (declaredFileLength < ICNS_HEADER_SIZE) {
    throw new InvalidIcnsFileError(
      'The ICNS declared file length is smaller than the header.',
    );
  }

  if (declaredFileLength > buffer.byteLength) {
    throw new InvalidIcnsFileError(
      'The ICNS declared file length extends past the available bytes.',
    );
  }

  const diagnostics: string[] = [];

  if (declaredFileLength < buffer.byteLength) {
    diagnostics.push(
      'The file contains trailing bytes past the declared ICNS length. The parser ignored the extra bytes.',
    );
  }

  const chunks: ParsedIcnsChunk[] = [];
  let offset = ICNS_HEADER_SIZE;
  let index = 0;

  while (offset < declaredFileLength) {
    if (offset + ICNS_CHUNK_HEADER_SIZE > declaredFileLength) {
      throw new InvalidIcnsFileError(
        'The ICNS chunk header is truncated at the end of the file.',
      );
    }

    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    const byteLength = view.getUint32(offset + 4, false);

    if (byteLength < ICNS_CHUNK_HEADER_SIZE) {
      throw new InvalidIcnsFileError(
        `Chunk ${index + 1} (${type}) declares an invalid length smaller than 8 bytes.`,
      );
    }

    const chunkEnd = offset + byteLength;

    if (chunkEnd > declaredFileLength) {
      throw new InvalidIcnsFileError(
        `Chunk ${index + 1} (${type}) extends past the declared ICNS file length.`,
      );
    }

    const payload = buffer.subarray(offset + ICNS_CHUNK_HEADER_SIZE, chunkEnd);
    const slot = getIcnsSlotByChunkType(type);
    const payloadFamily = classifyPayloadFamily(type, payload);
    const isKnownType = KNOWN_CHUNK_TYPES.has(type);
    const isImageChunk = isImagePayloadFamily(payloadFamily) || slot !== null;
    const isSupported = payloadFamily === 'png' && slot !== null;
    const note = getIcnsChunkNote(type, payloadFamily, slot, isKnownType);
    const includeInDiagnostics = shouldIncludeIcnsChunkInDiagnostics(
      payloadFamily,
      slot,
      isKnownType,
      note,
    );

    chunks.push({
      id: `icns-chunk-${index}`,
      index,
      type,
      offset,
      byteLength,
      payloadLength: payload.byteLength,
      payloadFamily,
      isKnownType,
      isImageChunk,
      isSupported,
      note,
      includeInDiagnostics,
      slot,
      previewDataUrl: createPreviewDataUrl(payload, payloadFamily),
      payload,
    });

    offset = chunkEnd;
    index += 1;
  }

  if (chunks.length === 0) {
    throw new InvalidIcnsFileError(
      'The ICNS file does not contain any chunk elements.',
    );
  }

  return {
    declaredFileLength,
    chunks,
    containerDiagnostics: diagnostics,
  };
}

function classifyPayloadFamily(
  type: string,
  payload: Buffer,
): IcnsPayloadFamily {
  if (AUXILIARY_CHUNK_TYPES.has(type)) {
    return 'tableOfContents';
  }

  if (LEGACY_RGB_CHUNK_TYPES.has(type)) {
    return 'legacyRgb';
  }

  if (LEGACY_ARGB_CHUNK_TYPES.has(type)) {
    return 'legacyArgb';
  }

  if (MASK_CHUNK_TYPES.has(type)) {
    return 'mask';
  }

  if (hasSignature(payload, PNG_SIGNATURE)) {
    return 'png';
  }

  if (
    hasSignature(payload, JPEG2000_SIGNATURE) ||
    hasSignature(payload, JPEG2000_CODESTREAM_SIGNATURE)
  ) {
    return 'jpeg2000';
  }

  return 'unknown';
}

function hasSignature(payload: Buffer, signature: Buffer): boolean {
  return (
    payload.byteLength >= signature.byteLength &&
    payload.subarray(0, signature.byteLength).equals(signature)
  );
}

function isImagePayloadFamily(payloadFamily: IcnsPayloadFamily): boolean {
  return (
    payloadFamily === 'png' ||
    payloadFamily === 'jpeg2000' ||
    payloadFamily === 'legacyRgb' ||
    payloadFamily === 'legacyArgb' ||
    payloadFamily === 'mask'
  );
}

function createPreviewDataUrl(
  payload: Buffer,
  payloadFamily: IcnsPayloadFamily,
): string | null {
  if (payloadFamily !== 'png') {
    return null;
  }

  return `data:image/png;base64,${payload.toString('base64')}`;
}
