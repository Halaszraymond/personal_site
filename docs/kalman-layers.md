# Kálmán's images: what to make and how

Kálmán on the site is a **cut-out figure** (nine layers moved like a paper puppet) plus a **turntable** of drawn views to turn him around (README §2.1). Both come from a small set of images Raymond makes with Gemini, in the final design ([`final-sheet.png`](images/kalman-design/final-sheet.png)). A script cuts them into what the site uses:

```bash
npm run cut:kalman
```

It reads the images in `docs/images/kalman-design/`, and writes the layers and views to `src/assets/kalman/` and `src/scene/kalman/rig.json` and `turntable.json`. Running it twice on the same images gives the same files, so `git status` shows exactly what a new image changed.

## The images

All images are the same size (now 687 × 1024), with Kálmán in the same relaxed standing pose, at the same height and on the same ground line.

| File | What | How it's made |
|---|---|---|
| `front-goofy.png` | Front view, goofy: big round eyes, flippers down with a small gap of white between each flipper and the body | Prompt 1, with the final sheet as the reference |
| `front-professional.png` | The same image with the tie, the glasses and the calmer professional eyes | Prompt 2: an **edit** of `front-goofy.png` |
| `view-3q-front.png`, `view-side.png`, `view-3q-back.png`, `view-back.png` | The turntable views, goofy, his bill pointing to the left of the picture | Prompt 3, with `front-goofy.png` as the reference |
| `view-…-professional.png` | Each view with tie and glasses | Prompt 4: an **edit** of that view |

You don't make the other side: the script mirrors the ¾ front, side and ¾ back, so four drawn views give eight angles.

For the animations (diving, swimming, launching) the side view is also a posable figure, which needs three more images:

| File | What | How it's made |
|---|---|---|
| `side-goofy.png` | Side view, goofy, rest pose, bill to the left, feet flat | Prompt 5, with `front-goofy.png` as the reference |
| `side-professional.png` | The same with tie, glasses and the calm eye | Prompt 4 (the ¾ front version), an **edit** of `side-goofy.png` |
| `side-no-flipper.png` | The same without the near flipper, the body painted underneath | Prompt 6, an **edit** of `side-goofy.png` |

In a side view the flipper lies *on* the body, so there is no white gap to cut along. The script cuts the flipper along an outline traced once on `side-goofy.png`, and takes the body from the flipper-less image, so a swinging flipper shows painted body underneath and never leaves a copy of itself behind.

