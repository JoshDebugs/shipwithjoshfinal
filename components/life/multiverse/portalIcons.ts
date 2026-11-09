/**
 * Portal silhouettes — the shape that opens INTO each world.
 *
 * Each icon is solid black SVG content in a 100×100 box, used as a CSS mask.
 * `anchor` is the centre of the icon's largest inscribed circle and `inner` is
 * that circle's radius (both in icon units). The portal grows until that
 * circle covers the whole stage, which guarantees full coverage for any shape
 * (no crossfade needed), then the anchor drifts to the stage centre.
 */

export type PortalIcon = {
  svg: string;
  anchor: readonly [number, number];
  inner: number;
};

const ring = (cx: number, cy: number, rx: number, ry: number, w: number, dash?: string) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#000" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

export const PORTAL_ICONS = {
  /** Handheld ball mic + two sound arcs (into Anchoring). */
  mic: {
    svg:
      `<circle cx="44" cy="30" r="17"/>` +
      `<path d="M31 47 H57 L50.5 90 Q44 96 37.5 90 Z"/>` +
      `<path d="M61.2 5.4 A30 30 0 0 1 73.9 32.6 L67.9 32.1 A24 24 0 0 0 57.8 10.3 Z"/>` +
      `<path d="M72.3 1.7 A40 40 0 0 1 84 30 L78 30 A34 34 0 0 0 68 6 Z"/>`,
    anchor: [44, 30],
    inner: 16.5,
  },
  /** Side-profile quad roller skate (into Sports). */
  skate: {
    svg:
      `<path d="M22 10 H46 Q50 10 50 16 V40 Q50 44 56 46 L80 54 Q88 57 88 64 V70 H92 V77 H14 V70 H18 V16 Q18 10 22 10 Z"/>` +
      `<circle cx="30" cy="86" r="10"/><circle cx="72" cy="86" r="10"/><rect x="86" y="77" width="7" height="8" rx="1.5"/>`,
    anchor: [36, 56],
    inner: 17.5,
  },
  /** Isometric cube (into Rubik's). */
  cube: {
    svg: `<path d="M50 12 L84 31 V69 L50 88 L16 69 V31 Z"/>`,
    anchor: [50, 50],
    inner: 33,
  },
  /** Almond eye (into Social). */
  eye: {
    svg: `<path d="M4 50 Q50 4 96 50 Q50 96 4 50 Z"/>`,
    anchor: [50, 50],
    inner: 19.5,
  },
  /** Gavel + sound block (into MUN). */
  gavel: {
    svg:
      `<g transform="rotate(-35 42 34)"><rect x="16" y="19" width="52" height="30" rx="6"/><rect x="11" y="16" width="9" height="36" rx="3"/><rect x="64" y="16" width="9" height="36" rx="3"/></g>` +
      `<path d="M48.6 47.7 L55.4 42.3 L86.4 81.3 L79.6 86.7 Z"/>` +
      `<rect x="8" y="82" width="48" height="12" rx="4"/>`,
    anchor: [42, 34],
    inner: 14,
  },
  /** House with a sprout on the roof (into Moving homes). */
  house: {
    svg:
      `<path d="M16 54 L50 25 L84 54 V92 H16 Z"/>` +
      `<rect x="48" y="9" width="4" height="18"/>` +
      `<ellipse cx="42" cy="10" rx="8" ry="4" transform="rotate(-25 42 10)"/><ellipse cx="58" cy="8" rx="8" ry="4" transform="rotate(25 58 8)"/>`,
    anchor: [50, 68],
    inner: 22.5,
  },
  /** Floating voxel sky island with a blocky tree (into Minecraft). */
  island: {
    svg:
      `<path d="M10 34 H90 V58 H82 V68 H72 V78 H60 V90 H40 V78 H28 V68 H18 V58 H10 Z"/>` +
      `<rect x="24" y="22" width="7" height="13"/><rect x="15" y="6" width="25" height="18"/>`,
    anchor: [50, 52],
    inner: 17.5,
  },
  /** Thermal receipt with a torn sawtooth edge (into Startups). */
  receipt: {
    svg: `<path d="M24 4 H76 V86 L70.8 92 L65.6 86 L60.4 92 L55.2 86 L50 92 L44.8 86 L39.6 92 L34.4 86 L29.2 92 L24 86 Z"/>`,
    anchor: [50, 44],
    inner: 25.5,
  },
  /** Flexed bicep (into Fitness). */
  bicep: {
    svg: `<path d="M10 62 C 12 46, 28 38, 42 41 C 49 33, 55 26, 55 19 L 53 11 C 53 4, 70 3, 72 10 L 75 27 C 75 33, 69 35, 66 33 L 66 60 C 66 75, 52 81, 40 79 C 25 79, 9 75, 10 62 Z"/>`,
    anchor: [40, 60],
    inner: 15.5,
  },
  /** Articulated desk lamp (into JEE). */
  lamp: {
    svg:
      `<path d="M10 94 Q10 80 28 80 Q46 80 46 94 Z"/>` +
      `<path d="M24.6 80.2 L42.4 46.3 L49.6 49.7 L31.4 83.8 Z"/>` +
      `<circle cx="46" cy="48" r="6.5"/>` +
      `<path d="M43.3 43.9 L58.4 32.4 L62.8 38.2 L47.7 49.7 Z"/>` +
      `<path d="M56 22 L76 12 L98 50 L64 64 Z"/>`,
    anchor: [73, 38],
    inner: 13,
  },
  /** Open laptop (into Hackathons). */
  laptop: {
    svg: `<rect x="14" y="8" width="72" height="52" rx="5"/><path d="M4 64 H96 L88 78 H12 Z"/>`,
    anchor: [50, 34],
    inner: 25,
  },
  /** Fingerprint whorl — solid core, ridges as rings (into the Outro). */
  whorl: {
    svg:
      `<ellipse cx="50" cy="52" rx="12" ry="15"/>` +
      ring(50, 52, 18.5, 23, 4) +
      ring(50, 52, 25, 31, 4, "120 9") +
      ring(50, 52, 31.5, 39, 4, "150 12 40 10") +
      ring(50, 52, 38, 46.5, 4, "190 14"),
    anchor: [50, 52],
    inner: 11.5,
  },
} as const satisfies Record<string, PortalIcon>;

export type PortalIconId = keyof typeof PORTAL_ICONS;

/** CSS `url(...)` for an icon used as a mask image. */
export function iconMaskUrl(id: PortalIconId): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#000">${PORTAL_ICONS[id].svg}</svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

/** Inline SVG markup for drawing an icon in a world (e.g. to foreshadow the next portal). */
export function iconSvg(id: PortalIconId, fill = "currentColor"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="${fill}">${PORTAL_ICONS[id].svg.replaceAll('stroke="#000"', `stroke="${fill}"`)}</svg>`;
}
