import { program, buffer, target, destroyTarget, Uniforms, QUAD_VS, type Target } from './gl';
import { UPDATE_VS, UPDATE_FS, POINT_VS, POINT_FS, FOG_FS, TRAIL_FS, BLIT_FS, LINE_VS, LINE_FS, GLOW_VS, GLOW_FS, WALL_FS } from './shaders';
import { readThemeColors } from '@/lib/theme-colors';
import { deviceBudget, prefersReducedMotion, clamp, lerp } from '@/lib/page';

/**
 * The Field — a persistent WebGL2 "space of thought" behind the whole site.
 *
 *  · GPU particles (transform feedback) advected by curl noise, bent by
 *    concept anchors, the pointer, and an ink trail the pointer leaves.
 *  · A domain-warped fbm fog rendered at reduced resolution.
 *  · Threads and glows between an active concept and its relations.
 *  · Named presets so sections can morph the field's character.
 *  · A story layer (see src/scripts/story): particles can be given places in
 *    a figure, and a lit wall can carry shadows drawn from a 2D mask.
 */
export interface Preset {
  scale: number; speed: number; structure: number; converge: number; swirl: number;
  driveX: number; driveY: number; tint: number; fog: number; size: number; alpha: number; density: number; textMask: number;
}
export const PRESETS: Record<string, Preset> = {
  hero:           { scale: 0.0016, speed: 1.0, structure: 0.0, converge: 0.04, swirl: 0.35, driveX: 0.0, driveY: 0.0, tint: 0.18, fog: 1.0, size: 1.6, alpha: 1.0, density: 1.0, textMask: 1.0 },
  ambient:        { scale: 0.0013, speed: 0.5, structure: 0.0, converge: 0.0, swirl: 0.15, driveX: 0.0, driveY: 0.0, tint: 0.1, fog: 0.45, size: 1.4, alpha: 0.45, density: 0.4, textMask: 0.0 },
  reading:        { scale: 0.0012, speed: 0.35, structure: 0.0, converge: 0.0, swirl: 0.1, driveX: 0.0, driveY: 0.0, tint: 0.05, fog: 0.3, size: 1.3, alpha: 0.22, density: 0.25, textMask: 0.0 },
  off:            { scale: 0.0012, speed: 0.3, structure: 0.0, converge: 0.0, swirl: 0.0, driveX: 0.0, driveY: 0.0, tint: 0.0, fog: 0.0, size: 1.2, alpha: 0.0, density: 0.2, textMask: 0.0 },
  // the thread: one character per concept
  ai:             { scale: 0.0022, speed: 1.5, structure: 0.92, converge: 0.0, swirl: 0.0, driveX: 0.35, driveY: 0.0, tint: 0.35, fog: 0.5, size: 1.5, alpha: 1.0, density: 1.0, textMask: 0.0 },
  mind:           { scale: 0.0014, speed: 1.1, structure: 0.0, converge: 0.45, swirl: 1.25, driveX: 0.0, driveY: 0.0, tint: 0.2, fog: 1.1, size: 1.7, alpha: 1.0, density: 1.0, textMask: 0.0 },
  agency:         { scale: 0.0018, speed: 1.6, structure: 0.25, converge: 0.0, swirl: 0.0, driveX: 0.8, driveY: -0.25, tint: 0.3, fog: 0.6, size: 1.6, alpha: 1.0, density: 1.0, textMask: 0.0 },
  knowledge:      { scale: 0.0036, speed: 0.9, structure: 0.0, converge: 0.25, swirl: 0.2, driveX: 0.0, driveY: 0.0, tint: 0.25, fog: 0.8, size: 1.8, alpha: 1.0, density: 1.0, textMask: 0.0 },
  ethics:         { scale: 0.0013, speed: 0.8, structure: 0.0, converge: 0.15, swirl: -0.6, driveX: 0.0, driveY: 0.0, tint: 0.45, fog: 0.9, size: 1.6, alpha: 1.0, density: 1.0, textMask: 0.0 },
  responsibility: { scale: 0.0016, speed: 1.3, structure: 0.0, converge: 0.95, swirl: 0.9, driveX: 0.0, driveY: 0.0, tint: 0.55, fog: 0.7, size: 1.6, alpha: 1.0, density: 1.0, textMask: 0.0 },
  technology:     { scale: 0.003, speed: 0.55, structure: 1.0, converge: 0.0, swirl: 0.0, driveX: 0.0, driveY: 0.3, tint: 0.3, fog: 0.45, size: 1.5, alpha: 1.0, density: 1.0, textMask: 0.0 },
};

