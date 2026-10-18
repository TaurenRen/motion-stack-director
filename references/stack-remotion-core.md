# 栈 A：Remotion 核心（纯 React / CSS / SVG）

零第三方动画库，全部由 `useCurrentFrame()` 推导。这条栈的上限由你的**设计系统**决定，
不由框架决定——把 `assets/v720/` 那套组件吃透，能覆盖 80% 的知识类竖屏片。

## 环境

```bash
npm i remotion @remotion/cli react react-dom
```

`package.json` 里 `remotion` 与所有 `@remotion/*` **必须精确同版本**，不要用 `^`：

```json
{
  "dependencies": {
    "remotion": "4.0.534",
    "@remotion/cli": "4.0.534",
    "@remotion/three": "4.0.534"
  }
}
```

## 入口

```tsx
// src/index.tsx
import { registerRoot, Composition } from "remotion";
import { Film } from "./Film";

const Root: React.FC = () => (
  <>
    <Composition
      id="Film"
      component={Film}
      durationInFrames={456}
      fps={30}
      width={720}
      height={1280}
      defaultProps={{}}
    />
  </>
);

registerRoot(Root);
```

`registerRoot` 必须有，否则 CLI 找不到入口。

## 帧驱动的最小写法

```tsx
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

const Card: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 方式 1：区间映射
  const o = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 方式 2：弹性
  const s = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });

  return <div style={{ opacity: o, transform: `scale(${0.9 + 0.1 * s})` }} />;
};
```

**三条铁律**

1. 不用 `Date.now()` / `performance.now()` / `requestAnimationFrame` —— 会破坏确定性。
2. 不用 `Math.random()` —— 用 `mulberry32(seed)` 或 `noise1(i, seed)`（在 `theme.tsx`）。
3. 不用 CSS `transition` / `@keyframes` / `animation` —— 它们按真实时间跑，不跟帧。

## 用设计系统的组件

把 `assets/v720/` 五个文件拷到 `src/`，然后：

```tsx
import { AbsoluteFill } from "remotion";
import { C, F_CN, F_MONO, clamp, easeOut, seg } from "./theme";
import { BaseBackdrop, Grain, Scanlines, Vignette, GridBackdrop } from "./fx";
import { TechCard, Badge, PerWordCaption, Emph, Polaroid, NewsCard } from "./ui";
import { Scene } from "./transitions";

export const SceneA: React.FC<{ local: number; frame: number }> = ({ local, frame }) => (
  <AbsoluteFill>
    <GridBackdrop frame={frame} />
    <TechCard title="渲染吞吐" hint="frames / second" accent={C.cyan} o={easeOut(seg(local, 0, 12))}>
      <div style={{ fontFamily: F_MONO, fontSize: 44 }}>42</div>
    </TechCard>
    <PerWordCaption text="这是逐词弹出的字幕" local={local} start={10} per={5} />
    <Emph mode="highlight" local={local} start={30}>重点在这</Emph>
    <Grain frame={frame} opacity={0.14} />
    <Scanlines opacity={0.18} />
    <Vignette opacity={0.55} />
  </AbsoluteFill>
);
```

关键组件签名（改 props 前先对照）：

```ts
PerWordCaption: { text; local; start?; per?; o?; color?; activeColor?; size?; align?; w? }
Emph:           { children; mode: "highlight"|"underline"|"strike"; local; start; dur?; color?; size? }
TechCard:       { title?; hint?; accent?; children?; style?; o?; w?; pad? }
Polaroid:       { ... }   // 见 ui.tsx
Stamp / Badge / QuoteBox / NewsCard / GrowArrow / MaskWipe
Waveform:       { frame; bars; seed; h; w; color; dur }
Spectrum:       { frame; bars; h; w; color }

fx:
Grain           { frame; opacity?; id? }
Scanlines       { opacity?; gap? }
Vignette        { opacity? }
Chromatic       { ... }
GridBackdrop / ContourBackdrop / WaveBackdrop / Particles / BaseBackdrop / ProgressBar
```

## 串联多场景

```tsx
export const TOTAL = 456;

export const Film: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Scene from={0}   dur={78}  kind="none">   <S1 local={frame - 0}   frame={frame} /></Scene>
      <Scene from={68}  dur={90}  kind="wipe">   <S2 local={frame - 68}  frame={frame} /></Scene>
      <Scene from={148} dur={114} kind="blocks"> <S3 local={frame - 148} frame={frame} /></Scene>
      <Scene from={252} dur={90}  kind="push" dir={1}>
        <S4 local={frame - 252} frame={frame} />
      </Scene>
      <Scene from={332} dur={124} kind="scan">   <S5 local={frame - 332} frame={frame} /></Scene>
    </AbsoluteFill>
  );
};
```

`Scene` 的 `from` 与上一段的尾巴**故意重叠 8–14 帧**，转场才有交叠感，不是硬切。

## 渲染

```bash
# 列出所有 composition（先确认参数对不对）
node node_modules/@remotion/cli/remotion-cli.js compositions src/index.tsx

# 全片
node node_modules/@remotion/cli/remotion-cli.js render src/index.tsx Film out/film.mp4 \
  --codec h264 --concurrency 4

# 只渲 3 秒验证（强烈建议先做这步）
node node_modules/@remotion/cli/remotion-cli.js render src/index.tsx Film out/probe.mp4 \
  --frames 0-90
```

渲染前把 `remotion.config.ts` 设好：

```ts
import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");   // 比 png 快、体积小
Config.setOverwriteOutput(true);
Config.setCachingEnabled(false);      // 避免脏缓存导致改了代码不出效果
```

## 常见耗时点

- `--concurrency` 到 CPU 核数的 70% 左右最稳，再高会因为内存抖动变慢。
- 大尺寸 `filter: blur()` 很贵，能用预渲染位图就别实时算。
- 每帧都新建 `SVG feTurbulence` 会显著拖慢；`Grain` 已把 seed 变化降到最小。

## 质检

```bash
python <skill>/scripts/qc_video.py out/film.mp4 --out out
```

判据：亮度 <2 黑屏、>250 白屏、色组 <6 元素缺失、相邻采样指标完全相同 = 静帧事故。
