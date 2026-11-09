/**
 * Shaders for the eye field (one full-screen pass, every eye procedural per
 * grid cell) and the followers (instanced quads drawn with the same eye).
 *
 * Coordinates: CSS px of the stage, y pointing DOWN (same as the DOM), so the
 * CPU side can hand over pointer / layout positions untouched.
 * Output is premultiplied alpha; the pink ground is the DOM underneath.
 */

import { RISO } from "@/components/life/multiverse/palette";
import { ROW } from "./timeline";

const v3 = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (x: number) => (x / 255).toFixed(4);
  return `vec3(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

/** Almond geometry in eye units (1 = cell width): half-width EW, half-height EH. */
export const EYE = { EW: 0.38, EH: 0.24 } as const;
const ER = (EYE.EH + (EYE.EW * EYE.EW) / EYE.EH) / 2;
const EC = ((EYE.EW * EYE.EW) / EYE.EH - EYE.EH) / 2;
export const EYE_ARC = { R: ER, C: EC } as const;

const COMMON = /* glsl */ `
#define PAPER ${v3(RISO.paper)}
#define INK ${v3(RISO.ink)}
#define PINK ${v3(RISO.pink)}
#define SUN ${v3(RISO.sun)}
#define TEAL ${v3(RISO.teal)}
#define COBALT ${v3(RISO.cobalt)}

const float EW = ${EYE.EW.toFixed(5)};
const float ER = ${ER.toFixed(5)};
const float EC = ${EC.toFixed(5)};

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float dot2(vec2 v) { return dot(v, v); }

// iq's heart: tip at the origin, lobes up to y ~ 1 (y up)
float sdHeart(vec2 p) {
  p.x = abs(p.x);
  if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - 0.35355;
  return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
}

float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// Half-height of the almond at x (two circle arcs), plus its slope.
float halfH(float x, out float slope) {
  float s = sqrt(max(ER * ER - x * x, 1e-4));
  slope = -x / s;
  return s - EC;
}

// Exact SDF of the open almond: a horizontal vesica with tips at (+-EW, 0).
float sdAlmond(vec2 p) {
  p = abs(p);
  return ((p.x - EW) * EC > p.y * EW) ? length(p - vec2(EW, 0.0)) : length(p - vec2(0.0, -EC)) - ER;
}

// Signed distance (negative inside) to the visible part of the eye. The upper
// lid slides down onto the lower arc as open goes 1 -> 0, so a shut eye is a
// curved lash line, never a hole.
float apertureSD(vec2 p, float open) {
  float dA = sdAlmond(p);
  if (open >= 0.999) return dA;
  float x = clamp(p.x, -EW * 0.995, EW * 0.995);
  float sl;
  float h = halfH(x, sl);
  float yt = h - 2.0 * h * open;
  float slt = sl * (1.0 - 2.0 * open);
  return max(dA, (yt - p.y) * inversesqrt(1.0 + slt * slt));
}

