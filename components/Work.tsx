"use client";

import { motion } from "framer-motion";
import { projects } from "@/lib/projects";
import { fadeUp } from "@/lib/motion";
import { ProjectRow } from "./ProjectRow";
import { Marquee } from "./Marquee";

const marqueeItems = [
  "three startups shipped",
  "bootstrapped & profitable",
  "two paying",
  "one for sale",
  "no decks, just demos",
  "shipped > pitched",
  "yes the cursor is custom",
  "built in chandigarh",
  "you're looking at one",
];

const thesisLines = [
  { text: "Products over ideas.", accent: false },
  { text: "Execution over theory.", accent: false },
  { text: "Shipping over plans.", accent: true },
];

const thesisStats = [
  { value: "03", label: "shipped" },
  { value: "02", label: "paying" },
  { value: "01", label: "for sale" },
  { value: "00", label: "investors" },
];

export function Work() {
  return (
    <section id="work" className="relative bg-bg">
      {/* Section header */}
      <div className="relative px-6 md:px-12 pt-20 md:pt-32 pb-12 md:pb-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-20%" }}
          custom={0}
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted"
        >
          // 01 ── selected work
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, letterSpacing: "0.4em", y: 20 }}
          whileInView={{ opacity: 1, letterSpacing: "-0.04em", y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="mt-8 text-[clamp(2.5rem,9vw,7.5rem)] font-medium leading-[0.95]"
        >
          Three startups<span className="text-accent">.</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          custom={0.4}
          className="mt-6 max-w-2xl text-fg-soft text-base md:text-lg leading-relaxed"
        >
          <span className="text-fg">Three shipped.</span>{" "}
          <span className="text-fg">Two paying.</span>{" "}
          <span className="text-accent">One for sale.</span>{" "}
          All bootstrapped. Click any row for the receipt.
        </motion.p>
      </div>

      {/* Ambient marquee band */}
      <Marquee items={marqueeItems} baseVelocity={35} />

      {/* Project rows */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-10%" }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
        }}
      >
        {projects.map((p) => (
          <motion.div
            key={p.id}
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              },
            }}
          >
            <ProjectRow project={p} />
          </motion.div>
        ))}
      </motion.div>

      {/* Thesis block — the closer */}
      <div className="relative px-6 md:px-12 py-20 md:py-32 overflow-hidden">
        <div className="grid-bg absolute inset-0 opacity-30" aria-hidden />

        <div className="relative grid grid-cols-12 gap-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-15%" }}
            custom={0}
            className="col-span-12 md:col-span-4 flex md:flex-col gap-4 md:gap-6 md:justify-end"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
              // 02 ── the thesis
            </div>
            <div className="hidden md:block max-w-xs text-sm text-fg-soft leading-relaxed">
              No outside money. No advisors. No incubator. Just products that
              earn — built out of Chandigarh, aimed at the internet.
            </div>
          </motion.div>

          <div className="col-span-12 md:col-span-8">
            {/* Three stacked manifesto lines */}
            <div className="space-y-1 md:space-y-2 text-[clamp(2.25rem,8vw,6rem)] font-medium leading-none tracking-[-0.035em]">
              {thesisLines.map((line, i) => (
                <motion.div
                  key={line.text}
                  initial={{ opacity: 0, y: 24, clipPath: "inset(0 0 100% 0)" }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    clipPath: "inset(0 0 0% 0)",
                  }}
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{
                    duration: 0.9,
                    delay: 0.15 + i * 0.12,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={
                    line.accent
                      ? "text-accent"
                      : "text-fg"
                  }
                >
                  {line.text}
                </motion.div>
              ))}
            </div>

            {/* Narrative receipts row */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
              {thesisStats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{
                    duration: 0.6,
                    delay: 0.6 + i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="flex items-baseline justify-between rounded-md border border-line bg-bg-soft/60 px-4 py-3"
                >
                  <span className="font-sans text-2xl md:text-3xl font-medium tabular leading-none">
                    {s.value}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                    {s.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{
                duration: 0.6,
                delay: 1.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-8 font-mono text-[10px] uppercase tracking-[0.22em] text-muted"
            >
              ps — all of this in under 12 months.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
