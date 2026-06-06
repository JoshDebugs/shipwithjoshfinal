"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/lib/projects";

type Props = {
  project: Project;
};

const statusDot: Record<Project["status"], string> = {
  "for-sale": "bg-accent",
  live: "bg-fg",
  shipped: "bg-muted",
};

const statusText: Record<Project["status"], string> = {
  "for-sale": "text-accent",
  live: "text-fg",
  shipped: "text-muted",
};

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * A project row on the home page.
 *
 * Click → navigates to `/work/[id]`. Next intercepts that navigation from
 * `/` via `app/@modal/(.)work/[slug]/page.tsx` and renders ProjectModal as
 * a cinematic slide-up overlay; direct URL / refresh shows the standalone
 * case-study page. Either way the row is just a `<Link>` — the routing layer
 * decides which surface to render.
 *
 * The hover atmosphere stays: image clip-path reveal on desktop, accent
 * rail, skewed name, animated chevron. No more inline accordion — there's
 * exactly one path to the case study, and the URL is shareable.
 */
export function ProjectRow({ project }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative border-b border-line"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-cursor="hover"
    >
      <Link
        href={`/work/${project.id}`}
        className="relative block w-full overflow-hidden text-left"
        aria-label={`open ${project.name} case study`}
      >
        {/* IMAGE REVEAL (desktop, hover only) */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            clipPath: hovered ? "inset(0% 0% 0% 50%)" : "inset(0% 0% 0% 100%)",
          }}
          transition={{ duration: 0.7, ease }}
          className="pointer-events-none absolute inset-0 hidden md:block"
        >
          {project.previewImage ? (
            <Image
              src={project.previewImage}
              alt=""
              fill
              sizes="50vw"
              className="object-cover"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,#1a1a1a,#0a0a0a_70%)]">
              <div className="absolute right-12 top-1/2 -translate-y-1/2 text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                  no preview · archived
                </div>
                <div className="mt-2 text-3xl font-medium text-fg-soft tracking-[-0.02em]">
                  {project.name}
                </div>
              </div>
            </div>
          )}
          {/* fade the image's left edge into the bg so text stays readable */}
          <div className="absolute inset-y-0 left-1/2 w-32 bg-linear-to-r from-bg to-transparent" />
          {/* subtle darken overlay on the image */}
          <div className="absolute inset-y-0 left-1/2 right-0 bg-bg/15" />
        </motion.div>

        {/* CONTENT */}
        <div className="relative grid grid-cols-12 items-center gap-4 px-6 py-8 md:px-12 md:py-12">
          {/* accent rail */}
          <span
            className={`absolute left-0 top-0 h-full w-[2px] origin-top bg-accent transition-transform duration-500 ${
              hovered ? "scale-y-100" : "scale-y-0"
            }`}
            aria-hidden
          />

          {/* index */}
          <div className="col-span-2 md:col-span-1">
            <motion.span
              animate={{ x: hovered ? 4 : 0 }}
              transition={{ duration: 0.5, ease }}
              className={`inline-block font-mono text-xs md:text-sm tracking-[0.2em] tabular transition-colors duration-300 ${
                hovered ? "text-accent" : "text-muted"
              }`}
            >
              {project.index}
            </motion.span>
          </div>

          {/* name + tagline */}
          <div className="col-span-10 md:col-span-7">
            <motion.h3
              animate={{
                skewX: hovered ? -3 : 0,
                x: hovered ? 6 : 0,
              }}
              transition={{ duration: 0.55, ease }}
              className="text-2xl md:text-6xl font-medium tracking-[-0.035em] leading-none text-fg"
            >
              {project.name}
            </motion.h3>
            <motion.p
              animate={{ opacity: hovered ? 0.95 : 1, x: hovered ? 6 : 0 }}
              transition={{ duration: 0.55, ease }}
              className="mt-2 md:mt-3 text-sm md:text-base text-fg-soft max-w-[28ch] md:max-w-[40ch]"
            >
              {project.tagline}
            </motion.p>

            {/* mobile thumbnail */}
            {project.previewImage && (
              <div className="mt-4 md:hidden relative h-32 w-full overflow-hidden rounded-md border border-line">
                <Image
                  src={project.previewImage}
                  alt={project.name}
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* status + year */}
          <div className="col-span-12 md:col-span-3 mt-3 md:mt-0 flex flex-wrap items-center gap-x-4 gap-y-1 md:justify-end md:flex-col md:items-end md:gap-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em]">
            <motion.span
              animate={{
                scale: hovered ? 1.04 : 1,
                rotate: hovered ? -1.5 : 0,
              }}
              transition={{ duration: 0.5, ease }}
              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 transition-colors duration-300 ${
                hovered
                  ? "border-accent/40 bg-bg-soft"
                  : "border-line bg-bg-soft/50"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${statusDot[project.status]} ${
                  project.status === "for-sale" ? "animate-pulse" : ""
                }`}
              />
              <span className={statusText[project.status]}>
                {project.statusLabel}
              </span>
            </motion.span>
            <span className="tabular text-fg-soft">{project.year}</span>
          </div>

          {/* arrow — points up-right toward the modal that slides in. Was a
           *  rotating "+" when the row was an accordion; now that click means
           *  "open as overlay" the arrow shape reads as "elsewhere." */}
          <div className="col-span-12 md:col-span-1 hidden md:flex md:justify-end">
            <motion.span
              animate={{
                scale: hovered ? 1.08 : 1,
              }}
              transition={{ duration: 0.45, ease }}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300 ${
                hovered
                  ? "border-accent text-accent bg-bg-soft"
                  : "border-line text-fg-soft"
              }`}
              aria-hidden
            >
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                animate={{
                  x: hovered ? 1 : 0,
                  y: hovered ? -1 : 0,
                }}
                transition={{ duration: 0.45, ease }}
              >
                <path
                  d="M4 10L10 4M10 4H5M10 4V9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="square"
                />
              </motion.svg>
            </motion.span>
          </div>
        </div>

        {/* Bottom "open case" mini-marquee, only on hover */}
        <motion.div
          aria-hidden
          initial={false}
          animate={{
            opacity: hovered ? 1 : 0,
            y: hovered ? 0 : 8,
          }}
          transition={{ duration: 0.4, ease }}
          className="pointer-events-none absolute bottom-3 left-12 right-12 hidden md:block overflow-hidden"
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            ↳ open case study · open case study · open case study
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
