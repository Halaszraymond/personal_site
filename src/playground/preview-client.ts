/**
 * The Kálmán preview in the browser: connects the controls to the figure
 * (spec: kalman-preview).
 *
 * The state is small: the last named pose chosen, the sliders' rotations, the mood and
 * whether the pivots show. After every change, render() works out the pose
 * (poseFromControls) and redraws the figure (applyPose); pose changes are immediate, so
 * there is no animation to switch off for reduced motion.
 */
import type { Mood, Pose } from '../lib/kalman-rig';
import { figureDescription, poseFromControls, poseToJson } from '../lib/preview-pose';
import { applyPose } from '../scene/kalman/kalman-figure-client';
import { poseNamed, REPO_RIG } from '../scene/kalman/repo-rig';
import { PREVIEW_EN as TEXT } from '../i18n/preview';

/** The preview's root element; its `data-kalman-preview` attribute is also the production-check marker. */
const root = document.querySelector<HTMLElement>('[data-kalman-preview]');
const figure = root === null ? null : root.querySelector<SVGSVGElement>('[data-kalman-figure]');

if (root !== null && figure !== null) {
  startPreview(root, figure);
}

function startPreview(root: HTMLElement, figure: SVGSVGElement): void {
  const poseButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-pose-button]')];
  const sliders = [...root.querySelectorAll<HTMLInputElement>('[data-rotation]')];
  const moodSwitch = root.querySelector<HTMLInputElement>('[data-mood-switch]');
  const pivotsSwitch = root.querySelector<HTMLInputElement>('[data-pivots-switch]');
  const copyButton = root.querySelector<HTMLButtonElement>('[data-copy-pose]');
  const copyStatus = root.querySelector<HTMLElement>('[data-copy-status]');
  const poseJson = root.querySelector<HTMLTextAreaElement>('[data-pose-json]');

  let base: Pose = poseNamed('rest');
  let current: Pose = base;

  const mood = (): Mood => (moodSwitch?.checked === true ? 'professional' : 'goofy');

  /** The sliders' values as layer name → degrees, like a dict comprehension in Python. */
  function rotations(): Record<string, number> {
    return Object.fromEntries(
      sliders.map((slider) => [slider.dataset['rotation'] ?? '', Number(slider.value)]),
    );
  }

  /** Sets every slider (and its shown value) to a pose's rotations. */
  function setSliders(pose: Pose): void {
    for (const slider of sliders) {
      const name = slider.dataset['rotation'] ?? '';
      slider.value = String(pose.layers[name]?.rotate ?? 0);
      showValue(slider);
    }
  }

  function showValue(slider: HTMLInputElement): void {
    const output = root.querySelector(
      `[data-rotation-value="${slider.dataset['rotation'] ?? ''}"]`,
    );
    if (output !== null) output.textContent = `${slider.value}°`;
  }

  /** Works out the pose from the controls and redraws everything that depends on it. */
  function render(): void {
    current = poseFromControls(base, rotations());
    const currentMood = mood();
    applyPose(figure, REPO_RIG, current, currentMood);
    const moodLabel = currentMood === 'professional' ? TEXT.moodProfessional : TEXT.moodGoofy;
    figure.setAttribute('aria-label', figureDescription(current, moodLabel));
    for (const button of poseButtons) {
      button.setAttribute('aria-pressed', String(button.dataset['poseButton'] === current.name));
    }
    if (poseJson !== null) poseJson.value = poseToJson(current);
  }

  for (const button of poseButtons) {
    button.addEventListener('click', () => {
      base = poseNamed(button.dataset['poseButton'] ?? 'rest');
      setSliders(base);
      render();
    });
  }

  for (const slider of sliders) {
    // `input` fires on every step while dragging or pressing an arrow key, not only at the end.
    slider.addEventListener('input', () => {
      showValue(slider);
      render();
    });
  }

  moodSwitch?.addEventListener('change', render);

  pivotsSwitch?.addEventListener('change', () => {
    // `toggleAttribute(name, on)` adds or removes the attribute; CSS shows the markers with it.
    figure.toggleAttribute('data-show-pivots', pivotsSwitch.checked);
  });

  copyButton?.addEventListener('click', () => {
    void copyPose();
  });

  /**
   * Copies the pose JSON. The clipboard can be refused (no permission, an insecure page, an
   * old browser); then the status says so and the JSON stays selectable in the text box.
   * `async`/`await` waits for the browser's answer, like `asyncio` in Python.
   */
  async function copyPose(): Promise<void> {
    const json = poseToJson(current);
    try {
      await navigator.clipboard.writeText(json);
      if (copyStatus !== null) copyStatus.textContent = TEXT.copied;
    } catch {
      if (copyStatus !== null) copyStatus.textContent = TEXT.copyFailed;
      poseJson?.select();
    }
  }

  render();
}
