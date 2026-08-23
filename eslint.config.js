import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/*.cjs', 'apps/web/tools/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },

  // The API and its tooling run on Node.
  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // The web app runs in a browser: document, window, timers and observers are all defined
  // there, and flagging them as undefined was noise from the move into this workspace.
  {
    files: ['apps/web/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    rules: {
      // The web app is plain JavaScript; the TypeScript-specific rules do not apply.
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Vite config runs in Node even though it lives in the web app.
  {
    files: ['apps/web/*.config.js'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['**/test/**/*.ts', '**/*.test.ts'],
    rules: { 'no-console': 'off' },
  },
);
