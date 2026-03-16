/** Renderer-safe projection of a single ICO directory entry (no raw payload buffer). */
export interface IcoEntryDto {
  readonly id: string;
  readonly index: number;
  readonly width: number;
  readonly height: number;
  /** Number of palette colors (0 = no palette or ≥256 colors). */
  readonly colorCount: number;
  /** Color planes (typically 1). */
  readonly planes: number;
  /** Bits per pixel — determines color depth. */
  readonly bitCount: number;
  /** Payload size in bytes as declared in the ICO directory. */
  readonly bytesInRes: number;
  readonly payloadKind: 'png' | 'dib';
  readonly previewDataUrl: string | null;
}

export interface IcoProjectDto {
  readonly id: string;
  readonly format: 'ico';
  readonly name: string;
  readonly sourcePath: string | null;
  readonly importedAt: string;
  readonly isDirty: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly entryCount: number;
  readonly entries: readonly IcoEntryDto[];
}

export interface IcnsSlotIdentityDto {
  readonly label: string;
  readonly pointSize: number;
  readonly scale: 1 | 2;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly chunkType: string;
  readonly isCanonical: boolean;
}

export type IcnsPayloadFamilyDto =
  | 'png'
  | 'jpeg2000'
  | 'legacyRgb'
  | 'legacyArgb'
  | 'mask'
  | 'tableOfContents'
  | 'unknown';

/** Renderer-safe projection of a single ICNS chunk (no raw payload buffer). */
export interface IcnsChunkDto {
  readonly id: string;
  readonly index: number;
  readonly type: string;
  readonly offset: number;
  readonly byteLength: number;
  readonly payloadLength: number;
  readonly payloadFamily: IcnsPayloadFamilyDto;
  readonly isKnownType: boolean;
  readonly isImageChunk: boolean;
  readonly isSupported: boolean;
  readonly note: string | null;
  readonly slot: IcnsSlotIdentityDto | null;
  readonly previewDataUrl: string | null;
}

export interface IcnsProjectDto {
  readonly id: string;
  readonly format: 'icns';
  readonly name: string;
  readonly sourcePath: string | null;
  readonly importedAt: string;
  readonly isDirty: boolean;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly chunkCount: number;
  readonly imageChunkCount: number;
  readonly supportedSlotCount: number;
  readonly canonicalExportSlotCount: number;
  readonly diagnostics: readonly string[];
  readonly chunks: readonly IcnsChunkDto[];
}

export type IconProjectDto = IcoProjectDto | IcnsProjectDto;

export interface ExportIcoResultDto {
  readonly outputPath: string;
  readonly project: IcoProjectDto;
}

export interface ExportIcnsResultDto {
  readonly outputPath: string;
  readonly project: IcnsProjectDto;
}

export interface AddIcoEntryResultDto {
  readonly project: IcoProjectDto;
  readonly addedEntryId: string;
}

export interface AddIcnsSlotResultDto {
  readonly project: IcnsProjectDto;
  readonly addedChunkId: string;
}
