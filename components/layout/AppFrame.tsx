"use client";

import { ReactLenis } from "lenis/react";
import { ScrollProgress } from "./ScrollProgress";
import { TopNav } from "./TopNav";

/**
 * The persistent fixed frame + internal Lenis-driven scroll container.
 *
 * Structure:
 *   <div class="frame">                       ← fixed, draws the border, never moves
 *     <div class="noise" />                   ← painted inside the frame, doesn't scroll
 *     <ScrollProgress />                      ← pinned to the top of the frame
 *     <ReactLenis class="scroll-container">   ← the only thing that scrolls
 *       {page content}
 *     </ReactLenis>
 *   </div>
 *
 * Lenis runs in non-root mode: it attaches to the wrapper div it renders
 * (the `.scroll-container`) instead of `window`. That keeps the document
 * itself frozen while the inside still gets buttery momentum scrolling.
 *
 * The container exposes id="scroll-container" so components that need to
 * coordinate with the scroll surface (IntersectionObserver root, etc.) can
 * find it without prop-drilling refs.
 */
export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="frame">
      <div className="noise" aria-hidden />
      <ScrollProgress />
      <ReactLenis
        options={{
          lerp: 0.1,
          duration: 1.2,
          smoothWheel: true,
          // A sideways swipe is the browser's back / forward gesture: leave it alone. Lenis
          // only ignores perfectly horizontal wheels, and cancelling a real trackpad swipe
          // (always a little vertical) stops the browser from ever showing its arrow.
          virtualScroll: ({ deltaX, deltaY, event }) => !(event.type === "wheel" && Math.abs(deltaX) > Math.abs(deltaY)),
        }}
        className="scroll-container"
        id="scroll-container"
      >
        {/* TopNav is mounted inside the Lenis subtree so `useLenis()`
         *  resolves and smooth-scroll handlers can target the inner
         *  container. It uses `position: fixed`, so it stays pinned to the
         *  viewport regardless of where it sits in the DOM. */}
        <TopNav />
        {children}
      </ReactLenis>
    </div>
  );
}
