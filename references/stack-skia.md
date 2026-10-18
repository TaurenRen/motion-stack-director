# 栈 D：React Native Skia（CanvasKit）

用 CanvasKit（Skia 的 WASM 版）命令式绘制。**没有 DOM**——这是它的全部威力和全部麻烦。
适合做手绘笔触、圈选标注、形状 morph、发光模糊这类 DOM 做不出来的有机质感。

**同时它也是四条栈里成片体积最省的**（0.21 MB/s，比 HyperFrames 小 7 倍）。

```bash
npm i remotion @remotion/cli @remotion/skia @shopify/react-native-skia \
      react@19 react-dom@19 react-native-web
```

版本组合是硬的，实测可用的一组：

```json
{
  "@remotion/cli": "4.0.534",
  "@remotion/skia": "4.0.534",
  "@shopify/react-native-skia": "2.14.0",
  "react": "19.1.0",
  "react-dom": "19.1.0",
  "react-native-web": "0.21.1",
  "remotion": "4.0.534"
}
```

---

## 一、装配（三步，顺序不能错）

**① `remotion.config.ts`** —— 必须同时做两件事：`enableSkia()` 和把 `react-native` 别名到 web 版。

```ts
import { Config } from "@remotion/cli/config";
import { enableSkia } from "@remotion/skia/enable";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCachingEnabled(false);

Config.overrideWebpackConfig((currentConfiguration) => {
  const withRnWeb = {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...currentConfiguration.resolve?.alias,
        // RN-Skia 的 views / specs 会 import "react-native"，Web 端统一映射
        "react-native$": "react-native-web",
      },
    },
  };
  return enableSkia(withRnWeb);
});
```

漏掉 `react-native$` 别名，打包会报 `Can't resolve 'react-native'`
（来自 `@shopify/react-native-skia/lib/module/views`）。

**② `src/index.ts`** —— WASM → 字体 → 才 `registerRoot`。

```ts
import { registerRoot } from "remotion";
import { fetchFontBytes, installFonts } from "./fonts";

// 注意路径：必须用 lib/module/web，不要用 src/web
// src/web 会把 RN 源码拉进 webpack，直接崩
const { LoadSkiaWeb: LoadSkia } = require(
  "@shopify/react-native-skia/lib/module/web/LoadSkiaWeb"
) as { LoadSkiaWeb: (opts?: { locateFile?: (f: string) => string }) => Promise<void> };

(async () => {
  const bytes = await fetchFontBytes();   // 先取 TTF 字节
  await LoadSkia();                       // 再初始化 CanvasKit
  await installFonts(bytes);              // 再装字体
  const { RemotionRoot } = await import("./Root");
  registerRoot(RemotionRoot);             // 最后才注册
})();
```

**顺序错就会白屏**：CanvasKit 没就绪时组件已经渲染，字也画不出来。

**③ 字体** —— CanvasKit 在 Web 上**没有系统字体**，不装就一个汉字都不显示。

```ts
// fonts.ts 关键片段
cjkTf = Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(bytes.cjk));
latinTf = Skia.Typeface.MakeFreeTypeFaceFromData(Skia.Data.fromBytes(bytes.latin));
```

TTF 放 `public/fonts/`，用 `staticFile("fonts/simhei.ttf")` 取。推荐：中文黑体 + 拉丁粗体各一份。

---

## 二、画布

```tsx
import { SkiaCanvas } from "@remotion/skia";
import { Group, Rect, Paint, LinearGradient, Blur } from "@shopify/react-native-skia";

<SkiaCanvas width={720} height={1280}>
  <Rect x={0} y={0} width={720} height={1280}>
    <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 1280 }}
                    colors={["#070b14", "#0d1728"]} />
  </Rect>
</SkiaCanvas>
```

尺寸**必填**，和 `ThreeCanvas` 一样不会推断。

## 三、无 DOM 的代价（最重要的一节）

**文字只能单行，自己摆位。**

```tsx
import { Text } from "@shopify/react-native-skia";
import { font } from "./fonts";

const SText: React.FC<{ text: string; x: number; y: number; size?: number; center?: boolean }> = ({
  text, x, y, size = 28, center,
}) => {
  const f = font("cjk", size);
  const w = f.measureText(text).width;
  const px = center ? x - w / 2 : x;
  return <Text text={text} font={f} x={px} y={y} color="#F8FAFC" />;
};
```

`y` 是**基线**，不是顶边。中文段落的换行、行高、避头尾标点，全部要自己算。

**要排大段中文** → 上 `ParagraphBuilder`（成本高），或者**直接换 DOM 栈**。
选型阶段就要判断，别做到一半才发现。

**没有层级，只有绘制顺序。** `<Group>` 里后画的盖住先画的。
`z-index` 那一套不存在，卡片叠卡片要手工排 JSX 顺序。

**没有阴影/圆角捷径。** 圆角是 `rrect`，阴影是 `drawShadow` 或叠一层 `Blur`，都比你想象的贵。

## 四、Skia 真正强在哪

| 能力 | 组件/API |
|---|---|
| 路径裁剪动画（线条生长） | `Path` + `start` / `end`（Trim） |
| 手绘抖动笔触 | 自绘 path + 噪声扰动控制点 |
| 圈选标注 | `Path` + 圆角化 + `DashPathEffect` |
| 形状 morph | `Path.interpolate(a, b, t)` |
| 渐变蒙版 | `LinearGradient` / `RadialGradient` + `Mask` |
| 模糊 / 发光 | `Blur` / `MaskFilter.MakeBlur` |
| 混合模式 | `blendMode="screen" | "plus" | "overlay"` |
| 裁剪区域 | `Group clip={Skia.XYWHRect(x, y, w, h)}` |
| 粒子 | 循环 `Circle` + seeded 随机 |

圆形擦除转场就是 `clip` 的 `Rect` 逐帧放大：

```tsx
const r = easeInOut(clamp01((frame - start) / 26)) * 900;
<Group clip={Skia.Path.Make().addCircle(360, 640, r)}>
  <SceneBody />
</Group>
```

## 五、确定性

Skia 组件全部是 props 驱动的，只要 props 由 `frame` 推导就天然确定。
**唯一会翻车的点**是有人在 `useEffect` 里改内部状态——不要这么做，全部用 `useMemo` 从 `frame` 算。

随机用 seeded：

```ts
const rnd = mulberry32(seed);
// 或者 i 索引的纯函数
const jitter = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453 % 1;
```

## 六、渲染

```bash
node node_modules/@remotion/cli/remotion-cli.js compositions src/index.tsx
node node_modules/@remotion/cli/remotion-cli.js render src/index.tsx SkiaShowcase out/skia.mp4 \
  --codec h264 --concurrency 4
```

## 七、什么时候别用它

- **中文文字多** → 换 DOM 栈。这是最高频的误用。
- 需要图表、表格、卡片套件 → 手写成本远超收益。
- 需要播视频 / 音频 → 它不能播，得回 Remotion 层做。
- 团队不熟 Canvas 绘制模型 → 学习曲线明显比 CSS 陡。

## 八、最适合的用法：当插入镜头

Skia 最好的定位不是承载整片，而是**产出别人做不出来的那几秒**：

1. 渲成透明底 `mov` 或 `webm`（`--codec vp8` 或渲 PNG 序列）
2. 拼进 Remotion 主时间线或直接丢剪映

这样既拿到有机质感，又不用承担「整片没有 DOM 排版」的代价。
