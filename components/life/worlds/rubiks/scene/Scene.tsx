"use client";

/**
 * The cube: 27 glossy ink cubies (one InstancedMesh) wearing 54 flat riso
 * stickers (two InstancedMeshes, one per atlas), lit by a studio built from
 * Lightformers (no HDR files), with seven puzzle-moons and a stray "+".
 *
 * Everything is a pure function of `progress` (see lib/rig.ts), plus the
 * visitor's free-play moves kept in the shared store.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { MotionValue } from "framer-motion";
import { RISO, mix } from "@/components/life/multiverse/palette";
import { clamp, easeInOutCubic, easeOutCubic, range } from "@/components/life/multiverse/ease";
import { FACE_NORMAL, FACE_RIGHT, FACE_UP, STICKERS, quatOf, type Axis, type CubeState, type Move } from "../lib/cube";
import { N_TOTAL, TIMELINE, VERMILION, timelineStates } from "../lib/script";
import { K, camDir, layout, movePos, rig, snap } from "../lib/rig";
import { STICKER, STICKER_RADIUS } from "../lib/print";
import { frame } from "../lib/frame";
import { clearMoves, pushMove, type Store } from "../lib/store";
import { buildAtlases, type Atlas } from "./atlas";

type Props = {
  progress: MotionValue<number>;
  store: Store;
  font: string | null;
  /** False while printing with the fallback face (reprinted when the real one lands). */
  fontReal: boolean;
  cap: number;
  lowPower: boolean;
};

const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
const HALF_PI = Math.PI / 2;

function roundedSquare(size: number, radius: number) {
  const s = size / 2;
  const r = radius;
  const shape = new THREE.Shape();
  shape.moveTo(-s + r, -s);
  shape.lineTo(s - r, -s);
  shape.quadraticCurveTo(s, -s, s, -s + r);
  shape.lineTo(s, s - r);
  shape.quadraticCurveTo(s, s, s - r, s);
  shape.lineTo(-s + r, s);
  shape.quadraticCurveTo(-s, s, -s, s - r);
  shape.lineTo(-s, -s + r);
  shape.quadraticCurveTo(-s, -s, -s + r, -s);
  const geo = new THREE.ShapeGeometry(shape, 5);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + s) / size, (pos.getY(i) + s) / size);
  uv.needsUpdate = true;
  return geo;
}

type StickerUniforms = { uGrid: { value: THREE.Vector2 }; uPad: { value: number }; uLight: { value: THREE.Vector3 }; uFlat: { value: number } };

function stickerMaterial(atlas: Atlas) {
  const uniforms: StickerUniforms = {
    uGrid: { value: new THREE.Vector2(atlas.cols, atlas.rows) },
    uPad: { value: 0.01 },
    uLight: { value: new THREE.Vector3(-0.45, 0.8, 0.55).normalize() },
    uFlat: { value: 1 },
  };
  const mat = new THREE.MeshBasicMaterial({ map: atlas.texture, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aTile;\nuniform vec2 uGrid;\nuniform float uPad;\nvarying vec3 vWN;")
      .replace(
        "#include <uv_vertex>",
        "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = (aTile + mix(vec2(uPad), vec2(1.0 - uPad), uv)) / uGrid;\n#endif\nvWN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uLight;\nuniform float uFlat;\nvarying vec3 vWN;")
      .replace(
        "#include <map_fragment>",
        "#include <map_fragment>\nfloat lit = clamp(dot(normalize(vWN), uLight) * 0.5 + 0.5, 0.0, 1.0);\ndiffuseColor.rgb *= mix(mix(0.8, 1.0, smoothstep(0.15, 0.85, lit)), 1.0, uFlat);",
      );
  };
  mat.customProgramCacheKey = () => "rubiks-sticker-v1";
  return { mat, uniforms };
}

/** Sticker transform relative to its cubie's centre (home orientation). */
const STICKER_LOCAL = STICKERS.map((s) => {
  const n = FACE_NORMAL[s.face];
  const u = FACE_UP[s.face];
  const r = FACE_RIGHT[s.face];
  const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(...r), new THREE.Vector3(...u), new THREE.Vector3(...n));
  m.setPosition(n[0] * 0.4915, n[1] * 0.4915, n[2] * 0.4915);
  return m;
});

