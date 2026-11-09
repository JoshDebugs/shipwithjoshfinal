"use client";

/**
 * Reduced-motion "Eyes On Me": one still poster in normal flow. A crowd of
 * sticker eyes (a dozen with sun irises — the followers) all look at the
 * headline; the counters sit at their final values; every line is here.
 * No blink, no swarm, no tracking.
 */

import { useMemo, type CSSProperties } from "react";
import { useStage } from "@/components/life/multiverse/runtime";
import { RISO } from "@/components/life/multiverse/palette";
import { iconSvg } from "@/components/life/multiverse/portalIcons";
import { hash } from "@/components/life/multiverse/ease";
import { OEye } from "./OEye";
import { StickerEye } from "./StickerEye";
import { FONT, axes, monoLabel, sticker } from "./lids";

function Crowd({ cols, rows, width, focus }: { cols: number; rows: number; width: number; focus: [number, number] }) {
  const cell = width / cols;
  const pitch = cell * 0.78;
  const height = rows * pitch + cell * 0.2;
  const eyes = useMemo(() => {
    const out: { x: number; y: number; s: number; look: [number, number]; iris: string; key: number }[] = [];
    let n = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols + 1; c++) {
        const i = r * 97 + c;
        const x = (c + (r % 2 ? 0 : 0.5)) * cell + (hash(i) - 0.5) * cell * 0.12;
        const y = pitch * 0.62 + r * pitch + (hash(i + 31) - 0.5) * cell * 0.08;
        if (x < cell * 0.3 || x > width - cell * 0.3) continue;
        const fx = focus[0] * width;
        const fy = focus[1] * height;
        const d = Math.hypot(fx - x, fy - y) || 1;
        const sun = hash(i + 7) < 0.17 && n < 14;
        if (sun) n++;
        out.push({
          x,
          y,
          s: cell * (0.8 + 0.12 * hash(i + 3)),
          look: [((fx - x) / d) * 0.95, ((fy - y) / d) * 0.95],
          iris: sun ? RISO.sun : hash(i + 11) < 0.3 ? RISO.teal : RISO.cobalt,
          key: i,
        });
      }
    }
    return out;
  }, [cols, rows, width, focus, cell, pitch, height]);
  return (
    <svg aria-hidden viewBox={`0 0 ${width} ${height}`} className="block w-full" style={{ height: "auto", overflow: "visible" }}>
      {eyes.map((e) => (
        <StickerEye key={e.key} x={e.x} y={e.y} size={e.s} look={e.look} iris={e.iris} />
      ))}
    </svg>
  );
}

