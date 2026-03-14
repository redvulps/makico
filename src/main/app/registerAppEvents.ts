import { app, BrowserWindow, dialog } from 'electron';

import { createMainWindow } from './createMainWindow';
import { registerApplicationMenu } from './registerApplicationMenu';

export function registerAppEvents(): void {
  app.whenReady().then(() => {
    registerApplicationMenu();
    void openMainWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void openMainWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

async function openMainWindow(): Promise<void> {
  try {
    await createMainWindow();
  } catch (error) {
    dialog.showErrorBox(
      'Makico',
      error instanceof Error
        ? error.message
        : 'Unable to open the main window.',
    );
  }
}
