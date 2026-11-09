/**
 * One material, three jobs: a real relief for the canyon flight, a flat inked
 * fingerprint from above, and a loupe that re-evaluates the ridges at higher
 * magnification. Colours are written straight in sRGB (no tone mapping), so
 * every shade stays a mix or overprint of the Riso inks.
 */
import { EDGE_N, FIELD_GLSL } from "./field";

const RIDGE_GLSL = /* glsl */ `
${FIELD_GLSL}
#define EDGE_N ${EDGE_N}

uint hash32(uint x) {
  x ^= x >> 16u; x *= 0x7feb352du;
  x ^= x >> 15u; x *= 0x846ca68bu;
  x ^= x >> 16u; return x;
}
float h01(uint x) { return float(hash32(x) & 0xffffffu) / 16777216.0; }

float ridgeNoise(int crest, float u, int cells, int salt) {
  float x = fract(u) * float(cells);
  int i = int(floor(x));
  float f = x - float(i);
  uint seed = uint(crest + 64) * 7919u + uint(salt) * 104729u;
  float a = h01(seed + uint(i % cells));
  float b = h01(seed + uint((i + 1) % cells));
  return mix(a, b, f * f * (3.0 - 2.0 * f));
}

float minutiaShield(vec2 p) {
  float m = 0.0;
  for (int i = 1; i < 5; i++) {
    if (i == 1) {
      float R = 3.2 * LAMBDA;
      float da = length(p - uPairA[1]) / R;
      float db = length(p - uPairB[1]) / R;
      m = max(m, 1.0 - clamp((da - 0.6) / 0.4, 0.0, 1.0));
      m = max(m, 1.0 - clamp((db - 0.6) / 0.4, 0.0, 1.0));
    } else {
      float d = length(p - 0.5 * (uPairA[i] + uPairB[i])) / (4.5 * LAMBDA);
      m = max(m, 1.0 - clamp((d - 0.6) / 0.4, 0.0, 1.0));
    }
  }
  return m;
}

void ridgeBreak(int c, float u, float near, out float gap, out float wob) {
  int cells = max(6, int(floor(float(c) * 1.7 + 4.5)));
  float g = ridgeNoise(c, u, cells, 1);
  float allow = (c >= 3 && c != EDGE_N) ? 1.0 - near : 0.0;
  float t = clamp((g - 0.8) / 0.07, 0.0, 1.0);
  gap = t * t * (3.0 - 2.0 * t) * allow;
  wob = (ridgeNoise(c, u, cells * 2, 2) - 0.5) * 0.24;
}

int bandOfCrest(int n) {
  if (n <= 2) return 0;
  if (n >= EDGE_N + 1) return 12;
  if (n == EDGE_N) return 11;
  return min(10, (n - 1) / 2);
}

struct Ridge { float ph; float F; vec2 grad; int crest; float u; float c; float gap; float wob; float sd; };

void ridgeAt(vec2 p, out Ridge r) {
  r.ph = phaseAt(p, r.F, r.grad);
  r.crest = int(floor(r.ph / PI2 + 0.5));
  r.c = cos(r.ph);
  r.u = atan(p.y - CORE.y, p.x - CORE.x) / PI2;
  ridgeBreak(r.crest, r.u, minutiaShield(p), r.gap, r.wob);
  r.sd = r.c - (0.05 + r.wob) - r.gap * 1.35;
}

float rimMask(vec2 p) { return 1.0 - smoothstep(0.9, 1.0, rimAt(p)); }
float heightT(float sd) { return smoothstep(-0.62, 0.95, sd); }
`;

const DUSK_GLSL = /* glsl */ `
uniform vec3 uInk, uPaper, uPink, uSun, uCobalt, uTeal, uHaze;
uniform vec2 uGlowDir;
uniform float uDusk;

// the horizon: cobalt thinned over ink, a low sun pass toward the core, the barest pink
// between them. Below the horizon it all falls back into bare ink.
vec3 duskAt(vec3 dir) {
  float e = clamp(dir.z, -0.3, 1.0);
  float az = pow(clamp(dot(normalize(dir.xy + 1e-5), uGlowDir) * 0.5 + 0.5, 0.0, 1.0), 12.0);
  float low = (1.0 - smoothstep(0.0, 0.26, e)) * smoothstep(-0.16, -0.015, e);
  vec3 base = mix(uInk, uHaze, low * low * 0.6);
  float glow = az * (1.0 - smoothstep(0.0, 0.07, abs(e)));
  base = mix(base, uSun, glow * 0.2);
  base = mix(base, uPink, glow * (1.0 - glow) * 0.1);
  return base;
}
`;

