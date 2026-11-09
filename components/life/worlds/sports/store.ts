/**
 * Mutable state shared by the 2D conductor (rink canvas) and the R3F medal.
 * Written every frame by the conductor; read by the medal's useFrame. Never
 * React state — nothing here re-renders anything.
 */
import { makeFace2D, makeFaceSet, type Face2D, type FaceSet } from "./medalArt";
import { makePose, type Pose } from "./timeline";

export type SportsStore = {
  /** Per-lap stride wobble, recorded as the comet enters each lap. */
  eps: Float32Array;
  epsVersion: number;
  front: FaceSet;
  back: FaceSet;
  front2D: Face2D;
  back2D: Face2D;
  /** Key the obverse was last built for (layout + eps + fonts). */
  frontKey: string;
  backKey: string;
  pose: Pose;
  /** Smoothed pointer / scroll tilt (radians) and the time (s). */
  tilt: { x: number; y: number };
  time: number;
  /** Set by the R3F medal: mounted, compiled, and which face versions it has uploaded. */
  gl3d: { alive: boolean; ready: boolean; frontSeen: number; backSeen: number };
  serif: string;
  mono: string;
  fontsReady: boolean;
};

export function createStore(N: number, epsBase: number, use3D: boolean, mobile: boolean): SportsStore {
  const size = use3D ? 1024 : mobile ? 640 : 1024;
  const eps = new Float32Array(N).fill(epsBase);
  return {
    eps,
    epsVersion: 0,
    front: makeFaceSet(size, use3D ? 2048 : size),
    back: makeFaceSet(size, use3D ? 1024 : size),
    front2D: makeFace2D(use3D ? 512 : size),
    back2D: makeFace2D(use3D ? 512 : size),
    frontKey: "",
    backKey: "",
    pose: makePose(),
    tilt: { x: 0, y: 0 },
    time: 0,
    gl3d: { alive: false, ready: false, frontSeen: -1, backSeen: -1 },
    serif: "serif",
    mono: "monospace",
    fontsReady: false,
  };
}
