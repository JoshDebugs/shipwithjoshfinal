"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";

type Freq = "daily" | "often" | "exploring";

type Tool = {
  name: string;
  freq: Freq;
  reason: string;
};

type Category = {
  key: string;
  caption: string;
  tools: Tool[];
};

const stack: Category[] = [
  {
    key: "core",
    caption: "the build spine. opinionated, boring, fast.",
    tools: [
      {
        name: "Next.js",
        freq: "daily",
        reason: "default for any product i ship.",
      },
      {
        name: "TypeScript",
        freq: "daily",
        reason: "non-negotiable past v1.",
      },
      {
        name: "tRPC",
        freq: "often",
        reason: "type-safe contracts, zero glue code.",
      },
      {
        name: "Tailwind",
        freq: "daily",
        reason: "design system in a single file.",
      },
      {
        name: "React",
        freq: "daily",
        reason: "still the right primitive.",
      },
    ],
  },
  {
    key: "data",
    caption: "the data layer. boringly reliable.",
    tools: [
      {
        name: "PostgreSQL",
        freq: "daily",
        reason: "primary store. always.",
      },
      {
        name: "Prisma",
        freq: "daily",
        reason: "schemas as code, migrations as commits.",
      },
      {
        name: "Redis · Upstash",
        freq: "often",
        reason: "edge-native caching + rate limits.",
      },
      {
        name: "Supabase",
        freq: "often",
        reason: "fast scaffolding for MVPs.",
      },
      {
        name: "Pinecone",
        freq: "often",
        reason: "vector store for retrieval.",
      },
    ],
  },
  {
    key: "ai",
    caption: "AI as infrastructure, not feature.",
    tools: [
      {
        name: "Agent workflows",
        freq: "daily",
        reason: "multi-step tool use, claude-driven.",
      },
      {
        name: "RAG + embeddings",
        freq: "often",
        reason: "pinecone retrieval, openai embeddings.",
      },
      {
        name: "Vercel AI SDK",
        freq: "daily",
        reason: "streaming + tool calls, type-safe.",
      },
      {
        name: "Anthropic + OpenAI",
        freq: "daily",
        reason: "inference layer. claude-first.",
      },
      {
        name: "Cursor · Claude Code",
        freq: "daily",
        reason: "shipping 5x faster with agents.",
      },
    ],
  },
  {
    key: "motion",
    caption: "where it stops feeling like a website.",
    tools: [
      {
        name: "Framer Motion",
        freq: "daily",
        reason: "default for UI motion + gestures.",
      },
      {
        name: "GSAP",
        freq: "often",
        reason: "complex scroll choreography.",
      },
      {
        name: "Lenis",
        freq: "often",
        reason: "smooth scroll without the jank.",
      },
      {
        name: "Three.js · R3F",
        freq: "exploring",
        reason: "3D only where it adds signal.",
      },
    ],
  },
  {
    key: "auth + comms",
    caption: "production infra. no boilerplate tax.",
    tools: [
      {
        name: "Clerk",
        freq: "often",
        reason: "fastest auth to production.",
      },
      {
        name: "Better Auth",
        freq: "exploring",
        reason: "for self-hosted depth.",
      },
      {
        name: "Resend",
        freq: "often",
        reason: "transactional email that ships.",
      },
      {
        name: "Stripe",
        freq: "often",
        reason: "payments. obviously.",
      },
    ],
  },
  {
    key: "ops",
    caption: "shipping, observing, sleeping at night.",
    tools: [
      {
        name: "Vercel",
        freq: "daily",
        reason: "default deploy. zero-config edge.",
      },
      {
        name: "Railway",
        freq: "often",
        reason: "when it needs a real server.",
      },
      {
        name: "Docker",
        freq: "often",
        reason: "containers where it earns its weight.",
      },
      {
        name: "Trigger.dev",
        freq: "exploring",
        reason: "background jobs + AI workflows.",
      },
      {
        name: "Sentry",
        freq: "often",
        reason: "errors before users find them.",
      },
    ],
  },
];

const totalTools = stack.reduce((acc, c) => acc + c.tools.length, 0);

