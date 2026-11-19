"use client";

/**
 * The Life multiverse — every world after the hero, played as one scroll film.
 *
 * One tall section, one sticky stage. Scroll position (from Lenis) becomes a
 * global time `u` measured in stage heights. Each world owns a segment of `u`
 * (its own timeline), followed by a portal dive into the next world:
 *
 *   [ world i: progress 0 → 1 ][ dive: next world's icon grows out of i ][ world i+1 … ]
 *
 * During a dive the next world is already live (at progress 0 = its title
 * card) inside an icon-shaped CSS mask that grows until its largest inscribed
 * circle covers the stage, while the outgoing world drifts toward the viewer
 * and dims. Only the current world and its neighbours are mounted.
 *
 * The section overlaps the hero (negative margin) so its stage sticks the
 * moment the hero has finished typing "Here's the gist of it.". The first
 * segment ("bridge") is transparent: the hero's own frame stays pinned
 * underneath it, so the line is never drawn twice, and the first portal opens
 * out of its full stop.
 *
 * With prefers-reduced-motion the film is replaced by each world's Static
 * composition in normal document flow.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { useLenis } from "lenis/react";
import { WORLDS } from "@/components/life/worlds/registry";
import { FONT_VARIABLES } from "./fonts";
import { RISO } from "./palette";
import { applyPortalStyles, portalFrame, readOrigin, type PortalOrigin } from "./portal";
import { StageProvider, WorldProvider, useIsoLayoutEffect, type Stage, type WorldRuntime } from "./runtime";
import { WorldHUD } from "./WorldHUD";
import { WorldBoundary } from "./WorldBoundary";
import { clamp, range } from "./ease";
import type { Presence } from "./types";

/** Length of every portal dive, in stage heights. */
const DIVE = 1;

/**
 * LifeHero's section is 440vh: 200vh of animation, its 100vh stage, and this
 * much more during which its final frame stays pinned under the film's bridge
 * and first dive (≥ 0.3 + 1 stage heights). Keep in sync with LifeHero's h-[440vh].
 */
const HERO_HOLD_VH = 140;

const METAS = WORLDS.map((w) => w.meta);

const { SEGS, TOTAL } = (() => {
  const segs: { start: number; end: number; exitEnd: number }[] = [];
  let t = 0;
  WORLDS.forEach((w, i) => {
    const start = t;
    const end = start + w.meta.length;
    const exitEnd = end + (i < WORLDS.length - 1 ? DIVE : 0);
    segs.push({ start, end, exitEnd });
    t = exitEnd;
  });
  return { SEGS: segs, TOTAL: t };
})();

function worldAt(u: number) {
  for (let i = 0; i < SEGS.length; i++) if (u < SEGS[i].exitEnd) return i;
  return SEGS.length - 1;
}

/** How far into a dive the HUD starts naming the incoming world. */
const HUD_SWAP = 0.55;

/** The world the HUD should name at time `u`: it changes once the portal has mostly opened. */
function hudAt(u: number) {
  const c = worldAt(Math.max(0, u));
  const last = c === SEGS.length - 1;
  return !last && range(u, SEGS[c].end, SEGS[c].exitEnd) > HUD_SWAP ? c + 1 : c;
}

type Phase = { c: number; diving: boolean; hud: number };

function presenceOf(i: number, { c, diving }: Phase): Presence | null {
  if (i === c) return "current";
  if (i === c + 1) return diving ? "entering" : "next";
  if (i === c - 1) return "previous";
  return null;
}

type Origin = PortalOrigin & { c: number };

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void) {
  const m = window.matchMedia(REDUCED_QUERY);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

/**
 * prefers-reduced-motion without a hydration mismatch: the server and the
 * hydrating client both render the film, then the client switches.
 */
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false);
}

export function Multiverse() {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <StaticMultiverse />;
  return <Film />;
}

