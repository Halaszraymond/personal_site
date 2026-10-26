# Kálmán's layers: what to make and how

Kálmán is a **cut-out figure**: nine separate images that the code moves like a paper puppet (README §2.1). Right now each layer is a flat placeholder shape in `src/assets/kalman/placeholder/`. This guide lists the real illustrations to make from the design sheet ([`docs/images/kalman-design/`](images/kalman-design/)), the rules every image must follow to fit, and a ready-to-paste prompt per layer.

Only the **front view** for now: every pose in this change is a front-view pose. The side-view set for diving and swimming follows with the animations change.

## How the rig uses an image

The rig (`src/scene/kalman/rig.json`) places each image on the **artboard**, a drawing area of **1000 × 1400** units with the origin at the top left. For every layer it gives:

| Field | Meaning |
|---|---|
| `image` | The file, relative to `src/assets/kalman/`. |
| `size` | Width and height of the image on the artboard. The image is stretched to this size, so its aspect ratio must match. |
| `position` | Where the image's top-left corner sits at rest. |
| `pivot` | The point it turns around, in the image's own coordinates (from its top-left corner). |
| `parent` | The layer it hangs from: it moves along with that layer. |
| `order` | Drawing order: higher is in front. |
| `rotate` | How far it may turn from rest, `[min, max]` in degrees, clockwise positive. |
| `accessory` | `true` for the tie and the glasses: only shown on his professional side. |

**Left and right are as seen by the viewer** (the flipper on the left of the picture is `flipperLeft`).

## The list

Export each image as PNG at **twice** the size in the table (so it stays sharp on phones), for example 500 × 540 px for the head.

| Layer | File | Size (artboard) | Export (px) | Pivot | Tucks under |
|---|---|---|---|---|---|
| Body | `body.png` | 416 × 930 | 832 × 1860 | bottom centre, between the feet | — (the base) |
| Head | `head.png` | 250 × 270 | 500 × 540 | bottom centre: the neck | the tie's neck band |
| Left flipper | `flipper-left.png` | 100 × 625 | 200 × 1250 | top, inner side: the shoulder | the body |
| Right flipper | `flipper-right.png` | 100 × 625 | 200 × 1250 | top, inner side: the shoulder | the body |
| Left foot | `foot-left.png` | 150 × 135 | 300 × 270 | top: the ankle | — (in front of the body) |
| Right foot | `foot-right.png` | 150 × 135 | 300 × 270 | top: the ankle | — (in front of the body) |
| Tail | `tail.png` | 80 × 110 | 160 × 220 | top centre | the body |
| Tie | `tie.png` | 270 × 500 | 540 × 1000 | the knot | — (in front of body and head) |
| Glasses | `glasses.png` | 210 × 56 | 420 × 112 | the bridge | — (in front of the head) |

If a real image needs a different shape, that's fine: change `size`, `position` and `pivot` in `rig.json` to match it. The preview's **Show pivots** switch shows whether the pivots sit on the joints.

## The rules for every image

