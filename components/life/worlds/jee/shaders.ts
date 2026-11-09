/**
 * All GLSL for the room. Everything is display-referred: colours are mixed
 * directly in sRGB so the palette's hexes land on screen exactly, the way
 * riso inks are specified.
 */

import { RISO } from "@/components/life/multiverse/palette";

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return `vec3(${(((n >> 16) & 255) / 255).toFixed(4)}, ${(((n >> 8) & 255) / 255).toFixed(4)}, ${((n & 255) / 255).toFixed(4)})`;
};

export const INKS = /* glsl */ `
  const vec3 PAPER = ${hex(RISO.paper)};
  const vec3 INK = ${hex(RISO.ink)};
  const vec3 SUN = ${hex(RISO.sun)};
  const vec3 COBALT = ${hex(RISO.cobalt)};
`;

const NOISE = /* glsl */ `
  float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
  }
  float grain(vec2 c){ return h21(mod(c, 1024.)); }
`;

/** Wall light → ink ramp, shared by walls and desk. */
const TONE = /* glsl */ `
  vec3 tone(float e, vec3 warm, float g){
    float t = 1. - exp(-max(e, 0.) * 1.75);
    t += (g - .5) * .05 * (1. - t * .7) * smoothstep(0., .2, t);
    vec3 amber = mix(INK, SUN, .62);
    vec3 c = mix(INK, amber, smoothstep(0., .5, t));
    return mix(c, warm, smoothstep(.34, .96, t));
  }
`;

