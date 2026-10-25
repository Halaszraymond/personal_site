# Proposal

## Why

The concept for halaszraymond.com v2 is final (README), but the repo has no code yet. Phase 0 lays the foundation everything else stands on: a working Astro site in three languages, a fallback path that never shows a broken page, and a quality pipeline that is green from day 1. Doing this first means every later feature (Kálmán, the dive, the content) is tested, translated and given a fallback from the moment it lands, instead of "in polish".

## What Changes

- **Astro skeleton** in TypeScript `strict` mode, with the folder structure from README §5.4 (`src/content/`, `src/components/`, `src/scene/`, `src/i18n/`, `src/lib/`, `docs/`, `tests/`). Node 24 (LTS) and npm.
- **i18n routing:** `/nl/`, `/hu/` and `/en/` each show one placeholder page with a test string in that language. `/` shows the English page without redirecting. A language switcher on every page, `hreflang` links, and a small language hint on `/` for Dutch and Hungarian browsers that remembers the visitor's choice.
- **Fallback switch:** a pure function decides between the full (3D) path and the static fallback, based on `prefers-reduced-motion`, WebGL2 support and Save-Data. With no 3D yet, the full path is an empty scene slot. Without JavaScript, the visitor gets the fallback.
- **A plain 404 page** (three languages on one page), so unknown URLs return a real 404 instead of the home page. Kálmán's ice-floe 404 stays in Phase 5.
- **Tooling:** ESLint + Prettier, `astro check` for type checking, Vitest for unit tests, Playwright for end-to-end, accessibility (axe) and visual tests, Lighthouse CI, and a bundle-size check. Pre-commit hooks run lint and format on staged files.
- **CI (GitHub Actions)** on every push and pull request: lint → type check → unit tests → build → bundle size → Playwright → Lighthouse. Plus a manually triggered workflow that regenerates the visual baselines on Linux. Dependabot keeps dependencies up to date.
- **Security headers** (`_headers` for Cloudflare Pages): CSP, HSTS and friends.
- **Cloudflare Pages preview:** the repo is connected, so every branch gets a preview URL. (Raymond does this step in the Cloudflare dashboard.)
- **Docs:** `docs/making-of.md` (the build log, starting with this session), `docs/architecture.md` (with a diagram) and `docs/glossary.md`.

### New dependencies (for Raymond's approval)

Each one has to earn its place (README §5.4). All are dev-only except `astro`.

| Package | Why |
|---|---|
| `astro` | The framework from README §5.1. |
| `typescript`, `@astrojs/check` | Type checking for `.ts` and `.astro` files (`astro check`). |
| `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-astro` | Linting, including the "no `any`" rule, for TS and Astro files. |
| `prettier`, `prettier-plugin-astro`, `eslint-config-prettier` | Formatting; the last one stops ESLint and Prettier from fighting. |
| `vitest` | Unit tests for the pure logic in `src/lib/` (like pytest). |
| `@playwright/test`, `@axe-core/playwright` | End-to-end, visual and accessibility tests in a real browser. |
| `@lhci/cli` | Lighthouse CI: the hard ≥ 90 gate. |
| `simple-git-hooks`, `lint-staged` | Pre-commit hooks: lint and format only the files you are committing. |

No package for the bundle-size check: a short script of our own does it (see design.md).

### Not in this change

- The frame-time check (step 3 of the fallback) and the "lite mode" footer switch: both need a 3D scene to measure or turn off, so they arrive with Kálmán in Phase 1.
- Cloudflare Web Analytics and the custom domain: those belong to go-live (Phase 3).
- Fonts, colours and real content.

## Capabilities

### New Capabilities

- `i18n-routing`: which URL shows which language, what `/` does, the language switcher, `hreflang` links, the language hint and how the visitor's choice is remembered, and the 404 for unknown URLs.
- `render-fallback`: how the site decides between the full 3D path and the static fallback, and the guarantee that all content is in the HTML on both paths.

### Modified Capabilities

None (there are no specs yet).

## Impact

- **New code:** the whole `src/`, `tests/`, `scripts/`, `docs/` and `public/` tree, plus config files (`package.json`, `astro.config.mjs`, `tsconfig.json`, ESLint, Prettier, Playwright, Lighthouse).
- **GitHub:** new workflows in `.github/workflows/` and `.github/dependabot.yml`. Raymond can add branch protection on `main` afterwards, so that only a green PR can merge.
- **Cloudflare:** a new Pages project connected to this repo, with preview URLs only. The existing DNS, the current GitHub Pages site and the `stamlijst` subdomain are not touched.
- **README:** Phase 0 gets ticked off in §7 when this change is done.
