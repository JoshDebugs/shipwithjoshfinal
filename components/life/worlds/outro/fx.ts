/** DOM helpers for scroll-driven writes: nothing here triggers a React render. */
import { hash } from "@/components/life/multiverse/ease";

type Styled = HTMLElement | SVGElement;

/** Opacity + visibility (hidden layers stop being painted, hit-tested or read). */
export function fade(el: Styled | null | undefined, o: number) {
  if (!el) return;
  const on = o > 0.004;
  el.style.visibility = on ? "visible" : "hidden";
  if (on) el.style.opacity = o > 0.996 ? "1" : o.toFixed(3);
}

/** A transform that only touches the DOM while the element is showing. */
export function place(el: Styled | null | undefined, o: number, transform: string) {
  if (!el) return;
  fade(el, o);
  if (o > 0.004) el.style.transform = transform;
}

/**
 * Wrap a rig listener so it only runs while p is inside [a, b], plus once on
 * the way out to leave its elements in their settled (hidden) state.
 */
export function windowed<F>(a: number, b: number, draw: (p: number, f: F) => void) {
  let idle = false;
  return (p: number, f: F) => {
    if (p >= a && p <= b) {
      idle = false;
      draw(p, f);
    } else if (!idle) {
      idle = true;
      draw(p, f);
    }
  };
}

const GLYPHS = "▓▒░#/\\+=:-_01";

/**
 * Forensic type-on: characters left of `t` are final, a short band after them
 * is noise, the rest is blank. Deterministic for a given `tick`.
 */
export function decoded(text: string, t: number, tick: number): string {
  const n = text.length;
  if (t >= 1) return text;
  if (t <= 0) return "";
  const head = t * (n + 5);
  let s = "";
  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (i < head - 5 || ch === " ") s += i < head ? ch : " ";
    else if (i < head) s += GLYPHS[Math.floor(hash(i * 13 + tick) * GLYPHS.length)];
    else s += " ";
  }
  return s;
}
