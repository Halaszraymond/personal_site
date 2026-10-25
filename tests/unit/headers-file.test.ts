/**
 * Unit tests for the `_headers` parser used by the e2e headers fixture.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseHeadersFile } from '../../scripts/lib/headers-file';

describe('parseHeadersFile', () => {
  it('reads a path with its indented headers, skipping comments and blank lines', () => {
    const text = ['# comment', '', '/*', '  X-Test: one', '  X-Other: two'].join('\n');
    expect(parseHeadersFile(text)).toEqual([
      { pattern: '/*', headers: { 'X-Test': 'one', 'X-Other': 'two' } },
    ]);
  });

  it('keeps colons inside header values', () => {
    const text = '/*\n  Content-Security-Policy: default-src https://example.com';
    expect(parseHeadersFile(text)[0]?.headers['Content-Security-Policy']).toBe(
      'default-src https://example.com',
    );
  });

  it('handles Windows line endings', () => {
    expect(parseHeadersFile('/*\r\n  X-Test: one\r\n')).toEqual([
      { pattern: '/*', headers: { 'X-Test': 'one' } },
    ]);
  });

  it('rejects a header line without a path above it', () => {
    expect(() => parseHeadersFile('  X-Test: one')).toThrow(/without a path/);
  });

  it('rejects a header line without a colon', () => {
    expect(() => parseHeadersFile('/*\n  not a header')).toThrow(/without a colon/);
  });

  it('parses the real public/_headers with a strict CSP', () => {
    const rules = parseHeadersFile(readFileSync('public/_headers', 'utf8'));
    const csp = rules.find((rule) => rule.pattern === '/*')?.headers['Content-Security-Policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('unsafe-inline');
  });
});
