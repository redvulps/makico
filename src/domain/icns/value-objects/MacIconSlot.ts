/** A slot in the macOS ICNS icon set, identified by point size and Retina scale factor. */
export interface MacIconSlot {
  readonly pointSize: number;
  readonly scale: 1 | 2;
  readonly pixelSize: number;
  readonly chunkType: string;
}
