"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLenis } from "lenis/react";
import { CaseStudyBody } from "./CaseStudyBody";
import { ScrollReveal } from "./ScrollReveal";
import type { Project } from "@/lib/projects";

/**
 * Fullscreen cinematic project modal.
 *
 * Rendered into the @modal parallel-route slot — sits above the home-page
 * scroll surface inside the persistent app frame (so it fills the frame,
 * not the viewport edges).
 *
 * Entry animation uses explicit `mounted` state + CSS transitions instead of
 * framer-motion `initial`/`animate`. Reason: when the modal mounts via a
 * parallel-route slot transition, framer's initial→animate handshake can
 * occasionally not fire (the slot's mount path differs from a normal React
 * child mount). Driving the transition off a `useState` toggle in a
 * `useEffect` forces a fresh render with the "in" classes, which CSS
 * transitions reliably pick up.
 *
 * Coordination:
 *   - Pauses Lenis on mount so wheel events don't bleed through to the
 *     page underneath. Resumes on unmount.
 *   - Owns its own scrollable inner panel; ScrollReveal observes that panel
 *     instead of the document.
 *   - Closes via ESC, backdrop click, or close button — all call
 *     `router.back()` so the URL returns to `/`.
 *   - Focus shifts to the close button on mount; a focus trap keeps tab
 *     navigation inside the modal until close.
 */
export function ProjectModal({ project }: { project: Project }) {
  const router = useRouter();
  const lenis = useLenis();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // `false` on first paint → CSS classes render the modal off-screen and
  // transparent. `requestAnimationFrame` then flips it to `true`, triggering
  // the CSS transition. The rAF gap is important: setting state in the same
  // tick as mount sometimes batches into the first paint, skipping the
  // transition's "from" state entirely.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Pause the home page's smooth scroll while the modal is open. Without
  // this, scrolling inside the modal would also drift the page behind it.
  useEffect(() => {
    if (!lenis) return;
    lenis.stop();
    return () => lenis.start();
  }, [lenis]);

  const close = () => router.back();

  // ESC to close + focus trap.
  useEffect(() => {
    closeBtnRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;

      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // close() is a stable closure over router; intentionally not re-binding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`pointer-events-auto absolute inset-0 z-[70] flex items-end justify-center transition-opacity duration-300 ease-out ${
        open ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={`${project.name}. case study`}
      onMouseDown={(e) => {
        // Click-outside close: only when the click starts and ends on the
        // backdrop itself, not on a child that bubbled up.
        if (e.target === e.currentTarget) close();
      }}
    >
      {/* Subtle dim. The bg is already near-black, so this is light. just
       *  enough to signal "this is a layer". */}
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-[2px]" />

      {/*
       * The panel itself. Slides up from below the frame's bottom edge,
       * lands 12px from the top.
       *
       * Height + transform are inline-styled because:
       *   - Tailwind v4 emits `calc(100%-12px)` verbatim, but CSS spec
       *     requires whitespace around `-`/`+` inside calc when the
       *     operands cross unit types (`%` vs `px`).
       *   - Transforms are CSS-class-driven via `open`; using a transition
       *     style ensures the duration/easing apply regardless of any
       *     parent stacking context quirks.
       */}
      <div
        ref={panelRef}
        style={{
          height: "calc(100% - 12px)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 600ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="relative w-full overflow-hidden rounded-t-2xl border-t border-line bg-bg shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.6)]"
      >
        {/* Top chrome. sticky inside the panel so it stays put while the
         *  long case-study body scrolls underneath. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 p-4 md:p-6">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-bg-soft/80 backdrop-blur px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-fg-soft">
            <span className="tabular text-muted">{project.index}</span>
            <span className="text-line">/</span>
            <span className="text-fg">case study</span>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            data-cursor="hover"
            aria-label="close case study"
            className="pointer-events-auto group flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg-soft/80 backdrop-blur text-fg-soft transition-colors hover:border-accent hover:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 3L11 11M11 3L3 11"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="square"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable inner. the modal's own scroll surface. ScrollReveal
         *  observes intersections relative to this element instead of the
         *  document, so reveal animations fire as the user scrolls inside
         *  the modal (not when the modal opens en bloc). */}
        <div
          className="h-full overflow-y-auto overflow-x-hidden overscroll-contain"
          data-modal-scroll
        >
          <ScrollReveal rootSelector="[data-modal-scroll]">
            <CaseStudyBody project={project} showNext={false} />
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
