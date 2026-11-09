"use client";

/**
 * The print is whole now. Reticles lock on, the scan head walks down it, the
 * read-out decodes, and the verdict lands in the same ridged type as the
 * question: a stamp with a long settle and one halftone ring. No flash.
 */
import { useEffect, useMemo, useRef } from "react";
import { easeOutCubic, expoOut, range, smoothstep } from "@/components/life/multiverse/ease";
import { alpha, RISO } from "@/components/life/multiverse/palette";
import { useStage } from "@/components/life/multiverse/runtime";
import { BEAT } from "./beats";
import { printToStage } from "./camera";
import { HEADLINE, MATCH } from "./copy";
import { decoded, fade, place } from "./fx";
import { CAP, EM, MONO, desk, isStacked, phone } from "./layout";
import { RidgedText, contours, type RidgedHandle } from "./RidgedText";
import type { Rig } from "./rig";
import { scanYAt } from "./state";

const CORNERS = [
  [-1, 1],
  [1, 1],
  [1, -1],
  [-1, -1],
] as const;

export function RevealAct({ rig }: { rig: Rig }) {
  const stage = useStage();
  const W = stage.width;
  const H = stage.height;
  const stacked = isStacked(W, H);
  const k = stacked ? phone(W, H) : desk(W, H);

  const g = useMemo(() => {
    const maxW = stacked ? W * 0.88 : W * 0.56;
    const widest = Math.max(EM["I KEEP"], EM.TRYING, EM["THINGS."]);
    const size = Math.min(maxW / widest, H * (stacked ? 0.2 : 0.236));
    const lead = size * (CAP + 0.09);
    const y1 = CAP * size;
    const total = y1 + lead * 2;
    const rings = contours(size / 150, RISO.cobalt, RISO.pink);
    return { size, lead, y1, total, blockW: widest * size, rings };
  }, [W, H, stacked]);

  const corners = useRef<(HTMLSpanElement | null)[]>([]);
  const bar = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const hudPct = useRef<HTMLSpanElement>(null);
  const hudMatch = useRef<HTMLSpanElement>(null);
  const stampWrap = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const ridged = useRef<RidgedHandle>(null);

  useEffect(
    () =>
      rig.subscribe((p, f) => {
        const [sa, sb] = BEAT.scan;
        const [hoA, hoB] = BEAT.headlineOut;
        if (p < sa - 0.02 || p > hoB + 0.01) {
          corners.current.forEach((el) => fade(el, 0));
          fade(bar.current, 0);
          fade(hud.current, 0);
          fade(stampWrap.current, 0);
          fade(halo.current, 0);
          return;
        }

        // reticles close in on the print
        const lock = easeOutCubic(range(p, sa - 0.018, sa + 0.006));
        const out = 1 - smoothstep(range(p, BEAT.stamp - 0.004, BEAT.stamp + 0.012));
        const [lx, ty] = printToStage(f, W, H, -0.5, 0.675);
        const [rx, by] = printToStage(f, W, H, 0.5, -0.675);
        const pad = (1 - lock) * 46 * k + 8 * k;
        CORNERS.forEach(([sx, sy], i) => {
          const x = sx < 0 ? lx - pad : rx + pad;
          const y = sy > 0 ? Math.max(22, ty - pad) : Math.min(H - 22, by + pad);
          place(corners.current[i], lock * out, `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${-sx}, ${sy})`);
        });

        // the scan head
        const scanT = range(p, sa, sb);
        const [, y] = printToStage(f, W, H, 0, scanYAt(p));
        place(bar.current, smoothstep(range(scanT, 0, 0.08)) * (1 - smoothstep(range(scanT, 0.92, 1))), `translate3d(0, ${y.toFixed(1)}px, 0)`);

        // read-out
        const tick = Math.floor(p * 3000);
        const decodeT = range(p, sa + (sb - sa) * 0.3, sb - 0.003);
        if (hudPct.current) hudPct.current.textContent = `SCAN ${String(Math.round(scanT * 100)).padStart(3, "0")}%`;
        if (hudMatch.current) hudMatch.current.textContent = decoded(MATCH, decodeT, tick);
        fade(hud.current, smoothstep(range(p, sa - 0.004, sa + 0.008)) * (1 - smoothstep(range(p, hoA - 0.006, hoA + 0.008))));

        // the verdict
        const st = BEAT.stamp;
        const hit = expoOut(range(p, st, st + 0.022));
        const gone = smoothstep(range(p, hoA, hoB));
        const s = 1.38 - 0.38 * hit;
        place(stampWrap.current, smoothstep(range(p, st, st + 0.0035)) * (1 - gone), `translate(-50%, -50%) rotate(${(-2.6 + 1.1 * hit).toFixed(2)}deg) scale(${(s * (1 - 0.05 * gone)).toFixed(4)})`);
        ridged.current?.ripple((p - st - 0.004) / 0.03, 5.5 * (g.size / 240));

        const ringT = range(p, st + 0.001, st + 0.032);
        place(halo.current, (1 - smoothstep(ringT)) * (ringT > 0 ? 0.62 : 0), `translate(-50%, -50%) scale(${(0.42 + 1.25 * easeOutCubic(ringT)).toFixed(4)})`);
      }),
    [rig, W, H, k, g.size],
  );

  const R = 60 * k;
  const lineX = stacked ? 0 : W * 0.5 - (rigPrintHalf(W, H) + 40 * k);

  return (
    <>
      {CORNERS.map((_, i) => (
        <span
          key={i}
          ref={(el) => {
            corners.current[i] = el;
          }}
          aria-hidden
          className="pointer-events-none absolute"
          style={{ left: 0, top: 0, width: 0, height: 0, visibility: "hidden" }}
        >
          <span
            className="absolute"
            style={{
              left: -2,
              top: -2,
              width: 34 * k,
              height: 34 * k,
              borderLeft: `${Math.max(2, 2.4 * k)}px solid ${RISO.cobalt}`,
              borderTop: `${Math.max(2, 2.4 * k)}px solid ${RISO.cobalt}`,
            }}
          />
        </span>
      ))}

      <div
        ref={bar}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: stacked ? 0 : W * 0.5 - W * 0.28,
          width: stacked ? W : W * 0.56,
          top: 0,
          height: 3,
          background: `linear-gradient(90deg, ${alpha(RISO.cobalt, 0)}, ${RISO.cobalt} 18%, ${RISO.paper} 50%, ${RISO.cobalt} 82%, ${alpha(RISO.cobalt, 0)})`,
          boxShadow: `0 0 18px ${alpha(RISO.cobalt, 0.75)}, 0 0 54px ${alpha(RISO.cobalt, 0.35)}`,
          visibility: "hidden",
        }}
      />

      {/* forensic read-out, beside the print on desktop and under it on phones */}
      <div
        ref={hud}
        className="pointer-events-none absolute flex"
        style={{
          ...MONO,
          flexDirection: "column",
          gap: 10 * k,
          ...(stacked
            ? { left: 0, right: 0, bottom: 96, alignItems: "center", textAlign: "center" as const }
            : { left: 0, width: lineX, top: H * 0.5, alignItems: "flex-end", textAlign: "right" as const, transform: "translateY(-50%)" }),
          color: RISO.paper,
          visibility: "hidden",
        }}
      >
        <span ref={hudPct} style={{ fontSize: Math.max(11, 12 * k), opacity: 0.72, whiteSpace: "pre" }} aria-hidden />
        <span
          ref={hudMatch}
          style={{
            fontSize: (stacked ? 21 : 26) * k,
            letterSpacing: "0.1em",
            color: RISO.sun,
            whiteSpace: "pre",
            fontWeight: 500,
          }}
        >
          {MATCH}
        </span>
      </div>

      {/* halftone ring from the stamp */}
      <div
        ref={halo}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: W / 2,
          top: H * 0.505,
          width: g.total * 2.1,
          height: g.total * 2.1,
          borderRadius: "50%",
          backgroundImage: `radial-gradient(circle at center, ${RISO.sun} 0 ${(R * 0.033).toFixed(1)}px, transparent ${(R * 0.04).toFixed(1)}px)`,
          backgroundSize: `${Math.round(R * 0.16)}px ${Math.round(R * 0.16)}px`,
          maskImage: "radial-gradient(closest-side, transparent 58%, #000 70%, #000 88%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(closest-side, transparent 58%, #000 70%, #000 88%, transparent 100%)",
          visibility: "hidden",
        }}
      />

      <div
        ref={stampWrap}
        className="pointer-events-none absolute"
        style={{ left: W / 2, top: H * 0.505, width: g.blockW, height: g.total, visibility: "hidden", willChange: "transform, opacity" }}
      >
        <h2 className="sr-only">I keep trying things.</h2>
        <RidgedText
          ref={ridged}
          width={g.blockW}
          height={g.total}
          fill={RISO.sun}
          rings={g.rings}
          lines={HEADLINE.map((text, i) => ({ text, size: g.size, x: g.blockW / 2, y: g.y1 + g.lead * i }))}
        />
      </div>
    </>
  );
}

/** Half the print's on-screen width at the reveal framing (desktop only). */
function rigPrintHalf(W: number, H: number) {
  return (0.5 * Math.min((H - 92) / 1.3, (W - 8) / 1.02)) as number;
}