const freqDot: Record<Freq, string> = {
  daily: "bg-accent",
  often: "bg-fg-soft",
  exploring: "bg-transparent border border-accent",
};

const freqLabel: Record<Freq, string> = {
  daily: "text-fg",
  often: "text-fg-soft",
  exploring: "text-accent",
};

export function Stack() {
  return (
    <section id="stack" className="relative bg-bg">
      {/* Heading */}
      <div className="relative px-6 md:px-12 pt-20 md:pt-32 pb-12 md:pb-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-20%" }}
          custom={0}
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted"
        >
          // 04 ── the stack
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
          className="mt-8 text-[clamp(2.5rem,9vw,7.5rem)] font-medium leading-[0.95]"
        >
          Built to ship<span className="text-accent">.</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          custom={0.4}
          className="mt-6 max-w-2xl text-fg-soft text-base md:text-lg leading-relaxed"
        >
          A stack chosen for one thing:{" "}
          <span className="text-fg">
            getting products in front of users
          </span>
          . Every tool here earned its slot.
        </motion.p>
      </div>

      {/* Legend + meta strip */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-15%" }}
        custom={0.5}
        className="px-6 md:px-12 pb-8 md:pb-10"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.22em] text-fg-soft">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            daily driver
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-fg-soft" />
            often
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full border border-accent bg-transparent" />
            exploring
          </span>
          <span className="ml-auto text-muted tabular">
            {totalTools.toString().padStart(2, "0")} tools / {stack.length}{" "}
            categories / 0 fluff
          </span>
        </div>
      </motion.div>

      {/* Grid */}
      <div className="px-6 md:px-12 pb-20 md:pb-32">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.09, delayChildren: 0.1 },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
        >
          {stack.map((cat, ci) => (
            <motion.div
              key={cat.key}
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="group relative rounded-lg border border-line bg-bg-soft/40 p-5 md:p-6 transition-colors duration-300 hover:border-accent/40 hover:bg-bg-soft/60"
              data-cursor="hover"
            >
              {/* Header */}
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="font-mono text-xs uppercase tracking-[0.25em] text-fg">
                  // {cat.key}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted tabular">
                  {cat.tools.length.toString().padStart(2, "0")} ─ tools
                </div>
              </div>

              {/* Caption */}
              <p className="text-sm text-fg-soft leading-relaxed mb-5">
                {cat.caption}
              </p>

              {/* Tools list */}
              <ul className="space-y-3">
                {cat.tools.map((tool) => (
                  <li
                    key={tool.name}
                    className="group/tool flex items-start justify-between gap-3 -mx-2 px-2 py-1 rounded-md transition-colors duration-200 hover:bg-bg-soft/60"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`mt-[7px] h-1.5 w-1.5 flex-none rounded-full ${
                          freqDot[tool.freq]
                        } ${
                          tool.freq === "daily"
                            ? "group-hover/tool:animate-pulse"
                            : ""
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-[15px] font-medium text-fg leading-snug">
                          {tool.name}
                        </div>
                        <div className="mt-1 font-mono text-[10.5px] text-muted leading-snug">
                          <span className="text-line">// </span>
                          {tool.reason}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`mt-1 flex-none font-mono text-[10px] uppercase tracking-[0.18em] ${
                        freqLabel[tool.freq]
                      }`}
                    >
                      {tool.freq}
                    </span>
                  </li>
                ))}
              </ul>

              {/* corner status LED — slow pulse, staggered per card */}
              <motion.span
                animate={{ opacity: [0.35, 0.85, 0.35] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: ci * 0.4,
                }}
                className="pointer-events-none absolute right-4 top-4 h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Closing line */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{
            duration: 0.7,
            delay: 0.15,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-12 md:mt-16 max-w-xl text-sm md:text-base text-fg-soft leading-relaxed"
        >
          If a tool isn't on this list,{" "}
          <span className="text-fg">
            it's because I haven't shipped with it
          </span>{" "}
          <span className="text-accent">yet</span>.
        </motion.p>
      </div>
    </section>
  );
}
