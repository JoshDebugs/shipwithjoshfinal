"use client";

/**
 * The bridge: the first stretch of the film, played over the hero's final
 * frame ("here's the gist of it", with its roses).
 *
 * It draws nothing. The hero stays pinned underneath it (LifeHero's section is
 * taller than its animation, and the multiverse overlaps it), so the hero's own
 * line is the only copy on screen. The bridge only tells the film where the
 * first portal (a mic) is born: the point GistBloom marks with
 * [data-gist-origin], on the last big rose.
 */

import { useEffect } from "react";
import type { WorldModule, WorldProps } from "../types";
import { usePortalOrigin } from "../runtime";

function BridgeWorld(_: WorldProps) {
  const origin = usePortalOrigin();
  useEffect(() => {
    origin(document.querySelector<HTMLElement>("[data-gist-origin]"));
    return () => origin(null);
  }, [origin]);
  return null;
}

function BridgeStatic() {
  return null;
}

export const world: WorldModule = {
  meta: {
    id: "bridge",
    number: "00",
    label: "The gist",
    title: "Here's the gist of it.",
    age: null,
    length: 0.3,
    icon: null,
    // see-through: the hero's own final frame shows underneath
    bg: "transparent",
    accent: "#F1EADB",
  },
  World: BridgeWorld,
  Static: BridgeStatic,
};
