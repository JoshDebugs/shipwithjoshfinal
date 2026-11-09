"use client";

/**
 * Reduced motion: one still, solved cube as a flat isometric riso print with
 * every band readable, all copy as DOM, the timer frozen on WAY TOO MUCH, and
 * free play that snaps (no animation).
 */

import { useState } from "react";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { useStage } from "@/components/life/multiverse/runtime";
import { applyMove, solved, type Axis, type CubeState } from "./lib/cube";
import { COPY, FACE_INK } from "./lib/script";
import { IsoCube } from "./ui/IsoCube";

function scramble(s: CubeState, n: number): CubeState {
  let out = s;
  let last = -1;
  for (let i = 0; i < n; i++) {
    let axis = Math.floor(Math.random() * 3) as Axis;
    if (axis === last) axis = ((axis + 1) % 3) as Axis;
    last = axis;
    const layer = [-1, 1, 0][Math.floor(Math.random() * 3)];
    const q = [1, -1, 2][Math.floor(Math.random() * 3)];
    out = applyMove(out, { axis, layers: [layer], q, name: "" });
  }
  return out;
}

export default function RubiksStatic() {
  const stage = useStage();
  const [state, setState] = useState<CubeState>(() => solved());
  const [moves, setMoves] = useState(0);
  const mobile = stage.isMobile;
  const cubeSize = mobile ? Math.min(stage.width - 40, 340) : 460;

  const button: React.CSSProperties = {
    fontFamily: "var(--f-tilt-warp)",
    background: RISO.paper,
    color: RISO.ink,
    boxShadow: `inset 0 0 0 1.5px ${RISO.ink}, 2px 2px 0 ${RISO.ink}`,
  };

  return (
    <div className="relative overflow-hidden px-5 py-20 md:px-14 md:py-28" style={{ background: RISO.paper, color: RISO.ink }}>
      {/* poster grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(90deg, ${alpha(RISO.ink, 0.07)} 1px, transparent 1px), linear-gradient(${alpha(RISO.ink, 0.07)} 1px, transparent 1px)`,
          backgroundSize: mobile ? "56px 56px" : "96px 96px",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-[1fr_auto] md:gap-16">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: alpha(RISO.ink, 0.62) }}>
            World 03 — Rubik&apos;s — Age 14 — Face Value
          </p>
          <h2 className="mt-3 uppercase" style={{ fontFamily: "var(--f-rubik-mono)", fontSize: mobile ? 34 : 64, lineHeight: 1 }}>
            {COPY.headline}
          </h2>
          <ol className="mt-8 flex flex-col">
            {COPY.lines.map((l, i) => (
              <li key={l} className="flex gap-4 py-4" style={{ borderTop: `1px solid ${alpha(RISO.ink, 0.16)}` }}>
                <span className="pt-2 font-mono text-[11px]" style={{ color: RISO.pink }}>
                  0{i + 1}
                </span>
                <p style={{ fontFamily: "var(--f-tilt-warp)", fontSize: mobile ? 22 : 30, lineHeight: 1.1 }}>
                  {l}
                  {i === 2 && <span style={{ color: RISO.pink }}> {COPY.habit}</span>}
                </p>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-3 pt-5" style={{ borderTop: `1px solid ${alpha(RISO.ink, 0.16)}` }}>
            <span
              className="rounded-[6px] px-3 py-1.5 font-mono text-[12px] font-semibold tracking-[0.18em]"
              style={{ background: RISO.sun, boxShadow: `inset 0 0 0 1.5px ${RISO.ink}, 2px 2px 0 ${RISO.ink}` }}
            >
              WAY TOO MUCH
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: alpha(RISO.ink, 0.6) }}>
              time spent, frozen
            </span>
          </div>
        </div>

        <figure className="flex flex-col items-center gap-5">
          <IsoCube state={state} size={cubeSize} idPrefix="st" title="A solved cube printed with the copy: Scrambled at age 14, world 03; 7+ cubes, different puzzle types; time spent: way too much; going too deep." />
          <figcaption className="flex flex-col items-center gap-3 text-center">
            <p style={{ fontFamily: "var(--f-tilt-warp)", fontSize: mobile ? 20 : 24 }}>{COPY.play}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full px-4 py-2 text-[14px]"
                style={button}
                onClick={() => {
                  setState((s) => scramble(s, 12));
                  setMoves((m) => m + 12);
                }}
              >
                Scramble it
              </button>
              <button
                type="button"
                className="rounded-full px-4 py-2 text-[14px]"
                style={button}
                onClick={() => {
                  setState(solved());
                  setMoves(0);
                }}
              >
                Solve it
              </button>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: alpha(RISO.ink, 0.6) }} aria-live="polite">
              {moves ? `${moves} moves in. Still waiting.` : "Bottom face: yeah. it’s a habit."}
            </p>
          </figcaption>
        </figure>
      </div>
      <div aria-hidden className="relative mx-auto mt-14 flex max-w-6xl flex-wrap gap-2">
        {(["U", "F", "R", "B", "L", "D"] as const).map((f) => (
          <span key={f} className="h-3 w-8 rounded-full" style={{ background: FACE_INK[f].bg, boxShadow: `inset 0 0 0 1px ${RISO.ink}` }} />
        ))}
      </div>
    </div>
  );
}
