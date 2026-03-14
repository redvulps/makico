import type { IconProject } from '@domain/icon-project/entities/IconProject';
import type { MacIconSlot } from '@domain/icns/value-objects/MacIconSlot';
import type { WorkbenchSnapshotDto } from '@shared/dto/workbenchSnapshot';

const project: IconProject = {
  id: 'initial-workbench',
  title: 'Makico workbench scaffold',
  supportedFormats: ['ico', 'icns'],
  previewSizes: [16, 24, 32, 48, 64, 128, 256, 512, 1024],
};

const icnsSlots: readonly MacIconSlot[] = [
  { pointSize: 16, scale: 1, pixelSize: 16, chunkType: 'icp4' },
  { pointSize: 16, scale: 2, pixelSize: 32, chunkType: 'ic11' },
  { pointSize: 32, scale: 1, pixelSize: 32, chunkType: 'icp5' },
  { pointSize: 32, scale: 2, pixelSize: 64, chunkType: 'ic12' },
  { pointSize: 128, scale: 1, pixelSize: 128, chunkType: 'ic07' },
  { pointSize: 128, scale: 2, pixelSize: 256, chunkType: 'ic13' },
  { pointSize: 256, scale: 1, pixelSize: 256, chunkType: 'ic08' },
  { pointSize: 256, scale: 2, pixelSize: 512, chunkType: 'ic14' },
  { pointSize: 512, scale: 1, pixelSize: 512, chunkType: 'ic09' },
  { pointSize: 512, scale: 2, pixelSize: 1024, chunkType: 'ic10' },
];

export function getWorkbenchSnapshot(): WorkbenchSnapshotDto {
  return {
    title: project.title,
    phaseLabel: 'ICO editing + ICNS slot editing + window guards',
    summary:
      'Cross-platform Electron shell with typed IPC, a real ICO editor path with order control, ICNS slot replacement plus canonical export, and main-process unsaved-change guards for destructive transitions.',
    principles: [
      'TypeScript-only source under src/',
      'No iconutil or OS-bound converters',
      'In-repo ICO and ICNS codecs',
      'Format logic isolated by container',
    ],
    pipeline: [
      'Load source bytes through the main process',
      'Validate container headers and boundaries inside format-specific codecs',
      'Map parsed entries or chunks into renderer-safe DTOs',
      'Keep raw working sessions in main-process memory',
      'Expose only typed workflow actions through preload',
      'Let the renderer stay focused on inspection and editing state',
    ],
    nextSlices: [
      'ICNS JPEG 2000 and legacy-family compatibility paths',
      'Desktop menu and drag-drop import flows',
      'Codec-focused automated fixture coverage',
      'Normalized image project model shared across ICO and ICNS editors',
    ],
    previewSizes: project.previewSizes,
    formatTracks: [
      {
        format: 'ico',
        title: 'Windows icon container',
        emphasis:
          'Little-endian directory table with a real parser, editor flow, and writer now wired into the Electron app.',
        bullets: [
          'Validate ICONDIR header and entry offsets before decoding.',
          'Render PNG-backed entry previews immediately in the renderer.',
          'Render common uncompressed DIB previews while preserving round-trip export.',
        ],
        exportTargets: ['16', '24', '32', '48', '256'],
      },
      {
        format: 'icns',
        title: 'macOS icon family container',
        emphasis:
          'Big-endian chunk stream with semantic slot identity, canonical export, and slot-mapped PNG replacement now online.',
        bullets: [
          'Preserve slot identity instead of flattening everything by pixel size.',
          'Preview PNG-backed modern chunks directly in the renderer.',
          'Replace slot-mapped chunks with validated PNG inputs while keeping legacy families visible as diagnostics.',
        ],
        exportTargets: [
          'icp4',
          'ic11',
          'icp5',
          'ic12',
          'ic07',
          'ic13',
          'ic08',
          'ic14',
          'ic09',
          'ic10',
        ],
      },
    ],
    icnsSlots: icnsSlots.map((slot) => ({
      label: `${slot.pointSize}x${slot.pointSize}@${slot.scale}x`,
      chunkType: slot.chunkType,
      pixels: slot.pixelSize,
    })),
  };
}
