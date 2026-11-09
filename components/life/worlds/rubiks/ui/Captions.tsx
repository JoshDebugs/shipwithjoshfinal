"use client";

/**
 * DOM captions that mirror each locked band, revealed three characters at a
 * time (the sticker grid, in type). Desktop: a Swiss column that fills up as
 * the cube solves. Phone: one caption at a time under the cube.
 * The free-play line and its buttons live here too.
 */

import { useRef } from "react";
import type { MotionValue } from "framer-motion";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { range, smoothstep } from "@/components/life/multiverse/ease";
import { useIsoLayoutEffect, useProgress } from "@/components/life/multiverse/runtime";
import { COPY } from "../lib/script";
import { K } from "../lib/rig";
import type { Frame } from "../lib/frame";
import { randomScramble, type Store } from "../lib/store";

const chunk3 = (s: string) => s.match(/[\s\S]{1,3}/g) ?? [];

type Reveal = { from: number; dur: number; spans: (HTMLSpanElement | null)[]; shown: number };

function useReveals() {
  const list = useRef<Map<string, Reveal>>(new Map());
  const bind = (key: string, from: number, dur = 0.022) => {
    let r = list.current.get(key);
    if (!r) {
      r = { from, dur, spans: [], shown: -1 };
      list.current.set(key, r);
    }
    r.from = from;
    r.dur = dur;
    r.shown = -1; // re-apply after every render (spans may have re-mounted)
    return r;
  };
  const run = (p: number) => {
    list.current.forEach((r) => {
      const n = r.spans.length;
      const count = Math.ceil(range(p, r.from, r.from + r.dur) * n - 1e-6);
      if (count === r.shown) return;
      r.shown = count;
      r.spans.forEach((el, i) => {
        if (!el) return;
        const on = i < count;
        el.style.opacity = on ? "1" : "0";
        el.style.transform = on ? "none" : "translateY(0.18em)";
      });
    });
  };
  return { bind, run };
}

function Chunked({ text, reveal, className, style }: { text: string; reveal: Reveal; className?: string; style?: React.CSSProperties }) {
  const parts = chunk3(text);
  return (
    <span className={className} style={style}>
      {parts.map((c, i) => (
        <span
          key={i}
          ref={(el) => {
            reveal.spans[i] = el;
          }}
          style={{ opacity: 0, transition: "opacity 120ms linear, transform 160ms cubic-bezier(.2,.8,.2,1)", whiteSpace: "pre-wrap", display: "inline" }}
        >
          {c}
        </span>
      ))}
    </span>
  );
}

