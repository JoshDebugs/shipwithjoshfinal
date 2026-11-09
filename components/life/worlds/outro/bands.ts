/**
 * The eleven worlds as they sit in the print: band 0 (Anchoring) at the core,
 * band 10 (Hackathons) on the outside. Inks follow each world's accent, varied
 * with overprints and mixes so neighbouring bands never match.
 */
import type { CSSProperties } from "react";
import { RISO, mix, overprint } from "@/components/life/multiverse/palette";
import type { PortalIconId } from "@/components/life/multiverse/portalIcons";

export const REDPRINT = overprint(RISO.pink, RISO.sun);
/** Dusk haze: cobalt thinned over the ink ground. */
export const HAZE = mix(RISO.ink, RISO.cobalt, 0.55);
export const ROSE = mix(RISO.pink, RISO.paper, 0.42);
export const MOSS = mix(RISO.teal, RISO.sun, 0.5);
export const CREAM = mix(RISO.sun, RISO.paper, 0.58);
export const GRAPHITE = mix(RISO.ink, RISO.paper, 0.2);

export type Band = {
  id: string;
  name: string;
  ink: string;
  /** Portal that opened into this world. */
  icon: PortalIconId;
  /** The world's own display face, for the one beat its name is on screen. */
  face: CSSProperties;
};

export const BANDS: Band[] = [
  { id: "anchoring", name: "Anchoring", ink: RISO.pink, icon: "mic", face: { fontFamily: "var(--f-anybody)", fontWeight: 900, fontStretch: "130%" } },
  { id: "sports", name: "Sports", ink: RISO.sun, icon: "skate", face: { fontFamily: "var(--f-monoton)" } },
  { id: "rubiks", name: "Rubik’s", ink: RISO.cobalt, icon: "cube", face: { fontFamily: "var(--f-rubik-mono)" } },
  { id: "social", name: "Social", ink: ROSE, icon: "eye", face: { fontFamily: "var(--f-bagel)" } },
  { id: "mun", name: "MUN", ink: REDPRINT, icon: "gavel", face: { fontFamily: "var(--f-fraunces)", fontWeight: 900, fontVariationSettings: '"opsz" 144, "SOFT" 0, "WONK" 1' } },
  { id: "moving", name: "Moving homes", ink: RISO.teal, icon: "house", face: { fontFamily: "var(--f-fraunces)", fontWeight: 300, fontStyle: "italic", fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' } },
  { id: "minecraft", name: "Minecraft", ink: MOSS, icon: "island", face: { fontFamily: "var(--f-silkscreen)", fontWeight: 700 } },
  { id: "startups", name: "Startups", ink: RISO.pink, icon: "receipt", face: { fontFamily: "var(--f-doto)", fontWeight: 900, fontVariationSettings: '"ROND" 100' } },
  { id: "fitness", name: "Fitness", ink: RISO.sun, icon: "bicep", face: { fontFamily: "var(--f-share-tech)" } },
  { id: "jee", name: "JEE", ink: RISO.cobalt, icon: "lamp", face: { fontFamily: "var(--f-instrument)", fontStyle: "italic" } },
  { id: "hackathons", name: "Hackathons", ink: CREAM, icon: "laptop", face: { fontFamily: "var(--f-jetbrains)", fontWeight: 800 } },
];

/** Uniform order: 0–10 worlds, 11 live edge, 12 the ridges beyond it. */
export const BAND_INKS: string[] = [...BANDS.map((b) => b.ink), RISO.sun, GRAPHITE];
