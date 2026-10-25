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
