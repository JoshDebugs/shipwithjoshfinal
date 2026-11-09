"use client";

/**
 * Every word, as real DOM text. Lines rise out of a slot on the way in and
 * leave upward on the way out (progress-driven, reversible). Kinetic lines
 * "skate": scroll speed widens, weights and leans them, and they spring back
 * upright at rest.
 */
import { useRef, type CSSProperties, type ReactNode } from "react";
import type { MotionValue } from "framer-motion";
import { useProgress, useScrollVelocity, useTicker } from "@/components/life/multiverse/runtime";
import { bell, clamp, easeInCubic, easeOutCubic, range } from "@/components/life/multiverse/ease";
import { RISO, alpha, mix } from "@/components/life/multiverse/palette";
import { COPY } from "./copy";
import type { Layout } from "./layout";
import { BEAT, lapsAt } from "./timeline";

type Win = readonly [number, number, number, number];

const W = {
  laps: [0.088, 0.122, 0.35, 0.384],
  counter: [0.07, 0.085, 0.384, 0.4],
  state: [0.452, 0.482, 0.53, 0.552],
  stateTag: [0.468, 0.49, 0.53, 0.552],
  yoga: [0.566, 0.594, 0.708, 0.726],
  yogaState: [0.674, 0.692, 0.708, 0.726],
  yogaTag: [0.684, 0.698, 0.708, 0.726],
  odo: [0.728, 0.742, 0.856, 0.874],
  medals: [0.784, 0.804, 0.856, 0.874],
  receipts: [0.814, 0.836, 0.862, 0.882],
  exit: [0.897, 0.928, 2, 3],
} as const satisfies Record<string, Win>;

/** How far (% of its height) a line sits outside its slot: past the slot's descender allowance. */
const SLOT = 145;

const ODO_SEQ = ["01", "04", "09", "13", "17", "20", "25", "22", "24", "21", "25", "23"];

/** A line that rises out of a slot. `kin` lines also get the speed-stretch. */
function Line({ children, set, kin, style, className }: { children: ReactNode; set: (el: HTMLSpanElement | null) => void; kin?: (el: HTMLSpanElement | null) => void; style?: CSSProperties; className?: string }) {
  return (
    <span className="block" style={{ clipPath: "inset(-0.2em -100vw -0.3em -100vw)" }}>
      <span ref={set} className="block will-change-transform" style={{ transform: `translate3d(0,${SLOT}%,0)` }}>
        {kin ? (
          <span ref={kin} className={`inline-block origin-left ${className ?? ""}`} style={style}>
            {children}
          </span>
        ) : (
          <span className={`inline-block ${className ?? ""}`} style={style}>
            {children}
          </span>
        )}
      </span>
    </span>
  );
}

