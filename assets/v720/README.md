# v720 竖屏设计系统

720×1280 竖屏（抖音/视频号）的完整视觉底座。1701 行，已在四条成片里实测跑通。

## 怎么用

把这五个文件拷进项目的 `src/`：

```
theme.tsx  fx.tsx  ui.tsx  transitions.tsx  glsl.ts
```

依赖关系是单向的，**`theme.tsx` 是唯一的根**，其余三个 import 它。所以要和其他代码合并时，
只需保证 `theme.tsx` 在同级或调整 import 路径。

```bash
cp assets/v720/*.tsx assets/v720/glsl.ts <project>/src/
```

推荐的目录结构：

```
src/
├── theme.tsx          设计系统
├── fx.tsx
├── ui.tsx
├── transitions.tsx
├── glsl.ts
├── Film.tsx           主合成（串场景）
├── scenes/
│   ├── S1Title.tsx
│   ├── S2Text.tsx
│   └── ...
└── index.tsx          registerRoot
```

---

## `theme.tsx` —— 根

**画幅**

```ts
export const VW = 720;
export const VH = 1280;
export const FPS = 30;
export const TOTAL = 456;
export const XF = 12;        // 默认转场帧数
```

改画幅只改 `VW` / `VH`；组件内部全部用百分比和相对数值，会自动适配。
横屏改 1920×1080，高分竖屏改 1080×1920。

**色板**（深色科技风，冷调）

| 变量 | 值 | 用途 |
|---|---|---|
| `bg0` / `bg1` / `bg2` | `#05080F` → `#0F1B2C` | 背景三级 |
| `panel` / `panelSolid` | 半透明 / 实心面板 | 卡片底 |
| `line` / `lineStrong` | 描边 | 分割、卡片边框 |
| `ink` / `dim` / `faint` | `#E9F1FA` / `#93A7C4` / `#5B6E8B` | 正文三级 |
| `cyan` / `blue` / `violet` / `amber` / `rose` / `green` | 强调色 | 主题、标签、数据 |
| `paper` | `#F3F0E8` | 浅色反白块（宣纸/纸张质感） |

**字体**

```ts
F_CN      // 中文正文
F_MONO    // 数字、代码、标签
F_SERIF   // 衬线，做标题对比
```

**工具**

```ts
clamp(v, a, b)       // 夹取，默认 0–1
seg(f, a, b)         // 把帧区间 [a,b] 归一化成 0–1（最常用）
easeOut / easeIn / easeInOut / easeOutBack
mulberry32(seed)     // 确定性伪随机，替代 Math.random
noise1(i, seed)      // 一维确定性噪声
fadeIO(local, dur, xf)   // 首尾淡入淡出
```

`seg` 是写得最多的一行：`const t = easeOut(seg(local, 12, 30))` 意思是「第 12 帧到 30 帧
缓出推进 0→1」。全片所有动画都由这个模式拼出来。

---

## `fx.tsx` —— 背景与氛围层

叠在内容之上/之下，全部是绝对定位满屏。

| 组件 | props | 说明 |
|---|---|---|
| `BaseBackdrop` | `tint?` | 基础渐变底，一般第一层 |
| `GridBackdrop` | — | 网格纸 |
| `ContourBackdrop` | — | 流动等高线 |
| `WaveBackdrop` | — | 波浪带 |
| `Particles` | — | 漂浮粒子 |
| `Grain` | `frame, opacity?, id?` | 胶片颗粒（SVG feTurbulence，逐帧换 seed） |
| `Scanlines` | `opacity?, gap?` | 扫描线 |
| `Vignette` | `opacity?` | 暗角 |
| `Chromatic` | — | 色差 |
| `ProgressBar` | `frame, total, color?` | 底部进度条 |

**层级顺序建议**：`BaseBackdrop` → 背景纹理 → 内容 → `Chromatic` → `Grain` → `Scanlines` → `Vignette`。
颗粒放最上层、透明度 0.06–0.14，是「电影感」最便宜的一招。

`Grain` 的 `id` 在同一画面出现多个实例时必须唯一，否则 SVG filter 会互相覆盖。

---

## `ui.tsx` —— 内容组件

| 组件 | 说明 |
|---|---|
| `TechCard` | 科技感卡片，渐变底 + 内发光 + 双层阴影。`{ title?, hint?, accent?, o?, w?, pad? }` |
| `Badge` | 小徽章 |
| `Stamp` | 印章（旋转 + 粗糙边缘） |
| `QuoteBox` | 引用框 |
| `Polaroid` | 拍立得相框 |
| `NewsCard` | 新闻卡（标题条 + 正文） |
| `PerWordCaption` | **逐词弹出字幕**。中文按字、英文按词自动切分 |
| `Emph` | 高亮 / 下划线 / 划掉三种强调 |
| `Waveform` | 波形图（合成，**不读真实音频**） |
| `Spectrum` | 频谱条（合成） |
| `GrowArrow` | 生长箭头 |
| `MaskWipe` | 蒙版擦除 |
| `SectionLabel` | 小节标签 |

`PerWordCaption` 的切分逻辑值得单独记住：

```ts
text.split(/(?<=[\u4e00-\u9fa5])|(?<=\s)/)
```

按「汉字之后」或「空白之后」断开——中文逐字、英文逐词，一套正则同时处理。

---

## `transitions.tsx` —— 场景与转场

```tsx
<Scene from={68} dur={90} kind="wipe">
  <S2 local={frame - 68} frame={frame} />
</Scene>
```

| `kind` | 效果 |
|---|---|
| `none` | 硬切 |
| `wipe` | 斜向擦除（mask-image 渐变） |
| `blocks` | 方块阵列 |
| `scan` | 扫描线推进 |
| `push` | 上下推入，`dir={-1 \| 1}` 控制方向 |

还导出 `CameraPush`（整场镜头推拉）、`SceneLocal`、`FadeOutShell`。

**关键技巧**：相邻场景的 `from` 与上一段的 `from + dur` **故意重叠 8–14 帧**，
转场才有交叠，不是硬切。

---

## `glsl.ts` —— 三组手写着色器

纯字符串，配合 `@remotion/three` 的 `shaderMaterial` 使用。

| 导出 | 用途 |
|---|---|
| `BG_VERT` / `BG_FRAG` | 全屏星云背景（domain-warped fbm） |
| `PT_VERT` / `PT_FRAG` | 加性混合粒子 |
| `SURF_VERT` / `SURF_FRAG` | 菲涅尔描边表面 |

用法见 `references/stack-remotion-eco.md`。核心约定：`uTime = frame / fps`，
且**赋值而非累加**。

---

## 改造成其他风格

这套是「深色 + 冷调 + 科技感」。要换风格，改三处就够：

1. **色板** —— `theme.tsx` 的 `C`。换成暖色/低饱和，整体气质立刻变。
2. **字体** —— `F_CN` / `F_SERIF`。换成思源宋体 + 手写体，就是人文感。
3. **背景层** —— 把 `GridBackdrop` 换成 `paper` 底 + 噪点，就是纸张质感。

组件结构不用动。这也是为什么值得把它沉淀成资产：**换皮成本极低**。

---

## 已验证的画幅

| 画幅 | 状态 |
|---|---|
| 720×1280 | ✅ 四条样片实测 |
| 1080×1920 | 理论可用（改 `VW`/`VH`，字号需等比放大 1.5×） |
| 1920×1080 | 需重排版式（竖屏的纵向堆叠逻辑不适用） |
