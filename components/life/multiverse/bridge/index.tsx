"use client";

/**
 * The bridge: an exact replica of the hero's final frame ("Here's the gist of
 * it."). The multiverse stage sticks the instant the hero's stage releases,
 * showing this identical frame on top, so nothing visibly changes — until the
 * first portal (a mic) opens out of the full stop.
 *
 * The markup mirrors LifeHero's phrase-2 overlay exactly (same classes, same
 * per-character span nesting) so glyph positions match to the pixel.
 */

import type { WorldModule, WorldProps } from "../types";
import { usePortalOrigin } from "../runtime";

const TEXT = "Here's the gist of it";

function BridgeWorld(_: WorldProps) {
  const origin = usePortalOrigin();
  return (
    <div className="absolute inset-0 bg-bg">
      <div className="absolute inset-x-0 top-0 h-screen overflow-hidden bg-bg">
        <div className="grid-bg absolute inset-0 z-0 opacity-40" aria-hidden />
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-bg/90 px-6 md:px-12">
          <div className="absolute inset-0 flex items-center justify-center px-6 pb-[8vh] md:px-12" style={{ filter: "blur(0px)" }}>
            <h2 className="max-w-4xl text-center font-sans text-3xl font-medium leading-tight tracking-tight text-fg md:text-5xl lg:text-6xl">
              <span>
                <span className="">
                  <span className="">
                    {TEXT.split("").map((ch, i) => (
                      <span key={i}>{ch}</span>
                    ))}
                    <span className="relative">
                      .
                      <span ref={origin} aria-hidden className="absolute bottom-[0.3em] left-1/2 h-0 w-0" />
                    </span>
                  </span>
                </span>
              </span>
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}

function BridgeStatic() {
  return null;
}

export const world: WorldModule = {
  meta: {
    id: "bridge",
    number: "00",
    label: "The gist",
    title: "Here's the gist of it.",
    age: null,
    length: 0.3,
    icon: null,
    bg: "#0a0a0a",
    accent: "#F1EADB",
  },
  World: BridgeWorld,
  Static: BridgeStatic,
};
