# Glossary

Frontend, 3D and tooling terms used in this repo, in plain language. Where it helps, there is a comparison with Python.

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
