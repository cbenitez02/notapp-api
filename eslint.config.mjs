import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        project: ['./tsconfig.json', './tsconfig.test.json'],
      },
      globals: globals.node,
    },
    plugins: {
      js,
      '@typescript-eslint': tseslint.plugin,
      prettier,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Opcionales: tus reglas personalizadas
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
]);
