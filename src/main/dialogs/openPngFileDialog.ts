import { BrowserWindow, dialog, type OpenDialogOptions } from 'electron';

export async function openPngFileDialog(
  parentWindow: BrowserWindow | null,
  defaultDirectory: string | null,
): Promise<string | null> {
  const options: OpenDialogOptions = {
    defaultPath: defaultDirectory ?? undefined,
    properties: ['openFile'],
    filters: [
      { name: 'PNG images', extensions: ['png'] },
      { name: 'All files', extensions: ['*'] },
    ],
  };
  const result = parentWindow
    ? await dialog.showOpenDialog(parentWindow, options)
    : await dialog.showOpenDialog(options);

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0] ?? null;
}