export function Captions({ progress, store, fr }: { progress: MotionValue<number>; store: Store; fr: Frame }) {
  const root = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);
  const playRef = useRef<HTMLDivElement>(null);
  const { bind, run } = useReveals();
  const mobile = fr.mobile;
  const box = fr.captions;

  const rHead = bind("head", 0.268, 0.03);
  const r1 = bind("l1", K.lock1);
  const r2 = bind("l2", K.lock2);
  const r3 = bind("l3", K.lock3);
  const rH = bind("habit", 0.768, 0.02);
  const rP = bind("play", K.flipEnd - 0.004, 0.02);

  const apply = (p: number) => {
    run(p);
    const el = root.current;
    if (el) {
      const o = 1 - smoothstep(range(p, K.playEnd - 0.004, 0.9));
      el.style.opacity = String(o);
      el.style.visibility = o < 0.001 || p < 0.25 ? "hidden" : "visible";
    }
    if (mobile) {
      // one caption at a time on phones
      const windows: [number, number][] = [
        [0.25, K.lock1 - 0.004],
        [K.lock1 - 0.004, K.lock2 - 0.004],
        [K.lock2 - 0.004, K.lock3 - 0.004],
        [K.lock3 - 0.004, K.flipEnd - 0.006],
        [K.flipEnd - 0.006, 1],
      ];
      items.current.forEach((it, i) => {
        if (!it) return;
        const [a, b] = windows[i];
        const on = p >= a && p < b;
        it.style.opacity = on ? "1" : "0";
        it.style.visibility = on ? "visible" : "hidden";
      });
    }
    const play = playRef.current;
    if (play) {
      const on = p > K.flipEnd - 0.002 && p < K.playEnd;
      play.style.pointerEvents = on ? "auto" : "none";
      play.style.opacity = String(smoothstep(range(p, K.flipEnd + 0.004, K.flipEnd + 0.02)));
    }
  };
  useProgress(progress, apply);
  useIsoLayoutEffect(() => apply(progress.get()));

  const numStyle: React.CSSProperties = { color: RISO.pink, fontVariantNumeric: "tabular-nums" };
  const lineFont: React.CSSProperties = { fontFamily: "var(--f-tilt-warp)", fontSize: mobile ? 28 : 29, lineHeight: 1.08 };
  const lines = [
    { n: "01", text: COPY.lines[0], r: r1 },
    { n: "02", text: COPY.lines[1], r: r2 },
    { n: "03", text: COPY.lines[2], r: r3 },
  ];

  const buttons = (
    <div ref={playRef} className="mt-3 flex flex-col gap-2" style={{ opacity: 0, pointerEvents: "none" }} data-swipe-ignore>
      <p style={{ ...lineFont, fontSize: mobile ? 28 : 30 }}>
        <Chunked text={COPY.play} reveal={rP} />
      </p>
      <div className="flex items-center gap-2">
        {[
          { label: "Scramble it", act: () => !store.solving && store.moves.length < 60 && randomScramble(store, 12) },
          {
            label: "Solve it",
            act: () => {
              if (store.moves.length) store.solving = true;
            },
          },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={b.act}
            className="rounded-full px-4 py-2 text-[13px] leading-none transition-[background-color,transform] duration-200 hover:-translate-y-[1px] active:translate-y-[1px] md:text-[14px]"
            style={{
              fontFamily: "var(--f-tilt-warp)",
              background: RISO.paper,
              color: RISO.ink,
              boxShadow: `inset 0 0 0 1.5px ${RISO.ink}, 2px 2px 0 ${RISO.ink}`,
              minHeight: 40,
            }}
            onPointerEnter={(e) => (e.currentTarget.style.background = RISO.sun)}
            onPointerLeave={(e) => (e.currentTarget.style.background = RISO.paper)}
          >
            {b.label}
          </button>
        ))}
        <span className="ml-1 font-mono text-[9px] uppercase leading-tight tracking-[0.16em]" style={{ color: alpha(RISO.ink, 0.55) }}>
          {mobile ? "or drag a layer" : "or drag any layer"}
        </span>
      </div>
    </div>
  );

  if (mobile) {
    const itemCls = "absolute inset-x-0 top-0";
    return (
      <div ref={root} className="pointer-events-none absolute" style={{ left: box.x, top: box.y, width: box.w, height: box.h, zIndex: 5, color: RISO.ink, visibility: "hidden" }}>
        <div className="relative h-full">
          <div ref={(el) => void (items.current[0] = el)} className={itemCls}>
            <Headline reveal={rHead} mobile />
          </div>
          {lines.map((l, i) => (
            <div key={l.n} ref={(el) => void (items.current[i + 1] = el)} className={itemCls} style={{ opacity: 0 }}>
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                <span style={numStyle}>{l.n}</span>
                <span style={{ color: alpha(RISO.ink, 0.5) }}>/ 03 · Scrambled at 14</span>
              </div>
              <p style={lineFont}>
                <Chunked text={l.text} reveal={l.r} />
                {i === 2 && (
                  <>
                    {" "}
                    <Chunked text={COPY.habit} reveal={rH} style={{ color: RISO.pink }} />
                  </>
                )}
              </p>
            </div>
          ))}
          <div ref={(el) => void (items.current[4] = el)} className={`${itemCls} pointer-events-auto`} style={{ opacity: 0 }}>
            {buttons}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={root} className="pointer-events-none absolute" style={{ left: box.x, top: box.y, width: box.w, zIndex: 5, color: RISO.ink, visibility: "hidden" }}>
      <Headline reveal={rHead} />
      <ol className="mt-7 flex flex-col">
        {lines.map((l, i) => (
          <li key={l.n} className="flex gap-4 py-3.5" style={{ borderTop: `1px solid ${alpha(RISO.ink, 0.16)}` }}>
            <span className="pt-[7px] font-mono text-[11px] tracking-[0.14em]" style={numStyle}>
              {l.n}
            </span>
            <p style={lineFont}>
              <Chunked text={l.text} reveal={l.r} />
              {i === 2 && (
                <>
                  {" "}
                  <Chunked text={COPY.habit} reveal={rH} style={{ color: RISO.pink }} />
                </>
              )}
            </p>
          </li>
        ))}
      </ol>
      <div className="pointer-events-auto pt-2" style={{ borderTop: `1px solid ${alpha(RISO.ink, 0.16)}` }}>
        {buttons}
      </div>
    </div>
  );
}

function Headline({ reveal, mobile }: { reveal: Reveal; mobile?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: alpha(RISO.ink, 0.6) }}>
        World 03 · Rubik&apos;s · Age 14
      </div>
      <h3 className="mt-2 uppercase" style={{ fontFamily: "var(--f-rubik-mono)", fontSize: mobile ? 38 : 46, lineHeight: 1.02, letterSpacing: "-0.01em" }}>
        {/* break after the scrambled word so the line never orphans "14." */}
        <Chunked text={COPY.headline.replace(" ", "\n")} reveal={reveal} />
      </h3>
    </div>
  );
}
