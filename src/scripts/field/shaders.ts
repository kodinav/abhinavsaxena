/**
 * GLSL for the field. Simplex noise after Ian McEwan / Ashima Arts (MIT).
 */
export const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float hash1(float n){ return fract(sin(n)*43758.5453123); }
`;

/* ---------------- particle update (transform feedback) ---------------- */
export const UPDATE_VS = `#version 300 es
precision highp float;
in vec2 a_pos; in vec2 a_vel; in float a_life; in float a_seed;
out vec2 v_pos; out vec2 v_vel; out float v_life;
uniform vec2 u_res, u_pointer, u_pointerVel, u_drive;
uniform float u_time, u_dt, u_scale, u_speed, u_structure, u_converge, u_swirl, u_scroll, u_pointerOn;
uniform vec4 u_anchors[12];
uniform int u_anchorCount, u_active;
uniform float u_activeT;
uniform sampler2D u_trail;
${NOISE}
vec2 respawn(float seed, float t){
  float k = floor(t);
  return vec2(hash1(seed*12.9898 + k*0.731), hash1(seed*78.233 + k*0.517 + 1.0)) * u_res;
}
void main(){
  vec2 p = a_pos; vec2 vel = a_vel; float life = a_life - u_dt;
  float hs = hash1(a_seed);
  // --- curl of a scalar noise potential
  float s = u_scale; float eps = 0.9 / s;
  vec3 np = vec3(p * s, u_time * 0.07 + hs * 0.2);
  float n1 = snoise(np + vec3(0.0, eps*s, 0.0));
  float n2 = snoise(np - vec3(0.0, eps*s, 0.0));
  float n3 = snoise(np + vec3(eps*s, 0.0, 0.0));
  float n4 = snoise(np - vec3(eps*s, 0.0, 0.0));
  vec2 curl = vec2(n1 - n2, -(n3 - n4));
  vec2 dir = normalize(curl + vec2(1e-4, 0.0));
  // --- structure: quantise flow into four lanes (machine-like order)
  float ang = atan(dir.y, dir.x);
  float q = floor(ang / 1.5707963 + 0.5) * 1.5707963;
  vec2 qdir = vec2(cos(q), sin(q));
  dir = normalize(mix(dir, qdir, u_structure) + vec2(1e-4, 0.0));
  vec2 force = dir * 70.0;
  // --- global tendencies: converge to / swirl around the centre
  vec2 c = u_res * 0.5; vec2 toC = c - p; float dC = length(toC) + 1.0; vec2 nC = toC / dC;
  float ring = smoothstep(0.0, 260.0, dC);
  force += nC * u_converge * 110.0 * ring + vec2(-nC.y, nC.x) * u_swirl * 90.0 * ring;
  force += u_drive * 90.0;
  // --- concept anchors: orbital wells
  for (int i = 0; i < 12; i++) {
    if (i >= u_anchorCount) break;
    vec4 a = u_anchors[i];
    if (a.z <= 0.0) continue;
    vec2 d = a.xy - p; float dist = length(d) + 1.0; vec2 nd = d / dist;
    float R = 160.0 + 320.0 * a.z;
    float w = smoothstep(R, 0.0, dist) * a.z;
    float near = smoothstep(0.0, 28.0, dist); // hollow core so the word stays legible
    force += (nd * 0.55 + vec2(-nd.y, nd.x) * 0.95) * w * near * 320.0;
  }
  // --- pointer: a soft vortex that carries momentum
  vec2 dp = p - u_pointer; float dd = length(dp) + 1.0; float pw = smoothstep(240.0, 0.0, dd) * u_pointerOn;
  force += (vec2(-dp.y, dp.x) / dd) * pw * 220.0 + u_pointerVel * pw * 0.4;
  // --- ink trail displacement
  vec3 tr = texture(u_trail, vec2(p.x / u_res.x, 1.0 - p.y / u_res.y)).rgb;
  force += (tr.gb * 2.0 - 1.0) * tr.r * 520.0;
  // --- integrate
  vel = mix(vel, force * u_speed, 0.075);
  p += vel * u_dt * (0.55 + 0.9 * hs);
  p.y -= u_scroll * u_dt * 260.0 * (0.4 + hs);
  if (life <= 0.0 || p.x < -24.0 || p.x > u_res.x + 24.0 || p.y < -24.0 || p.y > u_res.y + 24.0) {
    p = respawn(a_seed, u_time * 0.61 + a_seed * 7.0);
    vel = vec2(0.0);
    life = 2.5 + 7.0 * hash1(a_seed * 3.1 + u_time);
  }
  v_pos = p; v_vel = vel; v_life = life;
}`;
export const UPDATE_FS = `#version 300 es
precision mediump float; out vec4 o; void main(){ o = vec4(0.0); }`;

/* ---------------- particle render ---------------- */
export const POINT_VS = `#version 300 es
precision highp float;
in vec2 a_pos; in vec2 a_vel; in float a_life; in float a_seed;
uniform vec2 u_res; uniform float u_dpr, u_size, u_activeT, u_alpha, u_textMask;
uniform vec4 u_anchors[12]; uniform int u_active;
out float v_alpha; out float v_tint;
float hash1(float n){ return fract(sin(n)*43758.5453123); }
void main(){
  vec2 ndc = vec2(a_pos.x / u_res.x * 2.0 - 1.0, 1.0 - a_pos.y / u_res.y * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  float h = hash1(a_seed);
  float sp = length(a_vel);
  gl_PointSize = (u_size * (0.5 + h * 1.1) + smoothstep(0.0, 300.0, sp) * 0.9) * u_dpr;
  v_alpha = smoothstep(0.0, 0.9, a_life) * (0.45 + 0.55 * h) * u_alpha;
  // keep the text column quiet: fade particles on the left when a hero is present
  float mask = mix(1.0, mix(0.22, 1.0, smoothstep(0.30, 0.66, a_pos.x / u_res.x)), u_textMask);
  float top = smoothstep(0.0, 90.0, a_pos.y); // and under the navigation bar
  v_alpha *= mask * (0.35 + 0.65 * top);
  float t = 0.0;
  if (u_active >= 0) { vec4 a = u_anchors[u_active]; float d = length(a.xy - a_pos); t = smoothstep(420.0, 30.0, d) * u_activeT; v_alpha = max(v_alpha, t * 0.9 * u_alpha); }
  v_tint = t;
}`;
export const POINT_FS = `#version 300 es
precision mediump float;
in float v_alpha; in float v_tint;
uniform vec3 u_ink, u_accent;
out vec4 o;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.12, d) * v_alpha;
  vec3 col = mix(u_ink, u_accent, v_tint);
  o = vec4(col * a, a);
}`;

/* ---------------- ink fog ---------------- */
export const FOG_FS = `#version 300 es
precision highp float;
uniform vec2 u_res; uniform float u_time, u_fog, u_tint, u_scroll, u_octaves, u_textMask;
uniform vec3 u_ink, u_accent; uniform sampler2D u_trail;
out vec4 o;
${NOISE}
float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { if (float(i) >= u_octaves) break; v += a * snoise(p); p = p * 2.03 + 11.0; a *= 0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (uv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
  vec3 tr = texture(u_trail, uv).rgb;
  p += (tr.gb * 2.0 - 1.0) * tr.r * 0.32;
  float t = u_time * 0.045;
  vec2 q = vec2(fbm(vec3(p * 1.3, t)), fbm(vec3(p * 1.3 + 5.2, t + 3.0)));
  vec2 r = vec2(fbm(vec3(p * 1.3 + 3.2 * q + vec2(1.7, 9.2), t * 1.2)), fbm(vec3(p * 1.3 + 3.2 * q + vec2(8.3, 2.8), t * 1.1)));
  float f = fbm(vec3(p * 1.3 + 3.0 * r, t * 0.9));
  float v = smoothstep(-0.15, 0.85, f);
  v = v * v;
  float ember = smoothstep(0.55, 1.1, length(r)) * u_tint;
  vec3 col = mix(u_ink, u_accent, ember);
  float vign = smoothstep(1.35, 0.35, length(p));
  float mask = mix(1.0, mix(0.3, 1.0, smoothstep(0.28, 0.66, uv.x)), u_textMask);
  float a = (v * u_fog * 0.2 * (1.0 - u_scroll * 0.7) * (0.55 + 0.45 * vign) + tr.r * 0.05 * u_fog) * mask;
  o = vec4(col * a, a);
}`;

/* ---------------- trail (pointer ink) ---------------- */
export const TRAIL_FS = `#version 300 es
precision mediump float;
uniform sampler2D u_prev; uniform vec2 u_res, u_pointer, u_vel; uniform float u_decay, u_radius, u_strength, u_aspect;
out vec4 o;
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  vec3 prev = texture(u_prev, uv).rgb;
  prev.r *= u_decay;
  float d = length((uv - u_pointer) * vec2(u_aspect, 1.0));
  float s = smoothstep(u_radius, 0.0, d) * u_strength;
  vec3 splat = vec3(1.0, u_vel * 0.5 + 0.5);
  vec3 c = mix(prev, splat, s);
  o = vec4(c, 1.0);
}`;

/* ---------------- textured blit ---------------- */
export const BLIT_FS = `#version 300 es
precision mediump float;
uniform sampler2D u_tex; uniform vec2 u_res;
out vec4 o;
void main(){ o = texture(u_tex, gl_FragCoord.xy / u_res); }`;

/* ---------------- threads & anchor glows ---------------- */
export const LINE_VS = `#version 300 es
precision highp float;
in vec2 a_pos; in float a_t;
uniform vec2 u_res; uniform float u_progress;
out float v_a;
void main(){
  vec2 ndc = vec2(a_pos.x / u_res.x * 2.0 - 1.0, 1.0 - a_pos.y / u_res.y * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  v_a = (a_t <= u_progress) ? smoothstep(0.0, 0.08, u_progress - a_t) : 0.0;
}`;
export const LINE_FS = `#version 300 es
precision mediump float;
in float v_a; uniform vec3 u_accent; uniform float u_alpha;
out vec4 o;
void main(){ float a = v_a * u_alpha; o = vec4(u_accent * a, a); }`;

export const GLOW_VS = `#version 300 es
precision highp float;
in vec2 a_pos; in float a_size; in float a_k;
uniform vec2 u_res; uniform float u_dpr;
out float v_k;
void main(){
  vec2 ndc = vec2(a_pos.x / u_res.x * 2.0 - 1.0, 1.0 - a_pos.y / u_res.y * 2.0);
  gl_Position = vec4(ndc, 0.0, 1.0);
  gl_PointSize = a_size * u_dpr; v_k = a_k;
}`;
export const GLOW_FS = `#version 300 es
precision mediump float;
in float v_k; uniform vec3 u_accent;
out vec4 o;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = (smoothstep(1.0, 0.0, d) * 0.35 + smoothstep(0.22, 0.0, d) * 0.9) * v_k;
  o = vec4(u_accent * a, a);
}`;
