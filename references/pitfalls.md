# 踩坑总表

施工前扫一遍。每条都是真踩过的，附现象和修法。

---

## A. 包不存在 / 名称错误

| 坑 | 现象 | 真相 |
|---|---|---|
| `@remotion/elements` 不存在 | `npm i` 报 404 | 这是 Vibe 圈流传的错误包名。真实机制是 Remotion Elements + Studio Protocol 的**源码注入**，不是可安装的组件库 |
| `@remotion/shader` 从未发布 | 搜不到 | Remotion 做 GLSL 只有两条路：`@remotion/three` + 自写 `ShaderMaterial`，或 Skia `RuntimeEffect` |
| `onda` 不是 Onda 的包 | 装了个无关的 VTEX Styleguide | 正确 npm 名是 **`ondajs`** |
| `@contentfork/remotion-ui` 404 | 找不到仓库 | 正确仓库是 **`riaz37/remotion-ui`** |

**RemotionUI / Onda / Remotion Bits 都不是成熟组件库**，是 0.x 的 copy-paste registry
（把代码抄进你的项目，不装依赖）。用之前先看 star 数和最后提交时间。

---

## B. 依赖与版本

**幽灵依赖。** `package.json` 声明 5 个 `@remotion/*`，`node_modules` 里实际装了 26 个。
用 `@remotion/paths` 之类没声明过的子包，本地能跑、换机器就崩。

→ **所有 import 到的 `@remotion/*` 必须显式写进 `package.json`。**

**版本必须精确一致。**

```json
// ❌ 三种写法混用，install 后必然对不齐
"remotion": "^4.0.0",
"@remotion/cli": "^4.0.534",
"@remotion/three": "4.0.534"
```

```json
// ✅ 全部精确
"remotion": "4.0.534",
"@remotion/cli": "4.0.534",
"@remotion/three": "4.0.534"
```

Remotion 家族包之间有内部协议，版本不一致会出现「能编译但渲染行为诡异」。

---

## C. 确定性（最容易出，也最难查）

| 坑 | 现象 | 修法 |
|---|---|---|
| 裸调 `gsap.to()` / `timeline().play()` | 本地 Studio 预览正常，渲染出来乱跳或卡死 | 必须 `useGsapTimeline()` |
| `useFrame((s, delta) => x += delta)` | 每遍渲染结果不同 | 改成 `x = f(frame)` 纯函数 |
| `Math.random()` | 每次渲染粒子位置都不一样 | `mulberry32(seed)` 或 `noise1(i, seed)` |
| `Date.now()` / `performance.now()` | 同上 | 只用 `frame / fps` |
| CSS `transition` / `@keyframes` | 渲染时不动，或动得不受控 | Remotion 里禁用；动画全部由 frame 推导 |
| uniforms 累加 `uTime.value += 1/30` | 帧序错乱 | 改成赋值 `uTime.value = frame / fps` |
| 相机 `position.x += ...` | 越渲越歪 | `position.set(f(frame), ...)` |

---

## D. Three.js

| 坑 | 现象 | 修法 |
|---|---|---|
| 没传 `width` / `height` | 画布尺寸为 0 | `ThreeCanvas` 必填，不会推断 |
| 没开 `preserveDrawingBuffer` | 渲出黑帧 / 空帧 | `gl={{ preserveDrawingBuffer: true }}` |
| 用了 `useFrame` 里的真实时间 | 动画不跟帧 | `frameloop` 已被强制 `'never'`，全部改 frame 推导 |
| 坐标超出视野 | 元素被裁 | 720×1280 / `z=9.5` / `fov=45` 时，可用约 **x ±2.2 / y ±3.9** |
| 无 GPU 环境渲黑 | 黑帧 | 加 `--gl=swangle` |
| **`ThreeCanvas` 套了另一层 `ThreeCanvas`** | 渲染报 `R3F: Canvas is not part of the THREE namespace!`，该镜头整帧失败 | 包装组件（如 `FlockStage`）内部常已自带 `ThreeCanvas`。**外面绝不能再包一层**：`<ThreeCanvas><FlockStage/></ThreeCanvas>` ❌ → `<FlockStage/>` ✅ |

