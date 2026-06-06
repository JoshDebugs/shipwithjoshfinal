"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLenis } from "lenis/react";

/**
 * The persistent top-center navigation pill.
 *
 * Pattern: rounded chip container, items inline, an accent-filled pill
 * slides between them via framer-motion's `layoutId` to mark the active
 * section. Same pattern Linear / Vercel / Raycast use.
 *
 * Two kinds of items live in here:
 *   - section anchors (home, work, lab, contact) — observe the home page's
 *     section <section id="..."> elements via IntersectionObserver, and on
 *     click smooth-scroll via Lenis. From other routes (/now,
 *     /work/[slug]), clicking a section item navigates to `/#section`.
 *   - route links (/now) — plain Next.js <Link>. Active when pathname
 *     matches.
 *
 * Renders globally inside AppFrame (so it sits above the scroll surface,
 * doesn't move with content) — but only shows on desktop, since the
 * existing layout already deferred this kind of chrome to md+.
 */

type NavItem =
  | { kind: "section"; id: string; label: string }
  | { kind: "route"; href: string; label: string };

const ITEMS: NavItem[] = [
  { kind: "section", id: "top", label: "home" },
  { kind: "section", id: "work", label: "work" },
  { kind: "section", id: "lab", label: "lab" },
  { kind: "section", id: "contact", label: "contact" },
  { kind: "route", href: "/now", label: "/now" },
];

const SECTION_IDS = ITEMS.filter((i) => i.kind === "section").map(
  (i) => (i as { kind: "section"; id: string }).id,
);

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useLenis();
  const [activeSection, setActiveSection] = useState<string>("top");

  // For the tagline entrance animation delay
  const [hasEntered, setHasEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHasEntered(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const showTagline = pathname !== "/" || activeSection === "top";

  // Track which section is in the middle of the scroll viewport. Only
  // wires up when the home page is the current route — on other routes
  // there are no section elements to observe, so the effect bails.
  useEffect(() => {
    if (pathname !== "/") return;
    const root = document.getElementById("scroll-container");
    if (!root) return;

    const targets = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { id: string; ratio: number } | null = null;
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            (best === null || entry.intersectionRatio > best.ratio)
          ) {
            best = { id: entry.target.id, ratio: entry.intersectionRatio };
          }
        }
        if (best) setActiveSection(best.id);
      },
      {
        root,
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const goToSection = (id: string) => {
    // From the home page: smooth-scroll the inner container via Lenis (with
    // native fallback). From any other route: navigate to `/#id`, then the
    // home page mounts and Lenis takes the user the rest of the way.
    if (pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }
    if (id === "top") {
      if (lenis) lenis.scrollTo(0);
      else
        document
          .getElementById("scroll-container")
          ?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el);
    else el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isActive = (item: NavItem) => {
    if (item.kind === "route") return pathname === item.href;
    return pathname === "/" && activeSection === item.id;
  };

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-9 z-40 hidden -translate-x-1/2 flex-col items-center md:flex"
    >
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 3.1, ease: [0.16, 1, 0.3, 1] }}
        aria-label="primary navigation"
        className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-line bg-bg-soft/80 p-1.5 font-mono text-[13px] uppercase tracking-[0.2em] backdrop-blur-md"
      >
        {ITEMS.map((item) => {
          const active = isActive(item);
          const labelEl = (
            <span
              className={`relative z-10 px-5 py-2.5 transition-colors duration-200 ${
                active ? "text-bg" : "text-fg-soft group-hover:text-fg"
              }`}
            >
              {item.label}
            </span>
          );
          const activePill = active && (
            <motion.span
              layoutId="topnav-active-pill"
              aria-hidden
              className="absolute inset-0 rounded-full bg-accent"
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          );
          const commonProps = {
            "data-cursor": "hover" as const,
            className: "group relative inline-flex items-center rounded-full",
            "aria-current": active ? ("page" as const) : undefined,
          };

          if (item.kind === "route") {
            return (
              <Link key={item.label} href={item.href} {...commonProps}>
                {activePill}
                {labelEl}
              </Link>
            );
          }
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => goToSection(item.id)}
              {...commonProps}
            >
              {activePill}
              {labelEl}
            </button>
          );
        })}
      </motion.nav>

      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ 
          opacity: showTagline ? 1 : 0, 
          y: showTagline ? 0 : -4 
        }}
        transition={{ 
          duration: 0.5, 
          delay: (showTagline && !hasEntered) ? 3.4 : 0, 
          ease: [0.16, 1, 0.3, 1] 
        }}
        className="mt-2.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-fg-soft"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        open to roles. picky about them.
      </motion.p>
    </div>
  );
}
