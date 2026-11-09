"use client";

/**
 * THE STRIKE, in metal. A struck medal in R3F (desktop): the exact rosette the
 * visitor drew is its emissive map at the hand-off (so the swap from the rink
 * canvas is seamless), then the press tweens emissive → 0 while the same
 * pattern rises as a bump map on iridescent, paper-warm metal. Reflections
 * come only from Riso-ink <Lightformer>s — no HDR, nothing downloaded.
 *
 * Camera: perspective with 1 world unit = 1 CSS px on the z = 0 plane, so
 * the 2D pose (screen px) maps 1:1. Everything else is read from the shared
 * store the 2D conductor writes each frame.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei/core/Environment";
import { Lightformer } from "@react-three/drei/core/Lightformer";
import { LazyCanvas } from "@/components/life/multiverse/LazyCanvas";
import { RISO, mix } from "@/components/life/multiverse/palette";
import type { SportsStore } from "./store";

/** Disc thickness in face radii. */
const T = 0.08;
const BUMP = 0.62;
/** Brightness of the ink sweep the face mirrors. */
const SWEEP = 1.5;
/** Thin-film strength on the faces (the rims keep more). */
const FACE_FILM = 0.3;

export default function Medal3D({ store, frameloop }: { store: SportsStore; frameloop: "always" | "demand" }) {
  return (
    <LazyCanvas
      frameloop={frameloop}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: 1,
      }}
      camera={{ fov: 28, near: 100, far: 20000, position: [0, 0, 1800] }}
      style={{ pointerEvents: "none" }}
    >
      <Scene store={store} />
    </LazyCanvas>
  );
}

/**
 * The face of a flat disc only ever mirrors a small patch of the room straight
 * behind the camera, so that patch carries the colour: one Lightformer painted
 * with diagonal bands of the four inks and paper. Tilting the medal rakes those
 * bands across the engraving, which is the iridescent sheen.
 */
function useInkSweep() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d") as CanvasRenderingContext2D;
    const g = ctx.createLinearGradient(0, 0, 512, 512);
    const inks = [RISO.pink, RISO.sun, RISO.paper, RISO.teal, RISO.cobalt].map((c) => mix(c, RISO.paper, 0.2));
    const stops = 25;
    for (let i = 0; i <= stops; i++) g.addColorStop(i / stops, inks[i % inks.length]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function Studio() {
  const sweep = useInkSweep();
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" map={sweep} intensity={SWEEP} position={[0, 0, 10]} scale={[26, 26, 1]} />
      {/* a ring of Riso-ink softboxes for the tilts and the bevels */}
      <Lightformer form="rect" color={RISO.paper} intensity={2.4} position={[0, 4.5, 7]} scale={[14, 2.2, 1]} />
      <Lightformer form="rect" color={RISO.pink} intensity={4.2} position={[-7, 0.5, 5]} scale={[3.5, 9, 1]} />
      <Lightformer form="rect" color={RISO.sun} intensity={3.6} position={[7, 1.5, 5]} scale={[3.5, 9, 1]} />
      <Lightformer form="rect" color={RISO.teal} intensity={3.4} position={[0, -6.5, 5]} scale={[12, 2.6, 1]} />
      <Lightformer form="rect" color={RISO.cobalt} intensity={4} position={[-4, 7, 1]} scale={[8, 2.5, 1]} />
      <Lightformer form="ring" color={RISO.sun} intensity={2.2} position={[5, -4, 4]} scale={3} />
    </Environment>
  );
}