1. **Front view, rest pose**, with the same angle, proportions and lighting as the front view on the design sheet.
2. **One part per image**, and nothing else: no other body parts, no ground, no cast shadow.
3. **A plain flat background in bright green (`#00FF00`)**, a colour that isn't in Kálmán. Most AI image generators can't make a truly transparent background, so the green is removed afterwards (see below). If your generator offers a transparent background, use that instead.
4. **Extra material at every joint.** Where a part joins another, draw it a little further than you can see: the top of a flipper continues under the body, the bottom of the head continues into the neck. The hidden part stops a gap from showing when the part turns.
5. **Draw the part whole**, also where another part would normally cover it (the top of the feet behind the belly, the tie's band behind the head).
6. **The aspect ratio from the table**, with the part filling the image. A little empty space at the edges is fine.

### Removing the green background

- **Photopea** (free, in the browser) or **GIMP**: *Select → Color Range* (GIMP: *Colors → Color to Alpha*) on the green, delete, then *Select → Modify → Contract* by 1 px before deleting, so no green fringe stays on the edges.
- Or a background-removal tool (remove.bg and similar). Check the edges afterwards: thin parts such as the glasses and the flipper tips are where they fail first.
- Save as **PNG with transparency**, in `src/assets/kalman/` under the file name from the table, and change `image` in `rig.json` from `placeholder/…svg` to the new file.

## Prompts

Give the **design sheet** ([`turnaround.png`](images/kalman-design/turnaround.png), and [`turnaround-professional.png`](images/kalman-design/turnaround-professional.png) for the tie and the glasses) as a **reference image with every prompt**. That, plus the same style block every time, is what keeps the parts looking like one penguin.

### Style block (paste at the start of every prompt)

> Use the attached character sheet as the reference for style, colours and proportions. Draw a single isolated part of this same emperor penguin character, Kálmán, front view, in the same soft painted illustration style: gentle feather texture, a thin dark outline, soft even lighting from the front, no cast shadows. Colours exactly as on the sheet: dark navy head, back and flippers; cream belly; a golden-orange ear crescent fading into a pale-yellow wash on the upper chest; grey feet. Plain flat bright green background (#00FF00), nothing else in the image. The part fills the image.

### Per layer (paste after the style block)

**Body** (`body.png`, portrait 832 × 1860)
> Only the body, without head, flippers, feet or tail: the torso from the base of the neck down to just above the feet. Front view: cream belly in the middle, a narrow band of dark navy along both sides, the pale-yellow wash at the top of the chest. Continue the neck a little upwards and the bottom edge a little downwards, so the head and feet can overlap it.

**Head** (`head.png`, 500 × 540)
> Only the head, front view: dark navy, small dark eyes with a tiny highlight, a slender dark bill with a thin orange-pink stripe on the lower half, the golden-orange ear crescents on both sides running down towards the neck. Continue the neck about a fifth of the image height below the head, fading into the pale-yellow of the chest, so it can tuck under the body. No glasses, no tie.

**Left flipper** (`flipper-left.png`, tall 200 × 1250)
> Only the flipper on the left side of the picture, hanging straight down, seen from the front: long, flat and narrow, dark navy on the outside with a pale grey inner edge. The top end is rounded and slightly longer than visible on the sheet, because it tucks under the body.

**Right flipper** (`flipper-right.png`, tall 200 × 1250)
> The same as the left flipper but for the right side of the picture: the mirror image, with the pale inner edge on the left.

**Left foot** (`foot-left.png`, 300 × 270)
> Only the foot on the left side of the picture, front view: grey, scaly, with three toes and small dark claws, as on the sheet. Include the top of the foot up to the ankle, which is normally hidden by the belly.

**Right foot** (`foot-right.png`, 300 × 270)
> The same as the left foot, mirrored, for the right side of the picture.

**Tail** (`tail.png`, 160 × 220)
> Only the short tail, seen from the front between the feet: a small dark navy wedge of stiff feathers pointing down. Continue the top a little, because it tucks under the body.

**Tie** (`tie.png`, 540 × 1000; reference: the professional sheet)
> Only the dark-red tie with its band around the neck, front view, as on the professional character sheet: a narrow band across the top, a neat knot, and the tie hanging straight down. No penguin, only the tie.

**Glasses** (`glasses.png`, wide 420 × 112; reference: the professional sheet)
> Only the round silver reading glasses, front view, as on the professional character sheet: two thin round rims, a small bridge, and short temple arms pointing outwards. The lenses are clear, with a very faint reflection. No penguin, only the glasses.

### Plan B

If the parts don't match each other well enough (style or scale drifting between prompts), generate the **whole front view once** and cut it into parts instead. The parts hidden behind others (the top of the flippers and feet, the tail) then have to be painted in by hand or with the generator's *inpaint*/*expand* tool. The rig doesn't change either way.
