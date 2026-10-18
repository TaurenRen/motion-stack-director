---
name: motion-stack-director
description: 代码生成视频的技术栈选型与视觉元素匹配：把任意视频需求（口播动画段、数据故事、科普、产品片、竖屏短视频、片头）映射到最合适的渲染栈——Remotion 核心 / Remotion+GSAP+Three+GLSL / HyperFrames 单 HTML / React Native Skia——并给出该栈下每个视觉元素的具体实现路径与可复用组件。含 32 项能力矩阵、三条结构性边界、720×1280 竖屏设计系统源码（逐词字幕、科技卡、拍立得、噪点扫描线、5 种转场、3 组 GLSL）、抽帧质检脚本。当用户要做代码生成的视频、问该用哪个框架、需要某种视觉元素（逐词字幕/粒子/星云/手绘标注/3D/Lottie）、要判断某效果能不能实现、或要评估不同技术路线的能力边界时使用。
agent_created: true
---

# 视觉栈导演

把「我想要这样的片子」翻译成「用哪套栈、调哪些元素、拿什么组件写」。

这里的判断全部来自四条真实渲染的样片实测，不是文档推演。四条 720×1280 竖屏成片
（纯 Remotion 核心 / Remotion+GSAP+Three+GLSL / HyperFrames 单 HTML / Remotion+Skia），
各 15 秒左右，另有一份 32 项 × 4 栈的能力矩阵对比页，可随时打开对照。

## 核心立场

**不要问「哪个框架更强」，要问「这个需求的约束落在哪」。** 四条路都能出大片，差别在维护成本、
翻车概率和踩坑位置。选错栈的代价不是「做不出来」，而是「做到 80% 才发现架构不对，全部重写」。

## 第一步：三问定栈

拿到任何需求，先答这三个问题，不要跳过。

### 问 1 · 这套东西要做几期？

| 答案 | 选栈 | 理由 |
|---|---|---|
| 一期就完 / 想尽快看到成片 | **HyperFrames** | 单 HTML，无打包，改一行刷新就见效；AI 生成最不易崩 |
| 长期按模板出片（第二期起要复用） | **Remotion** | 组件沉淀成设计系统后边际成本断崖下降；帧级可复现，改文案重渲即可 |
| 只要一段特殊质感的插入镜头 | **Skia** | 手绘/笔触/有机感 DOM 做不出来；渲成透明底 MP4 再拼进主片 |

### 问 2 · 视觉重心落在哪？

- **中文文字、卡片、图表、版式** → DOM 栈（Remotion 核心 或 HyperFrames）。中文自动折行是免费红利。
- **3D、粒子、星云、空间感** → Remotion+Three 或 HF+Three。两条路都要**手写 GLSL**，没有开箱 shader 组件。
- **手绘线条、圈选标注、笔触、形状 morph、发光模糊** → **Skia**。
- **真人/口播为主，动效只是包装** → 转 `ai-video-production`；本技能只负责产出动画段素材。

### 问 3 · 有没有硬约束？

| 约束 | 决定 |
|---|---|
| 商用许可要干净（公司营利且 >3 人） | **HyperFrames**（Apache-2.0）。Remotion 双轨非 MIT，需付费 |
| 要帧级可复现、批量改文案重渲 | **Remotion**。这是它的护城河 |
| 要一个能直接分发/双击打开的单文件 | **HyperFrames** |
| 团队没人写 React | **HyperFrames** |
| 要并发分片快渲、长片 | **Remotion**（`--concurrency`） |
| 要嵌真人实拍素材 | 都行；Remotion 用 `OffthreadVideo`，HF 用 `<video class="clip">` |

## 第二步：定节奏（比选栈更容易翻车）

**技术全对、渲染全过、质检全 PASS，片子依然可能「很一般」——原因几乎总是节奏。**

真实教训：同一个「涌现」主题、同一套栈，第一版 8 段（每段 5–10s）被判「效果很一般」，
换成 13–17 镜（平均 3.5s 一换）后通过。差距是 4 倍的画面刷新率。

### 硬指标

| 指标 | 门槛 |
|---|---|
| 任意两个切点间隔 | **≤ 5.2s** |
| 60 秒片的镜头数 | **≥ 13**（不要 8） |
| 单镜内的 action beat | **≥ 2**（「淡入」不算 beat） |
| 同一视觉手段连续出现 | **≤ 2 镜** |
| 设计系统组件覆盖率 | **≥ 80%**（否则那 20 个组件等于白写） |

### 做法：先写节拍表，再写场景

把 `start / end / text / beats[]` 落成**独立数据文件**（如 `beats.ts`），
主合成只做机械映射：

```tsx
{SHOTS.map((s, i) => {
  const next = SHOTS[i + 1];
  return (
    <Sequence key={s.i}
      from={Math.round(s.start * FPS)}
      durationInFrames={(next ? Math.round(next.start * FPS) : TOTAL) - Math.round(s.start * FPS)}>
      <Comp />
    </Sequence>
  );
})}
```

场景组件内部**禁止**再判断「现在是第几阶段」——那是节拍表的职责。

