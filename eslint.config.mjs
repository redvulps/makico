// @ts-check

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { createNodeResolver, importX } from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['node_modules/**', 'out/**', 'dist/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
    plugins: {
      '@stylistic': stylistic,
    },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: './tsconfig.json',
        }),
        createNodeResolver(),
      ],
    },
    rules: {
      curly: ['error', 'all'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@stylistic/semi': ['error', 'always'],
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-named-as-default-member': 'off',
      'import-x/no-unresolved': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: [
      'src/main/**/*.ts',
      'src/preload/**/*.ts',
      'electron.vite.config.ts',
    ],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
);
