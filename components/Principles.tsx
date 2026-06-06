"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

type Principle = {
  n: string;
  title: string;
  body: string;
  tags: string[];
};

const principles: Principle[] = [
  {
    n: "01",
    title: "Bias toward systems.",
    body: "Code, AI, automation, distribution. I build things that compound — so the work keeps paying off long after I'm done with it.",
    tags: ["systems", "automation", "ai", "compounding"],
  },
  {
    n: "02",
    title: "Ship the thing.",
    body: "Products win. Decks don't. If the idea matters, the v1 should exist by the end of the week.",
    tags: ["build", "ship", "v1", "products"],
  },
  {
    n: "03",
    title: "Identity beats motivation.",
    body: "Motivation is weather. Identity is climate. I'd rather become the operator who ships, than convince myself to ship today.",
    tags: ["identity", "habits", "process"],
  },
  {
    n: "04",
    title: "Pick asymmetric bets.",
    body: "Downside is one weekend. Upside is uncapped. Most of life is shaped like this — pick more of them.",
    tags: ["asymmetric", "leverage", "ev"],
  },
];

export function Principles() {
  return (
    <section id="principles" className="relative bg-bg">
      <div className="relative px-6 md:px-12 pt-20 md:pt-32 pb-20 md:pb-32">
        <div className="grid grid-cols-12 gap-x-6 md:gap-x-12">
          {/* Sticky thesis (left) */}
          <div className="col-span-12 md:col-span-5 md:sticky md:top-24 md:self-start">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-20%" }}
              custom={0}
              className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted"
            >
              // 03 ── the operating system
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, letterSpacing: "0.4em", y: 20 }}
              whileInView={{ opacity: 1, letterSpacing: "-0.04em", y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{
                duration: 1.1,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.05,
              }}
              className="mt-8 text-[clamp(2.5rem,8vw,6.5rem)] font-medium leading-[0.95]"
            >
              Life is leverage
              <span className="text-accent">.</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-15%" }}
              custom={0.3}
              className="mt-6 max-w-md text-fg-soft text-base md:text-lg leading-relaxed"
            >
              Four principles I default to. The rest is execution.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-15%" }}
              custom={0.5}
              className="mt-10 hidden md:flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted"
            >
              <span className="h-px w-8 bg-line" />
              <span>read on the right</span>
            </motion.div>
          </div>

          {/* Principles (scrolling right) */}
          <div className="col-span-12 md:col-span-7 mt-16 md:mt-0">
            <div className="space-y-20 md:space-y-32">
              {principles.map((p) => (
                <motion.article
                  key={p.n}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{
                    duration: 0.8,
                    delay: 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative"
                >
                  {/* number + animated rule */}
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm md:text-base tracking-[0.2em] text-muted tabular">
                      {p.n}
                    </span>
                    <motion.span
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true, margin: "-25%" }}
                      transition={{
                        duration: 1.2,
                        delay: 0.2,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="h-px flex-1 origin-left bg-line"
                    />
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: "-25%" }}
                      transition={{ duration: 0.6, delay: 1.0 }}
                      className="h-1 w-1 rounded-full bg-accent"
                    />
                  </div>

                  <h3 className="mt-7 text-3xl md:text-5xl font-medium tracking-[-0.03em] leading-[1.05]">
                    {p.title}
                  </h3>

                  <p className="mt-5 text-base md:text-lg text-fg-soft leading-relaxed max-w-xl">
                    {p.body}
                  </p>

                  <div className="mt-7 flex flex-wrap gap-1.5">
                    {p.tags.map((t, ti) => (
                      <motion.span
                        key={t}
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-20%" }}
                        transition={{
                          duration: 0.5,
                          delay: 0.55 + ti * 0.08,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="inline-flex items-center rounded-full border border-line bg-bg-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-fg-soft"
                      >
                        {t}
                      </motion.span>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>

            {/* closing tag */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{
                duration: 0.8,
                delay: 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-24 md:mt-40 border-t border-line pt-10"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                currently orbiting
              </div>
              <p className="mt-4 text-base md:text-lg text-fg-soft max-w-xl leading-relaxed">
                <span className="text-fg">AI products</span>{" "}
                ·{" "}
                <span className="text-fg">
                  quant systems
                </span>{" "}
                ·{" "}
                <span className="text-fg">founder tools</span>{" "}
                ·{" "}
                <span className="text-fg">automation</span>.
                The intersection of those four is where I want to live for the
                next decade.
              </p>
              <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                ps — none of this is original. all of it was earned the hard
                way.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
