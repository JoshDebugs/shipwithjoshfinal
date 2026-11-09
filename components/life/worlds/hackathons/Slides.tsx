"use client";

/**
 * Presentation mode of this same page: three slides that wipe over the poster
 * while the page hangs keystoned on the wall. Each result gets its own look,
 * its own entrance, and a long hold: this is where the facts are read.
 */
import type { CSSProperties, ReactNode } from "react";
import { C, FONT, alpha } from "./colors";
import { EVENTS } from "./copy";
import type { Geo } from "./geometry";
import type { Refs } from "./engine";

/** Real houndstooth, from the weave: 8×8 threads, 2/2 twill. */
const HOUNDSTOOTH = (() => {
  let d = "";
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const warpDark = x % 8 < 4;
      const weftDark = y % 8 < 4;
      const warpOnTop = (x + y) % 4 < 2;
      if (warpOnTop ? warpDark : weftDark) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return d;
})();

const houndstoothUrl = (ink: string, cell: number) =>
  `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${cell * 8}' height='${cell * 8}' viewBox='0 0 8 8' shape-rendering='crispEdges'><path d='${HOUNDSTOOTH}' fill='${ink}'/></svg>`,
  )}")`;

const anybody = (size: number, weight: number, wdth: number): CSSProperties => ({
  fontFamily: FONT.anybody,
  fontWeight: weight,
  fontSize: size,
  lineHeight: 0.98,
  fontVariationSettings: `"wdth" ${wdth}`,
});

/** Anybody 900 width of each result (em), at its slide's wdth. */
const RESULT_EM = { "~4th": 3.0, "2nd": 2.647, "participated.": 4.122 } as const;

function Frame({ R, k, bg, children }: { R: Refs; k: number; bg: CSSProperties; children: ReactNode }) {
  return (
    <div
      ref={(el) => {
        R.slides[k] = el;
      }}
      className="absolute inset-0"
      style={{ ...bg, visibility: "hidden", clipPath: "inset(0 0 0 100%)" }}
    >
      {children}
    </div>
  );
}

function Foot({ g, k, color, plate }: { g: Geo; k: number; color: string; plate?: string }) {
  const u = g.u;
  const label: CSSProperties = plate ? { background: plate, padding: `${Math.round(3 * u)}px ${Math.round(10 * u)}px` } : {};
  const f = Math.round((g.mobile ? 15 : 20) * u);
  const pad = Math.round((g.mobile ? 22 : 44) * u);
  return (
    <div className="absolute flex items-center justify-between" style={{ left: pad, right: pad, bottom: Math.round((g.mobile ? 34 : 38) * u), color, fontFamily: FONT.mono, fontSize: f, fontWeight: 600 }}>
      <span style={label}>hack/josh · presentation mode</span>
      <span style={label}>{k + 1} / 3</span>
    </div>
  );
}

