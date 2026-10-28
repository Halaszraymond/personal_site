/**
 * The dive in the browser (spec: dive; dive-scroll design §1–§5): reads the scroll, keeps the
 * depth gauge up to date, colours the water in full mode, runs the express dive, and in full
 * mode starts Kálmán's scene (dive-scene.ts).
 *
 * Scrolling stays the browser's own: this only listens (passively, so it can never hold the
 * scroll up) and does the work at most once per frame. The page is measured on load and on
 * resize only; a frame reads the cached anchors and `scrollY`, nothing else from the layout.
 * Every decision is a pure function from src/lib/dive.ts.
 *
 * Runs in both modes: the still dive also gets a live gauge and the express dive (instant).
 */
import {
  coloursAt,
  currentSection,
  depthAt,
  diveAnchors,
  probePosition,
  SECTION_IDS,
  zoneAt,
  type Anchor,
  type Direction,
  type DiveLayout,
  type SectionId,
  type Zone,
} from '../../lib/dive';
import { gaugeFraction } from '../../lib/dive-css';
import type { DiveScene } from './dive-scene';

const root = document.documentElement;
const gauge = document.querySelector<HTMLElement>('[data-depth-gauge]');
const depthValue = gauge?.querySelector('[data-depth-value]');
const gaugeLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-express-dive]')];
const stageFigure = document.querySelector<SVGSVGElement>('[data-dive-stage] [data-kalman-figure]');

/** Full mode is decided by RenderModeSwitch.astro; read it each time, it is set early on. */
const isFull = () => root.dataset['renderMode'] === 'full';

let layout: DiveLayout | undefined;
let anchors: Anchor[] = [];
let lastProbe: number | undefined;
let lastCurrent: SectionId | undefined;
let lastColour: string | undefined;
let framePending = false;

/** The page position of an element's top (or bottom), in px from the top of the document. */
function pageTop(element: Element, edge: 'top' | 'bottom' = 'top'): number {
  return element.getBoundingClientRect()[edge] + window.scrollY;
}

/** Measures where every section starts and where The catch ends. */
function measure(): void {
  const starts = {} as Record<SectionId, number>;
  for (const id of SECTION_IDS) {
    const section = document.getElementById(id);
    if (section === null) return;
    starts[id] = pageTop(section);
  }
  const catchSection = document.getElementById('catch');
  if (catchSection === null) return;
  layout = { starts, catchBottom: pageTop(catchSection, 'bottom') };
  anchors = diveAnchors(layout);
}

/** Where the visitor is now: the probe, its depth and its zone. */
function readPosition(): { probe: number; depth: number; zone: Zone } | undefined {
  if (layout === undefined) return undefined;
  const probe = probePosition(window.scrollY, window.innerHeight, root.scrollHeight);
  return { probe, depth: depthAt(probe, anchors), zone: zoneAt(probe, layout) };
}

/** One frame: the gauge, the water, and Kálmán. */
function update(): void {
  framePending = false;
  const position = readPosition();
  if (position === undefined) return;
  const { probe, depth, zone } = position;
  const direction: Direction =
    lastProbe === undefined || probe === lastProbe ? 'none' : probe > lastProbe ? 'down' : 'up';
  lastProbe = probe;

  // The gauge: the depth as a number and as the marker's place on the scale.
  if (depthValue) depthValue.textContent = String(Math.round(depth));
  gauge?.style.setProperty('--gauge-depth', String(gaugeFraction(depth)));
  const current = currentSection(zone);
  if (current !== lastCurrent) {
    lastCurrent = current;
    for (const link of gaugeLinks) {
      // `location`: "you are here", the right aria-current for a place within a page.
      if (link.dataset['expressDive'] === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  // The water follows the depth in full mode. Custom properties set through `style` (the CSSOM)
  // are allowed by the Content-Security-Policy; a `style="…"` attribute in the HTML is not.
  if (isFull()) {
    const colours = coloursAt(Math.round(depth));
    if (colours.water !== lastColour) {
      lastColour = colours.water;
      root.style.setProperty('--water', colours.water);
      root.style.setProperty('--text', colours.text);
      root.style.setProperty('--accent', colours.accent);
    }
  }

  scene?.follow(zone, direction);
}

/** Asks for one update in the next frame, however many scroll events arrive before it. */
function requestUpdate(): void {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(update);
}

// -------------------------------------------------------------------------------------------
// Kálmán's scene (full mode only), loaded after the page or at the first scroll.
// -------------------------------------------------------------------------------------------

let scene: DiveScene | undefined;
let sceneLoading: Promise<DiveScene | undefined> | undefined;

function loadScene(): Promise<DiveScene | undefined> {
  if (sceneLoading !== undefined) return sceneLoading;
  if (!isFull() || stageFigure === null) return Promise.resolve(undefined);
  // `import()` downloads the module only now, like a lazy import inside a Python function.
  sceneLoading = import('./dive-scene').then(({ startScene }) => {
    const position = readPosition();
    scene = startScene(stageFigure, position?.zone ?? 'ice');
    return scene;
  });
  return sceneLoading;
}

// -------------------------------------------------------------------------------------------
// The express dive (design §5)
// -------------------------------------------------------------------------------------------

async function expressDive(id: SectionId): Promise<void> {
  const section = document.getElementById(id);
  const heading = section?.querySelector<HTMLElement>('h1, h2');
  if (!section || !heading) return;
  // Where the section lands: its top, minus the room it keeps free (the stage's band on a phone).
  const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
  const maxScroll = root.scrollHeight - window.innerHeight;
  const top = Math.min(maxScroll, Math.max(0, pageTop(section) - margin));
  const startProbe = readPosition()?.probe;

  const diving = isFull() ? await loadScene() : undefined;
  if (diving !== undefined && Math.abs(top - window.scrollY) > 1) {
    await diving.expressDive(top);
    update();
    const arrived = readPosition();
    const direction: Direction =
      arrived === undefined || startProbe === undefined || arrived.probe === startProbe
        ? 'none'
        : arrived.probe > startProbe
          ? 'down'
          : 'up';
    if (arrived !== undefined) diving.arrive(arrived.zone, direction);
  } else {
    // The still dive, reduced motion, or already there: straight to it, no animation.
    window.scrollTo({ top, behavior: 'instant' });
  }
  // Focus moves to the heading (tabindex -1), without the browser scrolling again.
  heading.focus({ preventScroll: true });
  // The URL shows where the visitor is, as a normal anchor link would, without a second jump.
  history.pushState(null, '', `#${id}`);
}

for (const link of gaugeLinks) {
  link.addEventListener('click', (event) => {
    const id = link.dataset['expressDive'];
    if (id === undefined || !(SECTION_IDS as readonly string[]).includes(id)) return;
    event.preventDefault();
    void expressDive(id as SectionId);
  });
}

// -------------------------------------------------------------------------------------------
// Start
// -------------------------------------------------------------------------------------------

measure();
update();
window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener(
  'scroll',
  () => {
    void loadScene();
  },
  { passive: true, once: true },
);
// Anything that changes the page's height (the switch to full mode, a resize, images) moves the
// anchors, so measure again. ResizeObserver reports size changes of an element, here the body.
new ResizeObserver(() => {
  measure();
  requestUpdate();
}).observe(document.body);

if (document.readyState === 'complete') void loadScene();
else window.addEventListener('load', () => void loadScene(), { once: true });
