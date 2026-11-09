"use client";

import { useMemo, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useProgress } from "@/components/life/multiverse/runtime";
import { RISO, alpha, overprint } from "@/components/life/multiverse/palette";
import { backOut, clamp, easeOutCubic, hash, lerp, range } from "@/components/life/multiverse/ease";
import { COPY, PAPER, PAPER_SUMMARY } from "./copy";
import { HALL, newCam, newProj, project } from "./hall";
import { archivo, rubber } from "./ink";
import { camAt, type Layout } from "./layout";
import { B } from "./timeline";

const LH = 1.62;
const CR = 3; // carriage-return pause, in typed characters

type Bar = { line: number; c0: number; c1: number; at: number };

function usePaperModel() {
  return useMemo(() => {
    const starts: number[] = [];
    const lens: number[] = [];
    const bars: Bar[] = [];
    let idx = 0;
    PAPER.forEach((runs, li) => {
      starts.push(idx);
      let col = 0;
      runs.forEach((run) => {
        if (run.kind === "redact") {
          // one bar per struck-out word
          let w0 = -1;
          for (let c = 0; c <= run.text.length; c++) {
            const ch = run.text[c];
            if (ch === "X" && w0 < 0) w0 = c;
            if ((ch !== "X" || c === run.text.length) && w0 >= 0) {
              bars.push({ line: li, c0: col + w0, c1: col + c, at: idx + (col + c) });
              w0 = -1;
            }
          }
        }
        col += run.text.length;
      });
      lens.push(col);
      idx += col + CR;
    });
    return { starts, lens, bars, total: idx };
  }, []);
}

