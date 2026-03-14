import { BrowserWindow, dialog } from 'electron';

export async function saveIcnsFileDialog(
  defaultPath: string,
  parentWindow: BrowserWindow | null,
): Promise<string | null> {
  const options = {
    defaultPath,
    filters: [
      { name: 'Apple icon files', extensions: ['icns'] },
      { name: 'All files', extensions: ['*'] },
    ],
  };
  const result = parentWindow
    ? await dialog.showSaveDialog(parentWindow, options)
    : await dialog.showSaveDialog(options);

  if (result.canceled) {
    return null;
  }

  return result.filePath ?? null;
}
