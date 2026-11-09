/**
 * Camera rig. Positions and look targets ride centripetal Catmull-Rom curves
 * through the keys; the key parameter comes from `camParam` (plateau eased),
 * so integer parameters are the exact vantage poses the words are built from.
 */
import { CatmullRomCurve3, Matrix4, Quaternion, Vector3 } from "three";
import { KEYS, type CamKey, type V3 } from "./beats";

const UP = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);

/** Portrait screens need a taller vertical FOV to keep a usable horizontal one. */
function keyFov(k: CamKey, portrait: boolean) {
  return portrait ? (k.pFov ?? k.fov * 1.5) : k.fov;
}

export class Rig {
  readonly portrait: boolean;
  private curveP: CatmullRomCurve3;
  private curveL: CatmullRomCurve3;
  private fovs: number[];
  private keyIdx: number[];
  private last: number;
  private rolls: number[];
  private m = new Matrix4();
  private look = new Vector3();
  private rollQ = new Quaternion();

  constructor(portrait: boolean) {
    this.portrait = portrait;
    const v = (a: V3) => new Vector3(a[0], a[1], a[2]);
    // keys plus their fly-through waypoints; keyIdx[i] = where key i sits on the curve
    const ps: Vector3[] = [];
    const ls: Vector3[] = [];
    this.keyIdx = [];
    KEYS.forEach((k, i) => {
      this.keyIdx.push(ps.length);
      ps.push(v(portrait && k.pPos ? k.pPos : k.pos));
      ls.push(v(portrait && k.pLook ? k.pLook : k.look));
      if (i < KEYS.length - 1)
        for (const w of k.via ?? []) {
          ps.push(v(portrait && w.pPos ? w.pPos : w.pos));
          ls.push(v(portrait && w.pLook ? w.pLook : w.look));
        }
    });
    this.last = ps.length - 1;
    this.curveP = new CatmullRomCurve3(ps, false, "centripetal");
    this.curveL = new CatmullRomCurve3(ls, false, "centripetal");
    this.fovs = KEYS.map((k) => keyFov(k, portrait));
    this.rolls = KEYS.map((k) => k.roll);
  }

  /** Write the pose at key parameter `s` into pos/quat; returns the vertical FOV (deg). */
  pose(s: number, pos: Vector3, quat: Quaternion, lookOut?: Vector3): number {
    const n = KEYS.length;
    const sc = Math.max(0, Math.min(n - 1, s));
    const i = Math.min(n - 2, Math.floor(sc));
    const f = sc - i;
    if (f === 0 || sc === n - 1) {
      // exact key — avoid curve rounding so the anamorphic words land on the pixel
      const k = KEYS[Math.round(sc)];
      const kp = this.portrait && k.pPos ? k.pPos : k.pos;
      const kl = this.portrait && k.pLook ? k.pLook : k.look;
      pos.set(kp[0], kp[1], kp[2]);
      this.look.set(kl[0], kl[1], kl[2]);
    } else {
      // getPoint(t) is point-index parameterised, so integer indices land on the control points
      const u = (this.keyIdx[i] + f * (this.keyIdx[i + 1] - this.keyIdx[i])) / this.last;
      this.curveP.getPoint(u, pos);
      this.curveL.getPoint(u, this.look);
    }
    if (lookOut) lookOut.copy(this.look);
    const roll = this.rolls[i] + (this.rolls[i + 1] - this.rolls[i]) * f;
    this.m.lookAt(pos, this.look, UP);
    quat.setFromRotationMatrix(this.m);
    this.rollQ.setFromAxisAngle(Z, roll);
    quat.multiply(this.rollQ);
    return this.fovs[i] + (this.fovs[i + 1] - this.fovs[i]) * f;
  }
}
