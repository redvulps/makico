export type IcoPayloadKind = 'png' | 'dib';

export interface ParsedIcoEntry {
  readonly id: string;
  readonly index: number;
  readonly width: number;
  readonly height: number;
  readonly colorCount: number;
  readonly planes: number;
  readonly bitCount: number;
  readonly bytesInRes: number;
  readonly imageOffset: number;
  readonly payloadKind: IcoPayloadKind;
  readonly payload: Buffer;
  readonly previewDataUrl: string | null;
}

export interface ParsedIcoFile {
  readonly entries: readonly ParsedIcoEntry[];
}
