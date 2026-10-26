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
  figure.dataset['spin'] = String(degrees);
}
