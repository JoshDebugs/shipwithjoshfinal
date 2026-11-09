"use client";

/**
 * ∞ · The pattern — "Whorl of Worlds".
 *
 * One relief, one camera move: a low flight over glowing ridges that rewinds
 * every world, then a crane straight up to reveal that the canyons were always
 * one fingerprint. Everything below is real DOM text over that canvas, driven
 * by one rig so the type and the WebGL can never disagree.
 */
import { useMemo } from "react";
import { LazyCanvas } from "@/components/life/multiverse/LazyCanvas";
import { useIsoLayoutEffect, useProgress, useStage } from "@/components/life/multiverse/runtime";
import type { WorldProps } from "@/components/life/multiverse/types";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { DomainsAct } from "./DomainsAct";
import { FinaleAct } from "./FinaleAct";
import { FlightAct } from "./FlightAct";
import { PrintFallback } from "./PrintRaster";
import { RevealAct } from "./RevealAct";
import { Rig } from "./rig";
import { Terrain } from "./Terrain";
import { TitleAct } from "./TitleAct";
import { ValuesAct } from "./ValuesAct";

export default function OutroWorld({ progress }: WorldProps) {
  const stage = useStage();
  const rig = useMemo(() => new Rig(), []);
  useIsoLayoutEffect(() => {
    rig.setSize(stage.width, stage.height);
  }, [rig, stage.width, stage.height]);
  useIsoLayoutEffect(() => {
    rig.setP(progress.get());
  }, [rig, progress]);
  useProgress(progress, (p) => rig.setP(p));

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: RISO.ink, color: RISO.paper }}>
      <LazyCanvas camera={{ fov: 70, near: 0.0025, far: 8 }} fallback={<PrintFallback rig={rig} />}>
        <Terrain rig={rig} lowPower={stage.lowPower} />
      </LazyCanvas>

      {/* the printed page sits slightly above the canvas: a whisper of grain and a vignette */}
      {!stage.lowPower && <div aria-hidden className="riso-grain pointer-events-none" style={{ opacity: 0.1, mixBlendMode: "overlay" }} />}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(120% 110% at 50% 45%, ${alpha(RISO.ink, 0)} 58%, ${alpha(RISO.ink, 0.5)} 100%)` }}
      />

      {stage.width > 0 && (
        <>
          <TitleAct rig={rig} />
          <FlightAct rig={rig} />
          <RevealAct rig={rig} />
          <DomainsAct rig={rig} />
          <ValuesAct rig={rig} />
          <FinaleAct rig={rig} />
        </>
      )}
    </div>
  );
}
