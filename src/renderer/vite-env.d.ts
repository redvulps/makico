/// <reference types="vite/client" />

import type { AppApi } from '@shared/contracts/ipc';

declare global {
  interface Window {
    appApi: AppApi;
  }
}

export {};
