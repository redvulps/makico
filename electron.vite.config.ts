import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'electron-vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const resolveFromRoot = (...segments: string[]): string =>
  path.join(projectRoot, ...segments);

const alias = {
  '@': resolveFromRoot('src/renderer'),
  '@application': resolveFromRoot('src/application'),
  '@domain': resolveFromRoot('src/domain'),
  '@infrastructure': resolveFromRoot('src/infrastructure'),
  '@shared': resolveFromRoot('src/shared'),
};

export default defineConfig({
  main: {
    resolve: {
      alias,
    },
  },
  preload: {
    resolve: {
      alias,
    },
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias,
    },
  },
});