export const TERRAIN_VERT = /* glsl */ `
${RIDGE_GLSL}
uniform float uHeight;
varying vec2 vP;
varying vec3 vPos;

void main() {
  Ridge r;
  ridgeAt(position.xy, r);
  float z = uHeight * heightT(r.sd) * rimMask(position.xy);
  vP = position.xy;
  vPos = vec3(position.xy, z);
  gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
}
`;

export const TERRAIN_FRAG = /* glsl */ `
${RIDGE_GLSL}
${DUSK_GLSL}
uniform float uHeight, uTime, uFlat, uFogK, uDim, uScanY, uScanOn, uLensMag, uPen, uPenStart, uLod;
uniform vec3 uCam, uLens, uFocus;
uniform vec3 uBand[13];
uniform float uIgnite[13];
varying vec2 vP;
varying vec3 vPos;

float tri(float x) { return abs(fract(x) - 0.5) * 2.0; }
float cell(vec2 q) { return h01(uint(int(floor(q.x)) + 4096) * 15731u + uint(int(floor(q.y)) + 4096) * 789221u); }

// Each world prints its own micro-pattern on its walls. Returns a threshold field 0…1.
float worldPattern(int b, vec2 q) {
  float s = q.x;
  float t = q.y;
  if (b == 0) return tri(t * 7.0);                                                     // anchoring: scanlines
  if (b == 1) return tri(s * 0.5) * 0.92 + 0.04;                                       // sports: mown lanes
  if (b == 2) {                                                                        // rubik's: stickers
    vec2 f = abs(fract(vec2(s, t * 3.0)) - 0.5) * 2.0;
    return smoothstep(0.62, 0.86, max(f.x, f.y)) * 0.82 + 0.14 * cell(vec2(s, t * 3.0));
  }
  if (b == 3) return clamp(length((fract(vec2(s * 1.5, t * 4.5)) - 0.5) * 2.0), 0.0, 1.0);   // social: dots
  if (b == 4) return tri(s * 1.2 + t * 4.0);                                            // mun: placard hatch
  if (b == 5) return tri(s * 0.7 + abs(fract(t * 2.0) - 0.5) * 2.4);                     // moving: tape chevrons
  if (b == 6) {                                                                         // minecraft: voxel steps
    vec2 v = floor(vec2(s * 1.5, t * 4.0));
    return 0.18 + 0.72 * cell(v + vec2(3.0, 9.0));
  }
  if (b == 7) {                                                                         // startups: speed streaks
    float lane = floor(t * 6.0);
    float l = fract(s * 0.3 + cell(vec2(lane, 2.0)) * 7.0);
    return smoothstep(0.0, 0.55, l) * 0.86 + tri(t * 6.0) * 0.14;
  }
  if (b == 8) return min(tri(s * 2.0 + t * 7.0), tri(s * 2.0 - t * 7.0));                // fitness: knurl
  if (b == 9) {                                                                         // jee: graph paper
    float g = min(tri(s) , tri(t * 5.0));
    return smoothstep(0.06, 0.22, g);
  }
  if (b == 10) {                                                                        // hackathons: glyph hash
    vec2 v = vec2(s * 3.0, t * 7.0);
    float on = cell(floor(v));
    vec2 f = abs(fract(v) - 0.5) * 2.0;
    return step(0.5, on) * smoothstep(0.1, 0.5, min(f.x, f.y)) * 0.8 + (1.0 - step(0.5, on)) * 0.95;
  }
  return length((fract(vec2(s * 1.4, t * 4.0)) - 0.5) * 2.0);
}

void main() {
  vec2 p = vP;
  float lens = 0.0;
  if (uLens.z > 0.0) {
    vec2 d = p - uLens.xy;
    float l = length(d) / uLens.z;
    lens = 1.0 - smoothstep(0.985, 1.0, l);
    p = uLens.xy + d * mix(1.0, 1.0 / uLensMag, lens);
  }

  Ridge r;
  ridgeAt(p, r);
  int band = bandOfCrest(r.crest);

  // ridge phase per pixel (analytic, so vortex cuts leave no derivative seam)
  vec2 dx = dFdx(p);
  vec2 dy = dFdy(p);
  float w = length(vec2(dot(r.grad, dx), dot(r.grad, dy)));
  float a = max(0.02, w * 0.78);
  float inside = rimMask(p);

  float mask = smoothstep(-a, a, r.sd);
  mask = mix(mask, 0.46, smoothstep(1.4, 3.4, w));

  // ink: dormant graphite until the band's fuse has burned past this point
  float ign = uIgnite[band];
  vec3 inkCol;
  float spark = 0.0;
  if (band == 11) {
    float ad = fract(r.u - uPenStart);
    float on = 1.0 - smoothstep(uPen - 0.006, uPen, ad);
    inkCol = mix(uBand[12], uBand[11], on);
    // the pen tip never quite rests: it keeps glowing where the line is still being drawn
    spark = on * (1.0 - smoothstep(0.0, 0.03, uPen - ad)) * step(0.001, uPen) * (0.72 + 0.28 * sin(uTime * 2.3));
  } else if (band == 12) {
    inkCol = uBand[12];
  } else {
    float seed = fract(float(band) * 0.618 + 0.21);
    float ad = abs(fract(r.u - seed + 0.5) - 0.5) * 2.0;
    float front = ign * 1.2 - ad;
    float on = smoothstep(0.0, 0.1, front);
    // even asleep, each band keeps a low ember of its own ink
    inkCol = mix(mix(uBand[12], uBand[band], 0.3), uBand[band], on);
    spark = (1.0 - smoothstep(0.0, 0.16, abs(front - 0.05))) * step(0.001, ign) * (1.0 - smoothstep(0.92, 1.0, ign));
  }

  /* ------------------------------------------------------ the inked print */
  vec3 flatC = mix(uInk, inkCol, mask);
  // soft ink gain just around each ridge
  flatC += inkCol * 0.07 * smoothstep(-0.9, 0.0, r.sd) * (1.0 - mask);
  // a thin second pass off-register: the riso layer that never lines up perfectly
  flatC += mix(uPaper, inkCol, 0.3) * 0.13 * smoothstep(0.55, 0.98, r.sd) * mask;

  /* --------------------------------------------------- the canyon surface */
  vec3 col = flatC;
  if (uFlat < 0.999) {
    float h = heightT(r.sd);
    float tt = clamp((r.sd + 0.62) / 1.57, 0.0, 1.0);
    float dh = 6.0 * tt * (1.0 - tt) / 1.57;
    vec2 g = -uHeight * dh * sin(r.ph) * r.grad * inside;
    vec3 N = normalize(vec3(-g, 1.0));
    vec3 toCam = uCam - vPos;
    float dist = length(toCam);
    vec3 V = toCam / dist;
    float face = clamp(dot(N, V), 0.0, 1.0);
    // key from the core end of the canyon, fill from the camera
    vec3 L = normalize(vec3(uGlowDir, 0.34));
    float key = clamp(dot(N, L), 0.0, 1.0);
    float tone = h * h * (0.42 + 0.8 * pow(face, 1.4) + 0.22 * key);
    tone = clamp(tone, 0.0, 1.0);

    // world pattern on the walls, dissolving as the footprint grows
    float perLambda = w / PI2;
    float detail = 1.0 - smoothstep(0.022, 0.09, perLambda) * uLod;
    int crestN = max(1, r.crest);
    float cellsS = max(8.0, floor(float(crestN) * 6.2832 * 0.9));
    vec2 q = vec2(r.u * cellsS, r.ph / PI2);
    float pat = worldPattern(band, q);
    float aa = clamp(perLambda * 7.0, 0.015, 0.5);
    float d = smoothstep(pat - aa, pat + aa, tone * 1.18);
    d = mix(tone, d, detail);

    vec3 valley = mix(uInk, uHaze, 0.3);
    vec3 surf = mix(valley, inkCol, d);
    surf = mix(surf, uInk, smoothstep(0.4, -0.3, r.sd) * 0.72);
    // hot crest line
    float crest = smoothstep(0.62 - a, 0.92 + a, r.sd);
    surf = mix(surf, mix(inkCol, uPaper, 0.52), crest);
    // inner glow of the ink itself, so the crests read as light from a distance
    surf += inkCol * 0.18 * smoothstep(-0.2, 0.9, r.sd);

    // cobalt haze eats the distance, the core glows low at the far end
    float fog = 1.0 - exp(-dist * uFogK);
    vec3 fogC = duskAt(normalize(vec3(-V.xy, 0.012)));
    surf = mix(surf, fogC, clamp(fog, 0.0, 1.0));
    col = mix(surf, flatC, uFlat);
  }

  // spark at the burning front / the pen tip
  col = mix(col, uPaper, spark * 0.7 * mask);

  // the scan head warms each ridge as it passes (a lift, never a flash)
  if (uScanOn > 0.0) {
    float sc = 1.0 - smoothstep(0.0, 0.05, abs(p.y - uScanY));
    col = mix(col, mix(col, uPaper, 0.55), sc * uScanOn * mask);
  }

  // focus: everything but the minutia sinks into the ink
  if (uFocus.z > 0.0) {
    float f = 1.0 - smoothstep(uFocus.z * 0.5, uFocus.z, length(p - uFocus.xy));
    col = mix(mix(uInk, col, 0.34), col, max(f, lens));
  }

  col = mix(col, uInk, (1.0 - inside) * (uFlat * 0.999 + (1.0 - uFlat) * 0.6));
  col = mix(col, uInk, uDim * (1.0 - lens));

  gl_FragColor = vec4(col, 1.0);
}
`;