function Scene({ store }: { store: SportsStore }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const group = useRef<THREE.Group>(null);
  const rims = useRef<THREE.Group>(null);
  const seen = useRef({ fe: -1, fh: -1, fa: -1, be: -1, bh: -1, ba: -1 });
  const stage = useRef(0);

  useLayoutEffect(() => {
    const d = size.height / 2 / Math.tan((camera.fov * Math.PI) / 360);
    camera.position.set(0, 0, d);
    camera.near = d * 0.2;
    camera.far = d * 4;
    camera.updateProjectionMatrix();
    invalidate();
  }, [size.width, size.height, camera, invalidate]);

  const A = useMemo(() => {
    const tex = (c: HTMLCanvasElement, srgb: boolean) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = 8;
      return t;
    };
    const fe = tex(store.front.emissive, true);
    const fh = tex(store.front.height, false);
    const fa = tex(store.front.albedo, true);
    const be = tex(store.back.emissive, true);
    const bh = tex(store.back.height, false);
    const ba = tex(store.back.albedo, true);
    const base = {
      metalness: 1,
      roughness: 0.26,
      iridescence: 0.75,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [180, 520] as [number, number],
    };
    const metal = new THREE.MeshPhysicalMaterial({ ...base, color: new THREE.Color(RISO.paper), roughness: 0.24 });
    const front = new THREE.MeshPhysicalMaterial({
      ...base,
      iridescence: FACE_FILM,
      color: new THREE.Color(1, 1, 1),
      map: fa,
      bumpMap: fh,
      bumpScale: 0,
      emissiveMap: fe,
      emissive: new THREE.Color(1, 1, 1),
      emissiveIntensity: 1,
    });
    const back = new THREE.MeshPhysicalMaterial({
      ...base,
      iridescence: FACE_FILM,
      color: new THREE.Color(1, 1, 1),
      map: ba,
      bumpMap: bh,
      bumpScale: BUMP,
      emissiveMap: be,
      emissive: new THREE.Color(1, 1, 1),
      emissiveIntensity: 0,
    });
    const face = new THREE.CircleGeometry(0.986, 180);
    const edge = new THREE.CylinderGeometry(1, 1, 1, 180, 1, true);
    edge.rotateX(Math.PI / 2);
    const rim = new THREE.TorusGeometry(0.962, 0.03, 20, 180);
    const bail = new THREE.TorusGeometry(0.075, 0.022, 14, 48);
    bail.rotateY(Math.PI / 2);
    return { fe, fh, fa, be, bh, ba, metal, front, back, face, edge, rim, bail };
  }, [store]);

  useEffect(
    () => () => {
      [A.fe, A.fh, A.fa, A.be, A.bh, A.ba, A.metal, A.front, A.back, A.face, A.edge, A.rim, A.bail].forEach((o) => o.dispose());
    },
    [A],
  );

  useEffect(() => {
    store.gl3d.alive = true;
    return () => {
      store.gl3d.alive = false;
      store.gl3d.ready = false;
      store.gl3d.frontSeen = -1;
      store.gl3d.backSeen = -1;
    };
  }, [store]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    // three ignores envMapIntensity for materials that fall back to scene.environment,
    // and the neon state needs the reflections off, so bind the map explicitly
    if (scene.environment && A.front.envMap !== scene.environment) {
      for (const mat of [A.front, A.back, A.metal]) {
        mat.envMap = scene.environment;
        mat.needsUpdate = true;
      }
    }
    const S = seen.current;
    const F = store.front;
    const B = store.back;
    // upload only the canvases that changed
    if (F.ve !== S.fe) {
      A.fe.needsUpdate = true;
      gl.initTexture(A.fe);
      S.fe = F.ve;
    }
    if (F.vh !== S.fh) {
      A.fh.needsUpdate = true;
      gl.initTexture(A.fh);
      S.fh = F.vh;
    }
    if (F.va !== S.fa) {
      A.fa.needsUpdate = true;
      gl.initTexture(A.fa);
      S.fa = F.va;
    }
    if (B.ve !== S.be) {
      A.be.needsUpdate = true;
      S.be = B.ve;
    }
    if (B.vh !== S.bh) {
      A.bh.needsUpdate = true;
      S.bh = B.vh;
    }
    if (B.va !== S.ba) {
      A.ba.needsUpdate = true;
      S.ba = B.va;
    }
    store.gl3d.frontSeen = F.version;
    store.gl3d.backSeen = B.version;

    // compile every material once, while visible, before the strike needs it
    if (stage.current === 0) {
      g.visible = true;
      if (rims.current) rims.current.visible = true;
      gl.compile(scene, camera);
      stage.current = 1;
      invalidate();
      return;
    }
    if (stage.current === 1) {
      store.gl3d.ready = true;
      stage.current = 2;
    }

    const pose = store.pose;
    g.visible = pose.vis && store.front.version > 0;
    if (!g.visible) return;
    const w = size.width;
    const h = size.height;
    g.position.set(pose.x - w / 2, h / 2 - pose.y, (-T / 2) * pose.r);
    g.scale.setScalar(pose.r);
    g.rotation.set(pose.rotX + store.tilt.y * pose.tiltAmt, pose.rotY + store.tilt.x * pose.tiltAmt, -pose.rotZ);

    const m = pose.metal;
    A.front.color.setScalar(m);
    A.front.envMapIntensity = m;
    A.front.emissiveIntensity = pose.E;
    A.front.bumpScale = BUMP * pose.bump;
    A.back.color.setScalar(m);
    A.back.envMapIntensity = m;
    A.back.emissiveIntensity = pose.backE;
    const rim = pose.rim * m;
    if (rims.current) rims.current.visible = rim > 0.002;
    A.metal.color.set(RISO.paper).multiplyScalar(rim);
    A.metal.envMapIntensity = rim;
  });

  return (
    <>
      <Studio />
      <group ref={group} visible={false}>
        <mesh geometry={A.face} material={A.front} position={[0, 0, T / 2]} />
        <mesh geometry={A.face} material={A.back} position={[0, 0, -T / 2]} rotation={[0, Math.PI, 0]} />
        <group ref={rims} visible={false}>
          <mesh geometry={A.edge} material={A.metal} scale={[1, 1, T]} />
          <mesh geometry={A.rim} material={A.metal} position={[0, 0, T / 2]} />
          <mesh geometry={A.rim} material={A.metal} position={[0, 0, -T / 2]} />
          <mesh geometry={A.bail} material={A.metal} position={[0, 1.07, 0]} />
        </group>
      </group>
    </>
  );
}