export interface Anchor { x: number; y: number; strength: number; related?: number[] }

/** Everything the story director drives each frame. Zeroed, the field behaves exactly as without it. */
export interface StoryState {
  stage: [number, number, number, number]; // css px: x, y, w, h
  form: number; formTint: number;
  groups: Float32Array; // 8 × (offset x, offset y in stage units, strength, tint)
  maskOn: number; stageDim: number; veil: number;
  wall: [number, number, number, number]; // light pool: cx, cy, rx, ry (stage units)
  wallLight: number; wallColor: [number, number, number]; flick: number;
  light: [number, number, number, number]; // x, y, radius (css px), intensity
  lightColor: [number, number, number];
  embers: number;
  burst: [number, number, number]; // x, y (css px), strength
}
export function emptyStory(): StoryState {
  const groups = new Float32Array(32);
  for (let g = 0; g < 8; g++) groups[g * 4 + 2] = 1;
  return {
    stage: [0, 0, 0, 0], form: 0, formTint: 0, groups, maskOn: 0, stageDim: 0, veil: 0,
    wall: [0.5, 0.5, 0.6, 0.6], wallLight: 0, wallColor: [1, 1, 1], flick: 1,
    light: [0, 0, 1, 0], lightColor: [1, 1, 1], embers: 0, burst: [0, 0, 0],
  };
}

class FieldEngine {
  canvas!: HTMLCanvasElement;
  gl!: WebGL2RenderingContext;
  ok = false;
  private W = 1; private H = 1; private dpr = 1;
  private budget = 1;
  private N = 0;
  private reduced = false;
  // programs
  private pUpdate!: WebGLProgram; private uUpdate!: Uniforms;
  private pPoint!: WebGLProgram; private uPoint!: Uniforms;
  private pFog!: WebGLProgram; private uFog!: Uniforms;
  private pTrail!: WebGLProgram; private uTrail!: Uniforms;
  private pBlit!: WebGLProgram; private uBlit!: Uniforms;
  private pLine!: WebGLProgram; private uLine!: Uniforms;
  private pGlow!: WebGLProgram; private uGlow!: Uniforms;
  private pWall!: WebGLProgram; private uWall!: Uniforms;
  // particle buffers (ping-pong)
  private bufPos: WebGLBuffer[] = []; private bufVel: WebGLBuffer[] = []; private bufLife: WebGLBuffer[] = []; private bufSeed!: WebGLBuffer;
  private bufTarget!: WebGLBuffer;
  private vaoUpdate: WebGLVertexArrayObject[] = []; private vaoRender: WebGLVertexArrayObject[] = [];
  private tf: WebGLTransformFeedback[] = [];
  private cur = 0;
  private emptyVao!: WebGLVertexArrayObject;
  // targets
  private fog!: Target; private trail: Target[] = []; private trailCur = 0;
  private fogScale = 0.5; private trailRes = 256;
  // line/glow buffers
  private bufLinePos!: WebGLBuffer; private bufLineT!: WebGLBuffer; private vaoLine!: WebGLVertexArrayObject; private lineCount = 0; private lineSegs: number[] = [];
  private bufGlowPos!: WebGLBuffer; private bufGlowSize!: WebGLBuffer; private bufGlowK!: WebGLBuffer; private vaoGlow!: WebGLVertexArrayObject; private glowCount = 0;
  // state
  private time = 0; private last = 0; private running = false; private raf = 0;
  private colors = { ink: [235, 231, 223] as [number, number, number], accent: [224, 101, 63] as [number, number, number], paper: [15, 15, 18] as [number, number, number] };
  private pointer = { x: -9999, y: -9999, vx: 0, vy: 0, on: 0, lastX: 0, lastY: 0, lastT: 0 };
  private cur_: Preset = { ...PRESETS.ambient }; private target_: Preset = { ...PRESETS.ambient };
  private presetLerp = 0.06;
  private anchors: Anchor[] = []; private anchorArr = new Float32Array(48);
  private active = -1; private activeT = 0; private threadT = 0;
  private scroll = 0; private scrollTarget = 0;
  private intensity = 1; private intensityTarget = 1;
  private visible = true;
  // story layer
  story: StoryState = emptyStory();
  private formation: Float32Array | null = null;
  private maskTex!: WebGLTexture; private maskOk = false;
  private markGlows: Float32Array = new Float32Array(0); private markLines: Float32Array[] = [];
  private bufMarkPos!: WebGLBuffer; private bufMarkSize!: WebGLBuffer; private bufMarkK!: WebGLBuffer; private vaoMark!: WebGLVertexArrayObject;
  private frameFns = new Set<(dt: number, time: number) => void>();
  private drawFns = new Set<() => void>();
  private dark = 1;

