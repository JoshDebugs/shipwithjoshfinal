"use client";

/**
 * The print as a real relief: one polar mesh, one ShaderMaterial, one sky
 * triangle and a handful of dust motes. The camera and every uniform come from
 * the rig, so the WebGL frame and the DOM overlays can never disagree.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Matrix4,
  ShaderMaterial,
  Vector2,
  Vector3,
  type PerspectiveCamera,
} from "three";
import { RISO } from "@/components/life/multiverse/palette";
import { BAND_INKS, HAZE } from "./bands";
import { RIDGE_H } from "./camera";
import { CX, CY, PAIRS } from "./field";
import { buildRidgeMesh } from "./mesh";
import type { Rig } from "./rig";
import { MOTE_FRAG, MOTE_VERT, SKY_FRAG, SKY_VERT, TERRAIN_FRAG, TERRAIN_VERT } from "./shaders";
import { igniteAt, shaderState } from "./state";

const col = (hex: string) => new Vector3(...(new Color().setStyle(hex, "srgb-linear").toArray() as [number, number, number]));

function duskUniforms() {
  return {
    uInk: { value: col(RISO.ink) },
    uPaper: { value: col(RISO.paper) },
    uPink: { value: col(RISO.pink) },
    uSun: { value: col(RISO.sun) },
    uCobalt: { value: col(RISO.cobalt) },
    uTeal: { value: col(RISO.teal) },
    uHaze: { value: col(HAZE) },
    uGlowDir: { value: new Vector2(0, 1) },
    uDusk: { value: 1 },
  };
}

export function Terrain({ rig, lowPower }: { rig: Rig; lowPower: boolean }) {
  const { gl, scene, camera } = useThree();

  const terrain = useMemo(() => {
    const m = lowPower ? buildRidgeMesh(300, 5, 34) : buildRidgeMesh(620, 7, 36);
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(m.position, 3));
    g.setIndex(new BufferAttribute(m.index, 1));
    return g;
  }, [lowPower]);

  const terrainMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: TERRAIN_VERT,
        fragmentShader: TERRAIN_FRAG,
        uniforms: {
          ...duskUniforms(),
          uPairA: { value: PAIRS.map((p) => new Vector2(p.a.x, p.a.y)) },
          uPairB: { value: PAIRS.map((p) => new Vector2(p.b.x, p.b.y)) },
          uPairFade: { value: PAIRS.map((p) => p.fade) },
          uBand: { value: BAND_INKS.map(col) },
          uIgnite: { value: new Array(13).fill(0) },
          uHeight: { value: RIDGE_H },
          uTime: { value: 0 },
          uFlat: { value: 0 },
          uFogK: { value: 3.1 },
          uDim: { value: 0 },
          uScanY: { value: 0 },
          uScanOn: { value: 0 },
          uLens: { value: new Vector3() },
          uLensMag: { value: 2.8 },
          uFocus: { value: new Vector3() },
          uPen: { value: 0 },
          uPenStart: { value: 0 },
          uLod: { value: 1 },
          uCam: { value: new Vector3() },
        },
      }),
    [],
  );

  const skyGeo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    return g;
  }, []);

  const skyMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          ...duskUniforms(),
          uInvProj: { value: new Matrix4() },
          uCamWorld: { value: new Matrix4() },
          uDpr: { value: 1 },
        },
      }),
    [],
  );

  const motes = useMemo(() => {
    const n = lowPower ? 60 : 180;
    const g = new BufferGeometry();
    const seed = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) seed[i] = fract(Math.sin(i * 127.1 + 11.7) * 43758.5453);
    g.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 3));
    return g;
  }, [lowPower]);

  const moteMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: MOTE_VERT,
        fragmentShader: MOTE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 240 },
          uDusk: { value: 1 },
          uCam: { value: new Vector3() },
          uTint: { value: col(RISO.sun) },
        },
      }),
    [],
  );

  // compile while warming up, so the portal dive never hitches on the first frame
  useEffect(() => {
    gl.compile(scene, camera);
  }, [gl, scene, camera, terrainMat, skyMat, moteMat]);

  useEffect(
    () => () => {
      terrain.dispose();
      skyGeo.dispose();
      motes.dispose();
      terrainMat.dispose();
      skyMat.dispose();
      moteMat.dispose();
    },
    [terrain, skyGeo, motes, terrainMat, skyMat, moteMat],
  );

  const announced = useRef(false);

  useFrame((state) => {
    const f = rig.frame;
    const t = state.clock.elapsedTime;
    const cam = camera as PerspectiveCamera;

    // handheld breathing, only in the canyons
    const b = 1 - f.flat;
    const swayX = b * Math.sin(t * 0.7) * 0.0006;
    const swayZ = b * Math.sin(t * 0.53 + 1.3) * 0.0005;
    cam.position.set(f.x + swayX, f.y, f.z + swayZ);
    cam.rotation.order = "ZXY";
    cam.rotation.set(f.tilt, 0, f.yaw);
    if (Math.abs(cam.fov - f.fov) > 1e-3 || cam.near !== 0.0025) {
      cam.fov = f.fov;
      cam.near = 0.0025;
      cam.far = 8;
      cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld();

    const glow = new Vector2(CX - f.x, CY - f.y);
    if (glow.lengthSq() < 1e-6) glow.set(-Math.sin(f.yaw), Math.cos(f.yaw));
    glow.normalize();

    const s = shaderState(rig);
    const u = terrainMat.uniforms;
    u.uTime.value = t;
    u.uFlat.value = f.flat;
    u.uDusk.value = f.dusk;
    // the haze thins as the crane climbs out of the canyons
    const climb = Math.min(1, Math.max(0, (f.z - 0.05) / 0.3));
    u.uFogK.value = 3.1 * (1 - 0.86 * climb);
    u.uCam.value.copy(cam.position);
    u.uGlowDir.value.copy(glow);
    u.uDim.value = s.dim;
    u.uScanY.value = s.scanY;
    u.uScanOn.value = s.scanOn;
    u.uPen.value = s.pen;
    u.uPenStart.value = s.penStart;
    u.uFocus.value.set(s.focusX, s.focusY, s.focusR);
    u.uLens.value.set(rig.lens.x, rig.lens.y, rig.lens.R);
    u.uLensMag.value = rig.lens.mag;
    igniteAt(rig.p, u.uIgnite.value as number[]);

    const sky = skyMat.uniforms;
    sky.uDusk.value = f.dusk;
    sky.uGlowDir.value.copy(glow);
    sky.uInvProj.value.copy(cam.projectionMatrixInverse);
    sky.uCamWorld.value.copy(cam.matrixWorld);
    sky.uDpr.value = state.gl.getPixelRatio();

    const mo = moteMat.uniforms;
    mo.uTime.value = t;
    mo.uDusk.value = f.dusk;
    mo.uCam.value.copy(cam.position);
    mo.uSize.value = state.size.height * state.gl.getPixelRatio() * 0.26;

    if (!announced.current) {
      announced.current = true;
      gl.domElement.parentElement?.setAttribute("data-outro-ready", "1");
    }
  });

  return (
    <>
      <mesh geometry={skyGeo} material={skyMat} frustumCulled={false} renderOrder={-10} />
      <mesh geometry={terrain} material={terrainMat} frustumCulled={false} />
      <points geometry={motes} material={moteMat} frustumCulled={false} renderOrder={5} />
    </>
  );
}

function fract(v: number) {
  return v - Math.floor(v);
}
