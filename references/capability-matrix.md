# 能力矩阵（32 项 × 4 栈）

判据来自四条实测样片（720×1280 / 30fps / 14–15s）。每格标注的是**实现路径**，
不是「框架理论上支不支持」。

符号：**现成** = 有组件或原生 API，直接调；**手写** = 能做但要自己实现；**无** = 结构性不可行。

> 用法：拆完元素清单后，逐条在这里查到实现路径。出现连续 3 个「无」就换栈。

---

## 1. 文字与排版

| 元素 | Remotion 核心 | HyperFrames | Skia |
|---|---|---|---|
| 逐词/逐字弹出字幕 | **现成** `PerWordCaption`（`ui.tsx`），按中日韩字符边界 split | **手写** span 包裹 + GSAP stagger 0.04–0.08s | **手写** `measureText` 逐字算 x，无 kerning 自动处理 |
| 高亮 / 下划线 / 划掉 | **现成** `Emph mode="highlight\|underline\|strike"` | **手写** 内联 span + `background-size` 动画 或 SVG line | **手写** 需分层：底框 → 线 → 文字，三次 drawText |
| 中文段落自动折行 | **现成** DOM 原生 | **现成** DOM 原生 | **无** 单行 `drawText` 不支持；要上 `ParagraphBuilder`（成本高） |
| 自定义字体 | **现成** CSS `@font-face` 或 `loadFont` | **现成** CSS `@font-face` | **手写** `MakeFreeTypeFaceFromData` 装 TTF，CanvasKit 无系统字体 |
| 印章 / 徽章 / 引用框 | **现成** `Stamp` / `Badge` / `QuoteBox` | **手写** div + CSS transform rotate | **手写** rrect + 旋转 canvas |
| 大数字滚动 | **手写** `Math.round(interpolate(...))` | **手写** 同上 | **手写** 同上 + 逐帧 drawText |

## 2. 卡片与版式

| 元素 | Remotion 核心 | HyperFrames | Skia |
|---|---|---|---|
| 圆角文字卡 / 科技卡 | **现成** `TechCard`（渐变底 + 内发光 + 双层阴影） | **手写** div + CSS，效果同源但要自己调 | **手写** `drawRRect` + `clipRRect` |
| 拍立得 / 新闻卡 / 分屏 | **现成** `Polaroid` / `NewsCard`；分屏用 flex | **手写** flex + 伪元素 | **手写** 全部手绘，无 flex |
| 阴影 / 内发光 / 圆角 | **现成** CSS | **现成** CSS | **手写** `drawShadow` + 多层模糊，贵 |
| 任意层级堆叠 | **现成** `z-index` | **现成** `z-index` | **手写** 绘制顺序即层级，需手工排 |
| 图文混排（图绕字） | **现成** `float` / grid | **现成** 同 | **无** |

## 3. 背景与氛围

| 元素 | Remotion 核心 | HyperFrames | Skia |
|---|---|---|---|
| 网格纸 | **现成** `GridBackdrop` | **手写** `repeating-linear-gradient` | **手写** 循环 drawLine |
| 等高线 | **现成** `ContourBackdrop`（sin 叠加 + 噪声扰动） | **手写** SVG path 或 canvas | **手写** Path + 噪声 |
| 波浪 | **现成** `WaveBackdrop` | **手写** SVG path 逐帧重算 | **手写** 同 |
| 胶片颗粒 / 噪点 | **现成** `Grain`（SVG feTurbulence，逐帧换 seed） | **手写** canvas ImageData 噪声，逐帧 | **现成** Noise shader |
| 扫描线 | **现成** `Scanlines` | **手写** `repeating-linear-gradient` | **手写** 循环横线 |
| 暗角 | **现成** `Vignette`（radial-gradient） | **手写** 同 | **手写** 径向渐变 shader |
| 色差（chromatic） | **现成** `Chromatic`（多层 text-shadow 位移） | **手写** 多层叠加或 SVG filter | **手写** 三通道分层重绘 + 偏移 |
| 景深虚化 / 发光 | **手写** CSS `filter: blur()`，成本低 | **手写** 同 | **现成** `Blur` / `MaskFilter.MakeBlur` |

## 4. 图形与矢量

