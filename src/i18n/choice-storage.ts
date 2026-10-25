/**
 * Remembers the visitor's language choice in their own browser (localStorage).
 *
 * Runs in the browser only. No cookies (README §5.4): localStorage stays on the
 * visitor's device and is never sent to a server.
 *
 * Every access is wrapped in try/catch, because browsers can block storage
 * (private windows, strict privacy settings). Then we simply don't remember;
 * the links themselves keep working.
 */
import { isLocale, type Locale } from './locales';

/** The single storage key. The `kalman.` prefix keeps it apart from anything else. */
const STORAGE_KEY = 'kalman.lang';

/** The stored choice, or `null` if there is none, it is unreadable, or it is not a known language. */
export function readStoredChoice(): Locale | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    // Storage can hold anything (an old value, a manual edit), so check before trusting it.
    return value !== null && isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Stores the choice. Fails silently when storage is blocked: remembering is a bonus, not a must. */
export function storeChoice(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage blocked: nothing to do, navigation works without it.
  }
}
