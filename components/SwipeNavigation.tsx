"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SwipeNavigation() {
  const router = useRouter();

  useEffect(() => {
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

    // Trackpad handling via wheel event
    let accumulatedDeltaX = 0;
    let wheelTimeout: ReturnType<typeof setTimeout> | null = null;
    let isNavigating = false;

    const handleWheel = (e: WheelEvent) => {
      if (isNavigating || inIgnoredArea(e.target)) return;

      // Ignore if scrolling predominantly vertically
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        return;
      }

      accumulatedDeltaX += e.deltaX;

      if (wheelTimeout) {
        clearTimeout(wheelTimeout);
      }

      wheelTimeout = setTimeout(() => {
        accumulatedDeltaX = 0;
      }, 250);

      const threshold = 150; // Adjust sensitivity for touchpad swipe

      if (accumulatedDeltaX > threshold) {
        // Swiped left -> next
        isNavigating = true;
        router.forward();
        setTimeout(() => {
          isNavigating = false;
          accumulatedDeltaX = 0;
        }, 800);
      } else if (accumulatedDeltaX < -threshold) {
        // Swiped right -> prev
        isNavigating = true;
        router.back();
        setTimeout(() => {
          isNavigating = false;
          accumulatedDeltaX = 0;
        }, 800);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("wheel", handleWheel);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [router]);

  return null;
}
