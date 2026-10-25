/**
 * Proves that a production build contains neither the dev-only playground nor Three.js
 * (spec: kalman-playground, "Dev-only availability").
 *
 * Run after `npm run build` (without the playground flag) with `npm run check:production`.
 * Exits with code 1 and lists every leak when it finds one, which fails CI.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findPlaygroundLeaks, type BuiltFile } from './lib/production-check.ts';

const DIST = 'dist';

/** Every file in dist/, with forward-slash paths (Windows uses backslashes) and their text. */
const files: BuiltFile[] = readdirSync(DIST, {
  recursive: true,
  encoding: 'utf8',
  withFileTypes: false,
})
  .map((path) => path.replaceAll('\\', '/'))
  .map((path) => {
    // Folders appear in the listing too; read only files that hold text we can check.
    const isText = path.endsWith('.html') || path.endsWith('.js');
    return { path, content: isText ? readFileSync(join(DIST, path), 'utf8') : '' };
  });

const problems = findPlaygroundLeaks(files);
if (problems.length > 0) {
  console.error(`This is not a clean production build:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log(`Production build is clean: no playground and no Three.js in ${files.length} files.`);
