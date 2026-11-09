"use client";

/**
 * The nine domains are banknote microprint: real text running along real
 * crests, too small to read. A loupe walks the ridge (or follows the mouse) and
 * the shader magnifies the print under it, so the words come up legible, and
 * each one lights in the column as it passes under the glass.
 */
import { useEffect, useMemo, useRef } from "react";
import { clamp, easeInOutCubic, range, smoothstep } from "@/components/life/multiverse/ease";
import { alpha, mix, RISO } from "@/components/life/multiverse/palette";
import { usePointer, useStage, useTicker } from "@/components/life/multiverse/runtime";
import { BEAT } from "./beats";
import { printToStage } from "./camera";
import { DOMAINS, HONEST } from "./copy";
import type { V2 } from "./field";
import { fade, place, windowed } from "./fx";
import { BIG, MONO, SERIF, desk, isStacked, phone } from "./layout";
import type { Rig } from "./rig";
import { SVG_U, arcTable, crestLine, pathD, pointAtArc } from "./ridges";

const WALK_CREST = 17;
const FILL_CRESTS = [4, 7, 21] as const;
/** Microprint size in print units: fits inside one ridge. */
const FS = 0.0096;
const ADV = FS * 0.6;
const SEP = " · · · ";

const LIT = [RISO.sun, RISO.pink, mix(RISO.cobalt, RISO.paper, 0.32), mix(RISO.teal, RISO.paper, 0.28), RISO.paper, RISO.sun, RISO.pink, mix(RISO.cobalt, RISO.paper, 0.32), mix(RISO.teal, RISO.paper, 0.28)];

function microprint() {
  const run = DOMAINS.map((d) => d.toUpperCase()).join(SEP) + SEP;
  // where each word's middle falls in the run, in characters
  const mids: number[] = [];
  let at = 0;
  for (const d of DOMAINS) {
    mids.push(at + d.length / 2);
    at += d.length + SEP.length;
  }
  const walk = crestLine(WALK_CREST, 163, 359, 720);
  const arcs = arcTable(walk);
  const crests = [WALK_CREST, ...FILL_CRESTS].map((n, i) => {
    const pts = i === 0 ? walk : crestLine(n, 90 + n * 37, 359, 420);
    const len = arcTable(pts).at(-1) ?? 0;
    return { n, d: pathD(pts), text: run.repeat(Math.ceil(len / (run.length * ADV))) };
  });
  const way: V2[] = mids.map((m) => pointAtArc(walk, arcs, m * ADV));
  return { crests, way };
}

