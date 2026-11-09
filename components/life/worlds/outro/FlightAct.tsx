"use client";

/**
 * The rewind: rim to core at speed. Each world's name pops for one beat in its
 * own face as the camera crosses its band, under the line that says what this
 * looks like from down here. A thin instrument strip reads out the flight.
 */
import { useEffect, useMemo, useRef } from "react";
import { clamp, easeOutCubic, range, smoothstep } from "@/components/life/multiverse/ease";
import { alpha, mix, RISO } from "@/components/life/multiverse/palette";
import { useStage } from "@/components/life/multiverse/runtime";
import { BANDS } from "./bands";
import { BEAT } from "./beats";
import { levelAtP, pAtLevel } from "./camera";
import { CHAOS } from "./copy";
import { fade, place, windowed } from "./fx";
import { MONO, SERIF, desk, isStacked, phone } from "./layout";
import type { Rig } from "./rig";

/** Rough advance of each face in em per character (for fitting long names on a phone). */
const FACE_EM: Record<string, number> = {
  anchoring: 0.8,
  sports: 0.74,
  rubiks: 0.86,
  social: 0.6,
  mun: 0.74,
  moving: 0.44,
  minecraft: 0.72,
  startups: 0.62,
  fitness: 0.54,
  jee: 0.5,
  hackathons: 0.62,
};

/** Ink outline per face, in em: fat faces can take a heavy one, thin and dotted ones would drown. */
const FACE_STROKE: Record<string, number> = {
  anchoring: 0.1,
  sports: 0.028,
  rubiks: 0.09,
  social: 0.11,
  mun: 0.09,
  moving: 0.05,
  minecraft: 0.085,
  startups: 0.018,
  fitness: 0.06,
  jee: 0.05,
  hackathons: 0.09,
};

