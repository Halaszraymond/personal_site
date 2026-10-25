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
