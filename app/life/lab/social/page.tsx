"use client";

// Dev-only isolated lab for the social world (imports only this world). See components/life/multiverse/WorldLab.tsx.
import { notFound } from "next/navigation";
import { SingleWorldLab } from "@/components/life/multiverse/WorldLab";
import { RISO } from "@/components/life/multiverse/palette";
import { world } from "@/components/life/worlds/social";

export default function Lab() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SingleWorldLab module={world} nextIcon={"gavel"} nextBg={RISO.cobalt} />;
}