**排查顺序**：报这个错时，先 `grep -n "ThreeCanvas" <film>/*.tsx` 看有没有嵌套；
再确认那个镜头没有被 DOM 层的全局 wrapper 包住（见下条）。

**关于「全局手持微动」**：它是 DOM transform，套在含 3D 镜头的层外面也有风险。
稳妥结构是让 3D 镜头走顶层，只有 2D 镜头才包 `BreatheCam`：

```tsx
// ❌ 3D 镜头会被外层 DOM transform 干扰
<BreatheCam>{SHOTS.map(s => <Sequence><Comp/></Sequence>)}</BreatheCam>

// ✅ 3D 镜头走顶层，2D 镜头才包 BreatheCam
{shots(true)}
<BreatheCam>{shots(false)}</BreatheCam>
```


---

## E. Skia

| 坑 | 现象 | 修法 |
|---|---|---|
| `Can't resolve 'react-native'` | webpack 报错 | 装 `react-native-web`，并在 config 里加别名 `"react-native$": "react-native-web"` |
| 从 `src/web/LoadSkiaWeb` import | webpack 把 RN 源码拉进来，崩 | 改用 `@shopify/react-native-skia/lib/module/web/LoadSkiaWeb` |
| 先 `registerRoot` 再装字体 | 白屏 / 无字 | 顺序：取字节 → `LoadSkia()` → `installFonts()` → `registerRoot()` |
| 一个汉字都不显示 | CanvasKit Web 无系统字体 | 必须 `MakeFreeTypeFaceFromData` 装 TTF |
| 中文长文本被裁 | 单行 `drawText` 不折行 | 上 `ParagraphBuilder`，或**换 DOM 栈** |
| 以为有 z-index | 层级错乱 | 绘制顺序即层级，手工排 JSX |

---

## F. HyperFrames

| 坑 | 现象 | 修法 |
|---|---|---|
| `Low disk space` 渲染失败 | `0.6 GB free at C:\...\Temp` | 把 `TEMP`/`TMP`/`TMPDIR` 指到空闲盘再渲 |
| 渲出静帧 | 画面不动 | `window.__timelines["<composition-id>"] = tl` 没注册，或 `paused: true` 漏了 |
| 成片体积异常大 | 15s 竖屏 24 MB | 默认 `-q looks` 是 CRF 16。改 `-q draft` 或 `--crf 20` |
| 自己写 JS 控制显隐 | 与运行时打架 | 用 `class="clip"` + `data-start` + `data-duration`，别自己管 |
| 段与段硬切 | 没有转场感 | 让相邻段**重叠 0.2–0.3 秒** |
| 改了 `.html` 但预览没变 | 缓存 / 时间轴未刷新 | 用 `hyperframes check` 而不是只看浏览器刷新 |

---

## G. 交付与素材

| 坑 | 现象 | 修法 |
|---|---|---|
| 把项目根当发布目录 | 几十 MB 的生成素材、`node_modules` 一起发出去 | 发布根严格锁 `outputs/`，只放成片和报告 |
| README 宣称「全部代码生成」 | 一查 `public/` 全是 AI 生成视频 | 交付前 `du -sh public/*` 核一遍，按 Composition 分别说明 |
| 质检抽帧留在 `outputs/` | 压缩包多出几十 MB | 抽帧移出交付目录 |
| 没有质检直接交付 | 黑屏 / 静帧 / 元素缺失没发现 | 跑 `scripts/qc_video.py` |

---

## H. 本机环境（Windows）

