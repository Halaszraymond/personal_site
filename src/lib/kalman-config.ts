/**
 * Kálmán's config: which parameters shape him, their allowed values, and how a
 * config is checked and moved around as JSON.
 *
 * One table (KALMAN_PARAMETERS) is the single source of truth: the config type,
 * the defaults, the validation and the playground's controls are all derived from it,
 * so they can never disagree (spec: kalman-config). Pure logic, unit-tested.
 *
 * The ranges are chosen so that every valid config still looks like an emperor
 * penguin: the ear-patch hue stays golden-orange, its intensity never reaches zero,
 * and the black, white and bill-stripe colours are not parameters at all.
 */

/** A number chosen with a slider. */
interface RangeDefinition {
  kind: 'range';
  key: string;
  group: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

/** Something that is on or off. */
interface SwitchDefinition {
  kind: 'switch';
  key: string;
  group: string;
  default: boolean;
}

/** A colour as `#rrggbb`. */
interface ColourDefinition {
  kind: 'colour';
  key: string;
  group: string;
  default: string;
}

export type ParameterDefinition = RangeDefinition | SwitchDefinition | ColourDefinition;

/**
 * Every parameter, in the order the playground shows them. Sizes are multipliers
 * (1 = the starting proposal); angles are degrees, speeds strokes per second.
 *
 * `as const` keeps the exact keys and kinds, so TypeScript can derive the config type
 * below; `satisfies` checks each entry against ParameterDefinition without losing them.
 */
export const KALMAN_PARAMETERS = [
  { kind: 'range', key: 'bodyHeight', group: 'body', min: 0.85, max: 1.15, step: 0.01, default: 1 },
  { kind: 'range', key: 'bodyGirth', group: 'body', min: 0.85, max: 1.25, step: 0.01, default: 1 },
  { kind: 'range', key: 'bellyRoundness', group: 'body', min: 0, max: 1, step: 0.05, default: 0.5 },
  { kind: 'range', key: 'headSize', group: 'head', min: 0.85, max: 1.2, step: 0.01, default: 1 },
  { kind: 'range', key: 'billLength', group: 'bill', min: 0.8, max: 1.3, step: 0.01, default: 1 },
  {
    kind: 'range',
    key: 'billThickness',
    group: 'bill',
    min: 0.8,
    max: 1.25,
    step: 0.01,
    default: 1,
  },
  { kind: 'range', key: 'billDroop', group: 'bill', min: 0, max: 1, step: 0.05, default: 0.35 },
  { kind: 'range', key: 'earPatchHue', group: 'earPatch', min: 30, max: 50, step: 1, default: 40 },
  {
    kind: 'range',
    key: 'earPatchIntensity',
    group: 'earPatch',
    min: 0.5,
    max: 1,
    step: 0.05,
    default: 0.9,
  },
  {
    kind: 'range',
    key: 'earPatchSpread',
    group: 'earPatch',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.5,
  },
  { kind: 'range', key: 'faceting', group: 'facets', min: 0, max: 3, step: 1, default: 1 },
  {
    kind: 'range',
    key: 'flipperLength',
    group: 'flippers',
    min: 0.85,
    max: 1.2,
    step: 0.01,
    default: 1,
  },
  { kind: 'range', key: 'strokeAmplitude', group: 'swim', min: 10, max: 50, step: 1, default: 30 },
  { kind: 'range', key: 'strokeSpeed', group: 'swim', min: 0.5, max: 2, step: 0.1, default: 1 },
  { kind: 'switch', key: 'tieOn', group: 'tie', default: false },
  { kind: 'colour', key: 'tieColour', group: 'tie', default: '#1f4e8c' },
  { kind: 'range', key: 'tieSize', group: 'tie', min: 0.8, max: 1.2, step: 0.01, default: 1 },
  { kind: 'switch', key: 'glassesOn', group: 'glasses', default: false },
  {
    kind: 'range',
    key: 'glassesSize',
    group: 'glasses',
    min: 0.85,
    max: 1.2,
    step: 0.01,
    default: 1,
  },
] as const satisfies readonly ParameterDefinition[];

type Parameter = (typeof KALMAN_PARAMETERS)[number];

/** The name of one parameter: 'bodyHeight' | 'bodyGirth' | ... */
export type ParameterKey = Parameter['key'];

/** The group a parameter belongs to: 'body' | 'head' | ... */
export type ParameterGroup = Parameter['group'];

/** The value type that belongs to a definition: ranges are numbers, switches booleans, colours strings. */
type ValueOf<P> = P extends { kind: 'range' }
  ? number
  : P extends { kind: 'switch' }
    ? boolean
    : string;

/**
 * A complete config: one value per parameter, with the right type for each.
 * TypeScript builds this from the table, like generating a dataclass from a schema in Python:
 * `{ bodyHeight: number; ...; tieOn: boolean; tieColour: string; ... }`.
 */
export type KalmanConfig = { [P in Parameter as P['key']]: ValueOf<P> };

/** The defaults from the table, as a config. */
export function defaultConfig(): KalmanConfig {
  // Object.fromEntries builds { key: value } from [key, value] pairs, like dict() in Python.
  // The cast is safe: the table has exactly one entry per key, each with a value of its own kind.
  return Object.fromEntries(
    KALMAN_PARAMETERS.map((parameter) => [parameter.key, parameter.default]),
  ) as KalmanConfig;
}

/**
 * The result of a check: either the valid config, or the reasons it is invalid.
 * Like returning `(config, None)` or `(None, errors)` in Python, but the type checker
 * makes sure the caller looks at `ok` before using either.
 */
export type ConfigResult = { ok: true; config: KalmanConfig } | { ok: false; errors: string[] };

/** Small tolerance for comparing decimals: 0.1 + 0.2 is not exactly 0.3 in floating point. */
const EPSILON = 1e-9;

const COLOUR_PATTERN = /^#[0-9a-f]{6}$/i;

/** Why one value is invalid for its definition, or `null` when it is fine. */
function problemWith(definition: ParameterDefinition, value: unknown): string | null {
  switch (definition.kind) {
    case 'range': {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return `${definition.key} must be a number`;
      }
      if (value < definition.min - EPSILON || value > definition.max + EPSILON) {
        return `${definition.key} must be between ${definition.min} and ${definition.max} (got ${value})`;
      }
      // The value must land on the slider's grid: min, min + step, min + 2 × step, ...
      const steps = (value - definition.min) / definition.step;
      if (Math.abs(steps - Math.round(steps)) > 1e-6) {
        return `${definition.key} must be a multiple of ${definition.step} from ${definition.min} (got ${value})`;
      }
      return null;
    }
    case 'switch':
      return typeof value === 'boolean' ? null : `${definition.key} must be true or false`;
    case 'colour':
      return typeof value === 'string' && COLOUR_PATTERN.test(value)
        ? null
        : `${definition.key} must be a colour like #1f4e8c`;
  }
}

