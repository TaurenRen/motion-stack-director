/**
 * 能力边界样片 —— 共享主题 / 工具
 * 全部视觉均为确定性计算（无 Math.random、无 Date.now），保证逐帧可重渲染。
 */
import React from "react";

// ---------- 尺寸 ----------
export const VW = 720;
export const VH = 1280;

// ---------- 字体 ----------
export const F_CN =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Source Han Sans SC", "Heiti SC", sans-serif';
export const F_MONO =
  '"JetBrains Mono", "Cascadia Mono", Consolas, Menlo, "Courier New", monospace';
export const F_SERIF =
  'Georgia, "Times New Roman", "Songti SC", "SimSun", serif';

// ---------- 配色（深色编辑器友好） ----------
export const C = {
  bg0: "#05080F",
  bg1: "#0A1220",
  bg2: "#0F1B2C",
  panel: "rgba(14,24,40,0.74)",
  panelSolid: "#0E1826",
  line: "rgba(122,164,214,0.16)",
  lineStrong: "rgba(122,180,255,0.40)",
  ink: "#E9F1FA",
  dim: "#93A7C4",
  faint: "#5B6E8B",
  cyan: "#4FE3C1",
  blue: "#4A9EFF",
  violet: "#A78BFA",
  amber: "#F2B24C",
  rose: "#FF6F91",
  green: "#63D471",
  paper: "#F3F0E8",
};

// ---------- 数学 / 缓动 ----------
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** 归一化区间进度 */
export const seg = (f: number, a: number, b: number) =>
  clamp((f - a) / (b - a));

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeIn = (t: number) => t * t * t;

/** 桶形（常用于横排 12 列的错落进入） */
export const easeOutBack = (t: number, s = 1.42) =>
  1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);

/** 确定性伪随机 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 由 seed 派生的稳定噪声值，用于“看似随机但可复现”的数据 */
export const noise1 = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- 影片结构常量 ----------
export const FPS = 30;
/** 01 / 02 总时长：15.2s @30fps */
export const TOTAL = 456;

/** 场景切点（帧） */
export const MARK = {
  s2: 66,
  s3: 162,
  s4: 252,
  s5: 336,
  s6: 402,
};

/** 转场重叠帧数 */
export const XF = 12;

/**
 * 场景外壳的进出控制。
 * - outgoing：自身时长内的最后 XF 帧做退场
 * - incoming：开头 XF 帧做入场
 */
export const fadeIO = (local: number, dur: number, xf = XF) => {
  const inT = seg(local, 0, xf);
  const outT = 1 - seg(local, dur - xf, dur);
  return Math.min(easeOut(inT), easeOut(outT));
};

// ---------- 左上角技术标注 ----------
export const TechTag: React.FC<{
  index: string;
  title: string;
  lines: string[];
  color?: string;
  delay?: number;
}> = ({ index, title, lines, color = C.cyan, delay = 0 }) => {
  const t = delay;
  return (
    <div
      style={{
        position: "absolute",
        left: 34,
        top: 40,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        opacity: clamp(t * 3),
        transform: `translateY(${(1 - clamp(t * 3)) * -14}px)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily: F_MONO,
            fontSize: 20,
            fontWeight: 700,
            color: "#04080F",
            background: color,
            padding: "3px 9px",
            borderRadius: 5,
            letterSpacing: 1,
          }}
        >
          {index}
        </span>
        <span
          style={{
            fontFamily: F_CN,
            fontSize: 24,
            fontWeight: 700,
            color: C.ink,
            letterSpacing: 1,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {lines.map((l, i) => (
          <span
            key={l + i}
            style={{
              fontFamily: F_MONO,
              fontSize: 15,
              color: C.faint,
              letterSpacing: 0.4,
              paddingLeft: 2,
            }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};

/** 底部安全提示条 */
export const Footer: React.FC<{ left: string; right: string; o?: number }> = ({
  left,
  right,
  o = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: 34,
      right: 34,
      bottom: 30,
      display: "flex",
      justifyContent: "space-between",
      fontFamily: F_MONO,
      fontSize: 14,
      color: C.faint,
      opacity: 0.75 * o,
      letterSpacing: 0.6,
    }}
  >
    <span>{left}</span>
    <span>{right}</span>
  </div>
);
