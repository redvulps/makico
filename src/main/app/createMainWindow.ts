import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BrowserWindow,
  screen,
  type BrowserWindowConstructorOptions,
  type Rectangle,
} from 'electron';

import {
  MIN_MAIN_WINDOW_SIZE,
  type AppWindowSettingsDto,
} from '@shared/dto/appSettings';

import { registerWindowCloseGuard } from './registerWindowCloseGuard';
import { registerWindowStateEvents } from '../ipc/registerWindowIpc';
import { appSettingsStore } from '../system/appSettingsStore';

export async function createMainWindow(): Promise<BrowserWindow> {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const persistedWindowSettings = await appSettingsStore.getWindowSettings();
  const mainWindow = new BrowserWindow({
    ...resolveInitialWindowOptions(persistedWindowSettings),
    minWidth: MIN_MAIN_WINDOW_SIZE.width,
    minHeight: MIN_MAIN_WINDOW_SIZE.height,
    title: 'Makico',
    frame: false,
    backgroundColor: '#bcb7b1',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(currentDirectory, '../preload/index.mjs'),
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  registerWindowCloseGuard(mainWindow);
  registerWindowStateEvents(mainWindow);

  if (persistedWindowSettings.isMaximized) {
    mainWindow.maximize();
  }

  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];

  if (rendererUrl) {
    void mainWindow.loadURL(rendererUrl);
  } else {
    void mainWindow.loadFile(
      path.join(currentDirectory, '../renderer/index.html'),
    );
  }

  return mainWindow;
}

function resolveInitialWindowOptions(
  persistedWindowSettings: AppWindowSettingsDto,
):
  | Pick<BrowserWindowConstructorOptions, 'height' | 'width'>
  | (Pick<BrowserWindowConstructorOptions, 'height' | 'width'> &
      Pick<BrowserWindowConstructorOptions, 'x' | 'y'>) {
  const baseOptions = {
    width: persistedWindowSettings.width,
    height: persistedWindowSettings.height,
  };

  if (
    persistedWindowSettings.x === null ||
    persistedWindowSettings.y === null
  ) {
    return baseOptions;
  }

  const candidateBounds = {
    x: persistedWindowSettings.x,
    y: persistedWindowSettings.y,
    width: persistedWindowSettings.width,
    height: persistedWindowSettings.height,
  };

  if (!isWindowVisibleOnAnyDisplay(candidateBounds)) {
    return baseOptions;
  }

  return candidateBounds;
}

function isWindowVisibleOnAnyDisplay(bounds: Rectangle): boolean {
  return screen.getAllDisplays().some((display) => {
    const workArea = display.workArea;

    return rectanglesIntersect(bounds, workArea);
  });
}

function rectanglesIntersect(a: Rectangle, b: Rectangle): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
