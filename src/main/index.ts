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

app.commandLine.appendSwitch('max-tiles', '8388608');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('num-raster-threads', '4');

registerAppInfoIpc();
registerWindowIpc();
registerWorkbenchIpc();
registerWorkbenchSettingsIpc();
registerIcoProjectIpc();
registerIcnsProjectIpc();
registerProjectHistoryIpc();
registerAppEvents();
