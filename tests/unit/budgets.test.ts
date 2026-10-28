/**
 * Unit tests for the bundle-size budget (README §5.4: performance budgets are enforced).
 */
import { describe, expect, it } from 'vitest';
import {
  BASE_BUDGET_BYTES,
  budgetFor,
  checkBudget,
  formatKilobytes,
  importsInChunk,
  KILOBYTE,
  pagePathOf,
  reachableChunks,
  scriptsInHtml,
} from '../../scripts/lib/budgets';

const LIMIT = 50 * KILOBYTE;

describe('checkBudget', () => {
  it('passes under the budget and adds up all files', () => {
    const result = checkBudget(
      [
        { path: 'a.js', gzipBytes: 10 * KILOBYTE },
        { path: 'b.js', gzipBytes: 5 * KILOBYTE },
      ],
      LIMIT,
    );
    expect(result).toEqual({ totalBytes: 15 * KILOBYTE, limitBytes: LIMIT, withinBudget: true });
  });

  it('passes exactly at the budget', () => {
    expect(checkBudget([{ path: 'a.js', gzipBytes: LIMIT }], LIMIT).withinBudget).toBe(true);
  });

  it('fails one byte over the budget', () => {
    expect(checkBudget([{ path: 'a.js', gzipBytes: LIMIT + 1 }], LIMIT).withinBudget).toBe(false);
  });

  it('passes with no files at all', () => {
    expect(checkBudget([], LIMIT)).toEqual({
      totalBytes: 0,
      limitBytes: LIMIT,
      withinBudget: true,
    });
  });
});

describe('formatKilobytes', () => {
  it('shows kilobytes with one decimal', () => {
    expect(formatKilobytes(1536)).toBe('1.5 KB');
    expect(formatKilobytes(0)).toBe('0.0 KB');
  });
});

describe('per-page budgets', () => {
  it('gives every page, the dev-only preview included, the base budget', () => {
    for (const page of ['/', '/nl/', '/hu/', '/en/', '/404.html', '/playground/']) {
      expect(budgetFor(page)).toBe(BASE_BUDGET_BYTES);
    }
  });

  it('turns built HTML files into page paths', () => {
    expect(pagePathOf('index.html')).toBe('/');
    expect(pagePathOf('nl/index.html')).toBe('/nl/');
    // Windows lists files with backslashes.
    expect(pagePathOf('playground\\index.html')).toBe('/playground/');
    expect(pagePathOf('404.html')).toBe('/404.html');
  });

  it('finds the scripts a page loads', () => {
    const html =
      '<head><script type="module" src="/_astro/a.js"></script></head>' +
      '<body><script>inline()</script><script type="module" src="/_astro/b.js"></script></body>';
    expect(scriptsInHtml(html)).toEqual(['/_astro/a.js', '/_astro/b.js']);
  });

  it('finds static, side-effect and lazy imports in minified code', () => {
    const code = 'import{a as b}from"./x.js";import"./y.js";const m=import("./z.js");';
    expect(importsInChunk(code)).toEqual(['./x.js', './y.js', './z.js']);
  });

  it('finds a lazy import written with backticks, as Vite writes them', () => {
    const code = 'async()=>{let{s:e}=await import(`./dive-scene.Cx.js`);return e}';
    expect(importsInChunk(code)).toEqual(['./dive-scene.Cx.js']);
  });

  it('follows imports through chunks and counts each chunk once', () => {
    // a imports b and c; b imports c; c imports nothing: a small diamond-shaped graph.
    const graph: Record<string, string[]> = {
      '/_astro/a.js': ['./b.js', './c.js'],
      '/_astro/b.js': ['./c.js'],
      '/_astro/c.js': [],
    };
    const chunks = reachableChunks(['/_astro/a.js'], (chunk) => graph[chunk] ?? []);
    expect(chunks.sort()).toEqual(['/_astro/a.js', '/_astro/b.js', '/_astro/c.js']);
  });
});