export const WALL_VERT = /* glsl */ `
  varying vec3 vP;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.);
    vP = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export const wallFrag = (slabs: number) => /* glsl */ `
  precision highp float;
  #define N_SLABS ${slabs}
  ${INKS}
  ${NOISE}
  ${TONE}
  varying vec3 vP;
  uniform vec3 uLamp, uAxis;
  uniform float uPower, uConeIn, uConeOut;
  uniform float uLeft, uLock, uSoft, uGlint, uGlintX, uIgnite, uShape, uAlpha, uGain, uRoom, uWarp, uPhase, uWinA, uCeil;
  uniform vec2 uShear;
  uniform vec4 uBox, uWin;
  uniform vec3 uSky, uNext;
  uniform vec4 uS[N_SLABS];
  uniform vec2 uR[N_SLABS];

  float sdBox(vec2 p, vec2 a, vec2 b){
    vec2 c = .5 * (a + b), h = .5 * (b - a);
    vec2 d = abs(p - c) - h;
    return length(max(d, 0.)) + min(max(d.x, d.y), 0.);
  }
  float sdRound(vec2 p, vec2 a, vec2 b, float r){
    vec2 c = .5 * (a + b), h = .5 * (b - a) - r;
    vec2 d = abs(p - c) - h;
    return length(max(d, 0.)) + min(max(d.x, d.y), 0.) - r;
  }

  // Glyph parts overlap where they join, so no anti-aliased seam can open inside a letter.
  float sdJ(vec2 p){
    float d = min(sdBox(p, vec2(.3081, .2), vec2(.5097, 1.)), sdBox(p, vec2(.0213, .2), vec2(.219, .4709)));
    vec2 oc = (p - vec2(.2655, .2229)) / vec2(.2442, .2326);
    float o = max((length(oc) - 1.) * .2326, p.y - .26);
    vec2 ic = (p - vec2(.2635, .2229)) / vec2(.0445, .0485);
    o = max(o, -(length(ic) - 1.) * .0445);
    o = max(o, -sdBox(p, vec2(.219, .2229), vec2(.3081, 1.1)));
    return min(d, o);
  }
  float sdE(vec2 p, float x){
    p.x -= x;
    float d = sdBox(p, vec2(.0446, 0.), vec2(.2481, 1.));
    d = min(d, sdBox(p, vec2(.2, 0.), vec2(.4574, .1957)));
    d = min(d, sdBox(p, vec2(.2, .4225), vec2(.436, .6124)));
    return min(d, sdBox(p, vec2(.2, .8062), vec2(.4438, 1.)));
  }
  float sdJEE(vec2 p){ return min(sdJ(p), min(sdE(p, .5422), sdE(p, 1.0208))); }
  float sdIIT(vec2 p){
    float d = min(sdBox(p, vec2(.0349, 0.), vec2(.2287, 1.)), sdBox(p, vec2(.2983, 0.), vec2(.4921, 1.)));
    d = min(d, sdBox(p, vec2(.6566, 0.), vec2(.8563, .9)));
    return min(d, sdBox(p, vec2(.5384, .8062), vec2(.9745, 1.)));
  }
  // PORTAL_ICONS.laptop in icon units, y down: rect 14 8 72 52 r5, then M4 64 H96 L88 78 H12 Z
  float sdLaptop(vec2 p){
    float screen = sdRound(p, vec2(14., 8.), vec2(86., 60.), 5.);
    float slant = dot(vec2(abs(p.x - 50.) - 46., p.y - 64.), vec2(.8682, .4961));
    float base = max(max(64. - p.y, p.y - 78.), slant);
    return min(screen, base);
  }

  float target(vec2 q){
    if (uShape < .5) return sdJEE((q - uBox.xy) / uBox.zw) * min(uBox.z, uBox.w);
    if (uShape < 1.5) return sdIIT((q - uBox.xy) / uBox.zw) * min(uBox.z, uBox.w);
    vec2 p = vec2((q.x - uBox.x) / uBox.z, (uBox.y - q.y) / uBox.z) * 100.;
    return sdLaptop(p) * uBox.z / 100.;
  }

  float slabs(vec2 q){
    float d = 1e3;
    for (int i = 0; i < N_SLABS; i++) {
      vec2 p = q - uS[i].xy;
      vec2 r = uR[i];
      p = vec2(r.x * p.x + r.y * p.y, -r.y * p.x + r.x * p.y);
      vec2 e = abs(p) - uS[i].zw;
      d = min(d, length(max(e, 0.)) + min(max(e.x, e.y), 0.));
    }
    return d;
  }

  // The silhouette: exact at the solve angles, warped into a tangle between them.
  float field(vec2 q){
    if (uLock > .999) return target(q);
    vec2 sq = vec2(q.x + uShear.x * q.y + uShear.y, q.y);
    if (uWarp > .001) {
      sq += uWarp * (vec2(vnoise(q * vec2(.62, .85) + uPhase), vnoise(q * vec2(.9, .58) - uPhase + 11.)) - .5);
    }
    float s = slabs(sq);
    return uLock < .001 ? s : mix(s, target(q), uLock);
  }

  void main(){
    bool left = uLeft > .5;
    vec2 q = left ? vec2(-vP.z, vP.y) : vec2(vP.x, vP.y);
    vec3 N = left ? vec3(1., 0., 0.) : vec3(0., 0., 1.);

    vec3 toL = uLamp - vP;
    float d2 = dot(toL, toL);
    vec3 L = toL / sqrt(d2);
    float spot = smoothstep(uConeOut, uConeIn, dot(-L, uAxis));
    float ndl = max(dot(N, L), 0.);
    float E = uPower * uGain * spot * ndl * 6.4 / (1. + d2 * .075);

    // hand-floated plaster, seam occlusion, a little bounce off the desk
    float plaster = vnoise(q * 2.3) * .55 + vnoise(q * 6.1 + 3.) * .3 + vnoise(q * .7 + 9.) * .9;
    E *= .9 + plaster * .1;
    float corner = left ? (3.2 - q.x) : (q.x + 3.2);
    E *= .58 + .42 * smoothstep(0., .9, min(q.y * .9, corner));
    E += uPower * uGain * spot * .05 * smoothstep(1.6, 0., q.y);
    // the top lip of the shade cuts the beam (phones keep the copy band dark with it)
    E *= 1. - smoothstep(uCeil - .5, uCeil + .32, q.y);

    float g = grain(gl_FragCoord.xy);
    vec3 warm = mix(PAPER, SUN, .1);
    vec3 lit = tone(E, warm, g);

    float d = uAlpha > .001 ? field(q) : 1.;
    float aa = fwidth(d) * .75;
    float pen = uSoft * (.45 + q.y * .3);
    float sh = uAlpha * (1. - smoothstep(-aa - pen, aa + pen, d));
    float fill = 1. - exp(-E * 1.2);
    vec3 shadow = mix(INK, COBALT, .06 * fill) * mix(.8, 1., fill);
    vec3 c = mix(lit, shadow, sh);

    // the rim catches the lamp as the shape locks: one travelling glint, on the outer edge only
    if (uGlint > .001) {
      float rim = smoothstep(.1, .012, d) * smoothstep(-.006, .012, d);
      float sweep = exp(-pow((q.x + q.y * .42 - uGlintX) / 1.05, 2.));
      c = mix(c, mix(SUN, PAPER, .35), rim * uGlint * (.32 + sweep * .68) * fill);
    }

    // time-lapse window, left wall only
    if (left && uWinA > .001) {
      vec2 c0 = (uWin.xz + uWin.yw) * .5;
      vec2 h0 = (uWin.yw - uWin.xz) * .5;
      vec2 cc = q - c0;
      float wa = fwidth(q.x) * 1.2;
      // glass light falling on the plaster around it
      float halo = exp(-max(length(max(abs(cc) - h0, 0.)), 0.) * 2.6);
      c += uSky * .1 * halo * uWinA;
      vec3 frameC = mix(mix(INK, SUN, .3), mix(PAPER, SUN, .05), clamp(fill * 1.25, 0., 1.));
      float frame = sdBox(cc, -h0 - .085, h0 + .085);
      float sill = sdBox(cc, vec2(-h0.x - .17, -h0.y - .17), vec2(h0.x + .17, -h0.y - .085));
      c = mix(c, frameC, (1. - smoothstep(-wa, wa, min(frame, sill))) * uWinA);
      float pane = sdBox(cc, -h0, h0);
      if (pane < wa) {
        float bar = min(abs(cc.x), abs(cc.y)) - .022;
        vec3 sky = uSky * mix(1.08, .84, smoothstep(-h0.y, h0.y, cc.y));
        vec3 glass = mix(frameC, sky, smoothstep(-wa, wa, bar));
        c = mix(c, glass, (1. - smoothstep(-wa, wa, pane)) * uWinA);
      }
    }

    // the room gives way to the screen, and what is left of the lamp stays warm
    c = mix(INK * .92, c * mix(vec3(1., .88, .66), vec3(1.), uRoom), uRoom);

    // the laptop shadow boots: a halftone in two plates swells from the middle until it fuses
    if (uIgnite > .001 && !left) {
      float dI = target(q);
      float ai = fwidth(dI) * .75;
      float inside = 1. - smoothstep(-ai, ai, dI);
      vec2 p = vec2(q.x - uBox.x, uBox.y - q.y) / uBox.z - vec2(.5, .36);
      float front = length(p * vec2(1., 1.15));
      float swell = uIgnite * 1.62 - front * 1.15;
      float cells = 54.;
      vec2 gA = mat2(.7071, -.7071, .7071, .7071) * (p * cells);
      vec2 gB = mat2(.9659, -.2588, .2588, .9659) * (p * cells);
      float rA = length(fract(gA) - .5);
      float rB = length(fract(gB) - .5);
      float wc = fwidth(gA.x) * .9;
      float kA = clamp(swell / .42, 0., 1.);
      float kB = clamp((swell - .34) / .42, 0., 1.);
      float dotA = 1. - smoothstep(kA * .8 - wc, kA * .8 + wc, rA);
      float dotB = 1. - smoothstep(kB * .8 - wc, kB * .8 + wc, rB);
      dotA *= step(.001, kA);
      dotB *= step(.001, kB);
      c = mix(c, COBALT, inside * dotA);
      c = mix(c, uNext, inside * dotB);
      // its light on the plaster around it
      c += mix(COBALT, uNext, uIgnite) * .1 * exp(-max(dI, 0.) * 2.4) * (1. - inside) * uIgnite;
    }

    gl_FragColor = vec4(c, 1.);
  }
