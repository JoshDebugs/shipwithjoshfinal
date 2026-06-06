"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps content with a scroll-into-view reveal animation.
 * Any descendant element with className="reveal" fades up when it enters the
 * viewport (default) or — when `rootSelector` is provided — when it enters
 * the bounds of the matched scroll container.
 *
 * Used by the case study pages, /now, and the project modal. Honors
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
   * document — e.g. the project modal's inner panel.
   */
  rootSelector?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    const elements = wrapper.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [rootSelector]);

  return <div ref={ref}>{children}</div>;
}
