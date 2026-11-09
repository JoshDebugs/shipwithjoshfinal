"use client";

/** Everything that isn't the poster: floods, bucket, status bar, projector, VHS, the whorl and the motto. */
import { C, FONT, RAW, alpha } from "./colors";
import { COMMITS, COPY } from "./copy";
import type { Geo } from "./geometry";
import type { Refs } from "./engine";

/* ---------------------------------------------------------------- floods */

const FLOOD_INK = [C.pink, C.sun, C.cobalt] as const;

/** One overprinted ink: solid disc with two tiers of halftone riding its edge. */
export function Floods({ g, R }: { g: Geo; R: Refs }) {
  const dot = Math.max(9, 15 * g.u);
  return (
    <>
      {FLOOD_INK.map((ink, k) => (
        <svg
          key={k}
          aria-hidden
          ref={(el) => {
            R.floodSvg[k] = el;
          }}
          className="pointer-events-none absolute inset-0"
          width={g.W}
          height={g.H}
          style={{ mixBlendMode: "multiply", visibility: "hidden" }}
        >
          <defs>
            <pattern id={`hk-f${k}a`} width={dot} height={dot} patternUnits="userSpaceOnUse" patternTransform={`rotate(${22 + k * 21})`}>
              <circle cx={dot / 2} cy={dot / 2} r={dot * 0.38} fill={ink} />
            </pattern>
            <pattern id={`hk-f${k}b`} width={dot} height={dot} patternUnits="userSpaceOnUse" patternTransform={`rotate(${22 + k * 21})`}>
              <circle cx={dot / 2} cy={dot / 2} r={dot * 0.2} fill={ink} />
            </pattern>
          </defs>
          <circle
            ref={(el) => {
              R.floodB[k] = el;
            }}
            fill={`url(#hk-f${k}b)`}
          />
          <circle
            ref={(el) => {
              R.floodA[k] = el;
            }}
            fill={`url(#hk-f${k}a)`}
          />
          <circle
            ref={(el) => {
              R.floodC[k] = el;
            }}
            fill={ink}
          />
        </svg>
      ))}
    </>
  );
}

/* ----------------------------------------------------------------- rings */

const RING_INK = [C.pink, C.cobalt, C.sun, C.pink, C.teal] as const;

/** Halftone shock rings, one per hard landing (no flashes: these are the impact). */
export function Rings({ g, R }: { g: Geo; R: Refs }) {
  const r = Math.round((g.mobile ? 120 : 220) * g.u);
  const dot = Math.max(7, Math.round(11 * g.u));
  return (
    <>
      {Array.from({ length: 8 }, (_, k) => {
        const ink = RING_INK[k % RING_INK.length];
        const mask = "radial-gradient(closest-side, transparent 52%, #000 60%, #000 74%, transparent 84%)";
        return (
          <i
            key={k}
            aria-hidden
            ref={(el) => {
              R.rings[k] = el;
            }}
            className="pointer-events-none absolute"
            style={{
              left: -r,
              top: -r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: "50%",
              visibility: "hidden",
              backgroundImage: `radial-gradient(circle, ${ink} 40%, transparent 44%)`,
              backgroundSize: `${dot}px ${dot}px`,
              maskImage: mask,
              WebkitMaskImage: mask,
              mixBlendMode: "multiply",
              willChange: "transform, opacity",
            }}
          />
        );
      })}
    </>
  );
}

/* ---------------------------------------------------------------- bucket */

