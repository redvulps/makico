export class IcnsExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IcnsExportError';
  }
}
