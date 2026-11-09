"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { InteractiveName } from "./InteractiveName";
import { fadeUp, EASE_OUT_EXPO } from "@/lib/motion";
import { useEffect, useState } from "react";

// Hero element animations are gated to begin the moment the IntroAnimation's
// squircle finishes expanding. Tweak this if intro timing changes.
// Matches: FILL(1.4) + HOLD(0.2) + EXPAND(1.1) = 2.7s
// (BAR_EXIT runs concurrently with EXPAND, so it doesn't add to the total)
const INTRO_REVEAL = 2.7;

let isInitialRender = true;

export function Hero() {
  const [baseDelay] = useState(isInitialRender ? INTRO_REVEAL : 0);

  useEffect(() => {
    isInitialRender = false;
  }, []);

  return (
    <section
      id="top"
      // Visible scroll area inside the frame = 100svh − frame inset (1.5rem mobile / 2rem desktop).
      // Subtract main's outer padding (another 1.5rem / 2rem total) so the hero
      // fills exactly the first "screen" before the next section starts.
      className="relative min-h-[calc(100svh-2.25rem)] md:min-h-[calc(100svh-3.25rem)] w-full overflow-hidden"
    >
      <div className="grid-bg absolute inset-0 opacity-40" aria-hidden />

      {/* top bar */}
      <header className="relative z-10 flex md:hidden xl:flex items-center justify-between px-6 md:px-12 pt-6 md:pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-soft">
        <motion.div
          variants={fadeUp}
          initial={baseDelay === 0 ? "show" : "hidden"}
          animate="show"
          custom={baseDelay + 0.7}
        >
          shipwithjosh<span className="text-accent">.</span>com
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial={baseDelay === 0 ? "show" : "hidden"}
          animate="show"
          custom={baseDelay + 0.9}
          className="tabular hidden md:block"
        >
          chandigarh / ist
        </motion.div>
      </header>

      {/* portrait. slides in from the LEFT, quick (after intro) */}
      <motion.div
        initial={baseDelay === 0 ? { opacity: 1, x: 0 } : { opacity: 0, x: -320 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.55,
          delay: baseDelay,
          ease: EASE_OUT_EXPO,
        }}
        className="pointer-events-none absolute right-0 bottom-0 z-[2] h-[55%] max-[450px]:h-[43%] w-full xl:right-[-15vw] xl:top-0 xl:bottom-auto xl:h-[101%] xl:w-[clamp(560px,64vw,1120px)] block"
        aria-hidden
      >
        <Image
          src="/assets/JoshmannSingh-Photoroom.png"
          alt="Joshmann Singh"
          fill
          priority
          sizes="(min-width: 1280px) 64vw, 100vw"
          className="object-contain object-right-bottom xl:object-top-right"
          style={{ filter: "grayscale(0.08) contrast(1.04)" }}
        />
      </motion.div>

      {/* center stage */}
      <div className="relative z-10 flex flex-col justify-start pt-16 md:pt-56 xl:justify-center xl:pt-0 min-h-[calc(100svh-160px)] px-6 md:px-12">


        {/* Name slides in from the RIGHT, slow */}
        <motion.div
          initial={baseDelay === 0 ? { opacity: 1, x: 0 } : { opacity: 0, x: 320 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 1.0,
            delay: baseDelay + 0.15,
            ease: EASE_OUT_EXPO,
          }}
        >
          <InteractiveName text="Joshmann Singh" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          initial={baseDelay === 0 ? "show" : "hidden"}
          animate="show"
          custom={baseDelay + 0.6}
          className="mt-8 md:mt-10 max-w-2xl text-fg-soft text-lg md:text-xl leading-relaxed"
        >
          Builder out of Chandigarh. I ship fast and have taste.
          <br />
          This site is the proof. keep scrolling for receipts.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial={baseDelay === 0 ? "show" : "hidden"}
          animate="show"
          custom={baseDelay + 0.75}
          className="mt-10 flex flex-col gap-y-3 font-mono text-xs uppercase tracking-[0.2em] text-fg-soft"
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="tabular">
              <span className="text-muted">03</span>{" "}
              <span>startups shipped</span>
            </span>
            <span className="text-line">/</span>
            <span className="tabular">
              <span className="text-muted">19</span>{" "}
              <span>years old</span>
            </span>
          </div>
        </motion.div>
      </div>

      {/* scroll hint */}
      <motion.div
        variants={fadeUp}
        initial={baseDelay === 0 ? "show" : "hidden"}
        animate="show"
        custom={baseDelay + 1.0}
        className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-3"
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
