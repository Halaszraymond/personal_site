# Glossary

Frontend, animation and tooling terms used in this repo, in plain language. Where it helps, there is a comparison with Python.

**Linting**: automatically checking code for likely bugs and unsafe patterns, without running it. ESLint does this here; Ruff and flake8 do the same for Python.

**Formatting**: making code look the same everywhere (indentation, quotes, line length), so diffs only show real changes. Prettier does this here; Black and `ruff format` do the same for Python.

**Type checking**: checking, before running, that every value is used as its type allows: no calling `.toUpperCase()` on a number. `astro check` (TypeScript) does this here; mypy does it for Python. TypeScript is stricter than mypy by default, because unannotated code is still checked.

**`strict` / `strictest`**: TypeScript settings that switch on extra checks. `strictest` adds, for example, `noUncheckedIndexedAccess`: `list[5]` might be `undefined`, so the code has to handle that, just as Python can raise `IndexError`.

**`any`**: a TypeScript type that switches the checker off for one value. Banned here, because mistakes in `any` values only show up when the site breaks.

**Pre-commit hook**: a script Git runs just before it creates a commit. If the script fails, there is no commit. Here it runs ESLint and Prettier on the files you are committing. Python's `pre-commit` framework does the same thing.

**Type stripping**: Node 24 can run a `.ts` file directly by deleting the type annotations before running it, without checking them. Checking still happens in `npm run typecheck`. Comparable to how Python ignores type hints at runtime.

**npm script**: a named command in `package.json`, run with `npm run <name>`. Like a Makefile target or a `[project.scripts]` entry in `pyproject.toml`.

**`package-lock.json`**: the exact version of every installed package, including the packages of packages. `npm ci` installs exactly those versions, so CI and your laptop use the same code. Like a fully pinned `requirements.txt` or `poetry.lock`.

**Static site**: a site whose pages are finished HTML files before any visitor arrives. Nothing is computed per request on a server, which makes it fast, cheap and hard to break.

**Locale**: a language code such as `nl`, `hu` or `en`. Browsers report longer tags such as `hu-HU` (language plus region); we only use the language part.

**i18n**: short for "internationalisation" (an i, 18 letters, an n): making a site work in several languages.

**Canonical URL**: the one "official" address of a page, set with `<link rel="canonical">`. When two URLs show the same content (`/` and `/en/`), it tells search engines which one to list, so they don't see duplicates.

**hreflang**: a `<link rel="alternate" hreflang="hu">` tag that tells search engines "this page also exists in Hungarian, here". Google then shows Hungarian searchers the Hungarian version.

**`x-default`**: the hreflang value for "everyone else": the version for visitors whose language we don't have. For us that is `/`.

**localStorage**: a small key-value store in the visitor's browser, per website (like a tiny `dict` that survives a page reload). Unlike a cookie, it is never sent to a server.

**`aria-current`**: an attribute that tells screen readers "this link is the page you are on". Part of ARIA, the set of attributes that describe a page to assistive technology.

**Endonym**: a language's own name for itself: "Magyar", not "Hungarian". Language switchers use endonyms, so visitors recognise their own language.

**404**: the HTTP status code for "this page doesn't exist". A real 404 (instead of showing the home page with status 200) tells browsers and search engines the truth.

**Fallback**: the static version of the site: all content, no 3D. Visitors get it with reduced motion, without WebGL2, with Save-Data, or without JavaScript. Never a broken page.

**Full mode**: the version with the 3D scene. Only switched on when every check passes.

**WebGL / WebGL2**: the browser's interface to the graphics card, used to draw 3D in a `<canvas>`. Three.js builds on it. WebGL2 is the newer version, available in all modern browsers but not on every old or locked-down device.

**`prefers-reduced-motion`**: an operating-system setting ("reduce motion" / "remove animations") that websites can read. People with motion sensitivity or vestibular disorders use it, so we respect it with the calm fallback.

**Save-Data**: a browser setting that asks websites to use less data. Only Chromium-based browsers report it (`navigator.connection.saveData`).

**Island**: in Astro, an interactive part of an otherwise static page. Only that part loads JavaScript; the rest stays plain HTML. Kálmán's 3D scene will be an island.

**`data-` attribute**: a custom attribute on an HTML element, such as `data-render-mode="full"`. CSS, scripts and tests can read it; in JavaScript it appears as `element.dataset.renderMode`.

**Init script (Playwright)**: code a test injects before the page's own scripts run, for example to pretend a browser has no WebGL2. Comparable to `unittest.mock.patch` in Python.

**Mermaid**: a text format for diagrams (`flowchart TD`, arrows with `-->`). GitHub draws them automatically in Markdown files.

**CSP (Content-Security-Policy)**: a header that tells the browser which sources may provide scripts, styles, images and so on. Ours says "only our own domain, nothing inline", so code injected into a page cannot run.

**HSTS (Strict-Transport-Security)**: a header that tells the browser "only ever use HTTPS for this domain", for a set time. Protects against downgrade attacks on public Wi-Fi.

**`_headers`**: Cloudflare Pages' file for setting HTTP headers: a path pattern, then indented `Name: value` lines.

