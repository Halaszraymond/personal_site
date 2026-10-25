/**
 * Finds traces of the dev-only playground in a production build.
 *
 * Pure logic (a list of built files in, a list of problems out), unit-tested; the runner
 * `scripts/check-production-build.ts` reads `dist/` and fails CI if anything is found.
 */

/** One file of the build: its path inside `dist/` (with forward slashes) and its text. */
export interface BuiltFile {
  path: string;
  content: string;
}

/**
 * A string Three.js always leaves in its code: it registers itself as `window.__THREE__`
 * to warn about loading two copies. Minifying keeps it, because it is a property name.
 */
export const THREE_MARKER = '__THREE__';

/** Every reason this build is not a clean production build; empty when it is clean. */
export function findPlaygroundLeaks(files: readonly BuiltFile[]): string[] {
  const problems: string[] = [];
  for (const file of files) {
    if (file.path === 'playground' || file.path.startsWith('playground/')) {
      problems.push(`The playground is in the build: ${file.path}`);
    }
    if (file.path.endsWith('.js') && file.content.includes(THREE_MARKER)) {
      problems.push(`Three.js is in the build: ${file.path}`);
    }
  }
  return problems;
}