/** True for a plain `{ ... }` object (not null, not an array). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Checks a config, collecting every problem instead of stopping at the first one. */
export function validateConfig(input: unknown): ConfigResult {
  if (!isPlainObject(input)) {
    return { ok: false, errors: ['The config must be an object with one value per parameter'] };
  }

  const errors: string[] = [];
  const knownKeys = new Set<string>(KALMAN_PARAMETERS.map((parameter) => parameter.key));

  for (const key of Object.keys(input)) {
    if (!knownKeys.has(key)) {
      errors.push(`${key} is not a known parameter`);
    }
  }
  for (const definition of KALMAN_PARAMETERS) {
    if (!(definition.key in input)) {
      errors.push(`${definition.key} is missing`);
      continue;
    }
    const problem = problemWith(definition, input[definition.key]);
    if (problem !== null) {
      errors.push(problem);
    }
  }

  // Every key is known, present and of the right type, so the cast describes the data truthfully.
  return errors.length === 0 ? { ok: true, config: input as KalmanConfig } : { ok: false, errors };
}

/**
 * A slider value as text, with as many decimals as its step has: 1.05 for step 0.01,
 * 0.5 for step 0.05, 30 for step 1. Avoids showing 1.0500000000000003.
 */
export function formatValue(value: number, step: number): string {
  const decimals = Math.max(0, Math.ceil(-Math.log10(step) - 1e-9));
  return value.toFixed(decimals);
}

/** The JSON format version. Raise it when the format changes in a way old files can't follow. */
export const CONFIG_FORMAT_VERSION = 1;

/** A config as JSON: `{ "version": 1, "values": { ... } }`, pretty-printed for readable diffs. */
export function exportConfig(config: KalmanConfig): string {
  return `${JSON.stringify({ version: CONFIG_FORMAT_VERSION, values: config }, null, 2)}\n`;
}

/** Reads JSON made by exportConfig(), checking the version and every value. */
export function importConfig(json: string): ConfigResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, errors: ['This is not valid JSON'] };
  }
  if (!isPlainObject(parsed)) {
    return { ok: false, errors: ['Expected an object like { "version": 1, "values": { ... } }'] };
  }
  if (parsed['version'] !== CONFIG_FORMAT_VERSION) {
    return {
      ok: false,
      errors: [
        `Unsupported format version ${String(parsed['version'])}; supported: ${CONFIG_FORMAT_VERSION}`,
      ],
    };
  }
  return validateConfig(parsed['values']);
}
