import { BrowserWindow, ipcMain } from 'electron';

import { IPC_CHANNELS, IPC_EVENTS } from '@shared/contracts/ipc';
import type { WindowStateDto } from '@shared/dto/windowState';

import { appSettingsStore } from '../system/appSettingsStore';

export function registerWindowIpc(): void {
  ipcMain.handle(IPC_CHANNELS.windowMinimize, (event): void => {
    const window = BrowserWindow.fromWebContents(event.sender);

    window?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.windowGetState, (event): WindowStateDto => {
    const window = BrowserWindow.fromWebContents(event.sender);

    return {
      isMaximized: window?.isMaximized() ?? false,
    };
  });

  ipcMain.handle(IPC_CHANNELS.windowToggleMaximize, (event): void => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
      return;
    }

    if (window.isMaximized()) {
      window.unmaximize();
      return;
    }

    window.maximize();
  });

  ipcMain.handle(IPC_CHANNELS.windowClose, (event): void => {
    const window = BrowserWindow.fromWebContents(event.sender);

    window?.close();
  });
}

export function registerWindowStateEvents(mainWindow: BrowserWindow): void {
  let persistTimer: NodeJS.Timeout | null = null;

  const emitWindowState = (): void => {
    mainWindow.webContents.send(IPC_EVENTS.windowStateChanged, {
      isMaximized: mainWindow.isMaximized(),
    } satisfies WindowStateDto);
  };

  const writeWindowState = (): void => {
    if (mainWindow.isDestroyed()) {
      return;
    }

    const normalBounds = mainWindow.getNormalBounds();

    void appSettingsStore.updateWindowSettings({
      width: normalBounds.width,
      height: normalBounds.height,
      x: normalBounds.x,
      y: normalBounds.y,
      isMaximized: mainWindow.isMaximized(),
    });
  };

  const persistWindowState = (delayInMilliseconds: number): void => {
    if (persistTimer) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }

    if (delayInMilliseconds === 0) {
      writeWindowState();
      return;
    }

    persistTimer = setTimeout(() => {
      persistTimer = null;
      writeWindowState();
    }, delayInMilliseconds);
  };

  const emitAndPersistWindowState = (): void => {
    emitWindowState();
    persistWindowState(0);
  };

  mainWindow.on('maximize', emitAndPersistWindowState);
  mainWindow.on('unmaximize', emitAndPersistWindowState);
  mainWindow.on('move', () => {
    if (mainWindow.isMinimized()) {
      return;
    }

    persistWindowState(160);
  });
  mainWindow.on('resize', () => {
    if (mainWindow.isMinimized()) {
      return;
    }

    persistWindowState(160);
  });
  mainWindow.on('close', () => {
    persistWindowState(0);
  });
  mainWindow.on('closed', () => {
    if (!persistTimer) {
      return;
    }

    clearTimeout(persistTimer);
    persistTimer = null;
  });
}
