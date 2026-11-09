import type { ComponentType } from "react";
import type { MotionValue } from "framer-motion";
import type { PortalIconId } from "./portalIcons";

export type WorldId =
  | "bridge"
  | "anchoring"
  | "sports"
  | "rubiks"
  | "social"
  | "mun"
  | "moving"
  | "minecraft"
  | "startups"
  | "fitness"
  | "jee"
  | "hackathons"
  | "outro";

export type WorldMeta = {
  id: WorldId;
  /** Display number shown in the HUD, e.g. "01". */
  number: string;
  /** What part of life this is, e.g. "Sports". */
  label: string;
  /** The world's theme title, e.g. "Laps Become Medals". */
  title: string;
  age: number | null;
  /** Length of the world's own timeline in stage heights (the portal dive is added on top). */
  length: number;
  /** Silhouette of the portal that opens INTO this world. */
  icon: PortalIconId | null;
  /** Base colour painted under the world, and shown while its code loads. */
  bg: string;
  /** Palette colour used for the HUD dot. */
  accent: string;
};

/**
 * How a mounted world relates to the viewer right now.
 * - current:  the world on screen (including while its exit portal grows)
 * - entering: revealed through the portal while the previous world exits
 * - next:     mounted but hidden, warming up
 * - previous: mounted but hidden, kept for quick scroll-back
 */
export type Presence = "current" | "entering" | "next" | "previous";

export type WorldProps = {
  /** 0 → 1 across the world's own timeline. 0 is the title card, 1 is the exit frame. */
  progress: MotionValue<number>;
};

export type WorldModule = {
  meta: WorldMeta;
  /** The live, scroll-driven world. Fills its stage (absolute inset-0). */
  World: ComponentType<WorldProps>;
  /** Readable, motionless composition used for prefers-reduced-motion. Normal document flow. */
  Static: ComponentType;
};
