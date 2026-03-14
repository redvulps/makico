import type { ParsedIcnsChunk } from './icnsTypes';

export function deriveIcnsDiagnostics(
  containerDiagnostics: readonly string[],
  chunks: readonly ParsedIcnsChunk[],
): readonly string[] {
  return [
    ...containerDiagnostics,
    ...chunks.flatMap((chunk) => {
      if (!chunk.includeInDiagnostics || !chunk.note) {
        return [];
      }

      return [`Chunk ${chunk.index + 1} (${chunk.type}): ${chunk.note}`];
    }),
  ];
}
