"use client";

/**
 * The only way worlds create a three.js canvas.
 *
 * - The R3F chunk is code-split and only requested once a world is mounted.
 * - The canvas mounts while the world is current, entering or warming up as
 *   "next", and unmounts otherwise, so at most ~2 WebGL contexts exist. A world
 *   that is expensive to rebuild can pass `keep` to hold its canvas (paused)
 *   while it is "previous", so scrolling back doesn't rebuild it (not on
 *   low-power devices).
 * - It renders only while the world is on screen (frameloop "never" while hidden),
 *   but compiles its shaders while it waits as "next".
 * - DPR is capped (lower on phones / weak devices).
 * - It sizes from layout, not the on-screen box, so a portal dive's zoom never
 *   resizes the drawing buffer.
 * - No WebGL, reduced motion, or a 3D failure (a chunk that won't load, a lost
 *   context that can't be rebuilt) → `fallback` instead. A lost context is
 *   rebuilt on a fresh canvas first.
 */

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useStage, useWorld } from "./runtime";

const Canvas = dynamic(() => import("@react-three/fiber").then((m) => m.Canvas), { ssr: false });

let webglSupport: boolean | null = null;
function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    // three.js r163+ needs WebGL2; a WebGL1-only device gets the fallback.
    const gl = document.createElement("canvas").getContext("webgl2");
    webglSupport = !!gl;
    // the probe's context counts against the browser's live-context limit: release it
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

/** Anything that throws inside the 3D tree lands here and shows the world's 2D fallback. */
class CanvasBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") console.warn("[life] 3D scene failed, showing its fallback:", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Fresh canvases tried after lost contexts before settling on the fallback. */
const MAX_REBUILDS = 3;

type CanvasProps = ComponentProps<typeof import("@react-three/fiber").Canvas>;

export function LazyCanvas({
  children,
  fallback = null,
  frameloop = "always",
  dpr,
  className,
  style,
  onCreated,
  resize,
  keep = false,
  ...rest
}: Omit<CanvasProps, "children"> & { children: ReactNode; fallback?: ReactNode; keep?: boolean }) {
  const { presence, running } = useWorld();
  const stage = useStage();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [generation, setGeneration] = useState(0);
  const presenceRef = useRef(presence);
  presenceRef.current = presence;

  useEffect(() => setSupported(hasWebGL()), []);

  const mountable = presence !== "previous" || (keep && !stage.lowPower);
  if (!mountable || supported === null) return null;
  if (!supported || stage.reduced || generation > MAX_REBUILDS) return <>{fallback}</>;

  const maxDpr = stage.lowPower ? 1.25 : 1.75;
  return (
    <CanvasBoundary fallback={fallback}>
      <Canvas
        key={generation}
        className={className}
        style={{ position: "absolute", inset: 0, ...style }}
        dpr={dpr ?? [1, maxDpr]}
        frameloop={running ? frameloop : "never"}
        gl={{ antialias: !stage.lowPower, powerPreference: "high-performance", alpha: true }}
        aria-hidden
        {...rest}
        // layout size, measured on resize only: a dive's scale() must not resize the buffer
        resize={{ scroll: false, offsetSize: true, ...resize }}
        onCreated={(state) => {
          onCreated?.(state);
          const el = state.gl.domElement;
          el.addEventListener("webglcontextlost", (e) => {
            // R3F also force-loses the context of a canvas it has unmounted: ignore that one
            if (!el.isConnected) return;
            e.preventDefault();
            // the GPU dropped this context (driver reset, too many contexts): rebuild on a fresh canvas
            window.setTimeout(() => setGeneration((g) => g + 1), 150);
          });
          // Mounted early as "next", the canvas doesn't render until its portal opens.
          // Compile its shaders now, while it is hidden, so the dive doesn't open onto
          // the stalled frames of a first render.
          if (presenceRef.current !== "next") return;
          window.setTimeout(() => {
            try {
              state.gl.compile(state.scene, state.camera);
            } catch {
              // best effort: the first render compiles anything missed
            }
          }, 400);
        }}
      >
        {children}
      </Canvas>
    </CanvasBoundary>
  );
}
