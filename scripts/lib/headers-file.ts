/**
 * Reads a Cloudflare Pages `_headers` file into a list of rules.
 *
 * Used by the e2e tests to apply the production headers to the local preview server,
 * which ignores `_headers`. Pure function: text in, rules out, unit-tested.
 *
 * File format (https://developers.cloudflare.com/pages/configuration/headers/):
 *   /path-pattern
 *     Header-Name: value
 * Lines starting with `#` are comments; blank lines are ignored.
 */

/** One rule: a path pattern and the headers for matching paths. */
export interface HeaderRule {
  pattern: string;
  headers: Record<string, string>;
}

/** Parses the text of a `_headers` file. Throws on a header line that has no path above it. */
export function parseHeadersFile(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    // An indented line is a header for the current rule; an unindented one starts a new rule.
    const isHeaderLine = /^\s/.test(rawLine);
    if (!isHeaderLine) {
      rules.push({ pattern: line, headers: {} });
      continue;
    }

    const current = rules.at(-1);
    if (current === undefined) {
      throw new Error(`Header line without a path above it: "${line}"`);
    }
    // Split on the first colon only: header values (like CSP) can contain colons too.
    const colon = line.indexOf(':');
    if (colon === -1) {
      throw new Error(`Header line without a colon: "${line}"`);
    }
    const name = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    current.headers[name] = value;
  }

  return rules;
}
