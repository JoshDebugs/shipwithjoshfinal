"use client";

/**
 * The last column of the case file. The live edge draws itself around the
 * print and never quite closes, the delta fans five ridges off the print toward
 * what comes next, and the pen leaves the print altogether: it underlines the
 * last sentence and curls into the thumbprint that takes you home.
 */
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { easeInOutCubic, easeOutCubic, range, smoothstep } from "@/components/life/multiverse/ease";
import { alpha, mix, RISO } from "@/components/life/multiverse/palette";
import { useStage } from "@/components/life/multiverse/runtime";
import { BEAT } from "./beats";
import { docks, printToStage } from "./camera";
import { BACK, CURRENTLY, NEXT, STORY } from "./copy";
import { fade, place, windowed } from "./fx";
import { BIG, MONO, SERIF, desk, isStacked, phone } from "./layout";
import type { Rig } from "./rig";
import { penRestDeg } from "./state";
import { SVG_U, crestLine, onCrest, pathD } from "./ridges";
import { CTA_CSS, Thumbprint } from "./Thumbprint";

const STRAND = [RISO.sun, RISO.pink, mix(RISO.cobalt, RISO.paper, 0.3), mix(RISO.teal, RISO.paper, 0.3), RISO.paper];

function geo(W: number, H: number) {
  const stacked = isStacked(W, H);
  // desktop: the column must clear the site nav above and the HUD below at any height
  const k = stacked ? phone(W, H) : Math.max(0.42, Math.min(desk(W, H), (H - 218) / 682));
  const all = docks(W, H);
  const d = all.finale;
  const toStage = (x: number, y: number): [number, number] => [d.sx + (x - d.cx) * d.S, d.sy - (y - d.cy) * d.S];
  // where the print ends up for the last beat (phones grow it back)
  const e = all.ending;
  const toEnd = (x: number, y: number): [number, number] => [e.sx + (x - e.cx) * e.S, e.sy - (y - e.cy) * e.S];
  const left = stacked ? 20 : W * 0.552;
  const width = stacked ? W - 40 : Math.min(W * 0.4, W - left - Math.max(36, W * 0.05));

  const printBottom = toStage(0, -0.675)[1];
  const copyTop = stacked ? printBottom + 12 * k : Math.max(Math.min(122, H * 0.16), 128 * k + Math.max(0, (H - 900 * k) * 0.18));

  // row positions (desktop: one column filled top to bottom)
  const currentY = copyTop;
  const itemsSize = (stacked ? 42 : 40) * k;
  const yearSize = (stacked ? 54 : 66) * k;
  const nextY = stacked ? copyTop : copyTop + yearSize + itemsSize * 2.5 + 26 * k;
  const nextHead = (stacked ? 30 : 34) * k;
  // on a phone the two longest goals take two lines
  const rowHs = NEXT.map((n) => (stacked ? (n.length > 32 ? 66 : 39) : 48) * k);
  const rowsTop = nextY + nextHead + (stacked ? 10 : 14) * k;
  const rowMid = (i: number) => rowsTop + rowHs.slice(0, i).reduce((a, b) => a + b, 0) + rowHs[i] / 2;
  const rowsH = rowHs.reduce((a, b) => a + b, 0);

  const storySize = (stacked ? 50 : 76) * k;
  const storyTop = stacked ? toEnd(0, -0.675)[1] + 8 * k : rowsTop + rowsH + 20 * k;
  const underY = storyTop + storySize * 1.14;

  const thumbW = (stacked ? 68 : 62) * k;
  const thumbH = thumbW * 1.32;
  const ctaTop = underY + (stacked ? 28 : 18) * k;

  // the delta the five ridges fan out of
  const deltaDeg = stacked ? -118 : -36;
  const delta = toStage(onCrest(deltaDeg, 22.4).x, onCrest(deltaDeg, 22.4).y);

  // the pen's way out
  const tipP = onCrest(penRestDeg(stacked), 23);
  const tip = toEnd(tipP.x, tipP.y);
  // a ruled line under the last sentence, the width of the column
  const startX = left;
  const endX = left + width;
  const thumbCx = stacked ? W / 2 : left + width - thumbW / 2;
  const thumbCy = ctaTop + thumbH / 2;
  // leaves the tip, runs the rule, then hooks round into the thumb's shoulder
  const hx = thumbCx + thumbW * (stacked ? 0.46 : 0.48);
  const hy = thumbCy - thumbH * 0.16;
  const hook = stacked
    ? `C${(endX + 8 * k).toFixed(1)} ${underY.toFixed(1)} ${(endX + 8 * k).toFixed(1)} ${(hy - 22 * k).toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)}`
    : `C${(endX + 46 * k).toFixed(1)} ${underY.toFixed(1)} ${(endX + 40 * k).toFixed(1)} ${(hy - 10 * k).toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)}`;
  // every join is tangent: the pen never makes a corner
  const leave = stacked
    ? `C${tip[0].toFixed(1)} ${(tip[1] + 44 * k).toFixed(1)} ${startX.toFixed(1)} ${(underY - 110 * k).toFixed(1)} ${startX.toFixed(1)} ${(underY - 24 * k).toFixed(1)}Q${startX.toFixed(1)} ${underY.toFixed(1)} ${(startX + 24 * k).toFixed(1)} ${underY.toFixed(1)}`
    : `C${(tip[0] + 16 * k).toFixed(1)} ${(tip[1] - 54 * k).toFixed(1)} ${(startX - 84 * k).toFixed(1)} ${underY.toFixed(1)} ${startX.toFixed(1)} ${underY.toFixed(1)}`;
  const penPath = `M${tip[0].toFixed(1)} ${tip[1].toFixed(1)}${leave}L${endX.toFixed(1)} ${underY.toFixed(1)}${hook}`;

  return {
    stacked, k, d, left, width, currentY, itemsSize, yearSize, nextY, nextHead, rowHs, rowsTop, rowMid,
    storySize, storyTop, underY, thumbW, thumbH, ctaTop, delta, penPath, thumbCx,
  };
}