function Film() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dimRefs = useRef<(HTMLDivElement | null)[]>([]);
  const originRefs = useMemo(() => WORLDS.map(() => ({ current: null as HTMLElement | null })), []);
  const originCache = useRef<Origin | null>(null);
  const originRetry = useRef(0);
  const applyRef = useRef<(v: number) => void>(() => {});

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [lowPower, setLowPower] = useState(false);
  const [phase, setPhase] = useState<Phase>({ c: 0, diving: false, hud: 0 });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const u = useMotionValue(-1);

  // --- stage size = the scroll container's viewport (inside the site frame)
  useEffect(() => {
    const container = document.getElementById("scroll-container");
    containerRef.current = container;
    if (!container) return;
    const read = () => setSize({ w: container.clientWidth, h: container.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(container);
    const nav = navigator as Navigator & { deviceMemory?: number };
    setLowPower((nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4);
    return () => ro.disconnect();
  }, []);

  // --- scroll → u
  const measure = useCallback(() => {
    const s = sectionRef.current;
    const c = containerRef.current;
    if (!s || !c || !size.h) return;
    const scrolled = c.getBoundingClientRect().top - s.getBoundingClientRect().top;
    u.set(clamp(scrolled / size.h, -1, TOTAL));
  }, [size.h, u]);

  useLenis(measure, [measure]);
  useEffect(() => {
    measure();
    originCache.current = null;
  }, [measure, size.w]);

  // --- per-frame: visibility, portal mask, outgoing depth
  const apply = useCallback(
    (v: number) => {
      const stageEl = stageRef.current;
      const section = sectionRef.current;
      if (!stageEl || !section || !size.h) return;

      const live = v >= -0.0015;
      stageEl.style.visibility = live ? "visible" : "hidden";
      section.style.pointerEvents = live ? "" : "none";

      const c = worldAt(Math.max(0, v));
      const last = c === SEGS.length - 1;
      const eRaw = last ? 0 : range(v, SEGS[c].end, SEGS[c].exitEnd);
      const diving = eRaw > 0;
      const hud = hudAt(v);
      if (c !== phaseRef.current.c || diving !== phaseRef.current.diving || hud !== phaseRef.current.hud) {
        phaseRef.current = { c, diving, hud };
        setPhase({ c, diving, hud });
      }

      // reset every mounted layer, then style the two that matter
      for (let i = Math.max(0, c - 1); i <= Math.min(SEGS.length - 1, c + 1); i++) {
        const layer = layerRefs.current[i];
        if (!layer) continue;
        const shown = i === c || (i === c + 1 && diving);
        layer.style.visibility = shown ? "visible" : "hidden";
        // A world's own element can set visibility:visible, which would show
        // straight through a hidden layer. Opacity can't be overridden from inside.
        layer.style.opacity = shown ? "1" : "0";
        if (i !== c + 1 || !diving) {
          layer.style.removeProperty("mask-image");
          layer.style.removeProperty("-webkit-mask-image");
          if (i !== c) layer.style.transform = "";
        }
        const inner = innerRefs.current[i];
        if (inner && (i !== c + 1 || !diving)) inner.style.transform = "";
        const dim = dimRefs.current[i];
        if (dim && (i !== c || !diving)) dim.style.opacity = "0";
      }

      const out = layerRefs.current[c];
      if (!diving) {
        if (out) out.style.transform = "";
        originCache.current = null;
        return;
      }

      const incoming = layerRefs.current[c + 1];
      const inner = innerRefs.current[c + 1];
      const iconId = METAS[c + 1].icon;
      if (!incoming || !inner || !iconId) return;

      // Where the portal is born: the outgoing world's registered origin, read once per dive.
      // A world still loading (a deep link straight into a dive) hasn't registered one yet:
      // use the stage centre until it does, then measure it with the world unscaled.
      let o = originCache.current;
      if (!o || o.c !== c) {
        const el = originRefs[c].current;
        if (el && out) out.style.transform = "";
        o = { c, ...readOrigin(el, stageEl, iconId, size.w, size.h) };
        originCache.current = el ? o : null;
        // look again shortly, even if the viewer isn't scrolling
        if (!el && !originRetry.current) {
          originRetry.current = window.setTimeout(() => {
            originRetry.current = 0;
            applyRef.current(u.get());
          }, 200);
        }
      }
      const f = portalFrame(eRaw, iconId, o, size.w, size.h);
      applyPortalStyles(incoming, inner, out, dimRefs.current[c], iconId, f, o);
    },
    [originRefs, size.h, size.w, u],
  );
  useIsoLayoutEffect(() => {
    applyRef.current = apply;
  }, [apply]);
  useEffect(() => () => window.clearTimeout(originRetry.current), []);

  useMotionValueEvent(u, "change", apply);
  // re-apply after layers mount/unmount or the stage resizes
  useIsoLayoutEffect(() => {
    apply(u.get());
  }, [phase, apply, u]);

  // --- HUD
  const hudProgress = useTransform(u, (v) => {
    const i = hudAt(v);
    return range(v, SEGS[i].start, SEGS[i].exitEnd);
  });

  const lenis = useLenis();
  const jump = useCallback(
    (i: number) => {
      const s = sectionRef.current;
      const c = containerRef.current;
      const curtain = curtainRef.current;
      if (!s || !c || !lenis) return;
      const top = c.scrollTop + s.getBoundingClientRect().top - c.getBoundingClientRect().top;
      const target = top + SEGS[i].start * size.h + 2;
      if (curtain) curtain.style.opacity = "1";
      window.setTimeout(() => {
        lenis.scrollTo(target, { immediate: true, force: true });
        window.setTimeout(() => {
          if (curtain) curtain.style.opacity = "0";
        }, 120);
      }, 260);
    },
    [lenis, size.h],
  );

  const stage = useMemo<Stage>(
    () => ({
      width: size.w,
      height: size.h,
      isMobile: size.w > 0 && size.w < 768,
      lowPower: lowPower || (size.w > 0 && size.w < 768),
      reduced: false,
      ref: stageRef,
    }),
    [size.w, size.h, lowPower],
  );

  // Overlap the hero so the film begins (u = 0) the moment it finishes typing
  // (200vh in); the hero stays pinned underneath until the first dive covers the stage.
  const sectionStyle = {
    "--stage-h": size.h ? `${size.h}px` : "100vh",
    height: `calc(var(--stage-h) * ${TOTAL + 1})`,
    marginTop: `-${100 + HERO_HOLD_VH}vh`,
  } as React.CSSProperties;

  return (
    <section
      ref={sectionRef}
      aria-label="The life of Josh, one world at a time"
      className={`relative z-[60] ${FONT_VARIABLES}`}
      style={sectionStyle}
    >
      <div ref={stageRef} className="invisible sticky top-0 w-full overflow-hidden" style={{ height: "var(--stage-h)" }}>
        {size.h > 0 && (
          <StageProvider value={stage}>
            {WORLDS.map((w, i) => {
              const presence = presenceOf(i, phase);
              if (!presence) return null;
              return (
                <WorldLayer
                  key={w.meta.id}
                  index={i}
                  presence={presence}
                  u={u}
                  originRef={originRefs[i]}
                  layerRef={(el) => {
                    layerRefs.current[i] = el;
                  }}
                  innerRef={(el) => {
                    innerRefs.current[i] = el;
                  }}
                  dimRef={(el) => {
                    dimRefs.current[i] = el;
                  }}
                />
              );
            })}
          </StageProvider>
        )}

        <WorldHUD meta={METAS[phase.hud]} worlds={METAS} progress={hudProgress} visible={phase.hud > 0} onJump={jump} />

        <div
          ref={curtainRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[90] opacity-0 transition-opacity duration-200"
          style={{ background: RISO.ink }}
        />
      </div>
    </section>
  );
}

const WorldLayer = memo(function WorldLayer({
  index,
  presence,
  u,
  originRef,
  layerRef,
  innerRef,
  dimRef,
}: {
  index: number;
  presence: Presence;
  u: MotionValue<number>;
  originRef: RefObject<HTMLElement | null>;
  layerRef: (el: HTMLDivElement | null) => void;
  innerRef: (el: HTMLDivElement | null) => void;
  dimRef: (el: HTMLDivElement | null) => void;
}) {
  const { meta, World } = WORLDS[index];
  const seg = SEGS[index];
  const progress = useTransform(u, (v) => clamp((v - seg.start) / meta.length));
  const runtime = useMemo<WorldRuntime>(
    () => ({
      meta,
      presence,
      running: presence === "current" || presence === "entering",
      active: presence === "current",
      originRef,
    }),
    [meta, presence, originRef],
  );
  const interactive = presence === "current";

  return (
    <div
      ref={layerRef}
      data-world={meta.id}
      aria-hidden={interactive ? undefined : true}
      inert={!interactive}
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: index + 1, background: meta.bg, visibility: "hidden", opacity: 0, willChange: "transform" }}
    >
      <div ref={innerRef} className="absolute inset-0">
        <WorldProvider value={runtime}>
          <WorldBoundary meta={meta}>
            <World progress={progress} />
          </WorldBoundary>
        </WorldProvider>
      </div>
      <div ref={dimRef} aria-hidden className="pointer-events-none absolute inset-0" style={{ background: RISO.ink, opacity: 0 }} />
    </div>
  );
});

function StaticMultiverse() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    // the same box the film uses: the scroll container's viewport inside the site frame
    const container = document.getElementById("scroll-container");
    const read = () =>
      setSize({ w: container?.clientWidth || window.innerWidth, h: container?.clientHeight || window.innerHeight });
    read();
    const ro = container ? new ResizeObserver(read) : null;
    if (container) ro?.observe(container);
    window.addEventListener("resize", read);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);
  const stage = useMemo<Stage>(
    () => ({ width: size.w, height: size.h, isMobile: size.w < 768, lowPower: true, reduced: true, ref }),
    [size.w, size.h],
  );
  return (
    // no film to pin the hero under: start where the hero's animation ends, sliding over its held frame
    <div ref={ref} className={`relative z-[60] ${FONT_VARIABLES}`} style={{ marginTop: `-${HERO_HOLD_VH}vh` }}>
      <StageProvider value={stage}>
        {WORLDS.filter((w) => w.meta.id !== "bridge").map(({ meta, Static }) => (
          <section key={meta.id} aria-label={`${meta.label}: ${meta.title}`} className="relative" style={{ background: meta.bg }}>
            <WorldBoundary meta={meta} flow>
              <Static />
            </WorldBoundary>
          </section>
        ))}
      </StageProvider>
    </div>
  );
}
