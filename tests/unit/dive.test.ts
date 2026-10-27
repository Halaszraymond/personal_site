/**
 * Unit tests for the dive (src/lib/dive.ts): sections, scroll → depth, colours, Kálmán's state.
 * Scenario names in quotes are from the dive spec.
 */
import { describe, expect, it } from 'vitest';
import { contrast, luminance } from '../../src/lib/colour';
import { posesFor } from '../../src/scene/kalman/repo-rig';
import {
  accentFor,
  afterOneShot,
  BOTTOM_DEPTH,
  coloursAt,
  currentSection,
  depthAt,
  diveAnchors,
  diveState,
  initialState,
  middleDepth,
  MIN_CONTRAST,
  probePosition,
  SECTION_IDS,
  SECTIONS,
  STILL_POSES,
  TEXT_LIGHT,
  textFor,
  WATER_STOPS,
  waterAt,
  zoneAt,
  type DiveLayout,
  type DiveState,
  type Zone,
} from '../../src/lib/dive';

/** A page with sections of 1000 px, an ascent of 800 px, and Contact at the end. */
const LAYOUT: DiveLayout = {
  starts: { ice: 0, about: 1000, work: 2000, education: 3000, catch: 4000, contact: 5800 },
  catchBottom: 5000,
};
const ANCHORS = diveAnchors(LAYOUT);

describe('the sections', () => {
  it('are in page order with the depths of README §2.3', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual([...SECTION_IDS]);
    expect(SECTIONS.map((s) => s.depth)).toEqual([0, 0, 100, 250, 400, 0]);
    expect(SECTIONS.find((s) => s.id === 'catch')?.endDepth).toBe(BOTTOM_DEPTH);
  });

  it('each have a still pose that exists for the front figure', () => {
    for (const id of SECTION_IDS) {
      const name = STILL_POSES[id];
      expect(
        posesFor('front').some((pose) => pose.name === name),
        name,
      ).toBe(true);
    }
  });

  it('have a middle depth for the still dive', () => {
    expect(middleDepth('work')).toBe(175);
    expect(middleDepth('contact')).toBe(0);
  });
});

describe('depthAt', () => {
  it('"At the start of a section": each section starts at its depth', () => {
    expect(depthAt(LAYOUT.starts.about, ANCHORS)).toBe(0);
    expect(depthAt(LAYOUT.starts.work, ANCHORS)).toBe(100);
    expect(depthAt(LAYOUT.starts.education, ANCHORS)).toBe(250);
    expect(depthAt(LAYOUT.starts.catch, ANCHORS)).toBe(400);
  });

  it('interpolates in between', () => {
    expect(depthAt(2500, ANCHORS)).toBe(175);
  });

  it('"The ascent": goes back from 564 m to 0 m, reaching 0 m at Contact', () => {
    expect(depthAt(LAYOUT.catchBottom, ANCHORS)).toBe(BOTTOM_DEPTH);
    expect(depthAt(5400, ANCHORS)).toBe(BOTTOM_DEPTH / 2);
    expect(depthAt(LAYOUT.starts.contact, ANCHORS)).toBe(0);
  });

  it('clamps above the first and below the last anchor', () => {
    expect(depthAt(-500, ANCHORS)).toBe(0);
    expect(depthAt(99_999, ANCHORS)).toBe(0);
  });

  it('is continuous: one pixel never changes the depth by more than a step', () => {
    // The steepest stretch is the ascent: 564 m over 800 px, about 0.7 m per px.
    for (let probe = -10; probe <= 6000; probe += 1) {
      const step = Math.abs(depthAt(probe + 1, ANCHORS) - depthAt(probe, ANCHORS));
      expect(step).toBeLessThan(1);
    }
  });

  it('is 0 without anchors', () => {
    expect(depthAt(100, [])).toBe(0);
  });
});

describe('probePosition', () => {
  it('reads the middle of the viewport', () => {
    expect(probePosition(1000, 800, 10_000)).toBe(1400);
  });

  it('slides to the bottom of the page over the last half screen', () => {
    // Max scroll is 9200; at the very bottom the probe is the page's end.
    expect(probePosition(9200, 800, 10_000)).toBe(10_000);
    expect(probePosition(8800, 800, 10_000)).toBe(9200);
    expect(probePosition(9000, 800, 10_000)).toBe(9600);
  });
});

describe('zoneAt and currentSection', () => {
  it('finds the section, and the ascent between The catch and Contact', () => {
    expect(zoneAt(10, LAYOUT)).toBe('ice');
    expect(zoneAt(3500, LAYOUT)).toBe('education');
    expect(zoneAt(4999, LAYOUT)).toBe('catch');
    expect(zoneAt(5000, LAYOUT)).toBe('ascent');
    expect(zoneAt(5900, LAYOUT)).toBe('contact');
  });

  it('marks Contact in the gauge during the ascent', () => {
    expect(currentSection('ascent')).toBe('contact');
    expect(currentSection('work')).toBe('work');
  });
});

