/**
 * Unit tests for the production-build check (spec: kalman-preview, "Dev-only availability").
 */
import { describe, expect, it } from 'vitest';
import { findPreviewLeaks, PREVIEW_MARKER } from '../../scripts/lib/production-check';

const CLEAN = [
  { path: 'index.html', content: '<html></html>' },
  { path: '_astro/BaseLayout.abc123.js', content: 'const x=1;' },
];

describe('findPreviewLeaks', () => {
  it('passes a clean production build', () => {
    expect(findPreviewLeaks(CLEAN)).toEqual([]);
  });

  it('finds the preview page', () => {
    expect(
      findPreviewLeaks([...CLEAN, { path: 'playground/index.html', content: '<html></html>' }]),
    ).toEqual(['The preview is in the build: playground/index.html']);
  });

  it('reports a file inside the preview folder once, not twice', () => {
    const page = { path: 'playground/index.html', content: `<div data-${PREVIEW_MARKER}>` };
    expect(findPreviewLeaks([page])).toHaveLength(1);
  });

  it('finds preview code in a JavaScript chunk by its marker', () => {
    const chunk = { path: '_astro/preview.xyz.js', content: `q("[data-${PREVIEW_MARKER}]")` };
    expect(findPreviewLeaks([...CLEAN, chunk])).toEqual([
      'Preview code is in the build: _astro/preview.xyz.js',
    ]);
  });

  it('ignores the marker in files that are not code', () => {
    expect(findPreviewLeaks([{ path: 'docs.txt', content: PREVIEW_MARKER }])).toEqual([]);
  });
});
