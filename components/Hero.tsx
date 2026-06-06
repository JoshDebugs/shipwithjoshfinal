"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { InteractiveName } from "./InteractiveName";
import { fadeUp, EASE_OUT_EXPO } from "@/lib/motion";

// Hero element animations are gated to begin the moment the IntroAnimation's
// squircle finishes expanding. Tweak this if intro timing changes.
// Matches: FILL(1.4) + HOLD(0.2) + EXPAND(1.1) = 2.7s
// (BAR_EXIT runs concurrently with EXPAND, so it doesn't add to the total)
const INTRO_REVEAL = 2.7;

export function Hero() {
  return (
    <section
      id="top"
      // Visible scroll area inside the frame = 100svh − frame inset (1.5rem mobile / 2rem desktop).
      // Subtract main's outer padding (another 1.5rem / 2rem total) so the hero
      // fills exactly the first "screen" before the next section starts.
      className="relative min-h-[calc(100svh-3rem)] md:min-h-[calc(100svh-4rem)] w-full overflow-hidden"
    >
      <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 pt-6 md:pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-soft">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={INTRO_REVEAL + 0.7}
        >
          shipwithjosh<span className="text-accent">.</span>com
        </motion.div>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={INTRO_REVEAL + 0.8}
          className="hidden md:flex items-center gap-2"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          <span>open to roles. picky about them.</span>
        </motion.div>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={INTRO_REVEAL + 0.9}
          className="tabular"
        >
          chandigarh / ist
        </motion.div>
      </header>

      {/* portrait — slides in from the LEFT, quick (after intro) */}
      <motion.div
        initial={{ opacity: 0, x: -320 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.55,
          delay: INTRO_REVEAL,
          ease: EASE_OUT_EXPO,
        }}
        className="pointer-events-none absolute left-180 right-0 top-0 z-[2] hidden h-[101%] w-[clamp(560px,64vw,1120px)] translate-x-[2vw] lg:block"
        aria-hidden
      >
        <Image
          src="/assets/JoshmannSingh-Photoroom.png"
          alt="Joshmann Singh"
          fill
          priority
          sizes="(min-width: 1024px) 64vw, 0px"
          className="object-contain object-top-right"
          style={{ filter: "grayscale(0.08) contrast(1.04)" }}
        />
      </motion.div>

      {/* center stage */}
      <div className="relative z-10 flex flex-col justify-center min-h-[calc(100svh-160px)] px-6 md:px-12">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={INTRO_REVEAL + 0.4}
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted mb-6"
        >
          <span className="text-accent">●</span> currently
          shipping LazyBull
        </motion.div>

        {/* Name slides in from the RIGHT, slow */}
        <motion.div
          initial={{ opacity: 0, x: 320 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 1.0,
            delay: INTRO_REVEAL + 0.15,
            ease: EASE_OUT_EXPO,
          }}
        >
          <InteractiveName text="Joshmann Singh" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={INTRO_REVEAL + 0.6}
          className="mt-8 md:mt-10 max-w-2xl text-fg-soft text-lg md:text-xl leading-relaxed"
        >
          Builder out of Chandigarh. I ship fast and have taste.
          <br />
          This site is the proof — keep scrolling for receipts.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={INTRO_REVEAL + 0.75}
          className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-xs uppercase tracking-[0.2em] text-fg-soft"
        >
          <span className="tabular">
            <span className="text-muted">03</span>{" "}
            <span>startups shipped</span>
          </span>
          <span className="text-line">/</span>
          <span className="tabular">
            <span className="text-muted">00</span>{" "}
            <span>vc raised</span>
          </span>
          <span className="text-line">/</span>
          <span className="tabular">
            <span className="text-muted">18</span>{" "}
            <span>years old</span>
          </span>
        </motion.div>
      </div>

      {/* scroll hint */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        custom={INTRO_REVEAL + 1.0}
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3"
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          scroll if you want receipts
        </div>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="h-6 w-px bg-linear-to-b from-fg-soft to-transparent"
        />
      </motion.div>
    </section>
  );
}
