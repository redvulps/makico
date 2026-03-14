import { writeFile } from 'node:fs/promises';

import type { BrowserWindow } from 'electron';

import { exportIcnsProject } from '@application/use-cases/exportIcns/exportIcnsProject';
import { markIcnsProjectSaved } from '@application/use-cases/markIcnsProjectSaved/markIcnsProjectSaved';
import type { IcnsProjectSession } from '@application/use-cases/importIcns/importIcnsProject';

import { saveIcnsFileDialog } from '../dialogs/saveIcnsFileDialog';
import { appSettingsStore } from './appSettingsStore';
import { createSuggestedIcnsOutputPath } from './createSuggestedIcnsOutputPath';

export interface PersistedIcnsProjectResult {
  readonly outputPath: string;
  readonly session: IcnsProjectSession;
}

export async function persistIcnsProjectSession(
  session: IcnsProjectSession,
  parentWindow: BrowserWindow | null,
): Promise<PersistedIcnsProjectResult | null> {
  const { lastExportDirectory } = await appSettingsStore.getDialogDirectories();
  const outputPath = await saveIcnsFileDialog(
    createSuggestedIcnsOutputPath(session, lastExportDirectory),
    parentWindow,
  );

  if (!outputPath) {
    return null;
  }

  const bytes = exportIcnsProject(session);
  await writeFile(outputPath, bytes);
  await appSettingsStore.recordExportPath(outputPath, 'icns');

  return {
    outputPath,
    session: markIcnsProjectSaved(session, outputPath),
  };
}
