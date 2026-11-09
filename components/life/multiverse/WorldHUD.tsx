"use client";

/**
 * One calm HUD for the whole multiverse: an ink pill with a dot, the world's
 * number + label, a progress bar and the age. Same style in every world —
 * only the text, the dot and the bar change. Tap it to jump to any world.
 */

import { useState } from "react";
import { AnimatePresence, motion, type MotionValue } from "framer-motion";
import { RISO, alpha } from "./palette";
import type { WorldMeta } from "./types";

export function WorldHUD({
  meta,
  worlds,
  progress,
  visible,
  onJump,
}: {
  meta: WorldMeta;
  worlds: WorldMeta[];
  progress: MotionValue<number>;
  visible: boolean;
  onJump: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hud"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-4 right-4 z-[80] flex flex-col items-end gap-2 font-mono md:bottom-6 md:right-6"
          style={{ color: RISO.paper }}
        >
          <AnimatePresence>
            {open && (
              <motion.nav
                key="menu"
                aria-label="Jump to a world"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="max-h-[60vh] w-[240px] overflow-y-auto rounded-2xl p-2 text-[11px] uppercase tracking-[0.1em]"
                style={{ background: RISO.ink, border: `1px solid ${alpha(RISO.paper, 0.18)}` }}
                data-lenis-prevent
              >
                {worlds.map((w, i) =>
                  w.id === "bridge" ? null : (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        onJump(i);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/10"
                      aria-current={w.id === meta.id ? "true" : undefined}
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: w.accent }} />
                      <span className="w-6 shrink-0 opacity-60">{w.number}</span>
                      <span className="flex-1">{w.label}</span>
                      <span className="opacity-50">{w.age ?? ""}</span>
                    </button>
                  ),
                )}
              </motion.nav>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={`World ${meta.number}: ${meta.label}. Open world list`}
            className="flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[10px] uppercase tracking-[0.12em] md:gap-3 md:text-[11px]"
            style={{ background: RISO.ink, border: `1px solid ${alpha(RISO.paper, 0.2)}` }}
          >
            <span className="h-[7px] w-[7px] rounded-full transition-colors duration-500" style={{ background: meta.accent }} />
            <span className="whitespace-nowrap">
              {meta.number} · {meta.label}
            </span>
            <span className="relative hidden h-[3px] w-14 overflow-hidden rounded-full sm:block" style={{ background: alpha(RISO.paper, 0.2) }}>
              <motion.span className="absolute inset-y-0 left-0 w-full origin-left rounded-full" style={{ background: RISO.paper, scaleX: progress }} />
            </span>
            {meta.age !== null && <span className="whitespace-nowrap opacity-70">Age {meta.age}</span>}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
