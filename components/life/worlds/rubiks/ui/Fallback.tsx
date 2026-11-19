"use client";

/**
 * The cube as a flat isometric riso print. It snaps through the scramble and
 * the solve with the scroll (no partial turns) and shows the visitor's
 * free-play moves.
 *
 * Two jobs:
 * - no WebGL: it is the cube, for the whole world;
 * - `interim`: it stands in while the WebGL scene is still loading (a cold
 *   arrival: a jump, a fast scroll, a slow network), so the cube never sits
 *   frozen behind the poster, and steps aside once the real cube is up.
 */

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { range, smoothstep } from "@/components/life/multiverse/ease";
import { useProgress, useStage, useTicker } from "@/components/life/multiverse/runtime";
import { solved, type CubeState } from "../lib/cube";
import { N_TOTAL, timelineStates } from "../lib/script";
import { K, layout, movePos, rig, screenRadius } from "../lib/rig";
import { clearMoves, type Store } from "../lib/store";
import { IsoCube } from "./IsoCube";

export function Fallback({ progress, store, cap, interim = false }: { progress: MotionValue<number>; store: Store; cap: number; interim?: boolean }) {
  const stage = useStage();
  const wrap = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState("0");
  const [state, setState] = useState<CubeState>(() => solved());

  useEffect(() => {
    if (interim) {
      store.interim = true;
      return () => {
        store.interim = false;
      };
    }
    store.fallback = true;
    return () => {
      store.fallback = false;
    };
  }, [store, interim]);

  const pick = (p: number) => {
    const el = wrap.current;
    // the stand-in steps aside as soon as the real cube (or the full fallback) is up
    const standDown = interim && (store.ready || store.fallback);
    if (standDown) {
      if (el && el.style.opacity !== "0") el.style.opacity = "0";
      return;
    }
    // no Scene here to unwind: "Solve it" snaps straight back, and scrubbing back before the play zone
    // forgets the moves (the stand-in only draws: while it shows, the scene isn't running yet)
    if (!interim && (store.solving || (p < K.lock3 - 0.02 && store.moves.length))) clearMoves(store);
    const userOn = p >= K.lock3 && store.moves.length > 0 && p < K.poster2;
    const k = userOn ? `u${store.version}` : `t${Math.min(N_TOTAL, Math.round(movePos(p)))}`;
    if (k !== key) {
      setKey(k);
      if (userOn) setState(store.states[store.states.length - 1]);
      else setState(timelineStates()[Math.min(N_TOTAL, Math.round(movePos(p)))]);
    }
    if (el) {
      const o = smoothstep(range(p, 0.03, 0.06)) * (1 - smoothstep(range(p, K.playEnd, 0.93)));
      el.style.opacity = String(o);
    }
  };
  useProgress(progress, pick);
  useTicker(() => pick(progress.get()));

  const W = stage.width;
  const H = stage.height;
  const r = rig(Math.max(0.3, Math.min(0.85, progress.get())), W, H, layout(W, H));
  const size = screenRadius(r, H) * 1.7;
  return (
    <div
      ref={wrap}
      className="pointer-events-none absolute"
      style={{
        left: r.cx - size / 2,
        top: r.cy - size / 2,
        width: size,
        height: size,
        zIndex: interim ? 2 : 1,
        opacity: 0,
        // the stand-in cross-fades into the real cube
        transition: interim ? "opacity 280ms linear" : undefined,
      }}
    >
      <IsoCube state={state} size={size} cap={cap} idPrefix={interim ? "fbi" : "fb"} />
    </div>
  );
}
