import { BrowserWindow, Menu, type MenuItemConstructorOptions } from 'electron';

import { IPC_EVENTS, type WorkbenchCommand } from '@shared/contracts/ipc';

export function registerApplicationMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? ([{ role: 'appMenu' }] satisfies MenuItemConstructorOptions[])
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Save',
          accelerator: 'CommandOrControl+S',
          click: () => {
            dispatchWorkbenchCommand('saveProject');
          },
        },
        { type: 'separator' },
        {
          label: 'Import Windows ICO...',
          click: () => {
            dispatchWorkbenchCommand('importIco');
          },
        },
        {
          label: 'Import Apple ICNS...',
          click: () => {
            dispatchWorkbenchCommand('importIcns');
          },
        },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CommandOrControl+Z',
          click: () => {
            dispatchWorkbenchCommand('undo');
          },
        },
        {
          label: 'Redo',
          accelerator:
            process.platform === 'darwin'
              ? 'Shift+CommandOrControl+Z'
              : 'CommandOrControl+Y',
          click: () => {
            dispatchWorkbenchCommand('redo');
          },
        },
        {
          label: 'Delete Selected Resource',
          accelerator: 'Delete',
          click: () => {
            dispatchWorkbenchCommand('deleteSelected');
          },
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function dispatchWorkbenchCommand(command: WorkbenchCommand): void {
  const targetWindow =
    BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];

  targetWindow?.webContents.send(IPC_EVENTS.runWorkbenchCommand, command);
}