export function TextLayer({ progress, L }: { progress: MotionValue<number>; L: Layout }) {
  const lines = useRef<Record<string, HTMLSpanElement[]>>({});
  const blocks = useRef<Record<string, HTMLDivElement | null>>({});
  const kin = useRef<{ el: HTMLSpanElement; w0: number }[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleH = useRef<HTMLHeadingElement>(null);
  const misreg = useRef<HTMLSpanElement>(null);
  const chaseRef = useRef<HTMLSpanElement>(null);
  const lap00Ref = useRef<HTMLParagraphElement>(null);
  const lapNum = useRef<HTMLSpanElement>(null);
  const lapState = useRef<HTMLSpanElement>(null);
  const odoNum = useRef<HTMLSpanElement>(null);
  const inhale = useRef<HTMLSpanElement>(null);
  const exhale = useRef<HTMLSpanElement>(null);
  const breathRef = useRef<HTMLDivElement>(null);
  const velocity = useScrollVelocity();
  const sv = useRef(0);
  const lastK = useRef(-1);
  const pRef = useRef(0);

  const reg = (key: string, i: number) => (el: HTMLSpanElement | null) => {
    if (!el) return;
    (lines.current[key] ??= [])[i] = el;
  };
  const regKin = (w0: number) => (el: HTMLSpanElement | null) => {
    if (!el || kin.current.some((k) => k.el === el)) return;
    kin.current.push({ el, w0 });
  };
  const regBlock = (key: string) => (el: HTMLDivElement | null) => {
    blocks.current[key] = el;
  };

  const m = L.mobile;
  const { w, h } = L;
  const titlePx = m ? Math.min(0.158 * w, 66) : clamp(0.105 * w, 92, 176);
  const big = m ? 27 : clamp(0.03 * w, 32, 52);
  const serifPx = m ? 31 : clamp(0.036 * w, 36, 60);
  const odoPx = m ? 60 : clamp(0.135 * h, 84, 150);
  const colX = L.col.x;
  const colW = L.col.w;

  // phone copy sits under the rink/medal; desktop copy in the left column
  const copyTop = m ? Math.round(0.665 * h) : Math.round(0.36 * h);
  const counterTop = m ? 100 : Math.round(0.36 * h) - 92;

  useProgress(progress, (p) => {
    pRef.current = p;
    // title card: stable at p = 0, lifts away as the comet leaves the line
    const tOut = range(p, BEAT.titleOut[0], BEAT.titleOut[1]);
    const title = titleRef.current;
    if (title) {
      title.style.opacity = String(1 - easeInCubic(tOut));
      title.style.transform = `translate3d(0, ${-tOut * 40}px, 0)`;
      title.style.visibility = tOut >= 1 ? "hidden" : "visible";
      // the letters spread like a skater's stride; the pink pass slips off register
      if (titleH.current) titleH.current.style.letterSpacing = `${0.03 + easeOutCubic(tOut) * 0.22}em`;
      if (misreg.current) misreg.current.style.transform = `translate(${(m ? 2 : 4) + tOut * 22}px, ${(m ? 2 : 3) + tOut * 8}px)`;
    }

    // line reveals
    for (const [key, win] of Object.entries(W) as [keyof typeof W, Win][]) {
      const els = lines.current[key];
      const block = blocks.current[key];
      const on = p >= win[0] - 0.002 && p <= win[3] + 0.002;
      if (block) block.style.visibility = on ? "visible" : "hidden";
      if (!els || !on) continue;
      els.forEach((el, i) => {
        const a = easeOutCubic(range(p, win[0] + i * 0.007, win[1] + i * 0.007));
        const b = easeInCubic(range(p, win[2] + i * 0.004, win[3] + i * 0.004));
        el.style.transform = `translate3d(0, ${(1 - a) * SLOT - b * SLOT}%, 0)`;
      });
    }

    // lap counter
    const s = lapsAt(p, L.N);
    if (lapNum.current && lapState.current) {
      const lap = s <= 0 ? 0 : Math.min(L.N, Math.floor(s) + 1);
      lapNum.current.textContent = String(lap).padStart(2, "0");
      const fin = s >= L.N - 1e-3;
      const last = !fin && lap === L.N;
      lapState.current.textContent = fin ? "Finish" : last ? "Final lap" : "";
      lapState.current.style.color = fin ? RISO.sun : RISO.pink;
    }

    // odometer: it can't decide, then it tells the truth
    if (odoNum.current) {
      const x = range(p, BEAT.odo[0], BEAT.odo[1]);
      const txt = x >= 1 ? "20–25" : ODO_SEQ[Math.min(ODO_SEQ.length - 1, Math.floor(x * ODO_SEQ.length))];
      if (odoNum.current.textContent !== txt) odoNum.current.textContent = txt;
      const sub = (x * ODO_SEQ.length) % 1;
      odoNum.current.style.transform = x >= 1 ? `scale(${1 + 0.04 * (1 - easeOutCubic(range(p, BEAT.odo[1], BEAT.odo[1] + 0.012)))})` : `translate3d(0, ${(1 - easeOutCubic(Math.min(1, sub * 2.2))) * 0.18}em, 0)`;
    }

    // inhale / exhale
    if (breathRef.current && inhale.current && exhale.current) {
      const vis = bell(p, 0.556, 0.566, 0.664, 0.676);
      breathRef.current.style.opacity = String(vis);
      breathRef.current.style.visibility = vis > 0 ? "visible" : "hidden";
      const lotus = 8 * range(p, BEAT.lotus[0], BEAT.lotus[1]);
      const ph = lotus % 1;
      inhale.current.style.opacity = String(clamp(1 - Math.abs(ph - 0.25) / 0.3));
      exhale.current.style.opacity = String(clamp(1 - Math.abs(ph - 0.75) / 0.3));
    }
  });

  // ambient: the neon title's chase light, the scoreboard pulse, the skating type
  useTicker((t, dt) => {
    const p = pRef.current;
    if (p < 0.12) {
      if (chaseRef.current) chaseRef.current.style.backgroundPosition = `${100 - ((t * 22) % 200)}% 0`;
      if (lap00Ref.current) lap00Ref.current.style.opacity = String(0.55 + 0.45 * (0.5 + 0.5 * Math.cos(t * 3.4)));
    }
    sv.current += (velocity.get() - sv.current) * (1 - Math.exp(-dt * 10));
    const k = clamp(Math.abs(sv.current) / 40);
    if (Math.abs(k - lastK.current) < 0.004 && !(k === 0 && lastK.current !== 0)) return;
    lastK.current = k;
    const lean = -Math.sign(sv.current || 1) * k * 13;
    for (const { el, w0 } of kin.current) {
      el.style.transform = k > 0.001 ? `skewX(${lean.toFixed(2)}deg) scaleX(${(1 + 0.32 * k).toFixed(3)})` : "";
      el.style.fontVariationSettings = `'wght' ${Math.round(w0 + (900 - w0) * k)}`;
    }
  });

  const mono: CSSProperties = { fontFamily: "var(--font-geist-mono), ui-monospace, monospace", fontVariantNumeric: "tabular-nums" };
  const unb = (wght: number): CSSProperties => ({ fontFamily: "var(--f-unbounded)", fontVariationSettings: `'wght' ${wght}`, fontWeight: wght });
  const serif: CSSProperties = { fontFamily: "var(--f-cinzel)", fontWeight: 600 };
  const tag: CSSProperties = { ...mono, color: RISO.sun, fontSize: m ? 11 : 12, letterSpacing: "0.22em", textTransform: "uppercase" };

  const colStyle = (top: number, extra?: CSSProperties): CSSProperties => ({ position: "absolute", left: colX, top, width: colW, ...extra });

  return (
    <div className="pointer-events-none absolute inset-0 select-none" style={{ color: RISO.paper }}>
      {/* ---------------- title card */}
      <div ref={titleRef} className="absolute inset-0 flex flex-col items-center justify-center text-center will-change-transform" style={{ paddingTop: m ? 0 : 0.02 * h }}>
        <h2 ref={titleH} className="relative m-0 whitespace-nowrap" style={{ fontFamily: "var(--f-monoton)", fontSize: titlePx, lineHeight: 1.02, fontWeight: 400, letterSpacing: "0.03em" }}>
          <span ref={misreg} aria-hidden className="absolute inset-0" style={{ color: RISO.pink, transform: `translate(${m ? 2 : 4}px, ${m ? 2 : 3}px)`, textShadow: `0 0 ${m ? 14 : 30}px ${alpha(RISO.pink, 0.6)}` }}>
            {COPY.title}
          </span>
          <span
            ref={chaseRef}
            className="relative"
            style={{
              backgroundImage: `linear-gradient(100deg, ${RISO.sun} 0%, ${RISO.sun} 42%, ${RISO.paper} 50%, ${RISO.sun} 58%, ${RISO.sun} 100%)`,
              backgroundSize: "260% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {COPY.title}
          </span>
        </h2>
        <p className="m-0" style={{ marginTop: m ? 14 : 22, fontSize: m ? 14 : clamp(0.0165 * w, 16, 26), ...unb(400) }}>
          <span style={{ ...mono, color: RISO.sun, fontSize: "0.72em", letterSpacing: "0.2em", textTransform: "uppercase", verticalAlign: "0.12em" }}>{COPY.age} —</span>{" "}
          {COPY.headline}
        </p>
        <p ref={lap00Ref} className="m-0" style={{ ...mono, marginTop: m ? 12 : 16, color: RISO.sun, fontSize: m ? 11 : 13, letterSpacing: "0.3em" }}>
          LAP 00 / {L.N}
        </p>
      </div>

      {/* ---------------- lap counter (diegetic scoreboard) */}
      <div ref={regBlock("counter")} style={colStyle(counterTop, { visibility: "hidden" })}>
        <Line set={reg("counter", 0)} style={{ ...mono, color: RISO.sun, fontSize: m ? 12 : 14, letterSpacing: "0.28em" }}>
          LAP{" "}
          <span ref={lapNum} style={{ fontSize: m ? 34 : 56, letterSpacing: "-0.03em", fontWeight: 600, lineHeight: 1.15 }}>
            00
          </span>{" "}
          / {L.N}
          <span ref={lapState} className="ml-3" style={{ letterSpacing: "0.2em", textTransform: "uppercase" }} />
        </Line>
      </div>

      {/* ---------------- the laps */}
      <div ref={regBlock("laps")} style={colStyle(copyTop, { visibility: "hidden", fontSize: big, lineHeight: 1.08 })}>
        <Line set={reg("laps", 0)} kin={regKin(800)} style={unb(800)}>
          {COPY.laps[0]}
        </Line>
        <Line set={reg("laps", 1)} kin={regKin(300)} style={{ ...unb(300), color: alpha(RISO.paper, 0.92) }}>
          {COPY.laps[1]}
        </Line>
        <Line set={reg("laps", 2)} kin={regKin(300)} style={{ ...unb(300), color: alpha(RISO.paper, 0.92) }}>
          {COPY.laps[2]}
        </Line>
      </div>

      {/* ---------------- the strike */}
      <div ref={regBlock("state")} style={colStyle(copyTop, { visibility: "hidden", fontSize: serifPx, lineHeight: 1.1 })}>
        <Line set={reg("state", 0)} style={serif}>
          I reached
        </Line>
        <Line set={reg("state", 1)} style={{ ...serif, color: RISO.sun }}>
          state level.
        </Line>
      </div>
      <div ref={regBlock("stateTag")} style={colStyle(copyTop + serifPx * 2.3 + (m ? 6 : 14), { visibility: "hidden" })}>
        <Line set={reg("stateTag", 0)} style={tag}>
          {COPY.stateTag}
        </Line>
      </div>

      {/* ---------------- breath */}
      <div
        ref={breathRef}
        className={`absolute flex items-center ${m ? "justify-center" : "justify-start"}`}
        style={{
          ...(m
            ? { left: L.medal.x - 120, width: 240, top: L.medal.y + L.mRest * 1.21 + 10 }
            : { left: L.medal.x + L.mRest * 1.26 + 22, width: 160, top: L.medal.y - 12 }),
          height: 24,
          opacity: 0,
          visibility: "hidden",
          ...mono,
          fontSize: m ? 12 : 14,
          letterSpacing: "0.42em",
          textTransform: "uppercase",
        }}
      >
        <span ref={inhale} className="absolute" style={{ color: mix(RISO.teal, RISO.paper, 0.45) }}>
          inhale
        </span>
        <span ref={exhale} className="absolute" style={{ color: mix(RISO.cobalt, RISO.paper, 0.45) }}>
          exhale
        </span>
      </div>
      <div ref={regBlock("yoga")} style={colStyle(copyTop, { visibility: "hidden", fontSize: big * 0.92, lineHeight: 1.12 })}>
        <Line set={reg("yoga", 0)} style={unb(250)}>
          {COPY.yoga[0]}
        </Line>
        <Line set={reg("yoga", 1)} style={unb(250)}>
          {COPY.yoga[1]}
        </Line>
      </div>
      <div ref={regBlock("yogaState")} style={colStyle(copyTop + big * 0.92 * 2.3 + (m ? 4 : 10), { visibility: "hidden", fontSize: serifPx * 0.82 })}>
        <Line set={reg("yogaState", 0)} style={{ ...serif, color: RISO.teal }}>
          {COPY.yogaState}
        </Line>
      </div>
      <div ref={regBlock("yogaTag")} style={colStyle(copyTop + big * 0.92 * 2.3 + serifPx * 0.82 * 1.25 + (m ? 12 : 24), { visibility: "hidden" })}>
        <Line set={reg("yogaTag", 0)} style={tag}>
          {COPY.yogaTag}
        </Line>
      </div>

      {/* ---------------- receipts */}
      <div ref={regBlock("odo")} style={m ? colStyle(Math.round(0.6 * h), { visibility: "hidden" }) : colStyle(Math.round(0.555 * h), { visibility: "hidden", width: 0.4 * w })}>
        <Line set={reg("odo", 0)} style={{ ...tag, color: alpha(RISO.paper, 0.6) }}>
          {COPY.odoLabel}
        </Line>
        <Line set={reg("odo", 1)}>
          <span ref={odoNum} className="inline-block" style={{ ...mono, color: RISO.sun, fontSize: odoPx, lineHeight: 1, fontWeight: 600, letterSpacing: "-0.04em" }}>
            20
          </span>
        </Line>
      </div>
      <div
        ref={regBlock("medals")}
        style={
          m
            ? colStyle(Math.round(0.6 * h) + odoPx + 30, { visibility: "hidden", fontSize: 19, lineHeight: 1.25 })
            : { position: "absolute", left: 0.39 * w, top: Math.round(0.59 * h), width: 0.4 * w, visibility: "hidden", fontSize: clamp(0.02 * w, 22, 34), lineHeight: 1.2 }
        }
      >
        <Line set={reg("medals", 0)} style={unb(600)}>
          {COPY.medals[0]}
        </Line>
        <Line set={reg("medals", 1)} style={{ ...unb(300), color: alpha(RISO.paper, 0.85) }}>
          {COPY.medals[1]}
        </Line>
      </div>
      <div
        ref={regBlock("receipts")}
        style={
          m
            ? colStyle(Math.round(0.6 * h) + odoPx + 30 + 56, { visibility: "hidden", fontSize: 19, lineHeight: 1.25 })
            : { position: "absolute", left: 0.39 * w, top: Math.round(0.59 * h) + clamp(0.02 * w, 22, 34) * 2.9, width: 0.42 * w, visibility: "hidden", fontSize: clamp(0.026 * w, 26, 44), lineHeight: 1.1 }
        }
      >
        <Line set={reg("receipts", 0)} kin={regKin(800)} style={unb(800)}>
          {COPY.receipts[0]}
        </Line>
        <Line set={reg("receipts", 1)} kin={regKin(800)} style={unb(800)}>
          receipts <span style={{ color: RISO.sun }}>for the laps.</span>
        </Line>
      </div>

      {/* ---------------- another direction */}
      <div ref={regBlock("exit")} style={colStyle(m ? Math.round(0.79 * h) : Math.round(0.745 * h), { visibility: "hidden", fontSize: m ? 25 : clamp(0.03 * w, 32, 50), lineHeight: 1.1, width: m ? colW : 0.5 * w })}>
        <Line set={reg("exit", 0)} kin={regKin(700)} style={unb(700)}>
          {COPY.exit[0]}
        </Line>
        <Line set={reg("exit", 1)} kin={regKin(700)} style={{ ...unb(700), color: RISO.pink }}>
          {COPY.exit[1]}
        </Line>
      </div>
    </div>
  );
}
