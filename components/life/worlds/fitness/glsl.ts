/**
 * Two full-screen passes (WebGL2, raw):
 *
 *  FIELD (low-res, ping-pong) — the analytic body heat (16 tapered capsules,
 *  smooth-unioned) + the live layer that persists between frames: handprints
 *  and motion trails that diffuse and cool every frame.
 *    out = (prints, trails, bodyHeat|halo, inside) — heat stored × 0.5
 *
 *  COMPOSITE (full-res) — cold field, heat-type on the wall, the body, the
 *  ice-cold barbell, food, sweat flecks and the lamp, then sensor noise,
 *  scan bands, vignette and the thermal ramp (Riso inks only).
 */

export const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const COMMON = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
`;

export const FIELD_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;

uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uStage;
uniform vec4 uCapP[16];
uniform vec4 uCapR[16];
uniform int uCapN;
uniform float uK;
uniform float uEdge;
uniform float uFall;
uniform float uHaloR;
uniform float uHaloAmt;
uniform float uMottle;
uniform float uTime;
uniform vec2 uDecay;
uniform float uDiffuse;
uniform float uDeposit;
uniform float uFloor8;
uniform vec4 uStamp;   // x, y, size, amount
uniform vec4 uStampM;  // cos, sin, mirror, temperature
uniform vec4 uTrail;   // x, y, radius, amount
${COMMON}

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// tapered capsule from a (radius ra) to b (radius rb)
float sdTaper(vec2 p, vec2 a, vec2 b, float ra, float rb) {
  vec2 ba = b - a;
  float h = length(ba);
  if (h < 1e-3) return length(p - a) - max(ra, rb);
  vec2 d = ba / h;
  vec2 q = vec2(abs(dot(p - a, vec2(-d.y, d.x))), dot(p - a, d));
  float bb = clamp((ra - rb) / h, -0.98, 0.98);
  float aa = sqrt(1.0 - bb * bb);
  float k = dot(q, vec2(-bb, aa));
  if (k < 0.0) return length(q) - ra;
  if (k > aa * h) return length(q - vec2(0.0, h)) - rb;
  return dot(q, vec2(aa, bb)) - ra;
}

// a hand pressed flat, fingers up (hand units: wrist ≈ y −0.45, fingertip ≈ y 0.52)
float sdHand(vec2 q) {
  float f = sdRoundBox(q - vec2(0.0, -0.13), vec2(0.165, 0.185), 0.075);
  f = min(f, sdCapsule(q, vec2(-0.125, 0.06), vec2(-0.16, 0.39), 0.047));
  f = min(f, sdCapsule(q, vec2(-0.04, 0.08), vec2(-0.046, 0.47), 0.05));
  f = min(f, sdCapsule(q, vec2(0.048, 0.07), vec2(0.07, 0.43), 0.048));
  f = min(f, sdCapsule(q, vec2(0.13, 0.03), vec2(0.185, 0.3), 0.042));
  f = min(f, sdCapsule(q, vec2(-0.17, -0.17), vec2(-0.355, 0.05), 0.056));
  return f;
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uStage;

  // ---- the body (analytic, deterministic in progress)
  float dmin = 1e4;
  float wsum = 0.0;
  float tsum = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= uCapN) break;
    vec4 P = uCapP[i];
    vec4 R = uCapR[i];
    float d = sdTaper(px, P.xy, P.zw, R.x, R.y);
    dmin = smin(dmin, d, uK);
    float w = exp(-max(d, 0.0) / uFall) + 1e-5;
    vec2 ba = P.zw - P.xy;
    float along = clamp(dot(px - P.xy, ba) / max(dot(ba, ba), 1e-3), 0.0, 1.0);
    float belly = 1.0 + R.w * (-0.14 + 0.24 * sin(3.14159 * along));
    wsum += w;
    tsum += w * R.z * belly;
  }
  float T = tsum / wsum;
  float inside = smoothstep(uEdge, -uEdge, dmin);
  float depth = clamp(-dmin / (uK * 2.6), 0.0, 1.0);
  float mott = vnoise(px / (uK * 1.7) + vec2(0.0, uTime * 0.12)) - 0.5;
  float Tb = T * (0.8 + 0.27 * depth + mott * uMottle);
  float halo = T * uHaloAmt * exp(-max(dmin, 0.0) / uHaloR);
  float Tc = Tb * inside + halo * (1.0 - inside);

  // ---- the live layer: diffuse + cool, then deposit
  vec2 c = texture(uPrev, vUv).rg;
  vec2 n = texture(uPrev, vUv + vec2(uTexel.x, 0.0)).rg + texture(uPrev, vUv - vec2(uTexel.x, 0.0)).rg
         + texture(uPrev, vUv + vec2(0.0, uTexel.y)).rg + texture(uPrev, vUv - vec2(0.0, uTexel.y)).rg;
  vec2 live = (mix(c, n * 0.25, uDiffuse) * 2.0) * uDecay - uFloor8;
  live = max(live, 0.0);
  live.g += uDeposit * inside * T;
  if (uStamp.w > 0.0) {
    vec2 q = (px - uStamp.xy) / uStamp.z;
    q.y = -q.y;
    q = vec2(uStampM.x * q.x - uStampM.y * q.y, uStampM.y * q.x + uStampM.x * q.y);
    q.x *= uStampM.z;
    float m = smoothstep(0.03, -0.025, sdHand(q));
    live.r = max(live.r, m * uStamp.w * uStampM.w);
  }
  if (uTrail.w > 0.0) {
    vec2 dv = px - uTrail.xy;
    live.r = max(live.r, uTrail.w * exp(-dot(dv, dv) / (uTrail.z * uTrail.z)));
  }
  o = vec4(min(live, vec2(1.6)) * 0.5, Tc * 0.5, inside);
}`;

