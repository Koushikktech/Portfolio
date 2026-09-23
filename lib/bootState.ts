/**
 * In-memory boot state
 *
 * - Resets to `false` on every browser reload / refresh (full page reload).
 * - Remains `true` during client-side SPA navigation (clicking Home, About, Craft, Lab).
 * This ensures the loading screen plays on every fresh reload, but NEVER interrupts
 * internal navigation when switching between pages or clicking Home/About.
 */

let hasBootedThisSession = false;

export function getHasBooted(): boolean {
  return hasBootedThisSession;
}

export function setHasBooted(val = true): void {
  hasBootedThisSession = val;
}
