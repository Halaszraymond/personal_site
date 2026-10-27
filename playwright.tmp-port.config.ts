// Temporary (not committed): the normal config, but on port 4331, so a running dev server on 4321 is left alone.
import base from './playwright.config';
export default {
  ...base,
  use: { ...base.use, baseURL: 'http://localhost:4331' },
  webServer: {
    command: 'npx astro preview --port 4331',
    url: 'http://localhost:4331',
    reuseExistingServer: false,
    env: { ASTRO_TELEMETRY_DISABLED: '1' },
    timeout: 120_000,
  },
};