`;

export const DESK_FRAG = /* glsl */ `
  precision highp float;
  ${INKS}
  ${NOISE}
  ${TONE}
  varying vec3 vP;
  uniform vec3 uLamp, uAxis;
  uniform float uPower, uConeIn, uConeOut, uRoom;

  void main(){
    vec3 toL = uLamp - vP;
    float d2 = dot(toL, toL);
    vec3 L = toL / sqrt(d2);
    float ndl = max(L.y, 0.);
    // the desk sits under the cone; a soft down-wash that fades with distance
    float E = uPower * (ndl * 2.6 + .09) * 3.6 / (1. + d2 * .34);
    float spot = smoothstep(uConeOut - .3, uConeIn, dot(-L, uAxis));
    E *= .3 + .7 * spot;

    // bounce off the lit wall near the seam
    float seam = min(vP.x + 3.2, vP.z + 3.2);
    E += uPower * .32 * smoothstep(1.9, 0., seam) * smoothstep(0., .25, seam);
    E *= .55 + .45 * smoothstep(0., .22, seam);

    // contact and cast shadow, rotating with the lamp
    vec2 q = vP.xz;
    float contact = smoothstep(1.55, .72, length(q / vec2(1.4, 1.)));
    vec2 dir = normalize(-uLamp.xz);
    float along = dot(q, dir);
    float across = dot(q, vec2(-dir.y, dir.x));
    float w = 1.25 + max(along, 0.) * .34;
    float thrown = smoothstep(w + .35, w - .2, abs(across)) * smoothstep(-.7, .35, along) * smoothstep(9.5, 2., along);
    E *= 1. - min(contact * .9 + thrown * .8, .97);

    float g = grain(gl_FragCoord.xy);
    vec3 warm = mix(mix(INK, SUN, .34), PAPER, .22);
    vec3 c = tone(E * .9, warm, g);
    c *= .86 + vnoise(q * vec2(.9, 8.)) * .14;
    gl_FragColor = vec4(mix(INK * .92, c, uRoom), 1.);
  }
