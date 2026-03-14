import { BrowserWindow, dialog } from 'electron';

import { persistIcnsProjectSession } from '../system/persistIcnsProjectSession';
import { iconProjectSessionStore } from '../system/iconProjectSessionStore';
import { persistIcoProjectSession } from '../system/persistIcoProjectSession';
import { windowProjectRegistry } from '../system/windowProjectRegistry';
import { showUnsavedProjectChangesPrompt } from '../dialogs/showUnsavedProjectChangesPrompt';

const windowIdsAllowedToClose = new Set<number>();

export function registerWindowCloseGuard(mainWindow: BrowserWindow): void {
  mainWindow.on('close', (event) => {
    if (windowIdsAllowedToClose.has(mainWindow.id)) {
      windowIdsAllowedToClose.delete(mainWindow.id);
      return;
    }

    const activeProject = windowProjectRegistry.getActiveProject(mainWindow.id);

    if (!activeProject) {
      return;
    }

    const session = iconProjectSessionStore.getProjectSession(activeProject);

    if (!session?.isDirty) {
      return;
    }

    event.preventDefault();
    void resolveDirtyWindowClose(mainWindow, activeProject);
  });

  mainWindow.on('closed', () => {
    windowProjectRegistry.clearWindow(mainWindow.id);
    windowIdsAllowedToClose.delete(mainWindow.id);
  });
}

async function resolveDirtyWindowClose(
  mainWindow: BrowserWindow,
  activeProject: NonNullable<
    ReturnType<typeof windowProjectRegistry.getActiveProject>
  >,
): Promise<void> {
  try {
    const session = iconProjectSessionStore.getProjectSession(activeProject);

    if (!session?.isDirty) {
      windowProjectRegistry.clearWindow(mainWindow.id);
      windowIdsAllowedToClose.add(mainWindow.id);
      mainWindow.close();
      return;
    }

    const decision = await showUnsavedProjectChangesPrompt(mainWindow, {
      projectName: session.name,
      format: session.format,
    });

    if (decision === 'cancel') {
      return;
    }

    if (decision === 'save') {
      if (activeProject.format === 'ico') {
        const icoSession = iconProjectSessionStore.getIcoProject(
          activeProject.projectId,
        );

        if (!icoSession) {
          return;
        }

        const persistedProject = await persistIcoProjectSession(
          icoSession,
          mainWindow,
        );

        if (!persistedProject) {
          return;
        }

        iconProjectSessionStore.saveIcoProject(persistedProject.session);
      } else {
        const icnsSession = iconProjectSessionStore.getIcnsProject(
          activeProject.projectId,
        );

        if (!icnsSession) {
          return;
        }

        const persistedProject = await persistIcnsProjectSession(
          icnsSession,
          mainWindow,
        );

        if (!persistedProject) {
          return;
        }

        iconProjectSessionStore.saveIcnsProject(persistedProject.session);
      }
    }

    windowProjectRegistry.clearWindow(mainWindow.id);
    windowIdsAllowedToClose.add(mainWindow.id);
    mainWindow.close();
  } catch (error) {
    dialog.showErrorBox(
      'Makico',
      error instanceof Error ? error.message : 'Unable to close the window.',
    );
  }
}
