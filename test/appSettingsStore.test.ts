import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  MIN_MAIN_WINDOW_SIZE,
  defaultAppSettings,
  defaultAppWindowSettings,
} from '@shared/dto/appSettings';
import { defaultWorkbenchSettings } from '@shared/dto/workbenchSettings';

import { AppSettingsStore } from '../src/main/system/PersistedAppSettingsStore';

describe('AppSettingsStore', () => {
  it('creates the default app settings file on first load', async () => {
    const tempDirectory = await createTempDirectory();
    const settingsFilePath = path.join(tempDirectory, 'app-settings.json');
    const store = new AppSettingsStore({
      getSettingsFilePath: () => settingsFilePath,
    });

    const workbenchSettings = await store.getWorkbenchSettings();
    const windowSettings = await store.getWindowSettings();
    const persistedSettings = JSON.parse(
      await readFile(settingsFilePath, 'utf8'),
    ) as typeof defaultAppSettings;

    expect(workbenchSettings).toEqual(defaultWorkbenchSettings);
    expect(windowSettings).toEqual(defaultAppWindowSettings);
    expect(persistedSettings).toEqual(defaultAppSettings);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it('migrates the legacy workbench settings file into app settings', async () => {
    const tempDirectory = await createTempDirectory();
    const settingsFilePath = path.join(tempDirectory, 'app-settings.json');
    const legacySettingsFilePath = path.join(
      tempDirectory,
      'workbench-settings.json',
    );

    await writeFile(
      legacySettingsFilePath,
      `${JSON.stringify(
        {
          showPixelGrid: false,
          showCanvasMetrics: false,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );

    const store = new AppSettingsStore({
      getSettingsFilePath: () => settingsFilePath,
      getLegacyWorkbenchSettingsFilePath: () => legacySettingsFilePath,
    });

    const workbenchSettings = await store.getWorkbenchSettings();
    const persistedSettings = JSON.parse(
      await readFile(settingsFilePath, 'utf8'),
    ) as typeof defaultAppSettings;

    expect(workbenchSettings).toEqual({
      ...defaultWorkbenchSettings,
      showPixelGrid: false,
      showCanvasMetrics: false,
    });
    expect(persistedSettings).toEqual({
      ...defaultAppSettings,
      workbench: workbenchSettings,
    });
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it('serializes queued workbench updates into the same file', async () => {
    const tempDirectory = await createTempDirectory();
    const settingsFilePath = path.join(tempDirectory, 'app-settings.json');
    const store = new AppSettingsStore({
      getSettingsFilePath: () => settingsFilePath,
    });

    await Promise.all([
      store.updateWorkbenchSettings({ showPixelGrid: false }),
      store.updateWorkbenchSettings({ showCanvasMetrics: false }),
    ]);

    const workbenchSettings = await store.getWorkbenchSettings();

    expect(workbenchSettings).toEqual({
      ...defaultWorkbenchSettings,
      showPixelGrid: false,
      showCanvasMetrics: false,
    });
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it('normalizes persisted window geometry updates', async () => {
    const tempDirectory = await createTempDirectory();
    const settingsFilePath = path.join(tempDirectory, 'app-settings.json');
    const store = new AppSettingsStore({
      getSettingsFilePath: () => settingsFilePath,
    });

    const windowSettings = await store.updateWindowSettings({
      width: MIN_MAIN_WINDOW_SIZE.width - 400,
      height: MIN_MAIN_WINDOW_SIZE.height - 300,
      x: 48.7,
      y: 91.2,
      isMaximized: true,
    });

    expect(windowSettings).toEqual({
      width: MIN_MAIN_WINDOW_SIZE.width,
      height: MIN_MAIN_WINDOW_SIZE.height,
      x: 49,
      y: 91,
      isMaximized: true,
    });
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it('keeps recent projects ordered newest-first without duplicates', async () => {
    const tempDirectory = await createTempDirectory();
    const settingsFilePath = path.join(tempDirectory, 'app-settings.json');
    const store = new AppSettingsStore({
      getSettingsFilePath: () => settingsFilePath,
    });

    await store.recordRecentProject('/tmp/icons/first.ico', 'ico');
    await store.recordRecentProject('/tmp/icons/second.icns', 'icns');
    await store.recordRecentProject('/tmp/icons/first.ico', 'ico');

    const recentProjects = await store.getRecentProjects();
    const dialogDirectories = await store.getDialogDirectories();

    expect(recentProjects).toEqual([
      {
        path: '/tmp/icons/first.ico',
        format: 'ico',
      },
      {
        path: '/tmp/icons/second.icns',
        format: 'icns',
      },
    ]);
    expect(dialogDirectories.lastProjectDirectory).toBe('/tmp/icons');
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it('tracks image import and export directories in app settings', async () => {
    const tempDirectory = await createTempDirectory();
    const settingsFilePath = path.join(tempDirectory, 'app-settings.json');
    const store = new AppSettingsStore({
      getSettingsFilePath: () => settingsFilePath,
    });

    await store.recordImageImportPath('/tmp/source-icons/source.png');
    await store.recordExportPath('/tmp/exported-icons/app.icns', 'icns');

    const dialogDirectories = await store.getDialogDirectories();
    const recentProjects = await store.getRecentProjects();

    expect(dialogDirectories).toEqual({
      lastProjectDirectory: '/tmp/exported-icons',
      lastImageImportDirectory: '/tmp/source-icons',
      lastExportDirectory: '/tmp/exported-icons',
    });
    expect(recentProjects[0]).toEqual({
      path: '/tmp/exported-icons/app.icns',
      format: 'icns',
    });
    await rm(tempDirectory, { recursive: true, force: true });
  });
});

async function createTempDirectory(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'makico-app-settings-'));
}
