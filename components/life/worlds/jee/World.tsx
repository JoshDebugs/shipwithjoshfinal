"use client";

/**
 * 10 · JEE — "Projections".
 *
 * One desk lamp, one pile of books, two walls. About two years of books land
 * until the shadow on the wall spells IIT. The lamp dies. When it comes back
 * it is somewhere else, and as it swings around the same pile, which does not
 * move, the wall resolves into something new: a laptop. That shadow is the
 * door to the next world.
 */

import dynamic from "next/dynamic";
import { useMemo, useRef, type CSSProperties } from "react";
import { LazyCanvas } from "@/components/life/multiverse/LazyCanvas";
import { useProgress, usePointer, usePortalOrigin, useStage, useTicker, useWorld } from "@/components/life/multiverse/runtime";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { bell, clamp, easeInOutSine, lerp, range } from "@/components/life/multiverse/ease";
import type { WorldProps } from "@/components/life/multiverse/types";
import { cornerScreenX, laptopScreenRect, makeRig, wallToNdc } from "./rig";
import { BEATS } from "./timeline";
import Fallback from "./Fallback";

const Scene = dynamic(() => import("./Scene"), { ssr: false, loading: () => null });

const FRAUNCES = "var(--f-fraunces)";
const MONO = "var(--font-geist-mono)";

