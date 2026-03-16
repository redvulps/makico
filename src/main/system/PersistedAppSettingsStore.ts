import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  normalizeAppDialogDirectorySettings,
  defaultAppSettings,
  normalizeAppSettings,
  normalizeAppWindowSettings,
  normalizeRecentProjects,
  type AppSettingsDto,
  type AppDialogDirectorySettingsDto,
  type AppSettingsInput,
  type AppWindowSettingsDto,
  type RecentProjectDto,
  type RecentProjectFormat,
} from '@shared/dto/appSettings';
import {
  normalizeWorkbenchSettings,
  type WorkbenchSettingsDto,
} from '@shared/dto/workbenchSettings';

interface AppSettingsStoreOptions {
  readonly getSettingsFilePath: () => string;
  readonly getLegacyWorkbenchSettingsFilePath?: () => string;
}

/**
 * Manages persisted application settings (window geometry, workbench prefs, recent projects).
 *
 * Settings are stored as a single JSON file on disk. Reads are cached in memory after the
 * first load; writes are serialized through a queue to prevent concurrent file corruption.
 * On first launch (or corrupted file), falls back to defaults and rewrites the file.
 */
export class AppSettingsStore {
  private readonly getSettingsFilePath: () => string;
  private readonly getLegacyWorkbenchSettingsFilePath?: () => string;
  private cachedSettings: AppSettingsDto | null = null;
  private loadingSettingsPromise: Promise<AppSettingsDto> | null = null;
  private updateQueue: Promise<void> = Promise.resolve();

  constructor(options: AppSettingsStoreOptions) {
    this.getSettingsFilePath = options.getSettingsFilePath;
    this.getLegacyWorkbenchSettingsFilePath =
      options.getLegacyWorkbenchSettingsFilePath;
  }

  async getWorkbenchSettings(): Promise<WorkbenchSettingsDto> {
    const settings = await this.getSettings();

    return settings.workbench;
  }

  async getWindowSettings(): Promise<AppWindowSettingsDto> {
    const settings = await this.getSettings();

    return settings.window;
  }

  async getDialogDirectories(): Promise<AppDialogDirectorySettingsDto> {
    const settings = await this.getSettings();

    return settings.dialogDirectories;
  }

  async getRecentProjects(): Promise<readonly RecentProjectDto[]> {
    const settings = await this.getSettings();

    return settings.recentProjects;
  }

  async updateWorkbenchSettings(
    patch: Partial<WorkbenchSettingsDto>,
  ): Promise<WorkbenchSettingsDto> {
    const nextSettings = await this.updateSettings((currentSettings) => ({
      ...currentSettings,
      workbench: normalizeWorkbenchSettings({
        ...currentSettings.workbench,
        ...patch,
      }),
    }));

    return nextSettings.workbench;
  }

  async updateWindowSettings(
    patch: Partial<AppWindowSettingsDto>,
  ): Promise<AppWindowSettingsDto> {
    const nextSettings = await this.updateSettings((currentSettings) => ({
      ...currentSettings,
      window: normalizeAppWindowSettings({
        ...currentSettings.window,
        ...patch,
      }),
    }));

    return nextSettings.window;
  }

  async recordRecentProject(
    filePath: string,
    format: RecentProjectFormat,
  ): Promise<readonly RecentProjectDto[]> {
    const parentDirectory = path.dirname(filePath);

    const nextSettings = await this.updateSettings((currentSettings) => ({
      ...currentSettings,
      dialogDirectories: normalizeAppDialogDirectorySettings({
        ...currentSettings.dialogDirectories,
        lastProjectDirectory: parentDirectory,
      }),
      recentProjects: normalizeRecentProjects([
        {
          path: filePath,
          format,
        },
        ...currentSettings.recentProjects,
      ]),
    }));

    return nextSettings.recentProjects;
  }

  async removeRecentProject(
    filePath: string,
  ): Promise<readonly RecentProjectDto[]> {
    const nextSettings = await this.updateSettings((currentSettings) => ({
      ...currentSettings,
      recentProjects: currentSettings.recentProjects.filter((project) => {
        return project.path !== filePath;
      }),
    }));

    return nextSettings.recentProjects;
  }

  async recordImageImportPath(filePath: string): Promise<void> {
    await this.updateSettings((currentSettings) => ({
      ...currentSettings,
      dialogDirectories: normalizeAppDialogDirectorySettings({
        ...currentSettings.dialogDirectories,
        lastImageImportDirectory: path.dirname(filePath),
      }),
    }));
  }

  async recordExportPath(
    filePath: string,
    format: RecentProjectFormat,
  ): Promise<readonly RecentProjectDto[]> {
    const parentDirectory = path.dirname(filePath);

    const nextSettings = await this.updateSettings((currentSettings) => ({
      ...currentSettings,
      dialogDirectories: normalizeAppDialogDirectorySettings({
        ...currentSettings.dialogDirectories,
        lastProjectDirectory: parentDirectory,
        lastExportDirectory: parentDirectory,
      }),
      recentProjects: normalizeRecentProjects([
        {
          path: filePath,
          format,
        },
        ...currentSettings.recentProjects,
      ]),
    }));

    return nextSettings.recentProjects;
  }