### 必须有全局特效栈

这是「幻灯片」与「成片」的分界线。缺任何一层都会掉质感：

| 层 | 作用 | 参数经验 |
|---|---|---|
| 手持微动 | 极微推拉+倾斜，看不出在动但拿掉就假 | 位移 ≤4px / 旋转 ≤0.12° |
| 扫光 | 给静态构图「光在走」 | period 6–7.4s, peak 0.13–0.16 |
| 快门闪 | 切点白闪，形成极性冲击 | 宽 0.05s, peak 0.4 |
| 暗场呼吸 | 句间极短暗场，避免硬切到黑 | 0.1s 高斯，暗度 0.32 |
| 颗粒 + 扫描线 | 消除数字感 | 见 `pitfalls.md` H 节 |
| 星尘底纹 | 一次生成 dataURL 复用 | 1400 点, op 0.26 |
| 字幕条 | 无配音时字幕即叙事 | 逐字点亮，不整句一起亮 |

**浅底（纸白）镜头要单独给值**：扫光用 `screen` 会把纸面糊成白雾，暗角会让中心过曝
→ 光带压到 0.05、暗角压到 0.1、颗粒压到 0.035。

### 自检脚本

交付前跑覆盖度检查，对照设计系统导出清单列出未使用组件，
逐个确认是「本片不需要」而非「忘了」。判据与脚本见 `references/pitfalls.md` I 节。

## 第三步：列元素清单，标注可行性

对需求做一次逐条拆解，每条视觉元素标成三类之一：

- **现成** —— 直接调 `assets/v720/` 里的组件或该栈的原生 API
- **手写** —— 该栈能做，但得自己写实现（例：HF 的圆角卡片、Skia 的中文折行）
- **不可行** —— 结构性做不到，必须换栈或换方案（例：Skia 里排大段中文段落）

详细判据查 `references/capability-matrix.md`（32 项 × 4 栈，含每格的具体实现与代价）。

高频的 12 项速查：

| 需求 | Remotion 核心 | HyperFrames | Skia |
|---|---|---|---|
| 逐词/逐字弹出字幕 | `PerWordCaption` | CSS + GSAP stagger | 手算 `measureText` 逐字摆位 |
| 高亮/下划线/划掉 | `Emph` | 手写 span 包裹 | 手写多层 drawText |
| 中文段落折行 | DOM 自动 | DOM 自动 | **做不到**（需自己上 Paragraph builder） |
| 圆角文字卡/科技卡 | `TechCard` | 手写 div + CSS | 手写 rrect + clip |
| 拍立得/新闻卡/分屏 | `Polaroid` / `NewsCard` | 手写 | 手写 |
| 胶片颗粒/噪点 | `Grain` | canvas 噪声层 | Noise shader |
| 扫描线/暗角/色差 | `Scanlines` / `Vignette` / `Chromatic` | 手写叠加层 | 手写分层重绘 |
| 网格纸/等高线/波浪 | `GridBackdrop` / `ContourBackdrop` / `WaveBackdrop` | 手写 | 手写 Path |
| 线条生长 | SVG + `strokeDashoffset` | SVG + GSAP | `Path` + Trim |
| 圆形蒙版/擦除 | `MaskWipe` | CSS `clip-path` | `clip` |
| 波形/频谱 | `Waveform` / `Spectrum`（合成，不读真实音频） | 手写 | 成本过高，不推荐 |
| 3D 几何/点云/空间卡片 | 需 `@remotion/three` | Three.js 直连 | **做不到** |

## 三条结构性边界（换栈也绕不过）

**1. DOM 排版是隐形红利。** Remotion / HyperFrames 跑在浏览器排版引擎上，中文折行、flex 分屏、
阴影圆角、混色模式一行 CSS 就有。Skia 走 CanvasKit **没有 DOM**——长文本要自己上 Paragraph builder，
否则只能单行 `drawText` 逐条摆位。做中文知识类视频，这条最容易被低估。

**2. 3D 与 shader 不在 Remotion 核心包里。** 要 3D 必须引 `@remotion/three`（R3F 包装，渲染时
`frameloop` 被强制设为 `'never'`，场景必须完全声明式）；要 GLSL 只有两条路：three + 自写
`ShaderMaterial`，或 Skia 的 `RuntimeEffect`。**`@remotion/shader` 这个包从未发布过**，任何清单里
出现它都是错的。

**3. 确定性既是护城河也是枷锁。** Remotion 要求每一帧都能由 frame 唯一推导：GSAP 必须走
`useGsapTimeline()` 建 paused timeline 再 seek，**绝不能挂裸 ticker**；`Math.random` 一律换 seeded
随机。换来逐帧重渲完全一致、可并发分片；代价是任何依赖真实时间的库都得改造。

## 第三步：按栈施工

选定栈后读对应的实现要点，不要凭记忆写：

