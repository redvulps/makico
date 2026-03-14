import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { BrowserWindow, ipcMain } from 'electron';

import { addIcoEntryFromPng } from '@application/use-cases/addIcoEntryFromPng/addIcoEntryFromPng';
import { addBlankIcoEntry } from '@application/use-cases/addBlankIcoEntry/addBlankIcoEntry';
import { mapIcoProjectSessionToDto } from '@application/use-cases/importIco/importIcoProject';
import { moveIcoEntry } from '@application/use-cases/moveIcoEntry/moveIcoEntry';
import { recordIcoProjectRevision } from '@application/use-cases/recordIcoProjectRevision/recordIcoProjectRevision';
import { replaceIcoEntryWithPng } from '@application/use-cases/replaceIcoEntryWithPng/replaceIcoEntryWithPng';
import { removeIcoEntry } from '@application/use-cases/removeIcoEntry/removeIcoEntry';
import { resetIcoProject } from '@application/use-cases/resetIcoProject/resetIcoProject';
import {
  IPC_CHANNELS,
  type IcoEntryMoveDirection,
} from '@shared/contracts/ipc';
import type {
  AddIcoEntryResultDto,
  ExportIcoResultDto,
  IcoProjectDto,
} from '@shared/dto/iconProject';

import { openIcoFileDialog } from '../dialogs/openIcoFileDialog';
import { openPngFileDialog } from '../dialogs/openPngFileDialog';
import { appSettingsStore } from '../system/appSettingsStore';
import { showDiscardProjectChangesPrompt } from '../dialogs/showDiscardProjectChangesPrompt';
import { confirmActiveProjectDiscard } from '../system/confirmActiveProjectDiscard';
import { iconProjectSessionStore } from '../system/iconProjectSessionStore';
import { importProjectFromPath } from '../system/importProjectFromPath';
import { persistIcoProjectSession } from '../system/persistIcoProjectSession';
import { windowProjectRegistry } from '../system/windowProjectRegistry';