export function PositionPaper({ L, progress }: { L: Layout; progress: MotionValue<number> }) {
  const model = usePaperModel();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const caretRef = useRef<HTMLSpanElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<SVGPathElement>(null);
  const cam = useMemo(newCam, []);
  const pr = useMemo(newProj, []);
  const { w, h, fs, pad } = L.paper;

  useProgress(progress, (p) => {
    const wrap = wrapRef.current;
    const sheet = sheetRef.current;
    if (!wrap || !sheet) return;
    const shown = p >= B.paperIn[0] && p < B.rise[1];
    wrap.style.visibility = shown ? "visible" : "hidden";
    if (!shown) return;

    // carried by the same camera as the hall: Josh's sheet on his desk
    camAt(L, p, cam);
    const g = L.geo;
    project(cam, g.paper.x, g.paper.y, g.paper.z, pr);
    const scale = (pr.k * HALL.paperH) / h;
    const inE = easeOutCubic(range(p, B.paperIn[0], B.paperIn[1]));
    const dy = (1 - inE) * L.h * 0.95;
    const rot = lerp(9, -2.5, inE);
    wrap.style.transform = `translate3d(${pr.x - w / 2}px, ${pr.y - h / 2 + dy}px, 0) scale(${scale}) rotate(${rot}deg)`;
    wrap.style.opacity = String(1 - range(p, B.rise[1] - 0.016, B.rise[1] - 0.003));
    sheet.style.boxShadow = `${14 * (1 - range(p, B.rise[0], B.rise[0] + 0.05))}px ${16 * (1 - range(p, B.rise[0], B.rise[0] + 0.05))}px 0 ${overprint(RISO.cobalt, RISO.cobalt)}`;

    // typewriter: characters strike in whole steps
    const nf = range(p, B.typing[0], B.typing[1]) * model.total;
    const n = Math.floor(nf);
    let caretLine = -1;
    let caretCol = 0;
    for (let li = 0; li < PAPER.length; li++) {
      const el = lineRefs.current[li];
      const typed = clamp(n - model.starts[li], 0, model.lens[li]);
      if (el) el.style.clipPath = `inset(-0.4em calc(100% - ${typed}ch) -0.4em -0.2em)`;
      if (n >= model.starts[li] && n < model.starts[li] + model.lens[li] + CR) {
        caretLine = li;
        caretCol = typed;
      }
    }
    // redaction bars slam a beat after their word is struck
    model.bars.forEach((b, i) => {
      const el = barRefs.current[i];
      if (!el) return;
      const s = clamp((nf - b.at - 1.5) / 2.5);
      el.style.transform = `scaleX(${s <= 0 ? 0 : backOut(s, 2.2)}) scaleY(${1 + 0.35 * (1 - s) * (s > 0 ? 1 : 0)})`;
      el.style.opacity = s <= 0 ? "0" : String(0.88 + 0.12 * s);
    });
    const caret = caretRef.current;
    if (caret) {
      const typing = p > B.typing[0] - 0.006 && p < B.typing[1] + 0.012;
      caret.style.display = typing ? "block" : "none";
      if (caretLine < 0) caretLine = PAPER.length - 1;
      caret.style.transform = `translate(${caretCol}ch, ${caretLine * LH}em)`;
    }
    const stamp = stampRef.current;
    if (stamp) {
      const s = range(p, B.paperStamp[0], B.paperStamp[1]);
      stamp.style.opacity = String(clamp(s * 3));
      stamp.style.transform = `rotate(-8deg) scale(${lerp(1.7, 1, easeOutCubic(s))})`;
    }
    const mark = markRef.current;
    if (mark) {
      const m = range(p, B.weakMark[0], B.weakMark[1]);
      mark.style.strokeDashoffset = String(1 - m);
      mark.style.opacity = m > 0 ? "1" : "0";
    }
  });

  const labelInk = RISO.pink;
  const barStyle = (i: number): React.CSSProperties => ({
    position: "absolute",
    top: "0.2em",
    height: "1.18em",
    background: RISO.ink,
    transformOrigin: "0 50%",
    borderRadius: `${1 + hash(i) * 2}px ${1 + hash(i + 3) * 2.5}px ${1 + hash(i + 5) * 2}px ${1 + hash(i + 7) * 2}px`,
    transform: "scaleX(0)",
    opacity: 0,
  });

  let barIndex = 0;
  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute left-0 top-0"
      style={{ width: w, height: h, zIndex: 6, visibility: "hidden", willChange: "transform", transformOrigin: "50% 50%" }}
      role="img"
      aria-label={PAPER_SUMMARY}
    >
      <div ref={sheetRef} className="relative h-full w-full overflow-hidden" style={{ background: RISO.paper, padding: pad, color: RISO.ink }} aria-hidden>
        {/* punched holes show the hall floor through the sheet */}
        {[0.22, 0.78].map((t) => (
          <span key={t} className="absolute rounded-full" style={{ left: pad * 0.36, top: h * t, width: pad * 0.34, height: pad * 0.34, background: RISO.cobalt }} />
        ))}
        <div
          ref={stampRef}
          className="absolute"
          style={{
            right: pad * 0.8,
            top: pad * 0.75,
            padding: "0.2em 0.42em 0.14em",
            border: `${Math.max(4, Math.round(fs * 0.26))}px double ${RISO.pink}`,
            color: RISO.pink,
            ...archivo(68, 850),
            fontSize: fs * 1.35,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1,
            opacity: 0,
            transformOrigin: "50% 50%",
            mixBlendMode: "multiply",
            ...rubber(1),
          }}
        >
          {COPY.paper.stamp}
        </div>
        <div style={{ fontFamily: "var(--f-courier)", fontSize: fs, lineHeight: LH }}>
          <div className="font-bold" style={{ letterSpacing: "0.16em", fontSize: "0.82em", marginTop: fs * 2.4 }}>
            {COPY.paper.header}
          </div>
          <div style={{ height: 2, background: RISO.ink, margin: `${fs * 0.35}px 0 ${fs * 0.9}px`, opacity: 0.85 }} />
          <div className="relative">
            {PAPER.map((runs, li) => {
              let col = 0;
              const lineBars: React.ReactNode[] = [];
              runs.forEach((run) => {
                if (run.kind === "redact") {
                  let w0 = -1;
                  for (let c = 0; c <= run.text.length; c++) {
                    const ch = run.text[c];
                    if (ch === "X" && w0 < 0) w0 = c;
                    if ((ch !== "X" || c === run.text.length) && w0 >= 0) {
                      const bi = barIndex++;
                      lineBars.push(
                        <span
                          key={bi}
                          ref={(el) => {
                            barRefs.current[bi] = el;
                          }}
                          style={{ ...barStyle(bi), left: `calc(${col + w0}ch - 0.08em)`, width: `calc(${c - w0}ch + 0.16em)` }}
                        />,
                      );
                      w0 = -1;
                    }
                  }
                }
                col += run.text.length;
              });
              let ci = 0;
              return (
                <div key={li} className="relative" style={{ height: `${LH}em`, whiteSpace: "pre" }}>
                  <span
                    ref={(el) => {
                      lineRefs.current[li] = el;
                    }}
                    className="inline-block"
                    style={{ clipPath: "inset(0 100% 0 0)" }}
                  >
                    {runs.map((run, ri) =>
                      run.text.split("").map((ch) => {
                        const k = li * 97 + ci++;
                        const jitter = hash(k * 1.91);
                        return (
                          <span
                            key={`${ri}-${k}`}
                            style={{
                              position: "relative",
                              top: `${(hash(k * 3.17) - 0.5) * 0.07}em`,
                              opacity: run.kind === "redact" ? 0.55 : 0.74 + 0.26 * jitter,
                              color: run.kind === "label" ? labelInk : RISO.ink,
                              fontWeight: run.kind === "strong" ? 700 : 400,
                            }}
                          >
                            {ch}
                          </span>
                        );
                      }),
                    )}
                  </span>
                  {lineBars}
                  {li === PAPER.length - 1 && (
                    <svg
                      className="absolute overflow-visible"
                      style={{ left: "16.6ch", top: "-0.28em", width: "7.4ch", height: "1.95em" }}
                      viewBox="0 0 100 50"
                      preserveAspectRatio="none"
                      aria-hidden
                    >
                      <path
                        ref={markRef}
                        d="M10 33 C 4 14, 62 2, 92 14 C 104 22, 92 44, 52 46 C 22 47, 2 40, 8 24 C 12 14, 30 8, 46 7"
                        fill="none"
                        stroke={RISO.pink}
                        strokeWidth={2.6}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        pathLength={1}
                        style={{ strokeDasharray: 1, strokeDashoffset: 1, opacity: 0 }}
                      />
                    </svg>
                  )}
                </div>
              );
            })}
            <span
              ref={caretRef}
              className="absolute left-0 top-0"
              style={{ width: "0.62em", height: "1.15em", marginTop: "0.24em", background: alpha(RISO.ink, 0.72), display: "none", animation: "mun-caret 0.9s steps(1) infinite" }}
            />
          </div>
        </div>
      </div>
      <style>{`@keyframes mun-caret{0%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}
