import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const resolveFromRoot = (...segments: string[]): string =>
  path.join(projectRoot, ...segments);

export default defineConfig({
  resolve: {
    alias: {
      '@': resolveFromRoot('src/renderer'),
      '@application': resolveFromRoot('src/application'),
      '@domain': resolveFromRoot('src/domain'),
      '@infrastructure': resolveFromRoot('src/infrastructure'),
      '@shared': resolveFromRoot('src/shared'),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
