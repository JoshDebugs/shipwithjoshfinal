/**
 * The meter bridge and the print slug — diegetic readouts, not a HUD.
 * VU: 12 LED segments, cobalt → teal → sun → pink, mono dB labels.
 * Slug: the printer's colour bar (one swatch per ink pass, filled once that
 * pass has printed) + INK n/4 · VOL · dB.
 */
import type { RefObject } from "react";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { PASSES, VU_SEGMENTS } from "./timeline";

const MONO = "var(--font-geist-mono), ui-monospace, monospace";

export type VuRefs = {
  root: RefObject<HTMLDivElement | null>;
  segs: RefObject<(HTMLDivElement | null)[]>;
};

export function Vu({
  refs,
  segW,
  segH,
  gap,
  labelEvery,
  lit = 0,
  fontSize = 9,
}: {
  refs?: VuRefs;
  segW: number;
  segH: number;
  gap: number;
  labelEvery: number;
  lit?: number;
  fontSize?: number;
}) {
  const width = 12 * segW + 11 * gap;
  return (
    <div ref={refs?.root} aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ width, height: segH + 18, willChange: "transform, opacity" }}>
      {VU_SEGMENTS.map((s, i) => (
        <div
          key={s.db}
          ref={(el) => {
            if (refs) refs.segs.current[i] = el;
          }}
          className="absolute top-0"
          style={{
            left: i * (segW + gap),
            width: segW,
            height: segH,
            borderRadius: 2,
            border: `1px solid ${alpha(s.ink === RISO.sun ? RISO.ink : s.ink, 0.55)}`,
            background: i < lit ? s.ink : "transparent",
          }}
        />
      ))}
      {VU_SEGMENTS.map((s, i) =>
        i % labelEvery === 0 || i === 11 ? (
          <span
            key={`l${s.db}`}
            className="absolute whitespace-nowrap"
            style={{
              left: i * (segW + gap) + segW / 2,
              top: segH + 5,
              transform: "translateX(-50%)",
              fontFamily: MONO,
              fontSize,
              lineHeight: 1,
              letterSpacing: "0.02em",
              color: alpha(RISO.ink, i === 11 ? 1 : 0.72),
              fontWeight: i === 11 ? 600 : 400,
            }}
          >
            {s.db}
          </span>
        ) : null,
      )}
    </div>
  );
}

export type SlugRefs = {
  root: RefObject<HTMLDivElement | null>;
  swatches: RefObject<(HTMLSpanElement | null)[]>;
  ink: RefObject<HTMLSpanElement | null>;
  vol: RefObject<HTMLSpanElement | null>;
  db: RefObject<HTMLSpanElement | null>;
};

export function Slug({ refs, inks = 0, vol = "00.0", db = "−∞ dB", fontSize = 10, compact = false }: { refs?: SlugRefs; inks?: number; vol?: string; db?: string; fontSize?: number; compact?: boolean }) {
  const dot = compact ? null : <span style={{ opacity: 0.45 }}>·</span>;
  return (
    <div
      ref={refs?.root}
      aria-hidden
      className={`pointer-events-none absolute left-0 top-0 flex items-center whitespace-nowrap uppercase ${compact ? "gap-[7px]" : "gap-2"}`}
      style={{ fontFamily: MONO, fontSize, letterSpacing: compact ? "0.02em" : "0.14em", color: RISO.ink, lineHeight: 1 }}
    >
      <span className="flex gap-[3px]">
        {PASSES.map((p, i) => (
          <span
            key={p.name}
            ref={(el) => {
              if (refs) refs.swatches.current[i] = el;
            }}
            className="inline-block"
            style={{ width: compact ? fontSize - 1 : fontSize, height: compact ? fontSize - 1 : fontSize, border: `1px solid ${RISO.ink}`, background: i < inks ? p.ink : "transparent" }}
          />
        ))}
      </span>
      <span>
        INK <span ref={refs?.ink}>{inks}</span>/4
      </span>
      {dot}
      <span>
        VOL <span ref={refs?.vol}>{vol}</span>
      </span>
      {dot}
      <span ref={refs?.db}>{db}</span>
    </div>
  );
}

/** Registration target (⊕) — corners of the sheet. */
export function RegMark({ x, y, size = 22 }: { x: number; y: number; size?: number }) {
  const h = size / 2;
  return (
    <svg aria-hidden className="pointer-events-none absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ left: x - h, top: y - h }}>
      <circle cx={h} cy={h} r={h * 0.55} fill="none" stroke={RISO.ink} strokeWidth={0.9} />
      <circle cx={h} cy={h} r={h * 0.22} fill={RISO.ink} />
      <path d={`M${h} 0 V${size} M0 ${h} H${size}`} stroke={RISO.ink} strokeWidth={0.9} />
    </svg>
  );
}