export default function SocialStatic() {
  const stage = useStage();
  const mobile = stage.isMobile;
  const any = (wdth: number, wght: number): CSSProperties => ({ fontFamily: FONT.anybody, fontVariationSettings: axes(wdth, wght) });
  const o: CSSProperties = { width: "0.9em", height: "0.72em", verticalAlign: "-0.012em", margin: "0 0.02em" };
  // measured against the stage, not vw: on phones the longest lines must fit its 20px gutters
  const gutterless = stage.width - 40;
  const big = mobile ? Math.min(92, gutterless / 3.9) : 132;

  return (
    <div className="relative overflow-hidden px-5 pb-24 pt-24 md:px-14 md:pb-28 md:pt-40" style={{ background: RISO.pink, color: RISO.ink }}>
      <div className="mx-auto max-w-6xl">
        <p className="text-center" style={monoLabel(mobile ? 10.5 : 13)}>
          {mobile ? (
            <>
              World 04 · Age 15
              <br />
              Instagram content creation
            </>
          ) : (
            "World 04 · Age 15 · Instagram content creation"
          )}
        </p>
        <h2
          aria-label="Look at me."
          className="mt-5 text-center"
          style={{ ...any(150, 900), fontSize: mobile ? Math.min(gutterless / 5.05, 76) : "min(13vw, 168px)", lineHeight: 0.86, letterSpacing: "-0.012em" }}
        >
          <span aria-hidden className="block whitespace-nowrap">
            L
            <OEye style={o} gaze={[0, 0.9]} />
            <OEye style={o} gaze={[0, 0.9]} />K
          </span>
          <span aria-hidden className="block whitespace-nowrap">
            AT ME.
          </span>
        </h2>

        <div className="mt-10 md:mt-14">
          <Crowd cols={mobile ? 9 : 16} rows={mobile ? 3 : 3} width={1000} focus={[0.3, 2.2]} />
        </div>

        <div className="mt-8 grid gap-10 md:mt-12 md:grid-cols-[1.15fr_1fr] md:gap-14">
          <div>
            <p style={monoLabel(mobile ? 10.5 : 12)}>
              Age 15. Instagram. {mobile && <br />}One goal: get looked at.
            </p>
            <h3 className="mt-3" style={{ ...any(96, 700), fontSize: mobile ? 26 : 42, lineHeight: 1.04 }}>
              Before I knew what a startup was, I was already trying to get strangers on the internet to pay attention.
            </h3>
            <div className="mt-10 flex flex-wrap items-end gap-x-10 gap-y-6">
              <div>
                <p style={monoLabel(12)}>Views</p>
                <p style={{ ...any(150, 900), ...sticker(big, 0.06, 0.055), fontSize: big, lineHeight: 0.92 }}>10M+</p>
              </div>
              <div>
                <p style={monoLabel(12)}>Followers</p>
                <p style={{ ...any(130, 880), ...sticker(big, 0.06, 0.055), color: RISO.sun, fontSize: big, lineHeight: 0.92 }}>2K+</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-6 md:pt-6">
            <span
              style={{
                ...any(100, 640),
                fontSize: mobile ? 16 : 20,
                lineHeight: 1.25,
                background: RISO.paper,
                border: `2.5px solid ${RISO.ink}`,
                boxShadow: `5px 6px 0 ${RISO.ink}`,
                borderRadius: 22,
                padding: "10px 20px",
              }}
            >
              10M+ views. This is what that feels like from the inside.
            </span>
            <p style={{ fontFamily: FONT.bagel, fontSize: mobile ? 30 : 40, lineHeight: 1.1, ...sticker(mobile ? 30 : 40) }}>Then everyone blinks.</p>
            <p style={{ fontFamily: FONT.bagel, fontSize: mobile ? 38 : 54, lineHeight: 1.04 }}>
              <span className="block" style={sticker(mobile ? 38 : 54)}>
                10M+ looked.
              </span>
              <span className="block" style={{ ...sticker(mobile ? 38 : 54), color: RISO.sun }}>
                2K+ stayed.
              </span>
            </p>
            <p style={{ fontFamily: FONT.bagel, fontSize: mobile ? 26 : 34, lineHeight: 1.1, ...sticker(mobile ? 26 : 34) }}>
              2K+ followers. They follow. Literally.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start gap-6 md:mt-20 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 style={{ ...any(92, 820), fontSize: mobile ? 32 : 54, lineHeight: 1.0, letterSpacing: "-0.01em" }}>
              Attention is easy to get and hard to keep.
            </h3>
            <p className="mt-4" style={{ fontFamily: FONT.bagel, fontSize: mobile ? 28 : 40, lineHeight: 1.1, ...sticker(mobile ? 28 : 40) }}>
              Noted, for later.
            </p>
          </div>
          <div
            aria-hidden
            className="relative shrink-0 self-end [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
            style={{ width: mobile ? 120 : 170, height: mobile ? 120 : 170 }}
          >
            <div className="absolute inset-0" style={{ transform: "translate(4px, 5px)" }} dangerouslySetInnerHTML={{ __html: iconSvg("gavel", RISO.ink) }} />
            <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: iconSvg("gavel", RISO.cobalt) }} />
          </div>
        </div>
      </div>
    </div>
  );
}
