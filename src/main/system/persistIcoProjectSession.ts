import { writeFile } from 'node:fs/promises';

import type { BrowserWindow } from 'electron';

import { exportIcoProject } from '@application/use-cases/exportIco/exportIcoProject';
import { markIcoProjectSaved } from '@application/use-cases/markIcoProjectSaved/markIcoProjectSaved';
import type { IcoProjectSession } from '@application/use-cases/importIco/importIcoProject';

import { saveIcoFileDialog } from '../dialogs/saveIcoFileDialog';
import { appSettingsStore } from './appSettingsStore';
import { createSuggestedIcoOutputPath } from './createSuggestedIcoOutputPath';

export interface PersistedIcoProjectResult {
  readonly outputPath: string;
  readonly session: IcoProjectSession;
}

export async function persistIcoProjectSession(
  session: IcoProjectSession,
  parentWindow: BrowserWindow | null,
): Promise<PersistedIcoProjectResult | null> {
  const { lastExportDirectory } = await appSettingsStore.getDialogDirectories();
  const outputPath = await saveIcoFileDialog(
    createSuggestedIcoOutputPath(session, lastExportDirectory),
    parentWindow,
  );

  if (!outputPath) {
    return null;
  }

  const bytes = exportIcoProject(session);
  await writeFile(outputPath, bytes);
  await appSettingsStore.recordExportPath(outputPath, 'ico');

  return {
    outputPath,
    session: markIcoProjectSaved(session, outputPath),
  };
}
