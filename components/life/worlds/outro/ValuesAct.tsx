"use client";

/**
 * CORE VALUES. The camera goes in close on five real minutiae of the print and
 * each one is labelled with the value it acts out. The ring and leader are
 * pinned to print coordinates through the rig, so they cannot drift off the ridge.
 */
import { useEffect, useMemo, useRef } from "react";
import { easeOutCubic, range, smoothstep } from "@/components/life/multiverse/ease";
import { alpha, RISO } from "@/components/life/multiverse/palette";
import { useStage, useTicker } from "@/components/life/multiverse/runtime";
import { BEAT, valueSlot } from "./beats";
import { printToStage } from "./camera";
import { VALUES } from "./copy";
import { CX, CY, MINUTIAE } from "./field";
import { fade, place, windowed } from "./fx";
import { BIG, CAP, EM, MONO, SERIF, desk, isStacked, phone } from "./layout";
import type { Rig } from "./rig";

export function ValuesAct({ rig }: { rig: Rig }) {
  const stage = useStage();
  const W = stage.width;
  const H = stage.height;
  const stacked = isStacked(W, H);
  const k = stacked ? phone(W, H) : desk(W, H);

  const g = useMemo(() => {
    const left = stacked ? 20 : W * 0.552;
    const width = stacked ? W - 40 : Math.min(W * 0.4, W - left - Math.max(36, W * 0.05));
    const maxSize = (stacked ? 84 : 156) * k;
    const sizes = VALUES.map((v) => Math.min(maxSize, (width * (stacked ? 1 : 0.985)) / (EM[v.name] ?? 4)));
    const wordTop = stacked ? H * 0.56 : H * 0.53 - 58 * k;
    const headTop = wordTop - (stacked ? 44 : 66) * k;
    const leaderY = stacked ? headTop - 10 * k : H * 0.53;
    return { left, width, sizes, headTop, wordTop, leaderY };
  }, [W, H, stacked, k]);

  const scrim = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const pips = useRef<(HTMLSpanElement | null)[]>([]);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const ring = useRef<SVGGElement>(null);
  const leader = useRef<SVGPathElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLDivElement>(null);
  const dash = useRef<SVGCircleElement>(null);

  // the outer reticle turns slowly while a callout is up
  useTicker((t) => {
    if (ring.current?.style.visibility === "visible") dash.current?.setAttribute("transform", `rotate(${((t * 14) % 360).toFixed(1)})`);
  });

  useEffect(
    () =>
      rig.subscribe(windowed(BEAT.toValues[0] - 0.02, BEAT.values[1] + 0.02, (p, f) => {
        const [va, vb] = BEAT.values;
        const on = smoothstep(range(p, va - 0.01, va + 0.002)) * (1 - smoothstep(range(p, vb - 0.002, vb + 0.012)));
        fade(scrim.current, on);
        place(head.current, on, `translate3d(0, ${((1 - on) * 12 * k).toFixed(1)}px, 0)`);

        let active = 0;
        while (active < 4 && p >= valueSlot(active + 1)[0]) active++;

        VALUES.forEach((_, i) => {
          const [a, b] = valueSlot(i);
          const w = b - a;
          const inA = i === 0 ? a - 0.004 : a + w * 0.06;
          const inB = i === 0 ? a + 0.008 : a + w * 0.24;
          const outA = i === 4 ? vb - 0.002 : b - w * 0.02;
          const outB = i === 4 ? vb + 0.01 : b + w * 0.05;
          const inT = smoothstep(range(p, inA, inB));
          const outT = smoothstep(range(p, outA, outB));
          place(cards.current[i], inT * (1 - outT), `translate3d(0, ${(((1 - inT) * 34 - outT * 26) * k).toFixed(1)}px, 0)`);
          const pip = pips.current[i];
          if (pip) pip.style.background = i === active ? RISO.pink : alpha(RISO.paper, 0.26);
        });

        // on the way in, the whorl itself gets named
        const coreOn = smoothstep(range(p, BEAT.toValues[0] - 0.002, BEAT.toValues[0] + 0.01)) * (1 - smoothstep(range(p, BEAT.toValues[1] - 0.004, BEAT.toValues[1] + 0.008)));
        const [cx, cy] = printToStage(f, W, H, CX, CY);
        place(core.current, coreOn, `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0) translate(-50%, -50%)`);

        // the callout rides the minutia while the camera moves
        const v = VALUES[active];
        const m = MINUTIAE[v.kind];
        const [a, b] = valueSlot(active);
        const w = b - a;
        const arrive = active === 0 ? smoothstep(range(p, BEAT.toValues[1] - 0.008, BEAT.toValues[1] + 0.004)) : smoothstep(range(p, a + w * 0.26, a + w * 0.4));
        const leave = active === 4 ? smoothstep(range(p, vb - 0.004, vb + 0.006)) : smoothstep(range(p, b - w * 0.04, b));
        const o = arrive * (1 - leave);
        const [sx, sy] = printToStage(f, W, H, m.x, m.y);
        const scale = 0.72 + 0.28 * easeOutCubic(arrive);
        if (ring.current) {
          ring.current.style.visibility = o > 0.004 ? "visible" : "hidden";
          if (o > 0.004) {
            ring.current.style.opacity = o.toFixed(3);
            ring.current.setAttribute("transform", `translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${scale.toFixed(3)})`);
          }
        }
        if (leader.current) {
          leader.current.style.visibility = o > 0.004 ? "visible" : "hidden";
          if (o > 0.004) {
            const R = 44 * k;
            const ex = stacked ? W / 2 : g.left - 18 * k;
            const ey = g.leaderY;
            leader.current.setAttribute("d", stacked ? `M${sx.toFixed(1)} ${(sy + R).toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}` : `M${(sx + R).toFixed(1)} ${sy.toFixed(1)}C${(sx + R + (ex - sx - R) * 0.4).toFixed(1)} ${sy.toFixed(1)} ${(sx + R + (ex - sx - R) * 0.6).toFixed(1)} ${ey.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
            leader.current.style.strokeDasharray = `${easeOutCubic(arrive).toFixed(3)} 1`;
            leader.current.style.opacity = o.toFixed(3);
          }
        }
        place(tag.current, o, stacked ? `translate3d(${sx.toFixed(1)}px, ${(sy - 62 * k).toFixed(1)}px, 0) translateX(-50%)` : `translate3d(${sx.toFixed(1)}px, ${(sy - 68 * k).toFixed(1)}px, 0) translateX(-50%)`);
        if (tag.current) tag.current.textContent = `${v.minutia} · ${String(active + 1).padStart(2, "0")}`;
      })),
    [rig, W, H, stacked, k, g],
  );

  const rRing = 44 * k;

  return (
    <>
      <div
        ref={scrim}
        aria-hidden
        className="pointer-events-none absolute"
        style={
          stacked
            ? { left: 0, right: 0, top: H * 0.44, bottom: 0, background: `linear-gradient(180deg, ${alpha(RISO.ink, 0)}, ${alpha(RISO.ink, 0.9)} 13%, ${alpha(RISO.ink, 0.96)})`, visibility: "hidden" }
            : { top: 0, bottom: 0, left: W * 0.44, right: 0, background: `linear-gradient(90deg, ${alpha(RISO.ink, 0)}, ${alpha(RISO.ink, 0.86)} 22%, ${alpha(RISO.ink, 0.94)})`, visibility: "hidden" }
        }
      />

      <svg aria-hidden className="pointer-events-none absolute inset-0" width={W} height={H} style={{ overflow: "visible" }}>
        <path ref={leader} pathLength={1} fill="none" stroke={RISO.pink} strokeWidth={Math.max(1.5, 2 * k)} style={{ visibility: "hidden" }} />
        <g ref={ring} fill="none" stroke={RISO.pink} style={{ visibility: "hidden" }}>
          <circle r={rRing} strokeWidth={Math.max(2, 2.6 * k)} />
          <circle ref={dash} r={rRing + 9 * k} strokeWidth={Math.max(1, 1.2 * k)} strokeDasharray={`${3 * k} ${5 * k}`} />
          <circle r={Math.max(2.5, 3.2 * k)} fill={RISO.pink} stroke="none" />
        </g>
      </svg>
      <div
        ref={tag}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 whitespace-nowrap"
        style={{ ...MONO, fontSize: Math.max(10, 11.5 * k), color: RISO.paper, background: RISO.ink, padding: `${3 * k}px ${8 * k}px`, border: `1px solid ${RISO.pink}`, visibility: "hidden" }}
      />

      {/* the whorl's own label */}
      <div ref={core} aria-hidden className="pointer-events-none absolute left-0 top-0 grid place-items-center" style={{ width: 92 * k, height: 92 * k, borderRadius: "50%", border: `${Math.max(2, 2.4 * k)}px solid ${RISO.pink}`, visibility: "hidden" }}>
        <span style={{ ...MONO, fontSize: Math.max(10, 11.5 * k), color: RISO.paper, background: RISO.ink, padding: `${2 * k}px ${5 * k}px`, whiteSpace: "nowrap" }}>Core</span>
      </div>

      <div ref={head} className="pointer-events-none absolute" style={{ left: g.left, width: g.width, top: g.headTop, visibility: "hidden" }}>
        <div className="flex items-center" style={{ gap: 14 * k }}>
          <h3 style={{ ...BIG, fontSize: (stacked ? 30 : 42) * k, lineHeight: 1, margin: 0, color: RISO.paper, letterSpacing: "0.02em" }}>CORE VALUES</h3>
          <span className="flex" style={{ gap: 5 * k }} aria-hidden>
            {VALUES.map((v, i) => (
              <span
                key={v.kind}
                ref={(el) => {
                  pips.current[i] = el;
                }}
                style={{ width: (stacked ? 18 : 24) * k, height: 4 * k, borderRadius: 2, background: alpha(RISO.paper, 0.26) }}
              />
            ))}
          </span>
        </div>
      </div>

      <ul className="m-0 list-none p-0">
        {VALUES.map((v, i) => {
          const s = g.sizes[i];
          const top = g.wordTop;
          return (
            <li
              key={v.kind}
              ref={(el) => {
                cards.current[i] = el;
              }}
              className="pointer-events-none absolute"
              style={{ left: g.left, width: g.width, top: 0, visibility: "hidden", willChange: "transform, opacity" }}
            >
              <div style={{ position: "absolute", top: top - 6, left: 0, right: 0 }}>
                <div style={{ ...BIG, fontSize: s, lineHeight: `${CAP * s}px`, color: RISO.sun, whiteSpace: "nowrap" }}>{v.name}</div>
                <p style={{ ...SERIF, margin: `${(stacked ? 22 : 34) * k}px 0 0`, fontSize: (stacked ? 31 : 46) * k, lineHeight: 1.08, color: RISO.paper, maxWidth: g.width * 0.96 }}>{v.line}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
