"use client";

/**
 * No-WebGL fallback: the same cube as a flat isometric riso print. It snaps
 * through the scramble and the solve with the scroll (no partial turns) and
 * shows the visitor's free-play moves.
 */

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { range, smoothstep } from "@/components/life/multiverse/ease";
import { useProgress, useStage, useTicker } from "@/components/life/multiverse/runtime";
import { solved, type CubeState } from "../lib/cube";
import { N_TOTAL, timelineStates } from "../lib/script";
import { K, layout, movePos, rig, screenRadius } from "../lib/rig";
import type { Store } from "../lib/store";
import { IsoCube } from "./IsoCube";

export function Fallback({ progress, store, cap }: { progress: MotionValue<number>; store: Store; cap: number }) {
  const stage = useStage();
  const wrap = useRef<HTMLDivElement>(null);
  const [key, setKey] = useState("0");
  const [state, setState] = useState<CubeState>(() => solved());

  useEffect(() => {
    store.fallback = true;
    return () => {
      store.fallback = false;
    };
  }, [store]);

  const pick = (p: number) => {
    const userOn = p >= K.lock3 && store.moves.length > 0 && p < K.poster2;
    const k = userOn ? `u${store.version}` : `t${Math.min(N_TOTAL, Math.round(movePos(p)))}`;
    if (k !== key) {
      setKey(k);
      if (userOn) setState(store.states[store.states.length - 1]);
      else setState(timelineStates()[Math.min(N_TOTAL, Math.round(movePos(p)))]);
    }
    const el = wrap.current;
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
    <div ref={wrap} className="pointer-events-none absolute" style={{ left: r.cx - size / 2, top: r.cy - size / 2, width: size, height: size, zIndex: 1, opacity: 0 }}>
      <IsoCube state={state} size={size} cap={cap} idPrefix="fb" />
    </div>
  );
}