`;

export const BOOK_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec3 aSize;
  varying vec3 vN, vNo, vW, vC, vLoc, vSz;
  void main(){
    vec4 w = instanceMatrix * vec4(position, 1.);
    vW = w.xyz;
    vNo = normal;
    vN = normalize(mat3(instanceMatrix) * (normal / (aSize * aSize)));
    vC = aColor;
    vLoc = position * aSize;
    vSz = aSize;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export const BOOK_FRAG = /* glsl */ `
  precision highp float;
  ${INKS}
  varying vec3 vN, vNo, vW, vC, vLoc, vSz;
  uniform vec3 uLamp, uScreen, uNext;
  uniform float uPower, uRoom, uIgnite;

  void main(){
    vec3 N = normalize(vN);
    vec3 toL = uLamp - vW;
    float d2 = dot(toL, toL);
    vec3 L = toL / sqrt(d2);
    float ndl = max(dot(N, L), 0.);
    float E = uPower * (ndl * .92 + .08) * 7.5 / (1. + d2 * .34);

    vec3 base = vC;
    vec3 an = abs(vNo);
    float hy = vSz.y * .5;
    if (an.y < .5) {
      // edges: one long side is the spine, the other three are page blocks
      bool spine = vNo.x < -.5;
      if (!spine) {
        float board = step(hy - .011, abs(vLoc.y));
        float lines = .8 + .2 * sin(vLoc.y * 760.);
        vec3 pages = PAPER * lines;
        base = mix(pages, base, board);
      } else {
        float band = smoothstep(.016, .012, abs(abs(vLoc.z) - vSz.z * .28));
        base = mix(base, mix(base, PAPER, .75), band);
      }
    } else {
      // a printed title block on the cover
      float blockX = smoothstep(.0, .01, vSz.x * .32 - abs(vLoc.x));
      float blockZ = smoothstep(.0, .01, vSz.z * .12 - abs(vLoc.z + vSz.z * .12));
      base = mix(base, mix(base, PAPER, .5), blockX * blockZ * .55);
    }
    // the crease where books touch
    float seam = smoothstep(hy, hy - .012, abs(vLoc.y));
    if (an.y < .5) base *= mix(.55, 1., seam);

    float s = smoothstep(.0, 1., E);
    vec3 dark = base * vec3(.16, .15, .2) + INK * .45;
    vec3 c = mix(dark, base * 1.04, s);
    c += SUN * .05 * pow(s, 3.) * step(.5, an.y);
    c = mix(mix(INK, base, .18), c, uRoom);
    // lit from above by the screen once it is on
    if (uIgnite > .001) {
      vec3 toS = uScreen - vW;
      float ds = dot(toS, toS);
      float ks = max(dot(N, toS / sqrt(ds)), 0.) * 9. / (2. + ds);
      c += base * uNext * ks * uIgnite * .72;
    }
    gl_FragColor = vec4(c, 1.);
  }
