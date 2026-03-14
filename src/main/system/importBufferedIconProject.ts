import path from 'node:path';
import { randomUUID } from 'node:crypto';

import type { BrowserWindow } from 'electron';

import {
  importIcoProject,
  mapIcoProjectSessionToDto,
} from '@application/use-cases/importIco/importIcoProject';
import {
  importIcnsProject,
  mapIcnsProjectSessionToDto,
} from '@application/use-cases/importIcns/importIcnsProject';
import type { IconProjectDto } from '@shared/dto/iconProject';

import { iconProjectSessionStore } from './iconProjectSessionStore';
import { windowProjectRegistry } from './windowProjectRegistry';

interface ImportBufferedIconProjectInput {
  readonly parentWindow: BrowserWindow | null;
  readonly fileName: string;
  readonly bytes: Buffer;
}

export function importBufferedIconProject(
  input: ImportBufferedIconProjectInput,
): IconProjectDto {
  const normalizedExtension = path.extname(input.fileName).toLowerCase();
  const sourceName = path.basename(input.fileName);

  if (normalizedExtension === '.ico') {
    const session = importIcoProject({
      projectId: randomUUID(),
      filePath: null,
      sourceName,
      bytes: input.bytes,
    });

    iconProjectSessionStore.saveIcoProject(session);
    registerActiveProject(input.parentWindow, session.id, 'ico');

    return mapIcoProjectSessionToDto(session);
  }

  if (normalizedExtension === '.icns') {
    const session = importIcnsProject({
      projectId: randomUUID(),
      filePath: null,
      sourceName,
      bytes: input.bytes,
    });

    iconProjectSessionStore.saveIcnsProject(session);
    registerActiveProject(input.parentWindow, session.id, 'icns');

    return mapIcnsProjectSessionToDto(session);
  }

  throw new Error('Dropped files must use the .ico or .icns extension.');
}

function registerActiveProject(
  parentWindow: BrowserWindow | null,
  projectId: string,
  format: 'ico' | 'icns',
): void {
  if (!parentWindow) {
    return;
  }

  windowProjectRegistry.setActiveProject(parentWindow.id, {
    format,
    projectId,
  });
}
