/**
 * The printer: a fat ink body along the bottom edge with a glowing thermal
 * head in its mouth, the paper stub left after the tear, and a small LCD
 * that narrates the beats (kept left, clear of the HUD).
 */
import { C, alpha } from "./colors";
import type { Refs } from "./engine";
import { tearPolygon } from "./engine";
import type { Geo } from "./geometry";

/** Depth of the printer's top surface (its front face starts below it). */
const TOP = 30;

export function Printer({ g, R, fine }: { g: Geo; R: Refs; fine: boolean }) {
  const u = g.u;
  const bandH = g.H - g.slot0 + 12;
  const stubH = g.lead + 8 * u;
  const mouthTop = -4 * u;
  return (
    <div
      ref={(el) => {
        R.band = el;
      }}
      className="pointer-events-none absolute inset-x-0"
      style={{
        top: g.slot0,
        height: bandH,
        zIndex: 20,
        background: `linear-gradient(to bottom, ${C.bandLip} 0px, ${C.bandTop} ${2 * u}px, ${C.bandTopFar} ${TOP * u - 1}px, ${C.bandEdge} ${TOP * u}px, ${C.bandEdge} ${TOP * u + 1.5}px, ${C.bandFront} ${TOP * u + 2}px, ${C.bandLow} 100%)`,
        boxShadow: `0 -${10 * u}px ${30 * u}px ${alpha(C.ink, 0.5)}`,
      }}
    >
      {/* the slot's light on the printer's top surface */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: g.cx - g.rw * 0.9,
          width: g.rw * 1.8,
          top: 0,
          height: TOP * u,
          background: `radial-gradient(50% 120% at 50% 0%, ${alpha(C.sun, 0.2)}, ${alpha(C.sun, 0)})`,
        }}
      />
      {/* paper left in the slot after the tear */}
      <div
        ref={(el) => {
          R.stub = el;
        }}
        aria-hidden
        className="absolute"
        style={{
          left: g.rx,
          width: g.rw,
          top: -stubH,
          height: stubH + 10 * u,
          background: C.paper,
          clipPath: tearPolygon(g.rw, 8 * u - g.lead + 4 * u, 12 * u, 6 * u, "below"),
          opacity: 0,
        }}
      />
      {/* slot mouth + thermal head */}
      <div
        aria-hidden
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
        ref={(el) => {
          R.head = el;
        }}
        aria-hidden
        className="absolute"
        style={{
          left: g.rx - 18 * u,
          width: g.rw + 36 * u,
          top: mouthTop - 1,
          height: Math.max(2, 2 * u),
          borderRadius: 2,
          background: C.sun,
          boxShadow: `0 0 ${8 * u}px ${C.sun}, 0 0 ${24 * u}px ${alpha(C.sun, 0.75)}, 0 ${-6 * u}px ${40 * u}px ${alpha(C.sun, 0.35)}`,
          opacity: 0.55,
        }}
      />
      <div
        ref={(el) => {
          R.hot = el;
        }}
        aria-hidden
        className="absolute left-0"
        style={{
          top: mouthTop - 3 * u,
          width: 16 * u,
          height: 6 * u,
          marginLeft: -8 * u,
          borderRadius: 99,
          background: C.paper,
          boxShadow: `0 0 ${6 * u}px ${C.sun}, 0 0 ${18 * u}px ${C.sun}, 0 0 ${42 * u}px ${alpha(C.sun, 0.8)}`,
          opacity: 0,
        }}
      />

      {/* serrated tear bar in front of the paper */}
      <svg
        aria-hidden
        className="absolute"
        style={{ left: g.rx - 14 * u, top: mouthTop - 5 * u, overflow: "visible" }}
        width={g.rw + 28 * u}
        height={6 * u}
        viewBox={`0 0 ${g.rw + 28 * u} ${6 * u}`}
      >
        <path d={teeth(g.rw + 28 * u, 6 * u, 7 * u)} fill={C.bandLip} />
      </svg>

      {/* vents + spec line (visible while the printer is tall, at the title card) */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: g.rx - 26 * u,
          width: g.rw + 52 * u,
          top: (TOP + 52) * u,
          height: Math.max(0, bandH - (TOP + 100) * u),
          borderRadius: 10 * u,
          background: `repeating-linear-gradient(to bottom, ${alpha(C.ink, 0.75)} 0 ${2 * u}px, transparent ${2 * u}px ${8 * u}px)`,
          maskImage: "linear-gradient(to bottom, #000, transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, #000, transparent)",
          opacity: 0.7,
        }}
      />
      <div
        ref={(el) => {
          R.spec = el;
        }}
        aria-hidden
        className="absolute text-center"
        style={{
          left: g.rx - 26 * u,
          width: g.rw + 52 * u,
          top: (TOP + 16) * u,
          color: alpha(C.paper, 0.3),
          fontFamily: "var(--f-space-mono)",
          fontSize: Math.max(8, 9.5 * u),
          letterSpacing: "0.3em",
          display: g.mobile ? "none" : "block",
        }}
      >
        THERMAL · DOT MATRIX · 58 MM · EST. 2025
      </div>
      {!g.mobile && (
        <div
          aria-hidden
          className="absolute flex items-center"
          style={{
            left: g.rx + g.rw + 52 * u,
            top: (TOP + 9) * u,
            height: 26 * u,
            gap: 8 * u,
            padding: `0 ${12 * u}px`,
            borderRadius: 99,
            background: C.bandLip,
            boxShadow: `inset 0 ${-2 * u}px 0 ${alpha(C.ink, 0.5)}, 0 ${2 * u}px ${6 * u}px ${alpha(C.ink, 0.6)}`,
            color: alpha(C.paper, 0.6),
            fontFamily: "var(--f-space-mono)",
            fontWeight: 700,
            fontSize: 10 * u,
            letterSpacing: "0.2em",
          }}
        >
          <span className="rounded-full" style={{ width: 5 * u, height: 5 * u, background: C.teal, boxShadow: `0 0 ${6 * u}px ${C.teal}` }} />
          FEED
        </div>
      )}

      {/* diegetic readouts */}
      <div className="absolute flex items-center" style={{ left: (g.mobile ? 16 : 28) * u, top: (TOP + (g.mobile ? 8 : 10)) * u, gap: 12 * u, color: alpha(C.paper, 0.55) }}>
        <span
          ref={(el) => {
            R.led = el;
          }}
          aria-hidden
          className="shrink-0 rounded-full"
          style={{ width: 7 * u, height: 7 * u, background: C.sun, boxShadow: `0 0 ${8 * u}px ${C.sun}` }}
        />
        <span
          aria-hidden
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
            minWidth: (g.mobile ? 128 : 150) * u,
            textShadow: `0 0 ${6 * u}px ${alpha(C.sun, 0.6)}`,
          }}
        >
          <span
            ref={(el) => {
              R.lcd = el;
            }}
          >
            READY
          </span>
        </span>
        {!g.mobile && (
          <span aria-hidden style={{ fontFamily: "var(--f-space-mono)", fontSize: 10.5 * u, letterSpacing: "0.14em", lineHeight: 1.5 }}>
            RCPT-17 · THERMAL
            <br />
            {fine ? "CLICK ANYWHERE: PRICE GUN" : "TAP ANYWHERE: STICKERS"}
          </span>
        )}
      </div>
      {g.mobile && (
        <div
          aria-hidden
          className="absolute"
          style={{ left: 16 * u, top: (TOP + 40) * u, color: alpha(C.paper, 0.5), fontFamily: "var(--f-space-mono)", fontSize: 9.5 * u, letterSpacing: "0.14em" }}
        >
          TAP ANYWHERE: STICKERS
        </div>
      )}
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
