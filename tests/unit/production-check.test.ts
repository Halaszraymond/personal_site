/**
 * Unit tests for the production-build check (spec: kalman-playground, "Dev-only availability").
 */
import { describe, expect, it } from 'vitest';
import { findPlaygroundLeaks, THREE_MARKER } from '../../scripts/lib/production-check';

const CLEAN = [
  { path: 'index.html', content: '<html></html>' },
  { path: '_astro/BaseLayout.abc123.js', content: 'const x=1;' },
];

describe('findPlaygroundLeaks', () => {
  it('passes a clean production build', () => {
    expect(findPlaygroundLeaks(CLEAN)).toEqual([]);
  });

  it('finds the playground page', () => {
    expect(
      findPlaygroundLeaks([...CLEAN, { path: 'playground/index.html', content: '<html></html>' }]),
    ).toEqual(['The playground is in the build: playground/index.html']);
  });

  it('finds Three.js code by its marker', () => {
    const chunk = { path: '_astro/three.module.xyz.js', content: `window.${THREE_MARKER}="186";` };
    expect(findPlaygroundLeaks([...CLEAN, chunk])).toEqual([
      'Three.js is in the build: _astro/three.module.xyz.js',
    ]);
  });

  it('ignores the marker in files that are not JavaScript', () => {
    expect(findPlaygroundLeaks([{ path: 'docs.txt', content: THREE_MARKER }])).toEqual([]);
  });
});