export default function JeeWorld({ progress }: WorldProps) {
  const stage = useStage();
  const { active } = useWorld();
  const origin = usePortalOrigin();
  const pointer = usePointer();

  const rig = useMemo(() => makeRig(Math.max(1, stage.width), Math.max(1, stage.height)), [stage.width, stage.height]);
  const { lowPower: low, isMobile: mob } = stage;

  const wobble = useRef(0);
  const dark = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLParagraphElement>(null);
  const planWrap = useRef<HTMLDivElement>(null);
  const failA = useRef<HTMLParagraphElement>(null);
  const failB = useRef<HTMLParagraphElement>(null);
  const someWrap = useRef<HTMLParagraphElement>(null);
  const personWrap = useRef<HTMLParagraphElement>(null);
  const person = useRef<HTMLSpanElement>(null);
  const samePile = useRef<HTMLParagraphElement>(null);
  const proof = useRef<HTMLParagraphElement>(null);
  const proofAngle = useRef<HTMLSpanElement>(null);

  useTicker((_, dt) => {
    const target = active && pointer.type.current === "mouse" && !stage.isMobile ? pointer.nx.get() * 0.06 : 0;
    wobble.current += (target - wobble.current) * Math.min(1, dt * 4);
    if (Math.abs(wobble.current) < 0.0005) wobble.current = 0;
  });

  useProgress(progress, (p) => {
    const b = BEATS;
    if (dark.current) dark.current.style.opacity = p > b.black && p < b.ignite ? "1" : "0";
    setOpacity(label.current, 1 - range(p, 0.038, 0.065));
    setOpacity(planWrap.current, Math.min(range(p, b.iitLock - 0.008, b.iitLock + 0.012), 1 - range(p, b.dark - 0.014, b.dark)));
    // Lights-out copy has no motion at all: it is simply there.
    setVisible(failA.current, p > 0.42 && p < 0.538);
    setVisible(failB.current, p > 0.462 && p < 0.538);
    setOpacity(someWrap.current, bell(p, 0.595, 0.622, 0.705, 0.732));
    setOpacity(personWrap.current, range(p, 0.722, 0.76));
    if (person.current) {
      const harden = easeInOutSine(range(p, b.solve - 0.03, b.solve + 0.008));
      const soft = lerp(100, 0, harden);
      const wght = lerp(300, 700, harden);
      person.current.style.fontVariationSettings = `"SOFT" ${soft.toFixed(0)}, "WONK" 0, "opsz" 144, "wght" ${wght.toFixed(0)}`;
      person.current.style.filter = harden >= 1 ? "none" : `blur(${lerp(2.4, 0, harden).toFixed(2)}px)`;
    }
    setOpacity(samePile.current, range(p, b.solve + 0.05, b.solve + 0.085));
    if (proof.current) {
      proof.current.style.opacity = String(bell(p, 0.585, 0.612, b.solve - 0.05, b.solve - 0.022));
      if (proofAngle.current) {
        const deg = Math.round(20 + 70 * clamp((p - b.swing) / (b.solve - b.swing)));
        proofAngle.current.textContent = String(Math.min(90, deg)).padStart(2, "0");
      }
    }
  });

  // The next portal is born exactly on the laptop shadow.
  const originRect = laptopScreenRect(rig);

  // Title label: an eyebrow on the lit wall, above the letters, clear of the pile.
  const titleAnchor = wallToNdc(rig.title, rig.asp, rig.jee.u0 + (rig.jee.sx * (1.4782 + 0.0213)) / 2, rig.jee.v0 + rig.jee.sy);
  const labelTop = ((1 - titleAnchor[1]) / 2) * rig.H - (mob ? 26 : 36);

  // Copy always sits on plaster the lamp is not reaching: beyond the corner, or right of the shape.
  const planLeft = Math.max(cornerScreenX(rig, rig.a) + 44, rig.W * 0.7);
  const heroLeft = Math.max(originRect.left + originRect.size + 56, rig.W * 0.68);
  const mobileTop = Math.round(rig.H * 0.125);
  const heroBox: CSSProperties = mob
    ? { left: 22, right: 22, top: mobileTop }
    : { left: heroLeft, width: rig.W - heroLeft - 36, top: rig.H * 0.23 };

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: RISO.ink }}>
      <h2 className="sr-only">JEE, age 18: Projections. About two years of JEE preparation. IIT didn&apos;t happen. This one didn&apos;t work. Some plans end. The person doesn&apos;t.</h2>

      <div className="absolute inset-0" aria-hidden>
        <LazyCanvas camera={{ fov: 34, near: 0.1, far: 70, position: [8, 1.5, 0] }} fallback={<Fallback progress={progress} rig={rig} />}>
          <Scene progress={progress} rig={rig} low={low} wobble={wobble} />
        </LazyCanvas>
      </div>

      {/* registered portal origin: the laptop shadow's icon box */}
      <div ref={origin} className="pointer-events-none absolute" style={{ left: originRect.left, top: originRect.top, width: originRect.size, height: originRect.size }} />

      {/* pure ink lights-out */}
      <div ref={dark} className="pointer-events-none absolute inset-0" style={{ background: RISO.ink, opacity: 0 }} />

      {/* Title label, printed on the lit wall */}
      <p
        ref={label}
        className="absolute left-0 right-0 text-center"
        style={{
          top: labelTop,
          fontFamily: MONO,
          color: RISO.ink,
          fontSize: mob ? 11 : 13,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontWeight: 500,
        }}
      >
        Age 18 · ~2 years of JEE prep
      </p>

      {/* The plan */}
      <div
        ref={planWrap}
        className="pointer-events-none absolute"
        style={mob ? { left: 22, width: "56%", top: mobileTop, opacity: 0 } : { left: planLeft, width: rig.W - planLeft - 36, top: "24%", opacity: 0 }}
      >
        <p style={{ fontFamily: FRAUNCES, color: RISO.paper, fontSize: mob ? 15 : "clamp(17px, 1.5vw, 24px)", lineHeight: 1.3, fontVariationSettings: '"SOFT" 40, "WONK" 0, "opsz" 36, "wght" 360' }}>
          ~2 years of JEE prep.
        </p>
        <p style={{ fontFamily: FRAUNCES, color: RISO.paper, fontSize: mob ? 26 : "clamp(30px, 3.4vw, 54px)", lineHeight: 1.06, marginTop: mob ? 2 : 10, fontVariationSettings: '"SOFT" 40, "WONK" 0, "opsz" 72, "wght" 480' }}>
          The plan had a shape.
        </p>
      </div>

      {/* Lights out */}
      <div className="pointer-events-none absolute inset-0" style={{ padding: mob ? "0 24px" : "0 12vw" }}>
        <div className="flex h-full flex-col justify-center" style={{ maxWidth: 980 }}>
          <p
            ref={failA}
            style={{
              visibility: "hidden",
              fontFamily: FRAUNCES,
              color: RISO.paper,
              fontSize: mob ? 44 : "clamp(52px, 7vw, 108px)",
              lineHeight: 1.04,
              fontVariationSettings: '"SOFT" 0, "WONK" 0, "opsz" 144, "wght" 380',
              letterSpacing: "-0.012em",
            }}
          >
            IIT didn&apos;t happen.
          </p>
          <p
            ref={failB}
            style={{
              visibility: "hidden",
              fontFamily: FRAUNCES,
              color: alpha(RISO.paper, 0.72),
              fontSize: mob ? 24 : "clamp(26px, 3vw, 44px)",
              lineHeight: 1.2,
              marginTop: mob ? 18 : 26,
              fontVariationSettings: '"SOFT" 0, "WONK" 0, "opsz" 72, "wght" 300',
            }}
          >
            This one didn&apos;t work.
          </p>
        </div>
      </div>

      {/* The tangle */}
      <p
        ref={someWrap}
        className="pointer-events-none absolute"
        style={{
          opacity: 0,
          fontFamily: FRAUNCES,
          color: RISO.paper,
          fontSize: mob ? 36 : "clamp(40px, 4.8vw, 74px)",
          lineHeight: 1.02,
          fontVariationSettings: '"SOFT" 40, "WONK" 0, "opsz" 96, "wght" 420',
          ...heroBox,
        }}
      >
        Some plans end.
      </p>

      {/* The turn */}
      <p
        ref={personWrap}
        className="pointer-events-none absolute"
        style={{
          opacity: 0,
          fontFamily: FRAUNCES,
          color: RISO.paper,
          fontSize: mob ? 38 : "clamp(44px, 5.2vw, 80px)",
          lineHeight: 1.02,
          ...heroBox,
        }}
      >
        <span ref={person} style={{ display: "inline-block", willChange: "filter" }}>
          The person doesn&apos;t.
        </span>
      </p>

      <p
        ref={samePile}
        className="pointer-events-none absolute"
        style={{
          opacity: 0,
          fontFamily: MONO,
          color: RISO.paper,
          fontSize: mob ? 11 : 13,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          ...(mob ? { left: 24, top: mobileTop + 96 } : { left: heroLeft, top: rig.H * 0.23 + Math.min(80, 0.052 * rig.W) * 2.04 + 22 }),
        }}
      >
        Same pile. New angle.
      </p>

      {/* Diegetic proof the pile stays put */}
      <p
        ref={proof}
        className="pointer-events-none absolute"
        style={{
          opacity: 0,
          fontFamily: MONO,
          color: alpha(RISO.paper, 0.82),
          fontSize: mob ? 10.5 : 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          ...(mob ? { left: 24, top: mobileTop + 88 } : { left: heroLeft, top: rig.H * 0.23 + Math.min(74, 0.048 * rig.W) * 2.04 + 22 }),
        }}
      >
        Lamp <span ref={proofAngle}>20</span>° · pile moved 0.00 mm
      </p>
    </div>
  );
}

function setOpacity(el: HTMLElement | null, v: number) {
  if (el) el.style.opacity = String(v);
}
function setVisible(el: HTMLElement | null, v: boolean) {
  if (el) el.style.visibility = v ? "visible" : "hidden";
}