export function FlightAct({ rig }: { rig: Rig }) {
  const stage = useStage();
  const W = stage.width;
  const H = stage.height;
  const stacked = isStacked(W, H);
  const k = stacked ? phone(W, H) : desk(W, H);

  const caption = useRef<HTMLParagraphElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const stripBand = useRef<HTMLSpanElement>(null);
  const stripAlt = useRef<HTMLSpanElement>(null);
  const names = useRef<(HTMLDivElement | null)[]>([]);

  // Hackathons (rim) first, Anchoring (core) last
  const pops = useMemo(() => {
    const seq = [...BANDS].map((b, i) => ({ band: b, i })).reverse();
    return seq.map(({ band, i }, n) => {
      const level = i === 0 ? 1.4 : 2 * i + 1.5;
      const at = pAtLevel(level);
      const avail = (stacked ? W * 0.9 : W * 0.5) / (band.name.length * (FACE_EM[band.id] ?? 0.6));
      const size = Math.min((stacked ? 76 : 138) * k, avail);
      const side = stacked ? 0 : n % 2 === 0 ? -1 : 1;
      return { band, at, n, size, side };
    });
  }, [W, stacked, k]);

  useEffect(
    () =>
      rig.subscribe(windowed(BEAT.flight[0] - 0.01, BEAT.crane[0] + 0.09, (p, f) => {
        const [ca, cb] = BEAT.chaos;
        fade(caption.current, smoothstep(range(p, ca, ca + 0.016)) * (1 - smoothstep(range(p, cb, cb + 0.016))));

        const flying = range(p, BEAT.flight[0], BEAT.flight[0] + 0.012) * (1 - range(p, BEAT.crane[0] + 0.05, BEAT.crane[0] + 0.07));
        fade(strip.current, flying * 0.85);
        if (flying > 0) {
          if (stripAlt.current) stripAlt.current.textContent = `ALT ${(f.z * 100).toFixed(2).padStart(6, "0")}   PITCH ${String(Math.round(((f.tilt * 180) / Math.PI) - 90)).padStart(3, " ")}°   FOV ${Math.round(f.fov)}`;
          const crest = levelAtP(p);
          const band = crest >= 21.5 ? 10 : Math.max(0, Math.min(10, Math.floor((crest - 1) / 2)));
          if (stripBand.current) stripBand.current.textContent = `REWIND ${String(band + 1).padStart(2, "0")}/11 ${BANDS[band].name.toUpperCase()}`;
        }

        // one world on screen at a time: each name clears before the next one starts
        for (const pop of pops) {
          const el = names.current[pop.n];
          const next = pops[pop.n + 1];
          const gap = next ? next.at - pop.at : 0.012;
          const riseW = Math.min(0.006, Math.max(0.002, gap * 0.34));
          const rise = pop.at - riseW;
          const fallEnd = next ? next.at - Math.min(0.006, Math.max(0.002, (next === pops.at(-1) ? 0.012 : (pops[pop.n + 2]?.at ?? next.at + 0.012) - next.at) * 0.34)) : pop.at + 0.016;
          const fallStart = Math.max(pop.at, fallEnd - Math.min(0.005, gap * 0.34));
          const r = range(p, rise, pop.at);
          const o = smoothstep(r) * (1 - smoothstep(range(p, fallStart, fallEnd)));
          const s = 0.8 + 0.2 * easeOutCubic(clamp(r));
          const lift = (1 - smoothstep(r)) * 26 * k;
          place(el, o, `translate(-50%, -50%) translateY(${lift.toFixed(1)}px) perspective(${Math.round(900 * k)}px) rotateX(14deg) scale(${s.toFixed(3)})`);
        }
      })),
    [rig, pops, k],
  );

  // every name gets enough paper to stand off its own band, cobalt most of all
  const inkOf = (b: (typeof BANDS)[number]) => mix(b.ink, RISO.paper, b.ink === RISO.cobalt ? 0.42 : 0.2);
  const nameY = stacked ? H * 0.48 : H * 0.56;

  return (
    <>
      <p
        ref={caption}
        className="pointer-events-none absolute text-center"
        style={{
          ...SERIF,
          left: stacked ? 20 : 0,
          right: stacked ? 20 : 0,
          top: stacked ? H * 0.135 : H * 0.158,
          margin: 0,
          fontSize: (stacked ? 40 : 68) * k,
          lineHeight: 1.04,
          color: RISO.paper,
          textShadow: `0 0 26px ${alpha(RISO.ink, 0.9)}`,
          visibility: "hidden",
        }}
      >
        {CHAOS}
      </p>

      {pops.map((pop) => (
        <div
          key={pop.band.id}
          ref={(el) => {
            names.current[pop.n] = el;
          }}
          className="pointer-events-none absolute whitespace-nowrap"
          style={{
            left: stacked ? W / 2 : W / 2 + pop.side * W * 0.2,
            top: nameY,
            fontSize: pop.size,
            lineHeight: 1,
            color: inkOf(pop.band),
            WebkitTextStroke: `${(FACE_STROKE[pop.band.id] ?? 0.08) * pop.size * 2}px ${RISO.ink}`,
            paintOrder: "stroke fill",
            padding: "0.3em 0.7em",
            background: `radial-gradient(closest-side, ${alpha(RISO.ink, 0.72)}, ${alpha(RISO.ink, 0.5)} 60%, ${alpha(RISO.ink, 0)})`,
            visibility: "hidden",
            ...pop.band.face,
          }}
        >
          {pop.band.name}
        </div>
      ))}

      <div
        ref={strip}
        aria-hidden
        className="pointer-events-none absolute flex"
        style={{
          ...MONO,
          left: stacked ? 16 : 28 * k,
          top: stacked ? undefined : H - 104 * k,
          bottom: stacked ? 88 : undefined,
          flexDirection: "column",
          gap: 4,
          fontSize: Math.max(10, 11 * k),
          color: RISO.paper,
          textShadow: `0 0 8px ${alpha(RISO.ink, 0.95)}, 0 0 2px ${alpha(RISO.ink, 0.95)}`,
          whiteSpace: "pre",
          visibility: "hidden",
        }}
      >
        <span ref={stripBand} />
        <span ref={stripAlt} />
      </div>
    </>
  );
}
