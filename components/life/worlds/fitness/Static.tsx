"use client";

/**
 * Reduced motion: one frame of the film, baked once and held. The lockout,
 * white-hot under the still-black bar, all four words on the wall as residue,
 * the needle at BUILT, followed by every line in plain type.
 */
import { useEffect, useMemo, useRef } from "react";
import { useStage } from "@/components/life/multiverse/runtime";
import { C, MODES, alpha, mix, rampCss, stopsToFloats } from "./colors";
import { CAPTIONS, HEADLINE, HINT, LOCKOUT, SUBJECT, VISIBLE_NOTE } from "./copy";
import { CpuThermal } from "./cpu";
import type { Renderer } from "./engine";
import { computeFrame, createFrame } from "./frame";
import { computeGeo } from "./geometry";
import { ThermalGL, type Live, type Look } from "./ThermalGL";
import { SETS } from "./timeline";
import { buildWordMasks, heatFamily, loadHeatFont } from "./words";

const P_STILL = 0.885;
const MONO = "var(--f-share-tech)";

export default function FitnessStatic() {
  const stage = useStage();
  const W = Math.max(320, stage.width || 1280);
  const H = Math.max(560, stage.height || 800);
  const g = useMemo(() => computeGeo(W, H, stage.lowPower), [W, H, stage.lowPower]);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const display = canvasRef.current;
    if (!root || !display) return;
    let dead = false;
    const dpr = Math.min(window.devicePixelRatio || 1, stage.lowPower ? 1.25 : 2);
    const family = heatFamily(root);
    const look = baseLook();
    const live: Live = { decayPrints: 1, decayTrails: 1, diffuse: 0, deposit: 0, stamp: [0, 0, 0, 0], stampM: [1, 0, 1, 1], trail: [0, 0, 0, 0] };
    const F = createFrame();
    computeFrame(F, P_STILL, 0, g, { lowPower: false, still: true });

    const paint = (fontReady: boolean) => {
      if (dead) return;
      const glCanvas = document.createElement("canvas");
      const gl = new ThermalGL(glCanvas);
      let r: Renderer;
      let source: HTMLCanvasElement;
      if (gl.ok) {
        r = gl;
        source = glCanvas;
      } else {
        gl.dispose();
        const cpuCanvas = document.createElement("canvas");
        r = new CpuThermal(cpuCanvas);
        source = cpuCanvas;
      }
      r.resize(g.W, g.H, dpr, g.fieldDiv);
      const masks = buildWordMasks(g, family, gl.ok ? Math.min(dpr, 1.5) : 1 / g.fieldDiv);
      if (masks && fontReady) r.setWords(masks.a, masks.b, masks.w, masks.h);
      r.render(F, live, look);
      r.render(F, live, look); // the field needs one pass before the composite reads it
      display.width = source.width;
      display.height = source.height;
      display.getContext("2d")?.drawImage(source, 0, 0);
      r.dispose();
    };

    paint(false);
    void loadHeatFont(family).then((ok) => paint(ok));
    return () => {
      dead = true;
    };
  }, [g, stage.lowPower]);

  const u = g.u;
  const mobile = g.mobile;
  const pad = mobile ? 22 : 70;
  const label = { fontFamily: MONO, letterSpacing: "0.1em", fontSize: (mobile ? 11.5 : 13.5) * u } as const;

  return (
    <div ref={rootRef} className="relative overflow-hidden" style={{ background: C.ink, color: C.paper }}>
      <h2 className="sr-only">Fitness, age 18: Heat Signature.</h2>

      {/* the frame */}
      <div className="relative" style={{ height: H }}>
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" style={{ background: C.field }} />
        <div aria-hidden className="absolute" style={{ ...label, left: g.hudSide, top: g.hudTop }}>
          <div>{SUBJECT}</div>
          <div style={{ color: C.hudDim }}>LOCKOUT</div>
        </div>
        <div className="absolute" style={{ left: g.caption.x, bottom: H - g.caption.bottom, width: g.caption.w }}>
          <div style={{ ...label, color: C.sun, marginBottom: 7 * u }}>LOCKOUT</div>
          <p style={{ fontFamily: "var(--f-unbounded)", fontWeight: 500, fontSize: (mobile ? 21 : 32) * u, lineHeight: 1.16, letterSpacing: "-0.015em", textWrap: "balance" }}>{LOCKOUT}</p>
        </div>
      </div>

      {/* the readout */}
      <div className="relative" style={{ padding: `${(mobile ? 56 : 88) * u}px ${pad}px ${(mobile ? 96 : 112) * u}px`, background: mix(C.ink, C.cobalt, 0.08) }}>
        <div style={{ ...label, color: C.sun }}>09 · FITNESS · AGE 18</div>
        <p style={{ fontFamily: "var(--f-unbounded)", fontWeight: 800, fontSize: (mobile ? 42 : 78) * u, lineHeight: 1.02, letterSpacing: "-0.03em", marginTop: 14 * u }}>{HEADLINE}</p>

        <div className="grid" style={{ marginTop: (mobile ? 40 : 64) * u, gridTemplateColumns: mobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: (mobile ? 26 : 32) * u }}>
          {SETS.map((s, i) => (
            <div key={s.word} style={{ borderTop: `1px solid ${alpha(C.paper, 0.26)}`, paddingTop: 12 * u }}>
              <div style={{ ...label, color: C.hudDim }}>SET {s.n}/04</div>
              <div style={{ fontFamily: "var(--f-unbounded)", fontWeight: 900, fontSize: (mobile ? 24 : 26) * u, marginTop: 8 * u, letterSpacing: "-0.01em", overflowWrap: "anywhere", color: [C.cobalt, C.teal, C.pink, C.sun][i] }}>{s.word}</div>
              <p style={{ fontSize: (mobile ? 15 : 16) * u, lineHeight: 1.4, marginTop: 6 * u, color: alpha(C.paper, 0.82) }}>{CAPTIONS[i + 1].line}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: (mobile ? 44 : 64) * u, maxWidth: 620 * u }}>
          <div className="flex justify-between" style={{ ...label, marginBottom: 8 * u }}>
            <span style={{ color: C.hudDim }}>COUCH</span>
            <span>BUILT</span>
          </div>
          <div className="relative" style={{ height: 8 * u, background: rampCss(MODES[0].stops, "to right"), outline: `1px solid ${C.hudFaint}` }}>
            <div className="absolute" style={{ right: 0, top: -4 * u, width: 2, height: 16 * u, background: C.paper }} />
          </div>
          <div className="text-right" style={{ ...label, marginTop: 6 * u }}>
            JOSH
          </div>
        </div>

        <div className="flex flex-col" style={{ marginTop: (mobile ? 36 : 52) * u, gap: 10 * u, fontSize: (mobile ? 15 : 17) * u, color: alpha(C.paper, 0.82), maxWidth: 680 * u }}>
          <p>{HINT}</p>
          <p>{VISIBLE_NOTE}</p>
        </div>
      </div>
    </div>
  );
}

function baseLook(): Look {
  return {
    stopsA: stopsToFloats(MODES[0].stops, new Float32Array(18)),
    stopsB: stopsToFloats(MODES[0].stops, new Float32Array(18)),
    modeMix: 0,
    visible: 0,
    vis: new Float32Array(12),
    exposure: 1,
    noise: 0.03,
  };
}
