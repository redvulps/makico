import { app } from 'electron';

import { registerAppEvents } from './app/registerAppEvents';
import { registerAppInfoIpc } from './ipc/registerAppInfoIpc';
import { registerIcoProjectIpc } from './ipc/registerIcoProjectIpc';
import { registerIcnsProjectIpc } from './ipc/registerIcnsProjectIpc';
import { registerProjectHistoryIpc } from './ipc/registerProjectHistoryIpc';
import { registerWindowIpc } from './ipc/registerWindowIpc';
import { registerWorkbenchIpc } from './ipc/registerWorkbenchIpc';
import { registerWorkbenchSettingsIpc } from './ipc/registerWorkbenchSettingsIpc';

app.setName('Makico');

registerAppInfoIpc();
registerWindowIpc();
registerWorkbenchIpc();
registerWorkbenchSettingsIpc();
registerIcoProjectIpc();
registerIcnsProjectIpc();
registerProjectHistoryIpc();
registerAppEvents();
