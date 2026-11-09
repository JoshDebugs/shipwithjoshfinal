/**
 * Per-frame DOM writes, deduplicated. The world writes ~60 properties a frame;
 * skipping unchanged values keeps style recalc to what actually moved.
 */
const styleCache = new WeakMap<Element, Map<string, string>>();
const attrCache = new WeakMap<Element, Map<string, string>>();

/** Set a CSS property (kebab-case) only if it changed. */
export function css(el: HTMLElement | SVGElement | null | undefined, prop: string, value: string) {
  if (!el) return;
  let m = styleCache.get(el);
  if (!m) {
    m = new Map();
    styleCache.set(el, m);
  }
  if (m.get(prop) === value) return;
  m.set(prop, value);
  el.style.setProperty(prop, value);
}

/** Set an attribute only if it changed. */
export function attr(el: Element | null | undefined, name: string, value: string) {
  if (!el) return;
  let m = attrCache.get(el);
  if (!m) {
    m = new Map();
    attrCache.set(el, m);
  }
  if (m.get(name) === value) return;
  m.set(name, value);
  el.setAttribute(name, value);
}

/**
 * Opacity + visibility together (hidden when ~0 so nothing invisible stays hit-testable or painted).
 * Shown = "inherit", never "visible": a descendant set to "visible" would punch through the film's
 * hidden layer while this world waits as the next one.
 */
export function fade(el: HTMLElement | SVGElement | null | undefined, o: number) {
  const v = o <= 0.002 ? 0 : o >= 0.998 ? 1 : o;
  css(el, "opacity", v.toFixed(3));
  css(el, "visibility", v === 0 ? "hidden" : "inherit");
}

/** Forget cached values (after React re-renders an element with fresh inline styles). */
export function forget(el: Element | null | undefined) {
  if (!el) return;
  styleCache.delete(el);
  attrCache.delete(el);
}

export const px = (n: number) => `${n.toFixed(2)}px`;