/* ------------------------------------------------------------------ moons */

type MoonDef = { geo: THREE.BufferGeometry; color: string; radius: number; phase: number; incl: number; speed: number; size: number; stray?: boolean };

function makeMoons(lowPower: boolean): MoonDef[] {
  const seg = lowPower ? 12 : 24;
  const plus = (() => {
    const a = new THREE.BoxGeometry(0.62, 0.2, 0.2);
    const b = new THREE.BoxGeometry(0.2, 0.62, 0.2);
    const g = new THREE.BufferGeometry();
    const merge = (geos: THREE.BufferGeometry[]) => {
      const pos: number[] = [];
      const nor: number[] = [];
      for (const x of geos) {
        const ng = x.toNonIndexed();
        pos.push(...(ng.attributes.position.array as Float32Array));
        nor.push(...(ng.attributes.normal.array as Float32Array));
        ng.dispose();
        x.dispose();
      }
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      return g;
    };
    return merge([a, b]);
  })();
  return [
    { geo: new THREE.TetrahedronGeometry(0.36), color: RISO.sun, radius: 2.9, phase: 0.2, incl: 0.32, speed: 1, size: 1 },
    { geo: new THREE.OctahedronGeometry(0.32), color: RISO.pink, radius: 3.15, phase: 1.1, incl: -0.22, speed: 0.85, size: 1 },
    { geo: new THREE.DodecahedronGeometry(0.3), color: RISO.teal, radius: 2.75, phase: 2.0, incl: 0.18, speed: 1.1, size: 1 },
    { geo: new THREE.IcosahedronGeometry(0.3), color: RISO.cobalt, radius: 3.3, phase: 2.9, incl: -0.36, speed: 0.75, size: 1 },
    { geo: new THREE.CylinderGeometry(0.27, 0.27, 0.12, seg), color: VERMILION, radius: 2.95, phase: 3.8, incl: 0.4, speed: 0.95, size: 1 },
    { geo: new THREE.TorusGeometry(0.22, 0.085, 8, seg), color: RISO.paper, radius: 3.1, phase: 4.7, incl: -0.1, speed: 0.9, size: 1 },
    { geo: new THREE.CapsuleGeometry(0.13, 0.3, 4, seg / 2), color: RISO.sun, radius: 2.8, phase: 5.5, incl: 0.26, speed: 1.05, size: 1 },
    { geo: plus, color: RISO.ink, radius: 3.45, phase: 0.75, incl: 0.05, speed: 0.6, size: 1, stray: true },
  ];
}

