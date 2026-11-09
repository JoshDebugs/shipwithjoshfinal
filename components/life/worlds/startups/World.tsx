"use client";

/**
 * 08 · Startups — "The Receipts".
 *
 * An ink print shop. A fat printer slot glows along the bottom edge and a live
 * thermal receipt feeds out of it as you scroll: rows burn in left to right,
 * old rows roll back over the top, and the paper billows with scroll speed.
 * Each startup gets stamped (SHIPPED / LIVE + SOLD IRL) or tagged (FOR SALE)
 * and floods the room with its own halftone. Then BEEP, the receipt tears
 * off and flies at the camera, and the price gun's last sticker — a bicep —
 * is left on the slot. The next portal is born from it.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useIsoLayoutEffect, usePortalOrigin, useProgress, useStage, useTicker } from "@/components/life/multiverse/runtime";
import type { WorldProps } from "@/components/life/multiverse/types";
import { C, alpha } from "./colors";
import { Engine, WORDS, emptyRefs, tearPolygon, wordRest } from "./engine";
import { computeGeo, type Geo } from "./geometry";
import { BicepSticker, Bow, DotText } from "./glyphs";
import { Halftone, type Flood } from "./halftone";
import { PriceGun } from "./PriceGun";
import { RowInk } from "./RowInk";
import { IDX, ROWS } from "./rows";
import { Stamp, StampRig } from "./Stamp";
import { Printer } from "./Printer";
import { SwingTag } from "./SwingTag";
import { B, rowBottomY } from "./timeline";
import { wordEm } from "./words";

const EXT = 420; // paper still inside the printer below the last row
const PAD = 16; // halftone canvas bleed (room for its drift)

export default function StartupsWorld({ progress }: WorldProps) {
  const stage = useStage();
  const origin = usePortalOrigin();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const refs = useRef(emptyRefs());
  const engine = useMemo(() => new Engine(refs.current), []);
  const halftone = useRef<Halftone | null>(null);
  const g = useMemo(() => computeGeo(Math.max(1, stage.width), Math.max(1, stage.height)), [stage.width, stage.height]);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const read = () => setFine(mq.matches && !stage.isMobile);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, [stage.isMobile]);

  // geometry → engine + halftone floods
  useIsoLayoutEffect(() => {
    engine.setGeo(g);
    const canvas = canvasRef.current;
    if (canvas) {
      if (!halftone.current) halftone.current = new Halftone(canvas);
      const dpr = Math.min(window.devicePixelRatio || 1, stage.lowPower ? 1 : 1.5);
      halftone.current.setup(g.W + PAD * 2, g.H + PAD * 2, g.grid, dpr, floodsFor(g), {
        x: 0,
        y: 0,
        a: 0,
        b: 0,
        shape: "dot",
        color: alpha(C.paper, 0.07),
        plate: C.paper,
        rest: 0.1,
        peak: 0.1,
      });
    }
    const p = progress.get();
    engine.frame(p);
    halftone.current?.render(p);
  }, [g, engine, progress, stage.lowPower]);

  useProgress(progress, (p) => {
    engine.frame(p);
    halftone.current?.render(p);
  });
  useTicker((_, dt) => engine.tick(dt));

  const R = refs.current;
  const { u, rw, rx, W, H } = g;
  const overlay = (row: number) => ({
    ref: (el: HTMLDivElement | null) => {
      const o = R.overlays.find((x) => x.row === row);
      if (o) o.el = el;
      else R.overlays.push({ el, row });
    },
    style: {
      position: "absolute" as const,
      left: rx,
      top: -g.h[row],
      width: rw,
      height: g.h[row],
      transformOrigin: `50% ${g.h[row]}px`,
      visibility: "hidden" as const,
      willChange: "transform",
      pointerEvents: "none" as const,
    },
  });

  const tagRow = g.mobile ? IDX["l-tag"] : IDX["l-name"];
  const stickerBox = stickerRect(g);
  const fs = g.fonts;

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: C.room, cursor: fine ? "none" : undefined, touchAction: "pan-y" }}
      data-site-cursor={fine ? "hide" : undefined}
    >
      <h2 className="sr-only">Startups, age 17: The Receipts. Then I started building.</h2>

      {/* halftone floods */}
      <div
        ref={(el) => {
          R.halftoneWrap = el;
        }}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: -PAD, top: -PAD, width: W + PAD * 2, height: H + PAD * 2 }}
      >
        <canvas ref={canvasRef} className="absolute left-0 top-0" />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(120% 95% at 50% 58%, ${alpha(C.ink, 0)} 52%, ${alpha(C.ink, 0.62)} 100%)` }}
      />

      {/* the slot's light on the wall */}
      <div
        ref={(el) => {
          R.wallGlow = el;
        }}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: g.cx - W * 0.5,
          width: W,
          top: g.slot0 - H * 0.42,
          height: H * 0.84,
          background: `radial-gradient(closest-side, ${alpha(C.sun, 0.24)}, ${alpha(C.sun, 0.07)} 55%, ${alpha(C.sun, 0)})`,
        }}
      />

      {/* overprint words: pink plate printed over a misregistered cobalt plate */}
      {WORDS.map((_, k) => {
        const { size, y, lines } = wordLayout(g, k);
        const text = lines.join("\n");
        return (
          <div
            key={k}
            ref={(el) => {
              R.words[k] = el;
            }}
            aria-hidden={k === 0 ? undefined : true}
            className="pointer-events-none absolute"
            style={{
              left: "50%",
              top: y,
              fontFamily: "var(--f-anybody)",
              fontWeight: 900,
              fontSize: size,
              lineHeight: 0.88,
              whiteSpace: "pre",
              textAlign: "center",
              letterSpacing: "-0.01em",
              transform: "translate(-50%, -50%)",
              opacity: 0,
              visibility: "hidden",
            }}
          >
            <div style={{ opacity: k === 0 ? 0.62 : 0.4 }}>
              <div aria-hidden className="absolute left-0 top-0 w-full" style={{ color: C.cobalt, transform: `translate(${Math.round(6 * u)}px, ${Math.round(5 * u)}px)` }}>
                {text}
              </div>
              <div className="relative" style={{ color: C.pink }}>
                {text}
              </div>
            </div>
          </div>
        );
      })}

      {/* contact shadow on the wall */}
      <div
        ref={(el) => {
          R.shadow = el;
        }}
        aria-hidden
        className="pointer-events-none absolute"
        style={{ left: rx + 16 * u, top: 0, width: rw, height: 0, background: alpha(C.ink, 0.95), filter: `blur(${Math.round(18 * u)}px)`, opacity: 0 }}
      />

      {/* TURBO speed lines */}
      {Array.from({ length: g.mobile ? 8 : 14 }, (_, k) => {
        const side = k % 2 === 0 ? -1 : 1;
        const off = (18 + ((k * 37) % 120)) * u;
        const x = side < 0 ? rx - off : rx + rw + off;
        return (
          <div
            key={k}
            ref={(el) => {
              R.speed[k] = el;
            }}
            aria-hidden
            className="pointer-events-none absolute top-0"
            style={{
              left: x,
              width: Math.max(1, 1.6 * u),
              height: (70 + ((k * 53) % 110)) * u,
              background: `linear-gradient(to bottom, ${alpha(C.paper, 0)}, ${alpha(C.paper, 0.75)}, ${alpha(C.paper, 0)})`,
              opacity: 0,
            }}
          />
        );
      })}

      {/* the receipt: rows hinge on each other inside one flat perspective */}
      <div
        className="absolute inset-0"
        style={
          {
            perspective: g.persp,
            perspectiveOrigin: `50% ${g.perspY}px`,
            "--pad": `${g.pad}px`,
            "--fs-stars": `${fs.stars}px`,
            "--fs-head": `${fs.head}px`,
            "--fs-meta": `${fs.meta}px`,
            "--fs-itemno": `${fs.itemno}px`,
            "--fs-name": `${fs.name}px`,
            "--fs-desc": `${fs.desc}px`,
            "--fs-money": `${fs.money}px`,
            "--fs-note": `${fs.note}px`,
            "--fs-thanks": `${fs.thanks}px`,
            "--fs-digits": `${fs.digits}px`,
          } as CSSProperties
        }
      >
        {ROWS.map((row, i) => {
          const h = g.h[i];
          const isBottom = i === IDX.bottom;
          const isTop = i === 0;
          return (
            <div
              key={row.id}
              ref={(el) => {
                R.rows[i] = el;
              }}
              className="absolute"
              style={{
                left: rx,
                top: -h,
                width: rw,
                height: h + (isBottom ? EXT : 2),
                background: C.paper,
                boxShadow: `inset 1px 0 0 ${C.paperShade}, inset -1px 0 0 ${C.paperShade}`,
                transformOrigin: `50% ${h}px`,
                visibility: "hidden",
                willChange: "transform",
                clipPath: isTop ? tearPolygon(rw, 3 * u, 12 * u, 6 * u, "below") : undefined,
              }}
            >
              <div
                ref={(el) => {
                  R.inks[i] = el;
                }}
                className="absolute inset-x-0 top-0"
                style={{ height: h }}
              >
                <RowInk row={row}>
                  {row.id === "f-amt" && (
                    <div
                      ref={(el) => {
                        R.bar = el;
                      }}
                      aria-hidden
                      className="absolute flex items-center justify-center"
                      style={{
                        inset: `${-4 * u}px ${-9 * u}px`,
                        background: C.ink,
                        borderRadius: 2 * u,
                        color: C.paper,
                        fontFamily: "var(--f-space-mono)",
                        fontWeight: 700,
                        fontSize: Math.max(7, 8 * u),
                        letterSpacing: "0.16em",
                      }}
                    >
                      HIDDEN
                    </div>
                  )}
                  {row.id === "barcode" && (
                    <div
                      ref={(el) => {
                        R.laser = el;
                      }}
                      aria-hidden
                      className="absolute"
                      style={{
                        left: "-9%",
                        right: "-9%",
                        top: 0,
                        height: Math.max(2, 2.2 * u),
                        marginTop: -1,
                        background: C.pink,
                        boxShadow: `0 0 ${6 * u}px ${C.pink}, 0 0 ${18 * u}px ${alpha(C.pink, 0.8)}`,
                        opacity: 0,
                      }}
                    />
                  )}
                </RowInk>
              </div>
              <div
                ref={(el) => {
                  R.shades[i] = el;
                }}
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0"
                style={{ height: h + 2 }}
              />
            </div>
          );
        })}

        {/* 001 · SHIPPED */}
        <div {...overlay(IDX["s-stamp"])} aria-hidden>
          <StampRig
            refs={{
              stamp: (el) => (R.stampS = el),
              shadow: (el) => (R.stampSShadow = el),
              spatter: (el) => (R.stampSSpatter = el),
            }}
            x={rw * 0.55}
            y={g.h[IDX["s-stamp"]] * 0.52}
            width={rw * (g.mobile ? 0.56 : 0.5)}
            color={C.cobalt}
          >
            <Stamp id="shipped" lines={["SHIPPED"]} color={C.cobalt} width={rw * (g.mobile ? 0.56 : 0.5)} seed={4} />
          </StampRig>
        </div>

        {/* 002 · ribbon, bow, gift tag */}
        <div {...overlay(IDX["f-ribbon"])} aria-hidden>
          <div
            ref={(el) => {
              R.ribbon = el;
            }}
            className="absolute"
            style={{
              left: -7 * u,
              width: rw + 14 * u,
              top: g.h[IDX["f-ribbon"]] / 2 - 9 * u,
              height: 18 * u,
              background: `linear-gradient(to bottom, ${C.pink} 0%, ${C.ribbonSheen} 28%, ${C.pink} 52%, ${C.pink} 78%, ${C.ribbonFold} 100%)`,
              clipPath: "inset(-40% 100% -40% 0)",
            }}
          >
            <div className="absolute inset-y-0 left-0" style={{ width: 7 * u, background: C.ribbonFold }} />
            <div className="absolute inset-y-0 right-0" style={{ width: 7 * u, background: C.ribbonFold }} />
          </div>
          <div
            ref={(el) => {
              R.bow = el;
            }}
            className="absolute"
            style={{ left: rw * 0.27, top: g.h[IDX["f-ribbon"]] / 2 - 2 * u, transform: "translate(-50%, -50%) scale(0)" }}
          >
            <Bow size={rw * (g.mobile ? 0.3 : 0.25)} />
          </div>
          <div
            ref={(el) => {
              R.giftTag = el;
            }}
            className="absolute flex items-center"
            style={{
              left: rw * 0.72,
              top: g.h[IDX["f-ribbon"]] / 2,
              height: 24 * u,
              padding: `0 ${10 * u}px 0 ${18 * u}px`,
              background: C.ink,
              color: C.paper,
              borderRadius: `${4 * u}px ${2 * u}px ${2 * u}px ${4 * u}px`,
              clipPath: `polygon(${10 * u}px 0, 100% 0, 100% 100%, ${10 * u}px 100%, 0 50%)`,
              fontFamily: "var(--f-space-mono)",
              fontWeight: 700,
              fontSize: Math.max(8.5, 10 * u),
              letterSpacing: "0.12em",
              whiteSpace: "nowrap",
              opacity: 0,
            }}
          >
            <span className="absolute rounded-full" style={{ left: 7 * u, top: "50%", width: 5 * u, height: 5 * u, marginTop: -2.5 * u, background: C.paper }} />
            <span style={{ opacity: "var(--face, 1)" as unknown as number }}>GIFT RECEIPT</span>
          </div>
        </div>

        {/* 002 · LIVE + SOLD IRL */}
        <div {...overlay(IDX["f-stamp"])} aria-hidden>
          <StampRig
            refs={{
              stamp: (el) => (R.stampF = el),
              shadow: (el) => (R.stampFShadow = el),
              spatter: (el) => (R.stampFSpatter = el),
            }}
            x={rw * 0.5}
            y={g.h[IDX["f-stamp"]] * 0.52}
            width={rw * (g.mobile ? 0.6 : 0.54)}
            color={C.teal}
          >
            <Stamp id="sold" lines={["LIVE +", "SOLD IRL"]} label="Live + sold IRL" color={C.teal} width={rw * (g.mobile ? 0.6 : 0.54)} seed={23} />
          </StampRig>
        </div>

        {/* 003 · FOR SALE swing tag */}
        <div {...overlay(tagRow)}>
          <SwingTag g={g} R={R} rowH={g.h[tagRow]} />
        </div>

        {/* BEEP. */}
        <div {...overlay(IDX.barcode)} aria-hidden>
          <div
            ref={(el) => {
              R.beep = el;
            }}
            className="absolute"
            style={{
              left: g.mobile ? rw * 0.74 : rw + 62 * u,
              top: g.h[IDX.barcode] * (g.mobile ? 0.36 : 0.3),
              fontFamily: "var(--f-doto)",
              fontWeight: 900,
              fontVariationSettings: '"ROND" 100',
              fontSize: (g.mobile ? 40 : 62) * u,
              lineHeight: 1,
              color: C.pink,
              WebkitTextStroke: `${(g.mobile ? 7 : 8) * u}px ${C.paper}`,
              paintOrder: "stroke fill",
              whiteSpace: "nowrap",
              opacity: 0,
            }}
          >
            <DotText text="BEEP." />
          </div>
        </div>
      </div>

      {/* print-head light warming the paper */}
      <div
        ref={(el) => {
          R.paperGlow = el;
        }}
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: rx,
          width: rw,
          top: g.slot0 - 76 * u,
          height: 76 * u,
          background: `linear-gradient(to top, ${alpha(C.sun, 0.42)}, ${alpha(C.sun, 0.1)} 45%, ${alpha(C.sun, 0)})`,
          mixBlendMode: "multiply",
        }}
      />

      <Printer g={g} R={R} fine={fine} />

      {/* the price gun's last sticker (and the next portal's birth box) */}
      <div className="pointer-events-none absolute" style={{ left: stickerBox.x, top: stickerBox.y, width: stickerBox.s, height: stickerBox.s, zIndex: 30 }}>
        <div
          ref={(el) => {
            R.sticker = el;
          }}
          aria-hidden
          className="absolute inset-0"
          style={{ transformOrigin: "40% 60%", opacity: 0 }}
        >
          <BicepSticker size={stickerBox.s} />
        </div>
        <div ref={origin} aria-hidden className="absolute inset-0" />
      </div>

      <PriceGun rootRef={rootRef} u={u} />
      <div aria-hidden className="riso-grain" style={{ zIndex: 50, opacity: 0.13 }} />
    </div>
  );
}

/* ------------------------------------------------------------ helpers */

function stickerRect(g: Geo) {
  const s = g.sticker;
  // the bicep's visual centre (≈42%, 42% of the icon box) sits just above the slot, its elbow on the stub
  return { s, x: Math.round(g.W / 2 - 0.425 * s), y: Math.round(g.slot1 - 0.16 * s - 0.42 * s) };
}

/** Overprint word size + vertical position (sized from measured Anybody widths). */
function wordLayout(g: Geo, k: number) {
  const lines = WORDS[k].lines;
  const st = wordRest(g, k);
  const em = Math.max(...lines.map((l) => wordEm(l, st)));
  if (k === 0) {
    const paperTop = g.slot0 - (g.top[IDX["s-no"]] + g.lead);
    const top = g.mobile ? 112 : 128;
    const avail = Math.max(80, paperTop - 18 - top);
    const size = Math.min(((g.mobile ? 0.88 : 0.72) * g.W) / em, avail / (lines.length * 0.88 + 0.08));
    return { size, y: top + avail / 2, lines };
  }
  const size = Math.min(((g.mobile ? 0.9 : 0.88) * g.W) / em, g.H * 0.22) * (k === WORDS.length - 1 ? 0.82 : 1);
  return { size, y: g.H * (k === WORDS.length - 1 ? (g.mobile ? 0.36 : 0.4) : g.mobile ? 0.2 : 0.27), lines };
}

/** Where each flood's ring starts (stage px, shifted by the canvas bleed). */
function floodsFor(g: Geo): Flood[] {
  const u = g.u;
  const sRow = IDX["s-stamp"];
  const fRow = IDX["f-stamp"];
  const tagRow = g.mobile ? IDX["l-tag"] : IDX["l-name"];
  const tagY = g.mobile
    ? rowBottomY(g, tagRow, B.tagHit) - g.h[tagRow] + 10 * u + 8 * u + 32 * u
    : rowBottomY(g, tagRow, B.tagHit) - g.h[tagRow] * 0.5 + 10 * u + 14 * u + 46 * u;
  const tagX = g.mobile ? g.cx : g.rx + g.rw + 52 * u;
  const st = stickerRect(g);
  return [
    {
      x: g.rx + g.rw * 0.55 + PAD,
      y: rowBottomY(g, sRow, B.sStampHit) - g.h[sRow] * 0.48 + PAD,
      a: B.sFloodA,
      b: B.sFloodB,
      shape: "star",
      color: C.cobalt,
      plate: C.pink,
      rest: 0.18,
      peak: 0.98,
    },
    {
      x: g.rx + g.rw * 0.5 + PAD,
      y: rowBottomY(g, fRow, B.fStampHit) - g.h[fRow] * 0.48 + PAD,
      a: B.fFloodA,
      b: B.fFloodB,
      shape: "bow",
      color: C.pink,
      plate: C.sun,
      rest: 0.17,
      peak: 0.98,
    },
    {
      x: tagX + PAD,
      y: tagY + PAD,
      a: B.lFloodA,
      b: B.lFloodB,
      shape: "arrow",
      color: C.sun,
      plate: C.pink,
      rest: 0.15,
      peak: 0.98,
    },
    {
      x: st.x + st.s * 0.425 + PAD,
      y: st.y + st.s * 0.42 + PAD,
      a: B.ringA,
      b: B.ringB,
      shape: "dot",
      color: C.sun,
      plate: C.sun,
      rest: 0,
      peak: 0,
      transient: true,
      halo: st.s * 1.75,
    },
  ];
}