  /* ------------------------------------------------------------ setup */
  init(canvas: HTMLCanvasElement) {
    if (this.ok || this.gl) return true;
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    if (!gl) return false;
    this.gl = gl;
    this.reduced = prefersReducedMotion();
    this.budget = deviceBudget();
    const qb = Number(new URLSearchParams(location.search).get('fieldBudget'));
    const forced = qb > 0 && qb <= 1;
    // software renderers (CI, virtual machines): keep the field light so the page stays responsive
    try {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
      if (/swiftshader|llvmpipe|software|mesa offscreen/i.test(renderer)) this.budget = 0.12;
    } catch {}
    if (forced) this.budget = qb;
    this.fogScale = this.budget > 0.7 ? 0.5 : 0.35;
    // Shaders compile one per frame so no single task blocks the main thread.
    this.compileSteps = [
      () => { this.pTrail = program(gl, QUAD_VS, TRAIL_FS); this.uTrail = new Uniforms(gl, this.pTrail); },
      () => { this.pBlit = program(gl, QUAD_VS, BLIT_FS); this.uBlit = new Uniforms(gl, this.pBlit); },
      () => { this.pPoint = program(gl, POINT_VS, POINT_FS); this.uPoint = new Uniforms(gl, this.pPoint); },
      () => { this.pUpdate = program(gl, UPDATE_VS, UPDATE_FS, ['v_pos', 'v_vel', 'v_life']); this.uUpdate = new Uniforms(gl, this.pUpdate); },
      () => { this.pFog = program(gl, QUAD_VS, FOG_FS); this.uFog = new Uniforms(gl, this.pFog); },
      () => { this.pLine = program(gl, LINE_VS, LINE_FS); this.uLine = new Uniforms(gl, this.pLine); },
      () => { this.pGlow = program(gl, GLOW_VS, GLOW_FS); this.uGlow = new Uniforms(gl, this.pGlow); },
      () => { this.pWall = program(gl, QUAD_VS, WALL_FS); this.uWall = new Uniforms(gl, this.pWall); },
    ];
    this.canvas.style.opacity = '0';
    this.stepCompile();
    return true;
  }

  private compileSteps: Array<() => void> = [];
  private stepCompile() {
    const gl = this.gl;
    const step = this.compileSteps.shift();
    if (step) {
      try { step(); } catch (e) { console.warn('[field] shader error', e); document.documentElement.classList.add('no-webgl'); return; }
      requestAnimationFrame(() => this.stepCompile());
      return;
    }
    this.finishInit();
  }

