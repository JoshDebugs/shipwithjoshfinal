/**
 * A flat pixel-art portrait of the sky island (for the reduced-motion page and
 * the no-WebGL fallback). Same inks as the voxel island.
 */
import type { CSSProperties } from "react";
import { LAND } from "./colors";

type Cell = [number, number, string];

function cells(): { w: number; h: number; list: Cell[] } {
  const list: Cell[] = [];
  const W = 26;
  // tree canopy + trunk (left third)
  const canopy = [
    [4, 9],
    [3, 10],
    [3, 10],
  ];
  canopy.forEach(([a, b], r) => {
    for (let x = a; x <= b; x++) list.push([x, r, r === 0 ? LAND.leafTop : LAND.leaf]);
  });
  for (let r = 3; r < 6; r++) list.push([6, r, LAND.trunk], [7, r, LAND.trunk]);
  // the bed on the right
  list.push([17, 5, LAND.wool], [18, 5, LAND.wool], [19, 5, LAND.pillow]);
  // island body: [first, last, ink] per row
  const rows: [number, number, string][] = [
    [1, 24, LAND.grassTop],
    [1, 24, LAND.grass],
    [2, 23, LAND.dirt],
    [3, 22, LAND.dirt],
    [4, 21, LAND.stone],
    [6, 19, LAND.stone],
    [8, 17, LAND.stone],
    [10, 15, LAND.stoneShade],
    [12, 13, LAND.stoneShade],
  ];
  rows.forEach(([a, b, c], i) => {
    for (let x = a; x <= b; x++) list.push([x, 6 + i, c]);
  });
  // pool + waterfall off the left edge
  list.push([1, 6, LAND.waterTop], [2, 6, LAND.waterTop]);
  for (let r = 7; r < 19; r++) list.push([0, r, r % 3 === 0 ? LAND.waterTop : LAND.water]);
  return { w: W, h: 19, list };
}

const DATA = cells();

export function PixelIsland({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox={`0 0 ${DATA.w} ${DATA.h}`} className={className} style={style} aria-hidden shapeRendering="crispEdges">
      {DATA.list.map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width={1.02} height={1.02} fill={c} />
      ))}
    </svg>
  );
}
