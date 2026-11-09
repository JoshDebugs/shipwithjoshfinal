"use client";

/**
 * Reduced motion: the receipt, already printed. No feed, no billow, no
 * floods in motion — the whole slip hangs out of the printer, stamped,
 * gift-wrapped, tagged and scanned, on a room whose halftone has settled into
 * each startup's ink (cobalt stars, pink bows, sun arrows). The overprint
 * words sit behind the paper in pink over a misregistered cobalt plate, and
 * the price gun's last sticker, the bicep, is slapped on the printer.
 */
import { useId, type CSSProperties, type ReactNode } from "react";
import { useStage } from "@/components/life/multiverse/runtime";
import { C, alpha } from "./colors";
import { tearPolygon } from "./engine";
import { computeGeo, type Geo } from "./geometry";
import { BicepSticker, Bow, DotText } from "./glyphs";
import { RowInk } from "./RowInk";
import { IDX, ROWS } from "./rows";
import { Stamp } from "./Stamp";
import { tagLayout } from "./SwingTag";
import { wordEm } from "./words";

/** Printer top surface depth (matches the live printer). */
const TOP = 30;
const MONO = "var(--f-space-mono)";

export default function StartupsStatic() {
  const stage = useStage();
  const W = Math.max(320, stage.width || 1280);
  const H = Math.max(560, stage.height || 800);
  const g = withScanRoom(computeGeo(W, H));
  const { u, rw, mobile } = g;

  const fs = g.fonts;
  const vars = {
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
  } as CSSProperties;

  // title overprint
  const titleLines = ["YOU WANTED", "RECEIPTS?"];
  const titleSt = mobile ? 78 : 136;
  const titleEm = Math.max(...titleLines.map((l) => wordEm(l, titleSt)));
  const titleSize = Math.min(((mobile ? 0.88 : 0.66) * W) / titleEm, mobile ? 76 : 150);

  const bandH = Math.round((mobile ? 128 : 156) * u);
  const y = (id: string) => g.top[IDX[id]];
  const h = (id: string) => g.h[IDX[id]];

  // where each startup's ink "landed" (receipt-local coordinates)
  const hitS = { x: rw * 0.55, y: y("s-stamp") + h("s-stamp") * 0.5 };
  const hitF = { x: rw * 0.5, y: y("f-stamp") + h("f-stamp") * 0.5 + 5 * u };
  const tagRow = mobile ? "l-tag" : "l-name";
  const tag = tagLayout(g, h(tagRow));
  const hitL = mobile
    ? { x: rw * 0.5, y: y(tagRow) + tag.pivot.y + tag.str + tag.h * 0.5 }
    : { x: tag.pivot.x, y: y(tagRow) + tag.pivot.y + tag.str + tag.h * 0.5 };

  const zones = [
    { from: -900, to: y("r2") + h("r2") / 2, shape: "star" as const, color: C.cobalt, plate: C.pink, hit: hitS },
    { from: y("r2") + h("r2") / 2, to: y("r3") + h("r3") / 2, shape: "bow" as const, color: C.pink, plate: C.sun, hit: hitF },
    { from: y("r3") + h("r3") / 2, to: g.total + bandH, shape: "arrow" as const, color: C.sun, plate: C.pink, hit: hitL },
  ];

  const words = mobile
    ? []
    : [
        { text: "SHIPPED.", y: y("s-name") + h("s-name") * 0.5 },
        { text: "SOLD IRL.", y: y("f-ribbon") + h("f-ribbon") * 0.5 },
        { text: "FOR SALE.", y: y("l-name") + h("l-name") * 0.5 },
        { text: "VISIT AGAIN.", y: y("ty1") + h("ty1"), scale: 0.82 },
      ];

  const stampS = rw * (mobile ? 0.56 : 0.5);
  const stampF = rw * (mobile ? 0.54 : 0.48);

  return (
    <div className="relative overflow-hidden" style={{ background: C.room, color: C.paper }}>
      <h2 className="sr-only">Startups, age 17: The Receipts. Then I started building.</h2>
      {/* the room's resting screen: faint paper dots */}
      <Field shape="dot" color={alpha(C.paper, 0.07)} pitch={g.grid} r={g.grid * 0.1} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: 760 * u, background: `radial-gradient(70% 60% at 50% 34%, ${alpha(C.sun, 0.1)}, ${alpha(C.sun, 0)})` }}
      />

      {/* ------------------------------------------------------------ header */}
      <header className="relative z-[2] flex flex-col items-center px-4 text-center" style={{ paddingTop: mobile ? 104 : 116 }}>
        <p
          className="rounded-full"
          style={{
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: mobile ? 10.5 : 11.5,
            letterSpacing: "0.28em",
            padding: "6px 14px 6px 16px",
            background: C.paper,
            color: C.ink,
          }}
        >
          08 · STARTUPS · AGE 17
        </p>
        <p
          className="relative select-none"
          style={{
            marginTop: mobile ? 18 : 22,
            fontFamily: "var(--f-anybody)",
            fontWeight: 900,
            fontStretch: `${titleSt}%`,
            fontSize: titleSize,
            lineHeight: 0.88,
            letterSpacing: "-0.01em",
            whiteSpace: "pre",
          }}
        >
          <span aria-hidden className="absolute left-0 top-0 w-full" style={{ color: C.cobalt, opacity: 0.85, transform: `translate(${Math.round(6 * u)}px, ${Math.round(5 * u)}px)` }}>
            {titleLines.join("\n")}
          </span>
          <span className="relative" style={{ color: C.pink }}>
            <span className="sr-only">You wanted receipts?</span>
            <span aria-hidden>{titleLines.join("\n")}</span>
          </span>
        </p>
      </header>

      {/* ----------------------------------------------- receipt + its room */}
      <div className="relative" style={{ marginTop: mobile ? 34 : 46, height: g.total }}>
        {/* settled halftone floods */}
        {zones.map((z, k) => (
          <Zone key={k} g={g} top={z.from} bottom={z.to} shape={z.shape} color={z.color} plate={z.plate} hit={{ x: g.rx + z.hit.x, y: z.hit.y }} first={k === 0} last={k === zones.length - 1} />
        ))}

        {/* the slot's light on the wall */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{
            left: g.cx - W * 0.5,
            width: W,
            top: g.total - H * 0.4,
            height: H * 0.8,
            background: `radial-gradient(closest-side, ${alpha(C.sun, 0.22)}, ${alpha(C.sun, 0.06)} 55%, ${alpha(C.sun, 0)})`,
          }}
        />

        {/* overprint words behind the paper */}
        {words.map((w) => {
          const size = Math.min((0.88 * W) / wordEm(w.text, 150), H * 0.22) * (w.scale ?? 1);
          return (
            <div
              key={w.text}
              aria-hidden
              className="pointer-events-none absolute left-1/2 select-none"
              style={{
                top: w.y,
                transform: "translate(-50%, -50%)",
                fontFamily: "var(--f-anybody)",
                fontWeight: 900,
                fontStretch: "150%",
                fontSize: size,
                lineHeight: 0.88,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                opacity: 0.4,
              }}
            >
              <div className="absolute left-0 top-0 w-full" style={{ color: C.cobalt, transform: `translate(${Math.round(6 * u)}px, ${Math.round(5 * u)}px)` }}>
                {w.text}
              </div>
              <div className="relative" style={{ color: C.pink }}>
                {w.text}
              </div>
            </div>
          );
        })}

        {/* contact shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{ left: g.rx + 16 * u, top: 24 * u, width: rw, height: g.total, background: alpha(C.ink, 0.9), filter: `blur(${Math.round(18 * u)}px)`, opacity: 0.7 }}
        />

        {/* ---------------------------------------------------- the receipt */}
        <div className="absolute" style={{ left: g.rx, top: 0, width: rw, height: g.total + 12 * u, ...vars }}>
          <ol aria-label="Receipt" className="m-0 list-none p-0">
            {ROWS.map((row, i) => (
              <li
                key={row.id}
                aria-hidden={row.kind === "gap" || row.kind === "rule1" || row.kind === "rule2" || row.kind === "barcode" ? true : undefined}
                className="relative"
                style={{
                  height: g.h[i] + (i === ROWS.length - 1 ? 12 * u : 0),
                  background: C.paper,
                  boxShadow: `inset 1px 0 0 ${C.paperShade}, inset -1px 0 0 ${C.paperShade}`,
                  clipPath: i === 0 ? tearPolygon(rw, 3 * u, 12 * u, 6 * u, "below") : undefined,
                }}
              >
                <RowInk row={row} />
              </li>
            ))}
          </ol>

          {/* print-head warmth near the slot */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0"
            style={{ bottom: 0, height: 90 * u, background: `linear-gradient(to top, ${alpha(C.sun, 0.4)}, ${alpha(C.sun, 0.08)} 50%, ${alpha(C.sun, 0)})`, mixBlendMode: "multiply" }}
          />

          {/* 001 · SHIPPED */}
          <Placed x={hitS.x} y={hitS.y} rotate={-6} blend>
            <Stamp id="static-shipped" lines={["SHIPPED"]} color={C.cobalt} width={stampS} seed={4} />
          </Placed>

          {/* 002 · gift wrap: ribbon, bow, tag */}
          <div
            aria-hidden
            className="absolute"
            style={{
              left: -7 * u,
              width: rw + 14 * u,
              top: y("f-ribbon") + h("f-ribbon") / 2 - 9 * u,
              height: 18 * u,
              background: `linear-gradient(to bottom, ${C.pink} 0%, ${C.ribbonSheen} 28%, ${C.pink} 52%, ${C.pink} 78%, ${C.ribbonFold} 100%)`,
            }}
          >
            <div className="absolute inset-y-0 left-0" style={{ width: 7 * u, background: C.ribbonFold }} />
            <div className="absolute inset-y-0 right-0" style={{ width: 7 * u, background: C.ribbonFold }} />
          </div>
          <Placed x={rw * 0.27} y={y("f-ribbon") + h("f-ribbon") / 2 - 2 * u} rotate={-4}>
            <Bow size={rw * (mobile ? 0.3 : 0.25)} />
          </Placed>
          <div
            className="absolute flex items-center"
            style={{
              left: rw * (mobile ? 0.62 : 0.68),
              top: y("f-ribbon") + h("f-ribbon") / 2,
              transform: "translateY(-50%) rotate(4deg)",
              transformOrigin: "0 50%",
              height: 24 * u,
              padding: `0 ${10 * u}px 0 ${18 * u}px`,
              background: C.ink,
              color: C.paper,
              borderRadius: `${4 * u}px ${2 * u}px ${2 * u}px ${4 * u}px`,
              clipPath: `polygon(${10 * u}px 0, 100% 0, 100% 100%, ${10 * u}px 100%, 0 50%)`,
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: Math.max(8.5, 10 * u),
              letterSpacing: "0.12em",
              whiteSpace: "nowrap",
            }}
          >
            <span aria-hidden className="absolute rounded-full" style={{ left: 7 * u, top: "50%", width: 5 * u, height: 5 * u, marginTop: -2.5 * u, background: C.paper }} />
            GIFT RECEIPT
          </div>

          {/* the price bar, slid off the amount ("kidding") */}
          <div
            aria-hidden
            className="absolute flex items-center justify-center"
            style={{
              left: mobile ? rw * 0.47 : rw - g.pad + 12 * u,
              top: y("f-amt") + h("f-amt") / 2 + (mobile ? 1 : 2) * u,
              width: (mobile ? 64 : 78) * u,
              height: (mobile ? 21 : 26) * u,
              transform: `translateY(-50%) rotate(${mobile ? -5 : -9}deg)`,
              transformOrigin: "0 50%",
              background: C.ink,
              borderRadius: 2 * u,
              boxShadow: `0 0 0 ${1.5 * u}px ${alpha(C.paper, 0.85)}, ${3 * u}px ${4 * u}px ${8 * u}px ${alpha(C.ink, 0.55)}`,
              color: C.paper,
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: Math.max(7, 8 * u),
              letterSpacing: "0.16em",
            }}
          >
            HIDDEN
          </div>
          <p className="sr-only">Gift receipt: price hidden. Kidding: ₹42k in 3 months.</p>

          {/* 002 · LIVE + SOLD IRL */}
          <Placed x={hitF.x} y={hitF.y} rotate={4} blend>
            <Stamp id="static-sold" lines={["LIVE +", "SOLD IRL"]} label="Live + sold IRL" color={C.teal} width={stampF} seed={23} />
          </Placed>

          {/* 003 · FOR SALE swing tag, hanging still */}
          <StaticTag g={g} top={y(tagRow)} tag={tag} />

          {/* the scan: laser line + BEEP. */}
          <div
            aria-hidden
            className="absolute"
            style={{
              left: rw * 0.04,
              width: rw * 0.92,
              top: y("barcode") + h("barcode") * 0.46,
              height: Math.max(2, 2.2 * u),
              background: C.pink,
              boxShadow: `0 0 ${6 * u}px ${C.pink}, 0 0 ${18 * u}px ${alpha(C.pink, 0.8)}`,
            }}
          />
          <div
            aria-hidden
            className="absolute"
            style={{
              left: mobile ? rw * 0.6 : rw + 54 * u,
              top: mobile ? y("g5") + h("g5") - 40 * u : y("barcode") + h("barcode") * 0.18,
              transform: "rotate(-8deg)",
              fontFamily: "var(--f-doto)",
              fontWeight: 900,
              fontVariationSettings: '"ROND" 100',
              fontSize: (mobile ? 34 : 62) * u,
              lineHeight: 1,
              color: C.pink,
              WebkitTextStroke: `${(mobile ? 6 : 8) * u}px ${C.paper}`,
              paintOrder: "stroke fill",
              whiteSpace: "nowrap",
            }}
          >
            <DotText text="BEEP." />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- the printer */}
      <StaticPrinter g={g} bandH={bandH} />

      <div aria-hidden className="riso-grain" style={{ zIndex: 50, opacity: 0.13, animation: "none" }} />
    </div>
  );
}

