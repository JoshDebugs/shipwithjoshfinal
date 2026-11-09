/**
 * Raw WebGL2 host for the two thermal passes (no three.js needed: it is two
 * full-screen triangles). Owns the ping-pong heat buffer, the heat-type
 * textures and the uniform plumbing; survives context loss.
 */
import { COMP_FRAG, FIELD_FRAG, VERT } from "./glsl";
import type { Frame } from "./frame";

export type Live = {
  /** multiplicative cooling this frame: prints, trails */
  decayPrints: number;
  decayTrails: number;
  diffuse: number;
  deposit: number;
  stamp: [number, number, number, number];
  stampM: [number, number, number, number];
  trail: [number, number, number, number];
};

export type Look = {
  stopsA: Float32Array;
  stopsB: Float32Array;
  modeMix: number;
  visible: number;
  vis: Float32Array;
  exposure: number;
  noise: number;
};

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

const FIELD_U = [
  "uPrev", "uTexel", "uStage", "uCapP", "uCapR", "uCapN", "uK", "uEdge", "uFall", "uHaloR", "uHaloAmt", "uMottle", "uTime",
  "uDecay", "uDiffuse", "uDeposit", "uFloor8", "uStamp", "uStampM", "uTrail",
];
const COMP_U = [
  "uField", "uWordsA", "uWordsB", "uStage", "uDpr", "uTime", "uStops", "uStopsB", "uModeMix", "uVisible", "uVis", "uWordT",
  "uWordT4", "uWordBlur", "uWordBlur4", "uGlowLod", "uBar", "uPlates", "uHands", "uHandT", "uFood", "uRing", "uFleck",
  "uFleckN", "uLamp", "uLampSharp", "uEnv", "uEnv2", "uFeet", "uExposure", "uNoise",
];

export class ThermalGL {
  readonly canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext | null = null;
  ok = false;
  private field: Prog | null = null;
  private comp: Prog | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private buf: WebGLBuffer | null = null;
  private tex: WebGLTexture[] = [];
  private fbo: WebGLFramebuffer[] = [];
  private cur = 0;
  private wordsA: WebGLTexture | null = null;
  private wordsB: WebGLTexture | null = null;
  private float = false;
  private fw = 1;
  private fhh = 1;
  private cw = 1;
  private ch = 1;
  private sw = 1;
  private sh = 1;
  private dpr = 1;
  private div = 3;
  private words: { a: Uint8Array; b: Uint8Array; w: number; h: number } | null = null;
  private lost = false;
  private onLost = (e: Event) => {
    e.preventDefault();
    this.lost = true;
    this.ok = false;
  };
  private onRestored = () => {
    this.lost = false;
    this.init();
    if (this.ok) {
      this.resize(this.sw, this.sh, this.dpr, this.div);
      if (this.words) this.setWords(this.words.a, this.words.b, this.words.w, this.words.h);
    }
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    this.init();
  }

  private init() {
    const gl = this.canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    this.gl = gl;
    this.tex = [];
    this.fbo = [];
    this.fw = 0;
    this.fhh = 0;
    if (!gl) return;
    this.float = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    this.field = this.program(FIELD_FRAG, FIELD_U);
    this.comp = this.program(COMP_FRAG, COMP_U);
    if (!this.field || !this.comp) return;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    for (const prog of [this.field.p, this.comp.p]) {
      const loc = gl.getAttribLocation(prog, "aPos");
      if (loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      }
    }
    this.wordsA = this.blankTex();
    this.wordsB = this.blankTex();
    this.ok = true;
  }

  private program(frag: string, names: string[]): Prog | null {
    const gl = this.gl!;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        console.warn("[fitness] shader:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const v = sh(gl.VERTEX_SHADER, VERT);
    const f = sh(gl.FRAGMENT_SHADER, frag);
    if (!v || !f) return null;
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.bindAttribLocation(p, 0, "aPos");
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) {
      console.warn("[fitness] link:", gl.getProgramInfoLog(p));
      return null;
    }
    const u: Prog["u"] = {};
    for (const n of names) u[n] = gl.getUniformLocation(p, n);
    return { p, u };
  }

  private blankTex() {
    const gl = this.gl!;
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }

