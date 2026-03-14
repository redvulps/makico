import { app, ipcMain } from 'electron';

import { IPC_CHANNELS } from '@shared/contracts/ipc';
import type { AppInfoDto } from '@shared/dto/appInfo';

export function registerAppInfoIpc(): void {
  ipcMain.handle(IPC_CHANNELS.getAppInfo, (): AppInfoDto => {
    return {
      name: app.getName(),
      platform: process.platform,
      versions: {
        chrome: process.versions.chrome,
        electron: process.versions.electron,
        node: process.versions.node,
        v8: process.versions.v8,
      },
    };
  });
}