/** The live edge's own legend, set just outside the sun ridge. */
const EDGE_TEXT = `2026 · CURRENTLY · ${CURRENTLY.join(" · ").toUpperCase()} · `;

export function FinaleAct({ rig }: { rig: Rig }) {
  const stage = useStage();
  const W = stage.width;
  const H = stage.height;
  const g = useMemo(() => geo(W, H), [W, H]);
  const { stacked, k } = g;

  const edge = useMemo(() => {
    // clockwise so it reads like a seal; the reveal below runs from its far end, with the pen
    const pts = crestLine(24.6, penRestDeg(stacked) - 6 + 360, 340, 480);
    return { d: pathD(pts), maskD: pathD(pts) };
  }, [stacked]);

  const current = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const nextBlock = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const strands = useRef<(SVGPathElement | null)[]>([]);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const story = useRef<HTMLParagraphElement>(null);
  const pen = useRef<SVGPathElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const edgeSvg = useRef<SVGSVGElement>(null);
  const edgeMask = useRef<SVGPathElement>(null);
  const scrim = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      rig.subscribe(windowed(BEAT.finale[0] - 0.012, 1.01, (p, f) => {
        const [fa] = BEAT.finale;
        const [na, nb] = BEAT.next;
        const [sa, sb] = BEAT.story;

        const curIn = smoothstep(range(p, fa + 0.004, fa + 0.022));
        const curOut = stacked ? smoothstep(range(p, na - 0.003, na + 0.009)) : 0.26 * smoothstep(range(p, na, na + 0.018));
        place(current.current, curIn * (1 - curOut), `translate3d(0, ${((1 - curIn) * 18 * k).toFixed(1)}px, 0)`);
        items.current.forEach((el, i) => {
          if (!el) return;
          const t = smoothstep(range(p, fa + 0.012 + i * 0.006, fa + 0.024 + i * 0.006));
          el.style.opacity = String(t);
          el.style.transform = `translate3d(0, ${((1 - t) * 10 * k).toFixed(1)}px, 0)`;
        });

        // phones need the whole list on screen before the print takes the page back
        const span = stacked ? 0.042 : nb - na - 0.012;
        const nextIn = smoothstep(range(p, na, na + 0.012));
        const nextOut = stacked ? smoothstep(range(p, sa - 0.006, sa + 0.006)) : 0.18 * smoothstep(range(p, sa, sb));
        place(nextBlock.current, nextIn * (1 - nextOut), "none");
        rows.current.forEach((el, i) => {
          if (!el) return;
          const at = na + 0.008 + (span * i) / 5;
          const t = smoothstep(range(p, at, at + 0.012));
          el.style.opacity = String(t);
          el.style.transform = `translate3d(${((1 - t) * 18 * k).toFixed(1)}px, 0, 0)`;
          const st = strands.current[i];
          const dot = dots.current[i];
          const draw = easeInOutCubic(range(p, at - 0.006, at + 0.012));
          const hide = stacked ? 1 - smoothstep(range(p, sa - 0.006, sa + 0.006)) : 1 - 0.55 * smoothstep(range(p, sa, sb));
          if (st) {
            st.style.visibility = draw > 0 && hide > 0.004 ? "visible" : "hidden";
            st.style.strokeDasharray = `${draw.toFixed(4)} 1`;
            st.style.opacity = hide.toFixed(3);
          }
          if (dot) {
            dot.style.visibility = t > 0.5 && hide > 0.004 ? "visible" : "hidden";
            dot.style.opacity = hide.toFixed(3);
          }
        });

        // the legend rides the pen around the print
        const penT = smoothstep(range(p, fa, nb));
        const printShown = smoothstep(range(p, fa - 0.004, fa + 0.012));
        fade(edgeSvg.current, printShown);
        if (edgeSvg.current && printShown > 0) {
          const [ox, oy, S] = printToStage(f, W, H, 0, 0);
          edgeSvg.current.style.transform = `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0) scale(${(S / SVG_U).toFixed(5)})`;
          if (edgeMask.current) {
            edgeMask.current.style.strokeDasharray = `${penT.toFixed(4)} 1`;
            edgeMask.current.style.strokeDashoffset = (penT - 1).toFixed(4);
          }
        }

        // the last line, and the pen's way out of the print
        const storyIn = smoothstep(range(p, sa, sa + 0.016));
        place(story.current, storyIn, `translate3d(0, ${((1 - storyIn) * 22 * k).toFixed(1)}px, 0)`);
        const penOut = easeInOutCubic(range(p, sa + 0.003, sb - 0.008));
        if (pen.current) {
          pen.current.style.visibility = penOut > 0 ? "visible" : "hidden";
          pen.current.style.strokeDasharray = `${penOut.toFixed(4)} 1`;
        }
        const ctaIn = easeOutCubic(range(p, sb - 0.014, sb));
        place(cta.current, ctaIn, `translate3d(0, ${((1 - ctaIn) * 16 * k).toFixed(1)}px, 0) scale(${(0.9 + 0.1 * ctaIn).toFixed(3)})`);
        if (stacked) {
          const down = easeInOutCubic(range(p, sa - 0.016, sa + 0.002));
          place(scrim.current, smoothstep(range(p, fa, fa + 0.014)), `translate3d(0, ${(down * (g.storyTop - 40 * k - g.currentY + 54 * k)).toFixed(1)}px, 0)`);
        }
      })),
    [rig, g, stacked, k, W, H],
  );

  const curY = g.currentY;
  const fanX = () => (stacked ? g.left + 7 * k : g.left - 14 * k);
  const fanY = (i: number) => g.rowMid(i);

  const strandD = (i: number) => {
    const [dx, dy] = g.delta;
    const x = fanX();
    const y = fanY(i);
    if (stacked) {
      // down the left gutter, one lane each, so a ridge never crosses a line of text
      const gx = (8 + i * 2.6) * k;
      const top = g.rowsTop - 16 * k;
      return `M${dx.toFixed(1)} ${dy.toFixed(1)}C${dx.toFixed(1)} ${(dy + 30 * k).toFixed(1)} ${gx.toFixed(1)} ${(top - 50 * k).toFixed(1)} ${gx.toFixed(1)} ${top.toFixed(1)}L${gx.toFixed(1)} ${(y - 11 * k).toFixed(1)}Q${gx.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    const mid = dx + (x - dx) * (0.38 + i * 0.05);
    return `M${dx.toFixed(1)} ${dy.toFixed(1)}C${mid.toFixed(1)} ${dy.toFixed(1)} ${mid.toFixed(1)} ${y.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`;
  };

  return (
    <>
      <style>{CTA_CSS}</style>

      {stacked && (
        <div
          ref={scrim}
          aria-hidden
          className="pointer-events-none absolute"
          style={{ left: 0, right: 0, top: g.currentY - 54 * k, bottom: 0, background: `linear-gradient(180deg, ${alpha(RISO.ink, 0)}, ${alpha(RISO.ink, 0.88)} 12%, ${RISO.ink} 40%)`, visibility: "hidden" }}
        />
      )}

      {/* the legend on the live edge */}
      <svg ref={edgeSvg} aria-hidden width={1} height={1} className="pointer-events-none absolute left-0 top-0" style={{ overflow: "visible", transformOrigin: "0 0", visibility: "hidden", willChange: "transform" }}>
        <defs>
          <path id="outro-edge" d={edge.d} fill="none" />
          <mask id="outro-edge-mask" maskUnits="userSpaceOnUse" x={-900} y={-1000} width={1800} height={2000}>
            <path ref={edgeMask} d={edge.maskD} fill="none" stroke="#fff" strokeWidth={60} pathLength={1} />
          </mask>
        </defs>
        <g mask="url(#outro-edge-mask)">
          <text dy="0.34em" fill={RISO.sun} stroke={RISO.ink} strokeWidth={5} style={{ paintOrder: "stroke fill", fontFamily: "var(--font-geist-mono)", fontWeight: 600, letterSpacing: "0.1em" }} fontSize={stacked ? 19 : 15.5}>
            <textPath href="#outro-edge">{EDGE_TEXT.repeat(4)}</textPath>
          </text>
        </g>
      </svg>

      {/* ridges fanning out of the delta */}
      <svg aria-hidden className="pointer-events-none absolute inset-0" width={W} height={H} style={{ overflow: "visible" }}>
        <g fill="none" strokeLinecap="round" strokeWidth={Math.max(2, 2.8 * k)}>
          {NEXT.map((n, i) => (
            <path
              key={n}
              ref={(el) => {
                strands.current[i] = el;
              }}
              d={strandD(i)}
              pathLength={1}
              stroke={STRAND[i]}
              style={{ visibility: "hidden" }}
            />
          ))}
          <path ref={pen} d={g.penPath} pathLength={1} stroke={RISO.sun} strokeWidth={Math.max(2.4, 3 * k)} style={{ visibility: "hidden" }} />
        </g>
        {NEXT.map((n, i) => (
          <circle
            key={n}
            ref={(el) => {
              dots.current[i] = el;
            }}
            cx={fanX()}
            cy={fanY(i)}
            r={Math.max(3, 4 * k)}
            fill={STRAND[i]}
            style={{ visibility: "hidden" }}
          />
        ))}
      </svg>

      {/* 2026 · currently */}
      <div ref={current} className="pointer-events-none absolute" style={{ left: g.left, width: g.width, top: curY, visibility: "hidden" }}>
        <div className="flex items-baseline" style={{ gap: 12 * k }}>
          <span style={{ ...BIG, fontSize: g.yearSize, lineHeight: 1, color: RISO.sun }}>2026</span>
          <h3 style={{ ...MONO, fontSize: Math.max(11, 13 * k), margin: 0, color: RISO.paper, letterSpacing: "0.22em", fontWeight: 500 }}>Currently</h3>
        </div>
        <ul className="m-0 flex list-none flex-wrap p-0" style={{ marginTop: 6 * k, columnGap: g.itemsSize * 0.36, rowGap: 0 }}>
          {CURRENTLY.map((c, i) => (
            <li
              key={c}
              ref={(el) => {
                items.current[i] = el;
              }}
              style={{ ...BIG, fontSize: g.itemsSize, lineHeight: 1.14, color: RISO.paper, fontWeight: 800, whiteSpace: "nowrap", opacity: 0 }}
            >
              {c}
              {i < CURRENTLY.length - 1 && <span aria-hidden style={{ color: alpha(RISO.paper, 0.36), marginLeft: g.itemsSize * 0.36 }}>·</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* next */}
      <div ref={nextBlock} className="pointer-events-none absolute" style={{ left: g.left, width: g.width, top: g.nextY, visibility: "hidden" }}>
        <h3 style={{ ...BIG, fontSize: g.nextHead, lineHeight: 1, margin: 0, color: RISO.sun, letterSpacing: "0.04em" }}>NEXT</h3>
        <ol className="m-0 list-none p-0" style={{ marginTop: (stacked ? 10 : 14) * k }}>
          {NEXT.map((n, i) => (
            <li
              key={n}
              ref={(el) => {
                rows.current[i] = el;
              }}
              style={{
                ...BIG,
                height: g.rowHs[i],
                display: "flex",
                alignItems: "center",
                paddingLeft: (stacked ? 22 : 12) * k,
                fontSize: (stacked ? 28 : 41) * k,
                lineHeight: 1.02,
                fontWeight: 700,
                color: RISO.paper,
                opacity: 0,
              }}
            >
              {n}
            </li>
          ))}
        </ol>
      </div>

      {/* the end */}
      <p
        ref={story}
        className="pointer-events-none absolute"
        style={{
          ...SERIF,
          margin: 0,
          left: stacked ? 0 : g.left,
          right: stacked ? 0 : undefined,
          textAlign: stacked ? "center" : "left",
          top: g.storyTop,
          fontSize: g.storySize,
          lineHeight: 1.1,
          color: RISO.paper,
          whiteSpace: "nowrap",
          visibility: "hidden",
        }}
      >
        {STORY}
      </p>

      <div
        ref={cta}
        className="absolute"
        style={{
          left: stacked ? 0 : g.left,
          width: stacked ? W : g.width,
          top: g.ctaTop,
          display: "flex",
          justifyContent: stacked ? "center" : "flex-end",
          visibility: "hidden",
          ["--outro-sun" as string]: RISO.sun,
          ["--outro-paper" as string]: RISO.paper,
        }}
      >
        <Link href="/" className="outro-cta" style={{ gap: 18 * k, padding: `${4 * k}px ${6 * k}px`, flexDirection: stacked ? "column-reverse" : "row" }}>
          <span className="outro-cta-label" style={{ ...BIG, fontSize: (stacked ? 33 : 42) * k, lineHeight: 1, letterSpacing: "0.015em", textTransform: "uppercase" }}>
            <span aria-hidden style={{ marginRight: "0.32em" }}>←</span>
            {BACK}
          </span>
          <span className="outro-cta-thumb relative block" style={{ width: g.thumbW, height: g.thumbH }}>
            <span className="outro-cta-bleed" aria-hidden style={{ inset: -g.thumbW * 0.4 }} />
            <Thumbprint size={g.thumbW} />
          </span>
        </Link>
      </div>
    </>
  );
}
