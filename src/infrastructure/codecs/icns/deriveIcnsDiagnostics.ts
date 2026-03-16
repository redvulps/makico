import type { ParsedIcnsChunk } from './icnsTypes';

/**
 * Combines container-level diagnostics with per-chunk notes into a flat list
 * of human-readable warning strings for display in the UI.
 */
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
