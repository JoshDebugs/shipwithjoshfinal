"use client";

/**
 * The viewfinder: word-only readouts over the thermal field. Share Tech Mono
 * in white-hot paper. Everything that changes is written by the Engine.
 */
import type { CSSProperties } from "react";
import { C, MODES, alpha, rampCss } from "./colors";
import { AGAIN, CAPTIONS, SUBJECT, VISIBLE_NOTE } from "./copy";
import type { HudRefs } from "./engine";
import type { Geo } from "./geometry";

const MONO = "var(--f-share-tech)";

export function Hud({ g, refs, onMode }: { g: Geo; refs: HudRefs; onMode: () => void }) {
  const { frame: f, u, mobile } = g;
  const small = Math.round((mobile ? 11.5 : 13.5) * u * 10) / 10;
  const stroke = Math.max(1, Math.round(1.5 * u));
  const arm = f.arm;
  const corner = (pos: CSSProperties, b: CSSProperties) => (
    <span aria-hidden className="absolute" style={{ width: arm, height: arm, ...pos, ...b }} />
  );
  const line = `${stroke}px solid ${alpha(C.paper, 0.85)}`;
  return (
    <div
      ref={(el) => {
        refs.group = el;
      }}
      className="pointer-events-none absolute inset-0"
      style={{ color: C.hud, fontFamily: MONO }}
    >
      {/* corner brackets */}
      <div aria-hidden className="absolute" style={{ left: f.l, top: f.t, width: f.r - f.l, height: f.b - f.t }}>
        {corner({ left: 0, top: 0 }, { borderLeft: line, borderTop: line })}
        {corner({ right: 0, top: 0 }, { borderRight: line, borderTop: line })}
        {corner({ left: 0, bottom: 0 }, { borderLeft: line, borderBottom: line })}
        {corner({ right: 0, bottom: 0 }, { borderRight: line, borderBottom: line })}
      </div>

      <Reticle g={g} refs={refs} small={small} />

      <div
        ref={(el) => {
          refs.jitter = el;
        }}
        className="absolute inset-0"
      >
        {/* subject + set */}
        <div className="absolute" style={{ left: g.hudSide, top: g.hudTop, fontSize: small, letterSpacing: "0.08em", lineHeight: 1.5 }}>
          <div>{SUBJECT}</div>
          <div className="flex items-center" style={{ gap: 10 * u, color: C.hudDim }}>
            <span
              ref={(el) => {
                refs.set = el;
              }}
            >
              STANDBY
            </span>
            <span
              ref={(el) => {
                refs.nuc = el;
              }}
              style={{ opacity: 0, color: C.sun }}
            >
              NUC
            </span>
          </div>
        </div>

        {/* mode switch: the easter egg */}
        <button
          type="button"
          aria-label="Cycle camera mode"
          onClick={onMode}
          className="absolute flex cursor-pointer items-center bg-transparent"
          style={{
            right: g.hudSide,
            top: g.hudTop - 4 * u,
            pointerEvents: "auto",
            color: C.hud,
            fontFamily: MONO,
            fontSize: small,
            letterSpacing: "0.08em",
            gap: 8 * u,
            padding: `${4 * u}px 0 ${4 * u}px ${8 * u}px`,
          }}
        >
          <span style={{ color: C.hudDim }}>MODE</span>
          <span
            ref={(el) => {
              refs.mode = el;
            }}
          >
            IRONBOW
          </span>
          <span
            ref={(el) => {
              refs.modeBar = el;
            }}
            aria-hidden
            style={{ width: 44 * u, height: 7 * u, background: rampCss(MODES[0].stops, "to right"), outline: `1px solid ${C.hudFaint}` }}
          />
        </button>

        <Scale g={g} refs={refs} small={small} />
      </div>

      {/* lower third */}
      <div className="absolute" style={{ left: g.caption.x, bottom: g.H - g.caption.bottom, width: g.caption.w, height: 0 }}>
        {CAPTIONS.map((c, i) => (
          <div
            key={i}
            ref={(el) => {
              refs.captions[i] = el;
            }}
            className="absolute bottom-0 left-0 w-full"
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <div style={{ fontSize: small, letterSpacing: "0.1em", color: C.sun, marginBottom: 7 * u }}>{c.tag}</div>
            <p
              style={{
                fontFamily: "var(--f-unbounded)",
                fontWeight: 500,
                fontSize: (mobile ? 21 : 32) * u,
                lineHeight: 1.16,
                letterSpacing: "-0.015em",
                textWrap: "balance",
              }}
            >
              {c.line}
            </p>
            {c.tag.startsWith("SET 04") && (
              <div className="flex" style={{ marginTop: 10 * u, gap: 12 * u, fontSize: (mobile ? 13 : 16) * u, letterSpacing: "0.04em", color: C.sun }}>
                {AGAIN.map((w, k) => (
                  <span
                    key={k}
                    ref={(el) => {
                      refs.again[k] = el;
                    }}
                    style={{ opacity: 0 }}
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* VISIBLE mode's punchline */}
      <p
        ref={(el) => {
          refs.note = el;
        }}
        className="absolute"
        style={{
          left: mobile ? g.hudSide : "50%",
          right: mobile ? g.hudSide : undefined,
          top: mobile ? g.hudTop + 74 * u : g.hudTop + 8 * u,
          transform: mobile ? undefined : "translateX(-50%)",
          width: mobile ? undefined : 420 * u,
          textAlign: "center",
          fontFamily: "var(--font-geist-sans)",
          fontSize: (mobile ? 14 : 16) * u,
          lineHeight: 1.35,
          color: C.paper,
          opacity: 0,
        }}
      >
        {VISIBLE_NOTE}
      </p>
    </div>
  );
}

function Reticle({ g, refs, small }: { g: Geo; refs: HudRefs; small: number }) {
  const s = Math.round(g.fh * 0.26);
  const t = Math.max(8, Math.round(s * 0.2));
  const seg = (st: CSSProperties) => <span aria-hidden className="absolute" style={{ background: "currentColor", opacity: 0.72, ...st }} />;
  return (
    <div
      ref={(el) => {
        refs.reticle = el;
      }}
      className="absolute left-0 top-0"
      style={{ width: 0, height: 0, willChange: "transform", color: C.paper }}
    >
      <div className="absolute" style={{ left: -s / 2, top: -s / 2, width: s, height: s }}>
        {seg({ left: 0, top: 0, width: t, height: 1 })}
        {seg({ left: 0, top: 0, width: 1, height: t })}
        {seg({ right: 0, top: 0, width: t, height: 1 })}
        {seg({ right: 0, top: 0, width: 1, height: t })}
        {seg({ left: 0, bottom: 0, width: t, height: 1 })}
        {seg({ left: 0, bottom: 0, width: 1, height: t })}
        {seg({ right: 0, bottom: 0, width: t, height: 1 })}
        {seg({ right: 0, bottom: 0, width: 1, height: t })}
        {seg({ left: s / 2 - 5, top: s / 2, width: 10, height: 1 })}
        {seg({ left: s / 2, top: s / 2 - 5, width: 1, height: 10 })}
      </div>
      <span
        ref={(el) => {
          refs.reading = el;
        }}
        className="absolute whitespace-nowrap"
        style={{ left: s / 2 + 8 * g.u, top: -s / 2 - 1, fontSize: small, letterSpacing: "0.08em" }}
      >
        COLD
      </span>
    </div>
  );
}

function Scale({ g, refs, small }: { g: Geo; refs: HudRefs; small: number }) {
  const { scale: s, u } = g;
  const th = Math.max(4, Math.round(6 * u));
  const bar = rampCss(MODES[0].stops, s.vertical ? "to top" : "to right");
  const label = { fontSize: small, letterSpacing: "0.12em" };
  if (s.vertical) {
    return (
      <div
        ref={(el) => {
          refs.scale = el;
        }}
        aria-label="Scale from couch to built"
        role="img"
        className="absolute"
        style={{ left: s.x, top: s.y, width: th, height: s.len }}
      >
        <div className="absolute inset-0" style={{ background: bar, outline: `1px solid ${C.hudFaint}` }} />
        <div className="absolute" style={{ ...label, bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 8 * u }}>
          BUILT
        </div>
        <div className="absolute" style={{ ...label, top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 8 * u, color: C.hudDim }}>
          COUCH
        </div>
        <div
          ref={(el) => {
            refs.needle = el;
          }}
          className="absolute left-0 top-0"
          style={{ width: 0, height: 0, willChange: "transform" }}
        >
          <div className="absolute" style={{ right: th / 2 + 3 * u, top: -1, width: 14 * u, height: 2, background: C.paper }} />
          <div className="absolute whitespace-nowrap" style={{ ...label, right: th / 2 + 22 * u, top: -small * 0.68, color: C.paper }}>
            JOSH
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      ref={(el) => {
        refs.scale = el;
      }}
      aria-label="Scale from couch to built"
      role="img"
      className="absolute"
      style={{ left: s.x, top: s.y, width: s.len, height: th }}
    >
      <div className="absolute inset-0" style={{ background: bar, outline: `1px solid ${C.hudFaint}` }} />
      <div className="absolute" style={{ ...label, top: th + 5 * u, left: 0, color: C.hudDim }}>
        COUCH
      </div>
      <div className="absolute" style={{ ...label, top: th + 5 * u, right: 0 }}>
        BUILT
      </div>
      <div
        ref={(el) => {
          refs.needle = el;
        }}
        className="absolute left-0 top-0"
        style={{ width: 0, height: 0, willChange: "transform" }}
      >
        <div className="absolute" style={{ left: -1, top: -4 * u, width: 2, height: th + 8 * u, background: C.paper }} />
      </div>
    </div>
  );
}
