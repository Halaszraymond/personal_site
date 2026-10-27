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

In a side view the flipper lies *on* the body, so there is no white gap to cut along. The difference with the flipper-less image is exactly the flipper, and that image gives the body as it looks under the flipper, so a swinging flipper never leaves a copy of itself behind.

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

## Before running the script, check

- Every image is the same size as `front-goofy.png`, with his feet fully in frame.
- A plain white background: no text, labels, logos or shadow (Gemini sometimes adds them anyway; then ask it to remove them).
- Each professional image lines up with its goofy one. If Gemini moved him, ask again with "keep everything identical to the input image except the tie, glasses and eyes".

Small differences in colour, height or position between the views are fine: the script matches every view's plumage tone to the front view, puts his feet on the front view's ground line and centres his body on the same line.

## What the script does

1. **Background:** a flood fill from the edges through near-white pixels; the outline gets a soft edge.
2. **The tie and glasses:** where the professional front view differs from the goofy one, within the area of the glasses and of the tie.
3. **The nine parts** of the front view: head, body, both flippers, both feet and the tail. The flippers are cut at the gap Gemini drew between flipper and body, row by row; above it, along the shoulder. The head fades softly into the neck.
4. **The rig:** each part's box becomes its `size` and `position` on the 1600 × 1500 artboard, and the joints become the pivots.
5. **The turntable:** the front view and the four views, whole, per mood, with the tone, ground line and centre matched, plus three mirrored views.

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
| `accessory` | `true` for the tie and the glasses: only shown on his professional side. |

**Left and right are as seen by the viewer** (the flipper on the left of the picture is `flipperLeft`).
