"use client";

/**
 * Dev-only harness: one world on a stage-sized canvas, outside the film.
 *
 * Two entry points:
 *  - `WorldLab` (registry-backed, /life/lab?world=<id>) — any world, real neighbours.
 *  - `SingleWorldLab` (/life/lab/<id>) — imports ONE world only, so a broken
 *    world never breaks another world's lab while they are built in parallel.
 *
 * Query params (both):
 *   (none)       scrub with the slider or ←/→ keys
 *   p=0.42       frozen at a progress (screenshots)
 *   dive=0.5     frozen halfway through this world's exit portal
 *   reduced=1    render the Static (reduced-motion) composition
 */

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useMotionValue } from "framer-motion";
import { WORLDS } from "@/components/life/worlds/registry";
import { FONT_VARIABLES } from "./fonts";
import { applyPortalStyles, portalFrame, readOrigin } from "./portal";
import { StageProvider, WorldProvider, useIsoLayoutEffect, type Stage, type WorldRuntime } from "./runtime";
import { RISO } from "./palette";
import type { PortalIconId } from "./portalIcons";
import type { Presence, WorldModule, WorldProps } from "./types";

type Next = { icon: PortalIconId; bg: string; World: ComponentType<WorldProps> | null; module?: WorldModule };

/** Registry-backed lab: /life/lab?world=<id> */
export function WorldLab() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(new URLSearchParams(window.location.search).get("world") ?? "anchoring"), []);
  if (!id) return <div className="h-screen bg-bg" />;
  const index = Math.max(0, WORLDS.findIndex((w) => w.meta.id === id));
  const nextMod = WORLDS[index + 1];
  const next: Next | null = nextMod?.meta.icon ? { icon: nextMod.meta.icon, bg: nextMod.meta.bg, World: nextMod.World, module: nextMod } : null;
  return <LabShell module={WORLDS[index]} next={next} />;
}

/** Isolated lab for one world. `nextIcon`/`nextBg` describe the world it exits into. */
export function SingleWorldLab({ module, nextIcon, nextBg }: { module: WorldModule; nextIcon: PortalIconId | null; nextBg: string }) {
  return <LabShell module={module} next={nextIcon ? { icon: nextIcon, bg: nextBg, World: null } : null} />;
}

function LabShell({ module, next }: { module: WorldModule; next: Next | null }) {
  const [params, setParams] = useState<{ p: number | null; dive: number | null; reduced: boolean } | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const num = (k: string) => (q.get(k) === null ? null : Math.max(0, Math.min(1, Number(q.get(k)))));
    setParams({ p: num("p"), dive: num("dive"), reduced: q.get("reduced") === "1" });
    const container = document.getElementById("scroll-container");
    const read = () => setSize({ w: container?.clientWidth ?? window.innerWidth, h: container?.clientHeight ?? window.innerHeight });
    read();
    window.addEventListener("resize", read);
    return () => window.removeEventListener("resize", read);
  }, []);

  const reduced = params?.reduced ?? false;
  const stage = useMemo<Stage>(
    () => ({ width: size.w, height: size.h, isMobile: size.w > 0 && size.w < 768, lowPower: size.w > 0 && size.w < 768, reduced, ref: stageRef }),
    [size.w, size.h, reduced],
  );

  if (!params || !size.h) return <div className="h-screen bg-bg" />;

  if (reduced) {
    const { Static, meta } = module;
    return (
      <div className={FONT_VARIABLES} style={{ background: meta.bg }}>
        <StageProvider value={stage}>
          <Static />
        </StageProvider>
      </div>
    );
  }

  return (
    <div className={FONT_VARIABLES}>
      <div ref={stageRef} className="relative w-full overflow-hidden" style={{ height: size.h }}>
        <StageProvider value={stage}>
          {params.dive !== null && next ? (
            <DivePreview module={module} next={next} t={params.dive} />
          ) : (
            <Scrubbed module={module} fixed={params.p} />
          )}
        </StageProvider>
      </div>
    </div>
  );
}

