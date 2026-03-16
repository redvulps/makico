export type AppTheme = 'light' | 'dark' | 'system';

export interface WorkbenchSettingsDto {
  readonly theme: AppTheme;
  readonly showPixelGrid: boolean;
  readonly showCanvasMetrics: boolean;
  readonly pixelateSmallPreviews: boolean;
}

export const defaultWorkbenchSettings: WorkbenchSettingsDto = {
  theme: 'light',
  showPixelGrid: true,
  showCanvasMetrics: true,
  pixelateSmallPreviews: true,
};

export function normalizeWorkbenchSettings(
  value: Partial<WorkbenchSettingsDto> | null | undefined,
): WorkbenchSettingsDto {
  return {
    theme: normalizeTheme(value?.theme),
    showPixelGrid:
      value?.showPixelGrid ?? defaultWorkbenchSettings.showPixelGrid,
    showCanvasMetrics:
      value?.showCanvasMetrics ?? defaultWorkbenchSettings.showCanvasMetrics,
    pixelateSmallPreviews:
      value?.pixelateSmallPreviews ??
      defaultWorkbenchSettings.pixelateSmallPreviews,
  };
}

function normalizeTheme(value: string | null | undefined): AppTheme {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return defaultWorkbenchSettings.theme;
}
