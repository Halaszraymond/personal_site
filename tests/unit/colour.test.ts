/**
 * Unit tests for the colour maths (src/lib/colour.ts).
 */
import { describe, expect, it } from 'vitest';
import { contrast, luminance, mixOklab, parseHex, readableOn, toHex } from '../../src/lib/colour';

describe('hex colours', () => {
  it('reads long and short hex, and writes it back', () => {
    expect(parseHex('#ff0000')).toEqual([1, 0, 0]);
    expect(toHex(parseHex('#0b1a2a'))).toBe('#0b1a2a');
    expect(toHex(parseHex('#fa0'))).toBe('#ffaa00');
  });

  it('refuses anything that is not a hex colour', () => {
    expect(() => parseHex('blue')).toThrow(/Not a hex colour/);
  });
});

describe('contrast', () => {
  it('matches the WCAG examples', () => {
    expect(luminance('#ffffff')).toBeCloseTo(1);
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21);
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1);
    // The same either way round.
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(contrast('#ffffff', '#767676'));
    expect(contrast('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
  });
});

describe('mixOklab', () => {
  it('gives the ends at 0 and 1', () => {
    expect(mixOklab('#cfe7f2', '#03070d', 0)).toBe('#cfe7f2');
    expect(mixOklab('#cfe7f2', '#03070d', 1)).toBe('#03070d');
  });

  it('keeps a blend between two blues blue, not grey', () => {
    const [r, , b] = parseHex(mixOklab('#2d6a92', '#081c30', 0.5));
    expect(b).toBeGreaterThan(r);
  });
});

describe('readableOn', () => {
  it('keeps a colour that is already readable', () => {
    expect(readableOn('#000000', '#ffffff', 4.5)).toBe('#000000');
  });

  it('lightens or darkens a colour just enough', () => {
    const adjusted = readableOn('#f2a33a', '#ffffff', 4.5);
    expect(contrast(adjusted, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(adjusted).not.toBe('#000000');
  });
});
