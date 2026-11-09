"use client";

import { useMemo, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useProgress } from "@/components/life/multiverse/runtime";
import { RISO, alpha } from "@/components/life/multiverse/palette";
import { backOut, clamp, easeInCubic, easeOutCubic, lerp, range } from "@/components/life/multiverse/ease";
import { newCam, newProj, project } from "./hall";
import { archivo, martian } from "./ink";
import { camAt, type Layout } from "./layout";
import { BURST, ConferenceStamp, Seal } from "./Seal";
import { B, dropT } from "./timeline";


/**
 * Josh's name card in the foreground once the camera is behind him.
 * The seal and the stamp burst are printed onto it (multiply → riso red on sun).
 */
export function JoshCard({ L, progress }: { L: Layout; progress: MotionValue<number> }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const burstRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cam = useMemo(newCam, []);
  const pr = useMemo(newProj, []);
  const cw = L.cardW;
  const ch = (cw * L.geo.card.h) / L.geo.card.w;
  const balloonMax = L.portrait ? 1.36 : 1.35;

  useProgress(progress, (p) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const d = dropT(p);
    camAt(L, p, cam);
    const g = L.geo;
    const ok = project(cam, g.card.x, g.card.y, g.card.z, pr);
    const show = ok && d > 0.2 && p < B.exitCam[0] + 0.05;
    wrap.style.visibility = show ? "visible" : "hidden";
    if (!show) return;
    const stand = clamp((d - 0.25) / 0.5);
    const boost = lerp(1, L.cardBoost, easeOutCubic(clamp((d - 0.2) / 0.7)));
    const balloon = 1 + (balloonMax - 1) * backOut(range(p, B.balloon[0], B.balloon[1]), 1.6);
    const scale = ((pr.k * g.card.w) / cw) * boost * balloon;
    // the card stands up as the camera comes down, and leaves with the crane-up
    const leave = range(p, B.exitCam[0], B.exitCam[0] + 0.05);
    // as the camera cranes up and back, the near card drops out of the bottom of frame (it doesn't ghost)
    const drop = easeInCubic(leave) * (L.h - pr.y + ch * scale * 1.8);
    wrap.style.opacity = String(clamp((d - 0.3) / 0.25) * (1 - range(leave, 0.75, 1)));
    wrap.style.transform = `translate3d(${pr.x - cw / 2}px, ${pr.y - ch / 2 + drop}px, 0) scale(${scale}) scaleY(${lerp(0.55, 1, stand)})`;

    const name = nameRef.current;
    if (name) {
      const wd = lerp(62, 125, easeOutCubic(range(p, B.drop[0] + 0.03, B.drop[1] + 0.03)));
      name.style.fontVariationSettings = `"wdth" ${wd.toFixed(1)}, "wght" 900`;
    }

    const seal = sealRef.current;
    if (seal) {
      const s = range(p, B.seal[0], B.seal[1]);
      seal.style.opacity = String(clamp(s * 4));
      seal.style.transform = `translate(-50%, -50%) rotate(${lerp(-24, -9, easeOutCubic(s))}deg) scale(${lerp(2.2, 1, easeOutCubic(s))})`;
      seal.style.visibility = s > 0 ? "visible" : "hidden";
    }
    const n = BURST.length;
    burstRefs.current.forEach((el, i) => {
      if (!el) return;
      const a = B.burst[0] + ((B.burst[1] - B.burst[0]) * i) / n;
      const s = range(p, a, a + 0.007);
      el.style.opacity = String(clamp(s * 3) * BURST[i].o);
      el.style.visibility = s > 0 ? "visible" : "hidden";
      el.style.transform = `translate(-50%, -50%) rotate(${BURST[i].r}deg) scale(${lerp(1.7, 1, easeOutCubic(s))})`;
    });
  });

  const stampFs = L.portrait ? 16 : 23;
  const sealSize = ch * 1.22;
  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute left-0 top-0"
      style={{ width: cw, height: ch, zIndex: 8, visibility: "hidden", transformOrigin: "50% 50%", willChange: "transform" }}
    >
      <div
        className="absolute inset-0 flex flex-col justify-between"
        style={{ background: RISO.sun, color: RISO.ink, padding: `${ch * 0.11}px ${cw * 0.06}px ${ch * 0.12}px`, boxShadow: `0 ${ch * 0.07}px 0 ${alpha(RISO.ink, 0.35)}` }}
      >
        <div style={{ ...martian, fontSize: Math.round(ch * 0.085), letterSpacing: "0.22em" }}>Delegate</div>
        <div ref={nameRef} style={{ ...archivo(62, 900), fontSize: ch * 0.5, lineHeight: 0.86, letterSpacing: "0.005em" }}>
          JOSH
        </div>
        <div className="flex items-center gap-[0.8em]" style={{ ...martian, fontSize: Math.round(ch * 0.075), letterSpacing: "0.22em" }}>
          <span style={{ width: cw * 0.1, height: Math.max(2, ch * 0.022), background: RISO.ink, display: "inline-block" }} />
          Age 15
        </div>
      </div>
      {/* printed onto the card */}
      <div
        ref={sealRef}
        className="absolute"
        style={{ left: cw * 0.79, top: ch * 0.5, mixBlendMode: "multiply", visibility: "hidden", opacity: 0, transformOrigin: "50% 50%" }}
      >
        <Seal size={sealSize} id="mun-seal-live" />
      </div>
      {BURST.map((b, i) => (
        <div
          key={i}
          ref={(el) => {
            burstRefs.current[i] = el;
          }}
          className="absolute"
          style={{ left: cw * b.x, top: ch * b.y, mixBlendMode: b.multiply ? "multiply" : "normal", visibility: "hidden", opacity: 0, transformOrigin: "50% 50%" }}
        >
          <ConferenceStamp fs={stampFs * (i === BURST.length - 1 ? 1.08 : 1)} shift={i + 2} />
        </div>
      ))}
    </div>
  );
}
