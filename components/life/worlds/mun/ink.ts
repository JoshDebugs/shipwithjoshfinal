import type { CSSProperties } from "react";

/**
 * Worn rubber: an feTurbulence mask that knocks mottled voids out of a stamp,
 * the way a real rubber stamp never inks evenly.
 */
const RUBBER_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='r'><feTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='2' seed='7'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.7 0 0 0 2.08'/></filter><rect width='100%' height='100%' filter='url(%23r)'/></svg>";

const RUBBER_URL = `url("data:image/svg+xml;utf8,${RUBBER_SVG}")`;

export const rubber = (seedShift = 0): CSSProperties => ({
  maskImage: RUBBER_URL,
  WebkitMaskImage: RUBBER_URL,
  maskSize: "260px 260px",
  WebkitMaskSize: "260px 260px",
  maskPosition: `${seedShift * 37}px ${seedShift * 53}px`,
  WebkitMaskPosition: `${seedShift * 37}px ${seedShift * 53}px`,
  maskRepeat: "repeat",
  WebkitMaskRepeat: "repeat",
});

/** Fraunces with its variable axes. */
export const fraunces = (wght: number, wonk = 0, soft = 0, opsz = 144): CSSProperties => ({
  fontFamily: "var(--f-fraunces)",
  fontWeight: wght,
  fontVariationSettings: `"wght" ${wght}, "WONK" ${wonk}, "SOFT" ${soft}, "opsz" ${opsz}`,
});

export const martian: CSSProperties = {
  fontFamily: "var(--f-martian)",
  fontVariationSettings: '"wdth" 100',
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

export const archivo = (wdth: number, wght = 800): CSSProperties => ({
  fontFamily: "var(--f-archivo)",
  fontWeight: wght,
  fontVariationSettings: `"wdth" ${wdth}, "wght" ${wght}`,
});
