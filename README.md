# halaszraymond.com — portfolio v2

The new version of halaszraymond.com: an employer-facing portfolio with real wow factor, built around one original character, **a fishing emperor penguin in 3D**.

> Status: concept is final, build not started yet. This document is the source of truth. If a decision changes, update this file first.

---

## 1. Goal and audience

- **What:** a portfolio site people remember and pass on.
- **Who it's for:** employers and recruiters (data / data science / analytics), plus anyone who wants to get to know Raymond.
- **What they should take away:** Raymond finds patterns in messy data, builds things himself from start to finish, and does it in three languages.
- **Must-haves for employers:** case studies (problem → approach → result), a clear way to get in touch, and a CV download.

## 2. The concept: the fishing penguin

**The core idea.** *Visser* (Dutch) and *Halász* (Hungarian) both mean "fisherman". Raymond fishes patterns out of data. An emperor penguin hunts by diving: it is the deepest-diving bird in the world and reaches more than 500 metres. So the site is **one dive**, and the penguin takes the visitor down with him.

### 2.1 The emperor (the character)

- **Species:** emperor penguin (*Aptenodytes forsteri*).
- **Style:** **stylised low-poly 3D**, built entirely in code (Three.js), no purchased model. He should read as design, not as a stock model.
- **Features to keep through the stylisation:** black head and back, white belly, the **golden-orange ear patches** that fade towards the chest, and a slender bill with an orange/pink stripe on the lower mandible.
- **We build the playground first:** a page with the emperor and sliders for body shape, head and bill size, the colour and intensity of the neck patch, the faceting (polygon count) and the swimming motion. Raymond plays with it until it feels right, and those values become the final config.
- **Animations:** standing on the ice (idle), diving, swimming (flipper strokes), chasing a fish, bowing when clicked, following the cursor with his head, and, as the finale, launching out of the water with a trail of air bubbles.

### 2.2 Name: Keizer Kálmán ✅

Dutch *keizer* ("emperor") + the Hungarian name Kálmán. Rudolf Kálmán was a Hungarian mathematician; the **Kalman filter** estimates from noisy data where something is moving, which is exactly what a hunting penguin does with a fish. That story can come back in the "Who I am" section or in the making-of.

In the rest of this document: **Kálmán** or **the emperor**.

### 2.3 The dive: storyline and sections

Scrolling = diving. A **depth gauge** on the side follows along.

| Depth | Section | Content | Mood |
|---|---|---|---|
| 0 m | **The ice (hero)** | The emperor on the ice edge, with a school of glowing fish underwater that together form "Raymond Visser / Halász Raymond". He dives at the first scroll. | Ice blue, southern lights (aurora australis) |
| 0–100 m | **Who I am** | Visser = Halász, Netherlands → Budapest, three languages. The fish arrange themselves into charts (see 2.4). | Light still filters through the water |
| 100–250 m | **Work** | FrieslandCampina, Leger des Heils (Salvation Army NL), earlier EY. | Twilight zone |
| 250–400 m | **Education** | ELTE MSc, Windesheim BSc + Honours. | Almost dark |
| 400–564 m | **The catch** | Projects (see §4), glowing like deep-sea creatures. Plus the **sonar** with live Pi stats. | Ink black, bioluminescent |
| ↑ | **Contact** | The emperor shoots up and launches himself out of the water onto the ice. LinkedIn, GitHub, email, CV download. | Back to the light |

