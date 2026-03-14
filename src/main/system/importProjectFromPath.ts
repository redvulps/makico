import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

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

import { appSettingsStore } from './appSettingsStore';
import { iconProjectSessionStore } from './iconProjectSessionStore';
import { windowProjectRegistry } from './windowProjectRegistry';

interface ImportProjectFromPathInput {
  readonly filePath: string;
  readonly parentWindow: BrowserWindow | null;
}

export async function importProjectFromPath(
  input: ImportProjectFromPathInput,
): Promise<IconProjectDto> {
  const fileExtension = path.extname(input.filePath).toLowerCase();
  const bytes = await readFile(input.filePath);

  if (fileExtension === '.ico') {
    const session = importIcoProject({
      projectId: randomUUID(),
      filePath: input.filePath,
      bytes,
    });

    iconProjectSessionStore.saveIcoProject(session);
    registerActiveProject(input.parentWindow, session.id, 'ico');
    await appSettingsStore.recordRecentProject(input.filePath, 'ico');

    return mapIcoProjectSessionToDto(session);
  }

  if (fileExtension === '.icns') {
    const session = importIcnsProject({
      projectId: randomUUID(),
      filePath: input.filePath,
      bytes,
    });

    iconProjectSessionStore.saveIcnsProject(session);
    registerActiveProject(input.parentWindow, session.id, 'icns');
    await appSettingsStore.recordRecentProject(input.filePath, 'icns');

    return mapIcnsProjectSessionToDto(session);
  }

  throw new Error(
    'Supported recent project files must use the .ico or .icns extension.',
  );
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