export function registerIcoProjectIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.importIco,
    async (event): Promise<IcoProjectDto | null> => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      const canContinue = await confirmActiveProjectDiscard(parentWindow);

      if (!canContinue) {
        return null;
      }

      const { lastProjectDirectory } =
        await appSettingsStore.getDialogDirectories();
      const filePath = await openIcoFileDialog(
        parentWindow,
        lastProjectDirectory,
      );

      if (!filePath) {
        return null;
      }

      const importedProject = await importProjectFromPath({
        filePath,
        parentWindow,
      });

      if (importedProject.format !== 'ico') {
        throw new Error('The selected file is not a valid ICO project.');
      }

      return importedProject;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.exportIco,
    async (event, projectId: string): Promise<ExportIcoResultDto | null> => {
      const session = requireIcoProject(projectId);
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      const persistedProject = await persistIcoProjectSession(
        session,
        parentWindow,
      );

      if (!persistedProject) {
        return null;
      }
      iconProjectSessionStore.saveIcoProject(persistedProject.session);

      return {
        outputPath: persistedProject.outputPath,
        project: mapIcoProjectSessionToDto(persistedProject.session),
      };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.addIcoEntryFromPng,
    async (
      event,
      projectId: string,
      afterEntryId: string | null,
    ): Promise<AddIcoEntryResultDto | null> => {
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

      const session = requireIcoProject(projectId);
      const pngBytes = await readFile(pngPath);
      await appSettingsStore.recordImageImportPath(pngPath);
      const addedEntryId = randomUUID();
      const nextSession = addIcoEntryFromPng(
        session,
        addedEntryId,
        pngBytes,
        afterEntryId,
      );
      const updatedSession = recordIcoProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcoProject(updatedSession);
      registerActiveProject(parentWindow, updatedSession.id, 'ico');

      return {
        project: mapIcoProjectSessionToDto(updatedSession),
        addedEntryId,
      };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.addBlankIcoEntry,
    async (
      event,
      projectId: string,
      size: number,
      afterEntryId: string | null,
    ): Promise<AddIcoEntryResultDto> => {
      const session = requireIcoProject(projectId);
      const addedEntryId = randomUUID();
      const nextSession = addBlankIcoEntry(
        session,
        addedEntryId,
        size,
        afterEntryId,
      );
      const updatedSession = recordIcoProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcoProject(updatedSession);
      registerActiveProject(
        BrowserWindow.fromWebContents(event.sender),
        updatedSession.id,
        'ico',
      );

      return {
        project: mapIcoProjectSessionToDto(updatedSession),
        addedEntryId,
      };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.removeIcoEntry,
    async (
      event,
      projectId: string,
      entryId: string,
    ): Promise<IcoProjectDto> => {
      const session = requireIcoProject(projectId);
      const nextSession = removeIcoEntry(session, entryId);
      const updatedSession = recordIcoProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcoProject(updatedSession);
      registerActiveProject(
        BrowserWindow.fromWebContents(event.sender),
        updatedSession.id,
        'ico',
      );

      return mapIcoProjectSessionToDto(updatedSession);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.moveIcoEntry,
    async (
      event,
      projectId: string,
      entryId: string,
      direction: IcoEntryMoveDirection,
    ): Promise<IcoProjectDto> => {
      const session = requireIcoProject(projectId);
      const nextSession = moveIcoEntry(session, entryId, direction);
      const updatedSession = recordIcoProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcoProject(updatedSession);
      registerActiveProject(
        BrowserWindow.fromWebContents(event.sender),
        updatedSession.id,
        'ico',
      );

      return mapIcoProjectSessionToDto(updatedSession);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.replaceIcoEntryWithPng,
    async (
      event,
      projectId: string,
      entryId: string,
    ): Promise<IcoProjectDto | null> => {
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

      const session = requireIcoProject(projectId);
      const pngBytes = await readFile(pngPath);
      await appSettingsStore.recordImageImportPath(pngPath);
      const nextSession = replaceIcoEntryWithPng(session, entryId, pngBytes);
      const updatedSession = recordIcoProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcoProject(updatedSession);
      registerActiveProject(parentWindow, updatedSession.id, 'ico');

      return mapIcoProjectSessionToDto(updatedSession);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.replaceIcoEntryWithPngBytes,
    async (
      event,
      projectId: string,
      entryId: string,
      bytes: Uint8Array,
    ): Promise<IcoProjectDto> => {
      const session = requireIcoProject(projectId);
      const nextSession = replaceIcoEntryWithPng(
        session,
        entryId,
        Buffer.from(bytes),
      );
      const updatedSession = recordIcoProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcoProject(updatedSession);
      registerActiveProject(
        BrowserWindow.fromWebContents(event.sender),
        updatedSession.id,
        'ico',
      );

      return mapIcoProjectSessionToDto(updatedSession);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.resetIcoProject,
    async (event, projectId: string): Promise<IcoProjectDto> => {
      const session = requireIcoProject(projectId);
      const parentWindow = BrowserWindow.fromWebContents(event.sender);

      if (session.isDirty) {
        const decision = await showDiscardProjectChangesPrompt(parentWindow, {
          action: 'reset',
          projectName: session.name,
          format: 'ico',
        });

        if (decision === 'cancel') {
          return mapIcoProjectSessionToDto(session);
        }
      }

      const nextSession = resetIcoProject(session);
      const updatedSession = recordIcoProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcoProject(updatedSession);
      registerActiveProject(parentWindow, updatedSession.id, 'ico');

      return mapIcoProjectSessionToDto(updatedSession);
    },
  );
}

function requireIcoProject(projectId: string) {
  const session = iconProjectSessionStore.getIcoProject(projectId);

  if (!session) {
    throw new Error(
      'The requested ICO project is not available in this session.',
    );
  }

  return session;
}

function registerActiveProject(
  parentWindow: BrowserWindow | null,
  projectId: string,
  format: 'ico',
): void {
  if (!parentWindow) {
    return;
  }

  windowProjectRegistry.setActiveProject(parentWindow.id, {
    format,
    projectId,
  });
}
