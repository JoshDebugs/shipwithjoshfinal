/**
 * The same pixel bitmaps the voxel words are built from, drawn as SVG — used
 * by the reduced-motion page, the no-WebGL fallback and the MONTAGES
 * misregistration hit. Each lit cell is a square with a short block extrusion.
 */
import type { CSSProperties } from "react";
import type { Bitmap } from "./glyphs";

export function PixelWord({
  bmp,
  front,
  side,
  depth = 0.34,
  title,
  className,
  style,
}: {
  bmp: Bitmap;
  front: string;
  side?: string;
  depth?: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const d = side ? depth : 0;
  const w = bmp.cols + d;
  const h = bmp.rows + d;
  const ext = side
    ? bmp.cells.map(([x, y]) => `M${x} ${y}h1l${d} ${d}v1h-1l${-d} ${-d}z`).join("")
    : "";
  const face = bmp.cells.map(([x, y]) => `M${x} ${y}h1v1h-1z`).join("");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      style={style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      shapeRendering="crispEdges"
    >
      {side && <path d={ext} fill={side} />}
      <path d={face} fill={front} />
    </svg>
  );
}