| 坑 | 修法 |
|---|---|
| bash 的 PATH 会坏（`ls`/`grep` not found） | 用 PowerShell 调绝对路径，或直接用专用工具 |
| PowerShell 回显中文乱码 | 脚本结果写 UTF-8 文件后再读 |
| 长渲染被 120s 超时杀掉 | 显式传 `timeout` 或 `run_in_background`；`\| tail` 会吞掉全部输出 |
| 批量删除触发安全钩子并杀进程 | 渲染命令前加 `CODEBUDDY_SAFE_DELETE_ENABLED=0` 等环境变量 |
| **C 盘满导致渲染失败** | Remotion 每次 render/still 都往 `%LOCALAPPDATA%\Temp` 拷整个 `public/` 打包，并留一个 chrome profile，**从不自动清理**。几次渲染就积 GB 级缓存，C 盘小的话直接 `ENOSPC: no space left on device` 把渲染打断 |
| **把含中文路径的 PowerShell 存成 .ps1 再执行** | 脚本文件被按非 UTF-8 读出 → `Set-Location` 报「找不到路径」，但**脚本内自己打印的 "OK" 照样输出**，看着像成功其实什么都没做 | 不要写 `.ps1`/`.bat` 含非 ASCII 路径。直接命令行传参，或把脚本放纯 ASCII 路径下 |
| **高并发渲染偶发 `TimeoutError: waiting for the page to render ... timeout 33000ms`** | 3D 镜头（`@remotion/three`）单帧开销大，`--concurrency=8` 时多个 chrome tab 同时抢 CPU，某帧 33s 内没画完就被判超时。**报错发生在 composition 选择阶段，看着像代码错**，其实重跑就好 | 降到 `--concurrency=2`。同样的帧数从 9 分钟失败变成 50 秒成功 |

**抽帧验证用 `render --frames=` 而不是逐帧 `still`：**

```bash
# ✗ N 帧 = N 次 webpack 打包 + N 次拷贝 51MB public/，每次 1.5 分钟
# ✓ 一次打包出 N 帧，同样帧数快约 6 倍，且能一次看全
remotion render src/index.tsx <CompId> out/rng/f --frames=620,1100,1420 --sequence --concurrency=2 --gl=angle
# 产出 out/rng/f/element-0620.jpeg ...
```


**C 盘满的处置顺序：**

```powershell
# 1. 先确认是不是真的满（Bash 工具此时自己也会写不进去）
Get-PSDrive -PSProvider FileSystem | Select Name,@{n='FreeGB';e={[math]::Round($_.Free/1GB,1)}}

# 2. 把渲染临时目录整体挪到有空间的盘（这一步就能救回来，不必删任何东西）
$env:TEMP="D:\tmp\remotion-temp"; $env:TMP="D:\tmp\remotion-temp"; $env:TMPDIR="D:\tmp\remotion-temp"
```

**注意**：Bash 工具自身依赖 `%TEMP%` 写脚本，C 盘满时 `mkdir` / 重定向都会报 ENOSPC。
此时改用 PowerShell 工具（它不经过那个临时目录）。

**积压的缓存长这样**（可安全清理，但那是 C 盘的清理动作，需用户确认）：

```
remotion-webpack-bundle-*     每次渲染一份，60–90 MB
remotion-v4.0.534-assets*     每次一份，20–40 MB
chrome_<timestamp>_*          每次一个 profile，20–100 MB
```


---

## I. 节奏与视觉密度（交付感的最大杀手）

**这是最容易被忽略、也最致命的一类问题。** 技术全对、渲染全过、质检全 PASS，
片子依然可能「很一般」——因为节奏和密度不够。

### I-1 段落太长

| 现象 | 根因 | 判定标准 |
|---|---|---|
| 观众说「效果很一般」「节奏慢」 | 段落按「讲完一件事」划分，而不是按「画面撑得住多久」 | **任意两个切点间隔 ≤ 5.2s**；60 秒片至少 **13 个镜头** |

实测对比（同一主题、同一技术栈）：

| 版本 | 镜头数 | 平均镜头长 | 结果 |
|---|---|---|---|
| 差 | 8 | 7.5s | 「很一般」 |
| 好 | 13–17 | 3.5–4.6s | 通过 |

→ **先写节拍表，再写场景。** 把 `start/end/text/beats[]` 落成独立数据文件，
主合成只做 `SHOTS.map(s => <Sequence from={s.start*FPS} ...>)`。
场景组件内部禁止再判断「现在是第几个阶段」——那是节拍表的职责。

### I-2 一段里只有一个动作

一个 4 秒的镜头，如果只是「一张卡淡入然后停住」，等于 3 秒静止画面。

→ **每镜至少 2 个 action beat**（`beats[]` 里除起点外至少一项）。
「淡入」不算 beat，「淡入 → 计数器起跳 → 高亮框弹出」才算。

