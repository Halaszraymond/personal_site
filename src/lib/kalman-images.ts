/**
 * How large Kálmán's images are built: WebP at the size they are shown at (dive-scroll design §7).
 *
 * The cut images are larger than any page shows them, and PNG. The figure component asks
 * Astro's image pipeline (`getImage()`) for a WebP copy of each image at the width worked out
 * here: twice its width on the largest stage, so it stays sharp on a 2× (retina) screen.
 * Pure maths, unit-tested; the component does the building.
 */

/** The widest stage Kálmán is drawn on, in CSS pixels (the dive's stage, the preview's stage). */
export const STAGE_WIDTH_PX = 480;
/** Pixels per CSS pixel to build for: 2 covers the usual phone and laptop screens. */
export const PIXEL_DENSITY = 2;
/** WebP quality (0–100): high, so the soft cut edges and the feathers look like the PNGs. */
export const WEBP_QUALITY = 85;

/**
 * The pixel width to build an image at: its width on the artboard (`sizeOnArtboard`, in
 * artboard units), scaled to a `STAGE_WIDTH_PX` stage at `PIXEL_DENSITY`, rounded up. Never
 * wider than the source image (`sourceWidth`): enlarging adds bytes, not detail.
 */
export function builtImageWidth(
  sizeOnArtboard: number,
  artboardWidth: number,
  sourceWidth: number,
): number {
  const wanted = Math.ceil((sizeOnArtboard / artboardWidth) * STAGE_WIDTH_PX * PIXEL_DENSITY);
  return Math.max(1, Math.min(sourceWidth, wanted));
}