export function Bucket({ g, R }: { g: Geo; R: Refs }) {
  const s = Math.round((g.mobile ? 58 : 84) * g.u);
  return (
    <div
      aria-hidden
      ref={(el) => {
        R.bucket = el;
      }}
      className="pointer-events-none absolute left-0 top-0"
      style={{ width: s, height: s, visibility: "hidden", willChange: "transform", color: C.pink }}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" style={{ overflow: "visible" }}>
        <g transform="rotate(-28 32 32)">
          <path d="M16 11 Q32 -14 48 11" fill="none" stroke={C.ink} strokeWidth={3.4} strokeLinecap="round" />
          <path d="M12 19 H52 L46.5 56 Q45.8 60 41 60 H23 Q18.2 60 17.5 56 Z" fill="currentColor" stroke={C.ink} strokeWidth={3.4} strokeLinejoin="round" />
          <ellipse cx="32" cy="19" rx="20" ry="6" fill={C.paper} stroke={C.ink} strokeWidth={3.4} />
        </g>
        <path d="M6 50 Q0 60 6 64 Q12 60 6 50 Z" fill="currentColor" stroke={C.ink} strokeWidth={2.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------ status bar */

/** Clear of the film's HUD pill: bottom-right, about 300 wide on desktop. */
const HUD_CLEAR = 330;

export function StatusBar({ g, R }: { g: Geo; R: Refs }) {
  const padded = COMMITS.map(([h, m]) => `${h} ${m}`).join("   ·   ");
  const caret = (
    <span
      ref={(el) => {
        R.statusCaret = el;
      }}
      style={{ display: "inline-block", width: "0.55em", height: "1.05em", marginLeft: 4, background: C.sun, verticalAlign: "-0.14em" }}
    />
  );
  const state = (
    <span
      ref={(el) => {
        R.statusText = el;
      }}
      style={{ whiteSpace: "pre" }}
    >
      age 18 · compiling…
    </span>
  );
  if (g.mobile) {
    // two lines at the left; the film's HUD pill sits in the bar's right half
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-center"
        style={{ height: g.status, padding: "0 12px", background: C.ink, color: C.paper, fontFamily: FONT.mono, fontSize: 10.5, lineHeight: 1.4, zIndex: 40 }}
      >
        <div style={{ whiteSpace: "pre", color: alpha(C.paper, 0.72) }}>{COPY.url}</div>
        <div style={{ color: C.sun, fontWeight: 600 }}>
          {state}
          {caret}
        </div>
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center overflow-hidden"
      style={{ height: g.status, paddingRight: HUD_CLEAR, background: C.ink, color: C.paper, fontFamily: FONT.mono, fontSize: 12.5, zIndex: 40 }}
    >
      <div className="flex shrink-0 items-center" style={{ padding: "0 16px", height: "100%", whiteSpace: "pre" }}>
        <span style={{ color: alpha(C.paper, 0.72) }}>{COPY.url} · </span>
        <span style={{ color: C.sun, fontWeight: 600 }}>{state}</span>
        {caret}
      </div>
      <div
        className="relative h-full flex-1 overflow-hidden"
        style={{ opacity: 0.7, borderLeft: `1px solid ${alpha(C.paper, 0.2)}`, maskImage: "linear-gradient(90deg, #000 86%, transparent)", WebkitMaskImage: "linear-gradient(90deg, #000 86%, transparent)" }}
      >
        <div
          ref={(el) => {
            R.tickerTrack = el;
          }}
          className="absolute left-0 top-0 flex h-full items-center"
          style={{ whiteSpace: "pre", willChange: "transform", color: C.paper, paddingLeft: 14 }}
        >
          <span
            ref={(el) => {
              R.tickerA = el;
            }}
          >
            {padded}
            {"   ·   "}
          </span>
          <span>{padded}{"   ·   "}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- projector */

export function Projector({ g, R }: { g: Geo; R: Refs }) {
  const u = g.u;
  const [lx, ly] = g.proj.lens;
  const bw = Math.round((g.mobile ? 130 : 188) * u);
  const bh = Math.round((g.mobile ? 34 : 46) * u);
  const lens = Math.round((g.mobile ? 22 : 30) * u);
  return (
    <>
      <svg
        aria-hidden
        ref={(el) => {
          R.cone = el;
        }}
        className="pointer-events-none absolute inset-0"
        width={g.W}
        height={g.H}
        style={{ opacity: 0 }}
      >
        <defs>
          <radialGradient id="hk-beam" gradientUnits="userSpaceOnUse" cx={lx} cy={ly} r={g.H * 0.95}>
            <stop offset="0" stopColor={C.paper} stopOpacity={0.5} />
            <stop offset="0.45" stopColor={C.paper} stopOpacity={0.14} />
            <stop offset="1" stopColor={C.paper} stopOpacity={0.05} />
          </radialGradient>
        </defs>
        <polygon
          ref={(el) => {
            R.conePoly = el;
          }}
          fill="url(#hk-beam)"
        />
      </svg>
      <canvas
        aria-hidden
        ref={(el) => {
          R.dust = el;
        }}
        className="pointer-events-none absolute left-0 top-0"
        style={{ visibility: "hidden" }}
      />
      <div
        aria-hidden
        ref={(el) => {
          R.projector = el;
        }}
        className="pointer-events-none absolute"
        style={{
          left: lx - bw / 2,
          top: ly - bh * 0.3,
          width: bw,
          height: bh,
          background: C.inkLift2,
          border: `2px solid ${alpha(C.paper, 0.2)}`,
          borderRadius: Math.round(9 * u),
          opacity: 0,
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            left: bw / 2 - lens / 2 - 2,
            top: -lens * 0.45,
            width: lens,
            height: lens,
            background: C.paper,
            boxShadow: `0 0 ${Math.round(34 * u)}px ${Math.round(9 * u)}px ${alpha(C.paper, 0.45)}`,
            border: `2px solid ${C.inkLift2}`,
          }}
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------- VHS */

export function VHS({ g, R }: { g: Geo; R: Refs }) {
  const fs = Math.round((g.mobile ? 22 : 34) * g.u);
  return (
    <div
      aria-hidden
      ref={(el) => {
        R.vhs = el;
      }}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ visibility: "hidden", zIndex: 30 }}
    >
      <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(0deg, ${alpha(C.ink, 0.2)} 0 1px, transparent 1px 3px)` }} />
      {[0, 1, 2].map((k) => (
        <div
          key={k}
          ref={(el) => {
            R.vhsBars[k] = el;
          }}
          className="absolute inset-x-0 top-0"
          style={{
            height: Math.round((26 + k * 26) * g.u),
            background: `linear-gradient(90deg, ${alpha(C.paper, 0.32)}, ${alpha(C.pink, 0.26)} 40%, ${alpha(C.cobalt, 0.3)} 75%, ${alpha(C.paper, 0.25)})`,
            filter: "blur(2px)",
            mixBlendMode: "screen",
            willChange: "transform",
          }}
        />
      ))}
      <div
        className="absolute"
        style={{
          left: g.m,
          top: Math.max(100, 106 * g.u),
          color: C.sun,
          fontFamily: FONT.mono,
          fontWeight: 800,
          fontSize: fs,
          letterSpacing: "0.04em",
          textShadow: `2px 2px 0 ${C.ink}`,
        }}
      >
        ◀◀ REW
        <div
          ref={(el) => {
            R.vhsTime = el;
          }}
          style={{ fontSize: Math.round(fs * 0.7), fontWeight: 700, marginTop: Math.round(4 * g.u) }}
        >
          00:00:00
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- crosshair / laser */

export function Cursors({ g, R }: { g: Geo; R: Refs }) {
  const s = Math.round(46 * g.u);
  const dot = Math.round((g.mobile ? 13 : 16) * g.u);
  return (
    <>
      <div
        aria-hidden
        ref={(el) => {
          R.crosshair = el;
        }}
        className="pointer-events-none absolute left-0 top-0"
        style={{ width: s, height: s, marginLeft: -s / 2, marginTop: -s / 2, visibility: "hidden", willChange: "transform", zIndex: 35 }}
      >
        <svg viewBox="0 0 46 46" className="h-full w-full" style={{ overflow: "visible" }}>
          <path d="M23 0 V17 M23 29 V46 M0 23 H17 M29 23 H46" stroke={C.ink} strokeWidth={2.4} />
          <rect x="17" y="17" width="12" height="12" fill="none" stroke={C.pink} strokeWidth={2.4} />
        </svg>
      </div>
      <div
        aria-hidden
        ref={(el) => {
          R.laser = el;
        }}
        className="pointer-events-none absolute left-0 top-0 rounded-full"
        style={{
          width: dot,
          height: dot,
          marginLeft: -dot / 2,
          marginTop: -dot / 2,
          background: C.pink,
          boxShadow: `0 0 ${Math.round(10 * g.u)}px ${Math.round(4 * g.u)}px ${alpha(C.pink, 0.6)}, 0 0 ${Math.round(34 * g.u)}px ${Math.round(12 * g.u)}px ${alpha(C.pink, 0.26)}`,
          visibility: "hidden",
          willChange: "transform",
          zIndex: 35,
        }}
      />
    </>
  );
}

/* -------------------------------------------------------- whorl + motto */

const RING_DEFS = [
  { rx: 18.5, ry: 23, dash: undefined },
  { rx: 25, ry: 31, dash: "120 9" },
  { rx: 31.5, ry: 39, dash: "150 12 40 10" },
  { rx: 38, ry: 46.5, dash: "190 14" },
];

export function Finale({ g, R, origin }: { g: Geo; R: Refs; origin: (el: HTMLElement | null) => void }) {
  const { whorl, motto, gitLine } = g;
  const words = motto.lines.map((l) => l.split(" "));
  let idx = 0;
  return (
    <>
      <div
        aria-hidden
        ref={(el) => {
          R.finalFlood = el;
        }}
        className="pointer-events-none absolute inset-0"
        style={{ background: C.sun, visibility: "hidden" }}
      />
      <div
        ref={(el) => {
          R.whorl = el;
          origin(el);
        }}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: whorl.x, top: whorl.y, width: whorl.w, height: whorl.h, visibility: "hidden", willChange: "transform" }}
      >
        <div
          ref={(el) => {
            R.whorlFace = el;
          }}
          className="absolute left-1/2 top-1/2 overflow-hidden"
          style={{ background: RAW.box, border: `1px solid ${RAW.boxLine}`, transform: "translate(-50%, -50%)" }}
        >
          <svg
            ref={(el) => {
              R.whorlX = el;
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <path d="M0 0 L100 100 M100 0 L0 100" stroke={RAW.boxLine} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" fill={C.ink} style={{ overflow: "visible" }}>
          <ellipse
            ref={(el) => {
              R.whorlRings[0] = el;
            }}
            cx={50}
            cy={52}
            rx={12}
            ry={15}
          />
          {RING_DEFS.map((d, k) => (
            <ellipse
              key={k}
              ref={(el) => {
                R.whorlRings[k + 1] = el;
              }}
              cx={50}
              cy={52}
              rx={d.rx}
              ry={d.ry}
              fill="none"
              stroke={C.ink}
              strokeWidth={4}
              strokeDasharray={d.dash}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
            />
          ))}
        </svg>
      </div>
      <h2
        ref={(el) => {
          R.motto = el;
        }}
        className="pointer-events-none absolute left-0 right-0"
        style={{
          top: motto.y,
          margin: 0,
          textAlign: "center",
          color: C.ink,
          fontFamily: FONT.anybody,
          fontWeight: 900,
          fontSize: motto.fs,
          lineHeight: `${motto.lineH}px`,
          visibility: "hidden",
        }}
      >
        <span className="sr-only">{COPY.headline}</span>
        <span aria-hidden>
          {words.map((line, l) => (
            <div key={l} style={{ whiteSpace: "nowrap" }}>
              {line.map((w, k) => {
                const i = idx++;
                return (
                  <span
                    key={w}
                    ref={(el) => {
                      R.mottoWords[i] = el;
                    }}
                    style={{ display: "inline-block", marginRight: k < line.length - 1 ? "0.26em" : 0, fontVariationSettings: `"wdth" ${motto.wdth}`, willChange: "transform" }}
                  >
                    {w}
                  </span>
                );
              })}
            </div>
          ))}
        </span>
      </h2>
      <div
        ref={(el) => {
          R.gitLine = el;
        }}
        className="pointer-events-none absolute left-0 right-0 text-center"
        style={{ top: gitLine.y, color: C.ink, fontFamily: FONT.mono, fontWeight: 600, fontSize: Math.round((g.mobile ? 13 : 22) * g.u), visibility: "hidden" }}
      >
        ${" "}
        {COPY.git}
        {"  "}
        <span style={{ opacity: 0.7 }}>{COPY.gitComment}</span>
      </div>
    </>
  );
}
