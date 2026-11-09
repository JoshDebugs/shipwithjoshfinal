"use client";

/**
 * The poster, as a pile of absolutely positioned pieces. Each skin is plain
 * DOM/SVG; the engine only ever moves the outer element with transforms.
 */
import { memo, type CSSProperties } from "react";
import { C, DEPTH, FONT, VERB_INK, alpha } from "./colors";
import { COPY, EVENTS } from "./copy";
import { CAP, planeOf, type Geo, type PieceDef } from "./geometry";
import type { Refs } from "./engine";

/** Text colour that reads on each debug ink. */
const onDepth = (d: number) => (d % 4 === 3 ? C.ink : C.paper);

/** An ink whose alpha follows debug mode (CSS variable), so a repaint isn't per-frame JS. */
function debugInk(hex: string, k = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / calc(var(--hk-debug, 0) * ${k}))`;
}

const RESULT_EM: Record<string, { em: number; wdth: number }> = {
  "~4th": { em: 3.0, wdth: 125 },
  "2nd": { em: 2.647, wdth: 125 },
  "participated.": { em: 4.122, wdth: 50 },
};

const CARD_INK = [
  { bg: C.cobalt, fg: C.paper, dot: C.paper },
  { bg: C.sun, fg: C.ink, dot: C.ink },
  { bg: C.teal, fg: C.paper, dot: C.paper },
] as const;

function dotField(color: string, size: number): CSSProperties {
  return {
    backgroundImage: `radial-gradient(circle, ${color} 42%, transparent 45%)`,
    backgroundSize: `${size}px ${size}px`,
  };
}

function Card({ def, g, R, i }: { def: PieceDef; g: Geo; R: Refs; i: number }) {
  const ev = EVENTS[def.index];
  const ink = CARD_INK[def.index];
  const { pad, fTitle, fResult, fSmall } = g.card;
  const { rect } = def;
  const fit = RESULT_EM[ev.result];
  const bw = Math.max(2, Math.round(3 * g.u));
  const sh = Math.round((g.mobile ? 4 : 7) * g.u);

  if (g.mobile) {
    const fs = Math.min(fResult, (rect.w - 2 * pad - 118 * g.u) / fit.em);
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ background: ink.bg, color: ink.fg, border: `${bw}px solid ${C.ink}`, boxShadow: `${sh}px ${sh}px 0 ${C.ink}` }}>
        <div className="absolute inset-0" style={{ ...dotField(alpha(ink.dot, 0.22), 9 * g.u), maskImage: "linear-gradient(115deg, transparent 42%, #000 100%)", WebkitMaskImage: "linear-gradient(115deg, transparent 42%, #000 100%)" }} />
        <div
          ref={(el) => {
            R.cardInner[i] = el;
          }}
          className="absolute inset-0 flex items-center justify-between"
          style={{ padding: `0 ${pad}px` }}
        >
          <div style={{ fontFamily: FONT.anybody, fontWeight: 800, fontSize: fTitle, lineHeight: 1.08, fontVariationSettings: '"wdth" 100' }}>
            {ev.lines.map((l) => (
              <div key={l} style={{ whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </div>
          <div className="text-right">
            <div style={{ fontFamily: FONT.anybody, fontWeight: 900, fontSize: fs, lineHeight: 0.95, fontVariationSettings: `"wdth" ${fit.wdth}` }}>{ev.result}</div>
            {ev.note && <div style={{ fontFamily: FONT.mono, fontSize: fSmall, marginTop: 3 * g.u }}>{ev.note}</div>}
          </div>
        </div>
      </div>
    );
  }

  const fs = Math.min(fResult, (rect.w - 2 * pad - 4) / fit.em);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: ink.bg, color: ink.fg, border: `${bw}px solid ${C.ink}`, boxShadow: `${sh}px ${sh}px 0 ${C.ink}` }}>
      <div className="absolute inset-0" style={{ ...dotField(alpha(ink.dot, 0.2), 13 * g.u), maskImage: "linear-gradient(130deg, transparent 48%, #000 100%)", WebkitMaskImage: "linear-gradient(130deg, transparent 48%, #000 100%)" }} />
      <div
        ref={(el) => {
          R.cardInner[i] = el;
        }}
        className="absolute inset-0 flex flex-col justify-between"
        style={{ padding: pad }}
      >
        <div className="flex items-start justify-between">
          <div style={{ fontFamily: FONT.anybody, fontWeight: 900, fontSize: fs, lineHeight: 0.9, fontVariationSettings: `"wdth" ${fit.wdth}`, marginTop: -fs * 0.07, whiteSpace: "nowrap" }}>{ev.result}</div>
        </div>
        <div>
          <div style={{ fontFamily: FONT.anybody, fontWeight: 800, fontSize: fTitle, lineHeight: 1.04, fontVariationSettings: '"wdth" 105' }}>
            {ev.lines.map((l) => (
              <div key={l} style={{ whiteSpace: "nowrap" }}>
                {l}
              </div>
            ))}
          </div>
          {ev.note && <div style={{ fontFamily: FONT.mono, fontSize: fSmall + 2, marginTop: 8 * g.u }}>{ev.note}</div>}
        </div>
      </div>
    </div>
  );
}

function Chip({ def, g, R, i }: { def: PieceDef; g: Geo; R: Refs; i: number }) {
  const verb = COPY.verbs[def.index];
  const ink = VERB_INK[def.index];
  const sh = Math.round((g.mobile ? 3 : 4) * g.u);
  const txt: CSSProperties = {
    fontFamily: FONT.anybody,
    fontWeight: 900,
    fontSize: g.chip.fs,
    lineHeight: 1,
    letterSpacing: "0.01em",
    fontVariationSettings: g.mobile ? '"wdth" 100' : '"wdth" 118',
  };
  return (
    <div className="absolute inset-0 grid place-items-center" style={{ background: C.paper, color: C.ink, border: `${Math.max(2, Math.round(3 * g.u))}px solid ${C.ink}`, boxShadow: `${sh}px ${sh}px 0 ${C.ink}` }}>
      <span style={txt}>{verb}</span>
      <div
        ref={(el) => {
          R.chipFill[i] = el;
        }}
        className="absolute inset-0 grid place-items-center"
        style={{ background: ink.bg, color: ink.fg, clipPath: "inset(0 100% 0 0)" }}
      >
        <span style={txt}>{verb}</span>
      </div>
    </div>
  );
}

/** 16-point starburst polygon in a 100 box. */
const STAR = (() => {
  const pts: string[] = [];
  const N = 16;
  for (let k = 0; k < N * 2; k++) {
    const r = k % 2 === 0 ? 50 : 38.5;
    const a = (k / (N * 2)) * Math.PI * 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
})();

function Burst({ def, g, R, i }: { def: PieceDef; g: Geo; R: Refs; i: number }) {
  const big = def.rect.w * 0.3;
  return (
    <div className="absolute inset-0">
      <svg
        ref={(el) => {
          R.spinners[i] = el;
        }}
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        style={{ overflow: "visible" }}
      >
        <polygon points={STAR} fill={C.sun} stroke={C.ink} strokeWidth={2.4} strokeLinejoin="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ color: C.ink, fontFamily: FONT.anybody, fontWeight: 900, lineHeight: 0.92, fontVariationSettings: '"wdth" 120' }}>
        <span style={{ fontSize: big * 0.42, letterSpacing: "0.06em" }}>AGE</span>
        <span style={{ fontSize: big }}>18</span>
      </div>
    </div>
  );
}

function Sticker({ def, g }: { def: PieceDef; g: Geo }) {
  const d = def.rect.w;
  return (
    <div className="absolute inset-0 grid place-items-center rounded-full" style={{ background: C.cobalt, color: C.paper, border: `${Math.max(2, Math.round(3 * g.u))}px solid ${C.ink}` }}>
      <div className="absolute rounded-full" style={{ inset: d * 0.07, border: `1.5px dashed ${alpha(C.paper, 0.7)}` }} />
      <div className="text-center" style={{ fontFamily: FONT.anybody, fontWeight: 900, fontSize: d * 0.2, lineHeight: 0.98, fontVariationSettings: '"wdth" 100' }}>
        NO
        <br />
        SLEEP
      </div>
    </div>
  );
}

function SunDisc({ def, g }: { def: PieceDef; g: Geo }) {
  const dot = Math.max(7, 12 * g.u);
  return (
    <div className="absolute inset-0 overflow-hidden rounded-full" style={{ background: C.sun }}>
      <div className="absolute inset-0" style={{ ...dotField(alpha(C.ink, 0.42), dot), maskImage: "linear-gradient(150deg, transparent 52%, #000 96%)", WebkitMaskImage: "linear-gradient(150deg, transparent 52%, #000 96%)" }} />
    </div>
  );
}

function Checker({ def }: { def: PieceDef }) {
  const h = def.rect.h;
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `repeating-conic-gradient(${C.ink} 0 25%, ${C.paper} 0 50%) 0 0 / ${h}px ${h}px`,
        border: `2px solid ${C.ink}`,
      }}
    />
  );
}

/** True halftone: dot radius grows along the strip. */
function Tile({ def, g }: { def: PieceDef; g: Geo }) {
  const { w, h } = def.rect;
  const step = Math.max(8, 11 * g.u);
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);
  const dots: { x: number; y: number; r: number }[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const t = c / Math.max(1, cols - 1);
      dots.push({ x: (c + 0.5) * step, y: (r + 0.5) * step, r: step * (0.08 + 0.46 * t) });
    }
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      {dots.map((d, k) => (
        <circle key={k} cx={d.x} cy={d.y} r={d.r} fill={C.pink} />
      ))}
    </svg>
  );
}

function Letter({ def, g, R, i }: { def: PieceDef; g: Geo; R: Refs; i: number }) {
  const { fs, wdth } = g.head;
  // in the pile each letter is cut out with a paper keyline and casts a hard shadow,
  // so ink never merges into ink
  const key = Math.max(4, Math.round(fs * 0.05));
  const drop = Math.max(3, Math.round(fs * 0.03));
  const split = g.mobile ? "" : `calc(var(--hk-split, 0) * 1px) 0 0 ${alpha(C.pink, 0.95)}, calc(var(--hk-split, 0) * -1px) 0 0 ${alpha(C.cobalt, 0.95)}, `;
  return (
    <span
      ref={(el) => {
        R.glyphs[i] = el;
      }}
      className="absolute left-0"
      style={{
        top: -CAP.top * fs,
        width: def.rect.w,
        textAlign: "center",
        fontFamily: FONT.anybody,
        fontWeight: 900,
        fontSize: fs,
        lineHeight: 1,
        color: C.ink,
        whiteSpace: "pre",
        fontVariationSettings: `"wdth" ${wdth}`,
        WebkitTextStroke: `${key}px ${debugInk(C.paper)}`,
        paintOrder: "stroke fill",
        textShadow: `${split}${drop + key / 2}px ${drop + key / 2}px 0 ${debugInk(C.ink, 0.3)}`,
      }}
    >
      {def.text}
    </span>
  );
}

function Skin(props: { def: PieceDef; g: Geo; R: Refs; i: number }) {
  const { def, g } = props;
  const u = g.u;
  switch (def.kind) {
    case "letter":
      return <Letter {...props} />;
    case "card":
      return <Card {...props} />;
    case "chip":
      return <Chip {...props} />;
    case "burst":
      return <Burst {...props} />;
    case "sticker":
      return <Sticker def={def} g={g} />;
    case "sun":
      return <SunDisc def={def} g={g} />;
    case "checker":
      return <Checker def={def} />;
    case "tile":
      return <Tile def={def} g={g} />;
    case "slab":
      return <div className="absolute inset-0" style={{ background: C.pink }} />;
    case "tag":
      return (
        <div className="absolute inset-0 grid place-items-center" style={{ background: C.sun, color: C.ink, border: `2px solid ${C.ink}`, fontFamily: FONT.mono, fontWeight: 800, fontSize: Math.round((g.mobile ? 15 : 18) * u), letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
          {def.text}
        </div>
      );
    case "button": {
      const primary = def.index === 0;
      return (
        <div
          className="absolute inset-0 grid place-items-center"
          style={{
            background: primary ? C.ink : C.pink,
            color: primary ? C.paper : C.ink,
            border: `2px solid ${C.ink}`,
            boxShadow: `${Math.round(3 * u)}px ${Math.round(3 * u)}px 0 ${primary ? C.pink : C.ink}`,
            fontFamily: FONT.anybody,
            fontWeight: 800,
            fontSize: Math.round((g.mobile ? 16 : 20) * u),
            fontVariationSettings: '"wdth" 110',
            whiteSpace: "nowrap",
          }}
        >
          {def.text}
        </div>
      );
    }
    case "link":
      return (
        <div className="absolute inset-0 grid place-items-center" style={{ color: C.ink, fontFamily: FONT.mono, fontSize: Math.round(16 * u), textDecoration: "underline", textUnderlineOffset: 3 }}>
          {def.text}
        </div>
      );
    case "logo":
      return (
        <div className="absolute inset-0 flex items-center" style={{ color: C.ink, fontFamily: FONT.anybody, fontWeight: 900, fontSize: Math.round((g.mobile ? 22 : 27) * u), fontVariationSettings: '"wdth" 118', whiteSpace: "nowrap" }}>
          {def.text}
        </div>
      );
    default:
      return null;
  }
}

export const PieceNode = memo(function PieceNode({ def, i, g, R }: { def: PieceDef; i: number; g: Geo; R: Refs }) {
  const { rect } = def;
  const ink = DEPTH[def.depth % 4];
  const round = def.kind === "burst" || def.kind === "sticker" || def.kind === "sun";
  const inset = -Math.round(3 * g.u);
  const plane = planeOf(def.kind);
  // the further back in the pile, the deeper in the shade
  const shade = def.kind === "card" ? 0.26 : plane === 1 ? 0.1 : 0;
  return (
    <div
      ref={(el) => {
        R.pieces[i] = el;
      }}
      aria-hidden
      className="absolute"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, visibility: "hidden", willChange: "transform" }}
    >
      <Skin def={def} g={g} R={R} i={i} />
      {shade > 0 && <i aria-hidden className="pointer-events-none absolute inset-0" style={{ background: C.ink, opacity: `calc(var(--hk-debug, 0) * ${shade})` }} />}
      <i
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: inset,
          top: inset,
          right: inset,
          bottom: inset,
          border: `${Math.max(1.5, 2 * g.u)}px solid ${ink}`,
          borderRadius: round ? "50%" : 0,
          opacity: "var(--hk-debug, 0)",
        }}
      />
      {def.tag && (
        <span
          ref={(el) => {
            R.tags[i] = el;
          }}
          className="pointer-events-none absolute left-0"
          style={{
            transformOrigin: "0% 100%",
            bottom: "100%",
            marginBottom: Math.round(5 * g.u),
            padding: `${Math.round(2 * g.u)}px ${Math.round(6 * g.u)}px`,
            background: ink,
            color: onDepth(def.depth),
            fontFamily: FONT.mono,
            fontWeight: 600,
            fontSize: Math.max(10, Math.round(12 * g.u)),
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            opacity: "var(--hk-debug, 0)",
          }}
        >
          {def.tag}
        </span>
      )}
    </div>
  );
});