function toonGradient() {
  const data = new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------------------------------------------ scene */

export default function Scene({ progress, store, font, fontReal, cap, lowPower }: Props) {
  const { gl, scene, camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;

  const group = useRef<THREE.Group>(null);
  const cubies = useRef<THREE.InstancedMesh>(null);
  const capsMesh = useRef<THREE.InstancedMesh>(null);
  const sidesMesh = useRef<THREE.InstancedMesh>(null);
  const moonRefs = useRef<(THREE.Mesh | null)[]>([]);
  const floorMat = useRef<THREE.ShadowMaterial>(null);
  const keyLight = useRef<THREE.DirectionalLight>(null);

  const states = useMemo(() => timelineStates(), []);
  const cubieGeo = useMemo(() => new RoundedBoxGeometry(0.98, 0.98, 0.98, lowPower ? 2 : 4, 0.085), [lowPower]);
  const bodyMat = useMemo<THREE.MeshStandardMaterial>(
    () =>
      lowPower
        ? new THREE.MeshStandardMaterial({ color: RISO.ink, roughness: 0.22, metalness: 0.05 })
        : new THREE.MeshPhysicalMaterial({
            color: RISO.ink,
            roughness: 0.34,
            metalness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0.08,
          }),
    [lowPower],
  );
  const moons = useMemo(() => makeMoons(lowPower), [lowPower]);
  const gradient = useMemo(() => toonGradient(), []);
  const moonMats = useMemo(() => moons.map((m) => new THREE.MeshToonMaterial({ color: m.color, gradientMap: gradient })), [moons, gradient]);

  const atlases = useMemo(() => {
    if (!font) return null;
    void fontReal;
    return buildAtlases(font, cap, lowPower, Math.min(window.devicePixelRatio || 1, 2), gl.capabilities.getMaxAnisotropy());
  }, [font, fontReal, cap, lowPower, gl]);

  const stickerParts = useMemo(() => {
    if (!atlases) return null;
    const base = roundedSquare(STICKER, STICKER * STICKER_RADIUS);
    const make = (atlas: Atlas) => {
      const geo = base.clone();
      const tiles = new Float32Array(atlas.ids.length * 2);
      atlas.ids.forEach((_, i) => {
        tiles[i * 2] = i % atlas.cols;
        tiles[i * 2 + 1] = atlas.rows - 1 - Math.floor(i / atlas.cols);
      });
      geo.setAttribute("aTile", new THREE.InstancedBufferAttribute(tiles, 2));
      return { geo, ...stickerMaterial(atlas) };
    };
    const out = { caps: make(atlases.caps), sides: make(atlases.sides) };
    base.dispose();
    return out;
  }, [atlases]);

  // dispose GPU resources we created by hand
  useEffect(() => () => cubieGeo.dispose(), [cubieGeo]);
  useEffect(() => () => bodyMat.dispose(), [bodyMat]);
  useEffect(
    () => () => {
      moons.forEach((m) => m.geo.dispose());
      moonMats.forEach((m) => m.dispose());
    },
    [moons, moonMats],
  );
  useEffect(() => () => gradient.dispose(), [gradient]);
  useEffect(
    () => () => {
      if (!atlases) return;
      atlases.caps.texture.dispose();
      atlases.sides.texture.dispose();
    },
    [atlases],
  );
  useEffect(
    () => () => {
      if (!stickerParts) return;
      stickerParts.caps.geo.dispose();
      stickerParts.caps.mat.dispose();
      stickerParts.sides.geo.dispose();
      stickerParts.sides.mat.dispose();
    },
    [stickerParts],
  );

  // scratch objects (no per-frame allocation)
  const tmp = useMemo(
    () => ({
      pos: Array.from({ length: 27 }, () => new THREE.Vector3()),
      quat: Array.from({ length: 27 }, () => new THREE.Quaternion()),
      mats: Array.from({ length: 27 }, () => new THREE.Matrix4()),
      q: new THREE.Quaternion(),
      q2: new THREE.Quaternion(),
      m: new THREE.Matrix4(),
      v: new THREE.Vector3(),
      one: new THREE.Vector3(1, 1, 1),
      arr: [0, 0, 0, 1],
      yaw: new THREE.Quaternion(),
      flip: new THREE.Quaternion(),
      e: new THREE.Euler(),
    }),
    [],
  );

  /** Where each cubie is: state + an optional partial layer turn. */
  const pose = useCallback(
    (s: CubeState, axis: number, layer: number[] | null, angle: number) => {
      for (let i = 0; i < 27; i++) {
        const P = tmp.pos[i];
        P.set(s.pos[i * 3], s.pos[i * 3 + 1], s.pos[i * 3 + 2]);
        quatOf(s, i, tmp.arr);
        tmp.quat[i].set(tmp.arr[0], tmp.arr[1], tmp.arr[2], tmp.arr[3]);
        if (layer && angle !== 0 && layer.includes(s.pos[i * 3 + axis])) {
          tmp.q.setFromAxisAngle(AXES[axis], angle);
          P.applyQuaternion(tmp.q);
          tmp.quat[i].premultiply(tmp.q);
        }
      }
    },
    [tmp],
  );

  const clock = useRef(0);

  const update = useCallback(
    (dt: number) => {
      clock.current += dt;
      const t = clock.current;
      const p = progress.get();
      const w = size.width;
      const h = size.height;
      const L = layout(w, h);
      const r = rig(p, w, h, L);

      /* camera */
      const d = camDir(r);
      cam.fov = r.fov;
      cam.position.set(d[0] * r.dist, d[1] * r.dist, d[2] * r.dist);
      cam.up.set(0, 1, 0);
      cam.lookAt(0, 0, 0);
      cam.near = Math.max(0.03, r.dist - 6);
      cam.far = r.dist + 16;
      cam.setViewOffset(w, h, w / 2 - r.cx, h / 2 - r.cy, w, h);
      cam.updateProjectionMatrix();

      /* free play bookkeeping */
      const nUser = store.moves.length;
      if (p < K.lock3 - 0.02 && (nUser || store.drag)) {
        store.drag = null;
        clearMoves(store);
      }
      let target = nUser;
      if (store.solving || p < K.flip) target = 0;
      else if (p > K.playEnd) target = nUser * (1 - range(p, K.playEnd, K.unwindEnd));
      const drag = store.drag;
      if (!drag) {
        const diff = target - store.applied;
        if (Math.abs(diff) > 1e-4) {
          const speed = Math.max(7, Math.abs(diff) * 5);
          store.applied += Math.sign(diff) * Math.min(Math.abs(diff), speed * dt);
        } else store.applied = target;
        if (store.solving && store.applied <= 1e-4) clearMoves(store);
      } else if (drag.settling) {
        drag.t = Math.min(1, drag.t + dt / 0.17);
        drag.angle = drag.from + (drag.to - drag.from) * easeOutCubic(drag.t);
        if (drag.t >= 1) {
          const q = Math.round(drag.to / HALF_PI);
          store.drag = null;
          if (q % 4 !== 0) {
            pushMove(store, drag.axis, drag.layer, q);
            store.applied = store.moves.length;
          }
        }
      }

      /* cube state */
      const m = movePos(p);
      const userOn = p >= K.lock3 && (store.applied > 1e-4 || store.drag);
      if (userOn) {
        const dg = store.drag;
        if (dg) pose(store.states[store.states.length - 1], dg.axis, [dg.layer], dg.angle);
        else {
          const k = Math.min(Math.floor(store.applied), store.moves.length);
          const frac = store.applied - k;
          const mv: Move | undefined = store.moves[k];
          if (mv && frac > 1e-4) pose(store.states[k], mv.axis, mv.layers, mv.q * HALF_PI * snap(frac));
          else pose(store.states[k], 0, null, 0);
        }
      } else if (m >= N_TOTAL) pose(states[N_TOTAL], 0, null, 0);
      else {
        const k = Math.floor(m);
        const mv = TIMELINE[k];
        pose(states[k], mv.axis, mv.layers, mv.q * HALF_PI * snap(m - k));
      }

      /* exit: crack the top layer (world-up = local y −1 after the flip), burst it, open the middle */
      if (r.crack > 0 || r.burst > 0 || r.open > 0) {
        tmp.q2.setFromAxisAngle(AXES[1], (r.crack * Math.PI) / 4);
        for (let i = 0; i < 27; i++) {
          const P = tmp.pos[i];
          const ly = Math.round(P.y);
          if (ly === -1) {
            P.applyQuaternion(tmp.q2);
            tmp.quat[i].premultiply(tmp.q2);
            if (r.burst > 0) {
              const len = Math.hypot(P.x, P.z);
              const dx = len > 0.1 ? P.x / len : 0.55;
              const dz = len > 0.1 ? P.z / len : -0.83;
              const b = r.burst;
              P.x += dx * 7.5 * b;
              P.z += dz * 7.5 * b;
              P.y -= (2.2 + (len < 0.1 ? 2.5 : 0)) * b;
              tmp.e.set(dz * 1.6 * b, 0, -dx * 1.6 * b);
              tmp.q.setFromEuler(tmp.e);
              tmp.quat[i].premultiply(tmp.q);
            }
          } else if (ly === 0 && r.open > 0 && (Math.abs(P.x) > 0.5 || Math.abs(P.z) > 0.5)) {
            P.x += P.x * 1.6 * r.open;
            P.z += P.z * 1.6 * r.open;
          }
        }
      }

      /* lock "press" */
      const age = performance.now() / 1000 - store.lockAt;
      const press = age >= 0 && age < 0.5 ? 0.018 * Math.sin((age / 0.5) * Math.PI) * (1 - age / 0.5) : 0;

      /* group */
      const g = group.current;
      if (g) {
        g.position.set(0, r.lift, 0);
        tmp.yaw.setFromAxisAngle(AXES[1], r.yaw);
        tmp.flip.setFromAxisAngle(AXES[0], r.flip);
        g.quaternion.copy(tmp.flip).multiply(tmp.yaw);
        g.scale.setScalar(1 - press);
        g.updateMatrixWorld();
      }

      /* instances */
      const cm = cubies.current;
      if (cm) {
        for (let i = 0; i < 27; i++) {
          tmp.mats[i].compose(tmp.pos[i], tmp.quat[i], tmp.one);
          cm.setMatrixAt(i, tmp.mats[i]);
        }
        cm.instanceMatrix.needsUpdate = true;
      }
      const caps = capsMesh.current;
      const sides = sidesMesh.current;
      if (caps && sides) {
        for (const s of STICKERS) {
          tmp.m.multiplyMatrices(tmp.mats[s.cubie], STICKER_LOCAL[s.id]);
          if (s.id < 18) caps.setMatrixAt(s.id, tmp.m);
          else sides.setMatrixAt(s.id - 18, tmp.m);
        }
        caps.instanceMatrix.needsUpdate = true;
        sides.instanceMatrix.needsUpdate = true;
      }
      if (stickerParts) {
        stickerParts.caps.uniforms.uFlat.value = r.flat;
        stickerParts.sides.uniforms.uFlat.value = r.flat;
      }
      // while the "poster" is flat the gutters stay matte ink (matches the DOM poster);
      // the studio comes from scene.environment, so its strength lives on the scene
      scene.environmentIntensity = 1 - 0.96 * r.flat;

      /* moons */
      const mobile = L.mobile;
      // keep the moons out of the caption column / block once the copy is up
      const ko = frame(w, h).knockout;
      const avoid = p > 0.245 && p < 0.9;
      if (avoid) cam.updateMatrixWorld();
      for (let i = 0; i < moons.length; i++) {
        const mesh = moonRefs.current[i];
        if (!mesh) continue;
        const md = moons[i];
        const appear = clamp(r.moons * 1.6 - i * 0.08);
        const s = easeInOutCubic(appear) * md.size * (mobile ? 0.85 : 1);
        mesh.visible = s > 0.01;
        if (!mesh.visible) continue;
        const a = md.phase + p * 11 * md.speed + t * 0.18 * md.speed;
        let R = md.radius * (mobile ? 0.86 : 1);
        if (md.stray) R += 0.55 + 0.45 * Math.sin(t * 0.5 + p * 7);
        const x = Math.cos(a) * R;
        const z = Math.sin(a) * R;
        const y = Math.sin(a + md.phase) * R * md.incl + r.lift * 0.6 + (md.stray ? 0.35 * Math.sin(t * 0.8) : 0);
        mesh.position.set(x, y, z);
        let k = 1;
        if (avoid) {
          tmp.v.set(x, y, z).project(cam);
          const sx = ((tmp.v.x + 1) / 2) * w;
          const sy = ((1 - tmp.v.y) / 2) * h;
          const feather = mobile ? 36 : 70;
          // signed distance outside the knock-out box (px), 0 inside
          const dx = Math.max(ko.x - sx, sx - (ko.x + ko.w), 0);
          const dy = Math.max(ko.y - sy, sy - (ko.y + ko.h), 0);
          // …and out of the HUD corner (bottom-right 300×76)
          const hx = Math.max(w - 300 - sx, 0);
          const hy = Math.max(h - 90 - sy, 0);
          k = clamp(Math.min(Math.hypot(dx, dy), Math.hypot(hx, hy)) / feather);
          k = k * k * (3 - 2 * k);
        }
        if (md.stray) {
          // the stray "+" always shows its face (edge-on it read as a smudge)
          mesh.quaternion.copy(cam.quaternion);
          mesh.rotateZ(0.35 * Math.sin(t * 0.6) + p * 4);
          mesh.rotateX(0.35 * Math.sin(t * 0.45 + 1));
        } else mesh.rotation.set(t * 0.4 + i, p * 6 + i * 0.7, t * 0.25);
        mesh.scale.setScalar(s * k);
        mesh.visible = s * k > 0.01;
      }

      /* shadow + light */
      if (floorMat.current) floorMat.current.opacity = 0.2 * r.depth;
      if (keyLight.current) keyLight.current.castShadow = r.depth > 0.01;
    },
    [progress, size.width, size.height, cam, scene, store, pose, states, tmp, moons, stickerParts],
  );

  useFrame((_, dt) => update(Math.min(dt, 0.05)));

  // pre-warm: once the atlases exist, compile + draw one frame even while hidden ("next")
  useEffect(() => {
    if (!stickerParts) return;
    update(0);
    try {
      gl.compile(scene, camera);
      gl.render(scene, camera);
    } catch {
      /* a lost context will simply render on the next frame */
    }
    store.ready = true;
    return () => {
      store.ready = false;
    };
  }, [stickerParts, gl, scene, camera, update, store]);

  /* free-play picking (pointer → layer twist) */
  useEffect(() => {
    const ray = new THREE.Raycaster();
    const box = new THREE.Box3(new THREE.Vector3(-1.5, -1.5, -1.5), new THREE.Vector3(1.5, 1.5, 1.5));
    const inv = new THREE.Matrix4();
    const hit = new THREE.Vector3();
    type Start = {
      point: THREE.Vector3;
      n: number;
      sign: number;
      coords: number[];
      chosen: { axis: Axis; sign: number; dir: THREE.Vector2; pxPerUnit: number } | null;
    };
    let start: Start | null = null;

    const toScreen = (local: THREE.Vector3, out: THREE.Vector2) => {
      const v = local.clone();
      group.current!.localToWorld(v);
      v.project(cam);
      out.set(((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height);
      return out;
    };

    store.pick = (nx, ny) => {
      const g = group.current;
      if (!g || store.drag || store.solving || Math.abs(store.applied - store.moves.length) > 1e-3) return false;
      ray.setFromCamera(new THREE.Vector2(nx, ny), cam);
      inv.copy(g.matrixWorld).invert();
      const localRay = ray.ray.clone().applyMatrix4(inv);
      if (!localRay.intersectBox(box, hit)) return false;
      const a = [Math.abs(hit.x), Math.abs(hit.y), Math.abs(hit.z)];
      const n = a[0] >= a[1] && a[0] >= a[2] ? 0 : a[1] >= a[2] ? 1 : 2;
      const c = [hit.x, hit.y, hit.z].map((v) => Math.max(-1, Math.min(1, Math.round(v))));
      start = { point: hit.clone(), n, sign: Math.sign([hit.x, hit.y, hit.z][n]) || 1, coords: c, chosen: null };
      return true;
    };

    store.dragTo = (dx, dy) => {
      if (!start) return;
      if (!start.chosen) {
        if (Math.hypot(dx, dy) < 9) return;
        const d = new THREE.Vector2(dx, dy).normalize();
        const p0 = toScreen(start.point, new THREE.Vector2());
        let best: { axis: number; s: THREE.Vector2; score: number } | null = null;
        for (let k = 0; k < 3; k++) {
          if (k === start.n) continue;
          const tip = start.point.clone().addScaledVector(AXES[k], 0.6);
          const s = toScreen(tip, new THREE.Vector2()).sub(p0).divideScalar(0.6);
          const len = s.length();
          if (len < 1e-3) continue;
          const score = Math.abs(d.dot(s.clone().divideScalar(len)));
          if (!best || score > best.score) best = { axis: k, s, score };
        }
        if (!best) return;
        // drag direction t (local), rotation axis = n × t
        const nVec = new THREE.Vector3().setComponent(start.n, start.sign);
        const tVec = AXES[best.axis].clone();
        const rot = new THREE.Vector3().crossVectors(nVec, tVec);
        const axis = (Math.abs(rot.x) > 0.5 ? 0 : Math.abs(rot.y) > 0.5 ? 1 : 2) as Axis;
        const sign = Math.sign(rot.getComponent(axis));
        const pxPerUnit = best.s.length();
        start.chosen = { axis, sign, dir: best.s.clone().normalize(), pxPerUnit };
        store.drag = { axis, layer: start.coords[axis], angle: 0, settling: false, from: 0, to: 0, t: 0 };
      }
      const ch = start.chosen;
      const dg = store.drag;
      if (!ch || !dg || dg.settling) return;
      const along = dx * ch.dir.x + dy * ch.dir.y;
      const ang = along / (ch.pxPerUnit * 1.2);
      dg.angle = Math.max(-Math.PI, Math.min(Math.PI, ch.sign * ang));
    };

    store.release = () => {
      const dg = store.drag;
      start = null;
      if (!dg || dg.settling) return;
      dg.settling = true;
      dg.from = dg.angle;
      // a quarter turn commits from ~25° (flick-friendly on phones)
      const q = Math.round(dg.angle / HALF_PI + Math.sign(dg.angle) * 0.22);
      dg.to = Math.max(-2, Math.min(2, q)) * HALF_PI;
      dg.t = 0;
    };

    return () => {
      store.pick = null;
      store.dragTo = null;
      store.release = null;
    };
  }, [store, cam, size.width, size.height]);

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight
        ref={keyLight}
        position={[-4.5, 10, 6.5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[lowPower ? 512 : 1024, lowPower ? 512 : 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      <Environment resolution={lowPower ? 64 : 256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color={RISO.paper} position={[-6, 2.5, 3.5]} scale={[5, 8, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.8} color={mix(RISO.paper, RISO.sun, 0.4)} position={[6, 1.5, -2]} scale={[3, 9, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.1} color={RISO.paper} position={[1.5, -0.5, 7]} scale={[12, 1.4, 1]} target={[0, 0, 0]} />
        <Lightformer form="circle" intensity={0.9} color={RISO.cobalt} position={[0, -7, 0]} scale={5} target={[0, 0, 0]} />
      </Environment>

      <group ref={group}>
        <instancedMesh ref={cubies} args={[cubieGeo, bodyMat, 27]} castShadow frustumCulled={false} />
        {stickerParts && (
          <>
            <instancedMesh ref={capsMesh} args={[stickerParts.caps.geo, stickerParts.caps.mat, 18]} frustumCulled={false} />
            <instancedMesh ref={sidesMesh} args={[stickerParts.sides.geo, stickerParts.sides.mat, 36]} frustumCulled={false} />
          </>
        )}
      </group>

      {moons.map((m, i) => (
        <mesh
          key={i}
          ref={(el) => {
            moonRefs.current[i] = el;
          }}
          geometry={m.geo}
          material={moonMats[i]}
          visible={false}
        />
      ))}

      <mesh rotation-x={-Math.PI / 2} position={[0, -1.52, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial ref={floorMat} color={RISO.ink} transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}
