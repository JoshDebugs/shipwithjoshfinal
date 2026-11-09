"use client";

/**
 * Nabla (a COLRv1 isometric block colour font) re-inked with Riso colours via
 * @font-palette-values. Browsers without COLRv1 (Safari today) would draw a
 * flat glyph, so we detect support once and fall back to a Silkscreen "16"
 * with a stacked block extrusion.
 */
import { useEffect, useState } from "react";
import { RISO, mix, overprint } from "@/components/life/multiverse/palette";

export const NABLA_PALETTE = "--mc-riso";

/** Nabla's 10 palette slots: 0/4/6 face, 5/7 face light, 8/9 highlights, 1 deep side, 2/3 sides. */
const OVERRIDES = [
  RISO.sun,
  overprint(RISO.cobalt, mix(RISO.paper, RISO.cobalt, 0.6)),
  RISO.pink,
  mix(RISO.pink, RISO.cobalt, 0.45),
  RISO.sun,
  mix(RISO.sun, RISO.paper, 0.5),
  RISO.sun,
  mix(RISO.sun, RISO.paper, 0.5),
  RISO.paper,
  RISO.paper,
];

let colrCache: boolean | null = null;

async function detectColr(family: string): Promise<boolean> {
  try {
    await document.fonts.load(`64px ${family}`, "16");
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 96;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.font = `64px ${family}`;
    ctx.fillStyle = "#000";
    ctx.textBaseline = "top";
    ctx.fillText("1", 10, 6);
    const d = ctx.getImageData(0, 0, 96, 96).data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 180 && (Math.abs(d[i] - d[i + 1]) > 40 || Math.abs(d[i + 1] - d[i + 2]) > 40)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Returns [family list, colour-font supported?, palette css]. */
export function useNabla(probe: React.RefObject<HTMLElement | null>) {
  const [state, setState] = useState<{ family: string; colr: boolean | null }>({ family: "", colr: colrCache });
  useEffect(() => {
    const el = probe.current;
    if (!el) return;
    const family = getComputedStyle(el).getPropertyValue("--f-nabla").trim();
    if (!family) {
      setState({ family: "", colr: false });
      return;
    }
    let alive = true;
    if (colrCache !== null) setState({ family, colr: colrCache });
    else
      detectColr(family).then((ok) => {
        colrCache = ok;
        if (alive) setState({ family, colr: ok });
      });
    return () => {
      alive = false;
    };
  }, [probe]);

  const first = state.family.split(",")[0]?.trim() ?? "";
  const css = first
    ? `@font-palette-values ${NABLA_PALETTE} { font-family: ${first}; override-colors: ${OVERRIDES.map((c, i) => `${i} ${c}`).join(", ")}; }`
    : "";
  return { family: state.family, colr: state.colr, css };
}

/** Silkscreen "16" with a stacked block extrusion — the no-COLRv1 stand-in. */
export function blockShadow(depth: number, a: string, b: string) {
  const out: string[] = [];
  for (let i = 1; i <= depth; i++) out.push(`${i}px ${i}px 0 ${i > depth * 0.6 ? b : a}`);
  return out.join(", ");
}
