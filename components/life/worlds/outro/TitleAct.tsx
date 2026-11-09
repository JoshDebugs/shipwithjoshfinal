"use client";

/**
 * The title card, and the eleven portals. Each world's icon comes back to
 * orbit the question, then its outline pays out as one strand that dives into
 * the terrain and lights that world's band.
 */
import { useEffect, useMemo, useRef } from "react";
import { backOut, clamp, easeInCubic, easeInOutCubic, easeOutCubic, range, smoothstep } from "@/components/life/multiverse/ease";
import { alpha, RISO } from "@/components/life/multiverse/palette";
import { PORTAL_ICONS } from "@/components/life/multiverse/portalIcons";
import { useStage, useTicker } from "@/components/life/multiverse/runtime";
import { BANDS } from "./bands";
import { BEAT } from "./beats";
import { SUBJECT, TITLE } from "./copy";
import { fade, place, windowed } from "./fx";
import { CAP, EM, MONO, desk, isStacked, phone } from "./layout";
import { RidgedText, contours } from "./RidgedText";
import type { Rig } from "./rig";

/** Icon markup with a normalised path length on every shape, so one dash can pay it out. */
const iconBody = (id: keyof typeof PORTAL_ICONS) => PORTAL_ICONS[id].svg.replace(/<(path|circle|ellipse|rect)\b/g, '<$1 pathLength="1"');

function titleGeo(W: number, H: number) {
  const stacked = isStacked(W, H);
  const k = stacked ? phone(W, H) : desk(W, H);
  const blockW = stacked ? Math.min(W * 0.8, H * 0.44) : Math.min(W * 0.355, H * 0.57);
  const s1 = blockW / EM["SO WHAT’S"];
  const s3 = blockW / EM["PATTERN?"];
  const s2 = s1 * 0.4;
  const gap = s1 * 0.13;
  const y1 = CAP * s1;
  const y2 = y1 + gap + CAP * s2;
  const y3 = y2 + gap + CAP * s3;
  const tagGap = 40 * k;
  const tagH = (stacked ? 42 : 40) * k;
  const total = y3 + tagGap + tagH;
  const top = H / 2 - total / 2 + (stacked ? 0 : 6);
  const left = W / 2 - blockW / 2;
  const rings = contours(s1 / 150, RISO.cobalt, RISO.sun);
  const rx = stacked ? Math.min(W / 2 - 34 * k, blockW / 2 + 12 * k) : blockW / 2 + 150 * k;
  const ry = stacked ? total / 2 + 92 * k : total / 2 + 88 * k;
  const iconSize = (stacked ? 42 : 66) * k;
  return { stacked, k, blockW, s1, s2, s3, y1, y2, y3, tagGap, tagH, total, top, left, rings, rx, ry, iconSize };
}

