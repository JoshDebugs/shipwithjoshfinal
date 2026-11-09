"use client";

/**
 * Real DOM type over the canvas: the title card (Nabla "16"), the headline
 * with its crosshair, the caption plate for each angle (it types in as the
 * word locks), the MONTAGES misregistration hit, the closer, and the receipt
 * the next portal is born from. Everything is written straight to the DOM
 * from progress — no React state per frame.
 */

import { useMemo, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { usePortalOrigin, useProgress, useStage, useTicker } from "@/components/life/multiverse/runtime";
import { clamp, easeInOutCubic, easeOutCubic, range, smoothstep } from "@/components/life/multiverse/ease";
import { iconSvg } from "@/components/life/multiverse/portalIcons";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { ANGLES, COPY, KEYS, angleShow, camParam, receiptBox } from "./beats";
import { LOCKS } from "./colors";
import { layoutWords } from "./gen";
import { NABLA_PALETTE, blockShadow, useNabla } from "./nabla";
import { PixelWord } from "./PixelWord";
import { withTilde } from "./text";

const SILK = "var(--f-silkscreen)";
const PIXEL = "var(--f-pixelify)";

export function Overlay({ progress }: { progress: MotionValue<number> }) {
  const stage = useStage();
  const origin = usePortalOrigin();
  const W = stage.width;
  const H = stage.height;
  const portrait = W < H;
  const probe = useRef<HTMLDivElement>(null);
  const nabla = useNabla(probe);

  const title = useRef<HTMLDivElement>(null);
  const sixteen = useRef<HTMLDivElement>(null);
  const titleLines = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const plates = useRef<(HTMLDivElement | null)[]>([]);
  const typed = useRef<(HTMLSpanElement | null)[]>([]);
  const closerA = useRef<HTMLDivElement>(null);
  const closerB = useRef<HTMLDivElement>(null);
  const receipt = useRef<HTMLDivElement>(null);
  const misWrap = useRef<HTMLDivElement>(null);
  const misA = useRef<HTMLDivElement>(null);
  const misB = useRef<HTMLDivElement>(null);

  const box = receiptBox(W, H);
  const montages = useMemo(() => layoutWords(W, H).filter((pl) => pl.id === 2), [W, H]);

  // type scale
  const sixteenPx = Math.round(portrait ? Math.min(W * 0.6, H * 0.28) : Math.min(H * 0.37, W * 0.28));
  const titleY = portrait ? 0.37 : 0.385;

  useProgress(progress, (p) => {
    // --- title card: holds at 0, then the 16 extrudes toward the lens and lifts away
    const out = easeInOutCubic(range(p, 0.012, 0.075));
    if (title.current) {
      title.current.style.opacity = String(1 - out);
      title.current.style.visibility = out >= 1 ? "hidden" : "visible";
    }
    if (sixteen.current) {
      sixteen.current.style.transform = `translateY(${-out * 4}%) scale(${1 + out * 0.55})`;
      sixteen.current.style.fontVariationSettings = `"EDPT" ${Math.round(110 + 90 * range(p, 0, 0.06))}, "EHLT" 10`;
    }
    if (titleLines.current) titleLines.current.style.transform = `translateY(${out * 28}px)`;

    // --- headline + crosshair, while the storm whips past on the way to the first angle
    if (head.current) {
      const hs = Math.min(range(p, 0.07, 0.095), 1 - range(p, 0.142, 0.165));
      head.current.style.opacity = String(smoothstep(hs));
      head.current.style.transform = `translate(-50%, -50%) scale(${0.96 + 0.04 * easeOutCubic(hs)})`;
    }

    // --- caption plates: type in as the word locks, weight 400 → 700
    ANGLES.forEach((a, i) => {
      const el = plates.current[i];
      if (!el) return;
      const show = smoothstep(clamp(angleShow(p, a.key)));
      el.style.opacity = String(show);
      el.style.visibility = show <= 0.001 ? "hidden" : "visible";
      el.style.transform = `translateY(${(1 - show) * 14}px)`;
      const t = typed.current[i];
      if (t) {
        const start = KEYS[a.key].dwell[0];
        const k = range(p, start - 0.017, start - 0.001);
        const n = Math.round(a.line.length * k);
        if (t.dataset.n !== String(n)) {
          t.innerHTML = withTilde(a.line.slice(0, n));
          t.dataset.n = String(n);
        }
        t.style.fontWeight = String(Math.round(400 + 300 * k));
      }
    });

    // --- closer
    if (closerA.current) {
      const a = Math.min(range(p, 0.9, 0.918), 1 - range(p, 0.948, 0.962));
      closerA.current.style.opacity = String(smoothstep(a));
      closerA.current.style.transform = `translate(-50%, ${(1 - a) * 10}px)`;
    }
    if (closerB.current) {
      const b = range(p, 0.958, 0.978);
      closerB.current.style.opacity = String(smoothstep(b));
      closerB.current.style.transform = `translate(-50%, ${(1 - b) * 10}px)`;
    }

    // --- the receipt resolves from voxels into the crisp icon the portal grows from
    if (receipt.current) receipt.current.style.opacity = String(smoothstep(range(p, 0.984, 1)));
  });

  // MONTAGES: a riso misregistration "cut" — pink and cobalt plates slam into register
  const mis = useRef({ at: false, t0: 0 });
  useTicker((time) => {
    const wrap = misWrap.current;
    if (!wrap) return;
    const s = camParam(progress.get());
    const at = s === 3;
    if (at && !mis.current.at) mis.current.t0 = time;
    mis.current.at = at;
    const e = at ? clamp((time - mis.current.t0) / 0.55) : 1;
    const env = 1 - easeOutCubic(e);
    wrap.style.opacity = String(Math.min(1, env * 1.4));
    wrap.style.visibility = env > 0.002 ? "visible" : "hidden";
    const d = 16 * env;
    if (misA.current) misA.current.style.transform = `translate(${-d}px, ${-d * 0.3}px)`;
    if (misB.current) misB.current.style.transform = `translate(${d}px, ${d * 0.3}px)`;
  });

  const plateStyle = portrait
    ? { left: 16, right: 16, bottom: 92 }
    : { left: Math.max(28, W * 0.028), bottom: Math.max(28, H * 0.045), width: Math.min(470, W * 0.36) };

  return (
    <div ref={probe} className="pointer-events-none absolute inset-0" style={{ color: RISO.ink }}>
      {nabla.css && <style>{nabla.css}</style>}

      {/* ---------------------------------------------------------- title card */}
      <div ref={title} className="absolute inset-x-0 flex flex-col items-center" style={{ top: `${titleY * 100}%`, transform: "translateY(-50%)" }}>
        <div
          className="mb-3 rounded-full px-3 py-1.5 text-[11px] uppercase md:text-[12px]"
          style={{ fontFamily: SILK, letterSpacing: "0.16em", background: RISO.ink, color: RISO.paper }}
        >
          {COPY.kicker}
        </div>
        <div
          ref={sixteen}
          aria-label="16"
          role="img"
          className="select-none leading-none"
          style={
            nabla.colr === false
              ? {
                  fontFamily: SILK,
                  fontWeight: 700,
                  fontSize: sixteenPx * 0.78,
                  lineHeight: 0.9,
                  color: RISO.sun,
                  textShadow: blockShadow(Math.round(sixteenPx / 22), RISO.pink, RISO.cobalt),
                  willChange: "transform",
                }
              : {
                  fontFamily: "var(--f-nabla)",
                  fontPalette: NABLA_PALETTE,
                  fontSize: sixteenPx,
                  lineHeight: 0.86,
                  opacity: nabla.colr === null ? 0 : 1,
                  transition: "opacity 400ms ease",
                  willChange: "transform",
                }
          }
        >
          16
        </div>
        <div ref={titleLines} className="mt-2 flex flex-col items-center px-6 text-center">
          <p className="text-[22px] leading-tight md:text-[28px]" style={{ fontFamily: PIXEL, fontWeight: 600 }}>
            {COPY.age}
          </p>
          <p className="mt-1 text-[15px] md:text-[18px]" style={{ fontFamily: PIXEL, color: alpha(RISO.ink, 0.72) }}>
            {COPY.aside}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------- headline + crosshair */}
      <div ref={head} className="absolute left-1/2 top-1/2 flex flex-col items-center opacity-0" style={{ transform: "translate(-50%, -50%)" }}>
        <Crosshair size={portrait ? 30 : 36} />
        <p
          className="mt-5 whitespace-nowrap px-3 py-1.5 text-[16px] md:text-[22px]"
          style={{ fontFamily: PIXEL, fontWeight: 600, background: RISO.paper, border: `1.5px solid ${RISO.ink}`, boxShadow: `5px 5px 0 ${RISO.ink}` }}
        >
          {COPY.headline}
        </p>
      </div>

      {/* --------------------------------------------- MONTAGES misregistration */}
      <div ref={misWrap} aria-hidden className="absolute inset-0" style={{ visibility: "hidden" }}>
        {montages.map((pl, i) => (
          <div key={i}>
            <div ref={misA} className="absolute" style={{ left: pl.x0, top: pl.y0, width: pl.bmp.cols * pl.cell, mixBlendMode: "multiply" }}>
              <PixelWord bmp={pl.bmp} front={RISO.pink} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
            <div ref={misB} className="absolute" style={{ left: pl.x0, top: pl.y0, width: pl.bmp.cols * pl.cell, mixBlendMode: "multiply" }}>
              <PixelWord bmp={pl.bmp} front={RISO.cobalt} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
          </div>
        ))}
      </div>

      {/* -------------------------------------------------------- caption plates */}
      {ANGLES.map((a, i) => {
        const lock = LOCKS[a.scheme];
        return (
          <div
            key={a.name}
            ref={(el) => {
              plates.current[i] = el;
            }}
            className="absolute"
            style={{ ...plateStyle, opacity: 0, visibility: "hidden" }}
          >
            <div className="px-4 pb-3.5 pt-2.5" style={{ background: RISO.paper, border: `1.5px solid ${RISO.ink}`, boxShadow: `6px 6px 0 ${lock.css}` }}>
              <div className="flex items-center justify-between gap-3 text-[10px] uppercase md:text-[11px]" style={{ fontFamily: SILK, letterSpacing: "0.14em" }}>
                <span>
                  Angle {String(i + 1).padStart(2, "0")}/05 · <span style={{ color: lock.css === RISO.sun ? RISO.ink : lock.css }}>{a.name}</span>
                </span>
                <span className="flex gap-[3px]" aria-hidden>
                  {ANGLES.map((b, j) => (
                    <span
                      key={b.name}
                      className="block h-[9px] w-[9px]"
                      style={{ background: j <= i ? LOCKS[b.scheme].css : "transparent", border: `1.5px solid ${RISO.ink}` }}
                    />
                  ))}
                </span>
              </div>
              <p className="mt-1.5 grid text-[17px] leading-[1.22] md:text-[20px]" style={{ fontFamily: PIXEL }}>
                <span className="invisible col-start-1 row-start-1" style={{ fontWeight: 700 }} aria-hidden dangerouslySetInnerHTML={{ __html: withTilde(a.line) }} />
                <span className="sr-only">{a.line}</span>
                <span
                  aria-hidden
                  ref={(el) => {
                    typed.current[i] = el;
                  }}
                  className="col-start-1 row-start-1"
                />
              </p>
            </div>
          </div>
        );
      })}

      {/* ------------------------------------------------------------------ closer */}
      <div
        ref={closerA}
        className="absolute left-1/2 w-[min(92%,760px)] text-center opacity-0"
        style={{ top: portrait ? "16%" : "17%", transform: "translateX(-50%)" }}
      >
        <p className="text-[24px] leading-tight md:text-[38px]" style={{ fontFamily: PIXEL, fontWeight: 600 }}>
          {COPY.closerA}
        </p>
      </div>
      <div
        ref={closerB}
        className="absolute left-1/2 w-[min(92%,760px)] text-center opacity-0"
        style={{ top: portrait ? "16%" : "17%", transform: "translateX(-50%)" }}
      >
        <p className="text-[26px] leading-tight md:text-[40px]" style={{ fontFamily: PIXEL, fontWeight: 700 }}>
          {COPY.closerB}
        </p>
      </div>

      {/* ------------------------------------------- the next portal is born here */}
      <div
        ref={(el) => {
          origin(el);
          receipt.current = el;
        }}
        aria-hidden
        className="absolute opacity-0 [&>svg]:block [&>svg]:h-full [&>svg]:w-full"
        style={{ left: box.x, top: box.y, width: box.size, height: box.size }}
        dangerouslySetInnerHTML={{ __html: iconSvg("receipt", RISO.ink) }}
      />
    </div>
  );
}

function Crosshair({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 9 9" aria-hidden shapeRendering="crispEdges">
      <path d="M4 0h1v3h-1zM4 6h1v3h-1zM0 4h3v1h-3zM6 4h3v1h-3z" fill={RISO.ink} />
      <rect x={4} y={4} width={1} height={1} fill={RISO.pink} />
    </svg>
  );
}
