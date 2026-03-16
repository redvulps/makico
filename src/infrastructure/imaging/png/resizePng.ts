import { nativeImage } from 'electron';

import { InvalidPngFileError } from './InvalidPngFileError';

/**
 * Resizes a PNG image to the specified dimensions using Electron's native image API.
 *
 * Uses the highest quality resampling available. Throws if the input buffer
 * cannot be decoded as a valid image.
 */
export function resizePng(
  pngBytes: Buffer,
  targetWidth: number,
  targetHeight: number,
): Buffer {
  const image = nativeImage.createFromBuffer(pngBytes);

  if (image.isEmpty()) {
    throw new InvalidPngFileError(
      'Failed to decode the source PNG image for resizing.',
    );
  }

  const resized = image.resize({
    width: targetWidth,
    height: targetHeight,
    quality: 'best',
  });

  return resized.toPNG();
}
