export type IcnsPayloadFamily =
  | 'png'
  | 'jpeg2000'
  | 'legacyRgb'
  | 'legacyArgb'
  | 'mask'
  | 'tableOfContents'
  | 'unknown';

export interface ParsedIcnsSlot {
  readonly label: string;
  readonly pointSize: number;
  readonly scale: 1 | 2;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly chunkType: string;
  readonly isCanonical: boolean;
}

export interface ParsedIcnsChunk {
  readonly id: string;
  readonly index: number;
  readonly type: string;
  readonly offset: number;
  readonly byteLength: number;
  readonly payloadLength: number;
  readonly payloadFamily: IcnsPayloadFamily;
  readonly isKnownType: boolean;
  readonly isImageChunk: boolean;
  readonly isSupported: boolean;
  readonly note: string | null;
  readonly includeInDiagnostics: boolean;
  readonly slot: ParsedIcnsSlot | null;
  readonly previewDataUrl: string | null;
  readonly payload: Buffer;
}

export interface ParsedIcnsFile {
  readonly declaredFileLength: number;
  readonly chunks: readonly ParsedIcnsChunk[];
  readonly containerDiagnostics: readonly string[];
}