export function TitleAct({ rig }: { rig: Rig }) {
  const stage = useStage();
  const W = stage.width;
  const H = stage.height;
  const g = useMemo(() => titleGeo(W, H), [W, H]);

  const wrap = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const caret = useRef<HTMLDivElement>(null);
  const sweep = useRef<HTMLSpanElement>(null);
  const icons = useRef<(SVGGElement | null)[]>([]);
  const strands = useRef<(SVGPathElement | null)[]>([]);

  const orbit = useMemo(() => {
    const cx = W / 2;
    const cy = H / 2 + (g.stacked ? 0 : 6);
    return BANDS.map((_, i) => {
      const base = (-122 + (i * 360) / 11) * (Math.PI / 180);
      // each strand drops to the ground under its own icon, leaning toward the vanishing point
      const settled = base + 0.62;
      const ox = cx + Math.cos(settled) * g.rx;
      const lx = ox + (W / 2 - ox) * 0.34;
      const ly = H * (0.72 + 0.1 * Math.abs(Math.cos(settled)));
      return { base, cx, cy, lx, ly };
    });
  }, [W, H, g.stacked, g.rx]);

  useTicker((t) => {
    const c = caret.current;
    if (c) c.style.opacity = t % 1.06 < 0.56 ? "1" : "0";
    // the reticle is really scanning: a hairline sweeps the subject tag
    const sw = sweep.current;
    if (sw) sw.style.transform = `translate3d(${((Math.sin(t * 1.5) * 0.5 + 0.5) * (300 * g.k - 2)).toFixed(1)}px, 0, 0)`;
  });

  useEffect(
    () =>
      rig.subscribe(windowed(0, BEAT.titleOut[1] + 0.04, (p) => {
        // the question: holds, then the camera tips down and flies through it
        const out = easeInCubic(range(p, BEAT.titleOut[0], BEAT.titleOut[1]));
        place(wrap.current, 1 - out, `translate3d(0, ${(-out * H * 0.05).toFixed(1)}px, 0) scale(${(1 + out * 0.22).toFixed(4)})`);
        fade(scrim.current, 1 - easeOutCubic(range(p, BEAT.titleOut[0] - 0.01, BEAT.titleOut[1])));

        // the portals
        const [ia, ib] = BEAT.iconsIn;
        const [ua, ub] = BEAT.unspool;
        const step = (ub - ua) / 13;
        const orbitT = easeOutCubic(range(p, ia, ua + step * 6));
        const list = orbit;
        for (let i = 0; i < 11; i++) {
          const el = icons.current[i];
          const st = strands.current[i];
          const o = list[i];
          const inT = range(p, ia + ((ib - ia) * i) / 13, ia + ((ib - ia) * (i + 3)) / 13);
          const uT = range(p, ua + step * (i - 1), ua + step * (i + 2));
          const a = o.base + orbitT * 0.62;
          const x = o.cx + Math.cos(a) * g.rx;
          const y = o.cy + Math.sin(a) * g.ry;
          if (el) {
            const vis = inT > 0 && uT < 1;
            el.style.visibility = vis ? "visible" : "hidden";
            if (vis) {
              const s = backOut(clamp(inT)) * (1 - 0.28 * smoothstep(uT));
              el.setAttribute("transform", `translate(${(x - (g.iconSize * s) / 2).toFixed(1)} ${(y - (g.iconSize * s) / 2).toFixed(1)}) scale(${((g.iconSize / 100) * s).toFixed(4)})`);
              el.style.opacity = String(clamp(inT * 1.6));
              // the outline pays itself out
              el.style.strokeDashoffset = (-easeInOutCubic(uT)).toFixed(4);
            }
          }
          if (st) {
            const head = easeInCubic(range(uT, 0, 0.62)) * 0.5 + easeOutCubic(range(uT, 0.1, 0.72)) * 0.5;
            const tail = easeInOutCubic(range(uT, 0.42, 1));
            const vis = uT > 0 && tail < 1;
            st.style.visibility = vis ? "visible" : "hidden";
            if (vis) {
              const len = Math.max(0.0005, head - tail);
              st.setAttribute("d", strandD(x, y, o.lx, o.ly, H));
              st.style.strokeDasharray = `${len.toFixed(4)} 2`;
              st.style.strokeDashoffset = (-tail).toFixed(4);
            }
          }
        }
      })),
    [rig, g, H, orbit],
  );

  const capH = CAP * g.s2;
  const theW = EM.THE * g.s2;
  const ruleLeft = g.blockW / 2 - theW / 2 - 14 * g.k;

  return (
    <>
      <div
        ref={scrim}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: W / 2 - g.blockW * 1.08,
          top: H / 2 - g.total * 1.02,
          width: g.blockW * 2.16,
          height: g.total * 2.04,
          background: `radial-gradient(closest-side, ${alpha(RISO.ink, 0.86)}, ${alpha(RISO.ink, 0.62)} 52%, ${alpha(RISO.ink, 0)} 100%)`,
        }}
      />

      {/* eleven portals and their strands */}
      <svg aria-hidden className="pointer-events-none absolute inset-0" width={W} height={H} style={{ overflow: "visible" }}>
        <g fill="none" strokeLinecap="round">
          {BANDS.map((b, i) => (
            <path
              key={b.id}
              ref={(el) => {
                strands.current[i] = el;
              }}
              pathLength={1}
              stroke={b.ink}
              strokeWidth={(g.stacked ? 2 : 2.6) * g.k}
              style={{ visibility: "hidden" }}
            />
          ))}
        </g>
        {BANDS.map((b, i) => (
          <g
            key={b.id}
            ref={(el) => {
              icons.current[i] = el;
            }}
            fill={alpha(RISO.ink, 0.7)}
            stroke={b.ink}
            strokeWidth={5}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ visibility: "hidden", strokeDasharray: "1 1" }}
            dangerouslySetInnerHTML={{ __html: iconBody(b.icon) }}
          />
        ))}
      </svg>

      {/* the question */}
      <div ref={wrap} className="pointer-events-none absolute" style={{ left: g.left, top: g.top, width: g.blockW, height: g.total, transformOrigin: "50% 42%", willChange: "transform, opacity" }}>
        <h2 className="sr-only">So what’s the pattern?</h2>
        <RidgedText
          width={g.blockW}
          height={g.y3}
          fill={RISO.paper}
          rings={g.rings}
          lines={[
            { text: TITLE[0], size: g.s1, x: g.blockW / 2, y: g.y1 },
            { text: TITLE[1], size: g.s2, x: g.blockW / 2, y: g.y2 },
            { text: TITLE[2], size: g.s3, x: g.blockW / 2, y: g.y3 },
          ]}
        />

        {/* ridge rules either side of THE */}
        {[0, 1].map((side) => (
          <div key={side} aria-hidden className="absolute flex flex-col justify-between" style={{ left: side ? g.blockW - ruleLeft : 0, width: ruleLeft, top: g.y2 - capH * 0.82, height: capH * 0.64 }}>
            {[RISO.paper, RISO.sun, RISO.cobalt].map((c, j) => (
              <span key={j} style={{ display: "block", height: Math.max(1.5, 3 * g.k), background: c, borderRadius: 2 }} />
            ))}
          </div>
        ))}

        {/* the caret from the hero, come back */}
        <div
          ref={caret}
          aria-hidden
          className="absolute"
          style={{
            left: g.blockW + 12 * g.k,
            top: g.y3 - CAP * g.s3,
            width: Math.max(7, 0.1 * g.s3),
            height: CAP * g.s3,
            background: RISO.sun,
          }}
        />

        <div className="absolute flex items-center justify-center" style={{ left: 0, right: 0, top: g.y3 + g.tagGap, height: g.tagH }}>
          <Reticle k={g.k} />
          <span ref={sweep} aria-hidden className="absolute" style={{ left: g.blockW / 2 - 150 * g.k, top: 2, bottom: 2, width: 2, background: `linear-gradient(180deg, ${alpha(RISO.cobalt, 0)}, ${RISO.cobalt}, ${alpha(RISO.cobalt, 0)})` }} />
          <span style={{ ...MONO, fontSize: Math.max(10.5, 13 * g.k), color: RISO.paper, whiteSpace: "nowrap" }}>{SUBJECT}</span>
        </div>
      </div>
    </>
  );
}