**XSS (cross-site scripting)**: an attack where someone gets their own JavaScript to run on your site. The CSP is the main defence.

**axe**: an accessibility checker that tests a page against the WCAG rules (contrast, labels, landmarks, language attributes…). It runs inside the Playwright tests.

**WCAG / AA**: the Web Content Accessibility Guidelines. AA is the middle of three levels and the usual legal and practical target.

**Lighthouse**: Google's tool that scores a page from 0 to 100 on performance, accessibility, best practices and SEO. `npm run lighthouse` runs it five times per page and fails when the median is below our threshold of 90.

**Visual regression test**: a test that takes a screenshot and compares it pixel by pixel with an approved one, the **baseline**. Any unintended change in how the page looks fails the test.

**Fixture (Playwright)**: setup code that runs around each test, like a pytest fixture. Ours adds the production headers to every response.

**gzip**: a compression format. Servers send files gzipped, so the size that matters for loading speed is the gzipped size, which is what the bundle budget measures.

**Bundle**: the JavaScript files the build produces for the browser. "Bundle size" is how much JavaScript a visitor has to download.

## Kálmán's figure

**Cut-out animation**: animating a character made of separate flat pieces (head, body, flippers…) that are moved and turned, like a paper puppet with split pins. One set of drawings gives every pose.

**Layer**: one of those pieces: one image with a transparent background.

**Artboard**: the drawing area all layers are placed on, 1600 × 1500 units here. Positions are measured on it from the top-left corner, with y pointing *down* (the SVG convention, the opposite of a maths graph).

**SVG**: a picture format made of shapes and text instead of pixels, which the browser draws at any size. Kálmán's figure is one SVG in the page's HTML, holding one image per layer.

**Rig**: the description of how the layers fit together: where each sits, where it turns, which layer it hangs from and in which order they are drawn. Here it is data (`rig.json`), not code.

**Pivot**: the point a layer turns around, such as the shoulder for a flipper. Turning around the pivot keeps that point in place and swings the rest of the layer around it.

**Parent and child layer**: a child hangs from its parent and moves along with it: when the head (parent) tilts, the glasses (child) tilt with it. The body is the one layer without a parent (the *root*).

**Pose**: a still position of the figure, stored as "turn this layer so many degrees, shift that one so far" relative to rest. Layers a pose doesn't mention stay at rest.

**Transform matrix**: six numbers that move, turn and scale points in one step; SVG writes it as `matrix(a b c d e f)`. Combining two transforms is multiplying their matrices, like `A @ B` in NumPy, and the order matters: turning then moving is not the same as moving then turning.

**Drawing order (z-order)**: which layer is drawn on top of which. Later-drawn layers cover earlier ones. Here it is set per layer (`order`), separately from parent and child, so a flipper that hangs from the body can still be drawn behind it.

**Turntable**: turning a figure around to see it from every side, like a cake on a turning plate. Here it switches between drawn views (front, ¾, side, ¾ back, back) instead of rotating a 3D model.

**Crossfade**: fading one image in while another is still showing, so a switch doesn't jump. On the turntable the next view fades in on top of the current one.

**Mirroring**: flipping an image left to right. The side seen from the left is the side seen from the right, flipped, so four drawn views give eight angles.

**Flood fill**: colouring every connected pixel of the same kind, starting from one point, like the paint-bucket tool. The cutting script uses it from the image's edges to find the white background, which leaves the (enclosed) white belly alone.

**Alpha**: how solid a pixel is, from 0 (fully transparent) to 1 (fully solid). A PNG stores it as a fourth value next to red, green and blue.

**Polygon (traced outline)**: a shape given as a list of corner points. The side flipper lies on the body, so there is no background around it to find it by; its outline is traced once on the image and the script cuts along it, with a smooth edge (each pixel tested at 16 points: anti-aliasing).

## Kálmán's animations

**Keyframe**: a fixed moment in an animation: "at 0.6 s he is in the bow pose". The animation is everything in between, worked out by the computer. Here an animation is a list of keyframes in `animations.json`.

**Interpolation (blending)**: working out the values between two keyframes. Halfway from a head at 0° to a head at 20° is 10°. Like `numpy.interp`, for every layer's rotation and offset at once.

**Easing**: how the speed changes during a movement. `none` is a constant speed (mechanical), `power2.out` starts fast and slows down at the end (like something coming to rest), `sine.inOut` starts and ends gently (like breathing). The easing bends the progress (0 to 1) before it is used for the blend.

**Timeline / tween**: GSAP's words. A *tween* changes a value from A to B over time (here: the animation's clock, from 0 to its length); a *timeline* strings tweens together. Here GSAP only runs the clock; the poses come from the keyframes.

**Scrubbing**: moving through an animation by hand, like dragging the playhead of a video. The preview's scrub slider holds the animation still at a chosen moment.

**Loop**: an animation that starts again when it ends (idle, swim), until something else starts.

**Head-follow**: the head turning towards the pointer. The further to the side the pointer is, the further the head turns, up to the end of its range; `gsap.quickTo` makes it glide there instead of jumping.

**Figure (front, side)**: Kálmán is posable from two angles, each with its own rig of layers. Idle, bow and head-follow use the front figure; dive, swim and launch the side one.
