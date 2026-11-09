import { PORTAL_ICONS, iconMaskUrl, type PortalIconId } from "./portalIcons";
import { easeInOutCubic, lerp, range } from "./ease";

/** Where a portal is born, in stage px. `size` is the icon box size at birth (0 = a point). */
export type PortalOrigin = { x: number; y: number; size: number };

export type PortalFrame = {
  /** Mask box size and position (px) for the incoming layer. */
  size: number;
  x: number;
  y: number;
  /** Current anchor point (px) — transform origin for the incoming layer. */
  ax: number;
  ay: number;
  /** Incoming layer rotation (deg) and inner counter-zoom. */
  rotate: number;
  innerScale: number;
  /** Outgoing layer scale (around the origin) and ink dim opacity. */
  outScale: number;
  dim: number;
};

/**
 * The smooth "v2" dive, as approved: a long ease-in-out growth with no flash.
 * The icon's largest inscribed circle grows until it covers the stage, while
 * its anchor drifts from the origin to the stage centre.
 */
export function portalFrame(t: number, icon: PortalIconId, origin: PortalOrigin, width: number, height: number): PortalFrame {
  const { anchor, inner } = PORTAL_ICONS[icon];
  const e = easeInOutCubic(t);
  const diag = Math.hypot(width, height);
  const cover = (diag / 2 / (inner / 100)) * 1.04;
  const size = lerp(origin.size, cover, e);
  const k = easeInOutCubic(range(t, 0.2, 1));
  const ax = lerp(origin.x, width / 2, k);
  const ay = lerp(origin.y, height / 2, k);
  return {
    size,
    x: ax - (size * anchor[0]) / 100,
    y: ay - (size * anchor[1]) / 100,
    ax,
    ay,
    rotate: (1 - e) * -6,
    innerScale: 1.18 - 0.18 * e,
    outScale: 1 + 0.12 * e,
    dim: 0.28 * e,
  };
}

/** Write a portal frame onto the DOM: mask on the incoming layer, depth on the outgoing one. */
export function applyPortalStyles(
  incoming: HTMLElement,
  inner: HTMLElement,
  outgoing: HTMLElement | null | undefined,
  dim: HTMLElement | null | undefined,
  icon: PortalIconId,
  f: PortalFrame,
  origin: PortalOrigin,
) {
  if (incoming.dataset.mask !== icon || !incoming.style.getPropertyValue("mask-image")) {
    const mask = iconMaskUrl(icon);
    incoming.style.setProperty("mask-image", mask);
    incoming.style.setProperty("-webkit-mask-image", mask);
    incoming.style.setProperty("mask-repeat", "no-repeat");
    incoming.style.setProperty("-webkit-mask-repeat", "no-repeat");
    incoming.dataset.mask = icon;
  }
  incoming.style.setProperty("mask-size", `${f.size}px ${f.size}px`);
  incoming.style.setProperty("-webkit-mask-size", `${f.size}px ${f.size}px`);
  incoming.style.setProperty("mask-position", `${f.x}px ${f.y}px`);
  incoming.style.setProperty("-webkit-mask-position", `${f.x}px ${f.y}px`);
  incoming.style.transformOrigin = `${f.ax}px ${f.ay}px`;
  incoming.style.transform = `rotate(${f.rotate}deg)`;
  inner.style.transformOrigin = `${f.ax}px ${f.ay}px`;
  inner.style.transform = `scale(${f.innerScale})`;
  if (outgoing) {
    outgoing.style.transformOrigin = `${origin.x}px ${origin.y}px`;
    outgoing.style.transform = `scale(${f.outScale})`;
  }
  if (dim) dim.style.opacity = String(f.dim);
}

/** Resolve a registered origin element into a PortalOrigin relative to the stage. */
export function readOrigin(el: HTMLElement | null, stage: HTMLElement, icon: PortalIconId, width: number, height: number): PortalOrigin {
  if (!el) return { x: width / 2, y: height / 2, size: 0 };
  const sr = stage.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.width > 0) {
    const [ax, ay] = PORTAL_ICONS[icon].anchor;
    return { x: r.left - sr.left + (r.width * ax) / 100, y: r.top - sr.top + (r.width * ay) / 100, size: r.width };
  }
  return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2, size: 0 };
}
