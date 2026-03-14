import { BrowserWindow, dialog, type MessageBoxOptions } from 'electron';

import type { IconFormat } from '@domain/icon-project/value-objects/IconFormat';

interface ShowUnsavedProjectChangesPromptInput {
  readonly projectName: string;
  readonly format: IconFormat;
}

export async function showUnsavedProjectChangesPrompt(
  parentWindow: BrowserWindow | null,
  input: ShowUnsavedProjectChangesPromptInput,
): Promise<'save' | 'discard' | 'cancel'> {
  const formatLabel = input.format.toUpperCase();
  const changeLabel = input.format === 'ico' ? 'entry edits' : 'slot edits';
  const options: MessageBoxOptions = {
    type: 'warning',
    buttons: ['Save changes', 'Discard changes', 'Cancel'],
    cancelId: 2,
    defaultId: 0,
    noLink: true,
    message: `Save changes to ${input.projectName} before closing?`,
    detail: `The current ${formatLabel} session has unsaved ${changeLabel}. Save them, discard them, or cancel closing the window.`,
  };
  const result = parentWindow
    ? await dialog.showMessageBox(parentWindow, options)
    : await dialog.showMessageBox(options);

  if (result.response === 0) {
    return 'save';
  }

  if (result.response === 1) {
    return 'discard';
  }

  return 'cancel';
}
