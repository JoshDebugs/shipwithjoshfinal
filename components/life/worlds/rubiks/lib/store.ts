/**
 * Mutable state shared by the DOM layers and the WebGL scene (no React
 * renders per frame). Free play lives here: the visitor's moves are kept as
 * a list plus the state after each, so scrolling past the play zone can
 * unwind them exactly.
 */

import { applyMove, nameOf, solved, type Axis, type CubeState, type Move } from "./cube";

export type Drag = {
  axis: Axis;
  layer: number;
  /** Radians about +axis. */
  angle: number;
  /** Settling toward `to` after release. */
  settling: boolean;
  from: number;
  to: number;
  t: number;
};

export type Ring = { t0: number; color: string };

export type Store = {
  /** The WebGL scene has painted (the DOM poster may hand over). */
  ready: boolean;
  /** WebGL unavailable: the SVG fallback is showing. */
  fallback: boolean;
  moves: Move[];
  states: CubeState[];
  /** Fractional number of user moves currently shown (chases `target`). */
  applied: number;
  /** "Solve it" pressed: unwind to zero, then forget the moves. */
  solving: boolean;
  drag: Drag | null;
  /** Scene-provided picking (needs the camera). */
  pick: ((ndcX: number, ndcY: number) => boolean) | null;
  dragTo: ((dxPx: number, dyPx: number) => void) | null;
  release: (() => void) | null;
  /** Halftone shockwaves in flight. */
  rings: Ring[];
  /** Smoothed turn speed (moves / s) for the halftone swell. */
  speed: number;
  /** Bumped whenever the move list changes (DOM readouts poll it). */
  version: number;
  /** Time of the last lock (for the scale "settle"). */
  lockAt: number;
};

export function createStore(): Store {
  return {
    ready: false,
    fallback: false,
    moves: [],
    states: [solved()],
    applied: 0,
    solving: false,
    drag: null,
    pick: null,
    dragTo: null,
    release: null,
    rings: [],
    speed: 0,
    version: 0,
    lockAt: -10,
  };
}

export function pushMove(store: Store, axis: Axis, layer: number, q: number) {
  const m: Move = { axis, layers: [layer], q, name: nameOf(axis, layer, q) };
  store.moves.push(m);
  store.states.push(applyMove(store.states[store.states.length - 1], m));
  store.version++;
}

export function clearMoves(store: Store) {
  store.moves = [];
  store.states = [solved()];
  store.applied = 0;
  store.solving = false;
  store.version++;
}

/** Append a random scramble (no two consecutive turns on the same axis). */
export function randomScramble(store: Store, n = 10) {
  let last = store.moves.length ? store.moves[store.moves.length - 1].axis : -1;
  for (let i = 0; i < n; i++) {
    let axis = Math.floor(Math.random() * 3) as Axis;
    if (axis === last) axis = ((axis + 1 + Math.floor(Math.random() * 2)) % 3) as Axis;
    const layer = [-1, 1, -1, 1, 0][Math.floor(Math.random() * 5)];
    const q = [1, -1, 2][Math.floor(Math.random() * 3)];
    pushMove(store, axis, layer, q);
    last = axis;
  }
}
