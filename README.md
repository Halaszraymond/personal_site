# halaszraymond.com — portfolio v2

The new version of halaszraymond.com: an employer-facing portfolio with real wow factor, built around one original character, **a fishing emperor penguin in 3D**.

> Status: Phase 0 (setup) is done; Phase 1 (Keizer Kálmán) is next. This document is the source of truth. If a decision changes, update this file first.

---

## 1. Goal and audience

- **What:** a portfolio site people remember and pass on.
- **Who it's for:** employers and recruiters (data / data science / analytics), plus anyone who wants to get to know Raymond.
- **What they should take away:** Raymond finds patterns in messy data, builds things himself from start to finish, and does it in three languages.
- **Must-haves for employers:** case studies (problem → approach → result), a clear way to get in touch, and a CV download.

## 2. The concept: the fishing penguin

**The core idea.** *Visser* (Dutch) and *Halász* (Hungarian) both mean "fisherman". Raymond fishes patterns out of data. An emperor penguin hunts by diving: it is the deepest-diving bird in the world and reaches more than 500 metres. So the site is **one dive**, and the penguin takes the visitor down with him.

### 2.1 The emperor (the character)

- **Name:** **Keizer Kálmán** (*Emperor Kálmán* in English), Kálmán for short. Where the name comes from and how it reads in each language: see §2.2.
- **Species:** emperor penguin (*Aptenodytes forsteri*).
- **Style:** **stylised low-poly 3D**, built entirely in code (Three.js), no purchased model. He should read as design, not as a stock model.
- **Original character:** Kálmán must not resemble existing penguin characters or mascots.
- **Features to keep through the stylisation:** black head and back, white belly, the **golden-orange ear patches** that fade towards the chest, and a slender bill with an orange/pink stripe on the lower mandible.
- **We build the playground first:** a page with the emperor and sliders for body shape, head and bill size, the colour and intensity of the neck patch, the faceting (polygon count) and the swimming motion. Raymond plays with it until it feels right, and those values become the final config. The playground is dev-only in Phase 1 and later becomes a **public `/playground`** (in all three languages), linked from the "this website" case study: "play with Kálmán yourself".
- **Personality:** a dual personality. His **goofy** side is funny and playful; his **professional** side is polite and to the point. He switches between them depending on what the visitor does (see §2.5). The professional side gets two small low-poly accessories, a **tie** and **reading glasses**, which are part of the config like the rest of his shape.
- **Animations:** standing on the ice (idle), diving, swimming (flipper strokes), chasing a fish, bowing when clicked, following the cursor with his head, and, as the finale, launching out of the water with a trail of air bubbles.

### 2.2 Name: Keizer Kálmán ✅

Dutch *keizer* ("emperor") + the Hungarian name Kálmán. Rudolf Kálmán was a Hungarian mathematician; the **Kalman filter** estimates from noisy data where something is moving, which is exactly what a hunting penguin does with a fish. That story can come back in the "Who I am" section or in the making-of.

**Per language:**

| Language | Name | Note |
|---|---|---|
| NL | **Keizer Kálmán** | |
| HU | **Császár Kálmán** | Name order on purpose: it reads like a Hungarian surname + given name (Császár is a real surname), mirroring *Halász Raymond*. |
| EN | **Emperor Kálmán** | |

In the rest of this document: **Kálmán** or **the emperor**.

### 2.3 The dive: storyline and sections

Scrolling = diving. A **depth gauge** on the side follows along. It is also the navigation (**express dive**): click a depth and Kálmán dives there at rocket speed, so nobody has to scroll the whole dive to reach the projects or the CV.

**The hero gives a recruiter everything at first sight.** Kálmán stands in the middle, with his two sides next to him:

- **Goofy side:** a fishmonger's **"catch of the day" board** on the ice with the key facts in plain HTML (name, data scientist, Budapest, NL/HU/EN, top projects, buttons for CV, the catch and contact), plus the express dive.
- **Professional side:** Kálmán with a **fish in his bill that is the CV**; click it and he hands it over with a bow.
- His mood follows which side the cursor (or finger) is on.

