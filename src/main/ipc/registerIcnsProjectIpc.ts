import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { BrowserWindow, ipcMain } from 'electron';

import { addIcnsSlotFromPng } from '@application/use-cases/addIcnsSlotFromPng/addIcnsSlotFromPng';
import { addBlankIcnsSlot } from '@application/use-cases/addBlankIcnsSlot/addBlankIcnsSlot';
import { mapIcnsProjectSessionToDto } from '@application/use-cases/importIcns/importIcnsProject';
import { recordIcnsProjectRevision } from '@application/use-cases/recordIcnsProjectRevision/recordIcnsProjectRevision';
import { removeIcnsChunk } from '@application/use-cases/removeIcnsChunk/removeIcnsChunk';
import { replaceIcnsChunkWithPng } from '@application/use-cases/replaceIcnsChunkWithPng/replaceIcnsChunkWithPng';
import { resetIcnsProject } from '@application/use-cases/resetIcnsProject/resetIcnsProject';
import { IPC_CHANNELS } from '@shared/contracts/ipc';
import type {
  AddIcnsSlotResultDto,
  ExportIcnsResultDto,
  IcnsProjectDto,
} from '@shared/dto/iconProject';

import { openIcnsFileDialog } from '../dialogs/openIcnsFileDialog';
import { openPngFileDialog } from '../dialogs/openPngFileDialog';
import { appSettingsStore } from '../system/appSettingsStore';
import { showDiscardProjectChangesPrompt } from '../dialogs/showDiscardProjectChangesPrompt';
import { confirmActiveProjectDiscard } from '../system/confirmActiveProjectDiscard';
import { iconProjectSessionStore } from '../system/iconProjectSessionStore';
import { importProjectFromPath } from '../system/importProjectFromPath';
import { persistIcnsProjectSession } from '../system/persistIcnsProjectSession';
import { windowProjectRegistry } from '../system/windowProjectRegistry';

export function registerIcnsProjectIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.importIcns,
    async (event): Promise<IcnsProjectDto | null> => {
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      const canContinue = await confirmActiveProjectDiscard(parentWindow);

      if (!canContinue) {
        return null;
      }

      const { lastProjectDirectory } =
        await appSettingsStore.getDialogDirectories();
      const filePath = await openIcnsFileDialog(
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

      if (importedProject.format !== 'icns') {
        throw new Error('The selected file is not a valid ICNS project.');
      }

      return importedProject;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.exportIcns,
    async (event, projectId: string): Promise<ExportIcnsResultDto | null> => {
      const session = requireIcnsProject(projectId);
      const parentWindow = BrowserWindow.fromWebContents(event.sender);
      const persistedProject = await persistIcnsProjectSession(
        session,
        parentWindow,
      );

      if (!persistedProject) {
        return null;
      }

      iconProjectSessionStore.saveIcnsProject(persistedProject.session);

      return {
        outputPath: persistedProject.outputPath,
        project: mapIcnsProjectSessionToDto(persistedProject.session),
      };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.addIcnsSlotFromPng,
    async (
      event,
      projectId: string,
      chunkType: string,
    ): Promise<AddIcnsSlotResultDto | null> => {
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

      const session = requireIcnsProject(projectId);
      const pngBytes = await readFile(pngPath);
      await appSettingsStore.recordImageImportPath(pngPath);
      const addedChunkId = randomUUID();
      const nextSession = addIcnsSlotFromPng(
        session,
        addedChunkId,
        chunkType,
        pngBytes,
      );
      const updatedSession = recordIcnsProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcnsProject(updatedSession);
      registerActiveProject(parentWindow, updatedSession.id, 'icns');

      return {
        project: mapIcnsProjectSessionToDto(updatedSession),
        addedChunkId,
      };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.addBlankIcnsSlot,
    async (
      event,
      projectId: string,
      chunkType: string,
    ): Promise<AddIcnsSlotResultDto> => {
      const session = requireIcnsProject(projectId);
      const addedChunkId = randomUUID();
      const nextSession = addBlankIcnsSlot(session, addedChunkId, chunkType);
      const updatedSession = recordIcnsProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcnsProject(updatedSession);
      registerActiveProject(
        BrowserWindow.fromWebContents(event.sender),
        updatedSession.id,
        'icns',
      );

      return {
        project: mapIcnsProjectSessionToDto(updatedSession),
        addedChunkId,
      };
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.removeIcnsChunk,
    async (
      event,
      projectId: string,
      chunkId: string,
    ): Promise<IcnsProjectDto> => {
      const session = requireIcnsProject(projectId);
      const nextSession = removeIcnsChunk(session, chunkId);
      const updatedSession = recordIcnsProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcnsProject(updatedSession);
      registerActiveProject(
        BrowserWindow.fromWebContents(event.sender),
        updatedSession.id,
        'icns',
      );

      return mapIcnsProjectSessionToDto(updatedSession);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.replaceIcnsChunkWithPng,
    async (
      event,
      projectId: string,
      chunkId: string,
    ): Promise<IcnsProjectDto | null> => {
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

      const session = requireIcnsProject(projectId);
      const pngBytes = await readFile(pngPath);
      await appSettingsStore.recordImageImportPath(pngPath);
      const nextSession = replaceIcnsChunkWithPng(session, chunkId, pngBytes);
      const updatedSession = recordIcnsProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcnsProject(updatedSession);
      registerActiveProject(parentWindow, updatedSession.id, 'icns');

      return mapIcnsProjectSessionToDto(updatedSession);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.replaceIcnsChunkWithPngBytes,
    async (
      event,
      projectId: string,
      chunkId: string,
      bytes: Uint8Array,
    ): Promise<IcnsProjectDto> => {
      const session = requireIcnsProject(projectId);
      const nextSession = replaceIcnsChunkWithPng(
        session,
        chunkId,
        Buffer.from(bytes),
      );
      const updatedSession = recordIcnsProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcnsProject(updatedSession);
      registerActiveProject(
        BrowserWindow.fromWebContents(event.sender),
        updatedSession.id,
        'icns',
      );

      return mapIcnsProjectSessionToDto(updatedSession);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.resetIcnsProject,
    async (event, projectId: string): Promise<IcnsProjectDto> => {
      const session = requireIcnsProject(projectId);
      const parentWindow = BrowserWindow.fromWebContents(event.sender);

      if (session.isDirty) {
        const decision = await showDiscardProjectChangesPrompt(parentWindow, {
          action: 'reset',
          projectName: session.name,
          format: 'icns',
        });

        if (decision === 'cancel') {
          return mapIcnsProjectSessionToDto(session);
        }
      }

      const nextSession = resetIcnsProject(session);
      const updatedSession = recordIcnsProjectRevision(session, nextSession);

      iconProjectSessionStore.saveIcnsProject(updatedSession);
      registerActiveProject(parentWindow, updatedSession.id, 'icns');

      return mapIcnsProjectSessionToDto(updatedSession);
    },
  );
}

function registerActiveProject(
  parentWindow: BrowserWindow | null,
  projectId: string,
  format: 'icns',
): void {
  if (!parentWindow) {
    return;
  }

  windowProjectRegistry.setActiveProject(parentWindow.id, {
    format,
    projectId,
  });
}

function requireIcnsProject(projectId: string) {
  const session = iconProjectSessionStore.getIcnsProject(projectId);

  if (!session) {
    throw new Error(
      'The requested ICNS project is not available in this session.',
    );
  }

  return session;
}