export const SKY_VERT = /* glsl */ `
varying vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`;

export const SKY_FRAG = /* glsl */ `
${DUSK_GLSL}
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform float uDpr;
varying vec2 vNdc;

void main() {
  vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
  vec3 dir = normalize(mat3(uCamWorld) * (v.xyz / v.w));
  vec3 c = duskAt(dir);
  // printed in dots: a coarse screen dissolving the sky into bare ink
  vec2 g = gl_FragCoord.xy / (uDpr * 6.0);
  vec2 rot = mat2(0.7071, -0.7071, 0.7071, 0.7071) * g;
  float dot_ = length(fract(rot) - 0.5) * 1.414;
  float e = clamp(dir.z, 0.0, 1.0);
  float density = 1.0 - smoothstep(0.08, 0.55, e);
  float dots = smoothstep(density + 0.08, density - 0.08, dot_);
  vec3 col = mix(uInk, c, mix(0.25, 1.0, dots));
  gl_FragColor = vec4(mix(uInk, col, uDusk), 1.0);
}
`;

export const MOTE_VERT = /* glsl */ `
uniform float uTime, uSize, uDusk;
uniform vec3 uCam;
attribute vec3 aSeed;
varying float vA;

void main() {
  // motes live in a tube around the camera and wrap, so 180 of them are always near
  vec3 box = vec3(0.34, 0.34, 0.05);
  vec3 q = vec3(
    aSeed.x * box.x + uTime * (0.002 + aSeed.z * 0.003),
    aSeed.y * box.y - uTime * 0.0015,
    aSeed.z * box.z + uTime * 0.0012 * (aSeed.x - 0.5));
  vec3 d = mod(q - uCam + 0.5 * box, box) - 0.5 * box;
  vec3 w = uCam + d;
  w.z = 0.012 + mod(aSeed.z * box.z + uTime * 0.0012, 0.04);
  vec4 mv = viewMatrix * vec4(w, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = max(0.01, -mv.z);
  gl_PointSize = clamp(uSize * (0.004 + aSeed.x * 0.006) / depth, 1.0, 7.0);
  vA = uDusk * (1.0 - smoothstep(0.08, 0.34, depth)) * smoothstep(0.008, 0.02, depth) * (0.1 + 0.4 * aSeed.y);
}
`;

export const MOTE_FRAG = /* glsl */ `
uniform vec3 uTint;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.25, d) * vA;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uTint, a);
}
`;
