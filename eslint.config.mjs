import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginCypress from 'eslint-plugin-cypress/flat';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'cypress/reports/**',
      'cypress/evidencias/**',
      'cypress/screenshots/**',
      'cypress/videos/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['cypress/**/*.ts', 'cypress.config.ts'],
    extends: [pluginCypress.configs.recommended],
    rules: {
      // O preprocessador Cucumber registra steps fora de blocos describe/it.
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
      },
    },
  },
);
