import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '@shared/contracts/ipc';
import type { WorkbenchSettingsDto } from '@shared/dto/workbenchSettings';

import { appSettingsStore } from '../system/appSettingsStore';

export function registerWorkbenchSettingsIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.getWorkbenchSettings,
    async (): Promise<WorkbenchSettingsDto> => {
      return appSettingsStore.getWorkbenchSettings();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.updateWorkbenchSettings,
    async (
      _event,
      patch: Partial<WorkbenchSettingsDto>,
    ): Promise<WorkbenchSettingsDto> => {
      return appSettingsStore.updateWorkbenchSettings(patch);
    },
  );
}
