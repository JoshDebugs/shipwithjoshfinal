"use client";

/**
 * The WebGL half: two draw calls.
 *  1. one full-screen pass that draws every eye of the field procedurally
 *     (cost scales with pixels, not with eyes)
 *  2. the followers: instanced quads with the same eye, sun irises
 * Everything is read from the shared SocialSim each frame.
 */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FIELD_FRAG, FIELD_VERT, FOLLOWER_FRAG, FOLLOWER_VERT } from "./glsl";
import type { SocialSim } from "./sim";

export default function EyeScene({ sim }: { sim: SocialSim }) {
  const field = useMemo(() => {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      vertexShader: FIELD_VERT,
      fragmentShader: FIELD_FRAG,
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uSize: { value: new THREE.Vector2(1, 1) },
        uBuf: { value: new THREE.Vector2(1, 1) },
        uCenter: { value: new THREE.Vector2() },
        uS: { value: 100 },
        uR: { value: 0.5 },
        uCenterScale: { value: 0 },
        uCenterOpen: { value: 0 },
        uTime: { value: 0 },
        uGaze: { value: Array.from({ length: 8 }, () => new THREE.Vector2()) },
        uLookViewer: { value: 1 },
        uPost: { value: new THREE.Vector2() },
        uHeartR: { value: 0 },
        uIdle: { value: 1 },
        uWave: { value: new THREE.Vector3() },
        uPulse: { value: 0 },
        uClearA: { value: new THREE.Vector4() },
        uClearB: { value: new THREE.Vector4() },
        uClearAmt: { value: new THREE.Vector2() },
        uMinCell: { value: 4 },
      },
    });
    return { geo, mat };
  }, []);

  const followers = useMemo(() => {
    const f = sim.fol;
    const base = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = base.index;
    geo.setAttribute("position", base.getAttribute("position"));
    const attr = (arr: Float32Array, size: number) => {
      const a = new THREE.InstancedBufferAttribute(arr, size);
      a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };
    const attrs = {
      aPos: attr(f.pos, 2),
      aSize: attr(f.size, 1),
      aOpen: attr(f.open, 1),
      aGaze: attr(f.gaze, 2),
      aSpark: attr(f.spark, 1),
      aHeart: attr(f.heart, 1),
      aSeed: attr(f.seed, 1),
    };
    for (const [k, a] of Object.entries(attrs)) geo.setAttribute(k, a);
    geo.instanceCount = 0;
    const mat = new THREE.ShaderMaterial({
      vertexShader: FOLLOWER_VERT,
      fragmentShader: FOLLOWER_FRAG,
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uSize: { value: new THREE.Vector2(1, 1) } },
    });
    return { geo, mat, attrs, base, version: -1 };
  }, [sim]);

  useEffect(
    () => () => {
      field.geo.dispose();
      field.mat.dispose();
      followers.geo.dispose();
      followers.base.dispose();
      followers.mat.dispose();
    },
    [field, followers],
  );

  useFrame((state) => {
    const F = sim.field;
    const u = field.mat.uniforms;
    u.uSize.value.set(state.size.width, state.size.height);
    state.gl.getDrawingBufferSize(u.uBuf.value);
    u.uCenter.value.set(F.cx, F.cy);
    u.uS.value = F.S;
    u.uR.value = F.R;
    u.uMinCell.value = F.minCell;
    u.uCenterScale.value = F.centerScale;
    u.uCenterOpen.value = F.centerOpen;
    u.uTime.value = F.time;
    const g = u.uGaze.value as THREE.Vector2[];
    for (let j = 0; j < 8; j++) g[j].set(F.gaze[j * 2], F.gaze[j * 2 + 1]);
    u.uLookViewer.value = F.lookViewer;
    u.uPost.value.set(F.postX, F.postY);
    u.uHeartR.value = F.heartR;
    u.uIdle.value = F.idle;
    u.uWave.value.set(F.waveX, F.waveY, F.waveR);
    u.uPulse.value = F.pulse;
    u.uClearA.value.set(F.clearA[0], F.clearA[1], F.clearA[2], F.clearA[3]);
    u.uClearB.value.set(F.clearB[0], F.clearB[1], F.clearB[2], F.clearB[3]);
    u.uClearAmt.value.set(F.clearAmtA, F.clearAmtB);

    const fol = sim.fol;
    followers.mat.uniforms.uSize.value.set(state.size.width, state.size.height);
    if (followers.version !== fol.version) {
      followers.version = fol.version;
      followers.geo.instanceCount = fol.live;
      if (fol.live > 0) for (const a of Object.values(followers.attrs)) a.needsUpdate = true;
    }
  });

  return (
    <>
      <mesh geometry={field.geo} material={field.mat} frustumCulled={false} renderOrder={0} />
      <mesh geometry={followers.geo} material={followers.mat} frustumCulled={false} renderOrder={1} />
    </>
  );
}