function useRuntime(module: WorldModule, presence: Presence) {
  const originRef = useRef<HTMLElement | null>(null);
  return useMemo<WorldRuntime>(
    () => ({
      meta: module.meta,
      presence,
      running: presence === "current" || presence === "entering",
      active: presence === "current",
      originRef,
    }),
    [module.meta, presence],
  );
}

function Scrubbed({ module, fixed }: { module: WorldModule; fixed: number | null }) {
  const { World, meta } = module;
  const progress = useMotionValue(fixed ?? 0);
  const [value, setValue] = useState(fixed ?? 0);
  const runtime = useRuntime(module, "current");

  useEffect(() => {
    progress.set(value);
  }, [value, progress]);

  useEffect(() => {
    if (fixed !== null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setValue((v) => Math.min(1, v + 0.01));
      if (e.key === "ArrowLeft") setValue((v) => Math.max(0, v - 0.01));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [fixed]);

  return (
    <>
      <div className="absolute inset-0 overflow-hidden" style={{ background: meta.bg }}>
        <WorldProvider value={runtime}>
          <World progress={progress} />
        </WorldProvider>
      </div>
      {fixed === null && (
        <div
          className="absolute inset-x-4 bottom-4 z-[100] flex items-center gap-3 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-widest md:inset-x-auto md:left-1/2 md:w-[560px] md:-translate-x-1/2"
          style={{ background: RISO.ink, color: RISO.paper }}
          data-lenis-prevent
          data-swipe-ignore
        >
          <span className="w-24 shrink-0">{meta.id}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="flex-1"
            aria-label="World progress"
          />
          <span className="w-12 text-right tabular-nums">{value.toFixed(3)}</span>
        </div>
      )}
    </>
  );
}

function NextStandIn({ bg }: { bg: string }) {
  const dark = bg === RISO.ink || bg === RISO.cobalt;
  return (
    <div className="absolute inset-0 grid place-items-center font-mono text-xs uppercase tracking-[0.3em]" style={{ color: dark ? RISO.paper : RISO.ink }}>
      next world
    </div>
  );
}

function DivePreview({ module, next, t }: { module: WorldModule; next: Next; t: number }) {
  const outProgress = useMotionValue(1);
  const inProgress = useMotionValue(0);
  const outRt = useRuntime(module, "current");
  const inRt = useRuntime(next.module ?? module, "entering");
  const outRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  const NextWorld = next.World;

  useIsoLayoutEffect(() => {
    const stage = outRef.current?.parentElement as HTMLDivElement | null;
    if (!stage) return;
    // give the outgoing world a beat to lay out (and register its origin) before measuring
    const id = window.setTimeout(() => {
      if (!inRef.current || !innerRef.current) return;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const origin = readOrigin(outRt.originRef.current, stage, next.icon, w, h);
      applyPortalStyles(inRef.current, innerRef.current, outRef.current, dimRef.current, next.icon, portalFrame(t, next.icon, origin, w, h), origin);
      inRef.current.style.visibility = "visible";
    }, 600);
    return () => window.clearTimeout(id);
  }, [t]);

  return (
    <>
      <div ref={outRef} className="absolute inset-0 overflow-hidden" style={{ background: module.meta.bg, zIndex: 1 }}>
        <WorldProvider value={outRt}>
          <module.World progress={outProgress} />
        </WorldProvider>
        <div ref={dimRef} className="pointer-events-none absolute inset-0" style={{ background: RISO.ink, opacity: 0 }} />
      </div>
      <div ref={inRef} className="absolute inset-0 overflow-hidden" style={{ background: next.bg, zIndex: 2, visibility: "hidden" }}>
        <div ref={innerRef} className="absolute inset-0">
          {NextWorld && next.module ? (
            <WorldProvider value={inRt}>
              <NextWorld progress={inProgress} />
            </WorldProvider>
          ) : (
            <NextStandIn bg={next.bg} />
          )}
        </div>
      </div>
    </>
  );
}
