/**
 * GLSL for the world. No lights, no tone mapping: every face picks a Riso
 * shade by its normal and writes raw sRGB, so the canvas prints exactly the
 * palette. The sky is an ordered-dither between pure ink stops (a riso screen).
 */

/* ------------------------------------------------------------------- sky */

export const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w * 0.99999;
}
`;

export const SKY_FRAG = /* glsl */ `
uniform vec3 uStops[7];
uniform vec3 uStopsB[7];
uniform float uMix;
uniform float uElev[7];
uniform vec3 uSunDir;
uniform vec3 uSunTrue;
uniform vec3 uHalo;
uniform vec3 uCore;
uniform float uCell;
uniform float uGlow;
varying vec3 vDir;

float bayer4(vec2 p) {
  const float B[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  return (B[x + y * 4] + 0.5) / 16.0;
}

/** Which of two adjacent ink stops this pixel prints (index of the band + its dithered seam). */
vec2 bandOf(float e, float th) {
  float idx = 6.0;
  float f = 0.0;
  for (int i = 0; i < 6; i++) {
    float hi = uElev[i];
    float lo = uElev[i + 1];
    if (e <= hi && e >= lo) {
      idx = float(i);
      f = (hi - e) / (hi - lo);
    }
  }
  // printed bands: solid ink, with a dithered seam where two inks meet
  f = smoothstep(0.3, 0.7, f);
  return vec2(idx, f > th ? 1.0 : 0.0);
}

vec3 stopA(int i) {
  vec3 c = uStops[6];
  for (int k = 0; k < 7; k++) if (k == i) c = uStops[k];
  return c;
}
vec3 stopB(int i) {
  vec3 c = uStopsB[6];
  for (int k = 0; k < 7; k++) if (k == i) c = uStopsB[k];
  return c;
}

void main() {
  vec3 d = normalize(vDir);
  float e = degrees(asin(clamp(d.y, -1.0, 1.0)));
  // the sunset pools around the sun: squeeze elevation toward the horizon there
  float sd = max(dot(normalize(vec3(d.x, 0.0, d.z)), uSunDir), 0.0);
  float g = pow(sd, 6.0) * uGlow;
  e *= 1.0 - 0.25 * g;
  float th = bayer4(floor(gl_FragCoord.xy / uCell));
  vec2 b = bandOf(e, th);
  int bi = int(min(b.x + b.y, 6.0));
  // between two grades the sky re-prints screen by screen (never a muddy RGB blend):
  // an offset dither picks grade A or B per cell
  float th2 = bayer4(floor(gl_FragCoord.xy / uCell) + vec2(2.0, 1.0));
  vec3 col = uMix > th2 ? stopB(bi) : stopA(bi);
  // a dithered halo behind the cube-sun
  float a = degrees(acos(clamp(dot(d, uSunTrue), -1.0, 1.0)));
  float halo = smoothstep(17.0, 7.0, a) * uGlow;
  float core = smoothstep(8.5, 4.5, a) * uGlow;
  col = halo > th ? uHalo : col;
  col = core > th ? uCore : col;
  gl_FragColor = vec4(col, 1.0);
}
`;

/* ------------------------------------------------------- storm + words */

export const STORM_VERT = /* glsl */ `
attribute float aInk;
attribute float aWord;
attribute float aSeed;
attribute float aK;

uniform float uTime;
uniform float uSettle[7];
uniform float uLock[7];
uniform float uPulse[7];
uniform float uTremble[7];
uniform float uLockAny;
uniform vec3 uSTop[6];
uniform vec3 uSBase[6];
uniform vec3 uSShade[6];
uniform vec3 uSDark[6];
uniform vec3 uLFront[7];
uniform vec3 uLTop[7];
uniform vec3 uLSide[7];
uniform vec3 uLDark[7];
uniform vec3 uFog;
uniform vec2 uFogRange;
uniform float uFogMax;

varying vec3 vCol;

mat3 rotAxis(vec3 a, float t) {
  float s = sin(t);
  float c = cos(t);
  float oc = 1.0 - c;
  return mat3(
    oc * a.x * a.x + c,       oc * a.x * a.y + a.z * s, oc * a.z * a.x - a.y * s,
    oc * a.x * a.y - a.z * s, oc * a.y * a.y + c,       oc * a.y * a.z + a.x * s,
    oc * a.z * a.x + a.y * s, oc * a.y * a.z - a.x * s, oc * a.z * a.z + c
  );
}

float h1(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
  int ink = int(aInk + 0.5);
  bool isWord = aWord > -0.5;
  bool isStar = aWord < -1.5;
  int w = isWord ? int(aWord + 0.5) : 0;
  float settle = isWord ? uSettle[w] : 0.0;
  float lock = isWord ? uLock[w] : 0.0;
  float pulse = isWord ? uPulse[w] : 0.0;
  float trem = isWord ? uTremble[w] : 0.0;
  float wob = isStar ? 0.0 : 1.0 - settle;

  vec3 p = position;
  // idle tumble — fades to exactly zero at the vantage
  vec3 ax = normalize(vec3(sin(aSeed * 91.0), cos(aSeed * 53.0), sin(aSeed * 17.0 + 1.0)));
  float spin = isWord ? 0.0 : uTime * (0.08 + aSeed * 0.22) * (aSeed > 0.5 ? 1.0 : -1.0);
  float ang = wob * (0.5 * sin(uTime * (0.3 + aSeed * 0.5) + aSeed * 40.0)) + spin;
  p = rotAxis(ax, ang) * p;
  p *= 1.0 + 0.07 * pulse;
  // bob (local units = cube sizes, so a word bobs the same on screen at every depth)
  p.y += wob * 0.45 * sin(uTime * (0.5 + aSeed * 0.8) + aSeed * 70.0);
  // ALMOST: a nervous 2-4px jitter in the vantage plane that never settles
  float step = floor(uTime * 14.0);
  p.xy += trem * (vec2(h1(aSeed * 911.0 + step), h1(aSeed * 577.0 + step * 1.37)) - 0.5) * 2.0;

  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);

  vec3 n = normal;
  vec3 storm = n.y > 0.5 ? uSTop[ink] : n.y < -0.5 ? uSDark[ink] : (n.z > 0.5 || n.x < -0.5) ? uSBase[ink] : uSShade[ink];
  vec3 col = storm;
  if (isWord) {
    vec3 lk = n.z > 0.5 ? uLFront[w] : n.y > 0.5 ? uLTop[w] : n.y < -0.5 ? uLDark[w] : uLSide[w];
    col = mix(storm, lk, lock);
  }
  float dist = distance(wp.xyz, cameraPosition);
  float fog = smoothstep(uFogRange.x, uFogRange.y, dist) * uFogMax;
  // while a word is locked the rest of the storm steps back
  fog = max(fog, uLockAny * 0.42 * (1.0 - lock));
  fog *= 1.0 - lock;
  if (isStar) fog = 0.0;
  vCol = mix(col, uFog, fog);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const FLAT_FRAG = /* glsl */ `
varying vec3 vCol;
void main() {
  gl_FragColor = vec4(vCol, 1.0);
}
`;

/* ---------------------------------------------------------------- island */

export const ISLAND_VERT = /* glsl */ `
attribute vec3 aCol;
uniform vec3 uFog;
uniform vec2 uFogRange;
uniform float uFogMax;
varying vec3 vCol;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  float fog = smoothstep(uFogRange.x, uFogRange.y, distance(wp.xyz, cameraPosition)) * uFogMax;
  vCol = mix(aCol, uFog, fog);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/* -------------------------------------------- reactions (dome + bridge) */

export const REACT_VERT = /* glsl */ `
attribute float aMat;
attribute float aT;
uniform float uP;
uniform vec3 uTop[4];
uniform vec3 uBase[4];
uniform vec3 uShade[4];
uniform vec3 uDark[4];
uniform vec3 uFog;
uniform vec2 uFogRange;
uniform float uFogMax;
varying vec3 vCol;

float backOut(float t) {
  float s = 1.70158;
  t -= 1.0;
  return 1.0 + (s + 1.0) * t * t * t + s * t * t;
}

void main() {
  float a = clamp((uP - aT) / 0.006, 0.0, 1.0);
  float s = a <= 0.0 ? 0.0 : backOut(a) * 0.98;
  vec3 p = position * s;
  p.y += (1.0 - a) * 0.8;
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  int m = int(aMat + 0.5);
  vec3 n = normal;
  vec3 col = n.y > 0.5 ? uTop[m] : n.y < -0.5 ? uDark[m] : (n.z > 0.5 || n.x > 0.5) ? uBase[m] : uShade[m];
  float fog = smoothstep(uFogRange.x, uFogRange.y, distance(wp.xyz, cameraPosition)) * uFogMax;
  vCol = mix(col, uFog, fog);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/* -------------------------------------------------------------- waterfall */

export const WATER_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform vec3 uOrigin;
uniform vec3 uWater;
uniform vec3 uWaterTop;
uniform vec3 uFoam;
uniform vec3 uFog;
uniform vec2 uFogRange;
uniform float uFogMax;
varying vec3 vCol;
void main() {
  float L = 30.0;
  float fall = mod(uTime * 4.2 + aSeed * L, L);
  float k = fall / L;
  float col = floor(fract(aSeed * 7.13) * 2.0);
  float s = mix(0.95, 0.25, k) * (0.75 + 0.25 * fract(aSeed * 13.7));
  vec3 p = position * s;
  vec3 c = uOrigin + vec3(-0.9 - k * 2.2 - fract(aSeed * 3.1) * 0.5, -fall, col - 0.5 + (fract(aSeed * 5.3) - 0.5) * 0.4);
  vec4 wp = modelMatrix * vec4(p + c, 1.0);
  vec3 n = normal;
  vec3 base = fract(aSeed * 17.0) > 0.72 ? uWaterTop : uWater;
  vec3 cc = n.y > 0.5 ? (fall < 1.2 ? uFoam : uWaterTop) : base;
  float fog = smoothstep(uFogRange.x, uFogRange.y, distance(wp.xyz, cameraPosition)) * uFogMax;
  vCol = mix(cc, uFog, fog);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/* ------------------------------------------------------------------ clouds */

export const CLOUD_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform vec3 uTop;
uniform vec3 uSide;
uniform vec3 uBottom;
uniform vec3 uFog;
uniform vec2 uFogRange;
uniform float uFogMax;
uniform float uDim;
varying vec3 vCol;
void main() {
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
  wp.x += sin(uTime * 0.05 + aSeed * 6.28) * 2.5;
  vec3 n = normal;
  vec3 col = n.y > 0.5 ? uTop : n.y < -0.5 ? uBottom : uSide;
  float fog = smoothstep(uFogRange.x, uFogRange.y, distance(wp.xyz, cameraPosition)) * uFogMax;
  vCol = mix(col, uFog, max(fog, uDim));
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/* -------------------------------------------------------------------- sun */

export const SUN_VERT = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBase;
uniform vec3 uSide;
varying vec3 vCol;
void main() {
  vec3 n = normal;
  vCol = n.y > 0.5 ? uTop : (n.z > 0.5 || n.x < -0.5) ? uBase : uSide;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