vec2 rot2(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

vec4 over(vec4 dst, vec3 c, float a) { return vec4(c * a, a) + dst * (1.0 - a); }

float fill(float d, float aa) { return 1.0 - smoothstep(-aa, aa, d); }

// One vinyl-sticker eye (premultiplied). p in eye units, y down.
// px = one screen pixel in eye units; detail/lashes fade in on big eyes.
vec4 drawEye(vec2 p, float px, float open, vec2 gaze, vec3 iris, float heart, float seed, float detail, float lashes) {
  float aa = px * 0.85;
  float t = max(0.036, px * 1.35);
  float so = clamp(0.032, px * 1.4, px * 16.0);
  vec2 sh = vec2(so * 0.8, so);
  vec4 acc = vec4(0.0);

  if (heart > 0.01) {
    vec2 b = (p - vec2(0.0, 0.31)) / vec2(0.21, 0.05);
    acc = over(acc, INK, 0.13 * heart * fill((length(b) - 1.0) * 0.05, aa));
  }

  // hard offset shadow
  acc = over(acc, INK, fill(apertureSD(p - sh, open) - t * 0.55, aa));

  // outline (+ lashes riding the lid line)
  float d = apertureSD(p, open);
  float inkA = fill(d - t * 0.55, aa);
  if (lashes > 0.01) {
    float dl = 1e3;
    float dir = mix(1.0, -1.0, smoothstep(0.12, 0.55, open));
    for (int i = 0; i < 3; i++) {
      float x = (float(i) - 1.0) * 0.165;
      float sl;
      float h = halfH(x, sl);
      vec2 a = vec2(x, h - 2.0 * h * open);
      dl = min(dl, sdSeg(p, a, a + normalize(vec2(x * 1.7, dir)) * 0.07));
    }
    inkA = max(inkA, lashes * fill(dl - t * 0.42, aa));
  }
  acc = over(acc, INK, inkA);

  float fillA = fill(d + t * 0.45, aa);
  if (fillA <= 0.0) return acc;

  vec3 col = PAPER;
  float sl;
  float h = halfH(p.x, sl);
  float yt = h - 2.0 * h * open;
  // the lid's shadow on the eyeball: pink overprinted on paper
  col = mix(col, PAPER * PINK, 0.38 * detail * fill(p.y - yt - 0.05, aa));

  vec2 q = p - gaze;
  float r = length(q);
  float ri = 0.152;
  vec3 dark = iris * iris;
  float stri = 0.5 + 0.5 * sin(atan(q.y, q.x) * 14.0 + seed * 31.0);
  vec3 ic = mix(iris, dark, detail * (0.2 * stri * smoothstep(0.04, ri, r) + 0.55 * smoothstep(ri * 0.76, ri, r)));
  col = mix(col, ic, fill(r - ri, aa));

  // pupil morphs into a heart near the post
  float dP = r - mix(0.052, 0.068, detail);
  vec2 hq = q / 0.135;
  float dH = sdHeart(vec2(hq.x, 0.52 - hq.y)) * 0.135;
  float pd = mix(dP, dH, heart);
  col = mix(col, INK, fill(pd - t * 0.32 * heart, aa));
  col = mix(col, PINK, heart * fill(pd + t * 0.3, aa));

  // specular dots
  float hl = fill(length(q - vec2(-0.052, -0.05)) - 0.034, aa);
  float hl2 = fill(length(q - vec2(0.048, 0.043)) - 0.015, aa) * step(0.25, detail);
  col = mix(col, PAPER, max(hl, hl2) * (1.0 - 0.6 * heart));

  return over(acc, col, fillA);
}
`;

export const FIELD_VERT = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const FIELD_FRAG = /* glsl */ `
precision highp float;
${COMMON}
uniform vec2 uSize;
uniform vec2 uBuf;
uniform vec2 uCenter;
uniform float uS;
uniform float uR;
uniform float uCenterScale;
uniform float uCenterOpen;
uniform float uTime;
uniform vec2 uGaze[8];
uniform float uLookViewer;
uniform vec2 uPost;
uniform float uHeartR;
uniform float uIdle;
uniform vec3 uWave;
uniform float uPulse;
uniform vec4 uClearA;
uniform vec4 uClearB;
uniform vec2 uClearAmt;
uniform float uMinCell;

float sdRect(vec2 p, vec4 r) {
  vec2 c = (r.xy + r.zw) * 0.5;
  vec2 hs = (r.zw - r.xy) * 0.5;
  vec2 d = abs(p - c) - hs;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 P = vec2(gl_FragCoord.x, uBuf.y - gl_FragCoord.y) * (uSize / uBuf);
  float S = max(uS, uMinCell);
  float SH = S * ${ROW.toFixed(3)};
  vec2 rel = P - uCenter;
  float row = floor(rel.y / SH + 0.5);
  float odd = mod(row, 2.0);
  float col = floor(rel.x / S - 0.5 * odd + 0.5);
  vec2 id = vec2(col, row);
  vec2 cc = uCenter + vec2((col + 0.5 * odd) * S, row * SH);
  bool center = abs(col) < 0.5 && abs(row) < 0.5;

  float h1 = hash12(id + vec2(0.17, 3.1));
  float h2 = hash12(id + vec2(7.3, 1.9));
  float h3 = hash12(id + vec2(13.7, 5.3));
  float h4 = hash12(id + vec2(21.9, 8.8));
  float h5 = hash12(id + vec2(29.3, 2.2));
  float h6 = hash12(id + vec2(37.1, 9.7));
  float h7 = hash12(id + vec2(45.5, 4.4));
  float h8 = hash12(id + vec2(53.9, 6.6));

  vec2 jit = center ? vec2(0.0) : (vec2(h1, h2) - 0.5) * vec2(0.1, 0.07);
  float tilt = center ? 0.0 : (h6 - 0.5) * 0.26;
  float scale;
  float open;
  vec2 sq = vec2(1.0);
  if (center) {
    scale = uCenterScale;
    open = uCenterOpen;
  } else {
    float dist = length(cc - uCenter) / S;
    float a = clamp((uR - dist - h7 * 0.9) / 1.2, 0.0, 1.0);
    float b = a - 1.0;
    scale = a <= 0.0 ? 0.0 : (1.0 + 3.2 * b * b * b + 2.2 * b * b) * mix(0.8, 1.0, h3);
    float st = sin(a * 3.14159);
    sq = vec2(1.0 - 0.1 * st, 1.0 + 0.08 * st);
    open = smoothstep(0.15, 0.7, a);
  }

  // idle micro-blinks (~150ms, every 3-8s per eye)
  float period = 3.4 + 4.4 * h6;
  float bt = mod(uTime + h5 * period, period);
  open *= 1.0 - uIdle * (1.0 - smoothstep(0.0, 0.075, abs(bt - 0.075)));

  // THE BLINK: lids slam behind the wavefront, then the eye sinks away
  float sink = 0.0;
  if (uWave.z > 0.0) {
    float behind = uWave.z - length(cc - uWave.xy);
    open *= 1.0 - smoothstep(0.0, 46.0, behind);
    sink = smoothstep(70.0, 250.0, behind);
    scale *= 1.0 - sink;
  }

  // eyes politely make room for the copy (the giant centre eye never does)
  vec2 clr = center ? vec2(0.0) : uClearAmt;
  scale *= mix(1.0, smoothstep(0.25 * S, 0.7 * S, sdRect(cc, uClearA)), clr.x);
  scale *= mix(1.0, smoothstep(0.25 * S, 0.7 * S, sdRect(cc, uClearB)), clr.y);
  scale *= 1.0 + uPulse * (0.1 + 0.12 * h3);

  if (scale < 0.004) {
    gl_FragColor = vec4(0.0);
    return;
  }

  // gaze: one of 8 saccading targets
  int gi = int(h4 * 8.0);
  vec2 tgt = uGaze[0];
  for (int i = 1; i < 8; i++) {
    if (i == gi) tgt = uGaze[i];
  }
  vec2 eyeC = cc + jit * S;
  vec2 dv = tgt - eyeC;
  float dl = length(dv);
  vec2 g = rot2(dv / max(dl, 1e-3), -tilt) * min(dl / (0.55 * S), 1.0) * vec2(0.15, 0.082);
  g *= 1.0 - (center ? uLookViewer : 0.0);

  float heart = uHeartR > 0.0 ? 1.0 - smoothstep(uHeartR * 0.5, uHeartR, length(eyeC - uPost)) : 0.0;

  float eyePx = S * scale;
  vec2 e = (P - eyeC) / S;
  e.y -= sink * 0.16;
  e = rot2(e, -tilt);
  e /= scale * sq;
  vec3 iris = h8 < 0.3 ? TEAL : COBALT;
  gl_FragColor = drawEye(e, 1.0 / eyePx, open, g, iris, heart, h5, smoothstep(30.0, 110.0, eyePx), smoothstep(80.0, 160.0, eyePx));
}
`;

export const FOLLOWER_VERT = /* glsl */ `
attribute vec2 aPos;
attribute float aSize;
attribute float aOpen;
attribute vec2 aGaze;
attribute float aSpark;
attribute float aHeart;
attribute float aSeed;
uniform vec2 uSize;
varying vec2 vLocal;
varying float vPx;
varying float vOpen;
varying vec2 vGaze;
varying float vSpark;
varying float vHeart;
varying float vSeed;
void main() {
  vLocal = vec2(position.x, -position.y) * 1.3;
  vec2 p = aPos + vLocal * aSize;
  gl_Position = vec4(p.x / uSize.x * 2.0 - 1.0, 1.0 - p.y / uSize.y * 2.0, 0.0, 1.0);
  vPx = 1.0 / max(aSize, 0.001);
  vOpen = aOpen;
  vGaze = aGaze;
  vSpark = aSpark;
  vHeart = aHeart;
  vSeed = aSeed;
}
`;

export const FOLLOWER_FRAG = /* glsl */ `
precision highp float;
${COMMON}
varying vec2 vLocal;
varying float vPx;
varying float vOpen;
varying vec2 vGaze;
varying float vSpark;
varying float vHeart;
varying float vSeed;
void main() {
  float cell = 1.0 / vPx;
  vec4 c = drawEye(vLocal, vPx, vOpen, vGaze, SUN, vHeart, vSeed, smoothstep(30.0, 110.0, cell), 0.0);
  if (vSpark > 0.01) {
    vec2 a = abs(vLocal - vec2(0.42, -0.31));
    float r = 0.2 * vSpark;
    float e = sqrt(a.x) + sqrt(a.y) - sqrt(r);
    float w = fwidth(e) * 0.9;
    c = over(c, INK, 1.0 - smoothstep(-w, w, e - 0.1));
    c = over(c, PAPER, 1.0 - smoothstep(-w, w, e));
  }
  gl_FragColor = c;
}
`;
