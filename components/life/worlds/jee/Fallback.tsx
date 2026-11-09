"use client";

/**
 * No WebGL: the same room, pre-composed. Three SVG shadows sit exactly where the
 * live scene casts them, crossfading on progress; the copy and the portal origin
 * in World are untouched, so the laptop shadow is still the door.
 */

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useProgress } from "@/components/life/multiverse/runtime";
import { bell, range } from "@/components/life/multiverse/ease";
import { RISO } from "@/components/life/multiverse/palette";
import { BEATS } from "./timeline";
import { laptopScreenRect, wallToNdc, type Rig } from "./rig";
import { BookPile, Desk, LampSilhouette, LaptopShadow, LightPool, iitPath, jeePath } from "./diorama";

export default function Fallback({ progress, rig }: { progress: MotionValue<number>; rig: Rig }) {
  const jeeRef = useRef<SVGSVGElement>(null);
  const iitRef = useRef<SVGSVGElement>(null);
  const lapRef = useRef<SVGSVGElement>(null);
  const hotRef = useRef<SVGSVGElement>(null);

  useProgress(progress, (p) => {
    const b = BEATS;
    set(jeeRef.current, 1 - range(p, 0.16, 0.22));
    set(iitRef.current, bell(p, 0.18, 0.24, b.dark, b.black));
    set(lapRef.current, range(p, b.ignite, b.solve));
    set(hotRef.current, range(p, b.boot, b.end));
  });

  const { W, H, mobile } = rig;
  const px = (f: Rig["a"], u: number, v: number) => {
    const [nx, ny] = wallToNdc(f, rig.asp, u, v);
    return [((nx + 1) / 2) * W, ((1 - ny) / 2) * H] as const;
  };

  const [jx0, jBase] = px(rig.title, rig.jee.u0, rig.jee.v0);
  const [jx1, jTop] = px(rig.title, rig.jee.u0 + rig.jee.sx, rig.jee.v0 + rig.jee.sy);
  const [ix0, iBase] = px(rig.a, rig.iit.u0, rig.iit.v0);
  const [ix1, iTop] = px(rig.a, rig.iit.u0 + rig.iit.sx, rig.iit.v0 + rig.iit.sy);
  const box = laptopScreenRect(rig);

  const deskTop = H * 0.84;
  const pileCx = mobile ? W / 2 : W * 0.42;
  const lampSize = mobile ? 96 : H * 0.34;

  const svg = { className: "absolute inset-0", width: W, height: H, viewBox: `0 0 ${W} ${H}` };

  return (
    <div className="absolute inset-0">
      <svg ref={jeeRef} {...svg}>
        <rect width={W} height={H} fill={RISO.ink} />
        <LightPool cx={W / 2} cy={H * 0.38} rx={mobile ? W * 0.95 : W * 0.34} ry={H * 0.5} />
        <path d={jeePath(jx0, jBase, jx1 - jx0, jBase - jTop)} fill={RISO.ink} />
        <Desk width={W} top={H * 0.69} bottom={H} cx={W / 2} />
        <BookPile cx={W / 2} base={H * 0.84} width={mobile ? W * 0.42 : W * 0.15} height={H * 0.21} columns={1} seed={3} />
      </svg>
      <svg ref={iitRef} {...svg} style={{ opacity: 0 }}>
        <rect width={W} height={H} fill={RISO.ink} />
        <LightPool cx={(ix0 + ix1) / 2} cy={mobile ? H * 0.63 : H * 0.5} rx={mobile ? W * 0.98 : W * 0.42} ry={mobile ? H * 0.37 : H * 0.66} core={mobile ? 0.84 : 0.62} />
        <path d={iitPath(ix0, iBase, ix1 - ix0, iBase - iTop)} fill={RISO.ink} />
        <Desk width={W} top={deskTop} bottom={H} cx={pileCx} />
        <BookPile cx={pileCx} base={H * 0.95} width={mobile ? W * 0.74 : W * 0.34} height={H * 0.24} columns={mobile ? 4 : 7} seed={8} />
        <LampSilhouette x={W - lampSize - (mobile ? 2 : W * 0.05)} y={H * 0.95 - lampSize * 0.94} size={lampSize} />
      </svg>
      <svg ref={lapRef} {...svg} style={{ opacity: 0 }}>
        <rect width={W} height={H} fill={RISO.ink} />
        <LightPool cx={box.left + box.size / 2} cy={box.top + box.size * 0.42} rx={box.size * 0.96} ry={box.size * (mobile ? 0.66 : 0.96)} core={mobile ? 0.82 : 0.62} />
        <LaptopShadow x={box.left} y={box.top} size={box.size} />
        <Desk width={W} top={deskTop} bottom={H} cx={pileCx} />
        <BookPile cx={pileCx} base={H * 0.95} width={mobile ? W * 0.74 : W * 0.34} height={H * 0.24} columns={mobile ? 4 : 7} seed={8} />
        <LampSilhouette x={W - lampSize - (mobile ? 2 : W * 0.05)} y={H * 0.95 - lampSize * 0.94} size={lampSize} />
      </svg>
      <svg ref={hotRef} {...svg} style={{ opacity: 0 }}>
        <LaptopShadow x={box.left} y={box.top} size={box.size} fill="#FFFFFF" />
      </svg>
    </div>
  );
}

function set(el: SVGSVGElement | null, v: number) {
  if (el) el.style.opacity = String(v);
}
