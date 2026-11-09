"use client";

/**
 * The title card: a flat Swiss poster that is secretly the top face of the
 * cube. This DOM/SVG replica is pixel-registered to the WebGL face at FOV 8°
 * (same sticker geometry, same print), so it reads instantly and crisply
 * through the previous world's portal and hands over to the 3D cube just
 * before the first turn. Gutter hairlines and crop marks make the whole
 * stage read as one poster grid; they fade the moment the page turns.
 */

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { range, smoothstep } from "@/components/life/multiverse/ease";
import { useProgress, useStage, useTicker } from "@/components/life/multiverse/runtime";
import { PRINTS } from "../lib/script";
import { FACE, layout } from "../lib/rig";
import { STICKER, STICKER_RADIUS, TYPE_SIZE, patternInk } from "../lib/print";
import type { Store } from "../lib/store";

function Sticker({ id, size, cap }: { id: number; size: number; cap: number }) {
  const pr = PRINTS[id];
  const T = 100;
  const n = 6;
  const fs = T * TYPE_SIZE;
  return (
    <svg viewBox={`0 0 ${T} ${T}`} width={size} height={size} className="absolute inset-0" aria-hidden={pr.text.trim() === ""}>
      <rect width={T} height={T} fill={pr.ink.bg} />
      <g stroke={patternInk(pr.ink)} strokeWidth={T / 220 < 0.45 ? 0.45 : T / 220}>
        {Array.from({ length: n - 1 }, (_, i) => {
          const v = ((i + 1) / n) * T;
          return (
            <g key={i}>
              <line x1={v} y1={0} x2={v} y2={T} />
              <line x1={0} y1={v} x2={T} y2={v} />
            </g>
          );
        })}
      </g>
      {pr.text.trim() !== "" && (
        <text
          x={T / 2}
          y={T / 2 + (cap * fs) / 2}
          textAnchor="middle"
          fontSize={fs}
          fill={pr.ink.fg}
          xmlSpace="preserve"
          style={{ fontFamily: "var(--f-rubik-mono)", whiteSpace: "pre" }}
        >
          {pr.text}
        </text>
      )}
    </svg>
  );
}

export function Poster({ progress, store, cap }: { progress: MotionValue<number>; store: Store; cap: number }) {
  const stage = useStage();
  const face = useRef<HTMLDivElement>(null);
  const deco = useRef<HTMLDivElement>(null);
  const L = layout(stage.width, stage.height);
  const { s, x, y } = L.poster;
  const k = s / FACE;
  const st = STICKER * k;
  const apply = (p: number) => {
    const f = face.current;
    if (f) {
      // hand over to WebGL just before the first turn (or keep the poster if WebGL isn't ready yet)
      const handover = store.ready || store.fallback ? 1 - range(p, 0.028, 0.04) : 1;
      f.style.opacity = String(handover);
    }
    const d = deco.current;
    if (d) {
      const o = 1 - smoothstep(range(p, 0.03, 0.085));
      d.style.opacity = String(o);
      d.style.visibility = o <= 0.001 ? "hidden" : "visible";
    }
  };
  useProgress(progress, apply);
  // the WebGL scene may become ready after progress stopped changing
  useTicker(() => apply(progress.get()));

  const lines = [-HALF_GUTTER, HALF_GUTTER];
  const edges = [-FACE / 2, FACE / 2];
  const hair = alpha(RISO.ink, 0.13);
  const mark = 14;

  return (
    <>
      {/* stage-wide poster grid, crop marks and margin type */}
      <div ref={deco} aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 2 }}>
        {[...lines, ...edges].map((u, i) => (
          <div key={`v${i}`} className="absolute top-0 h-full" style={{ left: x + u * k - 0.5, width: 1, background: hair }} />
        ))}
        {[...lines, ...edges].map((u, i) => (
          <div key={`h${i}`} className="absolute left-0 w-full" style={{ top: y + u * k - 0.5, height: 1, background: hair }} />
        ))}
        {[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sy], i) => {
          const cx = x + (sx * s) / 2;
          const cy = y + (sy * s) / 2;
          return (
            <svg key={i} className="absolute" style={{ left: cx - 24, top: cy - 24 }} width={48} height={48} viewBox="0 0 48 48">
              <g stroke={RISO.ink} strokeWidth={1}>
                <line x1={24 + sx * 6} y1={24} x2={24 + sx * (6 + mark)} y2={24} />
                <line x1={24} y1={24 + sy * 6} x2={24} y2={24 + sy * (6 + mark)} />
              </g>
              <circle cx={24 + sx * 13} cy={24 + sy * 13} r={3.2} fill="none" stroke={RISO.cobalt} strokeWidth={1} />
            </svg>
          );
        })}
        {!L.mobile && (
          <div
            className="absolute font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ left: x + s / 2 + 34, top: y, transform: "translateY(-50%) rotate(90deg)", transformOrigin: "left center", color: alpha(RISO.ink, 0.6), whiteSpace: "nowrap" }}
          >
            Fig. 03 — a perfectly flat poster.
          </div>
        )}
        <div
          className="absolute"
          style={{
            left: L.mobile ? 20 : Math.max(28, x - s / 2 - 260),
            top: L.mobile ? y + s / 2 + 34 : y + s / 2 - 74,
            color: RISO.ink,
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: alpha(RISO.ink, 0.62) }}>
            World 03 — Rubik&apos;s — Age 14
          </div>
          <div className="mt-1 leading-none" style={{ fontFamily: "var(--f-tilt-warp)", fontSize: L.mobile ? 30 : 38 }}>
            Face Value
          </div>
        </div>
        {L.mobile && (
          <div
            className="absolute right-5 font-mono text-[9px] uppercase tracking-[0.2em]"
            style={{ top: y + s / 2 + 40, color: alpha(RISO.ink, 0.55), textAlign: "right" }}
          >
            Fig. 03
            <br />a perfectly flat poster.
          </div>
        )}
      </div>

      {/* the face itself */}
      <div
        ref={face}
        className="pointer-events-none absolute"
        style={{
          left: x - s / 2,
          top: y - s / 2,
          width: s,
          height: s,
          zIndex: 3,
          background: RISO.ink,
          borderRadius: 0.085 * k,
          transition: "opacity 240ms linear",
        }}
      >
        <h2 className="sr-only">Scrambled at age 14. World 03.</h2>
        {Array.from({ length: 9 }, (_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <div
              key={i}
              className="absolute overflow-hidden"
              style={{
                left: (FACE / 2 + (col - 1) - STICKER / 2) * k,
                top: (FACE / 2 + (row - 1) - STICKER / 2) * k,
                width: st,
                height: st,
                borderRadius: st * STICKER_RADIUS,
              }}
            >
              <Sticker id={i} size={st} cap={cap} />
            </div>
          );
        })}
      </div>
    </>
  );
}

/** Gutter centre lines sit half a pitch from the face centre. */
const HALF_GUTTER = 0.5;
