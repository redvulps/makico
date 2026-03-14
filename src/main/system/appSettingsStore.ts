import path from 'node:path';

import { app } from 'electron';

import { AppSettingsStore } from './PersistedAppSettingsStore';

export const appSettingsStore = new AppSettingsStore({
  getSettingsFilePath: () =>
    path.join(app.getPath('userData'), 'app-settings.json'),
  getLegacyWorkbenchSettingsFilePath: () =>
    path.join(app.getPath('userData'), 'workbench-settings.json'),
});