/* -------------------------------------------------------------- pieces */

/** Phones: a little more paper above the barcode, so BEEP. lands on blank paper. */
function withScanRoom(g: Geo): Geo {
  if (!g.mobile) return g;
  const h = g.h.slice();
  h[IDX.g5] += Math.round(36 * g.u);
  const top: number[] = [];
  let acc = 0;
  for (const hh of h) {
    top.push(acc);
    acc += hh;
  }
  return { ...g, h, top, total: acc };
}

/** Centre a child at (x, y) with a fixed tilt. */
function Placed({ x, y, rotate, blend, children }: { x: number; y: number; rotate: number; blend?: boolean; children: ReactNode }) {
  return (
    <div className="absolute" style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${rotate}deg)`, mixBlendMode: blend ? "multiply" : undefined }}>
      {children}
    </div>
  );
}

function StaticTag({ g, top, tag }: { g: Geo; top: number; tag: ReturnType<typeof tagLayout> }) {
  const u = g.u;
  const { hole, pivot, w, h, str } = tag;
  const swing = g.mobile ? -5 : 7;
  return (
    <div className="absolute left-0" style={{ top, width: 0, height: 0 }}>
      <span
        aria-hidden
        className="absolute rounded-full"
        style={{ left: hole.x - 4 * u, top: hole.y - 4 * u, width: 8 * u, height: 8 * u, background: C.ink, boxShadow: `0 0 0 ${1.5 * u}px ${C.paperDeep}` }}
      />
      {!g.mobile && (
        <svg aria-hidden className="absolute left-0 top-0 overflow-visible" width={1} height={1}>
          <path
            d={`M ${hole.x} ${hole.y} C ${hole.x + 18 * u} ${hole.y - 26 * u}, ${pivot.x - 12 * u} ${pivot.y - 30 * u}, ${pivot.x} ${pivot.y}`}
            stroke={C.paper}
            strokeWidth={1.6 * u}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )}
      <div className="absolute" style={{ left: pivot.x, top: pivot.y, width: 0, height: 0, transform: `rotate(${swing}deg)`, transformOrigin: "0 0" }}>
        <span aria-hidden className="absolute" style={{ left: -0.8 * u, top: 0, width: 1.6 * u, height: str, background: g.mobile ? C.ink : C.paper }} />
        <div
          role="img"
          aria-label="For sale"
          className="absolute flex flex-col items-center justify-center"
          style={{
            left: -w / 2,
            top: str,
            width: w,
            height: h,
            background: C.pink,
            color: C.paper,
            clipPath: `polygon(${14 * u}px 0, ${w - 14 * u}px 0, 100% ${14 * u}px, 100% 100%, 0 100%, 0 ${14 * u}px)`,
            borderRadius: `0 0 ${6 * u}px ${6 * u}px`,
            fontFamily: "var(--f-rubik-mono)",
            fontSize: (g.mobile ? 17 : 21) * u,
            lineHeight: 1.05,
            letterSpacing: "0.02em",
            paddingTop: 10 * u,
            boxShadow: `inset 0 0 0 ${2 * u}px ${C.ribbonFold}`,
          }}
        >
          <span
            aria-hidden
            className="absolute rounded-full"
            style={{ top: 7 * u, left: "50%", width: 8 * u, height: 8 * u, marginLeft: -4 * u, background: C.paper, boxShadow: `0 0 0 ${2 * u}px ${C.ribbonFold}` }}
          />
          {g.mobile ? (
            <span aria-hidden>FOR SALE</span>
          ) : (
            <>
              <span aria-hidden>FOR</span>
              <span aria-hidden>SALE</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StaticPrinter({ g, bandH }: { g: Geo; bandH: number }) {
  const u = g.u;
  const mouthTop = -4 * u;
  const s = Math.round(g.sticker * (g.mobile ? 0.72 : 0.78));
  return (
    <div
      aria-hidden
      className="relative z-[3]"
      style={{
        height: bandH,
        background: `linear-gradient(to bottom, ${C.bandLip} 0px, ${C.bandTop} ${2 * u}px, ${C.bandTopFar} ${TOP * u - 1}px, ${C.bandEdge} ${TOP * u}px, ${C.bandEdge} ${TOP * u + 1.5}px, ${C.bandFront} ${TOP * u + 2}px, ${C.bandLow} 100%)`,
        boxShadow: `0 -${10 * u}px ${30 * u}px ${alpha(C.ink, 0.5)}`,
      }}
    >
      <div
        className="absolute"
        style={{ left: g.cx - g.rw * 0.9, width: g.rw * 1.8, top: 0, height: TOP * u, background: `radial-gradient(50% 120% at 50% 0%, ${alpha(C.sun, 0.22)}, ${alpha(C.sun, 0)})` }}
      />
      {/* slot mouth + thermal head + tear bar */}
      <div
        className="absolute"
        style={{
          left: g.rx - 26 * u,
          width: g.rw + 52 * u,
          top: mouthTop,
          height: 20 * u,
          borderRadius: `${3 * u}px ${3 * u}px ${8 * u}px ${8 * u}px`,
          background: `linear-gradient(to bottom, ${C.ink}, ${C.bandLow})`,
          boxShadow: `inset 0 ${2 * u}px ${5 * u}px ${alpha(C.ink, 0.9)}, 0 ${u}px 0 ${alpha(C.paper, 0.08)}`,
        }}
      />
      <div
        className="absolute"
        style={{
          left: g.rx - 18 * u,
          width: g.rw + 36 * u,
          top: mouthTop - 1,
          height: Math.max(2, 2 * u),
          borderRadius: 2,
          background: C.sun,
          boxShadow: `0 0 ${8 * u}px ${C.sun}, 0 0 ${24 * u}px ${alpha(C.sun, 0.75)}, 0 ${-6 * u}px ${40 * u}px ${alpha(C.sun, 0.35)}`,
          opacity: 0.6,
        }}
      />
      <svg className="absolute" style={{ left: g.rx - 14 * u, top: mouthTop - 5 * u, overflow: "visible" }} width={g.rw + 28 * u} height={6 * u} viewBox={`0 0 ${g.rw + 28 * u} ${6 * u}`}>
        <path d={teeth(g.rw + 28 * u, 6 * u, 7 * u)} fill={C.bandLip} />
      </svg>

      {/* vents + spec line */}
      <div
        className="absolute"
        style={{
          left: g.rx - 26 * u,
          width: g.rw + 52 * u,
          top: (TOP + 46) * u,
          height: Math.max(0, bandH - (TOP + 60) * u),
          borderRadius: 10 * u,
          background: `repeating-linear-gradient(to bottom, ${alpha(C.ink, 0.75)} 0 ${2 * u}px, transparent ${2 * u}px ${8 * u}px)`,
          maskImage: "linear-gradient(to bottom, #000, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, #000, transparent)",
          opacity: 0.7,
        }}
      />
      {!g.mobile && (
        <div
          className="absolute text-center"
          style={{ left: g.rx - 26 * u, width: g.rw + 52 * u, top: (TOP + 16) * u, color: alpha(C.paper, 0.22), fontFamily: MONO, fontSize: Math.max(8, 9.5 * u), letterSpacing: "0.3em" }}
        >
          THERMAL · DOT MATRIX · 58 MM · EST. 2025
        </div>
      )}

      {/* LCD: done */}
      <div className="absolute flex items-center" style={{ left: (g.mobile ? 16 : 28) * u, top: (TOP + (g.mobile ? 8 : 10)) * u, gap: 12 * u, color: alpha(C.paper, 0.55) }}>
        <span className="shrink-0 rounded-full" style={{ width: 7 * u, height: 7 * u, background: C.teal, boxShadow: `0 0 ${8 * u}px ${C.teal}` }} />
        <span
          className="flex items-center"
          style={{
            height: 24 * u,
            padding: `0 ${10 * u}px`,
            background: C.ink,
            borderRadius: 3 * u,
            boxShadow: `inset 0 0 0 1px ${alpha(C.paper, 0.1)}`,
            color: C.sun,
            fontFamily: "var(--f-doto)",
            fontWeight: 900,
            fontVariationSettings: '"ROND" 100',
            fontSize: 15 * u,
            letterSpacing: "0.06em",
            textShadow: `0 0 ${6 * u}px ${alpha(C.sun, 0.6)}`,
          }}
        >
          PRINTED 3/3
        </span>
        {!g.mobile && (
          <span style={{ fontFamily: MONO, fontSize: 10.5 * u, letterSpacing: "0.14em", lineHeight: 1.5 }}>
            RCPT-17 · THERMAL
            <br />
            CASHIER: JOSH
          </span>
        )}
      </div>

      {/* the price gun's last sticker, slapped on the printer */}
      <div
        className="absolute"
        style={{
          left: g.mobile ? g.W - 14 * u - s : g.rx + g.rw + 210 * u,
          top: g.mobile ? (TOP + 4) * u : -s * 0.38,
          width: s,
          height: s,
          transform: "rotate(-10deg)",
        }}
      >
        <BicepSticker size={s} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------- settled halftone */

const SQ3 = Math.sqrt(3);
const SHAPES = {
  dot: "M1 0 A1 1 0 1 1 -1 0 A1 1 0 1 1 1 0 Z",
  star: (() => {
    let d = "";
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 1 : 0.43;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      d += `${i ? "L" : "M"}${(Math.cos(a) * r).toFixed(3)} ${(Math.sin(a) * r).toFixed(3)} `;
    }
    return `${d}Z`;
  })(),
  bow: "M-0.14 -0.08 L-0.95 -0.72 Q-1.08 0 -0.95 0.72 L-0.14 0.08 Z M0.14 -0.08 L0.95 -0.72 Q1.08 0 0.95 0.72 L0.14 0.08 Z M-0.12 -0.3 H0.12 Q0.24 -0.3 0.24 -0.18 V0.18 Q0.24 0.3 0.12 0.3 H-0.12 Q-0.24 0.3 -0.24 0.18 V-0.18 Q-0.24 -0.3 -0.12 -0.3 Z",
  arrow: "M0 -1 L0.92 -0.04 L0.38 -0.04 L0.38 0.98 L-0.38 0.98 L-0.38 -0.04 L-0.92 -0.04 Z",
} as const;
type Shape = keyof typeof SHAPES;

/** A full-width hex-grid halftone of one shape at one size (a settled flood). */
function Field({ shape, color, pitch, r, dx = 0, dy = 0, style }: { shape: Shape; color: string; pitch: number; r: number; dx?: number; dy?: number; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const ph = pitch * SQ3;
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" style={style}>
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={pitch} height={ph} x={dx} y={dy}>
          <path d={SHAPES[shape]} fill={color} transform={`translate(${pitch / 2} ${ph / 4}) scale(${r})`} />
          <path d={SHAPES[shape]} fill={color} transform={`translate(0 ${(ph * 3) / 4}) scale(${r})`} />
          <path d={SHAPES[shape]} fill={color} transform={`translate(${pitch} ${(ph * 3) / 4}) scale(${r})`} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * One startup's zone of the room: a fine tint of its shape everywhere, and a
 * bigger, misregistered two-plate halftone that swells toward where its stamp
 * (or tag) landed — the shockwave, frozen.
 */
function Zone({
  g,
  top,
  bottom,
  shape,
  color,
  plate,
  hit,
  first,
  last,
}: {
  g: Geo;
  top: number;
  bottom: number;
  shape: Shape;
  color: string;
  plate: string;
  hit: { x: number; y: number };
  first: boolean;
  last: boolean;
}) {
  const fade = 70 * g.u;
  const t = first ? -fade * 2.5 : top - fade;
  const b = last ? bottom + 400 : bottom + fade;
  const hgt = b - t;
  const pitch = g.grid;
  const lin = `linear-gradient(to bottom, transparent 0, #000 ${fade * 2}px, #000 ${hgt - (last ? 0 : fade * 2)}px, transparent ${hgt}px)`;
  const reach = Math.max(g.W, g.H) * (g.mobile ? 0.62 : 0.42);
  const rad = `radial-gradient(circle at ${hit.x}px ${hit.y - t}px, #000 0, ${alpha("#000", 0.55)} ${reach * 0.45}px, transparent ${reach}px)`;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0" style={{ top: t, height: hgt, maskImage: lin, WebkitMaskImage: lin }}>
      <Field shape={shape} color={alpha(color, 0.7)} pitch={pitch} r={pitch * 0.15} />
      <div className="absolute inset-0" style={{ maskImage: rad, WebkitMaskImage: rad }}>
        <Field shape={shape} color={alpha(plate, 0.5)} pitch={pitch} r={pitch * 0.36} dx={Math.round(4 * g.u)} dy={Math.round(3 * g.u)} />
        <Field shape={shape} color={color} pitch={pitch} r={pitch * 0.36} />
      </div>
    </div>
  );
}

/** A strip of upward teeth (the tear bar's serration). */
function teeth(w: number, h: number, tooth: number): string {
  const n = Math.max(2, Math.round(w / tooth));
  let d = `M0 ${h}`;
  for (let k = 0; k < n; k++) {
    const x0 = (k / n) * w;
    const x1 = ((k + 0.5) / n) * w;
    const x2 = ((k + 1) / n) * w;
    d += ` L${x0.toFixed(1)} ${h} L${x1.toFixed(1)} 0 L${x2.toFixed(1)} ${h}`;
  }
  return `${d} Z`;
}
