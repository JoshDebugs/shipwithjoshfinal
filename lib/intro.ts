/**
 * The site-wide intro overlay (components/layout/IntroAnimation.tsx) plays once, on the
 * first document load, whatever the route, and marks <html> with `intro-done`
 * when it has gone.
 *
 * Hero entrances that are staged to land as the overlay opens should only wait
 * for it while it is actually playing. Arriving from another page there is no
 * overlay, and a 1-3 s wait reads as the page being slow to load.
 *
 * On the server this is always false, which matches the first load (the overlay
 * is up), so the first client render agrees with the server render.
 */
export function introDone(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("intro-done");
}
