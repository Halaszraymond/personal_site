/**
 * Unit tests for when the playground is part of the site (spec: kalman-playground,
 * "Dev-only availability").
 */
import { describe, expect, it } from 'vitest';
import { shouldIncludePlayground } from '../../src/lib/playground-flag';

describe('shouldIncludePlayground', () => {
  it('is always on in the development server', () => {
    expect(shouldIncludePlayground({ command: 'dev', flag: undefined })).toBe(true);
  });

  it('is on in a build with PLAYGROUND=1 (CI, branch previews)', () => {
    expect(shouldIncludePlayground({ command: 'build', flag: '1' })).toBe(true);
  });

  it('is off in a build without the flag (production)', () => {
    expect(shouldIncludePlayground({ command: 'build', flag: undefined })).toBe(false);
  });

  it('is off for any other flag value, so a typo never leaks the playground', () => {
    for (const flag of ['0', 'true', 'yes', '']) {
      expect(shouldIncludePlayground({ command: 'build', flag })).toBe(false);
    }
  });
});
