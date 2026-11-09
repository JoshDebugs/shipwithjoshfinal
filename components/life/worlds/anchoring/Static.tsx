/**
 * Reduced motion: "Up To Eleven" as a two-part print — the voice ramp on
 * paper (whisper → shout, knob already past 10), then the clipped pink poster.
 * Motionless, document flow, every line and fact of the live world.
 */
import { useStage } from "@/components/life/multiverse/runtime";
import { RISO, alpha, overprint } from "@/components/life/multiverse/palette";
import { PORTAL_ICONS, iconSvg } from "@/components/life/multiverse/portalIcons";
import { COPY } from "./copy";
import { Knob } from "./Knob";
import { RegMark, Vu } from "./Console";
import { ANYBODY, MONO, Sub } from "./Line";
import { CAP } from "./layout";

const axes = (wdth: number, wght: number) => `"wdth" ${wdth}, "wght" ${wght}`;

/** The flood as the live world prints it: pink laid over paper. */
const FLOOD = overprint(RISO.paper, RISO.pink);

/** Font size that fits a row of `em` measured widths into the text column (see the padding below). */
const fitCol = (em: number, gutters: number, cap: number) => `min(calc((100vw - ${gutters}px) / ${em}), ${cap}px)`;

/** A static halftone field: dots on a rotated screen, fading out of one edge. */
function Dots({ ink, angle, cell, dot, side, reach, opacity = 1 }: { ink: string; angle: number; cell: number; dot: number; side: "left" | "right"; reach: string; opacity?: number }) {
  const fadeTo = side === "right" ? "to left" : "to right";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0"
      style={{ [side]: 0, width: reach, mixBlendMode: "multiply", opacity, maskImage: `linear-gradient(${fadeTo}, #000 10%, transparent)`, WebkitMaskImage: `linear-gradient(${fadeTo}, #000 10%, transparent)`, overflow: "hidden" }}
    >
      <div
        className="absolute"
        style={{
          inset: "-50%",
          transform: `rotate(${angle}deg)`,
          backgroundImage: `radial-gradient(circle, ${ink} 0 ${dot}%, transparent ${dot + 2}%)`,
          backgroundSize: `${cell}px ${cell}px`,
        }}
      />
    </div>
  );
}

function SlicedPoster() {
  // viewBox units: two 150-high headroom bands around an 86-high channel
  const W = 1000;
  const rowH = 150;
  const waveH = 86;
  const R = [24, 24 + rowH, 24 + rowH + waveH, 24 + 2 * rowH + waveH];
  const font = (1.35 * rowH) / CAP;
  const base = (top: number) => top + rowH / 2 + (CAP * font) / 2;
  const period = 166;
  let sq = `M0 ${R[2] - 3}`;
  for (let x = 0, up = true; x < W; x += period / 2, up = !up) {
    const y = up ? R[1] + 3 : R[2] - 3;
    sq += ` L${x} ${y} L${Math.min(W, x + period / 2)} ${y}`;
  }
  const micBox = waveH * 0.86 / 0.83;
  const words = [
    { word: COPY.headlineRows[0], top: R[0], len: 818 },
    { word: COPY.headlineRows[1], top: R[2], len: 753 },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${R[3] + 24}`} className="block h-auto w-full" role="img" aria-label={COPY.headline}>
      <defs>
        {words.map((w, i) => (
          <clipPath id={`anch-static-row${i}`} key={i}>
            <rect x={0} y={w.top} width={W} height={rowH} />
          </clipPath>
        ))}
      </defs>
      <path d={sq} fill="none" stroke={RISO.cobalt} strokeWidth={4} transform="translate(-3 3)" style={{ mixBlendMode: "multiply" }} />
      <path d={sq} fill="none" stroke={RISO.ink} strokeWidth={4} />
      {words.map((w, i) => (
        <g key={w.word} clipPath={`url(#anch-static-row${i})`}>
          {[RISO.cobalt, RISO.teal, RISO.sun, RISO.ink].map((ink, k) => (
            <text
              key={k}
              x={W / 2}
              y={base(w.top)}
              textAnchor="middle"
              fontSize={font}
              textLength={w.len}
              lengthAdjust="spacingAndGlyphs"
              fill={ink}
              aria-hidden={k < 3 ? true : undefined}
              transform={k === 0 ? "translate(-2 -1.4)" : k === 1 ? "translate(1.8 -1.6)" : k === 2 ? "translate(-1 2)" : undefined}
              style={{ fontFamily: ANYBODY, fontVariationSettings: axes(150, 900), mixBlendMode: k < 3 ? "multiply" : undefined }}
            >
              {w.word}
            </text>
          ))}
        </g>
      ))}
      {R.map((y, i) => (
        <g key={i}>
          <line x1={0} x2={W} y1={y} y2={y} stroke={RISO.ink} strokeWidth={i === 0 || i === 3 ? 2 : 1.4} />
          {(i === 0 || i === 3) && (
            <g>
              <rect x={10} y={y - 10} width={56} height={20} rx={2.5} fill={RISO.ink} />
              <text x={38} y={y + 4.5} textAnchor="middle" fontSize={12} fill={RISO.paper} style={{ fontFamily: MONO, letterSpacing: "0.14em", fontWeight: 600 }}>
                CLIP
              </text>
            </g>
          )}
        </g>
      ))}
      <g transform={`translate(${W / 2 - 0.44 * micBox} ${R[2] - 1 - 0.96 * micBox}) scale(${micBox / 100})`} aria-hidden>
        <g dangerouslySetInnerHTML={{ __html: PORTAL_ICONS.mic.svg }} fill={RISO.ink} />
      </g>
    </svg>
  );
}

