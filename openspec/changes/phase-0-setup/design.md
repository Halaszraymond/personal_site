# Design

## Context

The repo has only docs and OpenSpec so far; see proposal.md (Why) for the motivation. Constraints that shape this design:

- README §5 fixes the stack (Astro, TypeScript strict, Cloudflare Pages, npm) and the quality bar (Lighthouse ≥ 90, axe, Playwright in three languages, Linux-only visual baselines).
- Raymond develops on **Windows** (Node 24.19, npm 11 installed); CI runs on **Linux**. Line endings, font rendering and browser builds differ between the two.
- Raymond reads Python/R/SQL fluently and TypeScript less. Every file needs a header comment, *why* comments and, where useful, a Python comparison (CLAUDE.md).
- No dependency without approval: the proposal lists them; nothing beyond that list is added.

## Goals / Non-Goals

**Goals:**
- Everything in the CI chain runs locally with one command each, and the same commands run in CI.
- The logic behind the two Phase 0 behaviours (language hint, render mode) lives in pure functions in `src/lib/`, tested with Vitest; the browser glue around them stays thin.
- Production behaviour that the local preview server does not reproduce (security headers) is still exercised by the end-to-end tests.

**Non-Goals:**
- Any 3D code, Three.js or GSAP (Phase 1). The scene slot is an empty, `aria-hidden` element.
- The frame-time check and the lite-mode switch (Phase 1, see proposal).
- Visual design: no fonts, colours or layout work beyond what is needed to be readable and pass contrast checks.

## Decisions

### 1. Astro with its built-in i18n, one list of locales

`src/i18n/locales.ts` holds `LOCALES = ['nl', 'hu', 'en'] as const` and derives the `Locale` type from it (like `Literal['nl', 'hu', 'en']` in Python). `astro.config.ts` imports this list, so the languages are defined once.

Astro i18n is configured with `defaultLocale: 'en'`, `prefixDefaultLocale: true` (so English lives at `/en/`) and `redirectToDefaultLocale: false` (so `/` is not redirected). Pages:

- `src/pages/[locale]/index.astro` builds `/nl/`, `/hu/`, `/en/` via `getStaticPaths()`.
- `src/pages/index.astro` renders the same page component with `locale = 'en'` and a canonical link to `/en/`.
- `src/pages/404.astro` becomes `404.html`, which Cloudflare Pages serves with status 404 for unknown URLs. Without it, Pages would serve the home page with status 200 for every unknown URL.

`trailingSlash: 'always'` with `build.format: 'directory'` gives one stable URL shape (`/nl/`), matching how Cloudflare Pages serves folders.

UI strings live in `src/i18n/ui.ts` as `Record<Locale, UiStrings>`. TypeScript then refuses to build if a language is missing a key, which turns the "every feature in three languages" rule into a compile-time check.

*Alternative:* our own `[locale]` routing without Astro's i18n config. That is slightly more transparent, but README §5.1 chose Astro i18n, and it gives `Astro.currentLocale` and URL helpers for free.

### 2. Language hint: pure decision + thin client script

`src/lib/language-hint.ts` exports `chooseLanguageHint({ storedChoice, browserLanguages }): 'nl' | 'hu' | null`. The rules come straight from the spec: the stored choice wins; otherwise the first of `navigator.languages` that we support (`nl`, `hu` or `en`, by primary subtag) is the preferred language. English (stored or preferred) means no hint, so `['en', 'hu']` gives no hint, while `['de', 'hu']` offers Hungarian.

The root page renders both the Dutch and the Hungarian hint in the HTML, each with its own `lang` attribute and the `hidden` attribute. A small client script reads storage and `navigator.languages`, calls the function and un-hides at most one hint. Without JavaScript, no hint is shown, which is the right default.

Storage: `localStorage` under one key (`kalman.lang`), always inside `try/catch`, because storage can be blocked (private mode, strict settings). Switcher links and the hint store the choice on click; navigation itself is a plain link, so it works even when storing fails.

