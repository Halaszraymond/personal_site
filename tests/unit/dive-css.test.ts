/**
 * Unit tests for the dive's build-time stylesheet (src/lib/dive-css.ts).
 */
import { describe, expect, it } from 'vitest';
import { coloursAt, middleDepth, SECTION_IDS } from '../../src/lib/dive';
import {
  diveStylesheet,
  GAUGE_TRACK_END,
  gaugeFraction,
  gaugePosition,
} from '../../src/lib/dive-css';

describe('the gauge', () => {
  it('runs from the surface to 564 m along its track', () => {
    expect(gaugeFraction(0)).toBe(0);
    expect(gaugeFraction(564)).toBe(GAUGE_TRACK_END);
    expect(gaugeFraction(-3)).toBe(0);
    expect(gaugeFraction(900)).toBe(GAUGE_TRACK_END);
  });

  it('puts the sections in page order, with Contact at the end', () => {
    const positions = SECTION_IDS.map(gaugePosition);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(gaugePosition('ice')).toBe(0);
    expect(gaugePosition('contact')).toBe(1);
  });
});

describe('diveStylesheet', () => {
  const css = diveStylesheet();

  it('gives every section the colours of its middle depth', () => {
    for (const id of SECTION_IDS) {
      const { water, text } = coloursAt(middleDepth(id));
      expect(css).toContain(
        `[data-section='${id}'] { --section-water: ${water}; --section-text: ${text};`,
      );
    }
  });

  it('places every gauge entry', () => {
    for (const id of SECTION_IDS) {
      expect(css).toContain(`[data-gauge-entry='${id}'] { --at: ${gaugePosition(id)}; }`);
    }
  });

  it('starts at the surface', () => {
    expect(css).toContain(`--water: ${coloursAt(0).water};`);
  });
});