export default function AnchoringStatic() {
  const { isMobile } = useStage();
  const knobScale = isMobile ? 0.82 : 1.05;
  const vuSeg = isMobile ? 18 : 22;
  return (
    <div className="relative" style={{ color: RISO.ink }}>
      {/* ——— side A: the voice ramp, on paper ——— */}
      <div className="relative overflow-hidden" style={{ background: RISO.paper }}>
        <Dots ink={RISO.cobalt} angle={15} cell={30} dot={22} side="right" reach="46%" />
        <Dots ink={RISO.teal} angle={75} cell={34} dot={18} side="right" reach="34%" />
        <Dots ink={RISO.sun} angle={0} cell={38} dot={20} side="right" reach="24%" />
        <RegMark x={24} y={24} />
        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-10 px-6 pb-20 pt-28 md:px-12 md:pt-32">
          <p className="uppercase" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.32em" }}>
            {COPY.label}
          </p>
          <div className="flex flex-col items-start gap-10 md:flex-row md:items-center md:gap-16">
            <div className="relative shrink-0" style={{ width: 300 * knobScale, height: 330 * knobScale }}>
              <div className="absolute left-0 top-0" style={{ transform: `scale(${knobScale})`, transformOrigin: "0 0" }}>
                <Knob vol={11} circled={1} />
              </div>
            </div>
            <div className="flex flex-col gap-5">
              <p style={{ fontFamily: ANYBODY, fontVariationSettings: axes(58, 140), fontSize: isMobile ? 32 : 44, lineHeight: 1 }}>{COPY.whisper}</p>
              <p style={{ fontFamily: ANYBODY, fontVariationSettings: axes(80, 340), fontSize: isMobile ? 24 : 30, lineHeight: 1, textShadow: `0.03em 0.025em 0 ${RISO.cobalt}` }}>
                {COPY.tap} {COPY.tap}
              </p>
              <div>
                <p style={{ fontFamily: ANYBODY, fontVariationSettings: axes(62, 240), fontSize: isMobile ? 46 : 72, lineHeight: 0.98, textShadow: `0.03em 0.025em 0 ${RISO.cobalt}` }}>
                  {COPY.grade6}
                </p>
                <Sub dot={RISO.cobalt}>{COPY.grade6Sub}</Sub>
              </div>
            </div>
          </div>
          <p
            style={{
              fontFamily: ANYBODY,
              fontVariationSettings: axes(110, 600),
              fontSize: isMobile ? 26 : 40,
              lineHeight: 1.12,
              textShadow: `0.03em 0.025em 0 ${RISO.teal}`,
              maxWidth: "26ch",
            }}
          >
            {COPY.opener}
          </p>
          <div>
            <p style={{ fontFamily: ANYBODY, fontVariationSettings: axes(118, 720), fontSize: isMobile ? 58 : fitCol(10.4, 128, 104), lineHeight: 0.9, letterSpacing: "-0.02em", textShadow: `0.03em 0.025em 0 ${RISO.sun}` }}>
              {COPY.grade7}
            </p>
            <Sub dot={RISO.teal}>{COPY.grade7Sub}</Sub>
          </div>
          <p
            className="uppercase"
            style={{
              fontFamily: ANYBODY,
              fontVariationSettings: axes(146, 880),
              fontSize: isMobile ? undefined : fitCol(10.95, 128, 98),
              lineHeight: 0.86,
              letterSpacing: "-0.02em",
              textShadow: `0.03em 0.025em 0 ${RISO.sun}`,
            }}
          >
            {isMobile ? (
              <>
                <span className="block" style={{ fontSize: fitCol(5.4, 64, 96) }}>
                  Inside
                </span>
                <span className="block" style={{ fontSize: fitCol(5.4, 64, 96) }}>
                  voice:
                </span>
                <span className="block" style={{ fontSize: fitCol(10.95, 64, 96) }}>
                  uninstalled.
                </span>
              </>
            ) : (
              <>
                Inside voice:
                <br />
                uninstalled.
              </>
            )}
          </p>
        </div>
      </div>

      {/* ——— side B: the clip, on the pink flood ——— */}
      <div className="relative overflow-hidden" style={{ background: FLOOD }}>
        <Dots ink={RISO.cobalt} angle={15} cell={30} dot={26} side="right" reach="38%" opacity={0.85} />
        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-10 px-6 pb-24 pt-16 md:px-12 md:pt-20">
          <SlicedPoster />
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <p
              className="inline-block"
              style={{ fontFamily: MONO, fontSize: isMobile ? 14 : 17, letterSpacing: "0.06em", background: RISO.paper, padding: "9px 14px", border: `1px solid ${RISO.ink}`, boxShadow: `3px 3px 0 ${RISO.ink}` }}
            >
              {COPY.age}
            </p>
            <div className="relative rounded-[6px] px-4 pb-3 pt-4" style={{ background: RISO.paper, border: `1px solid ${RISO.ink}` }}>
              <div className="relative" style={{ width: 12 * vuSeg + 11 * 5, height: 34 }}>
                <Vu segW={vuSeg} segH={12} gap={5} labelEvery={isMobile ? 3 : 1} lit={12} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6 pt-6 text-center">
            <div aria-hidden className="h-[120px] w-[120px] md:h-[150px] md:w-[150px] [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: iconSvg("skate", RISO.ink) }} />
            <div className="h-px w-full max-w-[560px]" style={{ background: alpha(RISO.ink, 0.9) }} />
            <p style={{ fontFamily: ANYBODY, fontVariationSettings: axes(108, 560), fontSize: isMobile ? 30 : 46, lineHeight: 1.05, textShadow: `0.03em 0.025em 0 ${RISO.cobalt}` }}>{COPY.welcome}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
