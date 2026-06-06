"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import type { LabProject } from "@/lib/ai-projects";

const SPRING = { stiffness: 200, damping: 22, mass: 0.4 };
const TILT_DEG = 5;

const statusDot: Record<LabProject["status"], string> = {
  shipped: "bg-fg",
  wip: "bg-accent",
  archived: "bg-muted",
  "open-source": "bg-accent",
};

const statusText: Record<LabProject["status"], string> = {
  shipped: "text-fg",
  wip: "text-accent",
  archived: "text-muted",
  "open-source": "text-accent",
};

const statusLabel: Record<LabProject["status"], string> = {
  shipped: "shipped",
  wip: "wip",
  archived: "archived",
  "open-source": "open source",
};

export function LabCard({ project }: { project: LabProject }) {
  const ref = useRef<HTMLAnchorElement>(null);

  // Mouse position within card (0–1 on each axis)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const sx = useSpring(x, SPRING);
  const sy = useSpring(y, SPRING);

  // 3D tilt — clamped so it never feels uncanny
  const rotateX = useTransform(sy, [0, 1], [TILT_DEG, -TILT_DEG]);
  const rotateY = useTransform(sx, [0, 1], [-TILT_DEG, TILT_DEG]);

  // Sync CSS variables for the cursor-following glow
  useMotionValueEvent(sx, "change", (latest) => {
    ref.current?.style.setProperty("--mx", `${latest * 100}%`);
  });
  useMotionValueEvent(sy, "change", (latest) => {
    ref.current?.style.setProperty("--my", `${latest * 100}%`);
  });

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width);
    y.set((e.clientY - r.top) / r.height);
  };

  const handleLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  const isLink = Boolean(project.href);

  return (
    <motion.a
      ref={ref}
      href={project.href || "#"}
      target={isLink ? "_blank" : undefined}
      rel={isLink ? "noopener noreferrer" : undefined}
      aria-disabled={!isLink}
      data-cursor="hover"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={
        {
          rotateX,
          rotateY,
          transformPerspective: 1100,
          transformStyle: "preserve-3d",
          "--mx": "50%",
          "--my": "50%",
        } as React.CSSProperties
      }
      className="group relative block h-full overflow-hidden rounded-xl border border-line bg-bg-soft/40 transition-colors duration-300 hover:border-accent/40 will-change-transform"
    >
      {/* cursor-following glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), rgba(197,255,61,0.16), transparent 45%)",
        }}
        aria-hidden
      />

      {/* thumbnail / gradient placeholder */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line">
        {project.image ? (
          <Image
            src={project.image}
            alt={project.name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 30%, rgba(197,255,61,0.08), transparent 50%),
                radial-gradient(circle at 80% 75%, rgba(143,181,43,0.05), transparent 55%),
                linear-gradient(135deg, #0f0f0f, #0a0a0a 80%)
              `,
            }}
          >
            <span className="absolute right-4 bottom-3 font-mono text-[11px] tracking-[0.3em] text-muted tabular">
              {project.index}
            </span>
            <span className="absolute left-4 top-3 font-mono text-[9px] uppercase tracking-[0.25em] text-line">
              // no preview yet
            </span>
          </div>
        )}

        {/* status pill */}
        <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-soft/85 backdrop-blur px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]} ${
              project.status === "wip" ? "animate-pulse" : ""
            }`}
          />
          <span className={statusText[project.status]}>
            {statusLabel[project.status]}
          </span>
        </span>
      </div>

      {/* content */}
      <div className="relative flex flex-col gap-3 p-5">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tabular tracking-[0.22em] text-muted">
            {project.index}
          </span>
          <h3 className="text-lg md:text-xl font-medium tracking-[-0.025em] text-fg leading-tight">
            {project.name}
          </h3>
        </div>

        <p className="font-mono text-[11px] text-fg-soft leading-snug">
          <span className="text-line">// </span>
          {project.description}
        </p>

        <div className="mt-1 flex flex-wrap gap-1.5">
          {project.stack.map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded-full border border-line bg-bg-soft px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-fg-soft"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* hairline accent rule on hover, bottom-left */}
      <span
        className="absolute bottom-0 left-0 h-px w-0 bg-accent transition-all duration-500 group-hover:w-full"
        aria-hidden
      />
    </motion.a>
  );
}
