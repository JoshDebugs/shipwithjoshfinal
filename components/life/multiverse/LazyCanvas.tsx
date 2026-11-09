"use client";

/**
 * The only way worlds create a three.js canvas.
 *
 * - The R3F chunk is code-split and only requested once a world is mounted.
 * - The canvas mounts while the world is current, entering or warming up as
 *   "next", and unmounts otherwise, so at most ~2 WebGL contexts exist.
 * - It renders only while the world is on screen (frameloop "never" while hidden).
 * - DPR is capped (lower on phones / weak devices).
 * - No WebGL, or reduced motion → `fallback` instead.
 */

import dynamic from "next/dynamic";
import { useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { useStage, useWorld } from "./runtime";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });

let webglSupport: boolean | null = null;
function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const c = document.createElement("canvas");
    webglSupport = !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

type CanvasProps = ComponentProps<typeof import("@react-three/fiber").Canvas>;

export function LazyCanvas({
  children,
  fallback = null,
  frameloop = "always",
  dpr,
  className,
  style,
  ...rest
}: Omit<CanvasProps, "children"> & { children: ReactNode; fallback?: ReactNode }) {
  const { presence, running } = useWorld();
  const stage = useStage();
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => setSupported(hasWebGL()), []);

  const mountable = presence !== "previous";
  if (!mountable || supported === null) return null;
  if (!supported || stage.reduced) return <>{fallback}</>;

  const maxDpr = stage.lowPower ? 1.25 : 1.75;
  return (
    <Canvas
      className={className}
      style={{ position: "absolute", inset: 0, ...style }}
      dpr={dpr ?? [1, maxDpr]}
      frameloop={running ? frameloop : "never"}
      gl={{ antialias: !stage.lowPower, powerPreference: "high-performance", alpha: true }}
      aria-hidden
      {...rest}
    >
      {children}
    </Canvas>
  );
}