- `references/stack-remotion-core.md` —— 帧驱动 + 设计系统组件 + 转场
- `references/stack-remotion-eco.md` —— GSAP 桥、Three、手写 GLSL
- `references/stack-hyperframes.md` —— HTML composition 规范、`data-start`、`__timelines`
- `references/stack-skia.md` —— CanvasKit 引导、字体、无 DOM 的应对
- `references/licensing.md` —— 四条路的许可边界（交付前必查）
- `references/pitfalls.md` —— 已踩过的坑，施工前扫一遍

## 生产流程

1. **定栈** —— 三问走完，产出一张「选栈卡」：栈 / 理由 / 关键约束 / 已知风险。
2. **定节奏** —— 写节拍表（`start/end/text/beats[]`），核硬指标：≥13 镜、任意间隔 ≤5.2s、每镜 ≥2 beat。
   这一步不过就别往下走——结构错了后面全白做。
3. **拆元素** —— 逐条标 现成/手写/不可行。出现「不可行」就回到第 1 步换栈。
4. **搭骨架** —— 拷 `assets/v720/` 五个文件进项目 `src/`（`theme` 是根，其余依赖它）。
5. **写场景** —— 一个镜头一个文件，全部 `useCurrentFrame()` 推导，禁止真实时间。
6. **先渲一段验证** —— 别写完十分钟再渲。先渲 3 秒，确认字体、色彩、布局都对。
   同时抽 3–5 个不同镜头的静帧，专门看「镜头开头那 0.3 秒是不是空画面」。
7. **全片渲染** —— 命令见各 stack reference。
8. **质检** —— `scripts/qc_video.py` 抽 10 帧算亮度/对比/边缘/色组，判黑屏、白屏、静帧、元素缺失。
9. **覆盖率自检** —— 对照设计系统导出清单列出未使用组件，逐个确认「不需要」而非「忘了」。
10. **交付** —— 成片放 `outputs/`，该目录只放成片和报告，不留 `node_modules`/`dll`/`exe`/中间帧。

## 反模式（看到就停手）

- **在 Remotion 里裸调 `gsap.to()` / `timeline().play()`** → 渲染会漂移或卡死。必须 `useGsapTimeline()`。
- **用逐帧截图/录制屏幕来「渲」视频** → 慢且不确定，还容易丢帧。用官方 `render`。
- **Skia 里排大段中文** → 换 DOM 栈，或接受单行摆位。
- **假设 Remotion 支持某效果而不查包** → 先确认包真实存在（`@remotion/shader` 就不存在）。
- **用 `@remotion/*` 子包但不声明依赖** → 幽灵依赖，换机器就崩。26 个子包必须显式写进 `package.json`。
- **`@remotion/*` 与 `remotion` 版本号不一致** → 必须全部精确同版本（如全 `4.0.534`），不能用 `^`。
- **把素材目录当交付目录一起发出去** → `public/` 里常有几十 MB 的生成镜头，发布根必须锁在 `outputs/`。
- **宣称「全部纯代码生成」前不查 `public/`** → 里面往往有 AI 生成视频、贴图、音频。
- **按「讲完一件事」切段而不按「画面撑得住多久」切** → 段落会拉到 8–10s，观众觉得「很一般」。
  先写节拍表，用 5.2s 上限反推镜头数。
- **镜头开头是空画面** → 元素从 0 长起、或上一镜全灭后没有立刻补上主体，
  开头 0.3–1s 就是空的。抽帧专门看这个位置；修法是提前起势或给背景打底。
- **只靠一种视觉手段撑全片** → 观众 10 秒后脱敏。按镜头轮换手段，同类连续 ≤2 镜。

## 资产与脚本

```
assets/v720/          720×1280 竖屏设计系统（1701 行，实测可用）
  theme.tsx           色彩/字体/缓动/seed 随机/分段函数 —— 唯一根依赖
  fx.tsx              Grain Scanlines Vignette Chromatic GridBackdrop
                      ContourBackdrop WaveBackdrop Particles
  ui.tsx              TechCard Badge Stamp QuoteBox Polaroid NewsCard
                      PerWordCaption Emph Waveform Spectrum GrowArrow MaskWipe
  transitions.tsx     5 种场景转场（none/wipe/blocks/scan/push）+ CameraPush
  glsl.ts             3 组手写 GLSL（fbm 星云 / 加性粒子 / 菲涅尔描边）
scripts/qc_video.py   抽帧质检，输出 UTF-8 markdown 报告
```

改画幅：`theme.tsx` 顶部有 `VW`/`VH`，改这两个值后组件内的百分比布局自动适配。
竖屏抖音用 720×1280 或 1080×1920，横屏用 1920×1080。

质检用法：

```bash
python scripts/qc_video.py out/*.mp4 --out out
```

## 与其他技能的边界

- **流程编排**（音频→SRT→时间线→成片→剪映交接，带人工 gate）→ `remotion-video-pipeline`
- **Remotion 工程环境与方法论** → `remotion-video-production`
- **艺术风格 / 解说动画语法 / 口播词级动画** → `art-motion`
- **真人出镜、配音、剪辑、发布** → `ai-video-production`
- **本技能只负责**：选哪套栈、用哪些视觉元素、拿什么组件、怎么避开结构性坑。
