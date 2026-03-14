export class InvalidIcoFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidIcoFileError';
  }
}
