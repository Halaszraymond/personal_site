# Making of halaszraymond.com v2

The build log of this site: what was decided, what was built, and what went wrong along the way. It is the raw material for the "this website" case study (README §4). Every decision is also listed, one line each, in [PLANNING_LOG.md](../PLANNING_LOG.md).

---

## 2026-10-25 · The concept and Phase 0

### The concept

The idea comes from two surnames. *Visser* (Dutch) and *Halász* (Hungarian) both mean "fisherman", and Raymond fishes patterns out of data. The emperor penguin is the deepest-diving bird in the world, so the site became **one dive**: scrolling is diving, a depth gauge doubles as navigation, and the bottom is at **564 m**, the record dive of an emperor penguin (verified via Guinness World Records). The guide is an original low-poly penguin: **Keizer Kálmán** in Dutch, **Császár Kálmán** in Hungarian (name order as in *Halász Raymond*) and **Emperor Kálmán** in English. He is named after Rudolf Kálmán, whose Kalman filter estimates where something moves from noisy data, which is exactly what a hunting penguin does.

Before writing any code, a long README review settled the hard questions:

- **The hero has to work for a recruiter in five seconds**: a "catch of the day" board with the key facts, and Kálmán holding the CV in his bill.
- **Kálmán has two personalities**, goofy and professional (tie and reading glasses), switched by what the visitor does. The rule: humour in the wrapping, seriousness in the content.
- **Never a broken page**: a static fallback for reduced motion, missing WebGL2, Save-Data or slow devices.
- **Quality is enforced, not hoped for**: Lighthouse ≥ 90, accessibility checks, visual regression, performance budgets, all in CI from day 1.
- **The site email became `raymond@halaszraymond.com`**, not `kalman@…`: otherwise visitors might think the penguin's name is Raymond's.

### Planning Phase 0 with OpenSpec

Every feature is first written down as an OpenSpec change: a proposal (why), specs (what, as testable scenarios), a design (how) and tasks. Raymond reviews it before anything is built. Phase 0 became one change, `phase-0-setup`, with two capabilities: **i18n-routing** (which URL shows which language) and **render-fallback** (3D or static). Each spec scenario, such as "WHEN a visitor with a Hungarian browser opens `/` THEN a Hungarian hint appears", became an automated test.

### What was built

A site with no content yet, but with the skeleton everything else will stand on:

| Dutch | Hungarian | English |
|---|---|---|
| ![The Dutch page](images/phase-0/nl.png) | ![The Hungarian page](images/phase-0/hu.png) | ![The English page](images/phase-0/en.png) |

