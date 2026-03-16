import type { ParsedIcnsSlot } from './icnsTypes';

/**
 * The complete set of PNG-era ICNS slot definitions recognized by macOS.
 *
 * Each entry maps a four-character OSType to its logical point size, Retina scale,
 * and pixel dimensions. Slots marked `isCanonical` form the standard 10-size icon set
 * expected by macOS (16pt through 512pt at 1x and 2x). The non-canonical 64x64@1x
 * slot (icp6) exists in the spec but is rarely used in practice.
 */
const slotDefinitions: readonly ParsedIcnsSlot[] = [
  {
    label: '16x16@1x',
    pointSize: 16,
    scale: 1,
    pixelWidth: 16,
    pixelHeight: 16,
    chunkType: 'icp4',
    isCanonical: true,
  },
  {
    label: '16x16@2x',
    pointSize: 16,
    scale: 2,
    pixelWidth: 32,
    pixelHeight: 32,
    chunkType: 'ic11',
    isCanonical: true,
  },
  {
    label: '32x32@1x',
    pointSize: 32,
    scale: 1,
    pixelWidth: 32,
    pixelHeight: 32,
    chunkType: 'icp5',
    isCanonical: true,
  },
  {
    label: '32x32@2x',
    pointSize: 32,
    scale: 2,
    pixelWidth: 64,
    pixelHeight: 64,
    chunkType: 'ic12',
    isCanonical: true,
  },
  {
    label: '64x64@1x',
    pointSize: 64,
    scale: 1,
    pixelWidth: 64,
    pixelHeight: 64,
    chunkType: 'icp6',
    isCanonical: false,
  },
  {
    label: '128x128@1x',
    pointSize: 128,
    scale: 1,
    pixelWidth: 128,
    pixelHeight: 128,
    chunkType: 'ic07',
    isCanonical: true,
  },
  {
    label: '128x128@2x',
    pointSize: 128,
    scale: 2,
    pixelWidth: 256,
    pixelHeight: 256,
    chunkType: 'ic13',
    isCanonical: true,
  },
  {
    label: '256x256@1x',
    pointSize: 256,
    scale: 1,
    pixelWidth: 256,
    pixelHeight: 256,
    chunkType: 'ic08',
    isCanonical: true,
  },
  {
    label: '256x256@2x',
    pointSize: 256,
    scale: 2,
    pixelWidth: 512,
    pixelHeight: 512,
    chunkType: 'ic14',
    isCanonical: true,
  },
  {
    label: '512x512@1x',
    pointSize: 512,
    scale: 1,
    pixelWidth: 512,
    pixelHeight: 512,
    chunkType: 'ic09',
    isCanonical: true,
  },
  {
    label: '512x512@2x',
    pointSize: 512,
    scale: 2,
    pixelWidth: 1024,
    pixelHeight: 1024,
    chunkType: 'ic10',
    isCanonical: true,
  },
] as const;

const slotByChunkType = new Map(
  slotDefinitions.map((slot) => [slot.chunkType, slot] as const),
);

export function getIcnsSlotByChunkType(
  chunkType: string,
): ParsedIcnsSlot | null {
  return slotByChunkType.get(chunkType) ?? null;
}

export function getKnownIcnsChunkTypes(): readonly string[] {
  return slotDefinitions.map((slot) => slot.chunkType);
}

export function getCanonicalIcnsSlots(): readonly ParsedIcnsSlot[] {
  return slotDefinitions.filter((slot) => slot.isCanonical);
}