`;

export const CONE_VERT = /* glsl */ `
  varying vec3 vN, vP;
  varying float vLen;
  uniform float uConeLen;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.);
    vP = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vLen = -position.y / uConeLen;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export const CONE_FRAG = /* glsl */ `
  precision mediump float;
  ${INKS}
  ${NOISE}
  varying vec3 vN, vP;
  varying float vLen;
  uniform float uPower, uTime, uConeGain;
  void main(){
    vec3 V = normalize(cameraPosition - vP);
    float facing = pow(abs(dot(normalize(vN), V)), 2.4);
    float len = smoothstep(0., .1, vLen) * pow(1. - vLen, 1.5);
    float n = .75 + .4 * vnoise(vP.xy * 1.5 + vec2(uTime * .08, uTime * .05)) * vnoise(vP.yz * 2.3 - uTime * .06);
    float a = uPower * facing * len * n * uConeGain;
    gl_FragColor = vec4(mix(SUN, PAPER, .35) * a, a);
  }
`;

export const DUST_VERT = /* glsl */ `
  attribute float aSeed;
  varying float vA;
  uniform float uTime, uPower, uPx;
  uniform vec3 uLamp, uAxis;
  uniform float uConeOut;
  void main(){
    vec3 p = position;
    float t = uTime * (.05 + aSeed * .07);
    p.y = mod(p.y + t * 2., 5.2);
    p.x += sin(t * 3. + aSeed * 40.) * .24;
    p.z += cos(t * 2.3 + aSeed * 30.) * .24;
    vec3 toP = normalize(p - uLamp);
    float inCone = smoothstep(uConeOut, uConeOut + .12, dot(toP, uAxis));
    vA = uPower * inCone * (.4 + aSeed * .6);
    vec4 mv = viewMatrix * vec4(p, 1.);
    gl_PointSize = uPx * (1.1 + aSeed * 2.1) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

export const DUST_FRAG = /* glsl */ `
  precision mediump float;
  ${INKS}
  varying float vA;
  void main(){
    float d = length(gl_PointCoord - .5);
    float a = smoothstep(.5, .1, d) * vA * .85;
    gl_FragColor = vec4(mix(SUN, PAPER, .55) * a, a);
  }
`;

export const LAMP_VERT = /* glsl */ `
  varying vec3 vN, vW;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

/** Ink body with a warm lit edge, so the lamp holds its shape against dark plaster. */
export const LAMP_FRAG = /* glsl */ `
  precision mediump float;
  ${INKS}
  varying vec3 vN, vW;
  uniform float uPower;
  void main(){
    vec3 V = normalize(cameraPosition - vW);
    vec3 N = normalize(vN);
    float rim = pow(1. - abs(dot(N, V)), 2.4);
    float sky = smoothstep(-.1, 1., N.y);
    vec3 edge = mix(INK, SUN, .72);
    vec3 c = mix(INK, edge, clamp(uPower, 0., 1.) * (rim * 1.05 + sky * .34));
    gl_FragColor = vec4(c, 1.);
  }
`;