| 元素 | Remotion 核心 | HyperFrames | Skia |
|---|---|---|---|
| 线条生长 | **现成** SVG `strokeDasharray` + `strokeDashoffset` | **现成** 同（GSAP 驱动） | **现成** `Path` + `start/end` Trim |
| 圆形蒙版 / 擦除 | **现成** `MaskWipe`（`clip-path` 或 mask-image） | **现成** `clip-path` | **现成** `clip` + `XYWHRect` |
| 手绘抖动笔触 | **手写** 需引 `rough-notation`（MIT） | **手写** 同 | **现成** 自绘抖动 path |
| 任意形状 morph | **手写** 引 `flubber`（MIT）做路径插值 | **手写** 同 | **现成** `Path.interpolate` |
| 箭头 / 圈选 / 标注 | **现成** `GrowArrow` | **手写** SVG | **现成** 手绘最自然 |
| 沿路径运动 | **手写** `getPointAtLength()` | **手写** 同 | **手写** `PathMeasure` |

## 5. 数据可视化

| 元素 | Remotion 核心 | HyperFrames | Skia |
|---|---|---|---|
| 条形 / 折线 / 面积图 | **手写** SVG 或 div 宽度插值 | **手写** 同 | **手写** 全手绘 |
| 环形进度 | **手写** SVG circle dasharray | **手写** 同 | **手写** arc |
| 波形 / 频谱 | **现成** `Waveform` / `Spectrum`（**合成波形，不读真实音频**） | **手写** canvas 柱状 | **手写**，成本过高不推荐 |
| 数据地图 / 航线 | **手写** `d3-geo` + SVG path | **手写** 同 | **手写** |

> 真实音频驱动可视化：四条样片都没做。要做需先解码音频成逐帧振幅数组，
> 再喂给 Waveform 的 `values`，不要指望组件自带。

## 6. 三维与着色器

| 元素 | Remotion 核心 | HyperFrames | Skia |
|---|---|---|---|
| 3D 几何体 / 点云 | **无** 需 `@remotion/three` | **现成** Three.js 直连 | **无** |
| 相机推拉 / 轨道 | **无** 需 `@remotion/three` | **现成** Three.js camera | **无** |
| 自定义 GLSL | **无** 需 three + `ShaderMaterial`，或 Skia | **现成** Three.js `ShaderMaterial` | **手写** `RuntimeEffect` |
| 3D 空间中的卡片 | **无** 需 three + Drei `Html` 类思路 | **手写** CSS3D 或 billboard 手算投影 | **无** |
| 后处理（bloom/景深） | **无** 需 `@react-three/postprocessing` | **现成** 同 | **手写** 多层模糊 |

## 7. 互操作与媒体

| 元素 | Remotion 核心 | HyperFrames | Skia |
|---|---|---|---|
| 视频嵌入 / 拼接 | **现成** `OffthreadVideo`（推荐）/ `Video` | **现成** `<video class="clip">` | **无** 不能播视频 |
| 图片 | **现成** `Img` / `staticFile` | **现成** `<img>` | **现成** `Image` |
| 音频 / 配音 | **现成** `<Audio>` | **现成** `<audio>` | **无** |
| Lottie | **手写** 引 `@remotion/lottie` | **现成** `lottie-web` 直连 | **无** |
| 外部素材路径 | `staticFile()` → `public/` | 相对路径 | `staticFile()` |

## 8. 生产环境

| 维度 | Remotion 核心 | HyperFrames | Skia |
|---|---|---|---|
| 帧级确定性 | **原生**（`useCurrentFrame`） | **约定式**（paused timeline + `__timelines`） | **原生** |
| 打包步骤 | 需要（webpack） | **不需要**（HTML 直跑） | 需要（+ `enableSkia` override） |
| TypeScript | 完整 | 无 | 完整 |
| 并发分片 | `--concurrency` | `-w` | `--concurrency` |
| 单文件分发 | 否 | **是** | 否 |
| 依赖体积 | 178 包 / 26 个 `@remotion/*` | 75 包 / 4 个直接依赖 | 182 包 / 24 个 `@remotion/*` |
| 成片体积（720×1280） | 0.34 MB/s | 1.61 MB/s | 0.21 MB/s |

---

## 选型时的三个否决信号

1. **需要大段中文 + 选 Skia** → 立刻换 DOM 栈。这是最贵的误判。
2. **需要 3D/GLSL + 选 Remotion 核心包** → 必须加 `@remotion/three`，别以为核心包能做。
3. **需要商用 + 公司 >3 人 + 选 Remotion** → 先确认许可预算，否则换 HyperFrames。
