/**
 * Eyelid wipes for text: an ink lash line draws across, then the block opens
 * from that line like an eye (clip-path from the middle). Saccadic timing — a
 * quick snap, then a hold — so each block is latched to a progress window and
 * snaps open/shut in ~250ms of real time instead of being half-scrubbed.
 */

import type { CSSProperties } from "react";
import { clamp, easeOutCubic } from "@/components/life/multiverse/ease";
import { RISO } from "@/components/life/multiverse/palette";

export type Lid = {
  body: HTMLElement | null;
  lash: HTMLElement | null;
  from: number;
  to: number;
  v: number;
  painted: number;
};

export class LidRegistry {
  lids = new Map<string, Lid>();

  ref(name: string, part: "body" | "lash", window: readonly [number, number]) {
    return (el: HTMLElement | null) => {
      let l = this.lids.get(name);
      if (!l) {
        l = { body: null, lash: null, from: window[0], to: window[1], v: -1, painted: -1 };
        this.lids.set(name, l);
      }
      l.from = window[0];
      l.to = window[1];
      l[part] = el;
    };
  }

  /** Jump every lid to its target (first paint, or after a long pause). */
  snap(p: number) {
    for (const l of this.lids.values()) {
      l.v = p >= l.from && p < l.to ? 1 : 0;
      paint(l);
    }
  }

  step(p: number, dt: number) {
    for (const l of this.lids.values()) {
      const target = p >= l.from && p < l.to ? 1 : 0;
      if (l.v < 0) l.v = target;
      else if (target > l.v) l.v = Math.min(1, l.v + dt / 0.26);
      else if (target < l.v) l.v = Math.max(0, l.v - dt / 0.19);
      paint(l);
    }
  }

  value(name: string) {
    return Math.max(0, this.lids.get(name)?.v ?? 0);
  }
}

function paint(l: Lid) {
  if (l.v === l.painted || !l.body) return;
  l.painted = l.v;
  const v = Math.max(0, l.v);
  const line = easeOutCubic(clamp(v / 0.3));
  const open = easeOutCubic(clamp((v - 0.3) / 0.7));
  const inset = ((1 - open) * 50).toFixed(2);
  l.body.style.clipPath = open >= 1 ? "none" : `inset(${inset}% -40% ${inset}% -40%)`;
  if (l.lash) {
    l.lash.style.transform = `scaleX(${line.toFixed(3)})`;
    l.lash.style.opacity = (1 - open).toFixed(3);
  }
}

export const CLOSED: CSSProperties = { clipPath: "inset(50% -40% 50% -40%)" };

export function lashStyle(px: number): CSSProperties {
  return {
    position: "absolute",
    left: "-2%",
    right: "-2%",
    top: "50%",
    height: px,
    marginTop: -px / 2,
    background: RISO.ink,
    borderRadius: px,
    transform: "scaleX(0)",
    opacity: 0,
    pointerEvents: "none",
  };
}

export const FONT = {
  anybody: "var(--f-anybody)",
  bagel: "var(--f-bagel)",
  mono: "var(--f-plex-mono)",
} as const;

/** Vinyl-sticker type: paper fill, ink outline, hard ink offset (no blur). */
export function sticker(sizePx: number, stroke = 0.075, shadow = 0.07): CSSProperties {
  const s = Math.max(2, Math.round(stroke * sizePx * 10) / 10);
  const o = Math.max(2, Math.round(shadow * sizePx));
  return {
    color: RISO.paper,
    WebkitTextStroke: `${s}px ${RISO.ink}`,
    paintOrder: "stroke fill",
    textShadow: `${o}px ${Math.round(o * 1.1)}px 0 ${RISO.ink}`,
  };
}

export function monoLabel(sizePx: number): CSSProperties {
  return {
    fontFamily: FONT.mono,
    fontWeight: 500,
    fontSize: sizePx,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: RISO.ink,
    lineHeight: 1.3,
  };
}

export const axes = (wdth: number, wght: number) => `'wdth' ${wdth.toFixed(1)}, 'wght' ${wght.toFixed(0)}`;
