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
  { kind: "route", href: "/now", label: "/now" },
  { kind: "route", href: "/life", label: "/life" },
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

  const showTagline = pathname === "/life" ? false : (pathname !== "/" || activeSection === "top");

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
          const isLife = item.label === "/life";
          
          if (isLife) {
            return (
              <Link key={item.label} href="/life" data-cursor="hover" className="-my-[6px] -mr-[6px]">
                <div className={`
                  relative group flex items-center justify-center py-[16px] w-[114px] rounded-full
                  bg-white/[0.03]
                  backdrop-blur-2xl backdrop-saturate-150
                  border border-white/[0.12] border-t-white/[0.22]
                  shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
                  overflow-hidden transition-all duration-500
                `}>
                  {/* 4-Color Vertical Grid with sequential entrance and reverse sequential exit */}
                  <div className="absolute inset-0 flex overflow-hidden rounded-full">
                    <div className={`flex-1 h-full bg-[#EAF64B] origin-left transition-transform duration-[75ms] ease-linear ${active ? 'scale-x-[1.03]' : 'scale-x-0 group-hover:scale-x-[1.03] delay-[225ms] group-hover:delay-[0ms]'}`} />
                    <div className={`flex-1 h-full bg-[#87C34B] origin-left transition-transform duration-[75ms] ease-linear ${active ? 'scale-x-[1.03]' : 'scale-x-0 group-hover:scale-x-[1.03] delay-[150ms] group-hover:delay-[75ms]'}`} />
                    <div className={`flex-1 h-full bg-[#62A637] origin-left transition-transform duration-[75ms] ease-linear ${active ? 'scale-x-[1.03]' : 'scale-x-0 group-hover:scale-x-[1.03] delay-[75ms] group-hover:delay-[150ms]'}`} />
                    <div className={`flex-1 h-full bg-[#42923C] origin-left transition-transform duration-[75ms] ease-linear ${active ? 'scale-x-[1.03]' : 'scale-x-0 group-hover:scale-x-[1.03] delay-[0ms] group-hover:delay-[225ms]'}`} />
                  </div>
                  
                  {/* Subtle inner glass overlay to maintain premium feel */}
                  <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ring-1 ring-inset ring-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] pointer-events-none ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                  
                  {/* Content */}
                  <span className={`relative z-10 flex items-center text-[13px] font-bold tracking-[0.4em] transition-colors duration-300 ml-[0.2em] ${active ? 'text-black drop-shadow-none' : 'text-white group-hover:text-black drop-shadow-sm group-hover:drop-shadow-none'}`}>
                    /life
                  </span>
                </div>
              </Link>
            );
          }

          const isHome = item.label === "home";
          const isNow = item.label === "/now";
          
          const labelEl = (
            <span
              className={`relative z-10 px-5 py-2.5 transition-colors duration-200 ${
                isHome 
                  ? "text-bg" 
                  : active 
                    ? "text-accent" 
                    : "text-fg-soft group-hover:text-fg"
              }`}
            >
              {item.label}
            </span>
          );
          
          const activePill = isHome && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-accent"
            />
          );
          
          const commonProps = {
            "data-cursor": "hover" as const,
            className: `group relative inline-flex items-center justify-center rounded-full ${isHome ? "w-[108px]" : ""}`,
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
