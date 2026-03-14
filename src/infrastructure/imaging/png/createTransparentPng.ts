import { encodeRgbaPng } from './encodeRgbaPng';

export function createTransparentPng(width: number, height: number): Buffer {
  return encodeRgbaPng(new Uint8Array(width * height * 4), width, height);
}
