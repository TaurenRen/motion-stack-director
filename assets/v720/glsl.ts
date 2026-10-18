/** 手写 GLSL：氛围背景 + 粒子（样片 02 使用） */

/** 全屏背景平面：domain-warped fbm 星云 */
export const BG_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const BG_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform float uIntensity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(0.9, 1.6);
  float t = uTime * 0.09;

  vec2 q = vec2(fbm(p * 2.0 + t), fbm(p * 2.0 + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p * 3.0 + 4.0 * q + vec2(1.7, 9.2) + t * 1.3),
    fbm(p * 3.0 + 4.0 * q + vec2(8.3, 2.8) - t * 1.1)
  );
  float f = fbm(p * 2.5 + 4.0 * r);

  vec3 col = mix(vec3(0.015, 0.03, 0.06), vec3(0.04, 0.11, 0.21), clamp(f * f * 2.4, 0.0, 1.0));
  col = mix(col, vec3(0.31, 0.89, 0.76), clamp(length(q) * 0.45, 0.0, 1.0) * 0.55);
  col = mix(col, vec3(0.65, 0.55, 0.98), clamp(r.x * 0.72, 0.0, 1.0) * 0.42);
  col += 0.13 * pow(clamp(f, 0.0, 1.0), 3.0);

  // 极细的横向丝线：给画面一点“织物质感”
  col += 0.05 * vec3(0.4, 0.8, 1.0) * pow(abs(sin((uv.y + q.x * 0.06) * 42.0)), 8.0);

  // 暗角
  float d = length(uv - 0.5);
  col *= smoothstep(1.0, 0.26, d);

  // 扫描线
  col *= 0.93 + 0.07 * sin(uv.y * uRes.y * 1.2 + uTime * 2.2);

  gl_FragColor = vec4(col * uIntensity, 1.0);
}
`;

/** 粒子：加性混合发光点 */
export const PT_VERT = /* glsl */ `
attribute float aScale;
attribute float aPhase;
varying float vA;
uniform float uTime;
uniform float uSize;
void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.55 + aPhase) * 0.28;
  p.x += cos(uTime * 0.42 + aPhase * 1.7) * 0.22;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aScale * uSize * (1.0 / max(0.2, -mv.z));
  gl_Position = projectionMatrix * mv;
  vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 1.4 + aPhase * 3.1));
}
`;

export const PT_FRAG = /* glsl */ `
precision highp float;
varying float vA;
uniform vec3 uColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.02, d);
  gl_FragColor = vec4(uColor, a * vA);
}
`;

/** 几何体表面：菲涅尔描边效果的自定义材质 */
export const SURF_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SURF_FRAG = /* glsl */ `
precision highp float;
varying vec3 vNormal;
varying vec3 vPos;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
void main() {
  vec3 viewDir = normalize(-vPos);
  float fres = pow(1.0 - clamp(dot(viewDir, normalize(vNormal)), 0.0, 1.0), 2.4);
  float band = 0.5 + 0.5 * sin(vPos.y * 3.2 + uTime * 0.9);
  vec3 col = mix(uColorA, uColorB, band);
  col += fres * vec3(0.55, 0.95, 0.88);
  gl_FragColor = vec4(col, 0.35 + fres * 0.65);
}
`;
