/**
 * The playground's behaviour in the browser: connects the controls, the 3D view,
 * Reset, Copy config, the swim preview and the stored values.
 *
 * The flow on every change: read all controls into a config → validate it → update the
 * shown values, the JSON and the stored copy → give the view the new config.
 * Everything the playground knows lives in that one config object.
 */
import {
  exportConfig,
  formatValue,
  importConfig,
  KALMAN_PARAMETERS,
  validateConfig,
  type KalmanConfig,
} from '../lib/kalman-config';
import { PLAYGROUND_EN as TEXT } from '../i18n/playground';
import { createKalmanView, type KalmanView } from '../scene/kalman/kalman-view';
import { repoConfig } from '../scene/kalman/repo-config';
import { detectWebGL2 } from '../scene/webgl';

/** Where the current values are kept between visits. The version suffix allows a clean break later. */
const STORAGE_KEY = 'kalman.playground.v1';

/** Finds an element the page is built with; a missing one is a bug in the page, so it throws. */
function required<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Playground element missing: ${selector}`);
  return element;
}

/** The stored config, or null when there is none, it is unreadable or no longer valid. */
function loadStored(): KalmanConfig | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return null;
    const result = importConfig(stored);
    return result.ok ? result.config : null; // outdated values: quietly start from the repo
  } catch {
    return null; // storage blocked
  }
}

function store(config: KalmanConfig | null): void {
  try {
    if (config === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, exportConfig(config));
  } catch {
    // Storage blocked: the playground still works, it just won't remember.
  }
}

export function startPlayground(): void {
  const form = required<HTMLFormElement>('[data-controls]');
  const canvas = required<HTMLCanvasElement>('[data-view] canvas');
  const noWebGL = required<HTMLElement>('[data-no-webgl]');
  const json = required<HTMLTextAreaElement>('[data-config-json]');
  const status = required<HTMLElement>('[data-status]');
  const swimButton = required<HTMLButtonElement>('[data-action="swim"]');
  const resetViewButton = required<HTMLButtonElement>('[data-action="reset-view"]');

  /** The control element of one parameter. */
  const controlOf = (key: string) => required<HTMLInputElement>(`[data-param="${key}"]`, form);

  /** Reads every control into a config candidate (validated by the caller). */
  function readControls(): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    for (const parameter of KALMAN_PARAMETERS) {
      const control = controlOf(parameter.key);
      values[parameter.key] =
        parameter.kind === 'range'
          ? control.valueAsNumber
          : parameter.kind === 'switch'
            ? control.checked
            : control.value;
    }
    return values;
  }

  /** Puts a config into the controls and their shown values. */
  function writeControls(config: KalmanConfig): void {
    for (const parameter of KALMAN_PARAMETERS) {
      const control = controlOf(parameter.key);
      const value = config[parameter.key];
      if (parameter.kind === 'switch') control.checked = value === true;
      else control.value = String(value);
    }
    updateOutputs(config);
  }

  function updateOutputs(config: KalmanConfig): void {
    for (const parameter of KALMAN_PARAMETERS) {
      if (parameter.kind !== 'range') continue;
      const output = form.querySelector(`[data-output="${parameter.key}"]`);
      if (output !== null) output.textContent = formatValue(config[parameter.key], parameter.step);
    }
    json.value = exportConfig(config);
  }

  const repo = repoConfig();
  let config = loadStored() ?? repo;
  writeControls(config);

  // Without WebGL2, explain instead of showing an empty canvas; the controls keep working.
  let view: KalmanView | null = null;
  if (detectWebGL2()) {
    try {
      view = createKalmanView(canvas, config);
    } catch {
      // A browser can report WebGL2 and still fail to start it (old drivers, blocked GPU).
      view = null;
    }
  }
  if (view === null) {
    canvas.hidden = true;
    noWebGL.hidden = false;
    swimButton.disabled = true;
    resetViewButton.disabled = true;
  }

  /** Applies a valid config everywhere. */
  function apply(next: KalmanConfig): void {
    config = next;
    updateOutputs(config);
    view?.setConfig(config);
  }

  form.addEventListener('input', () => {
    const result = validateConfig(readControls());
    // The controls can only produce valid values; this guards against a browser quirk.
    if (!result.ok) return;
    apply(result.config);
    store(config);
  });

  required<HTMLButtonElement>('[data-action="reset"]').addEventListener('click', () => {
    writeControls(repo);
    apply(repo);
    store(null); // the next visit starts from the repo config too
  });

  required<HTMLButtonElement>('[data-action="copy"]').addEventListener('click', () => {
    navigator.clipboard
      .writeText(exportConfig(config))
      .then(() => {
        status.textContent = TEXT.copied;
      })
      .catch(() => {
        status.textContent = TEXT.copyRefused;
        json.focus();
        json.select();
      });
  });

  resetViewButton.addEventListener('click', () => view?.resetView());

  // The swim preview always starts paused: calm by default, and required with reduced motion.
  swimButton.addEventListener('click', () => {
    const swimming = swimButton.getAttribute('aria-pressed') !== 'true';
    swimButton.setAttribute('aria-pressed', String(swimming));
    swimButton.textContent = swimming ? TEXT.swimPause : TEXT.swimPlay;
    view?.setSwimming(swimming);
  });
}
