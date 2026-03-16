export type IcnsPayloadFamily =
  | 'png'
  | 'jpeg2000'
  | 'legacyRgb'
  | 'legacyArgb'
  | 'mask'
  | 'tableOfContents'
  | 'unknown';

/** A slot in the ICNS format's fixed size matrix (e.g. 32x32@2x). */
export interface ParsedIcnsSlot {
  /** Human-readable label like "32x32@2x". */
  readonly label: string;
  /** Logical point size (before Retina scaling). */
  readonly pointSize: number;
  /** 1 for standard, 2 for Retina. */
  readonly scale: 1 | 2;
  /** Actual pixel width (pointSize × scale). */
  readonly pixelWidth: number;
  /** Actual pixel height (pointSize × scale). */
  readonly pixelHeight: number;
  /** Four-character ICNS OSType code (e.g. "ic10", "icp4"). */
  readonly chunkType: string;
  /** Whether this slot is part of the standard macOS icon set. */
  readonly isCanonical: boolean;
}

/** A single parsed chunk from an ICNS container. */
export interface ParsedIcnsChunk {
  readonly id: string;
  readonly index: number;
  /** Four-character OSType code identifying the chunk. */
  readonly type: string;
  /** Byte offset of this chunk within the ICNS file. */
  readonly offset: number;
  /** Total chunk size including the 8-byte header. */
  readonly byteLength: number;
  /** Payload size excluding the 8-byte header. */
  readonly payloadLength: number;
  /** Detected encoding family of the payload data. */
  readonly payloadFamily: IcnsPayloadFamily;
  /** Whether this chunk type is recognized by the parser. */
  readonly isKnownType: boolean;
  /** Whether this chunk contains image data (as opposed to metadata like TOC). */
  readonly isImageChunk: boolean;
  /** Whether this chunk can be edited — true only for PNG chunks with a known slot. */
  readonly isSupported: boolean;
  /** Optional diagnostic note (e.g. unsupported format warnings). */
  readonly note: string | null;
  /** Whether diagnostic notes for this chunk should surface in the UI. */
  readonly includeInDiagnostics: boolean;
  /** The size-slot this chunk maps to, if it matches a known ICNS slot definition. */
  readonly slot: ParsedIcnsSlot | null;
  readonly previewDataUrl: string | null;
  readonly payload: Buffer;
}

export interface ParsedIcnsFile {
  readonly declaredFileLength: number;
  readonly chunks: readonly ParsedIcnsChunk[];
  readonly containerDiagnostics: readonly string[];
}
