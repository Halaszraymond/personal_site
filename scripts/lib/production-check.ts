/**
 * Finds traces of the dev-only Kálmán preview in a production build.
 *
 * Pure logic (a list of built files in, a list of problems out), unit-tested; the runner
 * `scripts/check-production-build.ts` reads `dist/` and fails CI if anything is found.
 *
 * Kálmán's figure and rig code are *not* preview code: the public pages will use them
 * (Phase 2), so this check deliberately does not look for them.
 */

/** One file of the build: its path inside `dist/` (with forward slashes) and its text. */
export interface BuiltFile {
  path: string;
  content: string;
}

/**
 * A string only the preview uses: its root element is `[data-kalman-preview]`, and its
 * script looks that element up. Minifying keeps it, because it is a string, not a name.
 */
export const PREVIEW_MARKER = 'kalman-preview';

/** Every reason this build is not a clean production build; empty when it is clean. */
export function findPreviewLeaks(files: readonly BuiltFile[]): string[] {
  const problems: string[] = [];
  for (const file of files) {
    if (file.path === 'playground' || file.path.startsWith('playground/')) {
      problems.push(`The preview is in the build: ${file.path}`);
      continue;
    }
    const isCode = file.path.endsWith('.js') || file.path.endsWith('.html');
    if (isCode && file.content.includes(PREVIEW_MARKER)) {
      problems.push(`Preview code is in the build: ${file.path}`);
    }
  }
  return problems;
}