function Blueprint({ g, R }: { g: Geo; R: Refs }) {
  const u = g.u;
  const ev = EVENTS[0];
  const cell = Math.round(48 * u);
  const pad = Math.round((g.mobile ? 24 : 56) * u);
  const inner = g.W - 2 * pad;
  // "Productathon" is the longest line: about 7.5em at this width on a phone
  const fsT = g.mobile ? Math.floor(inner / 7.5) : Math.round(92 * u);
  // a phone slide is tall: a condensed cut fills it where a wide one could not
  const fsR = g.mobile ? inner / 2.05 : Math.min(Math.round(430 * u), inner / RESULT_EM["~4th"]);
  return (
    <Frame
      R={R}
      k={0}
      bg={{
        background: C.cobalt,
        backgroundImage: `linear-gradient(${alpha(C.paper, 0.16)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(C.paper, 0.16)} 1px, transparent 1px), linear-gradient(${alpha(C.paper, 0.34)} 1.5px, transparent 1.5px), linear-gradient(90deg, ${alpha(C.paper, 0.34)} 1.5px, transparent 1.5px)`,
        backgroundSize: `${cell}px ${cell}px, ${cell}px ${cell}px, ${cell * 5}px ${cell * 5}px, ${cell * 5}px ${cell * 5}px`,
      }}
    >
      <div className="absolute flex flex-col" style={{ left: pad, right: pad, top: Math.round((g.mobile ? 70 : 52) * u), color: C.paper }}>
        <div style={{ fontFamily: FONT.mono, fontSize: Math.round((g.mobile ? 15 : 20) * u), fontWeight: 600, marginBottom: Math.round(14 * u) }}>SHEET A-01 · RESULT</div>
        <div style={anybody(fsT, 800, g.mobile ? 92 : 118)}>
          {ev.lines.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
      </div>
      <div className="absolute" style={{ left: pad, right: pad, bottom: Math.round((g.mobile ? 108 : 92) * u), color: C.paper }}>
        <div
          ref={(el) => {
            R.slideResult[0] = el;
          }}
          style={{ ...anybody(fsR, 900, g.mobile ? 75 : 125), lineHeight: 0.84, textAlign: "center", whiteSpace: "nowrap", textShadow: `${Math.round(8 * u)}px ${Math.round(8 * u)}px 0 ${C.ink}` }}
        >
          {ev.result}
        </div>
        <div
          ref={(el) => {
            R.slideDim = el;
          }}
          aria-hidden
          style={{ marginTop: Math.round(20 * u), transformOrigin: "0 50%" }}
        >
          <svg viewBox="0 0 400 22" preserveAspectRatio="none" className="block w-full" style={{ height: Math.round(22 * u) }}>
            <path d="M1 0 V22 M399 0 V22 M1 11 H399" stroke={C.paper} strokeWidth={1.5} vectorEffect="non-scaling-stroke" fill="none" />
          </svg>
        </div>
      </div>
      <Foot g={g} k={0} color={C.paper} />
    </Frame>
  );
}

function Runway({ g, R }: { g: Geo; R: Refs }) {
  const u = g.u;
  const ev = EVENTS[1];
  const cell = Math.round((g.mobile ? 7 : 11) * u);
  const px = Math.round((g.mobile ? 18 : 64) * u);
  const bw = Math.max(3, Math.round(5 * u));
  const padP = Math.round((g.mobile ? 18 : 40) * u);
  const inner = g.W - 2 * px - 2 * bw - 2 * padP;
  // a phone gets four short lines; "Fashion Design" is the longest at about 7.8em
  const fsT = g.mobile ? Math.floor(inner / 7.8) : Math.round(80 * u);
  const titleLines = g.mobile ? ["Ashoka", "University", "Fashion Design", "Hackathon"] : ev.lines;
  const fsR = g.mobile ? inner / 1.85 : Math.min(Math.round(420 * u), (inner - 12 * u) / RESULT_EM["2nd"]);
  return (
    <Frame R={R} k={1} bg={{ background: C.paper, backgroundImage: houndstoothUrl(C.ink, cell) }}>
      <div
        className="absolute flex flex-col justify-between"
        style={{
          left: px,
          right: px,
          top: Math.round((g.mobile ? 72 : 66) * u),
          bottom: Math.round((g.mobile ? 104 : 92) * u),
          background: C.pink,
          color: C.ink,
          border: `${bw}px solid ${C.ink}`,
          padding: padP,
        }}
      >
        <div style={anybody(fsT, 800, g.mobile ? 82 : 104)}>
          {titleLines.map((l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {l}
            </div>
          ))}
        </div>
        <div
          ref={(el) => {
            R.slideResult[1] = el;
          }}
          style={{ ...anybody(fsR, 900, g.mobile ? 75 : 125), lineHeight: 0.8, color: C.paper, textShadow: `${Math.round(9 * u)}px ${Math.round(9 * u)}px 0 ${C.ink}`, alignSelf: "flex-end", whiteSpace: "nowrap", transformOrigin: "100% 100%", marginRight: Math.round(8 * u) }}
        >
          {ev.result}
        </div>
      </div>
      <Foot g={g} k={1} color={C.ink} plate={C.paper} />
    </Frame>
  );
}

function Deadpan({ g, R }: { g: Geo; R: Refs }) {
  const u = g.u;
  const ev = EVENTS[2];
  const fsT = Math.round((g.mobile ? 52 : 84) * u);
  const fsR = Math.min(Math.round((g.mobile ? 84 : 300) * u), (g.W - 48 * u) / RESULT_EM["participated."]);
  const fsN = Math.round((g.mobile ? 22 : 44) * u);
  return (
    <Frame R={R} k={2} bg={{ background: C.paper }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ color: C.ink, gap: Math.round((g.mobile ? 24 : 30) * u), padding: `0 ${Math.round(24 * u)}px` }}>
        <div style={anybody(fsT, 500, g.mobile ? 86 : 100)}>{g.mobile ? ev.lines.map((l) => <div key={l}>{l}</div>) : ev.name}</div>
        <div
          ref={(el) => {
            R.slideResult[2] = el;
          }}
          style={{ ...anybody(fsR, 900, 50), lineHeight: 0.92, whiteSpace: "nowrap" }}
        >
          {ev.result.split("").map((c, i) => (
            <span
              key={i}
              ref={(el) => {
                R.slideChars[i] = el;
              }}
              style={{ visibility: "hidden" }}
            >
              {c}
            </span>
          ))}
        </div>
        <div
          ref={(el) => {
            R.slideNote = el;
          }}
          style={{ fontFamily: FONT.mono, fontSize: fsN, fontWeight: 500, opacity: 0 }}
        >
          {ev.note}
        </div>
      </div>
      <Foot g={g} k={2} color={C.ink} />
    </Frame>
  );
}

export function Slides({ g, R }: { g: Geo; R: Refs }) {
  return (
    <>
      <Blueprint g={g} R={R} />
      <Runway g={g} R={R} />
      <Deadpan g={g} R={R} />
    </>
  );
}
