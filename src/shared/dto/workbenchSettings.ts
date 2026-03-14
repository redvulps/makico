export interface WorkbenchSettingsDto {
  readonly showPixelGrid: boolean;
  readonly showCanvasMetrics: boolean;
  readonly pixelateSmallPreviews: boolean;
}

export const defaultWorkbenchSettings: WorkbenchSettingsDto = {
  showPixelGrid: true,
  showCanvasMetrics: true,
  pixelateSmallPreviews: true,
};

export function normalizeWorkbenchSettings(
  value: Partial<WorkbenchSettingsDto> | null | undefined,
): WorkbenchSettingsDto {
  return {
    showPixelGrid:
      value?.showPixelGrid ?? defaultWorkbenchSettings.showPixelGrid,
    showCanvasMetrics:
      value?.showCanvasMetrics ?? defaultWorkbenchSettings.showCanvasMetrics,
    pixelateSmallPreviews:
      value?.pixelateSmallPreviews ??
      defaultWorkbenchSettings.pixelateSmallPreviews,
  };
}
