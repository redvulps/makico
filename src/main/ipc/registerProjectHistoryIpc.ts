import { redoIcnsProject } from '@application/use-cases/redoIcnsProject/redoIcnsProject';
import { redoIcoProject } from '@application/use-cases/redoIcoProject/redoIcoProject';
import { mapIcnsProjectSessionToDto } from '@application/use-cases/importIcns/importIcnsProject';
import { mapIcoProjectSessionToDto } from '@application/use-cases/importIco/importIcoProject';
import { undoIcnsProject } from '@application/use-cases/undoIcnsProject/undoIcnsProject';
import { undoIcoProject } from '@application/use-cases/undoIcoProject/undoIcoProject';
import { ipcMain } from 'electron';

import { IPC_CHANNELS } from '@shared/contracts/ipc';
import type { IconProjectDto } from '@shared/dto/iconProject';

import { iconProjectSessionStore } from '../system/iconProjectSessionStore';

export function registerProjectHistoryIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.undoIconProject,
    async (
      _event,
      projectId: string,
      format: IconProjectDto['format'],
    ): Promise<IconProjectDto> => {
      if (format === 'ico') {
        const session = requireIcoProject(projectId);
        const updatedSession = undoIcoProject(session);

        iconProjectSessionStore.saveIcoProject(updatedSession);

        return mapIcoProjectSessionToDto(updatedSession);
      }

      const session = requireIcnsProject(projectId);
      const updatedSession = undoIcnsProject(session);

      iconProjectSessionStore.saveIcnsProject(updatedSession);

      return mapIcnsProjectSessionToDto(updatedSession);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.redoIconProject,
    async (
      _event,
      projectId: string,
      format: IconProjectDto['format'],
    ): Promise<IconProjectDto> => {
      if (format === 'ico') {
        const session = requireIcoProject(projectId);
        const updatedSession = redoIcoProject(session);

        iconProjectSessionStore.saveIcoProject(updatedSession);

        return mapIcoProjectSessionToDto(updatedSession);
      }

      const session = requireIcnsProject(projectId);
      const updatedSession = redoIcnsProject(session);

      iconProjectSessionStore.saveIcnsProject(updatedSession);

      return mapIcnsProjectSessionToDto(updatedSession);
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

function requireIcnsProject(projectId: string) {
  const session = iconProjectSessionStore.getIcnsProject(projectId);

  if (!session) {
    throw new Error(
      'The requested ICNS project is not available in this session.',
    );
  }

  return session;
}