export const COMP_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;

uniform sampler2D uField;
uniform sampler2D uWordsA;
uniform sampler2D uWordsB;
uniform vec2 uStage;
uniform float uDpr;
uniform float uTime;
uniform vec3 uStops[6];
uniform vec3 uStopsB[6];
uniform float uModeMix;
uniform float uVisible;
uniform vec3 uVis[4];      // wall, floor, body, bar
uniform vec4 uWordT;       // masks 0–3 (headline, discipline, training, nutrition)
uniform float uWordT4;     // consistency
uniform vec4 uWordBlur;
uniform float uWordBlur4;
uniform float uGlowLod;
uniform vec4 uBar;         // x0, y, x1, half thickness
uniform vec4 uPlates[3];   // centre offset, half w, half h, 0
uniform vec4 uHands;       // lx, ly, rx, ry
uniform vec2 uHandT;       // temperature, radius
uniform vec4 uFood[3];     // x, y, size, alpha
uniform vec4 uRing;        // x, y, radius, amount
uniform vec4 uFleck[14];   // x, y, r, alpha
uniform int uFleckN;
uniform vec4 uLamp;        // x, y, box size, amount
uniform float uLampSharp;
uniform vec4 uEnv;         // floorY, wallY, bloom, exitK
uniform vec4 uEnv2;        // fh, chestX, chestY, footT
uniform vec2 uFeet;        // foot x (left, right)
uniform float uExposure;
uniform float uNoise;
${COMMON}

vec3 rampAt(float t, vec3 s0, vec3 s1, vec3 s2, vec3 s3, vec3 s4, vec3 s5) {
  float x = clamp(t, 0.0, 1.0) * 5.0;
  vec3 c = mix(s0, s1, clamp(x, 0.0, 1.0));
  c = mix(c, s2, clamp(x - 1.0, 0.0, 1.0));
  c = mix(c, s3, clamp(x - 2.0, 0.0, 1.0));
  c = mix(c, s4, clamp(x - 3.0, 0.0, 1.0));
  c = mix(c, s5, clamp(x - 4.0, 0.0, 1.0));
  return c;
}

