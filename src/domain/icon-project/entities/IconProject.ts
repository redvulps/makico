import type { IconFormat } from '@domain/icon-project/value-objects/IconFormat';

export interface IconProject {
  readonly id: string;
  readonly title: string;
  readonly supportedFormats: readonly IconFormat[];
  readonly previewSizes: readonly number[];
}
