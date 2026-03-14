const CRC_TABLE = createCrcTable();

export function crc32(buffer: Uint8Array): number {
  let crc = 0xffffffff;

  for (const value of buffer) {
    const tableIndex = (crc ^ value) & 0xff;
    const tableValue = CRC_TABLE[tableIndex];

    if (tableValue === undefined) {
      throw new Error('CRC32 table lookup failed.');
    }

    crc = tableValue ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function createCrcTable(): Uint32Array {
  const table = new Uint32Array(256);

  for (let index = 0; index < table.length; index += 1) {
    let current = index;

    for (let bit = 0; bit < 8; bit += 1) {
      current =
        (current & 1) === 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1;
    }

    table[index] = current >>> 0;
  }

  return table;
}
