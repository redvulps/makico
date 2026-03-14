import type { BrowserWindow } from 'electron';

import { showDiscardProjectChangesPrompt } from '../dialogs/showDiscardProjectChangesPrompt';
import { iconProjectSessionStore } from './iconProjectSessionStore';
import { windowProjectRegistry } from './windowProjectRegistry';

export async function confirmActiveProjectDiscard(
  parentWindow: BrowserWindow | null,
): Promise<boolean> {
  if (!parentWindow) {
    return true;
  }

  const activeProject = windowProjectRegistry.getActiveProject(parentWindow.id);

  if (!activeProject) {
    return true;
  }

  const session = iconProjectSessionStore.getProjectSession(activeProject);

  if (!session?.isDirty) {
    return true;
  }

  const decision = await showDiscardProjectChangesPrompt(parentWindow, {
    action: 'import',
    projectName: session.name,
    format: session.format,
  });

  return decision === 'discard';
}