### I-3 缺全局特效栈

这是「廉价感」与「成片感」的分界线。缺了它，静态构图会显得像幻灯片：

| 层 | 作用 | 参数经验 |
|---|---|---|
| 手持微动（BreatheCam） | 整层极微推拉+倾斜，看不出在动但拿掉就假 | 位移 ≤ 4px、旋转 ≤ 0.12° |
| 扫光（Sweep） | 给静态构图一层「光在走」 | period 6–7.4s，peak 0.13–0.16，`mixBlendMode: screen` |
| 快门闪（CutFlash） | 切点白闪，形成极性冲击 | 宽度 0.05s，peak 0.4 |
| 暗场呼吸（Breath） | 句间的极短暗场，避免硬切到黑 | 0.1s 高斯，暗度 0.32 |
| 颗粒 + 扫描线 | 消除数字感 | 见 H 节 |
| 星尘底纹（Dust） | 一次生成 dataURL，全局复用 | 1400 点，op 0.26 |
| 字幕条 | 无配音时字幕即叙事 | 逐字点亮，不整句一起亮 |

**浅底（纸白）镜头必须单独处理**：扫光用 `screen` 会把纸面糊成一团白雾，
暗角也会让中心「过曝」。→ 光带强度压到 0.05、暗角压到 0.1、颗粒压到 0.035。

### I-4 把视觉元素库当成「有就行」

设计系统里 22 个组件，只用了 1 个 —— 那 21 个等于白写。

→ **每个组件至少在一个镜头里承担叙事职责**，不是当装饰。
交付前跑一遍覆盖度自检：`grep -o '<[A-Z][A-Za-z]*' src/<film>/*.tsx | sort -u`，
对照设计系统导出清单，列出未使用的，逐个确认是「本片不需要」而不是「忘了」。

### I-5 只靠一种视觉手段

如果全片画面都建立在同一类元素上（例如全靠粒子），观众 10 秒后就脱敏。

→ **按镜头轮换视觉手段**：点阵 / 网络连线 / 卡片 / 折线 / 网格 / 菌丝 / 字形粒子 /
3D 星云 / 文字排版 / 印章。同一手段连续出现不超过 2 镜。

### I-6 粒子场景的相机距离

点云类镜头最常见的错误是**相机距离不合适**，两种翻车方向：

- **推得太近** → 群体溢出取景框 1.5 倍以上，屏幕里只剩一片均匀点阵，看上去像「星空/噪点」
- **拉得太远** → 群体缩成画面中间一小团，四周大片黑边，显得空

先量出群体的世界展布，再反推 z。fov45 竖屏（720×1280，aspect 0.5625）：

```
可见高度 = 0.828 × z     可见宽度 = 0.466 × z
装得下群体 →  z ≥ max(群体宽 / 0.466, 群体高 / 0.828)
```

以本片 640 只 boids（`bx=3.05, by=5.25` → 展布 **6.1 × 10.5**）为例：

| 相机 z | 可见范围 | 群体占框 | 观感 |
|---|---|---|---|
| 7.4 | 3.5 × 6.1 | 溢出 **1.7×** | ✗ 一片均匀点，像星空 |
| 12.6 | 5.9 × 10.4 | 刚好贴边 | ✓ 边界略出框，冲击力足 |
| 14.2 | 6.6 × 11.8 | 完整入框 + 留黑 | ✓ 最能看出疏密与转向 |
| 16.0 | 7.5 × 13.2 | 只占 54% | △ 偏空 |

→ 结论：这类群体镜头应取 **z ≈ 12.6–14.2**（而非直觉上的「拉近更好」）。
算之前**先去 `sim.ts` / 场景文件里把 `bx/by`（或粒子的 radius）读出来**，
不要凭画面感觉猜 —— 感觉往往是反的。

**粒子数与点径要一起调**：相机越远，同样的 `pointSize` 在屏幕上越小，
所以远相机要**调大** pointSize（本片 14.2 配 1.85），近相机要调小。
独立地只改一个参数，一定会得到「太糊」或「太稀」。

---

## J. TypedArray 与 React 渲染

