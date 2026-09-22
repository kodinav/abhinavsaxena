/** Minimal WebGL2 helpers. */
export function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('Shader compile error: ' + log + '\n' + src.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n'));
  }
  return sh;
}

export function program(gl: WebGL2RenderingContext, vs: string, fs: string, tfVaryings?: string[]) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  if (tfVaryings) gl.transformFeedbackVaryings(p, tfVaryings, gl.SEPARATE_ATTRIBS);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Program link error: ' + gl.getProgramInfoLog(p));
  return p;
}

export class Uniforms {
  private cache = new Map<string, WebGLUniformLocation | null>();
  constructor(private gl: WebGL2RenderingContext, private prog: WebGLProgram) {}
  loc(name: string) {
    if (!this.cache.has(name)) this.cache.set(name, this.gl.getUniformLocation(this.prog, name));
    return this.cache.get(name)!;
  }
  f(name: string, v: number) { this.gl.uniform1f(this.loc(name), v); }
  i(name: string, v: number) { this.gl.uniform1i(this.loc(name), v); }
  v2(name: string, x: number, y: number) { this.gl.uniform2f(this.loc(name), x, y); }
  v3(name: string, x: number, y: number, z: number) { this.gl.uniform3f(this.loc(name), x, y, z); }
  v4a(name: string, arr: Float32Array) { this.gl.uniform4fv(this.loc(name), arr); }
}

export function buffer(gl: WebGL2RenderingContext, data: BufferSource | number, usage: GLenum = gl.STATIC_DRAW) {
  const b = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, data as any, usage);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return b;
}

export interface Target { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number }

export function target(gl: WebGL2RenderingContext, w: number, h: number, linear = true): Target {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linear ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return { fb, tex, w, h };
}

export function destroyTarget(gl: WebGL2RenderingContext, t: Target) {
  gl.deleteFramebuffer(t.fb);
  gl.deleteTexture(t.tex);
}

/** Fullscreen triangle VAO (no attributes needed; uses gl_VertexID). */
export const QUAD_VS = `#version 300 es
void main(){
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
