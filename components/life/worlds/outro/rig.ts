/** One frame of state per scroll tick, shared by the WebGL scene and every DOM layer. */
import { docks, emptyFrame, poseAt, type CamFrame, type Docks } from "./camera";

export type RigListener = (p: number, f: CamFrame) => void;

export class Rig {
  p = 0;
  W = 1;
  H = 1;
  frame: CamFrame = emptyFrame();
  docks: Docks = docks(1, 1);
  /** Loupe in print coords (R = 0 when closed). */
  lens = { x: 0, y: 0, R: 0, mag: 2.8 };
  private subs = new Set<RigListener>();

  setSize(W: number, H: number) {
    this.W = Math.max(1, W);
    this.H = Math.max(1, H);
    this.docks = docks(this.W, this.H);
    this.setP(this.p);
  }

  setP(p: number) {
    this.p = p;
    poseAt(p, this.W, this.H, this.docks, this.frame);
    this.subs.forEach((fn) => fn(p, this.frame));
  }

  subscribe(fn: RigListener) {
    this.subs.add(fn);
    fn(this.p, this.frame);
    return () => {
      this.subs.delete(fn);
    };
  }
}
