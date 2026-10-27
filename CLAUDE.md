@AGENTS.md
# Working agreements for Claude Code

- **Read `README.md` first.** It holds the concept, all decisions and the phases. It is the source of truth: if a decision changes, update the README first.
- **Language:** everything in the repo is in English: code, comments, commits, docs and README. Talk to Raymond in whichever language he writes in (Dutch or English). Site content comes in NL, HU and EN.
- **Work phase by phase** (README §7) and tick off what's done. Don't start the next phase without his go-ahead.
- **Plan features with OpenSpec** (README §5.4): for a new feature or behaviour change, start with `/opsx:propose` and let Raymond review the proposal before running `/opsx:apply`. Small fixes and typos don't need a change. The README stays the source of truth; keep `openspec/specs/` consistent with it.
- **We build the emperor together:** start with the playground with sliders (phase 1) and let Raymond choose. Store his chosen values in a config file.
- **Original character:** the emperor must not resemble existing penguin characters or mascots.
- **Build log:** after each work session, record in `docs/making-of.md` what was decided and built, with screenshots where possible. This later becomes the "this website" case study.
- **Quality:** respect `prefers-reduced-motion`, keep content in HTML (not only in canvas), test at mobile width, and aim for Lighthouse ≥ 90.
- **The coding requirements (README §5.4) are mandatory.** The most important ones:
  - Highest quality and user experience first. Write clearly, with a header comment per file and *why* comments (a comparison with Python where it helps); Raymond no longer needs to be able to explain every line.
  - TypeScript `strict`, no `any`. Python with Ruff + mypy.
  - All new logic comes with tests. A task is only done when lint, type check, all tests, the build, Playwright and Lighthouse are green.
  - Keep `docs/architecture.md` and `docs/glossary.md` up to date when the structure changes or new concepts appear.
  - Don't add a dependency without asking Raymond and explaining why.
- **Summarise what you build:** end every task with a short plain-language summary of what changed and why.
- **Commits:** small, descriptive commits. Work on a feature branch and only push when Raymond asks.
- **Don't touch the `stamlijst` subdomain or the existing DNS** without an explicit request.
