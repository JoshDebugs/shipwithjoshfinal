/** DOM layout boxes (px) derived from the stage size — captions, LCD, ticker. */

export type Box = { x: number; y: number; w: number; h: number };

export type Frame = {
  mobile: boolean;
  /** Caption column (desktop: left column; phone: bottom block). */
  captions: Box;
  /** LCD timer (top-left). */
  lcd: { x: number; y: number; scale: number };
  /** Notation ticker strip. */
  ticker: Box;
  /** Halftone knock-out behind the captions: bleeds off the stage so paper reads as a column / band, never a card. */
  knockout: Box;
};

export function frame(w: number, h: number): Frame {
  const mobile = w < 768;
  if (mobile) {
    const top = Math.round(h * 0.7);
    return {
      mobile,
      captions: { x: 20, y: top, w: w - 40, h: h - top - 88 },
      lcd: { x: 16, y: 18, scale: 0.78 },
      ticker: { x: 0, y: Math.round(h * 0.648), w, h: 26 },
      knockout: { x: -120, y: Math.round(h * 0.648) - 36, w: w + 240, h: h },
    };
  }
  const colW = Math.min(500, Math.max(360, w * 0.34));
  return {
    mobile,
    captions: { x: Math.round(w * 0.045), y: Math.round(h * 0.2), w: colW, h: Math.round(h * 0.66) },
    lcd: { x: 28, y: 28, scale: 1 },
    ticker: { x: Math.round(w * 0.045), y: h - 70, w: Math.min(560, w * 0.42), h: 34 },
    knockout: { x: -120, y: -120, w: 120 + Math.round(w * 0.045) + colW + 70, h: h + 240 },
  };
}