  /** Stage size (CSS px), canvas DPR and the heat buffer divisor. */
  resize(w: number, h: number, dpr: number, fieldDiv: number) {
    this.sw = Math.max(1, w);
    this.sh = Math.max(1, h);
    this.dpr = dpr;
    this.div = fieldDiv;
    const gl = this.gl;
    if (!gl || !this.ok) return;
    this.cw = Math.max(1, Math.round(this.sw * dpr));
    this.ch = Math.max(1, Math.round(this.sh * dpr));
    this.canvas.width = this.cw;
    this.canvas.height = this.ch;
    const fw = Math.max(8, Math.round(this.sw / fieldDiv));
    const fhh = Math.max(8, Math.round(this.sh / fieldDiv));
    if (fw === this.fw && fhh === this.fhh && this.tex.length) return;
    this.fw = fw;
    this.fhh = fhh;
    for (const t of this.tex) gl.deleteTexture(t);
    for (const f of this.fbo) gl.deleteFramebuffer(f);
    this.tex = [];
    this.fbo = [];
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      if (this.float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, fw, fhh, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, fw, fhh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      if (this.float && gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        // half-float not renderable after all: fall back to 8-bit
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(f);
        gl.deleteTexture(t);
        for (const tt of this.tex) gl.deleteTexture(tt);
        for (const ff of this.fbo) gl.deleteFramebuffer(ff);
        this.tex = [];
        this.fbo = [];
        this.float = false;
        this.fw = 0;
        this.resize(w, h, dpr, fieldDiv);
        return;
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      this.tex.push(t);
      this.fbo.push(f);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.cur = 0;
  }

  /** Heat-type masks: A = (headline, discipline, training, nutrition), B.r = consistency. */
  setWords(a: Uint8Array, b: Uint8Array, w: number, h: number) {
    this.words = { a, b, w, h };
    const gl = this.gl;
    if (!gl || !this.ok) return;
    const up = (t: WebGLTexture | null, data: Uint8Array) => {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    up(this.wordsA, a);
    up(this.wordsB, b);
  }

  render(F: Frame, live: Live, look: Look) {
    const gl = this.gl;
    if (!gl || !this.ok || this.lost || !this.field || !this.comp || this.tex.length < 2) return;
    gl.bindVertexArray(this.vao);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

    // ---- field pass (low-res, ping-pong)
    const src = this.cur;
    const dst = 1 - src;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[dst]);
    gl.viewport(0, 0, this.fw, this.fhh);
    let u = this.field.u;
    gl.useProgram(this.field.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[src]);
    gl.uniform1i(u.uPrev, 0);
    gl.uniform2f(u.uTexel, 1 / this.fw, 1 / this.fhh);
    gl.uniform2f(u.uStage, this.sw, this.sh);
    gl.uniform4fv(u.uCapP, F.capP);
    gl.uniform4fv(u.uCapR, F.capR);
    gl.uniform1i(u.uCapN, F.capN);
    gl.uniform1f(u.uK, F.k);
    gl.uniform1f(u.uEdge, F.edge);
    gl.uniform1f(u.uFall, F.fall);
    gl.uniform1f(u.uHaloR, F.haloR);
    gl.uniform1f(u.uHaloAmt, F.haloAmt);
    gl.uniform1f(u.uMottle, F.mottle);
    gl.uniform1f(u.uTime, F.time);
    gl.uniform2f(u.uDecay, live.decayPrints, live.decayTrails);
    gl.uniform1f(u.uDiffuse, live.diffuse);
    gl.uniform1f(u.uDeposit, live.deposit);
    gl.uniform1f(u.uFloor8, this.float ? 0 : 1.6 / 255);
    gl.uniform4fv(u.uStamp, live.stamp);
    gl.uniform4fv(u.uStampM, live.stampM);
    gl.uniform4fv(u.uTrail, live.trail);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.cur = dst;

    // ---- composite (full-res)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.cw, this.ch);
    u = this.comp.u;
    gl.useProgram(this.comp.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[dst]);
    gl.uniform1i(u.uField, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.wordsA);
    gl.uniform1i(u.uWordsA, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.wordsB);
    gl.uniform1i(u.uWordsB, 2);
    gl.uniform2f(u.uStage, this.sw, this.sh);
    gl.uniform1f(u.uDpr, this.dpr);
    gl.uniform1f(u.uTime, F.time);
    gl.uniform3fv(u.uStops, look.stopsA);
    gl.uniform3fv(u.uStopsB, look.stopsB);
    gl.uniform1f(u.uModeMix, look.modeMix);
    gl.uniform1f(u.uVisible, look.visible);
    gl.uniform3fv(u.uVis, look.vis);
    gl.uniform4f(u.uWordT, F.wordT[0], F.wordT[1], F.wordT[2], F.wordT[3]);
    gl.uniform1f(u.uWordT4, F.wordT[4]);
    gl.uniform4f(u.uWordBlur, F.wordBlur[0], F.wordBlur[1], F.wordBlur[2], F.wordBlur[3]);
    gl.uniform1f(u.uWordBlur4, F.wordBlur[4]);
    gl.uniform1f(u.uGlowLod, 3.2);
    gl.uniform4fv(u.uBar, F.bar);
    gl.uniform4fv(u.uPlates, F.plates);
    gl.uniform4fv(u.uHands, F.hands);
    gl.uniform2f(u.uHandT, F.handT, F.handR);
    gl.uniform4fv(u.uFood, F.food);
    gl.uniform4fv(u.uRing, F.ring);
    gl.uniform4fv(u.uFleck, F.flecks);
    gl.uniform1i(u.uFleckN, F.fleckN);
    gl.uniform4fv(u.uLamp, F.lamp);
    gl.uniform1f(u.uLampSharp, F.lampSharp);
    gl.uniform4f(u.uEnv, F.floorY, F.wallY, F.bloom, F.exitK);
    gl.uniform4f(u.uEnv2, F.fh, F.chest[0], F.chest[1], F.footT);
    gl.uniform2f(u.uFeet, F.feet[0], F.feet[1]);
    gl.uniform1f(u.uExposure, look.exposure);
    gl.uniform1f(u.uNoise, look.noise);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    const gl = this.gl;
    if (gl) {
      for (const t of this.tex) gl.deleteTexture(t);
      for (const f of this.fbo) gl.deleteFramebuffer(f);
      if (this.wordsA) gl.deleteTexture(this.wordsA);
      if (this.wordsB) gl.deleteTexture(this.wordsB);
      if (this.buf) gl.deleteBuffer(this.buf);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.field) gl.deleteProgram(this.field.p);
      if (this.comp) gl.deleteProgram(this.comp.p);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    this.gl = null;
    this.ok = false;
  }
}
