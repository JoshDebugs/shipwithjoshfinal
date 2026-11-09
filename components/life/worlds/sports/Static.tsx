"use client";

/**
 * Reduced motion: the finished story as one still, readable poster. The
 * struck medal (obverse rosette + lotus reverse) is painted once with the 2D
 * emboss, the 20 + 5 receipts are drawn in SVG, and every line is here.
 */
import { useEffect, useRef, type CSSProperties } from "react";
import { useStage } from "@/components/life/multiverse/runtime";
import { cinzel } from "@/components/life/multiverse/fonts";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { COPY } from "./copy";
import { CUBE_PATH, RING_IN } from "./layout";
import { buildBack, buildFront, drawMedal2D, makeFace2D, makeFaceSet, tint2D } from "./medalArt";
import type { RosetteParams } from "./rosette";
import { meta } from "./meta";

const RIBBON = [RISO.cobalt, RISO.pink, RISO.teal, RISO.sun];

function StaticMedal({ side, r, label }: { side: "front" | "back"; r: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let alive = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = Math.ceil(r * 2.3);
    c.width = size * dpr;
    c.height = size * dpr;
    const paint = () => {
      if (!alive) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const N = 24;
      const a = 100;
      const P: RosetteParams = { N, K: 4, spl: 340, a, b: 0.6 * a, psi: 0, theta0: Math.PI / 2, delta: 0.0125 };
      const eps = new Float32Array(N).fill(0.034);
      const R = a * (1 + 0.034 + 0.03) * (1 + 1.5 * 0.0125);
      const face = makeFaceSet(640);
      const flat = makeFace2D(640);
      if (side === "front") buildFront(face, { P, eps, M0: R / RING_IN, glow: false, serif: cinzel.style.fontFamily });
      else buildBack(face, { lotus: 8, relief: 1, insc: 1, glow: false, serif: cinzel.style.fontFamily });
      tint2D(face, flat);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      drawMedal2D(ctx, { x: size / 2, y: size / 2, r, rotX: 0.12, rotY: side === "front" ? -0.12 : 0.14, rotZ: 0, metal: 1, bump: 1, E: 0, rim: 1, sheen: side === "front" ? 0.4 : 2.2 }, { face, flat }, null);
    };
    paint();
    document.fonts?.load(`700 40px ${cinzel.style.fontFamily}`, "ROLLER SKATING STATE LEVEL YOGA").then(paint).catch(() => {});
    return () => {
      alive = false;
    };
  }, [side, r]);
  return <canvas ref={ref} role="img" aria-label={label} style={{ width: Math.ceil(r * 2.3), height: Math.ceil(r * 2.3), maxWidth: "100%" }} />;
}

