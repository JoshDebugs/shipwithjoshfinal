"use client";

/**
 * The live room. A corner of plaster, a desk, one lamp, one pile.
 *
 * The walls never sample a shadow map: each one evaluates its silhouette
 * directly from an analytic distance field, so the shadows stay razor-sharp at
 * any resolution and the whole room is a handful of draw calls.
 */

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import { hash, lerp } from "@/components/life/multiverse/ease";
import { RISO, mix } from "@/components/life/multiverse/palette";
import { R, type Rig } from "./rig";
import { buildBooks, type Book } from "./pile";
import { IIT_RECTS, JEE_RECTS, LAPTOP_RECTS, emptySlabs, glyphSlabs, iconSlabs, knots, placeKnots, writeSlabs, type Knot, type Slab } from "./shapes";
import { BOOK_FRAG, BOOK_VERT, CONE_FRAG, CONE_VERT, DESK_FRAG, DUST_FRAG, DUST_VERT, LAMP_FRAG, LAMP_VERT, WALL_VERT, wallFrag } from "./shaders";
import { roomAt, type RoomState } from "./timeline";

type Props = {
  progress: MotionValue<number>;
  rig: Rig;
  low: boolean;
  wobble: RefObject<number>;
};

/** Hackathons opens on browser-default white: the screen has to boot into exactly that. */
const NEXT_WORLD = new THREE.Color(1, 1, 1);
const CONE_LEN = 8;