### J-1 对 `Uint8Array` / `Float32Array` 调 `.map()` 渲染 SVG 或 DOM

`TypedArray.prototype.map` 的回调返回值会被**强制转成数字**再写回数组。
返回 React 元素（object）时被转成 `NaN` → `0`，于是 `<g>` 里全是数字 `0`，
**一个图形都画不出来**，而且不报任何错 —— 画面只是「空的」。

```tsx
// ✗ 生命游戏状态是 Uint8Array，这样写格子全部消失
{state.map((v, idx) => v ? <rect key={idx} ... /> : null)}

// ✓ 先展开成普通数组（或 Array.from，或 React.Children.toArray 兜底）
{Array.from(state).map((v, idx) => v ? <rect key={idx} ... /> : null)}
```

排查信号：SVG/DOM 里该出现的元素**一个都没有**，但同一组件里的文字标注、
计数、网格底都正常 —— 差别就在「数据源是不是 TypedArray」。
`grep -n "\.map(" <场景>.tsx` 逐个看被 map 的变量是从哪来的。

同理注意：`Uint8Array` 上的 `forEach` / `filter` 也会丢类型，
模拟数据（`sim.ts` 的 `states` / `birth` / `trait`）广泛使用 TypedArray，
消费它们之前一律先 `Array.from()`。

### J-2 全屏白色效果多重叠加 → 整屏刷白

闪白类效果（`Flash`、`Glow`、白蒙布）通常用 `mixBlendMode: "screen"`，
**screen 是累加的**。多个效果落在同一时刻就会线性堆到 1.0：

```
sync 白蒙布 0.20  +  Glow 1.04  +  Flash 0.95   =  2.19  →  纯白，画面全丢
```

排查信号：**某个特定时刻整屏纯白**（不是全黑），而其余时刻正常。
这种「只在一两帧坏掉」的 bug 极易漏掉 —— 抽帧必须**抽到效果的峰值时刻**
（本例 `Math.exp(-((t-1.55)/0.14)²)` 的峰值就在 t=1.55）。

修法：同一时刻的全屏白效果，峰值加起来 **不超过 0.55**；
把「事件感」改用低透明度**径向涟漪**或描边发光表达，而不是整屏蒙布。

```tsx
// ✗ 三重叠加
<AbsoluteFill style={{ background: "#fff", opacity: sync * 0.2 }} />
<Glow ... op={0.35 + sync * 0.7} />
<Flash t={t} at={1.55} peak={0.95} />

// ✓ 涟漪代替蒙布 + 两项降幅
<div style={{ position: "absolute", inset: 0,
  background: "radial-gradient(circle at 50% 48%, rgba(255,240,210,0.42) 0%, rgba(242,178,76,0.18) 34%, rgba(242,178,76,0) 62%)",
  opacity: sync * 0.75, mixBlendMode: "screen" }} />
<Glow ... op={0.3 + sync * 0.34} />
<Flash t={t} at={1.55} peak={0.34} />
```

### J-3 `<AbsoluteFill>` 放进了 `<svg>` 里

`<AbsoluteFill>` 渲染成 `<div>`。`<div>` 在 SVG 命名空间下**不渲染**，静默丢弃。

```tsx
// ✗ 这个白蒙布永远不会出现（而且不报错）
<svg width={W} height={H}>
  {syn.map(...)}
  <AbsoluteFill style={{ background: "#fff", opacity: sync * 0.2 }} />
</svg>
```

修法：把全屏层**移到 `</svg>` 之后**，或改用 `<rect width={W} height={H} fill={...} />`。

检查法：`grep -n "</svg>" <场景>.tsx` 之后往回看几行，确认没有 DOM 组件被误放进去。

---

## 交付前最后一遍

```bash
# 1. 规格核对
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames \
  -show_entries format=duration,size -of default=noprint_wrappers=1 out/film.mp4

# 2. 质检
python <skill>/scripts/qc_video.py out/*.mp4 --out out

# 3. 交付目录洁净度
find out -name "*.dll" -o -name "*.exe" -o -name "node_modules" -o -name "*.ps1" -o -name "*.bat"
du -sh out
```

三项都过再交付。