For the bow the front figure gets a **drawn pose**: a whole drawing of him bowing, which cross-fades in at the deepest moment (from the front a bow can't be made by turning layers). It needs two more images, edits that change only his upper body, so the lower half lines up with `front-goofy.png`:

| File | What | How it's made |
|---|---|---|
| `front-bow-goofy.png` | Bowing politely, like a butler: head and shoulders tipped forward, bill pointing down at the chest, the round goofy eyes looking down, a small smile | Prompt 7, an **edit** of `front-goofy.png` |
| `front-bow-professional.png` | The same bow with the glasses, the calm eyes and the tie | Prompt 8, an **edit** of `front-bow-goofy.png` |

For the eyes that follow the pointer, the pupils become their own layers. Under a moving pupil the eye must be painted white, not a copy of the pupil, so two more edits are needed, without pupils:

| File | What | How it's made |
|---|---|---|
| `front-goofy-no-pupils.png` | The goofy front view with plain white eyes, no pupils | Prompt 9, an **edit** of `front-goofy.png` |
| `front-professional-no-pupils.png` | The professional front view with the calm eyes plain white, no pupils | Prompt 10, an **edit** of `front-professional.png` |

For swimming, Kálmán has a third figure, drawn lying horizontally (the side figure's neck can't bend into a torpedo). Like the side figure it needs three images:

| File | What | How it's made |
|---|---|---|
| `swim-goofy.png` | Swimming, seen from the side: horizontal, bill first, head in line with the body, near flipper along his side | Prompt 11, with `side-goofy.png` as the reference |
| `swim-professional.png` | The same with glasses, the calm eye and the tie | Prompt 12, an **edit** of `swim-goofy.png` |
| `swim-no-flipper.png` | The same without the near flipper, the body painted underneath | Prompt 13, an **edit** of `swim-goofy.png` |

**Why edits:** a professional image made as an edit of its goofy one lines up with it pixel for pixel. Then the difference between the two is exactly the tie, the glasses and the eyes, and that becomes the tie and glasses layers. A professional image drawn from scratch would never line up.

## Prompts for Gemini

### 1. Front view, goofy (attach `final-sheet.png`)

```text
Use the attached character sheet as the reference for this penguin character: same painted illustration style, same proportions, same colours (slate-grey head and back, white belly, golden-yellow ear patches, pale-yellow wash on the upper chest, slender dark bill with an orange stripe on the lower half, grey feet).

Draw ONE single full-body front view of him, from the "Goofy" row: his big round goofy eyes, bill closed in a small friendly smile. Standing straight and relaxed, facing the viewer, both flippers hanging down along his sides with a small gap of white background between each flipper and the body, feet flat and fully visible.

Pure plain white background. No text, no labels, no logos, no shadow on the ground, no other characters or objects. Centred, the whole penguin in frame with some margin around him. Portrait format (2:3), as high resolution as possible.
```

### 2. Front view, professional (attach `front-goofy.png`, and the sheet for the tie and glasses)

```text
Edit this exact image. Add the purple patterned tie with its band around the neck and the round black glasses from the "Professional" row of the attached character sheet, and give him the calmer professional eyes behind the glasses.

Change nothing else: same pose, same position, same size, same lighting, same background, same pixels everywhere outside the tie, the glasses and the eyes.
```

### 3. A turntable view, goofy (attach `front-goofy.png`)

```text
Use the attached image as the exact reference for this penguin: same painted style, same colours, same proportions, same goofy face with the big round eyes, same lighting, same plain white background, same image size.

Draw the same penguin in the same relaxed standing pose (flippers hanging down, feet flat), but turned so that we see him [VIEW]. He keeps exactly the same height and stays in the same place in the image: his feet on the same ground line, his body centred in the same spot.

No text, no labels, no logos, no shadow on the ground, nothing else in the image. Portrait format (2:3), as high resolution as possible.
```

| File | `[VIEW]` |
|---|---|
| `view-3q-front.png` | `from three-quarters in front: turned 45 degrees, his bill pointing to the left of the picture` |
| `view-side.png` | `exactly from the side, in profile, his bill pointing to the left of the picture` |
| `view-3q-back.png` | `from three-quarters behind: turned 135 degrees, mostly his back, his bill just visible on the left` |
| `view-back.png` | `straight from behind: only his back, no face visible` |

### 4. A turntable view, professional (attach the goofy view and `front-professional.png`)

For the ¾ front and the side:

```text
Edit this exact image. Add the purple patterned tie with its band around the neck and the round black glasses, exactly as in the attached professional reference, seen from this same angle, and give him the calmer professional eyes behind the glasses.

Change nothing else: same pose, same position, same size, same lighting, same background, same pixels everywhere outside the tie, the glasses and the eyes.
```

For the ¾ back and the back:

```text
Edit this exact image. Add the purple patterned tie and the round black glasses from the attached professional reference, as they would look from this angle: from behind you only see the tie's band around the back of the neck and the arms of the glasses over the sides of the head. Change nothing else: same pose, same position, same size, same lighting, same background, same pixels everywhere else.
```

### 5. The side view for posing, goofy (attach `front-goofy.png`)

```text
Use the attached image as the exact reference for this penguin: same painted style, same colours, same proportions, same goofy face with the big round eyes, same lighting, same plain white background, same image size.

Draw the same penguin exactly from the side, in profile, his bill pointing to the left of the picture, standing relaxed with his feet flat. His near flipper hangs down along his body. Same height and same ground line as the attached image.

No text, no labels, no logos, no shadow on the ground, nothing else in the image. Portrait format (2:3), as high resolution as possible.
```

### 6. The side view without the flipper (attach `side-goofy.png`, nothing else)

```text
Edit this exact image. Remove his near flipper completely and paint the side of his body that was behind it, continuing the grey back and the white belly naturally, with the same feather texture and lighting.

Change nothing else: same pose, same position, same size, same lighting, same background, same pixels everywhere outside the area where the flipper was.
```

### 7. The bow, goofy (attach `front-goofy.png`)

```text
Edit this exact image. Make him bow politely and deeply, like a butler welcoming a guest: his head and shoulders tip forward and down so we look at the top of his slate-grey head, his bill points straight down towards his chest, and both golden-yellow ear patches are still visible at the sides. Keep his big round goofy eyes, now looking down at the ground, and a small friendly smile at the base of his bill: polite and warm, not stern.

Change nothing below his shoulders: same belly, same flippers hanging at his sides, same feet, same position, same size, same lighting, same background.
```

If the eyes come out stern, add: *"his eyes are the same big round white eyes with black pupils as in the attached image"*.

### 8. The bow, professional (attach `front-bow-goofy.png` and `front-professional.png`)

```text
Edit the first image. Add the round black glasses and the calmer professional eyes from the second image, seen from above because his head is bowed: the glasses tip down with his head and sit on the base of his bill, his eyes look down behind them. Add the purple patterned tie exactly as in the second image. Keep the ear patches exactly where they are in the first image.

Change nothing else: same pose, same position, same size, same lighting, same background, same pixels everywhere outside the glasses, the eyes and the tie.
```

### 9. The front view without pupils, goofy (attach `front-goofy.png`, nothing else)

```text
Edit this exact image. Remove only the black pupils, and the small white highlights in them, from both of his big round eyes, so the eyes are plain white, with the same outline, the same soft shading at their edges and the same size.

Change nothing else: same pose, same position, same size, same lighting, same background, same pixels everywhere outside the pupils.
```

### 10. The front view without pupils, professional (attach `front-professional.png`, nothing else)

```text
Edit this exact image. Remove only the pupils from his calm eyes behind the glasses, so the eyes are plain white, with the same eyelids, outline and shading. Keep the glasses, the tie and everything else exactly as they are.

Change nothing else: same pose, same position, same size, same lighting, same background, same pixels everywhere outside the pupils.
```

### 11. Swimming, goofy (attach `side-goofy.png`)

```text
Use the attached image as the reference for this penguin character: same painted illustration style, same colours, same big round goofy eye.

Draw ONE single view of him swimming underwater, seen exactly from the side, his bill pointing to the left of the picture. His whole body is horizontal and streamlined like a torpedo, his head stretched forward in line with his body with no bend at the neck, his bill pointing straight ahead to the left. His near flipper lies flat along his side, pointing back towards his tail. His feet are tucked back behind his tail.

Pure plain white background: no water, no bubbles, no text, no labels, no shadow. Landscape format (3:2), the whole penguin in frame with some margin, as large as possible.
```

### 12. Swimming, professional (attach `swim-goofy.png` and `side-professional.png`)

```text
Edit the first image. Add the round black glasses, the calm professional eye and the purple patterned tie from the second image, as they would look on him swimming, seen from the side.

Change nothing else: same pose, same position, same size, same lighting, same background, same pixels everywhere outside the glasses, the eye and the tie.
```

### 13. Swimming without the flipper (attach `swim-goofy.png`, nothing else)

```text
Edit this exact image. Remove his near flipper completely and paint the side of his body that was behind it, continuing the grey back and the white belly naturally, with the same feather texture and lighting.

Change nothing else: same pose, same position, same size, same lighting, same background, same pixels everywhere outside the area where the flipper was.
```

## Before running the script, check

- Every image is the same size as `front-goofy.png`, with his feet fully in frame.
- A plain white background: no text, labels, logos or shadow (Gemini sometimes adds them anyway; then ask it to remove them).
- Each professional image lines up with its goofy one. If Gemini moved him, ask again with "keep everything identical to the input image except the tie, glasses and eyes".

Small differences in colour, height or position between the views are fine: the script matches every view's plumage tone to the front view, puts his feet on the front view's ground line and centres his body on the same line.

## What the script does

1. **Background:** a flood fill from the edges through near-white pixels; the outline gets a soft edge.
2. **The tie and glasses:** where the professional front view differs from the goofy one, within the area of the glasses and of the tie.
3. **The nine parts** of the front view: head, body, both flippers, both feet and the tail. The flippers are cut at the gap Gemini drew between flipper and body, row by row; above it, along the shoulder. The head fades softly into the neck.
4. **The pupils:** where each front view differs from its edit without pupils, within the area of the glasses, both eyes as one layer. The head and the glasses get empty eyes from the same edits, mixed in only where the pupils were. Two thresholds: a low one to empty the eyes (no ring of a pupil's soft edge stays behind), a high one for the moving pupils (no piece of the eye's outline, which Gemini redraws slightly, moves along).
5. **The side figure's feet:** only their dark pixels, fading in at the ankle like the neck, so a turning foot takes no white feathers along and shows no straight cut. The body keeps a fading strip under the ankles, painted leg behind a turning foot. The two side feet overlap in the drawing, so they share one pivot and always turn together.
6. **The rig:** each part's box becomes its `size` and `position` on the 1600 × 1500 artboard, and the joints become the pivots.
7. **The turntable:** the front view and the four views, whole, per mood, with the tone, ground line and centre matched, plus three mirrored views.

The cut lines belong to these images: they are in one settings object at the top of `scripts/cut-kalman-layers.ts`. A new front view needs its own numbers; check the result in the preview with **Show pivots** and the **Flippers up** pose. The logic itself is in `scripts/lib/kalman-cut.ts`, with unit tests.

## How the rig uses a layer

| Field | Meaning |
|---|---|
| `image` | The file, relative to `src/assets/kalman/`. |
| `size` | Width and height on the artboard. |
| `position` | Where the image's top-left corner sits at rest. |
| `pivot` | The point it turns around, in the image's own coordinates (from its top-left corner). |
| `parent` | The layer it hangs from: it moves along with that layer. |
| `order` | Drawing order: higher is in front. The flippers are behind the body. |
| `rotate` | How far it may turn from rest, `[min, max]` in degrees, clockwise positive. |
| `stretch` | Only on layers that may squash and stretch (bodies and heads): `[min, max]`, around 1 (rest). 0.9 is 10% shorter and correspondingly wider. |
| `shift` | Only on the pupils: how far the offset may go from rest, `[x, y]` each way, so they stay inside the eyes. |
| `accessory` | `true` for the tie, the glasses and the professional pupils: only shown on his professional side. |
| `mood` | `"goofy"` for the goofy pupils: only shown in that mood, so they never peek out behind the calm eyes. |

**Left and right are as seen by the viewer** (the flipper on the left of the picture is `flipperLeft`).
