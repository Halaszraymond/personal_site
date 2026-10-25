# Tasks

## 1. Project skeleton

- [x] 1.1 Scaffold Astro (TypeScript, `astro/tsconfigs/strictest`) with the approved dependencies only, plus `.nvmrc` (24), `engines.node` and `.gitattributes` (`eol=lf`); verify `npm ci` and `npm run build` succeed on a clean clone
- [x] 1.2 Create the folder structure from README §5.4 (`src/content/`, `src/components/`, `src/scene/`, `src/i18n/`, `src/lib/`, `scripts/`, `tests/`, `docs/`), with a header comment in every source file; verify `npm run build` still succeeds
- [x] 1.3 Configure ESLint (flat config, `typescript-eslint` strict, `no-explicit-any` as error, `eslint-plugin-astro`), Prettier (`prettier-plugin-astro`, LF) and `eslint-config-prettier`; verify `npm run lint` passes and fails on a deliberately added `any`
- [x] 1.4 Add `typecheck` (`astro check`) and Vitest with one placeholder test; verify `npm run typecheck` and `npm test` pass
- [x] 1.5 Add `simple-git-hooks` + `lint-staged` (ESLint `--fix` and Prettier on staged files); verify a commit with a lint error is blocked
- [x] 1.6 Write `docs/architecture.md` (folder structure and npm scripts) and start `docs/glossary.md` (pre-commit hook, type stripping, linting); verify every folder from 1.2 is described

## 2. i18n routing

- [x] 2.1 Add `src/i18n/locales.ts` and `src/i18n/ui.ts` (`Record<Locale, UiStrings>` with the test string per language) and configure Astro i18n (`defaultLocale: 'en'`, `prefixDefaultLocale: true`, `redirectToDefaultLocale: false`, `trailingSlash: 'always'`); verify `npm run typecheck` fails when a language misses a key
- [x] 2.2 Build the base layout and pages `/[locale]/` and `/` with `lang`, the canonical link (`/` → `/en/`) and `hreflang` alternates including `x-default`; verify with Playwright that each URL returns 200 with the right `lang`, test string, canonical and alternates, and that `/` does not redirect for a Dutch browser
- [x] 2.3 Build the language switcher (plain links, `hreflang`/`lang` on each link, `aria-current="page"`, keyboard-usable) and store the choice on click in `try/catch`; verify with Playwright that switching works with and without JavaScript, that the choice is stored without a cookie, and that blocked storage causes no errors
- [x] 2.4 Implement `chooseLanguageHint()` in `src/lib/language-hint.ts`; verify with Vitest tests for every hint scenario in the spec (stored choice wins, browser language, English means no hint, region subtags such as `hu-HU`)
- [x] 2.5 Add the dismissible language hint to `/` (Dutch and Hungarian versions in the HTML, `hidden` and with their own `lang`, revealed by the client script); verify with Playwright the Hungarian-browser, English-browser, dismiss and stored-choice scenarios, and that no hint appears on `/nl/`, `/hu/` or `/en/`
- [x] 2.6 Add `src/pages/404.astro` with text in all three languages and links to `/nl/`, `/hu/` and `/en/`; verify with Playwright that `/does-not-exist` returns status 404 with those links
- [ ] 2.7 Update `docs/architecture.md` (routing) and `docs/glossary.md` (hreflang, canonical URL, `x-default`, localStorage) and ask Raymond to review the placeholder strings and hint copy in all three languages; verify the docs describe every URL the site serves

## 3. Render fallback

- [x] 3.1 Implement `chooseRenderMode()` in `src/lib/render-mode.ts`; verify with Vitest tests for every combination of reduced motion, WebGL2 and Save-Data, including a missing Save-Data setting
- [x] 3.2 Render every page with `data-render-mode="fallback"` and an empty `aria-hidden` scene slot, and add the client script that detects the signals (WebGL2 inside `try/catch`, context released afterwards) and switches to `full`; verify `npm run build` output contains the fallback attribute on every page
- [x] 3.3 Add Playwright tests for the render-mode scenarios with emulated reduced motion, stubbed WebGL2 (`null` and a fake context) and a stubbed Save-Data, plus JavaScript disabled; verify the mode attribute and that the text and links are identical in both modes
- [ ] 3.4 Update `docs/architecture.md` (render-mode flow, Mermaid diagram) and `docs/glossary.md` (WebGL2, Save-Data, fallback, island); verify the diagram renders on GitHub