describe('the water', () => {
  it('hits each colour stop at its depth', () => {
    for (const stop of WATER_STOPS) expect(waterAt(stop.depth)).toBe(stop.colour);
  });

  it('stays at the ends beyond the stops', () => {
    expect(waterAt(-5)).toBe(WATER_STOPS[0]?.colour);
    expect(waterAt(9000)).toBe(WATER_STOPS.at(-1)?.colour);
  });

  it('gets darker all the way down', () => {
    for (let depth = 1; depth <= BOTTOM_DEPTH; depth += 1) {
      expect(luminance(waterAt(depth))).toBeLessThanOrEqual(luminance(waterAt(depth - 1)) + 1e-9);
    }
  });

  it('"Deep down": in The catch the water is close to ink black and the text is light', () => {
    for (let depth = 400; depth <= BOTTOM_DEPTH; depth += 10) {
      const water = waterAt(depth);
      expect(luminance(water)).toBeLessThan(0.02);
      expect(textFor(water)).toBe(TEXT_LIGHT);
    }
  });

  it('"Contrast at every depth": text and accent reach 4.5:1 at every metre', () => {
    for (let depth = 0; depth <= BOTTOM_DEPTH; depth += 1) {
      const { water, text, accent } = coloursAt(depth);
      expect(contrast(text, water), `text at ${depth} m`).toBeGreaterThanOrEqual(MIN_CONTRAST);
      expect(contrast(accent, water), `accent at ${depth} m`).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
  });

  it('keeps the golden accent itself in the deep', () => {
    expect(accentFor(waterAt(BOTTOM_DEPTH))).toBe('#f2a33a');
  });
});

describe('diveState', () => {
  /** Scrolls down through `steps` from `start`; 'finish' ends the one-shot that plays. */
  function scrollDown(start: DiveState, steps: readonly (Zone | 'finish')[]): DiveState {
    let state = start;
    for (const step of steps) {
      state = step === 'finish' ? afterOneShot(state) : diveState(state, step, 'down');
    }
    return state;
  }

  it('starts on the ice, ashore at Contact, and swimming anywhere else', () => {
    expect(initialState('ice')).toBe('onIce');
    expect(initialState('contact')).toBe('ashore');
    expect(initialState('work')).toBe('swimming');
  });

  it('"The first scroll": he dives, then swims', () => {
    expect(diveState('onIce', 'ice', 'down')).toBe('diving');
    // The dive goes on while the visitor keeps scrolling down, into the sections below.
    expect(diveState('diving', 'about', 'down')).toBe('diving');
    expect(afterOneShot('diving')).toBe('swimming');
    expect(diveState('swimming', 'work', 'down')).toBe('swimming');
  });

  it('holds still while nothing scrolls', () => {
    expect(diveState('diving', 'ice', 'none')).toBe('diving');
    expect(diveState('onIce', 'ice', 'none')).toBe('onIce');
  });

  it('"The ascent": he launches, then stands on the ice at Contact', () => {
    expect(diveState('swimming', 'ascent', 'down')).toBe('launching');
    expect(diveState('launching', 'ascent', 'down')).toBe('launching');
    expect(diveState('launching', 'contact', 'down')).toBe('launching');
    expect(afterOneShot('launching')).toBe('ashore');
    expect(diveState('ashore', 'contact', 'down')).toBe('ashore');
    expect(diveState('ashore', 'contact', 'up')).toBe('ashore');
  });

  it('launches when an express dive lands at Contact', () => {
    expect(diveState('onIce', 'contact', 'down')).toBe('launching');
    expect(diveState('swimming', 'contact', 'down')).toBe('launching');
  });

  it('"Scrolling back up": back up into The ice, he stands on it again', () => {
    expect(diveState('swimming', 'work', 'up')).toBe('swimming');
    expect(diveState('swimming', 'ice', 'up')).toBe('onIce');
  });

  it('swims again when scrolling back up from Contact into the ascent', () => {
    expect(diveState('ashore', 'ascent', 'up')).toBe('swimming');
  });

  it('cuts a one-shot short when the visitor reverses', () => {
    expect(diveState('diving', 'ice', 'up')).toBe('onIce');
    expect(diveState('diving', 'about', 'up')).toBe('swimming');
    expect(diveState('launching', 'ascent', 'up')).toBe('swimming');
  });

  it('leaves the steady states alone when a one-shot finishes', () => {
    expect(afterOneShot('swimming')).toBe('swimming');
    expect(afterOneShot('onIce')).toBe('onIce');
  });

  it('follows a whole dive down and back up', () => {
    const state = scrollDown('onIce', [
      'ice',
      'about',
      'finish',
      'work',
      'catch',
      'ascent',
      'contact',
    ]);
    expect(state).toBe('launching');
    expect(afterOneShot(state)).toBe('ashore');
  });
});
