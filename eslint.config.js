/**
 * ESLint configuration: the rules our code is checked against.
 *
 * ESLint finds likely bugs and unsafe patterns (like Ruff does for Python).
 * Formatting is not its job: Prettier owns that, and `eslint-config-prettier`
 * (last in the list) switches off every ESLint rule that would fight Prettier.
 *
 * Later entries in the list override earlier ones, like dict.update() in Python.
 */
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    // Generated output and reports: not our code, so never linted.
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'playwright-report/',
      'test-results/',
      '.lighthouse/',
    ],
  },
  js.configs.recommended,
  // The "strict" preset: recommended rules plus stricter ones that catch more bugs.
  tseslint.configs.strict,
  astro.configs.recommended,
  {
    rules: {
      // README §5.4: no `any`. `any` switches the type checker off for that value,
      // so a mistake there is only found when the site breaks.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  prettier,
);