function strandD(x: number, y: number, lx: number, ly: number, H: number) {
  const drop = Math.max(40, ly - y) * 0.55 + H * 0.04;
  return `M${x.toFixed(1)} ${y.toFixed(1)}C${x.toFixed(1)} ${(y + drop).toFixed(1)} ${lx.toFixed(1)} ${(ly - drop).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)}`;
}

/** Four corner brackets around whatever is centred in the parent. */
function Reticle({ k }: { k: number }) {
  const w = 300 * k;
  const b = 13 * k;
  const line = `${Math.max(1.5, 2 * k)}px solid ${RISO.cobalt}`;
  const corner = (style: React.CSSProperties, key: number) => <span key={key} aria-hidden className="absolute" style={{ width: b, height: b, ...style }} />;
  return (
    <span aria-hidden className="absolute" style={{ left: "50%", top: 0, bottom: 0, width: w, transform: "translateX(-50%)" }}>
      {corner({ left: 0, top: 0, borderLeft: line, borderTop: line }, 0)}
      {corner({ right: 0, top: 0, borderRight: line, borderTop: line }, 1)}
      {corner({ left: 0, bottom: 0, borderLeft: line, borderBottom: line }, 2)}
      {corner({ right: 0, bottom: 0, borderRight: line, borderBottom: line }, 3)}
    </span>
  );
}