float sdQuad(vec2 p, vec2 v0, vec2 v1, vec2 v2, vec2 v3) {
  vec2 v[4] = vec2[4](v0, v1, v2, v3);
  float d = dot(p - v[0], p - v[0]);
  float s = 1.0;
  for (int i = 0; i < 4; i++) {
    int j = i == 0 ? 3 : i - 1;
    vec2 e = v[j] - v[i];
    vec2 w = p - v[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 cc = bvec3(p.y >= v[i].y, p.y < v[j].y, e.x * w.y > e.y * w.x);
    if (all(cc) || all(not(cc))) s *= -1.0;
  }
  return s * sqrt(d);
}

// the desk lamp portal icon, in its 100×100 box (y down)
float sdLamp(vec2 q) {
  vec2 e = (q - vec2(28.0, 94.0)) / vec2(18.0, 14.5);
  float dome = max((length(e) - 1.0) * 14.0, q.y - 94.0);
  float d = dome;
  d = min(d, sdCapsule(q, vec2(28.0, 82.0), vec2(46.0, 48.0), 3.85));
  d = min(d, length(q - vec2(46.0, 48.0)) - 6.5);
  d = min(d, sdCapsule(q, vec2(45.5, 46.8), vec2(60.6, 35.3), 3.64));
  d = min(d, sdQuad(q, vec2(56.0, 22.0), vec2(76.0, 12.0), vec2(98.0, 50.0), vec2(64.0, 64.0)));
  return d;
}

float sdBar(vec2 p) {
  float cxb = (uBar.x + uBar.z) * 0.5;
  float halfLen = (uBar.z - uBar.x) * 0.5;
  vec2 q = vec2(abs(p.x - cxb), p.y - uBar.y);
  float d = sdRoundBox(q - vec2(halfLen * 0.5, 0.0), vec2(halfLen * 0.5 + uBar.w * 3.0, uBar.w), uBar.w * 0.6);
  for (int i = 0; i < 3; i++) {
    vec4 P = uPlates[i];
    d = min(d, sdRoundBox(q - vec2(P.x, 0.0), P.yz, min(P.y, P.z) * 0.55));
  }
  return d;
}

float sdFood(int kind, vec2 q) {
  if (kind == 0) {
    float rx = q.y < 0.0 ? 0.34 : 0.4;
    return (length(vec2(q.x / rx, q.y / 0.5)) - 1.0) * 0.36;
  }
  if (kind == 1) {
    float bowl = max(length(q - vec2(0.0, -0.08)) - 0.5, -(q.y + 0.08));
    float rim = sdRoundBox(q - vec2(0.0, -0.1), vec2(0.56, 0.045), 0.04);
    float heap = max(length(q - vec2(0.0, -0.06)) - 0.36, q.y + 0.1);
    return min(min(bowl, rim), heap);
  }
  float body = sdRoundBox(q - vec2(0.0, 0.1), vec2(0.25, 0.38), 0.09);
  float cap = sdRoundBox(q - vec2(0.0, -0.37), vec2(0.21, 0.1), 0.04);
  float spout = sdRoundBox(q - vec2(0.0, -0.52), vec2(0.06, 0.07), 0.025);
  return min(min(body, cap), spout);
}

void main() {
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uStage;
  float aa = 0.85 / uDpr;
  float floorY = uEnv.x;
  float fh = uEnv2.x;
  float bloom = uEnv.z;

  // ---- the room: cold air, a lukewarm wall band, a colder floor
  float Tbg = 0.052 + 0.05 * exp(-pow((px.y - uEnv.y) / (uStage.y * 0.3), 2.0))
            * (1.0 - 0.45 * pow(abs(vUv.x - 0.5) * 2.0, 2.0));
  float below = smoothstep(floorY - 1.0, floorY + 1.0, px.y);
  Tbg = mix(Tbg, 0.034 + 0.03 * clamp((px.y - floorY) / max(uStage.y - floorY, 1.0), 0.0, 1.0), below);
  Tbg -= 0.03 * exp(-abs(px.y - floorY) / 1.6);
  vec2 fl = vec2((px.x - uFeet.x) / (fh * 0.075), (px.y - floorY - fh * 0.014) / (fh * 0.022));
  vec2 fr = vec2((px.x - uFeet.y) / (fh * 0.075), fl.y);
  Tbg += uEnv2.w * (exp(-dot(fl, fl)) + exp(-dot(fr, fr))) * below;
  vec2 dc = px - uEnv2.yz;
  Tbg += bloom * 0.17 * exp(-dot(dc, dc) / pow(fh * 0.75, 2.0));

  // ---- heat-type branded on the wall: crisp brand, then it bleeds
  vec2 wuv = vec2(vUv.x, 1.0 - vUv.y);
  vec4 sA = texture(uWordsA, wuv);
  vec4 gA = textureLod(uWordsA, wuv, uGlowLod);
  vec4 hA = textureLod(uWordsA, wuv, uGlowLod + 1.7);
  float sB = texture(uWordsB, wuv).r;
  float gB = textureLod(uWordsB, wuv, uGlowLod).r;
  float hB = textureLod(uWordsB, wuv, uGlowLod + 1.7).r;
  vec4 mA = mix(sA, gA * 1.08, uWordBlur);
  float mB = mix(sB, gB * 1.08, uWordBlur4);
  float Tw = max(max(mA.y * uWordT.y, mA.z * uWordT.z), mA.w * uWordT.w);
  Tw = max(Tw, mB * uWordT4);
  float glow = dot(hA, uWordT * (0.18 + 0.4 * uWordBlur)) + hB * uWordT4 * (0.18 + 0.4 * uWordBlur4);
  float Tenv = max(Tbg, Tw) + glow * 0.55;

  // ---- the body + the live layer (the halo blends with the wall, it never stacks on it)
  vec4 f = texture(uField, vUv);
  float inside = f.a;
  float bodyT = f.b * 2.0;
  float T = mix(max(bodyT, Tenv) + 0.3 * min(bodyT, Tenv), bodyT, inside);
  T += f.g * 2.0 * 0.55;
  T = max(T, f.r * 2.0);

  // the title card's headline floats in front of the cold figure
  T = max(T, mA.x * uWordT.x);

  // ---- metal reads cold: the barbell (warm only where the hands grip)
  float db = sdBar(px);
  float barM = smoothstep(aa, -aa, db);
  vec2 hl = px - uHands.xy;
  vec2 hr = px - uHands.zw;
  float grip = uHandT.x * 0.7 * max(exp(-length(hl) / (fh * 0.035)), exp(-length(hr) / (fh * 0.035)));
  T = mix(T, 0.012 + grip, barM);
  T = mix(T, 0.24, exp(-pow(db / (1.15 / uDpr + 0.55), 2.0)) * 0.85);
  vec2 fist = vec2(uHandT.y * 1.12, uHandT.y * 0.86);
  float dh = min(sdRoundBox(hl, fist, uHandT.y * 0.6), sdRoundBox(hr, fist, uHandT.y * 0.6));
  float hm = smoothstep(aa, -aa, dh);
  T = mix(T, uHandT.x, hm);

  // ---- food: cold, dark, outlined; a heat ring when absorbed
  for (int i = 0; i < 3; i++) {
    vec4 F = uFood[i];
    if (F.w <= 0.001) continue;
    float d = sdFood(i, (px - F.xy) / F.z) * F.z;
    T = mix(T, 0.02, smoothstep(aa, -aa, d) * F.w);
    T = mix(T, 0.24, exp(-pow(d / (1.15 / uDpr + 0.55), 2.0)) * 0.85 * F.w);
  }
  if (uRing.w > 0.001) {
    float rr = length(px - uRing.xy) - uRing.z;
    T += uRing.w * 0.34 * exp(-pow(rr / (fh * 0.032), 2.0));
  }

  // ---- sweat flecks: evaporation reads cold
  for (int i = 0; i < 14; i++) {
    if (i >= uFleckN) break;
    vec4 F = uFleck[i];
    if (F.w <= 0.001) continue;
    float d = length(px - F.xy) - F.z * clamp(F.w * 1.6, 0.0, 1.0);
    T = mix(T, 0.03, smoothstep(aa, -aa, d));
    T = mix(T, 0.22, exp(-pow(d / 0.9, 2.0)) * 0.6 * F.w);
  }

  // ---- auto-range: something hotter entered the frame
  T *= uEnv.w;

  float lampM = 0.0;
  if (uLamp.w > 0.001) {
    float d = sdLamp((px - uLamp.xy) / uLamp.z * 100.0) * uLamp.z / 100.0;
    float soft = mix(uLamp.z * 0.16, aa, uLampSharp);
    lampM = smoothstep(soft, -soft, d) * uLamp.w;
    float halo = exp(-max(d, 0.0) / (uLamp.z * 0.2));
    T = mix(T, 1.14, lampM);
    T += 0.3 * halo * uLamp.w * (1.0 - lampM);
  }

  // ---- the sensor: noise, fixed-pattern columns, scan bands, lens falloff
  vec2 cell = floor(gl_FragCoord.xy / max(uDpr, 1.0));
  float tn = floor(uTime * 24.0);
  float nse = hash12(cell + tn * 37.0) - 0.5;
  T += nse * uNoise * (0.55 + 0.45 * smoothstep(0.0, 0.6, T));
  T += (hash12(vec2(floor(px.x * 0.5), 7.0)) - 0.5) * 0.007;
  T += 0.009 * sin(px.y * 0.04 - uTime * 1.6) * (0.6 + 0.4 * sin(px.y * 0.006 + uTime * 0.35));
  vec2 vv = (vUv - 0.5) * vec2(uStage.x / uStage.y, 1.0);
  float vig = dot(vv, vv);
  T -= 0.1 * vig;
  T *= uExposure;

  vec3 cA = rampAt(T, uStops[0], uStops[1], uStops[2], uStops[3], uStops[4], uStops[5]);
  vec3 cB = rampAt(T, uStopsB[0], uStopsB[1], uStopsB[2], uStopsB[3], uStopsB[4], uStopsB[5]);
  vec3 col = mix(cA, cB, uModeMix);

  if (uVisible > 0.001) {
    // the boring truth: flat greys, no heat anywhere
    vec3 vis = mix(uVis[0], uVis[1], below);
    vis *= 1.0 - 0.18 * vig;
    vis = mix(vis, uVis[2], inside);
    vis = mix(vis, uVis[3], barM);
    vis = mix(vis, uVis[2] * 0.92, hm);
    for (int i = 0; i < 3; i++) {
      vec4 F = uFood[i];
      if (F.w <= 0.001) continue;
      float d = sdFood(i, (px - F.xy) / F.z) * F.z;
      vis = mix(vis, uVis[3] * 1.6, smoothstep(aa, -aa, d) * F.w);
    }
    vis = mix(vis, uVis[2], lampM);
    vis += nse * 0.025;
    col = mix(col, vis, uVisible);
  }

  col *= 1.0 - 0.38 * smoothstep(0.3, 1.25, vig);
  o = vec4(col, 1.0);
}`;
