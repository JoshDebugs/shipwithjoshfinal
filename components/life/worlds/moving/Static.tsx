"use client";

/**
 * 06 · Moving homes — "Repotted", reduced motion.
 * The finished state, still: the root ball with all five homes nested inside
 * it as rings, the plant on top, the tag at HOME 05 / 05, every line of copy.
 */

import { useMemo } from "react";
import { useStage } from "@/components/life/multiverse/runtime";
import { POTS, bboxOf, polyPath } from "./geometry";
import { getRoots } from "./roots";
import { LEAF_PATH, LEAF_RIB, plantPose, stemPath } from "./plant";
import { HOME_INK, INK, LEAF, LEAF_LIT, LEAF_SHADE, PAPER, RISO, STEM, VOID, alpha, mix } from "./colors";
import { CAPTIONS, FRAUNCES, HAND, HEADLINE, MONO, QUOTE, TAG } from "./copy";
import { meta } from "./meta";

function useRingArt() {
  return useMemo(() => {
    const d = getRoots("lo");
    const r = d.rad[4];
    const widths = [0.006, 0.012, 0.022, 0.04];
    const buckets = widths.map(() => [] as string[]);
    const rings = HOME_INK.map(() => [] as string[]);
    for (let i = 0; i < d.n; i++) {
      const par = d.parent[i];
      if (par < 0) continue;
      const seg = `M${d.x[par].toFixed(3)} ${d.y[par].toFixed(3)}L${d.x[i].toFixed(3)} ${d.y[i].toFixed(3)}`;
      if (d.wall[i]) {
        rings[d.home[i]].push(seg);
        continue;
      }
      const w = r[i] * 2;
      let b = 0;
      while (b < widths.length - 1 && w > (widths[b] + widths[b + 1]) / 2) b++;
      buckets[b].push(seg);
    }
    const pose = plantPose(0.9, 0, 1, 3, POTS[4].top, 0.44 * 3);
    return { widths, buckets: buckets.map((b) => b.join("")), rings: rings.map((b) => b.join("")), pose };
  }, []);
}