### 3. Render mode: pure decision, fallback-first HTML

`src/lib/render-mode.ts` exports `chooseRenderMode({ prefersReducedMotion, hasWebGL2, saveData }): 'full' | 'fallback'`. The checks run from cheap to expensive, as in README §5.2; the frame-time step slots in here in Phase 1.

The HTML is built with `data-render-mode="fallback"` on `<html>`. A small client script collects the three signals and switches the attribute to `full` only when the function says so. Fallback-first means no JavaScript, a script error or a slow load all leave the visitor on a working page.

Signal detection: `matchMedia('(prefers-reduced-motion: reduce)')`; WebGL2 by creating a throwaway canvas and calling `getContext('webgl2')` inside `try/catch`, then releasing it with `WEBGL_lose_context`; Save-Data via `navigator.connection?.saveData`, which only Chromium reports, and treated as `false` when missing.

The mode is decided once per page load. Reacting to a live change of the reduced-motion setting is left for Phase 1, when there is motion to stop.

### 4. Tooling

- **TypeScript:** extend `astro/tsconfigs/strictest` rather than `strict`. It adds checks such as `noUncheckedIndexedAccess` (indexing an array may give `undefined`), which catch real bugs at the cost of a few extra checks in code.
- **Lint and format:** ESLint flat config with `typescript-eslint` (strict preset, `no-explicit-any` as an error) and `eslint-plugin-astro`; Prettier with `prettier-plugin-astro`; `eslint-config-prettier` turns off style rules that Prettier owns.
- **Line endings:** `.gitattributes` with `* text=auto eol=lf` and Prettier `endOfLine: 'lf'`, so files written on Windows match CI.
- **Node:** `.nvmrc` with `24` and `engines.node` in `package.json`. Cloudflare Pages reads `.nvmrc` too.
- **Pre-commit:** `simple-git-hooks` runs `lint-staged` (ESLint `--fix` and Prettier on staged files only). Type check and tests stay in CI, to keep commits fast. *Alternatives:* Husky does the same with more files; the Python `pre-commit` framework would add a Python requirement to a TypeScript-only repo.
- **Scripts** (`package.json`): `dev`, `build`, `preview`, `lint`, `format`, `typecheck` (`astro check`), `test` (Vitest), `size`, `e2e` (Playwright), `lhci`, and `check`, which runs the whole chain in CI order.

### 5. Bundle-size check without a package

`scripts/check-bundle-size.ts` gzips every `.js` file in `dist/`, adds them up and fails when the total exceeds the base budget of 50 KB (gzipped). The budget logic is a pure function (`scripts/lib/budgets.ts`) with its own Vitest test; the script itself only reads files and prints a table. Node 24 runs `.ts` files directly (type stripping), so no extra runner is needed. From Phase 1, the Three.js chunk gets its own budget next to the base one.

*Alternative:* `size-limit`. It is a good tool, but it brings several packages for something 40 readable lines can do.

### 6. Testing

- **Vitest:** `src/lib/**` and `scripts/lib/**`, with every spec scenario that the pure functions decide covered by a test.
- **Playwright** against the built site (`astro preview`), not the dev server, so tests see what Cloudflare serves. Projects: desktop Chromium, mobile Chromium (Pixel 7), mobile WebKit (iPhone) and desktop Firefox. Every page in all three languages is checked for no console errors, axe with zero violations, the switcher, the hint and the 404.
- **Security headers in tests:** the preview server ignores `_headers`. A Playwright fixture reads `public/_headers` and adds those headers to every HTML response via `page.route()`, so a CSP that would break the page in production also breaks the tests.
- **Render-mode scenarios** are made deterministic with init scripts: `emulateMedia({ reducedMotion: 'reduce' })`, a `getContext` stub that returns `null` for `webgl2`, a stub that returns a fake context for the "capable" case, and a stubbed `navigator.connection`. Real-GPU rendering is out of scope until there is a scene.
- **Visual regression (layer 2):** a separate Chromium-only `visual` project screenshots `/`, `/nl/`, `/hu/` and `/en/` at 375 px and 1280 px, with the scene slot masked. The snapshot path leaves out the platform, and the project only runs when `CI` is set, so Windows never writes or compares baselines. The baselines come from `update-visual-baselines.yml`, a manually triggered workflow that runs with `--update-snapshots` on Linux and commits the images to the branch it ran on.
- **Lighthouse CI:** `staticDistDir: ./dist`, URLs `/`, `/nl/`, `/hu/`, `/en/`, mobile preset, 3 runs (median), and an assertion of ≥ 0.9 for performance, accessibility, best practices and SEO.

