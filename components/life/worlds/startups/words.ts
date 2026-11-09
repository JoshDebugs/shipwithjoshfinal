/**
 * Overprint words and their measured widths (Anybody 900, letter-spacing
 * −0.01em), in em, at font-stretch 50 / 78 / 100 / 136 / 150 %. Measured once
 * in the browser so every word can be sized to the stage exactly.
 */
import { lerp } from "@/components/life/multiverse/ease";

const STOPS = [50, 78, 100, 136, 150] as const;

const EM: Record<string, readonly number[]> = {
  "YOU WANTED": [3.508, 5.525, 7.109, 9.706, 10.716],
  "RECEIPTS?": [2.794, 4.445, 5.743, 7.869, 8.696],
  "SHIPPED.": [2.41, 3.735, 4.776, 6.482, 7.145],
  "SOLD IRL.": [2.385, 3.758, 4.837, 6.606, 7.294],
  "FOR SALE.": [2.453, 3.953, 5.133, 7.065, 7.817],
  "VISIT AGAIN.": [3.402, 5.279, 6.755, 9.173, 10.114],
};

/** Width of `text` in em at font-stretch `st` (falls back to a per-char estimate). */
export function wordEm(text: string, st: number): number {
  const row = EM[text];
  if (!row) return text.length * lerp(0.32, 0.9, (st - 50) / 100);
  for (let i = 1; i < STOPS.length; i++) {
    if (st <= STOPS[i]) return lerp(row[i - 1], row[i], (st - STOPS[i - 1]) / (STOPS[i] - STOPS[i - 1]));
  }
  return row[row.length - 1];
}
