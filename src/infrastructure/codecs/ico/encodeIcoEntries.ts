import { InvalidIcoFileError } from './InvalidIcoFileError';
import type { ParsedIcoEntry } from './icoTypes';

const ICO_HEADER_SIZE = 6;
const ICO_DIRECTORY_ENTRY_SIZE = 16;

/**
 * Serializes parsed ICO entries back into a valid ICO file buffer.
 *
 * Writes the ICONDIR header, builds the directory table with recalculated
 * offsets, and appends each entry's payload contiguously.
 */
export function encodeIcoEntries(entries: readonly ParsedIcoEntry[]): Buffer {
  if (entries.length === 0) {
    throw new InvalidIcoFileError(
      'Cannot encode an ICO file without any entries.',
    );
  }

  const directorySize =
    ICO_HEADER_SIZE + entries.length * ICO_DIRECTORY_ENTRY_SIZE;
  const payloadSize = entries.reduce(
    (total, entry) => total + entry.payload.length,
    0,
  );
  const output = Buffer.allocUnsafe(directorySize + payloadSize);

  output.writeUInt16LE(0, 0);
  output.writeUInt16LE(1, 2);
  output.writeUInt16LE(entries.length, 4);

  let payloadOffset = directorySize;

  entries.forEach((entry, index) => {
    const directoryOffset = ICO_HEADER_SIZE + index * ICO_DIRECTORY_ENTRY_SIZE;

    output.writeUInt8(encodeDimension(entry.width), directoryOffset);
    output.writeUInt8(encodeDimension(entry.height), directoryOffset + 1);
    output.writeUInt8(entry.colorCount, directoryOffset + 2);
    output.writeUInt8(0, directoryOffset + 3);
    output.writeUInt16LE(entry.planes, directoryOffset + 4);
    output.writeUInt16LE(entry.bitCount, directoryOffset + 6);
    output.writeUInt32LE(entry.payload.length, directoryOffset + 8);
    output.writeUInt32LE(payloadOffset, directoryOffset + 12);

    entry.payload.copy(output, payloadOffset);
    payloadOffset += entry.payload.length;
  });

  return output;
}

function encodeDimension(value: number): number {
  if (value === 256) {
    return 0;
  }

  if (value < 1 || value > 255) {
    throw new InvalidIcoFileError(
      `ICO dimensions must be between 1 and 256. Received ${value}.`,
    );
  }

  return value;
}