export default function Scene({ progress, rig, low, wobble }: Props) {
  const slabCount = low ? 16 : 26;
  const dustCount = low ? 36 : 110;

  const shared = useMemo(
    () => ({
      uLamp: { value: new THREE.Vector3(3, 0.85, -1.5) },
      uAxis: { value: new THREE.Vector3(-1, 0.2, 0).normalize() },
      uPower: { value: 1 },
      uConeIn: { value: 0.94 },
      uConeOut: { value: 0.6 },
      uTime: { value: 0 },
      uRoom: { value: 1 },
      uCeil: { value: 99 },
      uIgnite: { value: 0 },
      uNext: { value: NEXT_WORLD },
      uScreen: { value: new THREE.Vector3(0, 3.2, -3.2) },
    }),
    [],
  );

  const makeWall = useMemo(
    () => (left: boolean) =>
      new THREE.ShaderMaterial({
        vertexShader: WALL_VERT,
        fragmentShader: wallFrag(slabCount),
        uniforms: {
          ...shared,
          uLeft: { value: left ? 1 : 0 },
          uLock: { value: 0 },
          uSoft: { value: 0 },
          uGlint: { value: 0 },
          uGlintX: { value: 0 },
          uShape: { value: left ? 0 : 2 },
          uAlpha: { value: 1 },
          uGain: { value: 1 },
          uWarp: { value: 0 },
          uPhase: { value: 0 },
          uWinA: { value: 0 },
          uShear: { value: new THREE.Vector2() },
          uBox: { value: new THREE.Vector4() },
          uWin: { value: new THREE.Vector4(...rig.win) },
          uSky: { value: new THREE.Color() },
          uS: { value: new Float32Array(slabCount * 4) },
          uR: { value: new Float32Array(slabCount * 2) },
        },
      }),
    [shared, slabCount, rig],
  );

  const leftMat = useMemo(() => makeWall(true), [makeWall]);
  const backMat = useMemo(() => makeWall(false), [makeWall]);
  const deskMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: WALL_VERT, fragmentShader: DESK_FRAG, uniforms: { ...shared } }),
    [shared],
  );
  const bookMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: BOOK_VERT, fragmentShader: BOOK_FRAG, uniforms: { ...shared } }),
    [shared],
  );
  const coneMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CONE_VERT,
        fragmentShader: CONE_FRAG,
        uniforms: { ...shared, uConeLen: { value: CONE_LEN }, uConeGain: { value: low ? 0.1 : 0.13 }, uPower: { value: 1 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
      }),
    [shared, low],
  );
  const dustMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        uniforms: { ...shared, uPower: { value: 1 }, uPx: { value: 16 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
      }),
    [shared],
  );

  const books = useMemo<Book[]>(() => buildBooks(low), [low]);
  const bookGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const colors = new Float32Array(books.length * 3);
    const sizes = new Float32Array(books.length * 3);
    books.forEach((b, i) => {
      colors.set(b.color, i * 3);
      sizes.set([b.w, b.h, b.d], i * 3);
    });
    g.setAttribute("aColor", new THREE.InstancedBufferAttribute(colors, 3));
    g.setAttribute("aSize", new THREE.InstancedBufferAttribute(sizes, 3));
    return g;
  }, [books]);

  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(dustCount * 3);
    const seeds = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = -2.6 + hash(i + 1.3) * 5.6;
      pos[i * 3 + 1] = hash(i + 7.7) * 5.2;
      pos[i * 3 + 2] = -2.6 + hash(i + 3.9) * 5.6;
      seeds[i] = hash(i + 11.1);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return g;
  }, [dustCount]);

  const coneGeo = useMemo(() => {
    const g = new THREE.ConeGeometry(3.6, CONE_LEN, 36, 1, true);
    g.translate(0, -CONE_LEN / 2, 0);
    return g;
  }, []);

  useEffect(
    () => () => {
      leftMat.dispose();
      backMat.dispose();
      deskMat.dispose();
      bookMat.dispose();
      coneMat.dispose();
      dustMat.dispose();
      bookGeo.dispose();
      dustGeo.dispose();
      coneGeo.dispose();
    },
    [leftMat, backMat, deskMat, bookMat, coneMat, dustMat, bookGeo, dustGeo, coneGeo],
  );

  const pileRef = useRef<THREE.InstancedMesh>(null);
  const lampRef = useRef<THREE.Group>(null);
  const coneRef = useRef<THREE.Mesh>(null);

  // Slab stores: target silhouettes are fixed per rig; tangles are re-placed per frame.
  const shapes = useMemo(() => {
    const k = rig.iit;
    const jee = glyphSlabs(JEE_RECTS, slabCount, rig.jee, 3);
    const iit = glyphSlabs(IIT_RECTS, slabCount, rig.iit, 11);
    const laptop = iconSlabs(LAPTOP_RECTS, slabCount, rig.laptop, 23);
    return {
      jee,
      iit,
      laptop,
      leftKnots: knots(slabCount, 5),
      backKnots: knots(slabCount, 9),
      backStart: knots(slabCount, 14),
      leftAway: knots(slabCount, 17),
      lC: emptySlabs(slabCount),
      lAway: emptySlabs(slabCount),
      bA: emptySlabs(slabCount),
      bC: emptySlabs(slabCount),
      cx: k.u0 + ((0.0349 + 0.9745) / 2) * k.sx,
    };
  }, [rig, slabCount]);

  const last = useRef({ p: -1, w: 0, rig: null as Rig | null, build: -1 });
  const frames = useRef(0);
  const stateRef = useRef<RoomState | undefined>(undefined);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const axisHelper = useMemo(() => new THREE.Vector3(), []);
  const lookHelper = useMemo(() => new THREE.Vector3(), []);
  const downHelper = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  const coneDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const t = state.clock.elapsedTime;
    shared.uTime.value = t;
    const hum = 1 + Math.sin(t * 31) * Math.sin(t * 13.7) * 0.012;

    const p = progress.get();
    const w = wobble.current ?? 0;
    const changed = p !== last.current.p || w !== last.current.w || rig !== last.current.rig;

    if (changed) {
      const st = roomAt(p, rig, w, stateRef.current);
      stateRef.current = st;
      applyRoom(st);
      last.current.p = p;
      last.current.w = w;
      last.current.rig = rig;
    }
    const st = stateRef.current;
    if (!st) return;
    shared.uPower.value = st.power * hum;
    (coneMat.uniforms.uPower as { value: number }).value = st.conePower * hum;
    (dustMat.uniforms.uPower as { value: number }).value = st.dustPower;
    (dustMat.uniforms.uPx as { value: number }).value = (state.size.height * state.viewport.dpr) / 36;

    // camera: horizontal, framed by lens shift
    const f = st.framing;
    cam.fov = 34;
    cam.aspect = state.size.width / state.size.height;
    cam.near = 0.1;
    cam.far = 70;
    cam.position.set(Math.cos(st.camAz) * f.D, f.yc, Math.sin(st.camAz) * f.D);
    cam.lookAt(0, f.yc, 0);
    cam.updateProjectionMatrix();
    cam.projectionMatrix.elements[8] = -f.sx;
    cam.projectionMatrix.elements[9] = -f.sy;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

    if (frames.current < 4 && ++frames.current === 4) state.gl.domElement.dataset.painted = "1";
  });

  function applyRoom(st: RoomState) {
    // lamp
    const lx = Math.cos(st.lampAz) * rig.lampR;
    const lz = Math.sin(st.lampAz) * rig.lampR;
    shared.uLamp.value.set(lx, rig.lampH, lz);
    shared.uRoom.value = st.room;
    shared.uIgnite.value = st.ignite;

    // the visible lamp is staged beside the pile, in profile, pointing at it
    const mx = Math.cos(st.modelAz) * st.modelR;
    const mz = Math.sin(st.modelAz) * st.modelR;
    const lamp = lampRef.current;
    if (lamp) {
      lamp.position.set(mx, rig.lampH * rig.model.scale, mz);
      lamp.rotation.y = -st.modelAz;
      lamp.scale.setScalar(rig.model.scale);
    }

    // light target slides along the walls as the arc swings
    const [au, av] = rig.poolA;
    const [bu, bv] = rig.poolB;
    const tA = lookHelper.set(-R, av, -au);
    const tx = lerp(tA.x, bu, st.s);
    const ty = lerp(av, bv, st.s);
    const tz = lerp(tA.z, -R, st.s);
    axisHelper.set(tx - lx, ty - rig.lampH, tz - lz).normalize();
    shared.uAxis.value.copy(axisHelper);
    shared.uConeIn.value = st.coneIn;
    shared.uConeOut.value = st.coneOut;
    shared.uCeil.value = st.ceil;

    // the beam leaves the shade the viewer can see
    const cone = coneRef.current;
    if (cone) {
      const mouth = 0.34 * rig.model.scale;
      const ox = mx - Math.cos(st.modelAz) * mouth;
      const oy = rig.lampH * rig.model.scale + 0.05;
      const oz = mz - Math.sin(st.modelAz) * mouth;
      cone.position.set(ox, oy, oz);
      coneDir.set(tx - ox, ty - oy, tz - oz).normalize();
      cone.quaternion.setFromUnitVectors(downHelper, coneDir);
    }

    shared.uScreen.value.set(rig.laptop.u + rig.laptop.size / 2, rig.laptop.top - rig.laptop.size * 0.34, -R + 0.3);

    updateLeftWall(st);
    updateBackWall(st);
    updatePile(st.build);
  }

  function updateLeftWall(st: RoomState) {
    const u = leftMat.uniforms;
    const s = shapes;
    u.uLock.value = st.lLock;
    u.uSoft.value = st.lSoft;
    u.uGlint.value = st.lGlint;
    u.uGlintX.value = st.lGlintX;
    u.uShape.value = st.lShape;
    u.uAlpha.value = st.lAlpha;
    u.uGain.value = st.lGain;
    u.uWarp.value = st.warp;
    u.uPhase.value = st.lS * 3.1;
    u.uWinA.value = st.winA;
    const box = st.lShape === 0 ? rig.jee : rig.iit;
    (u.uBox.value as THREE.Vector4).set(box.u0, box.v0, box.sx, box.sy);
    (u.uShear.value as THREE.Vector2).set(st.lShear, st.lSlide);
    (u.uSky.value as THREE.Color).set(st.sky);
    const b = st.build;

    if (st.lStage === 0) {
      placeKnots(s.lC, s.leftKnots as Knot[], s.cx, 0.1, lerp(rig.mobile ? 2.2 : 3.0, rig.mobile ? 4.2 : 7.0, b), lerp(1.2, 4.3, b), lerp(0.55, 1, b));
      writeSlabs(u.uS.value as Float32Array, u.uR.value as Float32Array, s.jee, s.lC, s.iit, st.lS, 1.1, st.lS * 9);
    } else {
      placeKnots(s.lC, s.leftKnots as Knot[], s.cx + 1.2, 0.05, rig.mobile ? 4.5 : 7.5, 4.8, 1);
      placeKnots(s.lAway, s.leftAway as Knot[], s.cx + 4.2, 0, 5.5, 3.6, 0.9);
      writeSlabs(u.uS.value as Float32Array, u.uR.value as Float32Array, s.iit, s.lC, s.lAway, st.lS, 0.8, st.s * 7);
    }
  }

  function updateBackWall(st: RoomState) {
    const u = backMat.uniforms;
    const s = shapes;
    u.uLock.value = st.bLock;
    u.uSoft.value = st.bSoft;
    u.uGlint.value = st.bGlint;
    u.uGlintX.value = st.bGlintX;
    u.uGain.value = st.bGain;
    u.uWarp.value = st.warp;
    u.uPhase.value = st.s * 3.7 + 5.;
    (u.uBox.value as THREE.Vector4).set(rig.laptop.u, rig.laptop.top, rig.laptop.size, 0);
    (u.uShear.value as THREE.Vector2).set(st.bShear, st.bSlide);
    const cx = rig.laptop.u + rig.laptop.size / 2;
    placeKnots(s.bA, s.backStart as Knot[], cx - 4.2, 0, 5.5, 3.2, 0.9);
    placeKnots(s.bC, s.backKnots as Knot[], cx - 0.2, 0.05, rig.mobile ? 4.2 : 7.2, rig.mobile ? 5.2 : 4.9, 1);
    writeSlabs(u.uS.value as Float32Array, u.uR.value as Float32Array, s.bA as Slab[], s.bC, s.laptop, st.bS, 0.8, st.s * 8);
  }

  function updatePile(build: number) {
    if (build === last.current.build) return;
    last.current.build = build;
    const mesh = pileRef.current;
    if (!mesh) return;
    for (let i = 0; i < books.length; i++) {
      const b = books[i];
      const t = b.delay < 0 ? 1 : Math.min(1, Math.max(0, (build - b.delay) / 0.11));
      const landed = t >= 1;
      // drop with one soft bounce
      const drop = landed ? 0 : t < 0.72 ? 1 - (t / 0.72) ** 2 : 0.09 * Math.sin(((t - 0.72) / 0.28) * Math.PI);
      const hidden = b.delay >= 0 && build < b.delay;
      dummy.position.set(b.x, b.y + drop * b.fall, b.z);
      const spin = landed ? 0 : (1 - t) * (1 - t) * (i % 2 === 0 ? 1 : -1) * 1.1;
      dummy.rotation.set(spin * 0.5, b.yaw + spin * 0.7, b.pitch + spin * 0.4);
      dummy.scale.set(b.w, b.h, b.d);
      if (hidden) dummy.scale.setScalar(0.0001);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return (
    <>
      <mesh material={leftMat} position={[-R, 6, 6]} rotation={[0, Math.PI / 2, 0]} frustumCulled={false}>
        <planeGeometry args={[18.4, 14]} />
      </mesh>
      <mesh material={backMat} position={[6, 6, -R]} frustumCulled={false}>
        <planeGeometry args={[18.4, 14]} />
      </mesh>
      <mesh material={deskMat} position={[6, 0, 6]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <planeGeometry args={[18.4, 18.4]} />
      </mesh>
      <instancedMesh ref={pileRef} args={[bookGeo, bookMat, books.length]} frustumCulled={false} />
      <LampModel ref={lampRef} power={shared.uPower} />
      <mesh ref={coneRef} geometry={coneGeo} material={coneMat} frustumCulled={false} />
      <points geometry={dustGeo} material={dustMat} frustumCulled={false} />
    </>
  );
}

/**
 * A balanced-arm desk lamp, drawn in local profile: the shade at the origin with
 * its mouth towards −x, the arm climbing away to a knuckle, the heavy base on the
 * desk. Everything is ink with a lit edge, so it holds against dark plaster too.
 */
const ARM = { base: [0.6, -0.8], knuckle: [1.02, 0.86], neck: [0.36, 0.2] } as const;

function strut(a: readonly [number, number], b: readonly [number, number]) {
  return {
    position: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0] as [number, number, number],
    rotation: [0, 0, Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2] as [number, number, number],
    length: Math.hypot(b[0] - a[0], b[1] - a[1]),
  };
}

function LampModel({ ref, power }: { ref: RefObject<THREE.Group | null>; power: { value: number } }) {
  const lower = strut(ARM.base, ARM.knuckle);
  const upper = strut(ARM.knuckle, ARM.neck);

  const shell = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: LAMP_VERT, fragmentShader: LAMP_FRAG, uniforms: { uPower: power } }),
    [power],
  );
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: RISO.sun, side: THREE.BackSide }), []);
  const hot = useMemo(() => new THREE.MeshBasicMaterial({ color: mix(RISO.paper, RISO.sun, 0.18) }), []);

  useEffect(
    () => () => {
      shell.dispose();
      glow.dispose();
      hot.dispose();
    },
    [shell, glow, hot],
  );

  return (
    <group ref={ref}>
      {/* base: a heavy disc with a raised boss */}
      <mesh material={shell} position={[ARM.base[0], -0.82, 0]}>
        <cylinderGeometry args={[0.36, 0.42, 0.075, 32]} />
      </mesh>
      <mesh material={shell} position={[ARM.base[0], -0.76, 0]}>
        <cylinderGeometry args={[0.09, 0.14, 0.09, 16]} />
      </mesh>
      {/* arm */}
      <mesh material={shell} position={lower.position} rotation={lower.rotation}>
        <cylinderGeometry args={[0.03, 0.036, lower.length, 10]} />
      </mesh>
      <mesh material={shell} position={upper.position} rotation={upper.rotation}>
        <cylinderGeometry args={[0.026, 0.03, upper.length, 10]} />
      </mesh>
      <mesh material={shell} position={[ARM.knuckle[0], ARM.knuckle[1], 0]}>
        <sphereGeometry args={[0.075, 18, 14]} />
      </mesh>
      {/* shade: mouth towards the pile, tipped up at the wall */}
      <group rotation={[0, 0, -0.2]}>
        <mesh material={shell} rotation={[0, 0, -Math.PI / 2]} position={[0.02, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.43, 0.56, 36, 1, true]} />
        </mesh>
        <mesh material={shell} rotation={[0, 0, -Math.PI / 2]} position={[0.36, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.13, 0.14, 24]} />
        </mesh>
        <mesh material={glow} rotation={[0, 0, -Math.PI / 2]} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.41, 0.53, 36, 1, true]} />
        </mesh>
        <mesh material={hot} position={[-0.1, 0, 0]}>
          <sphereGeometry args={[0.12, 20, 16]} />
        </mesh>
      </group>
    </group>
  );
}
