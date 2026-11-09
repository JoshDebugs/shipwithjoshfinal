"use client";

/**
 * 09 · Fitness — "Heat Signature".
 *
 * Josh seen through a thermal camera. A melted-capsule body lifts a barbell
 * that reads ice-cold; each rep climbs the Riso ramp (ink → cobalt → teal →
 * pink → sun → paper) until the body is white-hot under a still-black bar and
 * the four words are ghosts on the wall. Then the sensor auto-ranges: a hotter
 * source appears at the chest, a lamp, and the next world opens through it.
 */
import { useEffect, useMemo, useRef } from "react";
import { useIsoLayoutEffect, usePointer, usePortalOrigin, useProgress, useStage, useTicker } from "@/components/life/multiverse/runtime";
import type { WorldProps } from "@/components/life/multiverse/types";
import { C } from "./colors";
import { CpuThermal } from "./cpu";
import { Engine, emptyHud, type Renderer } from "./engine";
import { computeGeo } from "./geometry";
import { Hud } from "./Hud";
import { ThermalGL } from "./ThermalGL";
import { buildWordMasks, heatFamily, loadHeatFont } from "./words";

export default function FitnessWorld({ progress }: WorldProps) {
  const stage = useStage();
  const origin = usePortalOrigin();
  const pointer = usePointer();
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const hud = useRef(emptyHud());
  const engine = useMemo(() => new Engine(hud.current), []);
  const g = useMemo(() => computeGeo(Math.max(1, stage.width), Math.max(1, stage.height), stage.lowPower), [stage.width, stage.height, stage.lowPower]);

  const dpr = () => Math.min(window.devicePixelRatio || 1, stage.lowPower ? 1.25 : 1.5);

  // one renderer for the world's lifetime: WebGL2 if it can, else the CPU path
  const rendererKind = useRef<"gl" | "cpu" | null>(null);
  useIsoLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    host.appendChild(canvas);
    let r: Renderer | null = null;
    const gl = new ThermalGL(canvas);
    if (gl.ok) {
      r = gl;
      rendererKind.current = "gl";
    } else {
      gl.dispose();
      canvas.remove();
      const c2 = document.createElement("canvas");
      c2.setAttribute("aria-hidden", "true");
      c2.style.cssText = canvas.style.cssText;
      host.appendChild(c2);
      r = new CpuThermal(c2);
      rendererKind.current = "cpu";
    }
    engine.useRenderer(r);
    return () => {
      engine.dispose();
      rendererKind.current = null;
      host.replaceChildren();
    };
  }, [engine]);

  useIsoLayoutEffect(() => {
    engine.setGeo(g, stage.lowPower, dpr());
    engine.setProgress(progress.get());
  }, [engine, g, stage.lowPower, progress]);

  // heat-type: first with whatever is loaded, then again once Unbounded arrives
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let dead = false;
    const family = heatFamily(root);
    const build = () => {
      if (dead) return;
      const scale = rendererKind.current === "cpu" ? 1 / g.fieldDiv : Math.min(window.devicePixelRatio || 1, 1.5);
      const masks = buildWordMasks(g, family, scale);
      if (masks) engine.setWords(masks);
    };
    build();
    void loadHeatFont(family).then((ok) => {
      if (ok) build();
    });
    return () => {
      dead = true;
    };
  }, [engine, g]);

  useProgress(progress, (p) => engine.setProgress(p));

  useTicker((time, dt) => {
    engine.frame(time, dt, pointer.x.get(), pointer.y.get(), pointer.inside.get() > 0.5);
  });

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden" style={{ background: C.field, touchAction: "pan-y" }}>
      <h2 className="sr-only">Fitness, age 18: Heat Signature. Built the body too.</h2>
      <p className="sr-only">Discipline. Training. Nutrition. Consistency.</p>
      <div
        ref={(el) => {
          hostRef.current = el;
          hud.current.host = el;
        }}
        aria-hidden
        className="absolute inset-0"
      />
      <Hud g={g} refs={hud.current} onMode={() => engine.cycleMode()} />
      <div ref={origin} aria-hidden className="pointer-events-none absolute" style={{ left: g.lamp.x, top: g.lamp.y, width: g.lamp.s, height: g.lamp.s }} />
    </div>
  );
}
