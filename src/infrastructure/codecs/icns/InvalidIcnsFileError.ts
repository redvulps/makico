export class InvalidIcnsFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidIcnsFileError';
  }
}