export default function SportsStatic() {
  const stage = useStage();
  const m = stage.isMobile;
  const mono: CSSProperties = { fontFamily: "var(--font-geist-mono), ui-monospace, monospace", fontVariantNumeric: "tabular-nums" };
  const unb = (wght: number): CSSProperties => ({ fontFamily: "var(--f-unbounded)", fontVariationSettings: `'wght' ${wght}`, fontWeight: wght });
  const serif: CSSProperties = { fontFamily: "var(--f-cinzel)", fontWeight: 600 };
  const tag: CSSProperties = { ...mono, color: RISO.sun, fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase" };
  const r = m ? 120 : 160;

  return (
    <div className="relative overflow-hidden" style={{ background: RISO.ink, color: RISO.paper }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 pb-24 pt-28 md:gap-20 md:px-14 md:pt-32">
        {/* title */}
        <header className="flex flex-col items-center text-center">
          <p className="m-0" style={{ ...tag, color: alpha(RISO.paper, 0.6) }}>
            World {meta.number} · {meta.label} · {meta.title}
          </p>
          <h2 className="relative m-0 mt-6" style={{ fontFamily: "var(--f-monoton)", fontWeight: 400, fontSize: m ? 58 : 132, lineHeight: 1, letterSpacing: "0.03em", color: RISO.sun }}>
            <span aria-hidden className="absolute inset-0" style={{ color: RISO.pink, transform: "translate(3px,3px)" }}>
              {COPY.title}
            </span>
            <span className="relative">{COPY.title}</span>
          </h2>
          <p className="m-0 mt-5" style={{ ...unb(400), fontSize: m ? 16 : 24 }}>
            <span style={{ ...mono, color: RISO.sun, fontSize: "0.72em", letterSpacing: "0.2em", textTransform: "uppercase" }}>{COPY.age} —</span> {COPY.headline}
          </p>
        </header>

        {/* the two sides of one medal */}
        <section className="grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-16">
          <figure className="m-0 flex flex-col items-center gap-3">
            <StaticMedal side="front" r={r} label="Medal obverse: a lap rosette, inscribed Roller skating · State level" />
            <figcaption style={tag}>{COPY.stateTag}</figcaption>
          </figure>
          <div className="flex flex-col gap-4">
            <p className="m-0" style={{ ...unb(800), fontSize: m ? 26 : 42, lineHeight: 1.1 }}>
              {COPY.laps[0]} <span style={{ ...unb(300) }}>{COPY.laps[1]} {COPY.laps[2]}</span>
            </p>
            <p className="m-0" style={{ ...serif, fontSize: m ? 30 : 48, lineHeight: 1.1 }}>
              I reached <span style={{ color: RISO.sun }}>state level.</span>
            </p>
          </div>
        </section>

        <section className="grid items-center gap-10 md:grid-cols-[1fr_auto] md:gap-16">
          <div className="order-2 flex flex-col gap-4 md:order-1">
            <p className="m-0" style={{ ...unb(250), fontSize: m ? 24 : 38, lineHeight: 1.15, textWrap: "balance" }}>
              {COPY.yoga[0]} {COPY.yoga[1]}
            </p>
            <p className="m-0" style={{ ...serif, color: RISO.teal, fontSize: m ? 26 : 40 }}>
              {COPY.yogaState}
            </p>
          </div>
          <figure className="order-1 m-0 flex flex-col items-center gap-3 md:order-2">
            <StaticMedal side="back" r={r} label="Medal reverse: a lotus drawn in eight strokes, inscribed Yoga · State level" />
            <figcaption style={tag}>{COPY.yogaTag}</figcaption>
          </figure>
        </section>

        {/* the receipts */}
        <section className="flex flex-col gap-6">
          <p className="m-0" style={{ ...tag, color: alpha(RISO.paper, 0.6) }}>
            {COPY.odoLabel}
          </p>
          <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
            <span style={{ ...mono, color: RISO.sun, fontSize: m ? 64 : 120, lineHeight: 0.9, fontWeight: 600, letterSpacing: "-0.04em" }}>20–25</span>
            <p className="m-0 pb-2" style={{ ...unb(600), fontSize: m ? 20 : 30, lineHeight: 1.2 }}>
              {COPY.medals[0]}
              <br />
              <span style={{ ...unb(300) }}>{COPY.medals[1]}</span>
            </p>
          </div>
          <svg viewBox="0 0 500 64" className="w-full" style={{ maxWidth: 900 }} role="img" aria-label="20 struck medals and 5 dashed outlines">
            {Array.from({ length: 25 }, (_, i) => {
              const x = 10 + i * 19.6;
              const ghost = i >= 20;
              return (
                <g key={i}>
                  {ghost ? (
                    <>
                      <rect x={x + 3.5} y={0} width={5} height={30} fill="none" stroke={alpha(RISO.paper, 0.4)} strokeDasharray="2 2" strokeWidth={0.8} />
                      <circle cx={x + 6} cy={42} r={8.5} fill="none" stroke={alpha(RISO.paper, 0.55)} strokeDasharray="2.2 2.2" strokeWidth={1} />
                    </>
                  ) : (
                    <>
                      <rect x={x + 3.5} y={0} width={5} height={30} fill={RIBBON[i % 4]} />
                      <rect x={x + 5.2} y={0} width={1.6} height={30} fill={i % 2 ? RISO.paper : RISO.sun} />
                      <circle cx={x + 6} cy={42} r={8.5} fill={RISO.paper} />
                      <circle cx={x + 6} cy={42} r={6.2} fill="none" stroke={alpha(RISO.ink, 0.35)} strokeWidth={0.7} />
                    </>
                  )}
                </g>
              );
            })}
          </svg>
          <p className="m-0" style={{ ...unb(800), fontSize: m ? 28 : 46, lineHeight: 1.08, textWrap: "balance" }}>
            {COPY.receipts[0]} <span style={{ color: RISO.sun }}>{COPY.receipts[1]}</span>
          </p>
        </section>

        {/* another direction */}
        <section className="flex items-center gap-6 md:gap-10">
          <svg viewBox="0 0 100 100" width={m ? 64 : 96} height={m ? 64 : 96} aria-hidden style={{ flexShrink: 0, transform: "rotate(-6deg)" }}>
            <path d={CUBE_PATH} fill={RISO.paper} />
            <path d="M84 31 L50 50 L50 88 L84 69 Z" fill={alpha(RISO.ink, 0.13)} />
            <path d="M50 50 L50 88 M50 50 L16 31 M50 50 L84 31" stroke={alpha(RISO.ink, 0.3)} strokeWidth="0.9" fill="none" />
          </svg>
          <p className="m-0" style={{ ...unb(700), fontSize: m ? 26 : 44, lineHeight: 1.1, textWrap: "balance" }}>
            {COPY.exit[0]} <span style={{ color: RISO.pink }}>{COPY.exit[1]}</span>
          </p>
        </section>
      </div>
    </div>
  );
}
