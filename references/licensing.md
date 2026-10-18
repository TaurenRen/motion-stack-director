# 许可边界（交付前必查）

**核心结论：Remotion 不是 MIT。** 任何「开源免费」的说法都需要按下面逐条核对。

---

## 四条栈的许可一览

| 组件 | 许可 | 商用有风险吗 |
|---|---|---|
| **HyperFrames**（HeyGen） | **Apache-2.0** | 无。可自由商用、修改、再分发（保留版权声明） |
| **Remotion** 本体 | **Remotion License**（双轨，非 OSI） | **有。** 个人、以及员工数 ≤3 的公司免费；超过需购买 Company License |
| `@remotion/three` `/skia` `/gsap` `/shapes` `/paths` 等子包 | 元数据写 MIT | **仍需注意。** 单个子包是 MIT，但整条渲染链受 Remotion License 约束 |
| **GSAP** | GreenSock Standard「no charge」许可 | 常规用法免费（含商业项目）。不是 OSI 认证。许可禁止用它做竞争性动画产品 |
| `three` / `@react-three/fiber` | MIT | 无 |
| `@shopify/react-native-skia` | MIT | 无 |
| `lottie-web` | MIT | 无 |
| `flubber` / `d3-geo` | MIT / ISC | 无 |
| **FFmpeg**（Remotion CLI 与 HyperFrames 都内置） | GPLv2+（取决于构建） | **交付成片不触发义务**；分发含 FFmpeg 的二进制才需要遵守 GPL |
| **mediabunny**（Remotion 4 的封装层） | MPL-2.0 | 修改其源码文件才需开源那些文件 |

> 许可条款会变。正式商用前用官方页面复核一次，别只依赖这份文档。

---

## 三条实操判断

**1. 「我只交 mp4，不交代码」能不能绕开 Remotion License？**
不能。许可约束的是**使用渲染器产出内容**这件事本身，不是分发代码。
用它渲出来的片子，同样适用双轨条款。

**2. 「子包写 MIT，所以没事」对不对？**
不对。子包的 MIT 只覆盖那个包的代码，你仍然需要 `remotion` 本体来渲染，
本体许可继续生效。这是最容易自我安慰的一条。

**3. FFmpeg 的 GPL 会不会污染我的成片？**
不会。只要你不分发**含 FFmpeg 的可执行文件**，只交付渲染好的 mp4，就不触发 GPL 的传染性。
危险动作是把 `node_modules` 一起打包发给客户，或做成桌面应用分发。

---

## 交付前的许可检查清单

- [ ] 客户/主体是公司吗？员工数是否 >3？
- [ ] 用了 Remotion 吗？→ 是则确认许可已购或符合免费条件
- [ ] `package.json` 里有没有 GPL 系的包？
- [ ] 交付物里是否混进了 `node_modules` / 可执行文件？（必须清掉）
- [ ] 有没有用到第三方字体、音乐、贴图？它们的许可单独算，与本表无关

---

## 一句话选型建议

**如果商用许可这一条是硬约束，直接选 HyperFrames（Apache-2.0），不要纠结功能差异。**
功能上差的那点便利，不值得为许可风险买单。
