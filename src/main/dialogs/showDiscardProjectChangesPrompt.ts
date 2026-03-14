import { BrowserWindow, dialog, type MessageBoxOptions } from 'electron';

import type { IconFormat } from '@domain/icon-project/value-objects/IconFormat';

interface ShowDiscardProjectChangesPromptInput {
  readonly action: 'import' | 'reset';
  readonly projectName: string;
  readonly format: IconFormat;
}

export async function showDiscardProjectChangesPrompt(
  parentWindow: BrowserWindow | null,
  input: ShowDiscardProjectChangesPromptInput,
): Promise<'discard' | 'cancel'> {
  const formatLabel = input.format.toUpperCase();
  const changeLabel = input.format === 'ico' ? 'entry edits' : 'slot edits';
  const options: MessageBoxOptions = {
    type: 'warning',
    buttons: ['Discard changes', 'Cancel'],
    cancelId: 1,
    defaultId: 1,
    noLink: true,
    message:
      input.action === 'import'
        ? `Discard unsaved ${formatLabel} changes in ${input.projectName}?`
        : `Discard unsaved ${formatLabel} changes before resetting ${input.projectName}?`,
    detail:
      input.action === 'import'
        ? `Importing another file will replace the active ${formatLabel} session. This action cannot be undone.`
        : `Reset will restore the last saved ${formatLabel} session and remove unsaved ${changeLabel}.`,
  };
  const result = parentWindow
    ? await dialog.showMessageBox(parentWindow, options)
    : await dialog.showMessageBox(options);

  return result.response === 0 ? 'discard' : 'cancel';
}
