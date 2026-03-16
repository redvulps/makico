export interface EncodableIcnsChunk {
  readonly type: string;
  readonly payload: Buffer;
}

const ICNS_HEADER_SIZE = 8;
const ICNS_CHUNK_HEADER_SIZE = 8;

/**
 * Serializes ICNS chunks into a valid ICNS container buffer.
 *
 * Writes the "icns" magic header with the total file length, then appends
 * each chunk with its 8-byte header (type + length) followed by the payload.
 */
export function encodeIcnsChunks(
  chunks: readonly EncodableIcnsChunk[],
): Buffer {
  const totalByteLength = chunks.reduce((total, chunk) => {
    return total + ICNS_CHUNK_HEADER_SIZE + chunk.payload.byteLength;
  }, ICNS_HEADER_SIZE);
  const buffer = Buffer.alloc(totalByteLength);

  buffer.write('icns', 0, 4, 'ascii');
  buffer.writeUInt32BE(totalByteLength, 4);

  let offset = ICNS_HEADER_SIZE;

  for (const chunk of chunks) {
    buffer.write(chunk.type, offset, 4, 'ascii');
    buffer.writeUInt32BE(
      ICNS_CHUNK_HEADER_SIZE + chunk.payload.byteLength,
      offset + 4,
    );

    chunk.payload.copy(buffer, offset + ICNS_CHUNK_HEADER_SIZE);
    offset += ICNS_CHUNK_HEADER_SIZE + chunk.payload.byteLength;
  }

  return buffer;
}
