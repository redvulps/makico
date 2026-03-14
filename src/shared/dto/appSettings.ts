import {
  defaultWorkbenchSettings,
  normalizeWorkbenchSettings,
  type WorkbenchSettingsDto,
} from './workbenchSettings';

export type RecentProjectFormat = 'ico' | 'icns';

export interface AppWindowSettingsDto {
  readonly width: number;
  readonly height: number;
  readonly x: number | null;
  readonly y: number | null;
  readonly isMaximized: boolean;
}

export interface AppDialogDirectorySettingsDto {
  readonly lastProjectDirectory: string | null;
  readonly lastImageImportDirectory: string | null;
  readonly lastExportDirectory: string | null;
}

export interface RecentProjectDto {
  readonly path: string;
  readonly format: RecentProjectFormat;
}

export interface AppSettingsDto {
  readonly workbench: WorkbenchSettingsDto;
  readonly window: AppWindowSettingsDto;
  readonly dialogDirectories: AppDialogDirectorySettingsDto;
  readonly recentProjects: readonly RecentProjectDto[];
}

export interface AppSettingsInput {
  readonly workbench?: Partial<WorkbenchSettingsDto>;
  readonly window?: Partial<AppWindowSettingsDto>;
  readonly dialogDirectories?: Partial<AppDialogDirectorySettingsDto>;
  readonly recentProjects?: readonly Partial<RecentProjectDto>[];
}

export const MIN_MAIN_WINDOW_SIZE = {
  width: 1120,
  height: 720,
} as const;

export const defaultAppWindowSettings: AppWindowSettingsDto = {
  width: 1480,
  height: 940,
  x: null,
  y: null,
  isMaximized: false,
};

export const defaultAppDialogDirectorySettings: AppDialogDirectorySettingsDto =
  {
    lastProjectDirectory: null,
    lastImageImportDirectory: null,
    lastExportDirectory: null,
  };

export const defaultAppSettings: AppSettingsDto = {
  workbench: defaultWorkbenchSettings,
  window: defaultAppWindowSettings,
  dialogDirectories: defaultAppDialogDirectorySettings,
  recentProjects: [],
};

export function normalizeAppSettings(
  value: AppSettingsInput | null | undefined,
): AppSettingsDto {
  return {
    workbench: normalizeWorkbenchSettings(value?.workbench),
    window: normalizeAppWindowSettings(value?.window),
    dialogDirectories: normalizeAppDialogDirectorySettings(
      value?.dialogDirectories,
    ),
    recentProjects: normalizeRecentProjects(value?.recentProjects),
  };
}

export function normalizeAppWindowSettings(
  value: Partial<AppWindowSettingsDto> | null | undefined,
): AppWindowSettingsDto {
  return {
    width: normalizeWindowDimension(
      value?.width,
      defaultAppWindowSettings.width,
      MIN_MAIN_WINDOW_SIZE.width,
    ),
    height: normalizeWindowDimension(
      value?.height,
      defaultAppWindowSettings.height,
      MIN_MAIN_WINDOW_SIZE.height,
    ),
    x: normalizeWindowCoordinate(value?.x),
    y: normalizeWindowCoordinate(value?.y),
    isMaximized: value?.isMaximized === true,
  };
}

export function normalizeAppDialogDirectorySettings(
  value: Partial<AppDialogDirectorySettingsDto> | null | undefined,
): AppDialogDirectorySettingsDto {
  return {
    lastProjectDirectory: normalizeOptionalPath(value?.lastProjectDirectory),
    lastImageImportDirectory: normalizeOptionalPath(
      value?.lastImageImportDirectory,
    ),
    lastExportDirectory: normalizeOptionalPath(value?.lastExportDirectory),
  };
}

export function normalizeRecentProjects(
  value: readonly Partial<RecentProjectDto>[] | null | undefined,
): readonly RecentProjectDto[] {
  if (!value) {
    return [];
  }

  const recentProjects: RecentProjectDto[] = [];

  for (const candidate of value) {
    if (!candidate || typeof candidate.path !== 'string') {
      continue;
    }

    const normalizedPath = normalizeOptionalPath(candidate.path);

    if (!normalizedPath) {
      continue;
    }

    if (candidate.format !== 'ico' && candidate.format !== 'icns') {
      continue;
    }

    if (recentProjects.some((project) => project.path === normalizedPath)) {
      continue;
    }

    recentProjects.push({
      path: normalizedPath,
      format: candidate.format,
    });

    if (recentProjects.length >= 8) {
      break;
    }
  }

  return recentProjects;
}

function normalizeWindowDimension(
  value: number | undefined,
  fallback: number,
  minimum: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(Math.round(value), minimum);
}

function normalizeWindowCoordinate(
  value: number | null | undefined,
): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.round(value);
}

function normalizeOptionalPath(
  value: string | null | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}
