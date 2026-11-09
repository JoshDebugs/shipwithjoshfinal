"use client";

/**
 * 07 · Minecraft — "From My Angle".
 *
 * A candy-sunset voxel sky island inside a storm of blocks that look random.
 * Scroll swings the camera around it and, at five exact vantages, the chaos
 * snaps into block words that can only be read from that one angle.
 * "ALMOST" never quite locks. The last lock is the next world's receipt.
 */

import dynamic from "next/dynamic";
import { LazyCanvas } from "@/components/life/multiverse/LazyCanvas";
import { useStage } from "@/components/life/multiverse/runtime";
import { RISO } from "@/components/life/multiverse/palette";
import type { WorldProps } from "@/components/life/multiverse/types";
import { Fallback } from "./Fallback";
import { Overlay } from "./Overlay";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

/** What the sky looks like before the canvas paints (and under it while it loads). */
const SKY_CSS = `linear-gradient(180deg, ${RISO.cobalt} 0%, ${RISO.cobalt} 14%, ${RISO.pink} 38%, ${RISO.sun} 55%, ${RISO.pink} 66%, ${RISO.cobalt} 84%, ${RISO.ink} 100%)`;

export default function MinecraftWorld({ progress }: WorldProps) {
  const stage = useStage();

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: SKY_CSS }}>
      <LazyCanvas
        fallback={<Fallback progress={progress} />}
        camera={{ fov: 40, near: 0.5, far: 1400, position: [0, 3, 40] }}
        // measure with offsetWidth/Height: the portal dive scales/rotates our layer,
        // and a bounding-rect measurement would resize the canvas mid-dive
        resize={{ scroll: false, offsetSize: true }}
        // the scene fades this in once its first frames have landed (no pop from the CSS sky)
        style={{ opacity: 0, transition: "opacity 700ms ease" }}
      >
        <Scene progress={progress} lowPower={stage.lowPower} />
      </LazyCanvas>
      <div className="riso-grain" aria-hidden />
      <Overlay progress={progress} />
    </div>
  );
}
