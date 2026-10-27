/**
 * Colour maths for the water: blending in OKLab and WCAG contrast (dive-scroll design §3).
 *
 * Colours are hex strings (`#0b1a2a`), the way CSS and the design sheet write them. Blending
 * happens in OKLab, a "perceptual" colour space: halfway between two colours there looks like
 * halfway, instead of the muddy grey a plain RGB average gives. Pure maths, unit-tested.
 */

/** A colour as three numbers 0–1 (red, green, blue), like a Python tuple. */
type Rgb = readonly [number, number, number];
/** A colour in OKLab: lightness (0–1) and two colour axes (green–red, blue–yellow). */
type Lab = readonly [number, number, number];

/** `#rgb` or `#rrggbb` → RGB 0–1. Throws on anything else, so a typo fails the tests. */
export function parseHex(hex: string): Rgb {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (match?.[1] === undefined) throw new Error(`Not a hex colour: "${hex}"`);
  const digits =
    match[1].length === 3 ? [...match[1]].map((digit) => digit + digit).join('') : match[1];
  return [0, 2, 4].map((at) => parseInt(digits.slice(at, at + 2), 16) / 255) as unknown as Rgb;
}

/** RGB 0–1 → `#rrggbb` (rounded, clamped). */
export function toHex(rgb: Rgb): string {
  const byte = (value: number) =>
    Math.round(Math.min(1, Math.max(0, value)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${rgb.map(byte).join('')}`;
}

/** sRGB (what screens and CSS use) → linear light, which maths on light needs. */
function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function fromLinear(channel: number): number {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
}

/** sRGB → OKLab, with Björn Ottosson's published matrices. */
function toOklab([r, g, b]: Rgb): Lab {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab → sRGB (the inverse of toOklab). */
function fromOklab([lightness, a, b]: Lab): Rgb {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** The colour `t` of the way from `from` to `to` (0 = from, 1 = to), blended in OKLab. */
export function mixOklab(from: string, to: string, t: number): string {
  const a = toOklab(parseHex(from));
  const b = toOklab(parseHex(to));
  const mixed = a.map((value, i) => value + ((b[i] ?? value) - value) * t) as unknown as Lab;
  return toHex(fromOklab(mixed));
}

/** WCAG relative luminance: how much light a colour gives, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(toLinear) as unknown as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 (none) to 21 (black on white). AA asks 4.5 for text. */
export function contrast(first: string, second: string): number {
  const [light, dark] = [luminance(first), luminance(second)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/**
 * `colour` itself if it reaches `minimum` contrast on `background`; otherwise the same colour
 * made just lighter or darker enough (blended towards white or black, whichever lies further
 * from the background), so it keeps as much of its own colour as it can. Black or white always
 * reaches 4.5:1 on some side, so this always finds an answer for minimums up to 4.5.
 */
export function readableOn(colour: string, background: string, minimum: number): string {
  if (contrast(colour, background) >= minimum) return colour;
  const extreme =
    contrast('#ffffff', background) >= contrast('#000000', background) ? '#ffffff' : '#000000';
  // 1 % steps: fine enough that nobody sees the difference, and quick (100 tries at most).
  for (let step = 1; step <= 100; step += 1) {
    const candidate = mixOklab(colour, extreme, step / 100);
    if (contrast(candidate, background) >= minimum) return candidate;
  }
  return extreme;
}
