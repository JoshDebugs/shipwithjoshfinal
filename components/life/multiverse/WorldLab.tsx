"use client";

/**
 * Dev-only harness, registry-backed: /life/lab?world=<id> renders any world
 * with its real neighbour in the dive preview.
 *
 * The per-world labs (/life/lab/<id>) use SingleWorldLab.tsx instead, which
 * never imports the registry, so one broken world can't take down every lab.
 *
 * Query params: see SingleWorldLab.tsx (p, dive, reduced).
 */

import { useEffect, useState } from "react";
import { WORLDS } from "@/components/life/worlds/registry";
import { LabShell, type LabNext } from "./SingleWorldLab";

/** Registry-backed lab: /life/lab?world=<id> */
export function WorldLab() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(new URLSearchParams(window.location.search).get("world") ?? "anchoring"), []);
  if (!id) return <div className="h-screen bg-bg" />;
  const index = Math.max(0, WORLDS.findIndex((w) => w.meta.id === id));
  const nextMod = WORLDS[index + 1];
  const next: LabNext | null = nextMod?.meta.icon ? { icon: nextMod.meta.icon, bg: nextMod.meta.bg, World: nextMod.World, module: nextMod } : null;
  return <LabShell module={WORLDS[index]} next={next} />;
}
