# motion-stack-director（视觉栈导演）

Agent Skill：代码生成视频的技术栈选型与视觉元素匹配。

把「我想要这样的片子」翻译成「用哪套栈、调哪些元素、拿什么组件写」。面向 Remotion 核心 / Remotion+GSAP+Three+GLSL / HyperFrames 单 HTML / React Native Skia 四条路线，给出每个视觉元素的具体实现路径与可复用组件。

## 解决什么问题

- **选错栈的代价不是做不出来，是做到 80% 才发现架构不对，全部重写。** 四条路都能出大片，差别在维护成本、翻车概率和踩坑位置。
- 视觉元素（逐词字幕、科技卡、粒子、3D、手绘线条、转场）散落在四个框架里，缺一张「这个需求该找谁」的地图。
- **技术全对、渲染全过、质检全 PASS，片子依然可能「很一般」**——原因几乎总是节奏，没人管。

## 快速开始

把 `SKILL.md` 挂给 Agent（WorkBuddy / Claude Code 等），然后说：

> 用 motion-stack-director 给我定个栈：<你的需求>

Skill 会带你走三步：**三问定栈** → **核节奏硬指标** → **列元素清单（现成/手写/不可行）**，出现「不可行」就回到第一步换栈。

质检脚本（抽帧算亮度/对比/边缘/色组，判黑屏、白屏、静帧、元素缺失）：

```bash
python scripts/qc_video.py out/*.mp4 --out out
```

## 目录结构

| 路径 | 内容 |
|---|---|
| `SKILL.md` | 技能主体：三问定栈、节奏硬指标、三条结构性边界、生产流程、反模式 |
| `references/capability-matrix.md` | 32 项视觉元素 × 4 栈能力矩阵（每格含实现与代价） |
| `references/stack-remotion-core.md` | Remotion 核心：帧驱动 + 设计系统组件 + 转场 |
| `references/stack-remotion-eco.md` | GSAP 帧驱动桥、Three.js、手写 GLSL |
| `references/stack-hyperframes.md` | HyperFrames：HTML composition 规范、`data-start`、`__timelines` |
| `references/stack-skia.md` | RN-Skia：CanvasKit 引导、字体、无 DOM 的应对 |
| `references/licensing.md` | 四条路的许可边界（交付前必查） |
| `references/pitfalls.md` | 已踩过的坑，施工前扫一遍 |
| `assets/v720/` | 720×1280 竖屏设计系统源码（1701 行，实测可用） |
| `scripts/qc_video.py` | 抽帧质检，输出 UTF-8 markdown 报告 |

## 方法说明

### 三问定栈

1. **做几期？** 一期就完 → HyperFrames；长期按模板出片 → Remotion；只要一段特殊质感 → Skia。
2. **视觉重心在哪？** 中文文字卡片图表 → DOM 栈；3D/粒子/星云 → Remotion+Three 或 HF+Three（都要手写 GLSL）；手绘线条圈选 → Skia。
3. **有没有硬约束？** 商用许可要干净 → HyperFrames（Apache-2.0）；帧级可复现、批量重渲 → Remotion；单文件分发 → HyperFrames。

### 节奏硬指标（比选栈更容易翻车）

| 指标 | 门槛 |
|---|---|
| 任意两个切点间隔 | ≤ 5.2s |
| 60 秒片的镜头数 | ≥ 13 |
| 单镜内的 action beat | ≥ 2 |
| 同一视觉手段连续出现 | ≤ 2 镜 |
| 设计系统组件覆盖率 | ≥ 80% |

配套全局特效栈七层：手持微动 / 扫光 / 快门闪 / 暗场呼吸 / 颗粒+扫描线 / 星尘底纹 / 字幕条。

### 三条结构性边界（换栈也绕不过）

1. **DOM 排版是隐形红利。** Remotion / HyperFrames 跑在浏览器排版引擎上，中文折行、flex 分屏一行 CSS 就有；Skia 走 CanvasKit 没有 DOM，长文本要自己上 Paragraph builder。
2. **3D 与 shader 不在 Remotion 核心包里。** 3D 必须引 `@remotion/three`（`frameloop` 被强制 `'never'`，场景必须完全声明式）；GLSL 只有 three + `ShaderMaterial` 或 Skia `RuntimeEffect` 两条路。`@remotion/shader` 这个包从未发布过。
3. **确定性既是护城河也是枷锁。** GSAP 必须 `useGsapTimeline()` 建 paused timeline 再逐帧 seek，绝不能挂裸 ticker；`Math.random` 一律换 seeded。

## 局限与边界

- 矩阵结论来自本机四条样片的真实渲染实测，框架版本以 Remotion 4.0.x 为准；5.0 条款会调整，用前先核验。
- 矩阵里标 ✗ 的格子是「当前架构下不推荐」，不是永远不可能。
- `assets/v720/` 是 720×1280 竖屏设计系统；横屏需改 `theme.tsx` 顶部 `VW`/`VH` 后逐组件验证。
- 本技能只负责选栈与元素匹配，不覆盖：流程编排（音频→SRT→时间轴→成片）、艺术风格、真人出镜与发布。

## 引用

```
motion-stack-director（视觉栈导演）, TaurenRen / 狒狒AI技术屋
https://github.com/TaurenRen/motion-stack-director, MIT License
```

## 许可

MIT（`assets/v720/` 与 references 均为本仓库原创内容；所引用的第三方框架许可以各自官方为准，见 `references/licensing.md`）
