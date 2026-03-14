export class InvalidPngFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPngFileError';
  }
}
