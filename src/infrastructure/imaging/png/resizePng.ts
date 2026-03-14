import { nativeImage } from 'electron';

export function resizePng(
  pngBytes: Buffer,
  targetWidth: number,
  targetHeight: number,
): Buffer {
  const image = nativeImage.createFromBuffer(pngBytes);

  if (image.isEmpty()) {
    throw new Error('Failed to decode the source PNG image for resizing.');
  }

  const resized = image.resize({
    width: targetWidth,
    height: targetHeight,
    quality: 'best',
  });

  return resized.toPNG();
}
