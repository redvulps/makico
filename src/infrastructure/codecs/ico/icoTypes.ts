export type IcoPayloadKind = 'png' | 'dib';

export interface ParsedIcoEntry {
  readonly id: string;
  readonly index: number;
  readonly width: number;
  readonly height: number;
  /** Number of colors in the palette (0 means no palette or ≥256 colors). */
  readonly colorCount: number;
  /** Number of color planes. Typically 1 for ICO entries. */
  readonly planes: number;
  /** Bits per pixel (e.g. 1, 4, 8, 24, 32). Determines color depth. */
  readonly bitCount: number;
  /** Size of the image payload in bytes as declared in the ICO directory. */
  readonly bytesInRes: number;
  /** Byte offset of the image payload within the original ICO file. */
  readonly imageOffset: number;
  /** Whether the payload is a full PNG file or a raw Device-Independent Bitmap. */
  readonly payloadKind: IcoPayloadKind;
  readonly payload: Buffer;
  readonly previewDataUrl: string | null;
}

export interface ParsedIcoFile {
  readonly entries: readonly ParsedIcoEntry[];
}
