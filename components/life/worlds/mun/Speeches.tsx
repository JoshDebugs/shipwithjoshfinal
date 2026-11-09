"use client";

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useProgress } from "@/components/life/multiverse/runtime";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { clamp, easeOutCubic, range } from "@/components/life/multiverse/ease";
import { COPY } from "./copy";
import { fraunces, martian } from "./ink";
import type { Layout } from "./layout";
import { B, oratoryWeight, roomTurn, waveLocal } from "./timeline";

type Line = { label: string; text: string; a: number; b: number };

/** Per-word reveal: each word rises and inks in, staggered across `u` (0..1). */
function revealWords(el: HTMLElement | null, u: number, out: number) {
  if (!el) return;
  const words = el.children;
  const n = words.length;
  for (let i = 0; i < n; i++) {
    const w = words[i] as HTMLElement;
    const t = easeOutCubic(clamp(u * (n + 2) - i * 1.0, 0, 1.6) / 1.6);
    w.style.opacity = String(t * (1 - out));
    w.style.transform = `translate3d(0, ${(1 - t) * 0.35 - out * 0.25}em, 0)`;
  }
}

function Words({ text }: { text: string }) {
  const parts = text.split(" ");
  return (
    <>
      {parts.map((w, i) => (
        <span key={i} className="inline-block" style={{ opacity: 0, marginRight: i < parts.length - 1 ? "0.24em" : 0 }}>
          {w}
        </span>
      ))}
    </>
  );
}

/**
 * Everything said in the room:
 *  - the chair's floor label by the podium (Martian Mono),
 *  - Josh's tag by his seat,
 *  - the oratory block (Fraunces, weight scrubbed 100 → 900 as the room turns),
 *  - two lines over the hall once the camera is behind Josh.
 */