- **Three languages** at `/nl/`, `/hu/`, `/en/`; `/` shows English **without redirecting**, with canonical and hreflang links for search engines.
- **A language hint** on `/` for Dutch and Hungarian browsers, written in the language it offers. The choice is remembered in the browser, without cookies.
- **A real 404** in all three languages (Kálmán's ice floe follows in Phase 5).

| The hint for a Hungarian browser | The 404 |
|---|---|
| ![The root with the Hungarian hint](images/phase-0/root-hint-hu.png) | ![The 404 page](images/phase-0/404.png) |

- **Fallback first**: every page is built as finished HTML in fallback mode. A 1 KB script switches to full mode only when there is no reduced-motion setting, WebGL2 works and Save-Data is off. The decision is a pure function, tested for all 8 combinations.
- **The quality chain**, in CI on every push: lint → type check → 43 unit tests → build → bundle budget (**1.0 KB** of JavaScript, budget 50 KB) → **162 end-to-end tests** in four browsers (desktop and mobile Chromium, iPhone WebKit, Firefox), with axe accessibility checks and the production security headers → 8 visual baselines → Lighthouse (**98–100** in all four categories).
- **Hosting** on Cloudflare Pages, with a preview URL for every branch.

### What went wrong, and what it taught us

- **The work laptop sits behind Zscaler**, which re-signs all HTTPS traffic. Node didn't trust it, so `npm install` failed. Fix: `NODE_USE_SYSTEM_CA=1` lets Node use the Windows certificate store, instead of the common but dangerous "turn off certificate checks".
- **TypeScript 7 was too new.** The lint and Astro tools didn't support it yet, so the site uses TypeScript 6 for now.
- **Astro inlined small scripts** into the HTML, which the strict security policy (CSP) would block in production. Astro now loads everything as separate files, and a test proves that an inline script would fail the build.
- **The first Cloudflare project was accidentally a Worker**, not a Pages project. The dashboard steers new projects towards Workers; the tell was a field asking for a "deploy command".
- **Lighthouse CI (`@lhci/cli`) turned out to be abandoned**, with 16 known vulnerabilities in old dependencies. It was replaced by Lighthouse itself plus a 60-line gate script of our own, with 0 vulnerabilities.
- **Lighthouse scores jumped between 83 and 100** for the same page on the laptop: background load, not the site. The gate now measures each page five times, taking turns between pages, and uses the median, without lowering the bar of 90.
- **Astro's telemetry hung for 40 seconds** on the work network before the preview server started. It is switched off for test servers.
- **GitHub only offers "Run workflow"** for workflows on the main branch, so the visual-baseline workflow went to `main` first.

---

## 2026-10-25 · Phase 1 begins: the Kálmán playground

### The plan

Kálmán's look can't be decided on paper, so Phase 1 starts with a **playground**: Kálmán drawn live in 3D, with a slider for every part of his shape. Raymond plays until he feels right and copies the config; that config becomes the one file every later scene builds on. The OpenSpec change `kalman-playground` covered three specs: `kalman-config` (what may vary and within which limits), `kalman-playground` (the page), and two small clarifications in `i18n-routing` that this work brought to light.

Four choices were Raymond's: the animations come in a later change; the playground is **dev-only** (local, CI and branch previews, never production); its interface is English until it becomes the public `/playground/`; and the chosen values travel as JSON via a "Copy config" button.

![The playground](images/phase-1/playground.png)

### How Kálmán is built

- **One table of parameters** (height, girth, belly, head, bill, ear patch, faceting, flippers, swim, tie, glasses) drives the config type, the validation, the defaults and the sliders. The black, the white and the bill stripe are deliberately *not* parameters: no setting can stop him being an emperor penguin, and a test checks that at the extreme settings.
- **Body and head are one "lathe"**: a side silhouette spun around the vertical axis with few segments, which gives the faceted low-poly look. Every facet gets one flat colour.
- All the numbers live in pure functions (`kalman-shape.ts`), so they are unit-tested without a browser; Three.js only draws them.

| Default | Professional side | From the side |
|---|---|---|
| ![Default Kálmán](images/phase-1/kalman-default.png) | ![With tie and reading glasses](images/phase-1/kalman-professional.png) | ![Side view](images/phase-1/kalman-side.png) |

| Faceting 0 | Faceting 3 |
|---|---|
| ![Faceting level 0](images/phase-1/kalman-faceting-0.png) | ![Faceting level 3](images/phase-1/kalman-faceting-3.png) |

### What went wrong, and what it taught us

- **The first Kálmán was a snowman.** Technically everything worked, but he read as an egg with a ball on top: far too wide, flippers buried inside the belly, a bill pointing straight at the camera like a little smile, barely visible ear patches. Looking at a screenshot before showing anyone was worth it. The fixes: emperor proportions (about 0.42 wide for 1 tall), flippers that compute how far to swing out to clear the belly, a black throat (real emperors have one; Tux doesn't), a longer bill, a slightly sideways camera, and a sharper ear patch.
- **Colour per triangle gave a saw-tooth belly edge**, because each facet is two triangles that could get different colours. Colouring per facet fixed it. A facet that flipped between black and white row by row turned out to sit exactly on the belly's 60° edge; moving the edge to 69° keeps it away from every facet centre.
- **Three.js computes in linear light**, so the sRGB plumage colours have to be converted, or his black renders grey.
- **Keeping the playground off production** turned into a small Astro integration that only adds the route with `PLAYGROUND=1`, plus a check that fails CI if the playground or Three.js ever appears in the production build.
- **Bundle budgets became per page:** the public pages still load about 1 KB of JavaScript; the playground loads 149 KB, almost all of it Three.js.

---

## 2026-10-26 · The turning point: from code-built 3D to a 2D illustration

### What happened

After the first playground, Raymond's verdict was clear: "he's not smooth at all". Instead of more slider tweaking, he designed Kálmán himself with an AI image generator: a turnaround sheet (front, side, back, three-quarter), the same sheet with the tie and reading glasses, and four scenes that show his personality (skating with an ice cream, holding a fish, reading a map by an igloo, building a fish snowman).

| The design sheet | With his professional side |
|---|---|
| ![Kálmán's turnaround sheet](images/kalman-design/turnaround.png) | ![With tie and reading glasses](images/kalman-design/turnaround-professional.png) |

![Kálmán's personality, in four scenes](images/kalman-design/personality-scenes.png)

Rebuilding that design in code went a long way (smooth shading, navy and cream, a golden ear crescent, a chest wash, a tail, eye highlights), but it kept looking like a plastic version of a painting. A shape spun from a profile line can't carry the feathers, outlines and expressive head of an illustration.

### The decision

Three options were on the table: an AI image-to-3D model, a 3D artist, or **Kálmán as a 2D illustration**. Raymond chose 2D, for the whole site: his own design, exactly as drawn, animated as a **cut-out figure** (separate layers for body, head, flippers, feet, tail, tie and glasses, moved in code). It is also lighter and faster than 3D, which helps on phones and in Lighthouse.

### What it taught us

- **Decide the look with the right tool.** Sliders are good for tuning; they are a poor way to *design* a character. An image generator got to Raymond's Kálmán in minutes.
- **A good process makes a change of direction cheap.** The 3D work stays on its branch, the general improvements (per-page budgets, the production-build check, the dev-only route) move on, and the README, planning log and specs record why.
