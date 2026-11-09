"use client";

/**
 * The live dimension: dithered Riso sky, the voxel island, the storm of
 * anamorphic word cubes, clouds, a tumbling cube-sun, a waterfall, and the
 * blocks that build themselves (bed defense, bridge). Only the camera moves
 * with scroll; every word cube is static and locks from exactly one pose.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
} from "three";
import type { MotionValue } from "framer-motion";
import { clamp, range } from "@/components/life/multiverse/ease";
import { KEYS, RECEIPT_ID, WORDS, camParam } from "./beats";
import { GRADES, LAND, LOCKS, SKY_ELEV, STORM, rgb, type RGB } from "./colors";
import { buildStorm, type Storm } from "./gen";
import { MATS, buildIsland, buildReactions } from "./island";
import { Rig } from "./rig";
import { CLOUD_VERT, FLAT_FRAG, ISLAND_VERT, REACT_VERT, SKY_FRAG, SKY_VERT, STORM_VERT, SUN_VERT, WATER_VERT } from "./shaders";

const SUN_POS = new Vector3(44, 15, -175);
const v3 = (c: RGB) => new Vector3(c[0], c[1], c[2]);
const smooth = (t: number) => t * t * (3 - 2 * t);

const GRADE_RGB = GRADES.map((g) => ({ stops: g.stops.map(rgb), fog: rgb(g.fog) }));
const WORD_KEY = [...WORDS.map((w) => w.key), KEYS.length - 1];

type Props = { progress: MotionValue<number>; lowPower: boolean };

export default function Scene({ progress, lowPower }: Props) {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const gl = useThree((s) => s.gl);

  // regenerate the anamorphic storm when the stage changes shape (debounced)
  const [dims, setDims] = useState({ w: size.width, h: size.height });
  useEffect(() => {
    if (dims.w === size.width && dims.h === size.height) return;
    const id = window.setTimeout(() => setDims({ w: size.width, h: size.height }), 160);
    return () => window.clearTimeout(id);
  }, [size.width, size.height, dims.w, dims.h]);

  const island = useMemo(() => buildIsland(), []);
  const storm = useMemo<Storm>(
    () => buildStorm(Math.max(1, dims.w), Math.max(1, dims.h), { lowPower, occluders: island.occluders }),
    [dims.w, dims.h, lowPower, island],
  );
  const portrait = dims.w < dims.h;
  const rig = useMemo(() => new Rig(portrait), [portrait]);

  /* ------------------------------------------------------- shared uniforms */
  const fog = useMemo(() => ({ uFog: { value: new Vector3() }, uFogRange: { value: new Vector2(34, 120) }, uFogMax: { value: 0.42 } }), []);

  /* -------------------------------------------------------------------- sky */
  const sky = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: BackSide,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uStops: { value: GRADE_RGB[0].stops.map(v3) },
        uStopsB: { value: GRADE_RGB[0].stops.map(v3) },
        uMix: { value: 0 },
        uElev: { value: SKY_ELEV.slice() },
        uSunDir: { value: new Vector3(SUN_POS.x, 0, SUN_POS.z).normalize() },
        uSunTrue: { value: SUN_POS.clone().normalize() },
        uHalo: { value: v3(rgb(LAND.sunHalo)) },
        uCore: { value: v3(rgb(LAND.sunCore)) },
        uCell: { value: 3 },
        uGlow: { value: 1 },
      },
    });
    const mesh = new Mesh(new SphereGeometry(600, 48, 24), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -10;
    return mesh;
  }, []);

  /* ----------------------------------------------------------------- island */
  const islandMesh = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(island.positions, 3));
    g.setAttribute("aCol", new BufferAttribute(island.colors, 3));
    const mat = new ShaderMaterial({ vertexShader: ISLAND_VERT, fragmentShader: FLAT_FRAG, uniforms: { ...fog } });
    const mesh = new Mesh(g, mat);
    mesh.frustumCulled = false;
    return mesh;
  }, [island, fog]);

  /* --------------------------------------------------------- storm + words */
  const box = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const stormMat = useMemo(() => {
    const L = (k: keyof (typeof LOCKS)[number]) => LOCKS.map((l) => v3(rgb(l[k] as string)));
    return new ShaderMaterial({
      vertexShader: STORM_VERT,
      fragmentShader: FLAT_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSettle: { value: new Array(7).fill(0) },
        uLock: { value: new Array(7).fill(0) },
        uPulse: { value: new Array(7).fill(0) },
        uTremble: { value: new Array(7).fill(0) },
        uLockAny: { value: 0 },
        uSTop: { value: STORM.map((f) => v3(rgb(f.top))) },
        uSBase: { value: STORM.map((f) => v3(rgb(f.base))) },
        uSShade: { value: STORM.map((f) => v3(rgb(f.shade))) },
        uSDark: { value: STORM.map((f) => v3(rgb(f.dark))) },
        uLFront: { value: L("front") },
        uLTop: { value: L("top") },
        uLSide: { value: L("side") },
        uLDark: { value: L("dark") },
        ...fog,
      },
    });
  }, [fog]);

  const stormMesh = useMemo(() => {
    const geo = box.clone();
    geo.setAttribute("aInk", new InstancedBufferAttribute(storm.ink, 1));
    geo.setAttribute("aWord", new InstancedBufferAttribute(storm.word, 1));
    geo.setAttribute("aSeed", new InstancedBufferAttribute(storm.seed, 1));
    geo.setAttribute("aK", new InstancedBufferAttribute(storm.kfac, 1));
    const mesh = new InstancedMesh(geo, stormMat, storm.count);
    mesh.instanceMatrix.array.set(storm.matrices);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
  }, [storm, stormMat, box]);

  /* -------------------------------------------- reactions: dome + bridge */
  const reactMesh = useMemo(() => {
    const cells = buildReactions(KEYS[1].dwell[0] + 0.004, KEYS[1].dwell[1] - 0.012, KEYS[2].dwell[0] + 0.002, KEYS[2].dwell[1] - 0.01);
    const order = ["wool", "glass", "brick", "pillow"] as const;
    const geo = box.clone();
    geo.setAttribute("aMat", new InstancedBufferAttribute(new Float32Array(cells.map((c) => Math.max(0, order.indexOf(c.mat as (typeof order)[number])))), 1));
    geo.setAttribute("aT", new InstancedBufferAttribute(new Float32Array(cells.map((c) => c.t)), 1));
    const T = (k: "top" | "base" | "shade" | "dark") => order.map((id) => v3(MATS[id][k]));
    const mat = new ShaderMaterial({
      vertexShader: REACT_VERT,
      fragmentShader: FLAT_FRAG,
      uniforms: { uP: { value: 0 }, uTop: { value: T("top") }, uBase: { value: T("base") }, uShade: { value: T("shade") }, uDark: { value: T("dark") }, ...fog },
    });
    const mesh = new InstancedMesh(geo, mat, cells.length);
    const m = new Matrix4();
    cells.forEach((c, i) => mesh.setMatrixAt(i, m.makeTranslation(c.p[0], c.p[1], c.p[2])));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
  }, [box, fog]);

  /* -------------------------------------------------------------- waterfall */
  const waterMesh = useMemo(() => {
    const n = lowPower ? 26 : 60;
    const geo = box.clone();
    const seeds = new Float32Array(n).map((_, i) => (i + 0.5) / n);
    geo.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 1));
    const mat = new ShaderMaterial({
      vertexShader: WATER_VERT,
      fragmentShader: FLAT_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uOrigin: { value: new Vector3(island.fall[0], 0.2, island.fall[2] + 0.5) },
        uWater: { value: v3(rgb(LAND.water)) },
        uWaterTop: { value: v3(rgb(LAND.waterTop)) },
        uFoam: { value: v3(rgb(LAND.foam)) },
        ...fog,
      },
    });
    const mesh = new InstancedMesh(geo, mat, n);
    mesh.frustumCulled = false;
    return mesh;
  }, [box, fog, island, lowPower]);

  /* ----------------------------------------------------------------- clouds */
  const cloudMesh = useMemo(() => {
    const n = storm.clouds.length;
    const geo = box.clone();
    geo.setAttribute("aSeed", new InstancedBufferAttribute(new Float32Array(storm.clouds.map((c) => c.seed)), 1));
    const mat = new ShaderMaterial({
      vertexShader: CLOUD_VERT,
      fragmentShader: FLAT_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uTop: { value: v3(rgb(LAND.cloudTop)) },
        uSide: { value: v3(rgb(LAND.cloudSide)) },
        uBottom: { value: v3(rgb(LAND.cloudBottom)) },
        uDim: { value: 0 },
        ...fog,
      },
    });
    const mesh = new InstancedMesh(geo, mat, Math.max(1, n));
    const m = new Matrix4();
    const q = new Quaternion();
    const pv = new Vector3();
    const sv = new Vector3();
    storm.clouds.forEach((c, i) => mesh.setMatrixAt(i, m.compose(pv.set(...c.p), q, sv.set(...c.s))));
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return mesh;
  }, [storm, box, fog]);

  /* -------------------------------------------------------------------- sun */
  const sun = useMemo(() => {
    const mat = new ShaderMaterial({
      vertexShader: SUN_VERT,
      fragmentShader: FLAT_FRAG,
      uniforms: { uTop: { value: v3(rgb(LAND.sunTop)) }, uBase: { value: v3(rgb(LAND.sunFace)) }, uSide: { value: v3(rgb(LAND.sunSide)) } },
    });
    const mesh = new Mesh(box, mat);
    mesh.position.copy(SUN_POS);
    mesh.scale.setScalar(24);
    mesh.frustumCulled = false;
    return mesh;
  }, [box]);

  // dispose what we created
  useEffect(() => () => {
    stormMesh.geometry.dispose();
    stormMesh.dispose();
  }, [stormMesh]);
  useEffect(() => () => {
    cloudMesh.geometry.dispose();
    (cloudMesh.material as ShaderMaterial).dispose();
    cloudMesh.dispose();
  }, [cloudMesh]);
  useEffect(
    () => () => {
      for (const m of [islandMesh, reactMesh, waterMesh, sky, sun]) {
        if (m !== sun) m.geometry.dispose();
        (m.material as ShaderMaterial).dispose();
      }
      stormMat.dispose();
      box.dispose();
    },
    [islandMesh, reactMesh, waterMesh, sky, sun, stormMat, box],
  );

  /* ------------------------------------------------------------- per frame */
  const hit = useRef<number[]>(new Array(KEYS.length).fill(-10));
  const atKeyPrev = useRef<number>(-1);
  const look = useMemo(() => new Vector3(), []);
  const tremblePx = portrait ? 2.2 : 2.8;

  const frames = useRef(0);

  // warm up while we're only "next" (frameloop paused): compile shaders and paint a
  // few frames so the title card is ready the moment the portal opens
  const advance = useThree((s) => s.advance);
  const frameloop = useThree((s) => s.frameloop);
  useEffect(() => {
    if (frameloop !== "never") return;
    let n = 0;
    let id = 0;
    const step = (ts: number) => {
      advance(ts);
      if (++n < 5) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [frameloop, advance, stormMesh]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (frames.current < 4 && ++frames.current === 4) {
      const host = gl.domElement.parentElement?.parentElement;
      if (host) host.style.opacity = "1";
    }
    const p = progress.get();
    const s = camParam(p);
    const fov = rig.pose(s, camera.position, camera.quaternion, look);

    // lock arrival → a pulse (time based, so it plays out even if you stop scrolling)
    const atKey = Number.isInteger(s) ? s : -1;
    if (atKey !== atKeyPrev.current) {
      if (atKey >= 0) hit.current[atKey] = t;
      atKeyPrev.current = atKey;
    }
    const pulseOf = (k: number) => {
      const e = (t - hit.current[k]) / 0.32;
      return e >= 0 && e <= 1 ? Math.sin(Math.PI * e) : 0;
    };

    // camera: the MONTAGES lock gets an edit-style zoom punch (pure FOV change keeps the word aligned)
    const punch = pulseOf(3) * (atKey === 3 ? 1 : 0);
    const tanY = Math.tan((fov * Math.PI) / 360) / (1 + 0.06 * punch);
    camera.fov = (Math.atan(tanY) * 360) / Math.PI;
    camera.near = 0.5;
    camera.far = 1400;
    camera.updateProjectionMatrix();

    // handheld breathing, only while flying (it would smear a lock)
    const dist = Math.abs(s - Math.round(s));
    const breathe = smooth(clamp(dist / 0.25));
    if (breathe > 0) {
      camera.position.x += Math.sin(t * 0.7) * 0.18 * breathe;
      camera.position.y += Math.sin(t * 0.53 + 1.3) * 0.14 * breathe;
    }

    // sky follows the camera; grade blends between keys
    sky.position.copy(camera.position);
    const su = (sky.material as ShaderMaterial).uniforms;
    (su.uSunTrue.value as Vector3).copy(SUN_POS).sub(camera.position).normalize();
    const i = Math.min(KEYS.length - 2, Math.floor(s));
    const f = smooth(s - i);
    const ga = GRADE_RGB[i];
    const gb = GRADE_RGB[i + 1];
    const stopsA = su.uStops.value as Vector3[];
    const stopsB = su.uStopsB.value as Vector3[];
    for (let k = 0; k < stopsA.length; k++) {
      stopsA[k].set(ga.stops[k][0], ga.stops[k][1], ga.stops[k][2]);
      stopsB[k].set(gb.stops[k][0], gb.stops[k][1], gb.stops[k][2]);
    }
    // the re-print happens mid-flight, so the screen pattern between two grades is brief
    su.uMix.value = smooth(clamp((s - i - 0.28) / 0.44));
    su.uCell.value = Math.max(2, Math.round(3 * gl.getPixelRatio()));
    fog.uFog.value.set(ga.fog[0] + (gb.fog[0] - ga.fog[0]) * f, ga.fog[1] + (gb.fog[1] - ga.fog[1]) * f, ga.fog[2] + (gb.fog[2] - ga.fog[2]) * f);

    // words: settle (wobble → 0), lock (colour), pulse, tremble
    const u = stormMat.uniforms;
    const settle = u.uSettle.value as number[];
    const lock = u.uLock.value as number[];
    const pulse = u.uPulse.value as number[];
    const trem = u.uTremble.value as number[];
    let any = 0;
    for (let w = 0; w < 7; w++) {
      const kk = WORD_KEY[w];
      const d = Math.abs(s - kk);
      settle[w] = 1 - smooth(clamp(d / 0.2));
      lock[w] = 1 - smooth(clamp(d / 0.42));
      pulse[w] = pulseOf(kk);
      trem[w] = 0;
      any = Math.max(any, settle[w]);
    }
    // ALMOST never fully locks: it keeps a nervous jitter in its own picture plane
    const cell = storm.cellPx[4] ?? 20;
    trem[4] = (tremblePx / (0.9 * cell)) * (0.35 + 0.65 * settle[4]);
    u.uLockAny.value = any;
    u.uTime.value = t;

    // set dressing
    (reactMesh.material as ShaderMaterial).uniforms.uP.value = p;
    (waterMesh.material as ShaderMaterial).uniforms.uTime.value = t;
    const cu = (cloudMesh.material as ShaderMaterial).uniforms;
    cu.uTime.value = t;
    cu.uDim.value = 0.5 * (1 - smooth(clamp(Math.abs(s - 5) / 0.6)));
    sun.rotation.set(0.42 + t * 0.03, t * 0.05, 0.3);

    // the storm thins as we reach the exit, leaving the receipt clean
    const exit = range(p, 0.9, 0.99);
    fog.uFogMax.value = 0.42 + 0.2 * exit;
  });

  // (separate primitives: building a Group inside useMemo breaks under StrictMode's double call)
  return (
    <>
      <primitive object={sky} />
      <primitive object={islandMesh} />
      <primitive object={reactMesh} />
      <primitive object={waterMesh} />
      <primitive object={cloudMesh} />
      <primitive object={sun} />
      <primitive object={stormMesh} />
    </>
  );
}
