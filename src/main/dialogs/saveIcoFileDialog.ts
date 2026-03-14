import { BrowserWindow, dialog } from 'electron';

export async function saveIcoFileDialog(
  defaultPath: string,
  parentWindow: BrowserWindow | null,
): Promise<string | null> {
  const options = {
    defaultPath,
    filters: [
      { name: 'Windows icon files', extensions: ['ico'] },
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
