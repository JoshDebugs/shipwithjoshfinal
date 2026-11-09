"use client";

/**
 * 03 · Rubik's — "Face Value".
 *
 * THE GRID WAS A CUBE. The title card is a flat Swiss poster ("SCRAMBLED /
 * AT AGE 14 / WORLD 03.") that is really the top face of a building-sized
 * cube seen at FOV 8°. The first scroll swings the right third away (an R
 * turn) while a dolly-zoom bends the page into an object; the copy shreds
 * into a three-letter ransom note, then solves back layer by layer in
 * reading order, each lock firing a halftone shockwave. A coin-flip shows
 * the bottom face, free play opens, and finally the cube cracks and you
 * dive into its ink core, where the next world's eye opens.
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue } from "framer-motion";
import { LazyCanvas } from "@/components/life/multiverse/LazyCanvas";
import { useProgress, useStage, useTicker } from "@/components/life/multiverse/runtime";
import { RISO } from "@/components/life/multiverse/palette";
import { range } from "@/components/life/multiverse/ease";
import type { WorldProps } from "@/components/life/multiverse/types";
import { COPY, VERMILION } from "./lib/script";
import { K, movePos } from "./lib/rig";
import { frame } from "./lib/frame";
import { CAP_FALLBACK, measureCap } from "./lib/print";
import { createStore } from "./lib/store";
import { Halftone } from "./ui/Halftone";
import { Poster } from "./ui/Poster";
import { Lcd } from "./ui/Lcd";
import { Ticker } from "./ui/Ticker";
import { Captions } from "./ui/Captions";
import { FreePlay } from "./ui/FreePlay";
import { Exit } from "./ui/Exit";
import { Fallback } from "./ui/Fallback";

const Scene = dynamic(() => import("./scene/Scene"), { ssr: false, loading: () => null });

const pad2 = (n: number) => String(Math.max(0, Math.min(99, Math.round(n)))).padStart(2, "0");
const clock = (secs: number) => {
  const s = Math.min(599.99, secs);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(2).padStart(5, "0")}`;
};

export default function RubiksWorld({ progress }: WorldProps) {
  const stage = useStage();
  const root = useRef<HTMLDivElement>(null);
  const store = useMemo(createStore, []);
  const [font, setFont] = useState<{ fam: string; real: boolean } | null>(null);
  // dev-only hook for the screenshot harness (stripped from production builds)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __rubiks?: unknown };
    w.__rubiks = { store };
    return () => {
      if ((w.__rubiks as { store?: unknown } | undefined)?.store === store) delete w.__rubiks;
    };
  }, [store]);
  const [cap, setCap] = useState(CAP_FALLBACK);

  // the atlas needs the real Rubik Mono One: print with the fallback if it is slow, reprint once it lands
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fam = getComputedStyle(el).getPropertyValue("--f-rubik-mono").trim() || "monospace";
    let alive = true;
    const timeout = window.setTimeout(() => alive && setFont((f) => f ?? { fam, real: false }), 2500);
    document.fonts
      .load(`400 64px ${fam}`, "SCRAMBLED 0123456789")
      .then((faces) => {
        if (!alive) return;
        window.clearTimeout(timeout);
        setCap(measureCap(fam));
        setFont({ fam, real: faces.length > 0 });
      })
      .catch(() => alive && setFont((f) => f ?? { fam, real: false }));
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, []);

  /* ------------------------------------------------ LCD + lock shockwaves */
  const lcdText = useMotionValue("INSPECT   15");
  const lcdLabel = useMotionValue("inspection");
  const prev = useRef(progress.get());
  const solveClock = useRef(0);
  const live = useRef<HTMLParagraphElement>(null);

  const lcdFor = (p: number) => {
    if (p < 0.036) return [`INSPECT   ${p < 0.018 ? 15 : 14}`, "inspection"];
    if (p < K.turn) return ["   AGE 14", "inspection · done"];
    if (p < K.scramble) return [`SCRAMBLE  ${pad2(Math.floor(movePos(p)) + 1)}`, "scramble"];
    if (p < K.solve) return ["SCRAMBLED 14", "scramble"];
    if (p < K.lock2) {
      const t = range(p, K.solve, K.lock2);
      return [`TIME ${clock(2.4 + 560 * Math.pow(t, 2.3) + solveClock.current)}`, "solve"];
    }
    if (p < K.flipEnd) return ["WAY TOO MUCH", "solve · overflow"];
    if (p < K.playEnd) return store.moves.length ? [`MOVES     ${pad2(store.moves.length)}`, "free play"] : ["  I'LL WAIT.", "free play"];
    if (p < K.poster2) return [`UNDO      ${pad2(Math.ceil(store.applied))}`, "free play"];
    return ["  TOO DEEP.", "core"];
  };

  const refresh = (p: number) => {
    const [t, l] = lcdFor(p);
    if (lcdText.get() !== t) lcdText.set(t);
    if (lcdLabel.get() !== l) lcdLabel.set(l);
  };

  useProgress(progress, (p) => {
    const before = prev.current;
    prev.current = p;
    if (p < K.solve) solveClock.current = 0;
    // forward crossings fire a shockwave + a scale "press" (never on big jumps)
    if (p > before && p - before < 0.08) {
      const now = performance.now() / 1000;
      const events: [number, string, string][] = [
        [K.lock1, RISO.cobalt, COPY.lines[0]],
        [K.lock2, RISO.sun, COPY.lines[1]],
        [K.lock3, RISO.teal, COPY.lines[2]],
        [K.flipEnd - 0.012, RISO.pink, `${COPY.habit} ${COPY.play}`],
        [K.crack - 0.003, VERMILION, ""],
      ];
      for (const [at, color, say] of events) {
        if (before < at && p >= at) {
          store.rings.push({ t0: now, color });
          store.lockAt = now;
          if (say && live.current) live.current.textContent = say;
        }
      }
    }
    refresh(p);
  });

  useTicker((_, dt) => {
    const p = progress.get();
    if (p > K.solve && p < K.lock2) solveClock.current += dt;
    refresh(p);
  });

  const fr = frame(stage.width, stage.height);
  const lcdH = Math.round(24 * fr.lcd.scale);

  return (
    <div ref={root} className="absolute inset-0 overflow-hidden" style={{ background: RISO.paper, color: RISO.ink }}>
      <Halftone progress={progress} store={store} />

      <LazyCanvas
        shadows="percentage"
        flat
        camera={{ fov: 8, near: 0.05, far: 200, position: [0, 30, 0.001] }}
        style={{ zIndex: 1, pointerEvents: "none" }}
        fallback={<Fallback progress={progress} store={store} cap={cap} />}
      >
        <Scene progress={progress} store={store} font={font?.fam ?? null} fontReal={font?.real ?? false} cap={cap} lowPower={stage.lowPower} />
      </LazyCanvas>

      <Poster progress={progress} store={store} cap={cap} />

      {/* above the exit ink: the timer signs off with TOO DEEP. */}
      <div className="pointer-events-none absolute" style={{ left: fr.lcd.x, top: fr.lcd.y, zIndex: 9 }} aria-hidden>
        <Lcd text={lcdText} label={lcdLabel} height={lcdH} />
      </div>

      <Ticker progress={progress} box={fr.ticker} slot={fr.mobile ? 34 : 46} />
      <Captions progress={progress} store={store} fr={fr} />
      <FreePlay progress={progress} store={store} />
      <Exit progress={progress} />

      <div aria-hidden className="riso-grain" style={{ zIndex: 8, opacity: 0.16 }} />

      <p ref={live} className="sr-only" aria-live="polite" />
      <ol className="sr-only">
        <li>{COPY.headline}</li>
        {COPY.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
        <li>{COPY.habit}</li>
        <li>{COPY.play}</li>
      </ol>
    </div>
  );
}
