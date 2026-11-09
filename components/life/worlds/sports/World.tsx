"use client";

/**
 * 02 · Sports — "Laps Become Medals".
 *
 * Your scroll is Josh's training: a comet skater laps a top-down night rink
 * and every lap paints a precessing guilloche. At "state level" that exact
 * pattern is struck into a medal (R3F on desktop, a 2D emboss on phones and
 * without WebGL), the reverse gets a lotus drawn by breaths, the medal
 * multiplies into 20 + 5 honest receipts, and one last comet breaks off its
 * lap and squares the circle into the cube that opens World 03.
 *
 * Layers (bottom → top): 2D conductor canvas · R3F medal · vignette ·
 * exit cube (portal origin) · DOM copy · grain.
 */
import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { useProgress, useStage } from "@/components/life/multiverse/runtime";
import { bell, range } from "@/components/life/multiverse/ease";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import type { WorldProps } from "@/components/life/multiverse/types";
import { ExitCube } from "./ExitCube";
import { computeLayout } from "./layout";
import { Stage2D } from "./Stage2D";
import { createStore } from "./store";
import { TextLayer } from "./TextLayer";

const Medal3D = dynamic(() => import("./Medal3D"), { ssr: false, loading: () => null });

const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.945  0 0 0 0 0.918  0 0 0 0 0.859  0 0 0 1.7 -0.86'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`;

export default function SportsWorld({ progress }: WorldProps) {
  const stage = useStage();
  const L = useMemo(() => computeLayout(stage.width, stage.height, stage.isMobile, stage.lowPower), [stage.width, stage.height, stage.isMobile, stage.lowPower]);
  const use3D = !stage.lowPower;
  const store = useMemo(() => createStore(L.N, L.epsBase, use3D, L.mobile), [L.N, L.epsBase, use3D, L.mobile]);

  // the medal canvas only renders continuously around the medal beats
  const [loop, setLoop] = useState<"always" | "demand">("demand");
  const loopRef = useRef(loop);
  const vignette = useRef<HTMLDivElement>(null);
  const grain = useRef<HTMLDivElement>(null);

  useProgress(progress, (p) => {
    const want = p >= 0.26 && p <= 0.78 ? "always" : "demand";
    if (want !== loopRef.current) {
      loopRef.current = want;
      setLoop(want);
    }
    // house lights: the vignette closes in when the lights cut, opens for the exit
    const dark = Math.max(range(p, 0.35, 0.42) - range(p, 0.86, 0.92), 0);
    if (vignette.current) vignette.current.style.opacity = String(0.55 + 0.45 * dark);
    // breath softens the grain
    if (grain.current) grain.current.style.opacity = String(0.2 - 0.1 * bell(p, 0.54, 0.57, 0.69, 0.72));
  });

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: RISO.ink }}>
      <Stage2D progress={progress} store={store} L={L} use3D={use3D} />
      {use3D && (
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1 }}>
          <Medal3D store={store} frameloop={loop} />
        </div>
      )}
      <div
        ref={vignette}
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 2, background: `radial-gradient(ellipse 78% 74% at 50% 50%, ${alpha(RISO.ink, 0)} 52%, ${alpha(RISO.ink, 0.78)} 100%)` }}
      />
      <ExitCube progress={progress} L={L} />
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 4 }}>
        <TextLayer progress={progress} L={L} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 5 }}>
        <div ref={grain} className="riso-grain" style={{ backgroundImage: GRAIN, mixBlendMode: "screen", opacity: 0.2 }} />
      </div>
    </div>
  );
}