export default function MovingStatic() {
  const stage = useStage();
  const mobile = stage.isMobile;
  const art = useRingArt();
  const [x0, , x1, y1] = bboxOf(POTS[4].outer);
  const top = POTS[4].top - 0.44 * 3 - 0.75;
  const vb = `${x0 - 0.25} ${top} ${x1 - x0 + 0.5} ${y1 - top + 0.2}`;

  return (
    <div
      className="relative overflow-hidden px-6 py-20 md:px-[6vw] md:py-28"
      style={{ background: `radial-gradient(90% 70% at 60% 45%, ${mix(INK, RISO.sun, 0.04)} 0%, ${INK} 60%, ${mix(INK, VOID, 0.5)} 100%)`, color: PAPER }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-[1fr_1.05fr] md:gap-10">
        <div>
          <p className="uppercase" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.32em", color: alpha(PAPER, 0.62) }}>
            World {meta.number} · {meta.title}
          </p>
          <h2
            className="mt-4 uppercase"
            style={{ fontFamily: FRAUNCES, fontSize: mobile ? "17vw" : "clamp(56px, 6.4vw, 104px)", lineHeight: 0.84, fontVariationSettings: `"wght" 900, "SOFT" 100, "WONK" 1, "opsz" 144` }}
          >
            Moving
            <br />
            Homes
          </h2>
          <p
            className="mt-8"
            style={{ fontFamily: FRAUNCES, fontSize: mobile ? "12vw" : "clamp(40px, 4.4vw, 72px)", lineHeight: 0.95, fontVariationSettings: `"wght" 800, "SOFT" 100, "WONK" 1, "opsz" 144` }}
          >
            {HEADLINE}
          </p>
          <div className="mt-8 space-y-2" style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontSize: mobile ? 20 : 24, lineHeight: 1.2, fontVariationSettings: `"wght" 380, "SOFT" 100, "opsz" 36`, color: alpha(PAPER, 0.9) }}>
            {CAPTIONS.map((c) => (
              <p key={c}>{c}</p>
            ))}
          </div>
          {/* the plant tag, at the end of the story */}
          <div className="mt-10 w-[190px]" style={{ transform: "rotate(-3deg)" }}>
            <div className="relative rounded-[12px_12px_4px_4px] px-4 pb-3 pt-5" style={{ background: PAPER, color: INK, boxShadow: `0 10px 30px ${alpha(VOID, 0.5)}` }}>
              <span aria-hidden className="absolute left-1/2 top-[7px] h-[5px] w-[5px] -translate-x-1/2 rounded-full" style={{ background: INK }} />
              <p style={{ fontFamily: MONO, fontWeight: 500, fontSize: 11.5, letterSpacing: "0.12em" }}>{TAG.name}</p>
              <p style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", marginTop: 2, color: alpha(INK, 0.75) }}>{TAG.age}</p>
              <div style={{ height: 1, background: alpha(INK, 0.25), margin: "10px 0 9px" }} />
              <p style={{ fontFamily: MONO, fontSize: 10.5, lineHeight: 1.35, color: alpha(INK, 0.85) }}>
                {TAG.care[0]}
                <br />
                {TAG.care[1]}
              </p>
              <div style={{ height: 1, background: alpha(INK, 0.25), margin: "10px 0 8px" }} />
              <p style={{ fontFamily: MONO, fontWeight: 500, fontSize: 13, letterSpacing: "0.08em" }}>
                HOME 05<span style={{ color: alpha(INK, 0.5) }}> / 05</span>
              </p>
              <p style={{ fontFamily: HAND, fontSize: 19, lineHeight: 1.05, color: RISO.cobalt, marginTop: 4, transform: "rotate(-3deg)" }}>{TAG.note} ×4</p>
            </div>
            <div aria-hidden className="mx-auto h-[56px] w-[26px]" style={{ marginTop: -1, background: PAPER, clipPath: "polygon(0 0, 100% 0, 100% 64%, 50% 100%, 0 64%)" }} />
          </div>
        </div>

        {/* the root ball: five homes nested like tree rings */}
        <figure className="relative">
          <svg viewBox={vb} className="mx-auto block h-auto w-full max-w-[520px]" role="img" aria-label="A root ball with five nested house-shaped rings, one for each home">
            <defs>
              <linearGradient id="mvs-leaf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={LEAF_LIT} />
                <stop offset="0.55" stopColor={LEAF} />
                <stop offset="1" stopColor={LEAF_SHADE} />
              </linearGradient>
            </defs>
            {art.buckets.map((d, i) => (
              <path key={i} d={d} fill="none" stroke={alpha(PAPER, 0.3)} strokeWidth={art.widths[i]} strokeLinecap="round" />
            ))}
            {POTS.map((pot, k) => (
              <g key={k}>
                <path d={polyPath(pot.inner)} fill="none" stroke={alpha(HOME_INK[k], 0.2)} strokeWidth={0.06} strokeLinejoin="round" />
                <path d={polyPath(pot.inner)} fill="none" stroke={alpha(HOME_INK[k], 0.8)} strokeWidth={0.014} strokeLinejoin="round" />
                <path d={art.rings[k]} fill="none" stroke={HOME_INK[k]} strokeWidth={0.02} strokeLinecap="round" />
              </g>
            ))}
            <path d={`M0 ${POTS[0].top} L0 ${POTS[4].top}`} stroke={mix(STEM, INK, 0.3)} strokeWidth={0.06} strokeLinecap="round" />
            <path d={stemPath(art.pose.stem)} fill="none" stroke={STEM} strokeWidth={art.pose.width} strokeLinecap="round" />
            {art.pose.leaves.map((lf, i) =>
              lf.s > 0 ? (
                <g key={i} transform={`translate(${lf.x} ${lf.y}) rotate(${lf.rot}) scale(${lf.s})`}>
                  <path d={LEAF_PATH} fill="url(#mvs-leaf)" />
                  <path d={LEAF_RIB} fill="none" stroke={alpha(INK, 0.28)} strokeWidth={0.022} />
                </g>
              ) : null,
            )}
          </svg>
          <figcaption className="mt-6 flex flex-wrap justify-center gap-2">
            {HOME_INK.map((c, k) => (
              <span key={k} className="rounded-full px-2.5 py-1" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", color: c, border: `1px solid ${alpha(c, 0.75)}` }}>
                HOME 0{k + 1}
              </span>
            ))}
          </figcaption>
        </figure>
      </div>

      <div className="mx-auto mt-16 max-w-4xl text-center md:mt-20" style={{ fontFamily: FRAUNCES, fontStyle: "italic", fontSize: mobile ? 26 : "clamp(30px, 3vw, 46px)", lineHeight: 1.12, fontVariationSettings: `"wght" 420, "SOFT" 100, "opsz" 72` }}>
        <p>{QUOTE[0]}</p>
        <p className="mt-2">{QUOTE[1]}</p>
      </div>
    </div>
  );
}