  private finishInit() {
    const gl = this.gl;
    this.emptyVao = gl.createVertexArray()!;
    // trail targets
    for (let i = 0; i < 2; i++) this.trail.push(target(gl, this.trailRes, this.trailRes));
    // line buffers
    this.bufLinePos = buffer(gl, 12 * 33 * 2 * 4, gl.DYNAMIC_DRAW);
    this.bufLineT = buffer(gl, 12 * 33 * 4, gl.DYNAMIC_DRAW);
    this.vaoLine = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoLine);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLinePos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLineT); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.bufGlowPos = buffer(gl, 12 * 2 * 4, gl.DYNAMIC_DRAW); this.bufGlowSize = buffer(gl, 12 * 4, gl.DYNAMIC_DRAW); this.bufGlowK = buffer(gl, 12 * 4, gl.DYNAMIC_DRAW);
    this.vaoGlow = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoGlow);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufGlowPos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufGlowSize); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufGlowK); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    // story: an empty mask (one black texel) and buffers for glowing marks
    this.maskTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.bufMarkPos = buffer(gl, 48 * 2 * 4, gl.DYNAMIC_DRAW); this.bufMarkSize = buffer(gl, 48 * 4, gl.DYNAMIC_DRAW); this.bufMarkK = buffer(gl, 48 * 4, gl.DYNAMIC_DRAW);
    this.vaoMark = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoMark);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufMarkPos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufMarkSize); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufMarkK); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.ok = true;
    this.setTheme();
    this.resize();
    this.bindEvents();
    this.canvas.style.opacity = '';
    document.documentElement.classList.add('has-webgl');
    if (this.wantRun) this.start();
  }
  private wantRun = false;

  private bindEvents() {
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const dt = Math.max(8, now - this.pointer.lastT) / 1000;
      const x = e.clientX, y = e.clientY;
      const vx = (x - this.pointer.lastX) / dt, vy = (y - this.pointer.lastY) / dt;
      this.pointer.vx = lerp(this.pointer.vx, clamp(vx, -3000, 3000), 0.35);
      this.pointer.vy = lerp(this.pointer.vy, clamp(vy, -3000, 3000), 0.35);
      this.pointer.x = x; this.pointer.y = y; this.pointer.lastX = x; this.pointer.lastY = y; this.pointer.lastT = now; this.pointer.on = 1;
    };
    const onLeave = () => { this.pointer.on = 0; };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => { this.visible = !document.hidden; if (this.visible) this.last = 0; });
    document.addEventListener('themechange', () => this.setTheme());
  }

  setTheme() {
    const c = readThemeColors();
    this.colors = { ink: c.ink, accent: c.accent, paper: c.paper };
    const [r, g, b] = c.paper;
    this.dark = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5 ? 1 : 0;
  }
  /** Colours the story uses, read from the theme. */
  get palette() { return { ...this.colors, dark: this.dark }; }

  resize() {
    if (!this.ok) return;
    const gl = this.gl;
    this.W = Math.max(1, window.innerWidth); this.H = Math.max(1, window.innerHeight);
    this.dpr = clamp(window.devicePixelRatio || 1, 1, this.budget > 0.7 ? 1.5 : 1);
    this.canvas.width = Math.round(this.W * this.dpr); this.canvas.height = Math.round(this.H * this.dpr);
    this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
    if (this.fog) destroyTarget(gl, this.fog);
    this.fog = target(gl, Math.max(2, Math.round(this.W * this.dpr * this.fogScale)), Math.max(2, Math.round(this.H * this.dpr * this.fogScale)));
    const wanted = Math.round(clamp((this.W * this.H) / 34, 5000, 42000) * this.budget);
    if (wanted !== this.N) this.allocParticles(wanted);
  }

  private allocParticles(n: number) {
    const gl = this.gl;
    // dispose old
    for (const b of [...this.bufPos, ...this.bufVel, ...this.bufLife]) gl.deleteBuffer(b);
    for (const v of [...this.vaoUpdate, ...this.vaoRender]) gl.deleteVertexArray(v);
    for (const t of this.tf) gl.deleteTransformFeedback(t);
    if (this.bufSeed) gl.deleteBuffer(this.bufSeed);
    if (this.bufTarget) gl.deleteBuffer(this.bufTarget);
    this.bufPos = []; this.bufVel = []; this.bufLife = []; this.vaoUpdate = []; this.vaoRender = []; this.tf = [];
    this.N = n;
    const pos = new Float32Array(n * 2), vel = new Float32Array(n * 2), life = new Float32Array(n), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 2] = Math.random() * this.W; pos[i * 2 + 1] = Math.random() * this.H; life[i] = Math.random() * 9; seed[i] = Math.random() * 1000 + 1; }
    this.bufSeed = buffer(gl, seed);
    this.bufTarget = buffer(gl, this.targetData(), gl.DYNAMIC_DRAW);
    for (let i = 0; i < 2; i++) {
      this.bufPos.push(buffer(gl, pos, gl.DYNAMIC_COPY)); this.bufVel.push(buffer(gl, vel, gl.DYNAMIC_COPY)); this.bufLife.push(buffer(gl, life, gl.DYNAMIC_COPY));
    }
    const bind = (vao: WebGLVertexArrayObject, set: number, prog: WebGLProgram) => {
      gl.bindVertexArray(vao);
      const lp = gl.getAttribLocation(prog, 'a_pos'), lv = gl.getAttribLocation(prog, 'a_vel'), ll = gl.getAttribLocation(prog, 'a_life'), ls = gl.getAttribLocation(prog, 'a_seed');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos[set]); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufVel[set]); gl.enableVertexAttribArray(lv); gl.vertexAttribPointer(lv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLife[set]); gl.enableVertexAttribArray(ll); gl.vertexAttribPointer(ll, 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufSeed); gl.enableVertexAttribArray(ls); gl.vertexAttribPointer(ls, 1, gl.FLOAT, false, 0, 0);
      const lt = gl.getAttribLocation(prog, 'a_target');
      if (lt >= 0) { gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTarget); gl.enableVertexAttribArray(lt); gl.vertexAttribPointer(lt, 4, gl.FLOAT, false, 0, 0); }
      gl.bindVertexArray(null);
    };
    for (let i = 0; i < 2; i++) {
      const vu = gl.createVertexArray()!; bind(vu, i, this.pUpdate); this.vaoUpdate.push(vu);
      const vr = gl.createVertexArray()!; bind(vr, i, this.pPoint); this.vaoRender.push(vr);
      const t = gl.createTransformFeedback()!;
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, t);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.bufPos[1 - i]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.bufVel[1 - i]);
      gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, this.bufLife[1 - i]);
      gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
      this.tf.push(t);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    this.cur = 0;
  }

  /* ------------------------------------------------------------ public API */
  setPreset(name: string | Partial<Preset>, immediate = false) {
    const p = typeof name === 'string' ? PRESETS[name] ?? PRESETS.ambient : { ...this.target_, ...name };
    this.target_ = { ...p };
    if (immediate) this.cur_ = { ...p };
  }
  setAnchors(anchors: Anchor[]) { this.anchors = anchors.slice(0, 12); }
  setActive(index: number | null) {
    const next = index == null ? -1 : index;
    if (next !== this.active) this.threadT = 0;
    this.active = next;
  }
  setScroll(v: number) { this.scrollTarget = clamp(v, 0, 1); }
  setIntensity(v: number) { this.intensityTarget = clamp(v, 0, 1); }
  get isRunning() { return this.running; }
  get particleCount() { return this.N; }

  /* ------------------------------------------------------------ story API */
  /** Give particles places in a figure: (x, y, group, weight) per point, x/y in stage units. Null releases them. */
  setFormation(points: Float32Array | null) {
    this.formation = points;
    if (!this.ok || !this.bufTarget) return;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTarget);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.targetData());
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
  private targetData() {
    const n = this.N, out = new Float32Array(n * 4), f = this.formation;
    if (f) out.set(f.subarray(0, Math.min(f.length, n * 4)));
    return out;
  }
  /** Upload the shadow mask (white = shadow), drawn by the director on a 2D canvas. */
  setMask(src: HTMLCanvasElement) {
    if (!this.ok) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.maskOk = true;
  }
  /** Glowing points (x, y, size, k per mark, css px) and polylines (x, y pairs) drawn over the field. */
  setMarks(glows: Float32Array | null, lines: Float32Array[] = []) {
    this.markGlows = glows ?? new Float32Array(0);
    this.markLines = lines;
  }
  onFrame(fn: (dt: number, time: number) => void) { this.frameFns.add(fn); return () => { this.frameFns.delete(fn); }; }
  /** Runs right after each frame is drawn, while the drawing buffer can still be copied. */
  onDraw(fn: () => void) { this.drawFns.add(fn); return () => { this.drawFns.delete(fn); }; }
  get canvasEl() { return this.canvas; }
  get pixelRatio() { return this.dpr; }
  resetStory() { this.story = emptyStory(); this.setFormation(null); this.setMarks(null); }
  /** Reduced motion: advance the simulation without the loop and paint one frame. */
  still(steps = 90) {
    if (!this.ok) return;
    for (let i = 0; i < steps; i++) { this.frameFns.forEach((fn) => fn(1 / 60, this.time)); this.step(1 / 60); }
    this.draw();
    this.drawFns.forEach((fn) => fn());
  }

  start() {
    this.wantRun = true;
    if (!this.ok || this.running) return;
    this.running = true; this.last = 0;
    if (this.reduced) { for (let i = 0; i < 80; i++) this.step(1 / 60); this.draw(); this.running = false; return; }
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      if (!this.visible) return;
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
      this.last = now;
      this.frameFns.forEach((fn) => fn(dt, this.time));
      this.step(dt); this.draw();
      this.drawFns.forEach((fn) => fn());
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }

  /* ------------------------------------------------------------ frame */
  private step(dt: number) {
    const gl = this.gl;
    this.time += dt;
    // ease state
    const c = this.cur_, t = this.target_;
    for (const k of Object.keys(t) as (keyof Preset)[]) c[k] = lerp(c[k], t[k], this.presetLerp);
    this.activeT = lerp(this.activeT, this.active >= 0 ? 1 : 0, 0.1);
    if (this.active >= 0) this.threadT = Math.min(1, this.threadT + dt * 1.4);
    this.scroll = lerp(this.scroll, this.scrollTarget, 0.12);
    this.intensity = lerp(this.intensity, this.intensityTarget, 0.06);
    this.pointer.vx *= 0.9; this.pointer.vy *= 0.9;
    // anchors → uniform array
    this.anchorArr.fill(0);
    this.anchors.forEach((a, i) => {
      const isA = i === this.active;
      const rel = this.active >= 0 && (this.anchors[this.active].related ?? []).includes(i);
      const s = isA ? 1.0 * this.activeT : rel ? 0.45 * this.activeT : 0.0;
      this.anchorArr[i * 4] = a.x; this.anchorArr[i * 4 + 1] = a.y; this.anchorArr[i * 4 + 2] = s * a.strength; this.anchorArr[i * 4 + 3] = rel ? 1 : 0;
    });

    /* --- trail --- */
    const prev = this.trail[this.trailCur], next = this.trail[1 - this.trailCur];
    gl.bindFramebuffer(gl.FRAMEBUFFER, next.fb);
    gl.viewport(0, 0, next.w, next.h);
    gl.disable(gl.BLEND);
    gl.useProgram(this.pTrail);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, prev.tex);
    this.uTrail.i('u_prev', 0);
    this.uTrail.v2('u_res', next.w, next.h);
    this.uTrail.v2('u_pointer', this.pointer.x / this.W, 1 - this.pointer.y / this.H);
    const sp = Math.hypot(this.pointer.vx, this.pointer.vy);
    const nv = sp > 1 ? [this.pointer.vx / sp, -this.pointer.vy / sp] : [0, 0];
    this.uTrail.v2('u_vel', nv[0], nv[1]);
    this.uTrail.f('u_decay', 0.955);
    this.uTrail.f('u_radius', 0.06 + Math.min(0.06, sp / 20000));
    this.uTrail.f('u_strength', this.pointer.on * clamp(sp / 900, 0, 1) * 0.9);
    this.uTrail.f('u_aspect', this.W / this.H);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.trailCur = 1 - this.trailCur;

    /* --- particles update --- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // never sample a texture that is still attached to the bound FBO
    const trailTex = this.trail[this.trailCur].tex;
    gl.useProgram(this.pUpdate);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, trailTex);
    const u = this.uUpdate;
    u.i('u_trail', 0);
    u.v2('u_res', this.W, this.H);
    u.v2('u_pointer', this.pointer.x, this.pointer.y);
    u.v2('u_pointerVel', this.pointer.vx, this.pointer.vy);
    u.v2('u_drive', c.driveX, c.driveY);
    u.f('u_time', this.time); u.f('u_dt', dt);
    u.f('u_scale', c.scale); u.f('u_speed', c.speed * (0.4 + 0.6 * this.intensity)); u.f('u_structure', c.structure);
    u.f('u_converge', c.converge); u.f('u_swirl', c.swirl); u.f('u_scroll', this.scroll);
    u.f('u_pointerOn', this.pointer.on * this.intensity);
    u.v4a('u_anchors', this.anchorArr); u.i('u_anchorCount', this.anchors.length); u.i('u_active', this.active); u.f('u_activeT', this.activeT);
    const s = this.story;
    u.v4('u_stage', s.stage[0], s.stage[1], s.stage[2], s.stage[3]);
    u.f('u_form', s.form); u.v4a('u_groups', s.groups); u.f('u_embers', s.embers);
    u.v3('u_burst', s.burst[0], s.burst[1], s.burst[2]);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.bindVertexArray(this.vaoUpdate[this.cur]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.tf[this.cur]);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, this.N);
    gl.endTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.bindVertexArray(null);
    this.cur = 1 - this.cur;
  }

  private draw() {
    const gl = this.gl;
    const c = this.cur_;
    const ink = this.colors.ink.map((v) => v / 255), acc = this.colors.accent.map((v) => v / 255);
    const alpha = c.alpha * this.intensity;

    /* --- fog (reduced resolution) --- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fog.fb);
    gl.viewport(0, 0, this.fog.w, this.fog.h);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    if (c.fog * alpha > 0.005) {
      gl.useProgram(this.pFog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.trail[this.trailCur].tex);
      this.uFog.i('u_trail', 0);
      this.uFog.v2('u_res', this.fog.w, this.fog.h);
      this.uFog.f('u_time', this.time); this.uFog.f('u_fog', c.fog * alpha); this.uFog.f('u_tint', c.tint); this.uFog.f('u_scroll', this.scroll);
      this.uFog.f('u_octaves', this.budget > 0.7 ? 4 : 3); this.uFog.f('u_textMask', c.textMask);
      const st = this.story.stage;
      this.uFog.v2('u_css', this.W, this.H); this.uFog.v4('u_stage', st[0], st[1], st[2], st[3]); this.uFog.f('u_veil', this.story.veil);
      this.uFog.v3('u_ink', ink[0], ink[1], ink[2]); this.uFog.v3('u_accent', acc[0], acc[1], acc[2]);
      gl.bindVertexArray(this.emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /* --- composite --- */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // fog blit
    gl.useProgram(this.pBlit);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fog.tex);
    this.uBlit.i('u_tex', 0); this.uBlit.v2('u_res', this.canvas.width, this.canvas.height);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // story: the lit wall and its shadows, and any point light
    this.drawWall(ink);
    // particles
    if (alpha > 0.005) {
      gl.useProgram(this.pPoint);
      const u = this.uPoint;
      u.v2('u_res', this.W, this.H); u.f('u_dpr', this.dpr); u.f('u_size', c.size); u.f('u_activeT', this.activeT); u.f('u_alpha', alpha); u.f('u_textMask', c.textMask);
      u.v4a('u_anchors', this.anchorArr); u.i('u_active', this.active);
      u.v3('u_ink', ink[0], ink[1], ink[2]); u.v3('u_accent', acc[0], acc[1], acc[2]);
      const s = this.story;
      u.v4('u_stage', s.stage[0], s.stage[1], s.stage[2], s.stage[3]); u.f('u_form', s.form); u.v4a('u_groups', s.groups);
      u.f('u_formTint', s.formTint); u.f('u_maskOn', this.maskOk ? s.maskOn : 0); u.f('u_stageDim', s.stageDim); u.f('u_embers', s.embers);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.maskTex); u.i('u_mask', 1);
      gl.bindVertexArray(this.vaoRender[this.cur]);
      gl.drawArrays(gl.POINTS, 0, Math.round(this.N * clamp(c.density, 0, 1)));
      gl.bindVertexArray(null);
    }
    // threads + glows
    if (this.active >= 0 && this.activeT > 0.01) this.drawThreads(acc as number[]);
    if (this.markGlows.length || this.markLines.length) this.drawMarks(acc as number[]);
  }

  private drawWall(ink: number[]) {
    const s = this.story;
    const [sx, sy, sw, sh] = s.stage;
    const wallOn = s.wallLight * s.flick > 0.004, lightOn = s.light[3] > 0.004;
    if (!(wallOn || lightOn) || sw < 2) return;
    const gl = this.gl;
    // scissor to the stage, widened to hold the point light
    // the light pool may spill past the stage; give it room so it never ends in a straight edge
    let x0 = sx - sw * 0.3, y0 = sy - sh * 0.3, x1 = sx + sw * 1.3, y1 = sy + sh * 1.3;
    if (lightOn) { const r = s.light[2] * 2.4; x0 = Math.min(x0, s.light[0] - r); y0 = Math.min(y0, s.light[1] - r); x1 = Math.max(x1, s.light[0] + r); y1 = Math.max(y1, s.light[1] + r); }
    x0 = clamp(x0, 0, this.W); x1 = clamp(x1, 0, this.W); y0 = clamp(y0, 0, this.H); y1 = clamp(y1, 0, this.H);
    if (x1 - x0 < 1 || y1 - y0 < 1) return;
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(Math.floor(x0 * this.dpr), Math.floor((this.H - y1) * this.dpr), Math.ceil((x1 - x0) * this.dpr), Math.ceil((y1 - y0) * this.dpr));
    gl.useProgram(this.pWall);
    const u = this.uWall;
    u.v2('u_res', this.canvas.width, this.canvas.height); u.f('u_dpr', this.dpr);
    u.v4('u_stage', sx, sy, sw, sh); u.v4('u_wall', s.wall[0], s.wall[1], s.wall[2], s.wall[3]);
    u.f('u_wallLight', s.wallLight * this.intensity); u.f('u_flick', s.flick); u.f('u_dark', this.dark); u.f('u_maskOn', this.maskOk ? s.maskOn : 0);
    u.v3('u_wallColor', s.wallColor[0], s.wallColor[1], s.wallColor[2]); u.v3('u_ink', ink[0], ink[1], ink[2]);
    u.v4('u_light', s.light[0], s.light[1], s.light[2], s.light[3] * this.intensity); u.v3('u_lightColor', s.lightColor[0], s.lightColor[1], s.lightColor[2]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.maskTex); u.i('u_mask', 1);
    gl.bindVertexArray(this.emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.SCISSOR_TEST);
  }

  private drawMarks(acc: number[]) {
    const gl = this.gl;
    for (const line of this.markLines) {
      const n = Math.min(33, Math.floor(line.length / 2));
      if (n < 2) continue;
      gl.useProgram(this.pLine);
      this.uLine.v2('u_res', this.W, this.H); this.uLine.f('u_progress', 1); this.uLine.v3('u_accent', acc[0], acc[1], acc[2]); this.uLine.f('u_alpha', 0.7 * this.intensity);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLinePos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, line.subarray(0, n * 2));
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLineT); gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(n));
      gl.bindVertexArray(this.vaoLine);
      gl.drawArrays(gl.LINE_STRIP, 0, n);
      gl.bindVertexArray(null);
    }
    const g = this.markGlows, n = Math.min(48, Math.floor(g.length / 4));
    if (n) {
      const pos = new Float32Array(n * 2), size = new Float32Array(n), k = new Float32Array(n);
      for (let i = 0; i < n; i++) { pos[i * 2] = g[i * 4]; pos[i * 2 + 1] = g[i * 4 + 1]; size[i] = g[i * 4 + 2]; k[i] = g[i * 4 + 3] * this.intensity; }
      gl.useProgram(this.pGlow);
      this.uGlow.v2('u_res', this.W, this.H); this.uGlow.f('u_dpr', this.dpr); this.uGlow.v3('u_accent', acc[0], acc[1], acc[2]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufMarkPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufMarkSize); gl.bufferSubData(gl.ARRAY_BUFFER, 0, size);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufMarkK); gl.bufferSubData(gl.ARRAY_BUFFER, 0, k);
      gl.bindVertexArray(this.vaoMark);
      gl.drawArrays(gl.POINTS, 0, n);
      gl.bindVertexArray(null);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private drawThreads(acc: number[]) {
    const gl = this.gl;
    const a = this.anchors[this.active];
    if (!a) return;
    const rel = (a.related ?? []).filter((i) => this.anchors[i]);
    const SEG = 32;
    const pos = new Float32Array(rel.length * (SEG + 1) * 2);
    const ts = new Float32Array(rel.length * (SEG + 1));
    rel.forEach((ri, k) => {
      const b = this.anchors[ri];
      const dx = b.x - a.x, dy = b.y - a.y; const len = Math.hypot(dx, dy) || 1;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const bend = Math.min(140, len * 0.22);
      const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
      for (let s = 0; s <= SEG; s++) {
        const t = s / SEG; const it = 1 - t;
        const x = it * it * a.x + 2 * it * t * cx + t * t * b.x;
        const y = it * it * a.y + 2 * it * t * cy + t * t * b.y;
        const idx = k * (SEG + 1) + s;
        pos[idx * 2] = x; pos[idx * 2 + 1] = y; ts[idx] = t;
      }
    });
    gl.useProgram(this.pLine);
    this.uLine.v2('u_res', this.W, this.H); this.uLine.f('u_progress', 1 - Math.pow(1 - this.threadT, 3)); this.uLine.v3('u_accent', acc[0], acc[1], acc[2]); this.uLine.f('u_alpha', 0.85 * this.activeT * this.intensity);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLinePos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufLineT); gl.bufferSubData(gl.ARRAY_BUFFER, 0, ts);
    gl.bindVertexArray(this.vaoLine);
    for (let k = 0; k < rel.length; k++) gl.drawArrays(gl.LINE_STRIP, k * (SEG + 1), SEG + 1);
    gl.bindVertexArray(null);
    // glows
    const n = rel.length + 1;
    const gp = new Float32Array(n * 2), gs = new Float32Array(n), gk = new Float32Array(n);
    gp[0] = a.x; gp[1] = a.y; gs[0] = 34 + Math.sin(this.time * 2.2) * 3; gk[0] = this.activeT;
    rel.forEach((ri, k) => { const b = this.anchors[ri]; gp[(k + 1) * 2] = b.x; gp[(k + 1) * 2 + 1] = b.y; gs[k + 1] = 20; gk[k + 1] = this.activeT * (1 - Math.pow(1 - this.threadT, 3)); });
    gl.useProgram(this.pGlow);
    this.uGlow.v2('u_res', this.W, this.H); this.uGlow.f('u_dpr', this.dpr); this.uGlow.v3('u_accent', acc[0], acc[1], acc[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufGlowPos); gl.bufferSubData(gl.ARRAY_BUFFER, 0, gp);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufGlowSize); gl.bufferSubData(gl.ARRAY_BUFFER, 0, gs);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufGlowK); gl.bufferSubData(gl.ARRAY_BUFFER, 0, gk);
    gl.bindVertexArray(this.vaoGlow);
    gl.drawArrays(gl.POINTS, 0, n);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}

/** Site-wide singleton; the canvas persists across client-side navigations. */
export const field = new FieldEngine();

export function mountField() {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-field]');
  if (!canvas) return false;
  if (field.ok) { field.start(); return true; }
  const ok = field.init(canvas);
  if (!ok) { document.documentElement.classList.add('no-webgl'); return false; }
  field.start(); // begins as soon as the staged compile finishes
  return true;
}
