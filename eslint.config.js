import js from '@eslint/js';
import globals from 'globals';

const googleAppsScriptGlobals = {
  SpreadsheetApp: 'readonly',
  ScriptApp: 'readonly',
  Logger: 'readonly',
  MailApp: 'readonly',
  PropertiesService: 'readonly',
  Session: 'readonly',
  Utilities: 'readonly',
};

export default [
  js.configs.recommended,
  {
    files: ['lib/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.vitest },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.gs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: googleAppsScriptGlobals,
    },
    rules: {
      // Apps Script merges all .gs files; entry points and cross-file calls look unused to ESLint.
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      'no-undef': 'off',
    },
  },
];