export function Speeches({ L, progress }: { L: Layout; progress: MotionValue<number> }) {
  const floorRef = useRef<HTMLDivElement>(null);
  const floorText = useRef<(HTMLSpanElement | null)[]>([]);
  const tagRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const topRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const lines: Line[] = [
    { label: COPY.openingLabel, text: COPY.opening, a: B.hallIntro[0] + 0.004, b: B.waves[0][0] - 0.004 },
    { label: COPY.speechLabels[0], text: COPY.speeches[0], a: B.waves[0][0] - 0.01, b: B.waves[1][0] - 0.012 },
    { label: COPY.speechLabels[1], text: COPY.speeches[1], a: B.waves[1][0] - 0.012, b: B.waves[2][0] - 0.012 },
    { label: COPY.speechLabels[2], text: COPY.speeches[2], a: B.waves[2][0] - 0.012, b: B.drop[0] + 0.014 },
  ];
  const tops = [
    { text: COPY.won, a: B.won[0], b: B.won[1], italic: true },
    { text: COPY.learned, a: B.learned[0], b: B.learned[1], italic: false },
  ];

  useProgress(progress, (p) => {
    // --- oratory block
    const wght = oratoryWeight(p);
    const wonk = waveLocal(p, 2) > 0.5 ? 1 : 0;
    const soft = 100 * (1 - roomTurn(p));
    lines.forEach((ln, i) => {
      const el = lineRefs.current[i];
      const lab = labelRefs.current[i];
      if (!el || !lab) return;
      const on = p > ln.a && p < ln.b;
      el.style.visibility = on ? "visible" : "hidden";
      lab.style.visibility = on ? "visible" : "hidden";
      if (!on) return;
      const u = range(p, ln.a, ln.a + (ln.b - ln.a) * 0.42);
      const out = range(p, ln.b - 0.012, ln.b);
      revealWords(el, u, out);
      el.style.fontVariationSettings = `"wght" ${wght.toFixed(1)}, "WONK" ${wonk}, "SOFT" ${soft.toFixed(1)}, "opsz" 144`;
      el.style.fontWeight = String(Math.round(wght));
      lab.style.opacity = String(clamp(u * 3) * (1 - out));
    });

    // --- the chair's label by the podium
    const plan = 1 - range(p, B.drop[0], B.drop[0] + 0.03);
    const intro = range(p, B.hallIntro[0], B.hallIntro[0] + 0.02);
    const floor = floorRef.current;
    if (floor) {
      floor.style.opacity = String(intro * plan);
      floor.style.visibility = intro * plan > 0 ? "visible" : "hidden";
      const stage = p < B.waves[0][0] - 0.004 ? 0 : p < B.waves[2][1] - 0.004 ? 1 : 2;
      floorText.current.forEach((t, i) => {
        if (t) t.style.display = i === stage ? "inline" : "none";
      });
    }
    const tag = tagRef.current;
    if (tag) {
      const a = intro * (1 - range(p, B.drop[0], B.drop[0] + 0.02));
      tag.style.opacity = String(a);
      tag.style.visibility = a > 0 ? "visible" : "hidden";
    }

    // --- over the hall
    tops.forEach((tp, i) => {
      const el = topRefs.current[i];
      if (!el) return;
      const on = p > tp.a && p < tp.b;
      el.style.visibility = on ? "visible" : "hidden";
      if (!on) return;
      revealWords(el, range(p, tp.a, tp.a + (tp.b - tp.a) * 0.4), range(p, tp.b - 0.014, tp.b));
    });
  });

  const sp = L.speech;
  const blockStyle: React.CSSProperties = L.portrait ? { left: sp.x, top: sp.y, width: sp.w } : { left: sp.x, bottom: L.h - sp.y, width: sp.w };
  // the chair's label sits between the chair's dais and the podium
  const floorStyle: React.CSSProperties = { left: L.pod.x - 300, width: 600, top: L.pod.y - L.S * 1.55 - 6, textAlign: "center" };
  const dotC = [RISO.pink, RISO.sun, RISO.sun];
  const floorCopy = [COPY.floorOpp, COPY.floorJosh, COPY.turned];

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 7 }}>
      {/* chair's micro-label */}
      <div ref={floorRef} className="absolute" style={{ ...floorStyle, ...martian, fontSize: L.portrait ? 9.5 : 11, color: RISO.paper, opacity: 0, visibility: "hidden" }}>
        {floorCopy.map((c, i) => (
          <span
            key={i}
            ref={(el) => {
              floorText.current[i] = el;
            }}
            style={{ display: i === 0 ? "inline" : "none" }}
          >
            <span className="mr-[0.8em] inline-block rounded-full align-middle" style={{ width: 7, height: 7, background: dotC[i], marginTop: -2 }} />
            {c}
          </span>
        ))}
      </div>

      {/* Josh's tag by his seat */}
      <div
        ref={tagRef}
        className="absolute flex items-center gap-2"
        style={{ left: L.joshPlan.x + L.S * 1.25, top: L.joshPlan.y - 8, ...martian, fontSize: L.portrait ? 9.5 : 11, color: RISO.sun, opacity: 0, visibility: "hidden" }}
      >
        <span style={{ width: L.S * 0.6, height: 1, background: RISO.sun, display: "inline-block" }} />
        Josh
      </div>

      {/* the oratory */}
      <div ref={blockRef} className="absolute" style={blockStyle}>
        <div className="relative">
          {lines.map((ln, i) => (
            <div key={i} className={i === 0 ? "relative" : "absolute inset-x-0 bottom-0"} style={L.portrait && i > 0 ? { top: 0, bottom: "auto" } : undefined}>
              <div
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="mb-[0.9em] flex items-center gap-[0.7em]"
                style={{ ...martian, fontSize: L.portrait ? 10 : 11.5, color: RISO.sun, visibility: "hidden" }}
              >
                <span className="inline-block" style={{ width: 9, height: 9, background: RISO.sun }} />
                {ln.label}
              </div>
              <p
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                style={{
                  ...fraunces(100, 0, 100, 144),
                  fontSize: sp.fs,
                  lineHeight: 1.02,
                  letterSpacing: "-0.02em",
                  color: RISO.paper,
                  visibility: "hidden",
                  textWrap: "balance",
                }}
              >
                <Words text={ln.text} />
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* over the hall, once we're behind Josh */}
      {tops.map((tp, i) => (
        <p
          key={i}
          ref={(el) => {
            topRefs.current[i] = el;
          }}
          className="absolute left-1/2 text-center"
          style={{
            top: L.top.y,
            width: L.top.w,
            transform: "translateX(-50%)",
            ...fraunces(i === 0 ? 380 : 560, 1, 0, 144),
            fontStyle: tp.italic ? "italic" : "normal",
            fontSize: L.top.fs * (i === 0 ? 0.86 : 1.06),
            lineHeight: 1.04,
            letterSpacing: "-0.02em",
            color: RISO.paper,
            textShadow: `0 0.04em 0.5em ${alpha(RISO.cobalt, 0.9)}`,
            visibility: "hidden",
            textWrap: "balance",
          }}
        >
          <Words text={tp.text} />
        </p>
      ))}
    </div>
  );
}