## 4. Quality gates

- [x] 4.1 Add `public/_headers` (CSP without inline scripts, HSTS, `nosniff`, Referrer-Policy, Permissions-Policy) and set `build.inlineStylesheets: 'never'`; verify `dist/` contains no inline `<script>` or `<style>` blocks
- [x] 4.2 Add the Playwright fixture that applies the headers from `public/_headers` to HTML responses, and a "no console errors" check plus axe (zero violations) on every page in all three languages, for desktop Chromium, mobile Chromium, mobile WebKit and desktop Firefox; verify `npm run e2e` passes and fails when a deliberate CSP violation is added
- [x] 4.3 Add the bundle-size budget as a pure function in `scripts/lib/budgets.ts` and the `scripts/check-bundle-size.ts` runner (50 KB gzipped base budget); verify with Vitest tests for under, exactly at and over the budget, and that `npm run size` prints the table
- [x] 4.4 Add the Chromium-only `visual` Playwright project (`/`, `/nl/`, `/hu/`, `/en/` at 375 px and 1280 px, scene slot masked, platform-free snapshot paths, only runs when `CI` is set); verify a local run reports it as skipped
- [ ] 4.5 Add Lighthouse CI (`staticDistDir: ./dist`, the four URLs, mobile, 3 runs, ≥ 0.9 in all four categories); verify `npm run lhci` passes locally
- [ ] 4.6 Add the `check` script that runs the whole chain in CI order; verify it passes locally
- [ ] 4.7 Update `docs/glossary.md` (CSP, HSTS, axe, Lighthouse, visual regression, baseline) and `docs/architecture.md` (test layers and how to run them); verify every npm script is documented

## 5. CI and hosting

- [ ] 5.1 Add `.github/workflows/ci.yml` (one job: `npm ci` → lint → typecheck → unit tests → build → bundle size → Playwright with cached browsers → Lighthouse, uploading the Playwright report on failure); verify the run on this branch is green
- [ ] 5.2 Add `.github/workflows/update-visual-baselines.yml` (manual trigger, Linux, `--update-snapshots`, commits the images back to the branch) and ask Raymond to trigger it; verify the baselines are committed and the next CI run compares against them
- [ ] 5.3 Add `.github/dependabot.yml` (npm and GitHub Actions, weekly, dev dependencies grouped); verify GitHub shows it as valid under Insights → Dependency graph → Dependabot
- [ ] 5.4 Write step-by-step instructions for connecting the repo to Cloudflare Pages (Git integration, `npm run build`, `dist`, no custom domain) and ask Raymond to do it; verify a preview URL serves `/nl/`, `/hu/` and `/en/` with the security headers from `_headers`, and that `/does-not-exist` returns the 404 page with status 404
- [ ] 5.5 Document the CI chain, the baseline workflow and the Cloudflare settings in `docs/architecture.md`; verify the documented commands and settings match the files

## 6. Wrap-up

- [ ] 6.1 Run the whole chain once more on the final branch state (`npm run check` locally and CI green, including the visual tests); verify every step is green
- [ ] 6.2 Write `docs/making-of.md`: the concept phase (from `PLANNING_LOG.md`) and this change, with a screenshot of the start page in all three languages; verify the screenshots are committed and linked
- [ ] 6.3 Tick off Phase 0 in README §7 and add a `PLANNING_LOG.md` line for every decision made during the build; verify both files are updated

## Workflow follow-up

- Raymond reviews the pull request; after the merge, he can turn on branch protection on `main` that requires the CI check.
- Run `/opsx:verify`, then `/opsx:archive` to merge the `i18n-routing` and `render-fallback` specs into `openspec/specs/`.
