/**
 * Puts an already drawn Kálmán figure (KalmanFigure.astro) into another pose or mood.
 *
 * The figure's SVG is in the HTML from the start; this only rewrites attributes on the
 * existing elements: each layer's `transform`, the accessories' `visibility`, and the pivot
 * markers' position. Nothing is created or removed, so there is no flicker and no reload.
 * The numbers come from resolvePose() (src/lib/kalman-rig.ts), the same function the
 * component uses at build time, so the browser and the HTML always agree.
 */
import {
  figureOf,
  resolvePose,
  spinMatrix,
  toSvgTransform,
  type Figure,
  type Mood,
  type Pose,
  type Rig,
} from '../../lib/kalman-rig';
import { crossFade } from '../../lib/kalman-animation';
import {
  normaliseAngle,
  turntableFrame,
  viewImages,
  viewMatrix,
  type TurntableEntry,
} from '../../lib/kalman-turntable';

export function applyPose(figure: SVGSVGElement, rig: Rig, pose: Pose, mood: Mood): void {
  // Each figure (front, side) has its own layers and markers; `rig` must be the pose's figure's.
  const which = figureOf(pose);
  const layers = figure.querySelector(`[data-layers][data-figure="${which}"]`);
  const pivots = figure.querySelector(`[data-pivots][data-figure="${which}"]`);
  for (const layer of resolvePose(rig, pose, mood)) {
    const group = layers?.querySelector(`[data-layer="${layer.name}"]`);
    group?.setAttribute('transform', toSvgTransform(layer.matrix));
    // An SVG attribute, not an inline style, so the Content-Security-Policy allows it.
    group?.setAttribute('visibility', layer.visible ? 'visible' : 'hidden');

    const marker = pivots?.querySelector(`[data-pivot="${layer.name}"]`);
    marker?.setAttribute('cx', String(layer.pivotOnArtboard[0]));
    marker?.setAttribute('cy', String(layer.pivotOnArtboard[1]));
    marker?.setAttribute('visibility', layer.visible ? 'visible' : 'hidden');
  }
  // `dataset.pose` writes `data-pose`: readable by styles and tests.
  figure.dataset['pose'] = pose.name;
  figure.dataset['mood'] = mood;
}

/**
 * Shows one figure (front or side) and hides the other. The turntable belongs to the front
 * figure, so it only takes over while the front figure is chosen (see applyTurn).
 */
export function applyFigure(figure: SVGSVGElement, which: Figure): void {
  for (const group of figure.querySelectorAll<SVGGElement>('[data-layers]')) {
    group.setAttribute('display', group.dataset['figure'] === which ? 'inline' : 'none');
  }
  // `dataset.figure` writes `data-figure`; the CSS uses it to show the right pivot markers.
  figure.dataset['figure'] = which;
}

/**
 * Shows the drawn pose of `frame` (from drawnFrame()) over the layers of `which` figure and
 * cross-fades the two (crossFade(): the drawing in over the layers, then the layers out under
 * the drawing, so he is never see-through). Without a frame the drawn poses hide and the
 * layers are solid again.
 */
export function applyDrawn(
  figure: SVGSVGElement,
  which: Figure,
  frame: { readonly name: string; readonly opacity: number } | undefined,
  mood: Mood,
): void {
  const opacity = frame === undefined ? 0 : Math.round(frame.opacity * 1000) / 1000;
  const fade = crossFade(opacity);
  // `display` for the whole group (see applyTurn), `visibility` and `opacity` per drawing:
  // SVG attributes, so the Content-Security-Policy allows them.
  figure
    .querySelector('[data-drawn-poses]')
    ?.setAttribute('display', opacity > 0 ? 'inline' : 'none');
  for (const group of figure.querySelectorAll<SVGGElement>('[data-drawn-pose]')) {
    const shown =
      frame !== undefined &&
      group.dataset['drawnPose'] === frame.name &&
      group.dataset['drawnMood'] === mood;
    group.setAttribute('visibility', shown ? 'visible' : 'hidden');
    group.setAttribute('opacity', shown ? String(fade.drawing) : '0');
  }
  figure
    .querySelector(`[data-layers][data-figure="${which}"]`)
    ?.setAttribute('opacity', String(fade.layers));
  // `dataset.drawn` writes `data-drawn`, so the preview and the tests can read what shows.
  if (frame !== undefined && opacity > 0) figure.dataset['drawn'] = `${frame.name} ${opacity}`;
  else delete figure.dataset['drawn'];
}

/** Turns the whole figure as one piece by `degrees` around its centre; the pose stays as it is. */
export function applySpin(figure: SVGSVGElement, rig: Rig, degrees: number): void {
  figure
    .querySelector('[data-spin]')
    ?.setAttribute('transform', toSvgTransform(spinMatrix(rig, degrees)));
  // `spinAngle` writes `data-spin-angle` (not `data-spin`, which marks the spin group itself).
  figure.dataset['spinAngle'] = String(degrees);
}

/**
 * Turns Kálmán around to `degrees` (0 = front): at 0 the posable layers show; at any other
 * angle the drawn views of the turntable take over, squeezed and crossfaded by turntableFrame().
 * The turntable only has rest poses, so a pose shows again when he faces front.
 */
export function applyTurn(
  figure: SVGSVGElement,
  rig: Rig,
  views: readonly TurntableEntry[],
  degrees: number,
  mood: Mood,
): void {
  // The turntable is the front figure's: with the side figure chosen it stays out of the way.
  const frontChosen = (figure.dataset['figure'] ?? 'front') === 'front';
  const facingFront = normaliseAngle(degrees) === 0 || !frontChosen;
  // `display`, not `visibility`, for whole groups: in SVG a child that says
  // visibility="visible" (every layer does) would still show inside a hidden group.
  const show = (selector: string, visible: boolean) =>
    figure.querySelector(selector)?.setAttribute('display', visible ? 'inline' : 'none');
  if (frontChosen) show('[data-layers][data-figure="front"]', facingFront);
  show('[data-turntable]', !facingFront);

  const frames = facingFront ? [] : turntableFrame(views, degrees);
  const centreX = rig.artboard[0] / 2;
  for (const group of figure.querySelectorAll<SVGGElement>('[data-view]')) {
    const frame = frames.find((f) => f.name === group.dataset['view']);
    const found = viewImages(views, group.dataset['view'] ?? '');
    const placed = found?.images[mood];
    const shown = frame !== undefined && placed !== undefined && group.dataset['viewMood'] === mood;
    group.setAttribute('visibility', shown ? 'visible' : 'hidden');
    if (shown) {
      group.setAttribute(
        'transform',
        // A mirrored view squeezes the same way, but flipped (a negative horizontal scale).
        toSvgTransform(
          viewMatrix(frame.scaleX * (found?.mirrored === true ? -1 : 1), centreX, placed.position),
        ),
      );
      // `opacity` is an SVG attribute, so the Content-Security-Policy allows it.
      group.setAttribute('opacity', String(Math.round(frame.opacity * 1000) / 1000));
    }
  }
  // Draw the frames back to front: moving a group to the end of its parent draws it on top,
  // so the incoming view always fades in over the outgoing one.
  for (const frame of frames) {
    const group = figure.querySelector(`[data-view="${frame.name}"][data-view-mood="${mood}"]`);
    if (group !== null) group.parentElement?.appendChild(group);
  }
  figure.dataset['turn'] = String(normaliseAngle(degrees));
}