| Depth | Section | Content | Mood |
|---|---|---|---|
| 0 m | **The ice (hero)** | The emperor on the ice edge, with a school of glowing fish underwater that together form "Raymond Visser / Halász Raymond". He dives at the first scroll. | Ice blue, southern lights (aurora australis) |
| 0–100 m | **Who I am** | Visser = Halász, Netherlands → Budapest, three languages. The fish arrange themselves into charts (see 2.4). | Light still filters through the water |
| 100–250 m | **Work** | FrieslandCampina, Leger des Heils (Salvation Army NL), earlier EY. | Twilight zone |
| 250–400 m | **Education** | ELTE MSc, Windesheim BSc + Honours. | Almost dark |
| 400–564 m | **The catch** | Projects (see §4), glowing like deep-sea creatures. Plus the **sonar** with live Pi stats. | Ink black, bioluminescent |
| ↑ | **Contact** | The **ascent**: after 564 m the visitor keeps scrolling down, but the depth gauge counts back to 0 while the emperor shoots up and launches himself out of the water onto the ice. Contact is also always one click away via the hero (board and CV fish). LinkedIn, GitHub, email, CV download. | Back to the light |

**The bottom is at 564 m** ✅: the deepest accurately measured dive by any bird, by an emperor penguin off eastern Antarctica. The study, which fitted 93 penguins with time-depth recorders, was a collaboration between the Australian Antarctic Division and Phillip Island Nature Park and was published in *Polar Biology* (2006). Source: [Guinness World Records – Deepest dive by a bird](https://www.guinnessworldrecords.com/world-records/deepest-dive-by-a-bird). Idea: a small sign at the bottom reading "564 m · world record · emperor penguin".

Additional facts ✅ (verified 2026-10-25):
- **Longest dive: 32.2 minutes**, by an emperor penguin in the Ross Sea (Goetz et al. 2018, *Marine Ecology Progress Series*). Source: [Guinness World Records – Longest dive underwater by a bird (duration)](https://www.guinnessworldrecords.com/world-records/523667-longest-dive-underwater-by-a-bird-duration).
- **The most profitable hunting depths are 50–225 m** (Zimmer et al. 2010, Adélie Land, [PDF](https://epic2-clone.awi.de/22543/1/Zim2010a.pdf)), so the "Work" section sits where the emperor catches the most. Most dives are shallower and short: typically 21–40 m and 4–5 minutes (Kooyman & Kooyman 1995, *The Condor*, [PDF](https://sora.unm.edu/sites/default/files/journals/condor/v097n02/p0536-p0549.pdf)). Don't write "normal dives go to 100–200 m"; that isn't supported.

### 2.4 The data layer (what makes the site "data")

- **Dive profile:** while scrolling, the depth gauge draws a line, just like real charts from tagged emperor penguins. The visitor's own visit becomes a dataset. At the bottom or at contact, their profile can be shown ("your dive: 2:14 min, max 564 m — Kálmán can hold his breath for over half an hour").
- **Fish become charts:** the school the emperor herds together falls into place in "Who I am" as visualisations of languages (NL/HU/EN), tools (Python, R, SQL, Java, Power BI, Databricks, Grafana) and the route Netherlands → Budapest.
- **Sonar:** live stats from Raymond's Raspberry Pi home server (uptime, requests blocked by Pi-hole, possibly temperature), displayed as a sonar reading. See §5.3 for the secure setup.

### 2.5 Personality and surprises

- **Tone of voice:** humor in the wrapping, seriousness in the content. Kálmán, microcopy, buttons, loading states and the 404 can be playful; case studies (problem → approach → result) and the CV stay factual. Jokes are **written per language**, not translated, because puns don't carry over.
- **Switching personality:** after the hero, the goofy Kálmán is the default. Serious actions make him professional: clicking the CV → tie on and a bow; opening a case study → reading glasses on; closing it → glasses off and a wink.
- **Fleeing fish:** small fish swim around the screen and dart away from the cursor (or a tap on mobile), then come back curiously when it stays still. Decorative only (`aria-hidden`), and still or hidden with `prefers-reduced-motion`.
- The emperor follows the cursor with his head and bows when you click him.
- When the visitor stops scrolling, he floats calmly and now and then chases a small fish.
- Secret key combination (e.g. the Konami code) → a whole colony on the ice.
- **404 page:** the emperor drifts, lost, on an ice floe.
- Optional underwater sound, **off by default**, with a clear toggle.

### 2.6 Colour and typography

- **Palette:** ice white → deep-sea blue → ink black (the colour follows the depth), with the **golden orange of the ear patch** as the only accent colour: buttons, depth gauge, key words.
- All text must meet WCAG AA contrast, including in the darkest layer.
- **Typography:** still to choose. Direction: one characterful display font for headings and names, one highly readable font for body text, plus a monospace for the depth gauge and data labels. Must render Hungarian characters well (ő, ű, á, é). Open licence (OFL), self-hosted (no Google Fonts CDN).
- **Font playground:** like Kálmán, the fonts are chosen on a specimen page. Test text: *"Árvíztűrő tükörfúrógép · Császár Kálmán · 564 m"*, shown in all three depth colours at mobile and desktop width. Candidates:

  | # | Headings | Body text | Data / depth gauge | Character |
  |---|---|---|---|---|
  | 1 | Fraunces | Recursive (linear) | Recursive (mono) | The font morphs with Kálmán's mood: Fraunces `SOFT`/`WONK` and Recursive `CASL` up when goofy, down when professional. Casual Recursive only for buttons and Kálmán's lines, never long text |
  | 2 | Recursive | Recursive | Recursive (mono) | One file: maximum speed and consistency, less striking headings |
  | 3 | Bricolage Grotesque | Inter | JetBrains Mono | Modern and playful, no mood morph |
  | 4 | Fraunces | Atkinson Hyperlegible Next | Atkinson Hyperlegible Mono | Maximum readability |

## 3. Content about Raymond

Starting point (from the current site, **verify before publishing**):

- **Name:** Raymond Visser / Halász Raymond. Lives and works in Budapest.
- **Education:**
  - MSc Survey Statistics and Data Analytics, ELTE Budapest (2025–2027), VSBfonds scholarship.
  - BSc ICT – Applied Data Science & AI, Windesheim (2022–2025), with Honours Programme Technology & Society (2023–2024).
  - Earlier: accountancy at Windesheim (not completed).
- **Work:**
  - HR Trainee, HR Time & Attendance, FrieslandCampina Budapest (part-time, since Sep 2026).
  - Junior AI Specialist + graduation internship, Leger des Heils (data engineering and analytics in Azure Databricks and Grafana, setting up a data science team, Luisterlijn, Elasticsearch).
  - Audit internship, EY Utrecht (2020).
- **Other:** volunteer trip to Bulgaria (2024).
- **Languages:** Dutch (native), Hungarian (native/bilingual), English (C1).
- **Tools:** Python, R, SQL, Java, Power BI, Azure Databricks, Grafana.
- **Links:** LinkedIn `visser-raymond`, GitHub `Halaszraymond`. Email on the site: `raymond@halaszraymond.com`, forwarded to Raymond's inbox via Cloudflare Email Routing (see §6). Not `kalman@`, so nobody mistakes the mascot's name for Raymond's.
- **CV:** one English CV (PDF) for all three languages; NL/HU versions optional later. The file itself is chosen in Phase 3.
- **Photo:** yes, a small portrait in "Who I am" (possibly with Kálmán next to it), taken from Raymond's CV or LinkedIn photo. Raymond supplies the file in Phase 3.

## 4. Projects: the catch

All code is Raymond's own and may be used as a source for the case studies.

### Featured (3 full case studies)

1. **r-Frica Predicts:** predicts the results of the Africa Cup of Nations (AFCON). Written in R. The predictions are exported once as JSON and shown statically (no in-browser model).
2. **Raspberry Pi home server:** Pi-hole, Tailscale, Jellyfin, Uptime Kuma with WhatsApp alerts, Cloudflare Tunnel, SSH hardening, and a kiosk dashboard. With the live sonar.
3. **This website:** a vibe-coding project, built with Claude Code. A "making of": from concept to the emperor, with screenshots of the playground and intermediate versions. **So keep a build log from day 1** (`docs/making-of.md`) with decisions and screenshots.

Format per case study: one-line pitch · problem · approach · result/impact · tools · links (repo/demo) · 1–3 images.

### More catch (cards)

- **Blocky:** Raymond's own application (including a settings tab with themes and fonts).
- **Notification systems:** automatic alerts when web pages change, and price alerts when a product drops below a threshold price.
- **Veiligheidsregio IJsselland** (Dutch safety region): data science project.
- **4Vitae:** data science project.
- **Leger des Heils:** data science project (patterns in care and support trajectories).

### Material still needed (per project)

- [ ] Repo link(s) or access to the code
- [ ] Problem, approach, result in a few sentences
- [ ] Screenshots / charts / demo
- [ ] What may and may not be public (client names are fine; never show raw data)

## 5. Technology

### 5.1 Stack

| Part | Choice | Why |
|---|---|---|
| Framework | **Astro** | Fast, static, good i18n routing, islands for the 3D part |
| 3D | **Three.js** | The emperor, the fish school and the water |
| Scroll/animation | **GSAP + ScrollTrigger** on native scroll | Depth-driven animations. No smooth-scroll library (e.g. Lenis): native scroll is better for keyboard and screen-reader users, and it's one dependency fewer |
| Languages | **NL / HU / EN** via Astro i18n | `/nl`, `/hu`, `/en`. `/` shows the English site (no redirect); if the browser language is Dutch or Hungarian, a small hint in Kálmán's goofy voice offers that language. The visitor's choice is remembered, the switcher is always there, and every language version has `hreflang` links |
| Charts | D3 or custom SVG | Visualisations in "Who I am" and the dive profile |
| Hosting | **Cloudflare Pages** | Domain is already at Cloudflare; preview link per branch |
| Language (site) | **TypeScript (strict)** | See §5.4 for why not Python in the browser |
| Data | **Static JSON** in `src/content/` | Chart data and the r-Frica predictions are small and fixed; a TS test validates them. No build-time pipeline |
| Language (Pi) | **Python (FastAPI)** | The read-only sonar endpoint on the Raspberry Pi; repo location decided in Phase 5 |
| Analytics | **Cloudflare Web Analytics** | Cookieless, so no cookie banner. One switch in Cloudflare Pages |

### 5.2 Quality requirements

- **Performance:** Lighthouse ≥ 90 on mobile. The 3D part is lazy-loaded; the first paint is visible immediately, without waiting for WebGL.
- **Fallback:** with `prefers-reduced-motion`, no WebGL or a weak device, you get a good-looking static version (rendered stills of the emperor). Never a broken or empty site. The check runs in three steps, from cheap to expensive:
  1. `prefers-reduced-motion` → fallback.
  2. No WebGL2, or Save-Data on → fallback.
  3. Measure the first ~2 s: if the median frame time is over 33 ms (< 30 fps), first step down the quality (pixel ratio, fewer fish); still too slow → fallback.

  Plus a **"lite mode"** switch in the footer, so the visitor can always choose. (`deviceMemory` is not used: only Chrome supports it.)
- **Fallback stills:** a Playwright script renders them from the final Kálmán config, run locally on a GPU for the best quality, and they are committed as AVIF/WebP with the **config hash** in their metadata. A test fails if the config changes without new stills.
- **Accessibility:** all content is plain, readable HTML (not in canvas), keyboard-navigable, with alt text and AA contrast.
- **Mobile:** designed for phones first, with touch instead of a cursor.
- **SEO/sharing:** good title, description and Open Graph image (the emperor on the ice), per language.

### 5.3 Live Pi stats (sonar): secure setup

- The Pi publishes **only** a small, read-only JSON endpoint with aggregated numbers (no IPs, no domain names, no logs).
- Reachable via a **Cloudflare Tunnel** on its own subdomain. The existing `stamlijst` subdomain and its tunnel stay untouched.
- **Browsers never talk to the Pi directly.** A small **Pages Function** (`/api/sonar`, TypeScript, same origin as the site) fetches from the Pi at most once per 60 s (edge cache) and stores the last reading in **Cloudflare KV**. When the Pi is offline, it serves that "last reading", so the site never stalls.

  ```
  browsers --> /api/sonar (Pages Function) --> 60 s cache / KV --> Tunnel --> Pi
  ```
- The Pi endpoint (Python, FastAPI) lives in **its own repo**, alongside Raymond's Pi setup; the Pi server case study links to it. This repo stays TypeScript only.

### 5.4 Coding requirements

**Principle:** top quality, while written so that Raymond (strong in Python/R/SQL, new to TypeScript) can read every line and explain it in a job interview. Employers will read this repo too.

**Why TypeScript for the site and not Python in the browser:** Python in the browser (PyScript/Pyodide) first loads a Python runtime of several MB. That kills the first impression and the Lighthouse score, and there is no full-featured 3D library for it. Server frameworks like Streamlit or Reflex need a running server and aren't made for this kind of WebGL experience. So this repo is TypeScript only. Python and R show in their own projects, where they are strongest: r-Frica Predicts (R) and the Pi server (Python), linked from the case studies.

**Readability**
- TypeScript in `strict` mode; no `any`.
- Every file starts with a short comment block: what it does and how it fits into the whole.
- Comments explain the *why*. In 3D and animation code, the maths or concept is briefly explained too (e.g. "quaternion = rotation without gimbal lock").
- Small functions with descriptive names, named constants instead of magic numbers, and no clever one-liners when a clear version works just as well.
- Where TypeScript does something that works differently in Python, a short comparison in the comment ("like a dataclass in Python").
- `docs/architecture.md`: an overview with a diagram of how the parts fit together (content → pages, scroll → depth → scene, JSON content → charts).
- `docs/glossary.md`: 3D and frontend terms in plain language.

**Structure**
- `src/content/`: texts, projects and translations (Markdown/JSON, Astro content collections). Changing content = never changing code.
- `src/components/`: UI components.
- `src/scene/`: everything 3D, split into `kalman/` (model, config, animations), `school/` (fish), `environment/` (water, light, southern lights) and `scroll/` (depth → scene).
- `src/i18n/`, `src/lib/` (pure logic, easy to test), `docs/`, `tests/`.
- Kálmán is **config-driven**: shape and colour in one file (the output of the playground).
- **Logic outside the renderer:** all behaviour (depth mapping, boids and fleeing from the cursor, the personality state machine, config validation) lives as pure functions in `src/lib/`. Three.js only draws what they compute, so it can be tested without a browser.

**Quality and tooling**
- ESLint + Prettier (TS); Ruff + mypy wherever Python code lives (the Pi endpoint). Automatic on save and on every commit (pre-commit hooks).
- Minimal dependencies: every package has to earn its place. Renovate/Dependabot keeps them up to date.
- Performance budgets are **enforced**, not just hoped for: base JS ≈ 50 KB, Three.js and the scene in a separate deferred chunk, Kálmán low-poly, the fish school via instancing, 60 fps on a mid-range phone, capped pixel ratio, and no rendering when the tab isn't visible.

**Testing** (quality comes first; "overkill" doesn't exist)
- **Unit tests (Vitest):** all pure logic, such as depth mapping, dive profile, i18n and config validation.
- **Python tests (pytest):** the Pi endpoint (Phase 5).
- **End-to-end (Playwright):** every page in NL/HU/EN, no console errors, working navigation and language switcher, the reduced-motion and no-WebGL fallbacks, and mobile and desktop widths.
- **Visual regression in layers** (an unintended visual change fails the test):
  1. Logic in Vitest (see "Logic outside the renderer").
  2. Screenshots of the HTML with the canvas masked: most baselines live here.
  3. 3D smoke tests: the canvas draws, no errors, and `renderer.info` budgets for draw calls and triangles.
  4. A few 3D snapshots with a fixed seed and clock, with a tolerance setting.

  Baselines are **always generated on Linux**, through a GitHub Action you trigger by hand (never on Windows, because font rendering differs). Scope: every section at 2 widths in EN, plus the hero in NL and HU.
- **Accessibility:** axe checks in Playwright on every page.
- **Lighthouse CI:** hard gate of ≥ 90 in all four categories on the **fallback version** (no WebGL), because that's reliable in CI. A second run on the **3D version** (software WebGL) only *reports* in the PR, so you can see trends, but it doesn't block the merge. Real 3D performance on a phone is checked by hand in Phase 4.
- **Bundle-size check** with hard limits.

**Planning with OpenSpec**
- Features are agreed on before they are built, with [OpenSpec](https://github.com/Fission-AI/OpenSpec) (installed globally via npm, configured for Claude Code).
- `openspec/specs/` holds the agreed specs: what the site does, as requirements. `openspec/changes/` holds proposed changes (proposal, design, spec deltas, tasks); finished changes move to `openspec/changes/archive/`.
- Flow: `/opsx:explore` (think it through) → `/opsx:propose` (write the change) → Raymond reviews → `/opsx:apply` (build it) → `/opsx:verify` (check it against the spec) → `/opsx:archive` (merge into the specs).
- Other workflows: `/opsx:new` + `/opsx:continue` (build a change one artifact at a time), `/opsx:ff` (fast-forward through all planning artifacts), `/opsx:update` (revise a change's plan), `/opsx:sync` (merge spec deltas without archiving), `/opsx:bulk-archive` and `/opsx:onboard` (a guided tutorial).
- This README stays the source of truth for the concept and decisions; the specs describe the concrete behaviour that follows from it.

**CI and Git**
- GitHub Actions on every push and PR: lint → type check → unit tests → build → Playwright → Lighthouse. A red build does not get merged. (The Pi endpoint and its Python tests live in their own repo, §5.3.)
- `main` is always deployable, and live from go-live onwards (after Phase 3). Work happens on feature branches with their own Cloudflare preview, via pull requests.
- Conventional commits (`feat:`, `fix:`, `docs:`, `test:`).

**Privacy and security**
- No cookies and no tracking apart from Cloudflare Web Analytics (cookieless).
- Security headers (CSP, HSTS, etc.) via a `_headers` file in Cloudflare Pages.
- Pi endpoint: aggregated numbers only (§5.3), with rate limiting.

## 6. Repo, hosting and going live

- **Repo:** `Halaszraymond/portfolio_site` (renamed from `personal_site`). The current site in the `halaszraymond.github.io` repo stays live until v2 is ready and serves as a fallback.
- **Development:** locally in VS Code with Claude Code. `npm run dev` for the dev server.
- **Previews:** connect the repo to Cloudflare Pages; every branch gets its own preview URL.
- **Email:** `raymond@halaszraymond.com` via Cloudflare Email Routing, forwarded to Raymond's inbox. Set up by Raymond (2026-10-25); it added MX/TXT records, and the `stamlijst` record stays untouched.
- **Going live (end of Phase 3):**
  1. In Cloudflare Pages, add the custom domain `halaszraymond.com` (and `www`).
  2. In Cloudflare DNS, remove the four A records pointing to GitHub (185.199.108–111.153) and the `www` CNAME pointing to `halaszraymond.github.io`. Pages creates the right records.
  3. Do **not** touch the `stamlijst` record.
  4. In the old repo, turn off GitHub Pages or remove the custom domain, so there's no conflict.

## 7. Phases

- [x] **Phase 0: setup.** Repo, Astro skeleton (TS strict), all tooling and the full CI pipeline from §5.4 (starting with one empty test page, so everything has to stay green from day 1), Cloudflare Pages preview, `docs/making-of.md`, `docs/architecture.md`. Plus the two skeletons everything else builds on, so CI tests them from day 1:
  - **i18n routing:** `/nl`, `/hu`, `/en`, one test string per language and a working language switcher.
  - **Fallback switch:** detects `prefers-reduced-motion` and missing WebGL and serves the static path. With no 3D yet, it's just an empty scene slot.

  **Rule from Phase 1 on:** every new feature ships in all three languages (placeholder text is fine) and with its fallback. Nothing gets "added later in polish".
- [ ] **Phase 1: Keizer Kálmán.** Playground with sliders → Raymond picks the shape → final config. Then the animations (idle, dive, swim, launch).
- [ ] **Phase 2: the dive.** All sections with depth gauge, colour gradient, fish school, and fish turning into charts. Placeholder text first.
- [ ] **Phase 3: content.** Real texts in NL/HU/EN, the 3 case studies, the "more catch" cards and a CV download. **Then go live** (§6): content complete, CI green, fallback working.
- [ ] **Phase 4: polish, on the live site.** Tuning and verifying, not building: performance, accessibility audit, mobile testing on real devices, SEO and Open Graph, and a review of the translations.
- [ ] **Phase 5: extras.** Live Pi sonar, colony easter egg, 404 on the ice floe, sound, the visitor's dive profile.

## 8. Open decisions

- [x] Name of the emperor: Keizer Kálmán (§2.2)
- [x] Record dive depth verified: 564 m, Guinness World Records (§2.3)
- [x] Additional dive facts verified: 32.2 min longest dive, 50–225 m most profitable hunting depths (§2.3)
- [ ] Fonts (§2.6): chosen with a font playground (specimen page with candidate pairs), like Kálmán
- [x] Email address: `raymond@halaszraymond.com` (§3, §6)
- [x] CV: one English PDF (§3); the file itself follows in Phase 3
- [x] Repo name: `portfolio_site` (§6)
- [x] Photo of Raymond: yes, small, in "Who I am" (§3)

## 9. License

The repo is public, so that employers can read how it's built. Code and content are licensed differently:

- **Code: [MIT](LICENSE).** Everything that is software: `src/` (except the content listed below), `scripts/`, `tests/`, `.github/` and the config files. Reuse it freely, with attribution.
- **Content: © Raymond Visser, all rights reserved.** The texts (`src/content/` and the UI texts in `src/i18n/ui.ts`), the documentation prose (this README and `docs/`), all images and screenshots, the CV, the photo, and the **Keizer Kálmán** character: his name, look and configuration. Not to be reused without permission.