export function DomainsAct({ rig }: { rig: Rig }) {
  const stage = useStage();
  const W = stage.width;
  const H = stage.height;
  const stacked = isStacked(W, H);
  const k = stacked ? phone(W, H) : desk(W, H);
  const pointer = usePointer();

  const print = useMemo(microprint, []);
  const R = (stacked ? 74 : 104) * k;
  const mag = stacked ? 3.1 : 2.75;

  const microWrap = useRef<HTMLDivElement>(null);
  const microSvg = useRef<SVGSVGElement>(null);
  const loupe = useRef<HTMLDivElement>(null);
  const loupeSvg = useRef<SVGSVGElement>(null);
  const loupeFrame = useRef<HTMLDivElement>(null);
  const domBlock = useRef<HTMLDivElement>(null);
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const honestBlock = useRef<HTMLDivElement>(null);
  const honest2 = useRef<HTMLParagraphElement>(null);
  const scrim = useRef<HTMLDivElement>(null);

  // the mouse can take the loupe; `hold` eases between the scroll path and the hand
  const hand = useRef({ hold: 0, x: 0, y: 0 });
  const dragging = useRef(false);

  const sync = (dt: number) => {
    const p = rig.p;
    const f = rig.frame;
    const [da, db] = BEAT.domains;
    const open = smoothstep(range(p, da + 0.006, da + 0.02)) * (1 - smoothstep(range(p, BEAT.honest[0] + 0.03, BEAT.toValues[0])));
    if (open <= 0) {
      if (rig.lens.R !== 0 || dt === 0) {
        rig.lens.R = 0;
        fade(loupe.current, 0);
        fade(loupeFrame.current, 0);
        fade(microWrap.current, 0);
      }
      return;
    }

    // scroll path: dwell on each word, glide between them
    const t = range(p, da + 0.012, db - 0.004) * (DOMAINS.length - 1);
    const i = Math.min(DOMAINS.length - 2, Math.floor(t));
    const e = easeInOutCubic(clamp((t - i - 0.28) / 0.72));
    const a = print.way[i];
    const b = print.way[i + 1];
    let lx = a.x + (b.x - a.x) * e;
    let ly = a.y + (b.y - a.y) * e;

    // pointer override on devices with a real mouse
    const [ox, oy, S] = printToStage(f, W, H, 0, 0);
    const h = hand.current;
    const mouse = pointer.type.current === "mouse" && pointer.inside.get() > 0 && !stacked;
    const px = (pointer.x.get() - ox) / S;
    const py = (oy - pointer.y.get()) / S;
    const over = dragging.current || (mouse && Math.abs(px) < 0.52 && Math.abs(py) < 0.7);
    h.hold += ((over ? 1 : 0) - h.hold) * Math.min(1, dt * 7);
    h.x += (px - h.x) * Math.min(1, dt * 11);
    h.y += (py - h.y) * Math.min(1, dt * 11);
    if (h.hold > 0.001) {
      lx += (h.x - lx) * h.hold;
      ly += (h.y - ly) * h.hold;
    }

    const lens = rig.lens;
    lens.x = lx;
    lens.y = ly;
    lens.R = (R * open) / S;
    lens.mag = mag;

    const [sx, sy] = printToStage(f, W, H, lx, ly);
    const shown = R * open;
    if (microWrap.current) {
      const mask = `radial-gradient(circle ${shown.toFixed(1)}px at ${sx.toFixed(1)}px ${sy.toFixed(1)}px, transparent 97%, #000 100%)`;
      microWrap.current.style.maskImage = mask;
      microWrap.current.style.setProperty("-webkit-mask-image", mask);
    }
    fade(microWrap.current, open);
    if (microSvg.current) microSvg.current.style.transform = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) scale(${(S / SVG_U).toFixed(5)})`;

    // the glass and the magnified disc open as one iris
    place(loupe.current, 1, `translate3d(${(sx - R).toFixed(2)}px, ${(sy - R).toFixed(2)}px, 0) scale(${open.toFixed(3)})`);
    place(loupeFrame.current, Math.min(1, open * 4), `translate3d(${(sx - R).toFixed(2)}px, ${(sy - R).toFixed(2)}px, 0) scale(${open.toFixed(3)})`);
    if (loupeSvg.current) {
      const m = (S * mag) / SVG_U;
      loupeSvg.current.style.transform = `scale(${m.toFixed(5)}) translate(${(-lx * SVG_U).toFixed(2)}px, ${(ly * SVG_U).toFixed(2)}px)`;
    }
  };

  useTicker((_, dt) => sync(dt));

  useEffect(
    () =>
      rig.subscribe(windowed(BEAT.domains[0] - 0.012, BEAT.toValues[1] + 0.012, (p) => {
        sync(0);

        const [da, db] = BEAT.domains;
        const [ha] = BEAT.honest;
        const blockIn = smoothstep(range(p, da, da + 0.012));
        const blockOut = smoothstep(range(p, ha, ha + 0.012));
        const gone = smoothstep(range(p, BEAT.toValues[0] - 0.012, BEAT.toValues[0]));
        place(domBlock.current, blockIn * (1 - blockOut) * (1 - gone), `translate3d(0, ${(-blockOut * (stacked ? 16 : 34) * k).toFixed(1)}px, 0)`);

        const stepW = (db - 0.004 - (da + 0.012)) / (DOMAINS.length - 1);
        words.current.forEach((el, i) => {
          if (!el) return;
          const at = da + 0.012 + stepW * i;
          const on = smoothstep(range(p, at - stepW * 0.5, at + stepW * 0.15));
          el.style.color = on > 0.5 ? LIT[i] : alpha(RISO.paper, 0.2 + on * 0.5);
          el.style.opacity = String(0.55 + 0.45 * on);
          el.style.transform = `translate3d(0, ${((1 - on) * 10 * k).toFixed(1)}px, 0)`;
        });

        // the print leaves for the left column only once this has cleared it
        const out = smoothstep(range(p, BEAT.toValues[0] - 0.014, BEAT.toValues[0] + 0.002));
        const inA = smoothstep(range(p, ha + 0.008, ha + 0.022));
        place(honestBlock.current, inA * (1 - out), `translate3d(0, ${((1 - inA) * 20 * k - out * 14 * k).toFixed(1)}px, 0)`);
        if (honest2.current) honest2.current.style.opacity = smoothstep(range(p, ha + 0.022, ha + 0.034)).toFixed(3);

        fade(scrim.current, stacked ? blockIn * (1 - out) : 0);
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rig, W, H, stacked, k],
  );

  const microFill = alpha(RISO.ink, 0.92);
  const microText = (key: string) => (
    <g style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 600 }} fontSize={FS * SVG_U} fill={microFill}>
      {print.crests.map((c) => (
        <g key={c.n}>
          <path id={`${key}${c.n}`} d={c.d} fill="none" />
          <text dy="0.34em">
            <textPath href={`#${key}${c.n}`}>{c.text}</textPath>
          </text>
        </g>
      ))}
    </g>
  );

  const col = stacked
    ? { left: 20, width: W - 40, top: H * 0.585 }
    : { left: Math.max(36, W * 0.065), width: W * 0.43, top: H * 0.5 };

  const dSize = (stacked ? 41 : 74) * k;
  const hSize = (stacked ? 37 : 72) * k;

  return (
    <>
      <div
        ref={scrim}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{ top: H * 0.56, background: `linear-gradient(180deg, ${alpha(RISO.ink, 0)}, ${alpha(RISO.ink, 0.92)} 22%, ${alpha(RISO.ink, 0.97)})`, visibility: "hidden" }}
      />

      {/* microprint on the ridges */}
      <div ref={microWrap} aria-hidden className="pointer-events-none absolute inset-0" style={{ visibility: "hidden" }}>
        <svg ref={microSvg} width={1} height={1} className="absolute left-0 top-0" style={{ overflow: "visible", transformOrigin: "0 0", willChange: "transform" }}>
          {microText("mp")}
        </svg>
      </div>

      {/* the same microprint, magnified with the ridges under the glass */}
      <div
        ref={loupe}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0"
        style={{ width: R * 2, height: R * 2, borderRadius: "50%", overflow: "hidden", visibility: "hidden" }}
      >
        <svg ref={loupeSvg} width={1} height={1} className="absolute" style={{ left: R, top: R, overflow: "visible", transformOrigin: "0 0" }}>
          {microText("lp")}
        </svg>
      </div>
      <div
        ref={loupeFrame}
        aria-hidden
        data-swipe-ignore
        className="absolute left-0 top-0"
        onPointerDown={(e) => {
          if (e.pointerType === "mouse") return;
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
        style={{
          touchAction: "none",
          width: R * 2,
          height: R * 2,
          borderRadius: "50%",
          border: `${Math.max(2, 2.4 * k)}px solid ${RISO.paper}`,
          boxShadow: `0 0 0 ${Math.max(3, 4 * k)}px ${alpha(RISO.ink, 0.92)}, 0 0 0 ${Math.max(4, 5.5 * k)}px ${RISO.cobalt}, 0 ${10 * k}px ${40 * k}px ${alpha(RISO.ink, 0.65)}`,
          visibility: "hidden",
        }}
      />

      {/* the column */}
      <div
        ref={domBlock}
        className="pointer-events-none absolute"
        style={{ left: col.left, width: col.width, top: col.top, visibility: "hidden", ...(stacked ? {} : { marginTop: -(dSize * 2.9) }) }}
      >
        <p style={{ ...MONO, fontSize: Math.max(10.5, 12 * k), color: RISO.paper, opacity: 0.68, margin: `0 0 ${(stacked ? 9 : 16) * k}px` }}>
          In the ridges · 9 domains
        </p>
        <ul className="m-0 flex list-none flex-wrap p-0" style={{ marginRight: -dSize * 0.42 }}>
          {DOMAINS.map((d, i) => (
            <li key={d} className="relative" style={{ paddingRight: dSize * 0.42 }}>
              <span
                ref={(el) => {
                  words.current[i] = el;
                }}
                style={{ ...BIG, fontSize: dSize, lineHeight: 1.02, textTransform: "uppercase", display: "inline-block", willChange: "transform" }}
              >
                {d}
              </span>
              {i < DOMAINS.length - 1 && (
                <span aria-hidden className="absolute" style={{ right: dSize * 0.15, top: "54%", width: dSize * 0.1, height: dSize * 0.1, borderRadius: "50%", background: alpha(RISO.paper, 0.3), transform: "translateY(-50%)" }} />
              )}
            </li>
          ))}
        </ul>
      </div>

      <div
        ref={honestBlock}
        className="pointer-events-none absolute"
        style={{
          ...SERIF,
          left: col.left,
          width: stacked ? col.width : col.width * 0.98,
          top: col.top,
          marginTop: stacked ? 0 : -(hSize * 2.15),
          color: RISO.paper,
          fontSize: hSize,
          lineHeight: 1.04,
          visibility: "hidden",
        }}
      >
        <p style={{ margin: 0 }}>{HONEST[0]}</p>
        <p ref={honest2} style={{ margin: `${0.36 * hSize}px 0 0`, color: RISO.sun, opacity: 0 }}>
          {HONEST[1]}
        </p>
      </div>
    </>
  );
}
