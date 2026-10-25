/**
 * Kálmán's config as stored in the repo (kalman.config.json), checked on import.
 *
 * If the file is ever invalid (a bad paste from the playground), the build fails here
 * with the validation errors, instead of drawing a broken Kálmán. The unit tests check
 * the same file, so CI catches it even earlier.
 */
import { importConfig, type KalmanConfig } from '../../lib/kalman-config';
import configFile from './kalman.config.json';

/** The repo config. Throws with every validation error if the file is invalid. */
export function repoConfig(): KalmanConfig {
  // The JSON module is already parsed; importConfig expects text, so it goes through
  // the same path as a paste from the playground (version check included).
  const result = importConfig(JSON.stringify(configFile));
  if (!result.ok) {
    throw new Error(`kalman.config.json is invalid:\n  ${result.errors.join('\n  ')}`);
  }
  return result.config;
}
