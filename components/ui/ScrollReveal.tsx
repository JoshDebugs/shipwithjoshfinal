"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Wraps content with a scroll-into-view reveal animation.
 * Any descendant element with className="reveal" fades up when it enters the
 * viewport (default) or — when `rootSelector` is provided — when it enters
 * the bounds of the matched scroll container.
 *
 * What the page opens on is shown at once, before the first paint (the route's
 * own fade carries its entrance), so a page never opens blank while an observer
 * catches up and a 0.8 s fade runs. Only what lies further down waits to be
 * scrolled to.
 *
 * Used by the case study pages and /now. Honors
 * `prefers-reduced-motion` via globals.css.
 */
export function ScrollReveal({
  children,
  rootSelector,
}: {
  children: React.ReactNode;
  /**
   * Optional CSS selector for the element to use as the IntersectionObserver
   * root. Pass when the content scrolls inside a container rather than the
   * document — e.g. a scrollable panel.
   */
  rootSelector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const wrapper = ref.current;
    if (!wrapper) return;

    if (typeof IntersectionObserver === "undefined") {
      wrapper.querySelectorAll(".reveal").forEach((el) => {
        el.classList.add("is-visible");
      });
      return;
    }

    // Resolve the observer root. If a selector is given but doesn't match
    // yet (e.g. ref not attached), fall back to the viewport so animations
    // still fire instead of silently breaking.
    const observerRoot = rootSelector
      ? document.querySelector(rootSelector)
      : null;

    // The opening screen, measured from the top of the scroll surface (a navigation
    // shows the new page from its top): revealed now, with no transition to wait on
    // (measuring has already given these their hidden style, so a plain class change
    // would still fade them in over 0.8 s).
    const surface = (observerRoot as HTMLElement | null) ?? document.getElementById("scroll-container");
    const fold = (surface?.clientHeight || window.innerHeight) * 0.95;
    const surfaceTop = surface ? surface.getBoundingClientRect().top - surface.scrollTop : 0;
    const later: Element[] = [];
    const now: Element[] = [];
    wrapper.querySelectorAll(".reveal").forEach((el) => {
      if (el.getBoundingClientRect().top - surfaceTop < fold) now.push(el);
      else later.push(el);
    });
    if (now.length) {
      now.forEach((el) => el.classList.add("is-visible", "is-instant"));
      // commit the shown style without a transition, then hand their own transitions back (hover etc.)
      void wrapper.offsetHeight;
      now.forEach((el) => el.classList.remove("is-instant"));
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      {
        root: observerRoot,
        rootMargin: "-10% 0px -5% 0px",
        threshold: 0.05,
      },
    );

    later.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [rootSelector]);

  return <div ref={ref}>{children}</div>;
}
