/**
 * The Kálmán preview in the browser: connects the controls to the figure and the player
 * (spec: kalman-preview).
 *
 * Two kinds of state live here:
 * - **posing:** the chosen figure (front or side), the last named pose, the sliders' rotations,
 *   the mood, the pivots, the turn and the spin. render() works out the pose (poseFromControls)
 *   and draws it; pose changes are immediate.
 * - **playing:** the player (kalman-player.ts) runs one animation at a time with GSAP. The idle
 *   loop plays while nothing else does and the front figure is chosen, unless the switch is off;
 *   with reduced motion it starts off, so nothing moves until a play button is pressed.
 */
import { playLength, type Animation } from '../lib/kalman-animation';
import type { Figure, Mood, Pose } from '../lib/kalman-rig';
import { normaliseAngle, turntableFrame } from '../lib/kalman-turntable';
import {
  animationDescription,
  figureDescription,
  poseFromControls,
  poseToJson,
} from '../lib/preview-pose';
import { PREVIEW_EN as TEXT } from '../i18n/preview';
import { applyFigure, applyPose, applySpin, applyTurn } from '../scene/kalman/kalman-figure-client';
import { createPlayer } from '../scene/kalman/kalman-player';
import {
  poseNamed,
  REPO_ANIMATIONS,
  REPO_RIG,
  REPO_RIGS,
  REPO_TURNTABLE,
} from '../scene/kalman/repo-rig';

/** The preview's root element; its `data-kalman-preview` attribute is also the production-check marker. */
const root = document.querySelector<HTMLElement>('[data-kalman-preview]');
const figure = root === null ? null : root.querySelector<SVGSVGElement>('[data-kalman-figure]');

if (root !== null && figure !== null) {
  startPreview(root, figure);
}

