/**
 * Unit tests for Kálmán's config (spec: kalman-config): the parameter table, validation,
 * the JSON format, and the config file in the repo.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONFIG_FORMAT_VERSION,
  defaultConfig,
  exportConfig,
  formatValue,
  importConfig,
  KALMAN_PARAMETERS,
  validateConfig,
} from '../../src/lib/kalman-config';

/** The errors of a result that is expected to fail. */
function errorsOf(input: unknown): string[] {
  const result = validateConfig(input);
  if (result.ok) throw new Error('Expected validation to fail');
  return result.errors;
}

describe('the parameter table', () => {
  it('has unique keys', () => {
    const keys = KALMAN_PARAMETERS.map((parameter) => parameter.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('puts every range default inside its range', () => {
    for (const parameter of KALMAN_PARAMETERS) {
      if (parameter.kind !== 'range') continue;
      expect(parameter.min).toBeLessThan(parameter.max);
      expect(parameter.default).toBeGreaterThanOrEqual(parameter.min);
      expect(parameter.default).toBeLessThanOrEqual(parameter.max);
    }
  });

  it('keeps the ear patch golden-orange and never invisible', () => {
    const hue = KALMAN_PARAMETERS.find((parameter) => parameter.key === 'earPatchHue');
    const intensity = KALMAN_PARAMETERS.find((parameter) => parameter.key === 'earPatchIntensity');
    expect(hue).toMatchObject({ min: 30, max: 50 });
    expect(intensity?.kind === 'range' && intensity.min).toBeGreaterThan(0);
  });
});

describe('validateConfig', () => {
  it('accepts the defaults', () => {
    expect(validateConfig(defaultConfig())).toEqual({ ok: true, config: defaultConfig() });
  });

  it('names a value out of range with its allowed range', () => {
    expect(errorsOf({ ...defaultConfig(), headSize: 1.5 })).toEqual([
      'headSize must be between 0.85 and 1.2 (got 1.5)',
    ]);
  });

  it('names both an unknown and a missing parameter', () => {
    // A copy with one key too many and one missing, like `del config['billLength']` in Python.
    const config: Record<string, unknown> = { ...defaultConfig(), wingspan: 3 };
    delete config['billLength'];
    const errors = errorsOf(config);
    expect(errors).toContain('wingspan is not a known parameter');
    expect(errors).toContain('billLength is missing');
  });

  it('rejects wrong types', () => {
    const errors = errorsOf({
      ...defaultConfig(),
      tieOn: 'yes',
      bodyHeight: '1',
      tieColour: 'blue',
    });
    expect(errors).toEqual([
      'bodyHeight must be a number',
      'tieOn must be true or false',
      'tieColour must be a colour like #1f4e8c',
    ]);
  });

  it('rejects values off the slider grid, such as half a faceting level', () => {
    expect(errorsOf({ ...defaultConfig(), faceting: 1.5 })).toEqual([
      'faceting must be a multiple of 1 from 0 (got 1.5)',
    ]);
  });

  it('accepts decimals that are on the grid despite floating-point noise', () => {
    expect(validateConfig({ ...defaultConfig(), strokeSpeed: 0.1 + 0.2 + 1 }).ok).toBe(true);
  });

  it('rejects something that is not an object', () => {
    expect(validateConfig([1, 2]).ok).toBe(false);
    expect(validateConfig(null).ok).toBe(false);
  });
});

describe('JSON format', () => {
  it('round-trips a config exactly', () => {
    const config = { ...defaultConfig(), headSize: 1.1, tieOn: true, tieColour: '#aa3300' };
    expect(importConfig(exportConfig(config))).toEqual({ ok: true, config });
  });

  it('writes the format version', () => {
    expect(JSON.parse(exportConfig(defaultConfig()))).toMatchObject({
      version: CONFIG_FORMAT_VERSION,
    });
  });

  it('refuses an unknown version and says which one is supported', () => {
    const json = JSON.stringify({ version: 99, values: defaultConfig() });
    expect(importConfig(json)).toEqual({
      ok: false,
      errors: ['Unsupported format version 99; supported: 1'],
    });
  });

  it('refuses text that is not JSON', () => {
    expect(importConfig('{ not json')).toEqual({ ok: false, errors: ['This is not valid JSON'] });
  });
});

describe('formatValue', () => {
  it('shows as many decimals as the step has', () => {
    expect(formatValue(1.0500000000000003, 0.01)).toBe('1.05');
    expect(formatValue(0.5, 0.05)).toBe('0.50');
    expect(formatValue(1.2, 0.1)).toBe('1.2');
    expect(formatValue(30, 1)).toBe('30');
  });
});

describe('the config file in the repo', () => {
  it('validates', () => {
    const result = importConfig(readFileSync('src/scene/kalman/kalman.config.json', 'utf8'));
    expect(result.ok ? [] : result.errors).toEqual([]);
  });
});
