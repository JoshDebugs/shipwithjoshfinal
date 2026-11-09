"use client";

/**
 * 05 · MUN — "Turning the Room".
 *
 * ORDER. → Josh's half-redacted position paper types itself out → the camera
 * rises off his desk to a top-down cobalt assembly hall where every
 * delegate's gaze thread is locked on the opponent's pink podium → three
 * speeches turn the room in ripples spreading out from his seat → the camera
 * drops over his shoulder, the whole hall fanning into his card → the gavel
 * twangs the web, the seal slams → the threads stitch a house: the next portal.
 */

import { useMemo, useRef } from "react";
import { usePortalOrigin, useStage } from "@/components/life/multiverse/runtime";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import type { WorldProps } from "@/components/life/multiverse/types";
import { HallCanvas, type Dot } from "./HallCanvas";
import { JoshCard } from "./JoshCard";
import { buildLayout } from "./layout";
import { PositionPaper } from "./PositionPaper";
import { Speeches } from "./Speeches";
import { TitleCard } from "./TitleCard";

export default function MunWorld({ progress }: WorldProps) {
  const stage = useStage();
  const origin = usePortalOrigin();
  const L = useMemo(
    () => buildLayout(stage.width, stage.height, stage.isMobile, stage.lowPower),
    [stage.width, stage.height, stage.isMobile, stage.lowPower],
  );
  const dot = useRef<Dot | null>(null);

  return (
    <div data-mun-world className="absolute inset-0 overflow-hidden" style={{ background: RISO.cobalt }}>
      <HallCanvas L={L} progress={progress} dot={dot} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 1, background: `radial-gradient(120% 95% at 50% 46%, ${alpha(RISO.ink, 0)} 58%, ${alpha(RISO.ink, 0.3)} 100%)` }}
      />
      <TitleCard L={L} progress={progress} dot={dot} />
      <PositionPaper L={L} progress={progress} />
      <Speeches L={L} progress={progress} />
      <JoshCard L={L} progress={progress} />
      {/* the house the threads stitch: the next portal is born exactly here */}
      <div ref={origin} aria-hidden className="pointer-events-none absolute" style={{ left: L.house.x, top: L.house.y, width: L.house.size, height: L.house.size }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 20 }}>
        <div className="riso-grain" />
      </div>
    </div>
  );
}