### 7. CI

One workflow, `ci.yml`, on every push and pull request, with one job running the steps in README order: install (`npm ci`) → lint → typecheck → unit tests → build → bundle size → Playwright (browsers cached) → Lighthouse. One sequential job is easier to read than a graph of parallel jobs and still finishes in a few minutes at this size. Playwright's HTML report is uploaded as an artifact when a run fails.

Dependabot (`.github/dependabot.yml`) checks npm and GitHub Actions weekly, grouping dev dependencies into one PR. *Alternative:* Renovate is more flexible but needs a GitHub app; Dependabot is built in.

### 8. Security headers

`public/_headers` applies to all paths: `Content-Security-Policy` (`default-src 'self'`, no inline scripts, `frame-ancestors 'none'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` and a `Permissions-Policy` that turns off camera, microphone and location. Astro is set to `build.inlineStylesheets: 'never'`, so CSS also loads as files and the CSP does not need `'unsafe-inline'`. The Cloudflare analytics domain is added to the CSP at go-live.

### 9. Cloudflare Pages

The repo is connected through Cloudflare's Git integration as the Pages project `halaszraymond` (`halaszraymond.pages.dev`; build command `npm run build`, output `dist`). The Node version comes from `.nvmrc` in the repo, not from a `NODE_VERSION` dashboard variable, so it is versioned and reviewable in one place. Cloudflare builds every branch into its own preview URL, and no deploy secrets have to be stored in GitHub. The production branch is `main`, but no custom domain is attached: until go-live the site only lives on its `*.pages.dev` address. Raymond does the dashboard steps; `docs/architecture.md` records the settings.

*Alternative:* deploy from GitHub Actions with `wrangler`. That gives more control but needs an API token in GitHub secrets, for no gain right now.

### 10. Docs

- `docs/architecture.md`: the folder structure, a Mermaid diagram (request → Cloudflare → static HTML → client scripts → render mode / language hint) and the CI chain.
- `docs/glossary.md`: the new concepts (island, hreflang, canonical URL, WebGL2, Save-Data, CSP, HSTS, visual regression and baselines, Lighthouse, axe, pre-commit hook, type stripping).
- `docs/making-of.md`: starts with the concept phase (from the planning log) and this change, with a screenshot of the first page in three languages.

## Risks / Trade-offs

- [Headless Chromium in CI may have no WebGL2, or may need SwiftShader flags] → Phase 0 tests stub WebGL either way; real WebGL smoke tests (layer 3) are designed in Phase 1.
- [Astro could still inline a script or style, which the strict CSP would block] → `inlineStylesheets: 'never'`; the headers fixture plus the "no console errors" check catch any CSP violation in the e2e tests.
- [Lighthouse scores vary between runs] → median of 3 runs; an almost empty page in Phase 0 leaves a wide margin.
- [WebKit on Windows behaves slightly differently from Safari] → it runs on Linux in CI; real iPhone testing is part of Phase 4.
- [`strictest` TypeScript makes some code more verbose] → accepted for quality; the *why* comments explain each extra check.
- [Visual tests cannot run locally on Windows] → accepted on purpose (README §5.4); local runs report them as skipped, not passed.

## Migration Plan

Nothing to migrate: the current site keeps running from the `halaszraymond.github.io` repo, and the DNS is unchanged. The new Pages project only serves `*.pages.dev` URLs. Rollback means deleting the Pages project and reverting the merge.
