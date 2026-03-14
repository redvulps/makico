import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

import { addIcnsSlotFromPng } from '@application/use-cases/addIcnsSlotFromPng/addIcnsSlotFromPng';
import { addIcoEntryFromPng } from '@application/use-cases/addIcoEntryFromPng/addIcoEntryFromPng';
import { createIcnsProject } from '@application/use-cases/createIcnsProject/createIcnsProject';
import { createIcoProject } from '@application/use-cases/createIcoProject/createIcoProject';
import { BrowserWindow, ipcMain } from 'electron';

import { getWorkbenchSnapshot } from '@application/use-cases/getWorkbenchSnapshot/getWorkbenchSnapshot';
import {
  mapIcnsProjectSessionToDto,
  type IcnsProjectSession,
} from '@application/use-cases/importIcns/importIcnsProject';
import {
  mapIcoProjectSessionToDto,
  type IcoProjectSession,
} from '@application/use-cases/importIco/importIcoProject';
import { getCanonicalIcnsSlots } from '@infrastructure/codecs/icns/icnsSlotMap';
import { resizePng } from '@infrastructure/imaging/png/resizePng';
import { IPC_CHANNELS, type CreateProjectFormat } from '@shared/contracts/ipc';
import type { IconProjectDto } from '@shared/dto/iconProject';
import type { RecentProjectDto } from '@shared/dto/appSettings';
import type { WorkbenchSnapshotDto } from '@shared/dto/workbenchSnapshot';

import { openPngFileDialog } from '../dialogs/openPngFileDialog';
import { appSettingsStore } from '../system/appSettingsStore';
import { confirmActiveProjectDiscard } from '../system/confirmActiveProjectDiscard';
import { iconProjectSessionStore } from '../system/iconProjectSessionStore';
import { importBufferedIconProject } from '../system/importBufferedIconProject';
import { importProjectFromPath } from '../system/importProjectFromPath';
import { windowProjectRegistry } from '../system/windowProjectRegistry';

export function registerWorkbenchIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.getWorkbenchSnapshot,
    (): WorkbenchSnapshotDto => {
      return getWorkbenchSnapshot();
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.getRecentProjects,
    async (): Promise<readonly RecentProjectDto[]> => {
      return appSettingsStore.getRecentProjects();
    },
  );

  ipcMain.handle(IPC_CHANNELS.newWorkspace, async (event): Promise<boolean> => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    const canContinue = await confirmActiveProjectDiscard(parentWindow);

    if (!canContinue) {
      return false;
    }

    if (!parentWindow) {
      return true;
    }

    const activeProject = windowProjectRegistry.getActiveProject(
      parentWindow.id,
    );

    if (!activeProject) {
      return true;
    }

    iconProjectSessionStore.deleteProjectSession(activeProject);
    windowProjectRegistry.clearWindow(parentWindow.id);

    return true;
  });

  ipcMain.handle(
    IPC_CHANNELS.createProject,
    async (
      event,
      format: CreateProjectFormat,
    ): Promise<IconProjectDto | null> => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      const canContinue = await confirmActiveProjectDiscard(parentWindow);

      if (!canContinue) {
        return null;
      }

      const activeProject = parentWindow
        ? windowProjectRegistry.getActiveProject(parentWindow.id)
        : undefined;

      if (activeProject) {
        iconProjectSessionStore.deleteProjectSession(activeProject);
      }

      const projectId = randomUUID();

      if (format === 'ico') {
        const session = createIcoProject({ projectId });

        iconProjectSessionStore.saveIcoProject(session);

        if (parentWindow) {
          windowProjectRegistry.setActiveProject(parentWindow.id, {
            format: 'ico',
            projectId: session.id,
          });
        }

        return mapIcoProjectSessionToDto(session);
      }

      const session = createIcnsProject({ projectId });

      iconProjectSessionStore.saveIcnsProject(session);

      if (parentWindow) {
        windowProjectRegistry.setActiveProject(parentWindow.id, {
          format: 'icns',
          projectId: session.id,
        });
      }

      return mapIcnsProjectSessionToDto(session);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.createProjectFromImage,
    async (
      event,
      format: CreateProjectFormat,
    ): Promise<IconProjectDto | null> => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender);

      const { lastImageImportDirectory } =
        await appSettingsStore.getDialogDirectories();
      const pngPath = await openPngFileDialog(
        parentWindow,
        lastImageImportDirectory,
      );

      if (!pngPath) {
        return null;
      }

      const canContinue = await confirmActiveProjectDiscard(parentWindow);

      if (!canContinue) {
        return null;
      }

      const activeProject = parentWindow
        ? windowProjectRegistry.getActiveProject(parentWindow.id)
        : undefined;

      if (activeProject) {
        iconProjectSessionStore.deleteProjectSession(activeProject);
      }

      const sourcePng = await readFile(pngPath);
      await appSettingsStore.recordImageImportPath(pngPath);
      const projectId = randomUUID();

      if (format === 'ico') {
        const session = populateIcoFromImage(
          createIcoProject({ projectId }),
          sourcePng,
        );

        iconProjectSessionStore.saveIcoProject(session);

        if (parentWindow) {
          windowProjectRegistry.setActiveProject(parentWindow.id, {
            format: 'ico',
            projectId: session.id,
          });
        }

        return mapIcoProjectSessionToDto(session);
      }

      const session = populateIcnsFromImage(
        createIcnsProject({ projectId }),
        sourcePng,
      );

      iconProjectSessionStore.saveIcnsProject(session);

      if (parentWindow) {
        windowProjectRegistry.setActiveProject(parentWindow.id, {
          format: 'icns',
          projectId: session.id,
        });
      }

      return mapIcnsProjectSessionToDto(session);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.importDroppedProject,
    async (
      event,
      fileName: string,
      bytes: Uint8Array,
    ): Promise<IconProjectDto | null> => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      const canContinue = await confirmActiveProjectDiscard(parentWindow);

      if (!canContinue) {
        return null;
      }

      return importBufferedIconProject({
        parentWindow,
        fileName,
        bytes: Buffer.from(bytes),
      });
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.openRecentProject,
    async (event, filePath: string): Promise<IconProjectDto | null> => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      const canContinue = await confirmActiveProjectDiscard(parentWindow);

      if (!canContinue) {
        return null;
      }

      try {
        return await importProjectFromPath({
          parentWindow,
          filePath,
        });
      } catch (error) {
        if (isMissingFileError(error)) {
          await appSettingsStore.removeRecentProject(filePath);
          throw new Error(
            'The recent project file is no longer available on disk.',
          );
        }

        throw error;
      }
    },
  );
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

const ICO_STANDARD_SIZES = [16, 24, 32, 48, 64, 128, 256] as const;

function populateIcoFromImage(
  session: IcoProjectSession,
  sourcePng: Buffer,
): IcoProjectSession {
  let current = session;

  for (const size of ICO_STANDARD_SIZES) {
    const resizedPng = resizePng(sourcePng, size, size);
    const entryId = randomUUID();

    current = addIcoEntryFromPng(current, entryId, resizedPng, null);
  }

  return current;
}

function populateIcnsFromImage(
  session: IcnsProjectSession,
  sourcePng: Buffer,
): IcnsProjectSession {
  let current = session;
  const canonicalSlots = getCanonicalIcnsSlots();

  for (const slot of canonicalSlots) {
    const resizedPng = resizePng(sourcePng, slot.pixelWidth, slot.pixelHeight);
    const chunkId = randomUUID();

    current = addIcnsSlotFromPng(current, chunkId, slot.chunkType, resizedPng);
  }

  return current;
}
