/**
 * Decides whether the dev-only playground is part of the site.
 *
 * While the playground is dev-only (PLANNING_LOG), it exists in the development server
 * and in builds made with PLAYGROUND=1 (CI and Cloudflare branch previews), and never in
 * the production build. astro.config.ts asks this function; pure, so it is unit-tested.
 */

/** What Astro is doing, as its integration hooks report it. */
export type AstroCommand = 'dev' | 'build' | 'preview' | 'sync';

export interface PlaygroundFlagInput {
  command: AstroCommand;
  /** The value of the PLAYGROUND environment variable, if set. */
  flag: string | undefined;
}

/** True when the playground route should be added. Only exactly "1" switches it on in a build. */
export function shouldIncludePlayground({ command, flag }: PlaygroundFlagInput): boolean {
  return command === 'dev' || flag === '1';
}
