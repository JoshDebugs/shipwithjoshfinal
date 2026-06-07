"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { labProjects, type LabStatus } from "@/lib/ai-projects";
import { LabCard } from "./LabCard";

type Filter = "all" | LabStatus;

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "all" },
  { key: "shipped", label: "shipped" },
  { key: "wip", label: "wip" },
  { key: "open-source", label: "open source" },
  { key: "archived", label: "archived" },
];

export function Lab() {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () =>
      filter === "all"
        ? labProjects
        : labProjects.filter((p) => p.status === filter),
    [filter],
  );

  const counts = useMemo(() => {
    return labProjects.reduce<Record<string, number>>(
      (acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1;
        acc.all = (acc.all ?? 0) + 1;
        return acc;
      },
      { all: 0, shipped: 0, wip: 0, archived: 0, "open-source": 0 },
    );
  }, []);

  return (
    <section id="lab" className="relative bg-bg">
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
          // 05 ── the lab
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
          The lab<span className="text-accent">.</span>
        </motion.h2>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-15%" }}
          custom={0.4}
          className="mt-6 max-w-2xl text-fg-soft text-base md:text-lg leading-relaxed"
        >
          Ten AI builds. Not flagships .{" "}
          <span className="text-fg">sharpening sessions</span>. Most shipped in
          a weekend.{" "}
          <span className="text-accent">The rest are still in flux.</span>
        </motion.p>
      </div>

      {/* Filter strip */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-15%" }}
        custom={0.5}
        className="px-6 md:px-12 pb-8 md:pb-10"
      >
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted mr-1">
            filter:
          </span>
          {filters.map((f) => {
            const active = filter === f.key;
            const count = counts[f.key] ?? 0;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                data-cursor="hover"
                aria-pressed={active}
                className={`group relative inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] transition-all duration-300 ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-line bg-bg-soft/40 text-fg-soft hover:border-accent/40 hover:text-accent"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`tabular text-[9px] ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  {count.toString().padStart(2, "0")}
                </span>
              </button>
            );
          })}

          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.22em] text-muted tabular">
            showing {visible.length.toString().padStart(2, "0")} /{" "}
            {labProjects.length.toString().padStart(2, "0")}
          </span>
        </div>
      </motion.div>

      {/* Grid */}
      <div className="px-6 md:px-12 pb-20 md:pb-32">
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                }}
                transition={{
                  layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                }}
                className="h-full"
              >
                <LabCard project={p} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state */}
        {visible.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-10 rounded-lg border border-dashed border-line bg-bg-soft/20 p-10 text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted"
          >
            nothing here. yet.
          </motion.div>
        )}

        {/* Witty closer */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{
            duration: 0.7,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-12 md:mt-16 max-w-xl text-sm md:text-base text-fg-soft leading-relaxed"
        >
          The flagships are above.{" "}
          <span className="text-fg">These are the studio floor</span>. where
          the practice happens.
        </motion.p>
      </div>
    </section>
  );
}
