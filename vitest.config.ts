/**
 * Vitest configuration: the unit tests (like pytest for Python).
 *
 * Unit tests cover the pure logic in `src/lib/` and `scripts/lib/`: functions
 * that take values and return values, without a browser. Browser behaviour is
 * tested end-to-end with Playwright in `tests/e2e/` instead.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
