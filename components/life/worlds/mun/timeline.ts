/**
 * The MUN world's beat sheet: every choreography window in progress units.
 * progress 0 = title card ("ORDER."), 1 = clean exit frame (string-art house).
 *
 *  0.00  ORDER.                 title card, gavel on the full stop
 *  0.04  the position paper     slides in, POSITION PAPER stamp
 *  0.11  typewriter             COMMITTEE / COUNTRY / TOPIC slammed black
 *  0.24  the camera rises       the paper shrinks onto Josh's desk at the edge of the hall
 *  0.33  the room as it is      every gaze thread on the opponent's pink podium
 *  0.40  three speeches         the room turns in three ripples (hero)
 *  0.65  over the shoulder      camera drops behind Josh's card
 *  0.78  the gavel              web twangs, the seal slams, MULTIPLE CONFERENCES burst
 *  0.86  exit                   threads re-aim and stitch the house, its door goes ink
 */

import { clamp, easeInOutCubic, easeInOutSine, range } from "@/components/life/multiverse/ease";

export const B = {
  titleOut: [0.026, 0.07] as const,
  paperIn: [0.036, 0.098] as const,
  paperStamp: [0.094, 0.104] as const,
  typing: [0.108, 0.214] as const,
  weakMark: [0.214, 0.232] as const,
  rise: [0.238, 0.336] as const,
  hallIntro: [0.326, 0.392] as const,
  waves: [
    [0.398, 0.468],
    [0.482, 0.552],
    [0.566, 0.636],
  ] as const,
  drop: [0.646, 0.742] as const,
  won: [0.71, 0.79] as const,
  gavel: 0.782,
  balloon: [0.77, 0.792] as const,
  seal: [0.782, 0.796] as const,
  burst: [0.8, 0.838] as const,
  learned: [0.812, 0.948] as const,
  exitCam: [0.858, 0.972] as const,
  stitch: [0.872, 0.962] as const,
  fill: [0.93, 0.99] as const,
};

/** Local progress of speech wave g (0..2), eased. */
export function waveLocal(p: number, g: number): number {
  const [a, b] = B.waves[g];
  return easeInOutSine(range(p, a, b));
}

/** 0 → 1 across all three waves (how much of the room has been argued round). */
export function roomTurn(p: number): number {
  return (waveLocal(p, 0) + waveLocal(p, 1) + waveLocal(p, 2)) / 3;
}

/** Fraunces weight for the oratory: 100 → 300 → 600 → 900 as the room turns. */
export function oratoryWeight(p: number): number {
  return 100 + 200 * waveLocal(p, 0) + 300 * waveLocal(p, 1) + 300 * waveLocal(p, 2);
}

/** Camera rise (paper → hall), 0..1 eased. */
export const riseT = (p: number) => easeInOutCubic(range(p, B.rise[0], B.rise[1]));
/** Camera drop (plan → over the shoulder), 0..1 eased. */
export const dropT = (p: number) => easeInOutCubic(range(p, B.drop[0], B.drop[1]));
/** Exit tilt, 0..1 eased. */
export const exitT = (p: number) => easeInOutCubic(range(p, B.exitCam[0], B.exitCam[1]));

/** Opacity window helper: fade in over [a, a+fi], out over [b-fo, b]. */
export function windowed(p: number, a: number, b: number, fi = 0.012, fo = 0.012): number {
  if (p <= a || p >= b) return 0;
  return clamp(Math.min((p - a) / fi, (b - p) / fo));
}
