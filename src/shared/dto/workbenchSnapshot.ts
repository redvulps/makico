export interface FormatTrackDto {
  readonly format: 'ico' | 'icns';
  readonly title: string;
  readonly emphasis: string;
  readonly bullets: readonly string[];
  readonly exportTargets: readonly string[];
}

export interface IcnsSlotDto {
  readonly label: string;
  readonly chunkType: string;
  readonly pixels: number;
}

export interface WorkbenchSnapshotDto {
  readonly title: string;
  readonly phaseLabel: string;
  readonly summary: string;
  readonly principles: readonly string[];
  readonly pipeline: readonly string[];
  readonly nextSlices: readonly string[];
  readonly previewSizes: readonly number[];
  readonly formatTracks: readonly FormatTrackDto[];
  readonly icnsSlots: readonly IcnsSlotDto[];
}
