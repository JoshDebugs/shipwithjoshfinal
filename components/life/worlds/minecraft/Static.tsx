"use client";

/**
 * Reduced motion: no flight. Every angle is shown already "locked", as a
 * printed riso sheet — the five words in their lock inks, each with its line,
 * ALMOST steady in pink, and the receipt waiting at the bottom.
 */

import { useRef } from "react";
import { useStage } from "@/components/life/multiverse/runtime";
import { RISO, alpha, mix } from "@/components/life/multiverse/palette";
import { iconSvg } from "@/components/life/multiverse/portalIcons";
import { ANGLES, COPY } from "./beats";
import { LOCKS } from "./colors";
import { textBitmap } from "./glyphs";
import { NABLA_PALETTE, blockShadow, useNabla } from "./nabla";
import { PixelIsland } from "./PixelIsland";
import { PixelWord } from "./PixelWord";
import { withTilde } from "./text";

const SILK = "var(--f-silkscreen)";
const PIXEL = "var(--f-pixelify)";

const SKY_BANDS = `linear-gradient(180deg, ${RISO.cobalt} 0 24%, ${RISO.pink} 24% 50%, ${RISO.sun} 50% 61%, ${RISO.pink} 61% 75%, ${RISO.cobalt} 75% 92%, ${RISO.ink} 92% 100%)`;

/** The colour field each angle is printed on (its sky). */
const FIELDS = [RISO.cobalt, RISO.ink, mix(RISO.pink, RISO.cobalt, 0.25), RISO.cobalt, RISO.ink];

export default function MinecraftStatic() {
  const stage = useStage();
  const probe = useRef<HTMLDivElement>(null);
  const nabla = useNabla(probe);
  const mobile = stage.isMobile;

  return (
    <div ref={probe} className="relative overflow-hidden" style={{ color: RISO.ink, background: RISO.pink }}>
      {nabla.css && <style>{nabla.css}</style>}

      {/* ------------------------------------------------------------ the title */}
      <header className="relative flex flex-col items-center px-6 pb-0 pt-28 text-center md:pt-32" style={{ background: SKY_BANDS }}>
        <p
          className="rounded-full px-3 py-1.5 text-[11px] uppercase md:text-[12px]"
          style={{ fontFamily: SILK, letterSpacing: "0.16em", background: RISO.ink, color: RISO.paper }}
        >
          {COPY.kicker}
        </p>
        <p
          aria-label="16"
          role="img"
          className="mt-3 select-none leading-none"
          style={
            nabla.colr === false
              ? { fontFamily: SILK, fontWeight: 700, fontSize: mobile ? 150 : 220, color: RISO.sun, textShadow: blockShadow(mobile ? 8 : 12, RISO.pink, RISO.cobalt) }
              : { fontFamily: "var(--f-nabla)", fontPalette: NABLA_PALETTE, fontSize: mobile ? 190 : 280, lineHeight: 0.86, fontVariationSettings: '"EDPT" 140, "EHLT" 10' }
          }
        >
          16
        </p>
        <h2 className="mt-3 text-[24px] leading-tight md:text-[30px]" style={{ fontFamily: PIXEL, fontWeight: 600 }}>
          {COPY.age}
        </h2>
        <p className="mt-1 text-[16px] md:text-[18px]" style={{ fontFamily: PIXEL, color: alpha(RISO.ink, 0.75) }}>
          {COPY.aside}
        </p>
        <p
          className="mt-8 px-3 py-1.5 text-[17px] md:text-[21px]"
          style={{ fontFamily: PIXEL, fontWeight: 600, background: RISO.paper, border: `1.5px solid ${RISO.ink}`, boxShadow: `5px 5px 0 ${RISO.ink}` }}
        >
          {COPY.headline}
        </p>
        <PixelIsland className="mt-10 w-[min(70vw,380px)]" />
      </header>

      {/* ----------------------------------------------------------- the angles */}
      <section aria-label="Five angles" className="relative px-4 py-14 md:px-10 md:py-20" style={{ background: RISO.ink }}>
        <ol className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {ANGLES.map((a, i) => {
            const lock = LOCKS[a.scheme];
            const hero = i === ANGLES.length - 1;
            return (
              <li key={a.name} className={hero ? "md:col-span-2" : ""}>
                <figure className="h-full" style={{ background: RISO.paper, border: `1.5px solid ${RISO.ink}`, boxShadow: `6px 6px 0 ${lock.css === RISO.ink ? RISO.paper : lock.css}` }}>
                  <div className="relative flex flex-col items-center justify-center gap-4 px-6 py-10 md:py-12" style={{ background: FIELDS[i] }}>
                    <Corners color={alpha(RISO.paper, 0.7)} />
                    {hero ? (
                      <>
                        <PixelWord bmp={textBitmap(["ALMOST"])} front={LOCKS[4].front} side={LOCKS[4].side} title="Almost" className="w-[46%] max-w-[340px]" />
                        <PixelWord bmp={textBitmap(["WENT"])} front={lock.front} side={lock.side} title="went" className="w-[30%] max-w-[230px]" />
                        <PixelWord bmp={textBitmap(["COMPETITIVE."])} front={lock.front} side={lock.side} title="competitive." className="w-[88%] max-w-[700px]" />
                      </>
                    ) : (
                      <PixelWord bmp={textBitmap([a.name])} front={lock.front} side={lock.side} title={a.name} className={a.name === "~400" ? "w-[46%]" : "w-[78%]"} />
                    )}
                  </div>
                  <figcaption className="px-4 pb-4 pt-3">
                    <p className="text-[10px] uppercase md:text-[11px]" style={{ fontFamily: SILK, letterSpacing: "0.14em" }}>
                      Angle {String(i + 1).padStart(2, "0")}/05 · {a.name}
                    </p>
                    <p className="mt-1.5 text-[18px] leading-snug md:text-[20px]" style={{ fontFamily: PIXEL, fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: withTilde(a.line) }} />
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ol>
      </section>

      {/* -------------------------------------------------------------- closer */}
      <footer className="relative flex flex-col items-center gap-6 px-6 py-16 text-center md:py-20" style={{ background: SKY_BANDS }}>
        <p className="max-w-[760px] text-[24px] leading-tight md:text-[34px]" style={{ fontFamily: PIXEL, fontWeight: 600 }}>
          {COPY.closerA}
        </p>
        <p className="max-w-[760px] text-[26px] leading-tight md:text-[38px]" style={{ fontFamily: PIXEL, fontWeight: 700 }}>
          {COPY.closerB}
        </p>
        <div aria-hidden className="mt-2 h-[120px] w-[120px] [&>svg]:block [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: iconSvg("receipt", RISO.ink) }} />
      </footer>
    </div>
  );
}

/** Viewfinder corners: every angle is a framed view. */
function Corners({ color }: { color: string }) {
  const c = "absolute h-4 w-4";
  const b = `2px solid ${color}`;
  return (
    <>
      <span aria-hidden className={`${c} left-3 top-3`} style={{ borderLeft: b, borderTop: b }} />
      <span aria-hidden className={`${c} right-3 top-3`} style={{ borderRight: b, borderTop: b }} />
      <span aria-hidden className={`${c} bottom-3 left-3`} style={{ borderLeft: b, borderBottom: b }} />
      <span aria-hidden className={`${c} bottom-3 right-3`} style={{ borderRight: b, borderBottom: b }} />
    </>
  );
}
