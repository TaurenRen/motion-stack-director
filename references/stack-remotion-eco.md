# 栈 B：Remotion + GSAP + Three.js + 手写 GLSL

在栈 A 基础上补三样东西：GSAP 的复杂编排能力、3D 空间、自定义着色器。
三样都要额外装包，且都有各自「必须照做否则就崩」的约束。

```bash
npm i @remotion/gsap @remotion/three three @react-three/fiber
```

版本必须与 `remotion` 精确一致。

---

## 一、GSAP：只能走 useGsapTimeline

`@remotion/gsap` 的桥接器做的事是：建一条 **paused** 的 timeline，每帧用当前帧换算成秒去 `seek()`。
所以它 100% 确定性。

```tsx
import { useGsapTimeline } from "@remotion/gsap";

const Intro: React.FC = () => {
  const ref = useGsapTimeline<HTMLDivElement>(({ timeline, selector }) => {
    timeline.from(selector(".eyebrow"), { opacity: 0, y: -16, duration: 0.35, ease: "power2.out" }, 0.05);
    timeline.from(
      selector(".title > span"),
      { y: 78, opacity: 0, rotateX: -58, duration: 0.6, stagger: 0.07, ease: "back.out(1.7)" },
      0.12,
    );
    timeline.fromTo(
      selector(".panel"),
      { rotateY: -34, opacity: 0 },
      { rotateY: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: "power3.out" },
      0.55,
    );
  }, { dependencies: [] });

  return <div ref={ref}>...</div>;
};
```

**绝对禁止**

```tsx
// ❌ 裸调，会挂真实 ticker，渲染漂移 / 卡死
gsap.to(".x", { opacity: 1 });
gsap.timeline().play();
```

- `selector(".x")` 是这个桥接器提供的、已 scoped 到当前 ref 的选择器，**不要用全局 `gsap.utils.toArray`**。
- `dependencies` 里放会影响 timeline 结构的值；只是播放参数变了不用放。
- 时间单位是**秒**，不是帧。`frame / fps` 才是秒。

**为什么值得用**：GSAP 的 `stagger`、`back.out(1.7)`、位置参数（第三个参数决定轨道起点）能表达
「五条轨道并行但各有自己的缓动」这种编排，纯 `interpolate` 写起来很啰嗦。

---

## 二、Three.js：ThreeCanvas + 全声明式

```tsx
import { ThreeCanvas } from "@remotion/three";

const Stage: React.FC<{ children: React.ReactNode; cameraZ?: number }> = ({
  children, cameraZ = 9.5,
}) => (
  <ThreeCanvas
    width={720}
    height={1280}
    camera={{ position: [0, 0, cameraZ], fov: 45 }}
    style={{ position: "absolute", inset: 0 }}
    gl={{ preserveDrawingBuffer: true }}
  >
    {children}
  </ThreeCanvas>
);
```

**必须记住的四点**

1. `width` / `height` **必填**，不会从父容器推断。
2. `gl={{ preserveDrawingBuffer: true }}` —— 不加有时截不出内容（黑帧）。
3. 渲染时 `frameloop` 被强制成 `'never'`，所以**不能用 `useFrame` 里的真实时间**，
   所有状态必须由 `frame` 推导。
4. 相机可以用 `useThree()` 拿到后在渲染体里直接 `set`：

```tsx
export const Rig: React.FC<{ frame: number; baseZ?: number; doll?: number }> = ({
  frame, baseZ = 7.2, doll = 0.9,
}) => {
  const { camera } = useThree();
  const z = baseZ - Math.sin((frame / 30) * 0.42) * doll;
  camera.position.set(
    Math.sin(frame * 0.0032) * 0.9,
    Math.sin(frame * 0.0042) * 0.6,
    z,
  );
  camera.lookAt(0, 0, 0);
  return null;
};
```

这看着像副作用，但因为每帧都由 `frame` 唯一决定，结果仍然确定。
关键是**不能累加**（`camera.position.x += ...` 就会漂）。

**竖画布的世界坐标预算**：720×1280、`camera z=9.5`、`fov=45` 时，
可用范围大约 **x ±2.2 / y ±3.9**。排布卡片和粒子时按这个估，超出就被裁掉。

---

## 三、手写 GLSL

`glsl.ts` 里有三组可直接用的：

| 导出 | 用途 | 主要 uniform |
|---|---|---|
| `BG_VERT` / `BG_FRAG` | 全屏背景平面，domain-warped fbm 星云 | `uTime` `uRes` `uIntensity` |
| `PT_VERT` / `PT_FRAG` | 加性混合粒子（点云） | `uTime` `uSize` `uColor` |
| `SURF_VERT` / `SURF_FRAG` | 菲涅尔描边 + 渐变表面 | `uColorA` `uColorB` `uTime` |

```tsx
import * as THREE from "three";
import { BG_VERT, BG_FRAG } from "./glsl";

const uniforms = useMemo(() => ({
  uTime: { value: 0 },
  uRes: { value: new THREE.Vector2(720, 1280) },
  uIntensity: { value: 0.85 },
}), []);

// 每帧更新（注意是赋值，不是累加）
uniforms.uTime.value = frame / 30;

<mesh>
  <planeGeometry args={[2, 2]} />
  <shaderMaterial vertexShader={BG_VERT} fragmentShader={BG_FRAG} uniforms={uniforms} />
</mesh>
```

**约定**

- `uTime = frame / fps`，**永远不要** 传 `performance.now()`。
- 噪声用 GLSL 里的 `hash()`（`sin(dot(p,vec2(127.1,311.7)))*43758.5453`），不要引入随机。
- 加性粒子混合需 `blending={THREE.AdditiveBlending}` + `depthWrite={false}`。
- 想要「空间中的中文卡片」：把文本画到 canvas 再转 `CanvasTexture`，贴到 `planeGeometry` 上
  —— 这样就绕过了「3D 里没法排中文」的问题。

---

## 四、确定性检查清单

渲染前逐条过：

- [ ] 没有裸 `gsap.to` / `.play()`
- [ ] 没有 `useFrame((state, delta) => ...)` 里的时间累加
- [ ] 没有 `Math.random()`
- [ ] 没有 `Date.now()` / `performance.now()`
- [ ] 所有 `uniforms` 更新都是赋值，不是 `+=`
- [ ] 相机 `position.set()` 用的是 `frame` 的纯函数

任何一条不过，就先修再渲。这类 bug 的表现是「本地预览正常、渲染出来乱跳」。

---

## 五、渲染

```bash
node node_modules/@remotion/cli/remotion-cli.js render src/index.tsx BoundaryEcosystem out/film.mp4 \
  --codec h264 --concurrency 4
```

Three 场景偶尔需要显式指定 WebGL 后端：

```bash
--gl=angle        # Windows 上通常最稳
--gl=swangle      # 无 GPU 环境的兜底
```

渲出来是黑帧 / 全是噪声，先换 `--gl` 参数，再查 `preserveDrawingBuffer`。
