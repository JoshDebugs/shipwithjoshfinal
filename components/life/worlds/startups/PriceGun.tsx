"use client";

/**
 * The price gun. Desktop (fine pointer): the cursor becomes a price-tag gun
 * and every click slaps a sun sticker carrying a real fact. Touch: a tap (not
 * a scroll) slaps one. At most 24 stickers; the oldest peels off.
 */
import { useEffect, useRef, useState, type RefObject } from "react";
import { motion, useTransform } from "framer-motion";
import { usePointer, useStage, useWorld } from "@/components/life/multiverse/runtime";
import { hash } from "@/components/life/multiverse/ease";
import { C } from "./colors";
import { GUN_HOTSPOT, PriceGunSvg, rupeeMarkup } from "./glyphs";

const FACTS: { text: string; money?: boolean }[] = [
  { text: "70K", money: true },
  { text: "3 CLIENTS" },
  { text: "SHIPPED" },
  { text: "42K", money: true },
  { text: "3 MONTHS" },
  { text: "SOLD IRL" },
  { text: "2 DAYS" },
  { text: "FOR SALE" },
];
const MAX = 24;

export function PriceGun({ rootRef, u }: { rootRef: RefObject<HTMLDivElement | null>; u: number }) {
  const stage = useStage();
  const { active } = useWorld();
  const pointer = usePointer();
  const layer = useRef<HTMLDivElement>(null);
  const gun = useRef<HTMLDivElement>(null);
  const count = useRef(0);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const read = () => setFine(mq.matches && !stage.isMobile);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, [stage.isMobile]);

  useEffect(() => {
    const root = rootRef.current;
    const host = layer.current;
    if (!root || !host || !active) return;
    let down: { x: number; y: number; t: number; id: number } | null = null;

    const fire = (x: number, y: number) => {
      const i = count.current++;
      const fact = FACTS[i % FACTS.length];
      const el = document.createElement("div");
      const rot = (hash(i * 7 + 3) - 0.5) * 22;
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = [
        "position:absolute",
        `left:${x}px`,
        `top:${y}px`,
        "pointer-events:none",
        `padding:${(7 * u).toFixed(1)}px ${(11 * u).toFixed(1)}px ${(6 * u).toFixed(1)}px`,
        `border-radius:${(5 * u).toFixed(1)}px`,
        `background:${C.sun}`,
        `color:${C.ink}`,
        `box-shadow:0 0 0 ${(1.5 * u).toFixed(1)}px ${C.stickerEdge} inset, ${(3 * u).toFixed(1)}px ${(5 * u).toFixed(1)}px 0 rgba(27,26,23,.35)`,
        "font-family:var(--f-doto)",
        "font-weight:900",
        "font-variation-settings:'ROND' 100",
        `font-size:${(19 * u).toFixed(1)}px`,
        "line-height:1",
        "white-space:nowrap",
        "will-change:transform",
      ].join(";");
      el.innerHTML = fact.money ? `${rupeeMarkup()}${fact.text}` : fact.text;
      host.appendChild(el);
      const base = `translate(-50%, -50%) rotate(${rot.toFixed(1)}deg)`;
      el.animate(
        [
          { transform: `${base} scale(1.7)`, opacity: 0 },
          { transform: `${base} scale(0.92)`, opacity: 1, offset: 0.62 },
          { transform: `${base} scale(1)`, opacity: 1 },
        ],
        { duration: 320, easing: "cubic-bezier(.2,.9,.3,1)", fill: "forwards" },
      );
      el.dataset.base = base;
      // peel the oldest (anything beyond the cap that isn't already peeling)
      const live = Array.from(host.children).filter((c) => !(c as HTMLElement).dataset.peeling) as HTMLElement[];
      for (let k = 0; k < live.length - MAX; k++) {
        const old = live[k];
        old.dataset.peeling = "1";
        const t = old.dataset.base ?? "translate(-50%, -50%)";
        old
          .animate([{ transform: `${t} scale(1)`, opacity: 1 }, { transform: `${t} translate(10px, -18px) rotate(24deg) scale(0.6)`, opacity: 0 }], {
            duration: 420,
            easing: "cubic-bezier(.5,0,.75,0)",
            fill: "forwards",
          })
          .finished.then(() => old.remove())
          .catch(() => old.remove());
      }
      // gun recoil
      gun.current?.animate([{ rotate: "0deg" }, { rotate: "-16deg" }, { rotate: "0deg" }], { duration: 220, easing: "cubic-bezier(.2,.8,.3,1)" });
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    };
    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      if (!d || d.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 450) return;
      const sel = window.getSelection?.();
      if (sel && !sel.isCollapsed) return;
      const r = root.getBoundingClientRect();
      fire(e.clientX - r.left, e.clientY - r.top);
    };
    const onCancel = () => {
      down = null;
    };
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onCancel);
    return () => {
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
    };
  }, [active, rootRef, u]);

  const size = 64 * u;
  const gx = useTransform(pointer.x, (x) => x - GUN_HOTSPOT[0] * (size / 64));
  const gy = useTransform(pointer.y, (y) => y - GUN_HOTSPOT[1] * (size / 64));
  const show = useTransform(pointer.inside, (v) => (v > 0 && active ? 1 : 0));

  return (
    <>
      <div ref={layer} aria-hidden className="pointer-events-none absolute inset-0" style={{ zIndex: 40 }} />
      {fine && (
        <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0" style={{ x: gx, y: gy, opacity: show, zIndex: 60 }}>
          <div ref={gun} style={{ transformOrigin: `${(GUN_HOTSPOT[0] / 64) * 100}% ${(GUN_HOTSPOT[1] / 58) * 100}%` }}>
            <PriceGunSvg size={size} />
          </div>
        </motion.div>
      )}
    </>
  );
}
