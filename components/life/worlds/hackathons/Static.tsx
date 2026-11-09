"use client";

/**
 * Reduced motion: the whole hackathon, already over and printed out. Raw
 * v0.0.1 at the top, the poster the CSS turned it into, one frozen crash
 * (rainbow outlines, the error sheet, the pile), the honest commits, and the
 * sun at the end. Nothing moves; every fact and line is here in normal flow.
 */
import type { CSSProperties, ReactNode } from "react";
import { iconSvg } from "@/components/life/multiverse/portalIcons";
import { useStage } from "@/components/life/multiverse/runtime";
import { C, DEPTH, FONT, RAW, VERB_INK, alpha } from "./colors";
import { COMMITS, COPY, EVENTS, STACK } from "./copy";

const CARD_INK = [
  { bg: C.cobalt, fg: C.paper },
  { bg: C.sun, fg: C.ink },
  { bg: C.teal, fg: C.paper },
] as const;

const STAR = (() => {
  const pts: string[] = [];
  for (let k = 0; k < 32; k++) {
    const r = k % 2 === 0 ? 50 : 38.5;
    const a = (k / 32) * Math.PI * 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
})();

/** A frozen inspector label, in the ink of its nesting depth. */
function Inspect({ depth, label, children, style }: { depth: number; label?: string; children: ReactNode; style?: CSSProperties }) {
  const ink = DEPTH[depth % DEPTH.length];
  return (
    <div className="relative" style={{ outline: `2px solid ${ink}`, outlineOffset: 3, ...style }}>
      {children}
      {label && (
        <span
          aria-hidden
          className="absolute left-0"
          style={{ bottom: "100%", marginBottom: 7, padding: "2px 6px", background: ink, color: depth % 4 === 3 ? C.ink : C.paper, fontFamily: FONT.mono, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default function HackathonsStatic() {
  const stage = useStage();
  const W = Math.max(320, stage.width || 1280);
  const mobile = W < 768;
  const m = mobile ? 20 : Math.round(Math.min(64, Math.max(28, W * 0.028)));
  const inner = W - 2 * m;

  const fsHead = mobile ? inner / 3.82 : inner / 6.96;
  const lines = mobile ? ["HACKA", "THONS"] : ["HACK", "ATHONS"];
  const wdth = mobile ? 100 : 150;
  const fsMotto = mobile ? Math.min(inner / 4.3, 88) : Math.min(inner / 12.4, 104);
  const heapLetters = "HACKATHONS".split("");
  const fsHeap = mobile ? inner / 7.4 : Math.min(inner / 11, 118);
  const heapTilt = [-14, 9, -32, 18, -7, 24, -19, 88, 11, -26];
  const heapLift = [0, 8, 2, 12, 0, 6, 3, 2, 10, 0];
  const mono: CSSProperties = { fontFamily: FONT.mono };
  const anybody = (wd: number): CSSProperties => ({ fontFamily: FONT.anybody, fontWeight: 900, fontVariationSettings: `"wdth" ${wd}` });

  return (
    <section aria-label="Hackathons, age 18" style={{ background: C.paper, color: C.ink }}>
      {/* v0.0.1: browser defaults, on purpose */}
      <div className="relative overflow-hidden" style={{ background: RAW.page, color: RAW.text, fontFamily: RAW.serif, padding: `${mobile ? 100 : 112}px ${m}px ${mobile ? 28 : 34}px` }}>
        <div className={mobile ? "" : "grid items-end"} style={{ gridTemplateColumns: mobile ? undefined : "minmax(0, 1.05fr) minmax(0, 1fr)", columnGap: 48, maxWidth: 1120, margin: mobile ? 0 : "0 auto" }}>
          <div>
            <p style={{ fontSize: mobile ? 52 : 80, fontWeight: 700, lineHeight: 1.05, margin: 0 }}>Hackathons</p>
            <p style={{ fontSize: mobile ? 16 : 20, margin: "10px 0 0" }}>{COPY.rawLine}</p>
          </div>
          <div style={{ marginTop: mobile ? 14 : 0 }}>
            <ul style={{ fontSize: mobile ? 18 : 22, lineHeight: 1.32, margin: 0, paddingLeft: "1.4em", listStyle: "disc" }}>
              {EVENTS.map((e) => (
                <li key={e.name} style={{ color: RAW.link, textDecoration: "underline", textUnderlineOffset: "0.08em" }}>
                  {e.name}
                </li>
              ))}
            </ul>
            <div className="flex items-end" style={{ gap: 16, marginTop: 12 }}>
              <div aria-hidden className="relative shrink-0" style={{ width: mobile ? 104 : 124, height: mobile ? 60 : 68, background: RAW.box, border: `1px solid ${RAW.boxLine}` }}>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                  <path d="M0 0 L100 100 M100 0 L0 100" stroke={RAW.boxLine} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <span aria-hidden style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: mobile ? 15 : 18, padding: "2px 10px", background: RAW.button, border: `1px solid ${RAW.buttonLine}`, borderRadius: 3 }}>
                Submit
              </span>
            </div>
            <p style={{ ...mono, fontSize: mobile ? 11 : 13, margin: "10px 0 0", opacity: 0.65 }}>{COPY.url} · age 18 · compiling…</p>
          </div>
        </div>
      </div>

      {/* three inks landing on the page: colors.css */}
      <svg aria-hidden viewBox="0 0 1000 90" preserveAspectRatio="none" className="block w-full" style={{ height: mobile ? 36 : 60, isolation: "isolate" }}>
        <rect width="1000" height="45" fill={RAW.page} />
        <rect y="45" width="1000" height="45" fill={C.paper} />
        <circle cx="210" cy="45" r="190" fill={C.pink} style={{ mixBlendMode: "multiply" }} />
        <circle cx="470" cy="45" r="160" fill={C.sun} style={{ mixBlendMode: "multiply" }} />
        <circle cx="760" cy="45" r="210" fill={C.cobalt} style={{ mixBlendMode: "multiply" }} />
      </svg>

      {/* the poster */}
      <div className="relative overflow-hidden" style={{ padding: `${mobile ? 22 : 26}px ${m}px ${mobile ? 30 : 40}px` }}>
        <div className={mobile ? "flex items-center justify-between" : "flex items-center"} style={{ marginBottom: mobile ? 20 : 16, gap: 22 }}>
          <span style={{ ...anybody(118), fontSize: mobile ? 22 : 28 }}>hack/josh</span>
          <span style={{ ...mono, fontSize: mobile ? 12 : 14, background: C.sun, border: `2px solid ${C.ink}`, padding: "4px 10px", fontWeight: 800 }}>↻ HOT RELOAD</span>
        </div>

        <div className="relative">
          <div aria-hidden className="absolute" style={{ left: -12, right: -12, bottom: -fsHead * 0.08, height: fsHead * 0.5, background: C.pink }} />
          {!mobile && (
            <>
              <div aria-hidden className="absolute rounded-full" style={{ right: inner * 0.17, top: -fsHead * 0.16, width: fsHead * 1.12, height: fsHead * 1.12, background: C.sun }} />
              <div aria-hidden className="absolute grid place-items-center" style={{ right: 0, top: -fsHead * 0.26, width: fsHead * 0.8, height: fsHead * 0.8, transform: "rotate(-8deg)" }}>
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" style={{ overflow: "visible" }}>
                  <polygon points={STAR} fill={C.sun} stroke={C.ink} strokeWidth={2.4} strokeLinejoin="round" />
                </svg>
                <div className="relative text-center" style={{ ...anybody(120), fontSize: fsHead * 0.26, lineHeight: 0.92 }}>
                  <div style={{ fontSize: fsHead * 0.11, letterSpacing: "0.06em" }}>AGE</div>18
                </div>
              </div>
            </>
          )}
          <h2 className="relative" style={{ ...anybody(wdth), fontSize: fsHead, lineHeight: 0.86, margin: 0 }}>
            {lines.map((l) => (
              <span key={l} className="block" style={{ whiteSpace: "nowrap" }}>
                {l}
              </span>
            ))}
          </h2>
        </div>

        <div className={mobile ? "grid grid-cols-2" : "grid grid-cols-4"} style={{ gap: 10, marginTop: mobile ? 26 : 30 }}>
          {COPY.verbs.map((v, i) => (
            <div key={v} className="grid place-items-center" style={{ ...anybody(112), background: VERB_INK[i].bg, color: VERB_INK[i].fg, border: `3px solid ${C.ink}`, boxShadow: `4px 4px 0 ${C.ink}`, height: mobile ? 42 : 50, fontSize: mobile ? 19 : 24 }}>
              {v}
            </div>
          ))}
        </div>

        <div aria-hidden style={{ height: 14, margin: "16px 0", background: `repeating-conic-gradient(${C.ink} 0 25%, ${C.paper} 0 50%) 0 0 / 14px 14px`, border: `2px solid ${C.ink}` }} />

        <ol className={mobile ? "flex flex-col" : "grid grid-cols-3"} style={{ gap: mobile ? 12 : 20, listStyle: "none", margin: 0, padding: 0 }}>
          {EVENTS.map((e, i) => {
            const ink = CARD_INK[i];
            const card = (
              <div className="flex h-full flex-col justify-between" style={{ background: ink.bg, color: ink.fg, border: `3px solid ${C.ink}`, boxShadow: `7px 7px 0 ${C.ink}`, padding: mobile ? 16 : 22, minHeight: mobile ? 128 : 212, gap: 12 }}>
                <div style={{ ...anybody(e.result === "participated." ? 50 : 125), fontSize: e.result === "participated." ? (mobile ? 60 : 96) : mobile ? 76 : 108, lineHeight: 0.92 }}>{e.result}</div>
                <div>
                  <div style={{ fontFamily: FONT.anybody, fontWeight: 800, fontSize: mobile ? 20 : 26, lineHeight: 1.08, fontVariationSettings: '"wdth" 105' }}>{e.name}</div>
                  {e.note && <div style={{ ...mono, fontSize: mobile ? 13 : 15, marginTop: 8 }}>{e.note}</div>}
                </div>
              </div>
            );
            return <li key={e.name}>{i === 1 ? <Inspect depth={0} label={e.tag} style={{ height: "100%" }}>{card}</Inspect> : card}</li>;
          })}
        </ol>
      </div>

      {/* one frozen crash */}
      <div className="relative overflow-hidden" style={{ padding: `${mobile ? 8 : 16}px ${m}px 0` }}>
        <div className={mobile ? "flex flex-col" : "grid"} style={{ gridTemplateColumns: mobile ? undefined : "minmax(0, 380px) minmax(0, 1fr)", gap: mobile ? 18 : 28, alignItems: "start" }}>
          <div style={{ ...mono, background: C.ink, color: C.paper, fontSize: mobile ? 14 : 16, lineHeight: 1.7, padding: "14px 0", boxShadow: `8px 8px 0 ${C.pink}` }}>
            <div style={{ padding: "0 16px 8px", fontSize: 13, opacity: 0.7 }}>poster.css ● saved</div>
            <div style={{ padding: "0 16px" }}>
              <span style={{ color: C.sun }}>.poster</span> {"{"}
            </div>
            <div style={{ padding: "0 16px", background: alpha(C.pink, 0.22), color: C.pink, fontWeight: 700 }}>- display: grid;</div>
            <div style={{ padding: "0 16px", opacity: 0.75 }}>
              {"  "}gap: <span style={{ color: C.sun }}>var(--gap)</span>;
            </div>
            <div style={{ padding: "0 16px" }}>{"}"}</div>
          </div>
          <div style={{ background: C.pink, color: C.paper, border: `4px solid ${C.ink}`, boxShadow: `10px 12px 0 ${C.ink}`, padding: mobile ? 16 : 26, transform: "rotate(-0.6deg)" }}>
            <div className="flex items-center justify-between" style={{ ...mono, fontSize: mobile ? 11.5 : 14, fontWeight: 700, color: C.ink, marginBottom: 12 }}>
              <span>✕ Runtime error · 1 of 1</span>
              <span>hackathons/page.tsx</span>
            </div>
            <p style={{ ...anybody(mobile ? 75 : 88), fontSize: mobile ? 30 : 44, lineHeight: 1.04, margin: 0, textShadow: `3px 3px 0 ${C.ink}` }}>{COPY.error}</p>
            <p style={{ ...mono, fontWeight: 700, color: C.ink, fontSize: mobile ? 15.5 : 20, margin: "10px 0 0" }}>{COPY.errorWink}</p>
            <div style={{ ...mono, background: C.ink, color: C.paper, fontSize: mobile ? 12 : 15, marginTop: 14, padding: "10px 0" }}>
              {STACK.map((l) => (
                <div key={l.n} className="flex" style={{ background: l.hot ? alpha(C.pink, 0.32) : undefined, whiteSpace: "pre" }}>
                  <span style={{ width: "3.2em", flex: "none", textAlign: "right", paddingRight: "1em", color: l.hot ? C.pink : alpha(C.paper, 0.4), fontWeight: l.hot ? 800 : 400 }}>{l.hot ? `> ${l.n}` : l.n}</span>
                  <span style={{ color: l.hot ? C.sun : C.paper, opacity: l.hot ? 1 : 0.8 }}>{l.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div aria-hidden className="flex items-end justify-center" style={{ marginTop: mobile ? 26 : 34, paddingBottom: 4, borderBottom: `6px solid ${C.ink}` }}>
          {heapLetters.map((ch, i) => (
            <span
              key={i}
              className="inline-block"
              style={{ ...anybody(mobile ? 92 : 128), fontSize: fsHeap, lineHeight: 0.8, marginBottom: heapLift[i], marginLeft: i ? -fsHeap * 0.06 : 0, transform: `rotate(${heapTilt[i]}deg)`, WebkitTextStroke: `${Math.max(3, fsHeap * 0.05)}px ${C.paper}`, paintOrder: "stroke fill", outline: `1.5px solid ${DEPTH[(i % 3) + 1]}`, outlineOffset: 2 }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>

      {/* git reset + the honest commits */}
      <div style={{ background: C.ink, color: C.sun, padding: `${mobile ? 24 : 34}px ${m}px`, ...mono }}>
        <p style={{ fontSize: mobile ? 16 : 24, margin: 0, fontWeight: 700 }}>
          <span style={{ color: C.paper, opacity: 0.6, fontWeight: 400 }}>$ </span>
          {COPY.git}
          <span style={{ color: C.paper, opacity: 0.6, fontWeight: 400 }}> {COPY.gitComment}</span>
        </p>
        <p style={{ color: C.paper, fontSize: mobile ? 13 : 17, margin: "6px 0 0" }}>{COPY.gitOut}</p>
        <p style={{ color: alpha(C.paper, 0.72), fontSize: mobile ? 12 : 14, lineHeight: 1.7, margin: "16px 0 0" }}>
          {COMMITS.map(([h, msg]) => (
            <span key={h} style={{ marginRight: "1.6em", whiteSpace: "nowrap" }}>
              <span style={{ color: C.sun }}>{h}</span> {msg}
            </span>
          ))}
        </p>
      </div>

      {/* the sun: BUILD. BREAK. PITCH. REPEAT. */}
      <div className={mobile ? "flex flex-col items-center text-center" : "flex items-center justify-center text-center"} style={{ background: C.sun, color: C.ink, padding: `${mobile ? 40 : 44}px ${m}px ${mobile ? 40 : 44}px`, gap: mobile ? 22 : 48 }}>
        <div aria-hidden className="shrink-0" style={{ width: mobile ? 104 : 150, height: mobile ? 104 : 150 }} dangerouslySetInnerHTML={{ __html: iconSvg("whorl", C.ink) }} />
        <div>
        <h3 style={{ ...anybody(mobile ? 100 : 112), fontSize: fsMotto, lineHeight: 0.98, margin: 0 }}>
          {mobile ? (
            <>
              BUILD.
              <br />
              BREAK.
              <br />
              PITCH.
              <br />
              REPEAT.
            </>
          ) : (
            <>
              BUILD. BREAK.
              <br />
              PITCH. REPEAT.
            </>
          )}
        </h3>
        <p style={{ ...mono, fontWeight: 600, fontSize: mobile ? 13 : 20, margin: `${mobile ? 20 : 26}px 0 0` }}>
          $ {COPY.git} <span style={{ opacity: 0.7 }}>{COPY.gitComment}</span>
        </p>
        </div>
      </div>
    </section>
  );
}
