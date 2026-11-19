"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Swipe back / forward on touch screens.
 *
 * Trackpads and desktop browsers use the browser's own gesture (two-finger
 * swipe, with its back / forward arrow): globals.css and the Lenis options in
 * AppFrame leave sideways swipes to it. Handling them here as well would go back
 * twice, and a scripted swipe can't show the browser's arrow.
 *
 * Phones and tablets keep this one, matching the `(hover: none) and (pointer:
 * coarse)` block in globals.css, which keeps the browser's overscroll swipe off
 * there so the two never both fire.
 */
const TOUCH_SCREEN = "(hover: none) and (pointer: coarse)";

export function SwipeNavigation() {
  const router = useRouter();

  useEffect(() => {
    if (!window.matchMedia(TOUCH_SCREEN).matches) return;

    let touchStartX = 0;
    let touchEndX = 0;
    let ignoreGesture = false;

    // Interactive areas (drag-to-twist, scrubbers…) opt out with data-swipe-ignore.
    const inIgnoredArea = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest("[data-swipe-ignore]");

    const handleTouchStart = (e: TouchEvent) => {
      ignoreGesture = inIgnoredArea(e.target);
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (ignoreGesture) return;
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };

    const handleSwipe = () => {
      const swipeDistance = touchEndX - touchStartX;
      const minSwipeDistance = 75;

      if (swipeDistance > minSwipeDistance) {
        // Swipe Right -> previous page
        router.back();
      } else if (swipeDistance < -minSwipeDistance) {
        // Swipe Left -> next page
        router.forward();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  return null;
}
