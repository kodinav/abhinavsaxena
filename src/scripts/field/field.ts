import { program, buffer, target, destroyTarget, Uniforms, QUAD_VS, type Target } from './gl';
import { UPDATE_VS, UPDATE_FS, POINT_VS, POINT_FS, FOG_FS, TRAIL_FS, BLIT_FS, LINE_VS, LINE_FS, GLOW_VS, GLOW_FS } from './shaders';
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
  // particle buffers (ping-pong)
  private bufPos: WebGLBuffer[] = []; private bufVel: WebGLBuffer[] = []; private bufLife: WebGLBuffer[] = []; private bufSeed!: WebGLBuffer;
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
  private tickers = 0;

  /* ------------------------------------------------------------ setup */
  init(canvas: HTMLCanvasElement) {
    if (this.ok || this.gl) return true;
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    if (!gl) return false;
    this.gl = gl;
    this.reduced = prefersReducedMotion();
    this.budget = deviceBudget();
    // software renderers (CI, virtual machines): keep the field light so the page stays responsive
    try {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
      if (/swiftshader|llvmpipe|software|mesa offscreen/i.test(renderer)) this.budget = 0.12;
    } catch {}
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
  }

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
    this.bufPos = []; this.bufVel = []; this.bufLife = []; this.vaoUpdate = []; this.vaoRender = []; this.tf = [];
    this.N = n;
    const pos = new Float32Array(n * 2), vel = new Float32Array(n * 2), life = new Float32Array(n), seed = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 2] = Math.random() * this.W; pos[i * 2 + 1] = Math.random() * this.H; life[i] = Math.random() * 9; seed[i] = Math.random() * 1000 + 1; }
    this.bufSeed = buffer(gl, seed);
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
      this.step(dt); this.draw();
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
    // particles
    if (alpha > 0.005) {
      gl.useProgram(this.pPoint);
      const u = this.uPoint;
      u.v2('u_res', this.W, this.H); u.f('u_dpr', this.dpr); u.f('u_size', c.size); u.f('u_activeT', this.activeT); u.f('u_alpha', alpha); u.f('u_textMask', c.textMask);
      u.v4a('u_anchors', this.anchorArr); u.i('u_active', this.active);
      u.v3('u_ink', ink[0], ink[1], ink[2]); u.v3('u_accent', acc[0], acc[1], acc[2]);
      gl.bindVertexArray(this.vaoRender[this.cur]);
      gl.drawArrays(gl.POINTS, 0, Math.round(this.N * clamp(c.density, 0, 1)));
      gl.bindVertexArray(null);
    }
    // threads + glows
    if (this.active >= 0 && this.activeT > 0.01) this.drawThreads(acc as number[]);
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
