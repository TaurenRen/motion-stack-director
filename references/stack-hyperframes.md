# 栈 C：HyperFrames（单 HTML + CSS + GSAP）

HeyGen 开源（Apache-2.0）。一个 `index.html` 就是一条片子，不需要打包，浏览器直接跑。
国内博主偏爱它，主要因为**代码简单、AI 生成不容易崩**。

```bash
npx hyperframes init my-film
cd my-film
npx hyperframes preview     # 开 studio 预览
```

依赖很轻，通常只有四个：

```json
{
  "dependencies": {
    "hyperframes": "^0.8.168",
    "gsap": "^3.15.0",
    "three": "^0.186.1",
    "lottie-web": "^5.13.0"
  }
}
```

---

## 一、HTML 骨架（三条硬约定）

```html
<div id="stage"
     data-composition-id="my-film"
     data-start="0"
     data-duration="15"
     data-width="720"
     data-height="1280"
     data-fps="30">

  <div id="s1" class="scene clip" data-start="0"    data-duration="2.6" data-track-index="0">
    ...
  </div>

  <div id="s2" class="scene clip" data-start="2.3"  data-duration="2.5" data-track-index="1">
    ...
  </div>
</div>
```

**约定 1 · 根节点声明规格。** `data-composition-id` 必须和时间轴注册名一致；
`data-width/height/fps/duration` 决定渲染参数。

**约定 2 · 每个可见元素都是 clip。** `class="clip"` + `data-start` + `data-duration`，
可选 `data-track-index`。运行时按这两组值控制显隐，**不要自己写 JS 显隐逻辑**。

**约定 3 · 重叠即转场。** 段与段故意重叠 0.2–0.3 秒（`s1` 结束 2.6，`s2` 从 2.3 开始），
叠出来的那段时间就是转场窗口。不用额外的转场库。

---

## 二、时间轴：必须 paused 并注册

```js
var tl = gsap.timeline({ paused: true });

tl.fromTo("#s1 .kicker", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0);
tl.fromTo("#s1 .title span", { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "back.out(1.7)" }, 0.15);

// 关键：全局注册
window.__timelines = window.__timelines || {};
window.__timelines["my-film"] = tl;
```

`window.__timelines[<composition-id>]` 是运行时唯一的抓手。**不注册 = 渲染出静帧**。
`paused: true` 也是必须的——运行时会拿时间去 `seek`，让它自己播就会失控。

时间参数单位是**秒**，且是相对整条片子的绝对时间（`9.30` 表示第 9.3 秒），不是相对场景。

---

## 三、常用元素实现

HyperFrames 没有组件库，所有效果靠 HTML/CSS/SVG/Canvas 手写。以下是最常用的几个：

**线条生长**

```html
<svg viewBox="0 0 720 1280">
  <path id="p1" d="M80 640 C 240 420, 480 860, 640 640"
        fill="none" stroke="#22d3ee" stroke-width="3"
        stroke-dasharray="1200" stroke-dashoffset="1200"/>
</svg>
```
```js
tl.to("#p1", { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 2.3);
```

**圆形擦除转场**

```css
#s2 { clip-path: circle(0% at 50% 50%); }
```
```js
tl.to("#s2", { clipPath: "circle(150% at 50% 50%)", duration: 0.6, ease: "power2.inOut" }, 2.3);
```

**Canvas 粒子**（逐帧重绘，靠 `tl.eventCallback` 或 `onUpdate` 推进）

```js
var pctx = document.getElementById("pc").getContext("2d");
tl.to({ t: 0 }, {
  t: 1, duration: 2.4, ease: "none",
  onUpdate: function () { drawParticles(pctx, this.targets()[0].t); },
}, 4.5);
```

**Lottie**（真接，不是占位）

```html
<div id="lottieBox" style="width:420px;height:420px"></div>
```
```js
window.lottie.loadAnimation({
  container: document.getElementById("lottieBox"),
  renderer: "svg", loop: false, autoplay: false,
  animationData: inlineJson,   // 内联合成 JSON，v:"5.9.0"
});
```
Lottie 自己播会跑真实时间，要跟 timeline 对齐就用 `goToAndStop(frame, true)`
在 `onUpdate` 里手动推。

---

## 四、CLI 全流程

```bash
# 校验（渲之前必做，能抓出没注册时间轴、缺 data-start 等）
npx hyperframes lint
npx hyperframes check      # lint + 运行时校验 + 布局检查，一次过

# 关键帧截图，肉眼看有没有跑版
npx hyperframes snapshot

# 渲染
npx hyperframes render -o ../outputs/film.mp4 -w 4
```

### 渲染质量档位（体积差 10 倍）

| 参数 | CRF | 用途 |
|---|---|---|
| `-q draft` | 高 | 内部过审、看节奏 |
| `-q looks`（默认）| 16 | **默认值，720×1280/15s 约 24 MB** |
| `-q delivery` | 更低 | 终版交付 |
| `--crf 20` | 自定义 | 想压体积又不想明显掉画质 |

> 实测：默认 `looks`（CRF 16）出 15 秒竖屏片是 **24.18 MB / 1.61 MB/s**，
> 比 Remotion 同规格（5.22 MB）大近 5 倍。**不是 codec 问题，是默认质量档太高**。
> 网传就上 `-q draft` 或 `--crf 20`。

### 输出格式

```bash
--format mp4            # 默认
--format webm           # 支持透明
--format mov            # ProRes 4444，保 alpha，给 AE/剪映用
--format png-sequence   # RGBA 帧序列，给合成软件
--format gif            # 15fps 最合适，做 PR 动图
```

**要透明底的插入镜头**（叠在实拍上）就出 `mov` 或 `webm`。

---

## 五、Windows 上的坑

渲染会往系统临时目录写大量帧，C 盘紧张时直接失败：

```
✗ Low disk space 0.6 GB free at C:\Users\...\AppData\Local\Temp
```

把临时目录指到空闲盘：

```bash
TEMP="D:/tmp/hf-temp" TMP="D:/tmp/hf-temp" TMPDIR="D:/tmp/hf-temp" \
  npx hyperframes render -o ../outputs/film.mp4 -w 4
```

`-w` 每个 worker 起一个 Chrome（约 256 MB 内存），4 个差不多是笔记本的舒适区。

---

## 六、什么时候别用它

- 需要**组件复用**（同一张卡片在 30 个场景里用）→ 手写 HTML 会重复到崩，换 Remotion。
- 需要**严格帧级可复现** → 它的确定性靠约定，不是类型系统保证的。
- 需要 **TypeScript 类型检查** → 纯 JS，改错了不报错。
- 场景数量超过 15 段 → 单文件会膨胀到难以维护，考虑拆 `compositions/` 子文件。
