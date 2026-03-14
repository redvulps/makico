import { contextBridge } from 'electron';

import { appApi } from './api/appApi';

contextBridge.exposeInMainWorld('appApi', appApi);