  private async getSettings(): Promise<AppSettingsDto> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    if (!this.loadingSettingsPromise) {
      this.loadingSettingsPromise = this.loadSettingsFromDisk();
    }

    return this.loadingSettingsPromise;
  }

  private async updateSettings(
    buildNextSettings: (currentSettings: AppSettingsDto) => AppSettingsDto,
  ): Promise<AppSettingsDto> {
    let nextSettings = defaultAppSettings;

    const queuedUpdate = this.updateQueue
      .catch(() => undefined)
      .then(async () => {
        const currentSettings = await this.getSettings();

        nextSettings = buildNextSettings(currentSettings);

        await this.writeSettingsToDisk(nextSettings);
        this.cachedSettings = nextSettings;
      });

    this.updateQueue = queuedUpdate;

    await queuedUpdate;

    return nextSettings;
  }

  private async loadSettingsFromDisk(): Promise<AppSettingsDto> {
    try {
      const filePath = this.getSettingsFilePath();

      try {
        const fileContents = await readFile(filePath, 'utf8');
        const parsedSettings = JSON.parse(fileContents) as AppSettingsInput;
        const normalizedSettings = normalizeAppSettings(parsedSettings);

        if (!areAppSettingsEqual(parsedSettings, normalizedSettings)) {
          await this.writeSettingsToDisk(normalizedSettings);
        }

        this.cachedSettings = normalizedSettings;

        return normalizedSettings;
      } catch (error) {
        if (!isMissingFileError(error)) {
          const fallbackSettings = defaultAppSettings;

          await this.writeSettingsToDisk(fallbackSettings);
          this.cachedSettings = fallbackSettings;

          return fallbackSettings;
        }

        const migratedWorkbenchSettings =
          await this.loadLegacyWorkbenchSettingsFromDisk();
        const nextSettings = migratedWorkbenchSettings
          ? {
              ...defaultAppSettings,
              workbench: migratedWorkbenchSettings,
            }
          : defaultAppSettings;

        await this.writeSettingsToDisk(nextSettings);
        this.cachedSettings = nextSettings;

        return nextSettings;
      }
    } finally {
      this.loadingSettingsPromise = null;
    }
  }

  private async loadLegacyWorkbenchSettingsFromDisk(): Promise<WorkbenchSettingsDto | null> {
    const legacyFilePath = this.getLegacyWorkbenchSettingsFilePath?.();

    if (!legacyFilePath) {
      return null;
    }

    try {
      const legacyFileContents = await readFile(legacyFilePath, 'utf8');
      const parsedSettings = JSON.parse(
        legacyFileContents,
      ) as Partial<WorkbenchSettingsDto>;

      return normalizeWorkbenchSettings(parsedSettings);
    } catch {
      return null;
    }
  }

  private async writeSettingsToDisk(settings: AppSettingsDto): Promise<void> {
    const filePath = this.getSettingsFilePath();

    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  }
}

/**
 * Field-by-field equality check between a raw parsed candidate and a normalized settings object.
 *
 * This intentional verbose comparison exists because the candidate (`AppSettingsInput`) may be
 * a partial object from `JSON.parse` while the normalized form (`AppSettingsDto`) is complete
 * with defaults filled in. Using `JSON.stringify` would give false negatives when the parsed
 * JSON has extra keys, different key ordering, or missing fields that were filled with defaults.
 */
function areAppSettingsEqual(
  candidate: AppSettingsInput | null | undefined,
  normalized: AppSettingsDto,
): boolean {
  return (
    candidate?.workbench?.theme === normalized.workbench.theme &&
    candidate?.workbench?.showPixelGrid ===
      normalized.workbench.showPixelGrid &&
    candidate?.workbench?.showCanvasMetrics ===
      normalized.workbench.showCanvasMetrics &&
    candidate?.workbench?.pixelateSmallPreviews ===
      normalized.workbench.pixelateSmallPreviews &&
    candidate?.window?.width === normalized.window.width &&
    candidate?.window?.height === normalized.window.height &&
    candidate?.window?.x === normalized.window.x &&
    candidate?.window?.y === normalized.window.y &&
    candidate?.window?.isMaximized === normalized.window.isMaximized &&
    candidate?.dialogDirectories?.lastProjectDirectory ===
      normalized.dialogDirectories.lastProjectDirectory &&
    candidate?.dialogDirectories?.lastImageImportDirectory ===
      normalized.dialogDirectories.lastImageImportDirectory &&
    candidate?.dialogDirectories?.lastExportDirectory ===
      normalized.dialogDirectories.lastExportDirectory &&
    areRecentProjectsEqual(candidate?.recentProjects, normalized.recentProjects)
  );
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function areRecentProjectsEqual(
  candidate: readonly Partial<RecentProjectDto>[] | null | undefined,
  normalized: readonly RecentProjectDto[],
): boolean {
  if (!candidate || candidate.length !== normalized.length) {
    return false;
  }

  return candidate.every((project, index) => {
    return (
      project?.path === normalized[index]?.path &&
      project?.format === normalized[index]?.format
    );
  });
}
