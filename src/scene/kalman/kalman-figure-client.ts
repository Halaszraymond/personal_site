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
  resolvePose,
  spinMatrix,
  toSvgTransform,
  type Mood,
  type Pose,
  type Rig,
} from '../../lib/kalman-rig';
import {
  normaliseAngle,
  turntableFrame,
  viewImages,
  viewMatrix,
  type TurntableEntry,
} from '../../lib/kalman-turntable';

export function applyPose(figure: SVGSVGElement, rig: Rig, pose: Pose, mood: Mood): void {
  for (const layer of resolvePose(rig, pose, mood)) {
    const group = figure.querySelector(`[data-layer="${layer.name}"]`);
    group?.setAttribute('transform', toSvgTransform(layer.matrix));
    // An SVG attribute, not an inline style, so the Content-Security-Policy allows it.
    group?.setAttribute('visibility', layer.visible ? 'visible' : 'hidden');

    const marker = figure.querySelector(`[data-pivot="${layer.name}"]`);
    marker?.setAttribute('cx', String(layer.pivotOnArtboard[0]));
    marker?.setAttribute('cy', String(layer.pivotOnArtboard[1]));
    marker?.setAttribute('visibility', layer.visible ? 'visible' : 'hidden');
  }
  // `dataset.pose` writes `data-pose`: readable by styles and tests.
  figure.dataset['pose'] = pose.name;
  figure.dataset['mood'] = mood;
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
  const facingFront = normaliseAngle(degrees) === 0;
  // `display`, not `visibility`, for whole groups: in SVG a child that says
  // visibility="visible" (every layer does) would still show inside a hidden group.
  const show = (selector: string, visible: boolean) =>
    figure.querySelector(selector)?.setAttribute('display', visible ? 'inline' : 'none');
  show('[data-layers]', facingFront);
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
