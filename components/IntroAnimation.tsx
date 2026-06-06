"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLenis } from "lenis/react";

// Timeline (ms)
const FILL_MS = 1400;
const HOLD_MS = 200;
const BAR_EXIT_MS = 280;
const EXPAND_MS = 1100; // longer for liquid feel
const FADE_MS = 280;

const FINAL_RADIUS = 16;

// Custom cubic — eased-out, no harsh acceleration, gentle settle.
// Almost-linear middle, soft tail. Reads as "controlled" not "snappy".
const EXPAND_EASE = [0.22, 0.61, 0.36, 1] as const;

type Phase = "loading" | "expanding" | "done";

export function IntroAnimation() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [mounted, setMounted] = useState(false);
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const [percent, setPercent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lenis = useLenis();

  // Freeze the inner scroll surface while the intro is on screen — otherwise a
  // wheel/touch event could scroll the page underneath the overlay before the
  // user has even seen the site. Released the moment the squircle finishes.
  useEffect(() => {
    if (!lenis) return;
    if (phase === "done") lenis.start();
    else lenis.stop();
    return () => lenis.start();
  }, [lenis, phase]);

  // Reveal the .frame border only after the intro overlay is gone.
  // The frame starts with border-color: transparent (in CSS) so it's invisible
  // during the flash before React hydrates + the overlay mounts.
  useEffect(() => {
    if (phase === "done") {
      document.documentElement.classList.add("intro-done");
    }
  }, [phase]);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!mounted || phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted, phase]);

  useEffect(() => {
    if (!mounted || phase !== "loading") return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / FILL_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setPercent(Math.round(eased * 100));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [mounted, phase]);

  useEffect(() => {
    if (!mounted) return;
    const t1 = window.setTimeout(
      () => setPhase("expanding"),
      FILL_MS + HOLD_MS,
    );
    const t2 = window.setTimeout(
      () => setPhase("done"),
      FILL_MS + HOLD_MS + EXPAND_MS + FADE_MS,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mounted]);

  if (!mounted || vw === 0) return null;

  const padding = vw < 768 ? 12 : 16;

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="intro-overlay"
          // Solid bg-bg so the persistent frame + grid + content sitting
          // behind the overlay are fully hidden during loading and expand.
          // The squircle's box-shadow "cutout" trick (below) is unreliable at
          // tiny scales because transform: scale shrinks the shadow with the
          // element — without this solid layer, you'd see the frame outline
          // and the grid bleed through during the loading phase.
          className="pointer-events-auto fixed inset-0 z-[10000] bg-bg"
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: "easeOut" }}
          aria-hidden
        >
          {/* THE CUTOUT — sized to FINAL state at mount.
              Only `transform: scale` animates → compositor-only, no layout thrashing.
              At scale ~0 the element is a sub-pixel dot at viewport center.
              Box-shadow paints bg around it at all times = no flash possible. */}
          <motion.div
            initial={{ scale: 0.0001 }}
            animate={{ scale: phase === "expanding" ? 1 : 0.0001 }}
            transition={{
              duration: EXPAND_MS / 1000,
              ease: EXPAND_EASE,
            }}
            style={{
              position: "fixed",
              top: padding,
              left: padding,
              width: `calc(100vw - ${padding * 2}px)`,
              height: `calc(100vh - ${padding * 2}px)`,
              borderRadius: FINAL_RADIUS,
              border: "1px solid var(--color-fg)",
              boxShadow: "0 0 0 100vmax var(--color-bg)",
              transformOrigin: "center",
              willChange: "transform",
            }}
          />

          {/* Loading UI */}
          <AnimatePresence>
            {phase === "loading" && (
              <motion.div
                key="bar-ui"
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  duration: BAR_EXIT_MS / 1000,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ width: "clamp(280px, 42vw, 640px)" }}
              >
                <div className="absolute bottom-full left-0 right-0 mb-3 flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.25em] text-fg">
                  <span>loading...</span>
                  <span className="tabular">
                    {percent.toString().padStart(3, " ")}%
                  </span>
                </div>
                <div className="relative h-7 overflow-hidden rounded-md border border-fg bg-bg">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: FILL_MS / 1000, ease: "easeOut" }}
                    className="absolute inset-0 origin-left bg-fg"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