**The bottom is at 564 m** ✅: the deepest accurately measured dive by any bird, by an emperor penguin off eastern Antarctica. The study, which fitted 93 penguins with time-depth recorders, was a collaboration between the Australian Antarctic Division and Phillip Island Nature Park and was published in *Polar Biology* (2006). Source: [Guinness World Records – Deepest dive by a bird](https://www.guinnessworldrecords.com/world-records/deepest-dive-by-a-bird). Idea: a small sign at the bottom reading "564 m · world record · emperor penguin".

Additional facts (source: [BBC Science Focus](https://www.sciencefocus.com/planet-earth/penguin-depth-swim), still to verify): a tagged emperor stayed underwater for **over half an hour**, and normal dives go to **100–200 m**, exactly the depth of the "Work" section, where the emperor hunts every day.

### 2.4 The data layer (what makes the site "data")

- **Dive profile:** while scrolling, the depth gauge draws a line, just like real charts from tagged emperor penguins. The visitor's own visit becomes a dataset. At the bottom or at contact, their profile can be shown ("your dive: 2:14 min, max 564 m — Kálmán can hold his breath for over half an hour").
- **Fish become charts:** the school the emperor herds together falls into place in "Who I am" as visualisations of languages (NL/HU/EN), tools (Python, R, SQL, Java, Power BI, Databricks, Grafana) and the route Netherlands → Budapest.
- **Sonar:** live stats from Raymond's Raspberry Pi home server (uptime, requests blocked by Pi-hole, possibly temperature), displayed as a sonar reading. See §5.3 for the secure setup.

### 2.5 Personality and surprises

- The emperor follows the cursor with his head and bows when you click him.
- When the visitor stops scrolling, he floats calmly and now and then chases a small fish.
- Secret key combination (e.g. the Konami code) → a whole colony on the ice.
- **404 page:** the emperor drifts, lost, on an ice floe.
- Optional underwater sound, **off by default**, with a clear toggle.

### 2.6 Colour and typography

- **Palette:** ice white → deep-sea blue → ink black (the colour follows the depth), with the **golden orange of the ear patch** as the only accent colour: buttons, depth gauge, key words.
- All text must meet WCAG AA contrast, including in the darkest layer.
- **Typography:** still to choose. Direction: one characterful display font for headings and names, one highly readable font for body text, plus a monospace for the depth gauge and data labels. Must render Hungarian characters well (ő, ű, á, é).

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
- **Links:** LinkedIn `visser-raymond`, GitHub `Halaszraymond`. Email address on the site: still to choose.

## 4. Projects: the catch

All code is Raymond's own and may be used as a source for the case studies.

### Featured (3 full case studies)

1. **r-Frica Predicts:** predicts the results of the Africa Cup of Nations (AFCON). Idea: an interactive element, e.g. the predicted probabilities per match.
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
| Scroll/animation | **GSAP + ScrollTrigger**, possibly Lenis for smooth scroll | Depth-driven animations |
| Languages | **NL / HU / EN** via Astro i18n | `/nl`, `/hu`, `/en`; default based on browser language, with a switcher |
| Charts | D3 or custom SVG | Visualisations in "Who I am" and the dive profile |
| Hosting | **Cloudflare Pages** | Domain is already at Cloudflare; preview link per branch |
| Language (site) | **TypeScript (strict)** | See §5.4 for why not Python in the browser |
| Language (data) | **Python** in `data/` | Scripts that generate chart data and r-Frica predictions as JSON at build time |
| Language (Pi) | **Python (FastAPI)** | The read-only sonar endpoint on the Raspberry Pi |
| Analytics | **Cloudflare Web Analytics** | Cookieless, so no cookie banner. One switch in Cloudflare Pages |

### 5.2 Quality requirements

- **Performance:** Lighthouse ≥ 90 on mobile. The 3D part is lazy-loaded; the first paint is visible immediately, without waiting for WebGL.
- **Fallback:** with `prefers-reduced-motion`, no WebGL or a weak device, you get a good-looking static version (rendered stills of the emperor). Never a broken or empty site.
- **Accessibility:** all content is plain, readable HTML (not in canvas), keyboard-navigable, with alt text and AA contrast.
- **Mobile:** designed for phones first, with touch instead of a cursor.
- **SEO/sharing:** good title, description and Open Graph image (the emperor on the ice), per language.

### 5.3 Live Pi stats (sonar): secure setup

- The Pi publishes **only** a small, read-only JSON endpoint with aggregated numbers (no IPs, no domain names, no logs).
- Reachable via a **Cloudflare Tunnel** on its own subdomain. The existing `stamlijst` subdomain and its tunnel stay untouched.
- The site reads the endpoint with caching (e.g. every 60 s) and shows "last reading" when the Pi is offline, so the site never stalls.

### 5.4 Coding requirements

**Principle:** top quality, while written so that Raymond (strong in Python/R/SQL, new to TypeScript) can read every line and explain it in a job interview. Employers will read this repo too.

**Why TypeScript for the site and not Python in the browser:** Python in the browser (PyScript/Pyodide) first loads a Python runtime of several MB. That kills the first impression and the Lighthouse score, and there is no full-featured 3D library for it. Server frameworks like Streamlit or Reflex need a running server and aren't made for this kind of WebGL experience. So Python goes where it is strongest: the **data pipeline** (`data/`) and the **Pi endpoint**. That way the repo shows both languages at their best.

**Readability**
- TypeScript in `strict` mode; no `any`.
- Every file starts with a short comment block: what it does and how it fits into the whole.
- Comments explain the *why*. In 3D and animation code, the maths or concept is briefly explained too (e.g. "quaternion = rotation without gimbal lock").
- Small functions with descriptive names, named constants instead of magic numbers, and no clever one-liners when a clear version works just as well.
- Where TypeScript does something that works differently in Python, a short comparison in the comment ("like a dataclass in Python").
- `docs/architecture.md`: an overview with a diagram of how the parts fit together (content → pages, scroll → depth → scene, data scripts → JSON → charts).
- `docs/glossary.md`: 3D and frontend terms in plain language.

**Structure**
- `src/content/`: texts, projects and translations (Markdown/JSON, Astro content collections). Changing content = never changing code.
- `src/components/`: UI components.
- `src/scene/`: everything 3D, split into `kalman/` (model, config, animations), `school/` (fish), `environment/` (water, light, southern lights) and `scroll/` (depth → scene).
- `src/i18n/`, `src/lib/` (pure logic, easy to test), `data/` (Python), `docs/`, `tests/`.
- Kálmán is **config-driven**: shape and colour in one file (the output of the playground).

**Quality and tooling**
- ESLint + Prettier (TS), Ruff + mypy (Python). Automatic on save and on every commit (pre-commit hooks).
- Minimal dependencies: every package has to earn its place. Renovate/Dependabot keeps them up to date.
- Performance budgets are **enforced**, not just hoped for: base JS ≈ 50 KB, Three.js and the scene in a separate deferred chunk, Kálmán low-poly, the fish school via instancing, 60 fps on a mid-range phone, capped pixel ratio, and no rendering when the tab isn't visible.

**Testing** (quality comes first; "overkill" doesn't exist)
- **Unit tests (Vitest):** all pure logic, such as depth mapping, dive profile, i18n and config validation.
- **Python tests (pytest):** the data scripts and the Pi endpoint.
- **End-to-end (Playwright):** every page in NL/HU/EN, no console errors, working navigation and language switcher, the reduced-motion and no-WebGL fallbacks, and mobile and desktop widths.
- **Visual regression:** screenshot baselines per section; an unintended visual change fails the test.
- **Accessibility:** axe checks in Playwright on every page.
- **Lighthouse CI** with hard thresholds (≥ 90 in all four categories) and a **bundle-size check**.

**CI and Git**
- GitHub Actions on every push and PR: lint → type check → unit tests → Python tests → build → Playwright → Lighthouse. A red build does not get merged.
- `main` is always deployable and live. Work happens on feature branches with their own Cloudflare preview, via pull requests.
- Conventional commits (`feat:`, `fix:`, `docs:`, `test:`).

**Privacy and security**
- No cookies and no tracking apart from Cloudflare Web Analytics (cookieless).
- Security headers (CSP, HSTS, etc.) via a `_headers` file in Cloudflare Pages.
- Pi endpoint: aggregated numbers only (§5.3), with rate limiting.

## 6. Repo, hosting and going live

- **New repo** (e.g. `Halaszraymond/portfolio`). The current site in the `halaszraymond.github.io` repo stays live until v2 is ready and serves as a fallback.
- **Development:** locally in VS Code with Claude Code. `npm run dev` for the dev server.
- **Previews:** connect the repo to Cloudflare Pages; every branch gets its own preview URL.
- **Going live (phase 4):**
  1. In Cloudflare Pages, add the custom domain `halaszraymond.com` (and `www`).
  2. In Cloudflare DNS, remove the four A records pointing to GitHub (185.199.108–111.153) and the `www` CNAME pointing to `halaszraymond.github.io`. Pages creates the right records.
  3. Do **not** touch the `stamlijst` record.
  4. In the old repo, turn off GitHub Pages or remove the custom domain, so there's no conflict.

## 7. Phases

- [ ] **Phase 0: setup.** Repo, Astro skeleton (TS strict), all tooling and the full CI pipeline from §5.4 (starting with one empty test page, so everything has to stay green from day 1), Cloudflare Pages preview, `docs/making-of.md`, `docs/architecture.md`.
- [ ] **Phase 1: Keizer Kálmán.** Playground with sliders → Raymond picks the shape → final config. Then the animations (idle, dive, swim, launch).
- [ ] **Phase 2: the dive.** All sections with depth gauge, colour gradient, fish school, and fish turning into charts. Placeholder text first.
- [ ] **Phase 3: content.** Real texts, the 3 case studies, the "more catch" cards and a CV download.
- [ ] **Phase 4: polish.** NL/HU/EN, mobile, fallback, performance, accessibility, SEO. Then go live.
- [ ] **Phase 5: extras.** Live Pi sonar, colony easter egg, 404 on the ice floe, sound, the visitor's dive profile.

## 8. Open decisions

- [x] Name of the emperor: Keizer Kálmán (§2.2)
- [x] Record dive depth verified: 564 m, Guinness World Records (§2.3)
- [ ] Fonts (§2.6)
- [ ] Email address and CV file for the contact section
- [ ] Repo name
- [ ] Optional: a photo of Raymond, yes or no, and where