function startPreview(root: HTMLElement, figure: SVGSVGElement): void {
  const all = <T extends Element>(selector: string) => [...root.querySelectorAll<T>(selector)];
  const one = <T extends Element>(selector: string) => root.querySelector<T>(selector);

  const figureChoices = all<HTMLInputElement>('[data-figure-choice]');
  const animationButtons = all<HTMLButtonElement>('[data-animation-button]');
  const idleSwitch = one<HTMLInputElement>('[data-idle-switch]');
  const scrubSlider = one<HTMLInputElement>('[data-scrub-slider]');
  const scrubValue = one<HTMLElement>('[data-scrub-value]');
  const moodSwitch = one<HTMLInputElement>('[data-mood-switch]');
  const pivotsSwitch = one<HTMLInputElement>('[data-pivots-switch]');
  const turnSlider = one<HTMLInputElement>('[data-turn-slider]');
  const turnValue = one<HTMLElement>('[data-turn-value]');
  const spinSlider = one<HTMLInputElement>('[data-spin-slider]');
  const spinValue = one<HTMLElement>('[data-spin-value]');
  const copyButton = one<HTMLButtonElement>('[data-copy-pose]');
  const copyStatus = one<HTMLElement>('[data-copy-status]');
  const poseJson = one<HTMLTextAreaElement>('[data-pose-json]');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let chosen: Figure = 'front';
  let base: Pose = poseNamed('rest', chosen);
  let current: Pose = base;

  const mood = (): Mood => (moodSwitch?.checked === true ? 'professional' : 'goofy');
  const moodLabel = () => (mood() === 'professional' ? TEXT.moodProfessional : TEXT.moodGoofy);
  const player = createPlayer(figure, mood);

  // -------------------------------------------------------------------------------------
  // Posing: the chosen figure's pose buttons and sliders
  // -------------------------------------------------------------------------------------

  const poseGroup = (which: Figure) => one<HTMLElement>(`[data-figure-poses="${which}"]`);
  const sliderGroup = (which: Figure) => one<HTMLElement>(`[data-figure-sliders="${which}"]`);
  const poseButtons = () => [
    ...(poseGroup(chosen)?.querySelectorAll<HTMLButtonElement>('[data-pose-button]') ?? []),
  ];
  const sliders = () => [
    ...(sliderGroup(chosen)?.querySelectorAll<HTMLInputElement>('[data-rotation]') ?? []),
  ];

  /** The sliders' values as layer name → degrees, like a dict comprehension in Python. */
  function rotations(): Record<string, number> {
    return Object.fromEntries(
      sliders().map((slider) => [slider.dataset['rotation'] ?? '', Number(slider.value)]),
    );
  }

  /** Sets every slider of the chosen figure (and its shown value) to a pose's rotations. */
  function setSliders(pose: Pose): void {
    for (const slider of sliders()) {
      slider.value = String(pose.layers[slider.dataset['rotation'] ?? '']?.rotate ?? 0);
      showValue(slider);
    }
  }

  function showValue(slider: HTMLInputElement): void {
    const group = sliderGroup(chosen);
    const output = group?.querySelector(
      `[data-rotation-value="${slider.dataset['rotation'] ?? ''}"]`,
    );
    if (output !== null && output !== undefined) output.textContent = `${slider.value}°`;
  }

  /** The side he is seen from, for the description: the most visible view, or none at the front. */
  function seenFrom(turn: number): string | undefined {
    if (chosen !== 'front' || normaliseAngle(turn) === 0) return undefined;
    const frames = turntableFrame(REPO_TURNTABLE, turn);
    const main = [...frames].sort((a, b) => b.opacity - a.opacity)[0];
    const views: Record<string, string> = TEXT.views;
    return main === undefined ? undefined : views[main.name];
  }

  /** Sets the turn slider (and its shown value) and redraws. */
  function setTurn(degrees: number): void {
    if (turnSlider === null) return;
    turnSlider.value = String(Math.round(normaliseAngle(degrees)));
    if (turnValue !== null) turnValue.textContent = `${turnSlider.value}°`;
    render();
  }

  /** Works out the pose from the controls and draws everything that depends on it. */
  function render(): void {
    current = poseFromControls(base, rotations());
    applyFigure(figure, chosen);
    applyPose(figure, REPO_RIGS[chosen], current, mood());
    const turn = Number(turnSlider?.value ?? 0);
    applyTurn(figure, REPO_RIG, REPO_TURNTABLE, turn, mood());
    figure.setAttribute('aria-label', figureDescription(current, moodLabel(), seenFrom(turn)));
    for (const button of poseButtons()) {
      button.setAttribute('aria-pressed', String(button.dataset['poseButton'] === current.name));
    }
    if (poseJson !== null) poseJson.value = poseToJson(current);
  }

  /** Switches to posing: stops any animation and draws the posed figure. */
  function pose(): void {
    player.stop();
    markPlaying(undefined);
    render();
  }

  /** Shows one figure's pose buttons and sliders, and starts it at rest. */
  function chooseFigure(which: Figure): void {
    chosen = which;
    for (const other of ['front', 'side'] as const) {
      const hide = other !== which;
      poseGroup(other)?.toggleAttribute('hidden', hide);
      sliderGroup(other)?.toggleAttribute('hidden', hide);
    }
    // The turntable belongs to the front figure: back to the front view, and only usable there.
    if (turnSlider !== null) {
      turnSlider.disabled = which !== 'front';
      turnSlider.value = '0';
      if (turnValue !== null) turnValue.textContent = '0°';
    }
    base = poseNamed('rest', which);
    setSliders(base);
    pose();
    resumeIdle();
  }

  for (const choice of figureChoices) {
    choice.addEventListener('change', () => {
      if (choice.checked) chooseFigure(choice.value === 'side' ? 'side' : 'front');
    });
  }

  for (const group of ['front', 'side'] as const) {
    for (const button of poseGroup(group)?.querySelectorAll<HTMLButtonElement>(
      '[data-pose-button]',
    ) ?? []) {
      button.addEventListener('click', () => {
        base = poseNamed(button.dataset['poseButton'] ?? 'rest', chosen);
        setSliders(base);
        pose();
      });
    }
    for (const slider of sliderGroup(group)?.querySelectorAll<HTMLInputElement>(
      '[data-rotation]',
    ) ?? []) {
      // `input` fires on every step while dragging or pressing an arrow key, not only at the end.
      slider.addEventListener('input', () => {
        showValue(slider);
        pose();
      });
    }
  }

  moodSwitch?.addEventListener('change', () => {
    // While an animation plays the player picks up the new mood on its next frame.
    if (player.current() === undefined) render();
  });

  turnSlider?.addEventListener('input', () => {
    player.stop();
    markPlaying(undefined);
    setTurn(Number(turnSlider.value));
  });

  // Dragging sideways on Kálmán turns him too (front figure, while nothing plays): half a degree
  // per pixel, like a turntable. Pointer events cover mouse, pen and touch in one API.
  let dragStart: { x: number; turn: number } | undefined;
  figure.addEventListener('pointerdown', (event) => {
    if (chosen !== 'front' || turnSlider === null) return;
    player.stop();
    markPlaying(undefined);
    dragStart = { x: event.clientX, turn: Number(turnSlider.value) };
    figure.setPointerCapture(event.pointerId);
  });
  figure.addEventListener('pointermove', (event) => {
    if (dragStart === undefined) return;
    setTurn(dragStart.turn + (event.clientX - dragStart.x) * 0.5);
  });
  const endDrag = () => {
    dragStart = undefined;
  };
  figure.addEventListener('pointerup', endDrag);
  figure.addEventListener('pointercancel', endDrag);

  // Spinning is a view setting, not part of the pose: it turns the whole figure and leaves the
  // pose (and the pose JSON) as they are. It also works while an animation plays.
  spinSlider?.addEventListener('input', () => {
    applySpin(figure, REPO_RIG, Number(spinSlider.value));
    if (spinValue !== null) spinValue.textContent = `${spinSlider.value}°`;
  });

  pivotsSwitch?.addEventListener('change', () => {
    // `toggleAttribute(name, on)` adds or removes the attribute; CSS shows the markers with it.
    figure.toggleAttribute('data-show-pivots', pivotsSwitch.checked);
  });

  // -------------------------------------------------------------------------------------
  // Playing: the play buttons, the idle loop and the scrub slider
  // -------------------------------------------------------------------------------------

  /** Marks the playing animation's button as pressed, and the others not. */
  function markPlaying(animation: Animation | undefined): void {
    for (const button of animationButtons) {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset['animationButton'] === animation?.name),
      );
    }
  }

  /** Points the scrub slider at an animation: its range is that animation's play length. */
  function scrubTo(animation: Animation, time: number): void {
    if (scrubSlider === null) return;
    scrubSlider.max = String(playLength(animation));
    scrubSlider.dataset['animation'] = animation.name;
    scrubSlider.value = time.toFixed(2);
    if (scrubValue !== null) scrubValue.textContent = `${time.toFixed(2)} s`;
  }

  /** Plays an animation on the figure it uses, from the start. */
  function play(animation: Animation): void {
    if (turnSlider !== null && Number(turnSlider.value) !== 0) setTurn(0);
    player.play(animation.name);
    markPlaying(animation);
    scrubTo(animation, 0);
    figure.setAttribute('aria-label', animationDescription(animation.label, moodLabel()));
  }

  /** Starts the idle loop if it should run: switched on, front figure, nothing else playing. */
  function resumeIdle(): void {
    const idle = REPO_ANIMATIONS.find((a) => a.name === 'idle');
    if (idle === undefined || idleSwitch?.checked !== true || chosen !== 'front') return;
    if (player.current() !== undefined) return;
    play(idle);
  }

  for (const button of animationButtons) {
    button.addEventListener('click', () => {
      const animation = REPO_ANIMATIONS.find((a) => a.name === button.dataset['animationButton']);
      if (animation !== undefined) play(animation);
    });
  }

  // While an animation plays, the scrub slider follows it.
  player.onFrame((animation, time) => scrubTo(animation, time));

  // A finished animation leaves him at rest; then the idle loop may take over again.
  player.onFinish(() => {
    markPlaying(undefined);
    render();
    resumeIdle();
  });

  scrubSlider?.addEventListener('input', () => {
    const name = scrubSlider.dataset['animation'] ?? REPO_ANIMATIONS[0]?.name;
    const animation = REPO_ANIMATIONS.find((a) => a.name === name);
    if (animation === undefined) return;
    const length = playLength(animation);
    // Holding a moment pauses the animation there (spec: "Scrubbing through an animation").
    player.scrub(length === 0 ? 0 : Number(scrubSlider.value) / length, animation.name);
    markPlaying(animation);
    figure.setAttribute('aria-label', animationDescription(animation.label, moodLabel()));
  });

  idleSwitch?.addEventListener('change', () => {
    if (idleSwitch.checked) {
      resumeIdle();
    } else if (player.current()?.name === 'idle') {
      pose();
    }
  });

  // -------------------------------------------------------------------------------------
  // Copy pose
  // -------------------------------------------------------------------------------------

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

  // Start posed at rest; the idle loop starts on its own unless reduced motion is requested.
  render();
  if (idleSwitch !== null) idleSwitch.checked = !reducedMotion;
  resumeIdle();
}
