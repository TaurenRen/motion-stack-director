/**
 * 转场：01 号样片需要展示「至少 3 类转场」
 * 这里提供 4 类：蒙版擦除 / 方块溶解 / 扫描线 / 推移+缩放
 * 全部为 CSS mask + transform，无第三方库
 */
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, XF, clamp, easeInOut, easeOut, seg } from "./theme";

export type SceneXF = "none" | "wipe" | "blocks" | "scan" | "push";

/* ---------- 溶解遮片：方块 / 扫描线 ---------- */
const CoverPlate: React.FC<{ t: number; mode: "blocks" | "scan"; color?: string }> = ({
  t,
  mode,
  color = C.bg0,
}) => {
  if (mode === "blocks") {
    const cols = 6;
    const rows = 11;
    const cells: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const d = (c / (cols - 1)) * 0.42 + (r / (rows - 1)) * 0.3;
        const ct = easeOut(seg(t, d * 0.7, d * 0.7 + 0.3));
        cells.push(
          <div
            key={`${r}-${c}`}
            style={{
              position: "absolute",
              left: `${(c / cols) * 100}%`,
              top: `${(r / rows) * 100}%`,
              width: `${100 / cols + 0.4}%`,
              height: `${100 / rows + 0.4}%`,
              background: color,
              opacity: 1 - ct,
            }}
          />,
        );
      }
    }
    return <AbsoluteFill style={{ pointerEvents: "none" }}>{cells}</AbsoluteFill>;
  }

  // scan
  const rows = 30;
  const bands: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const d = r / (rows - 1);
    const ct = easeOut(seg(t, d * 0.86, d * 0.86 + 0.14));
    bands.push(
      <div
        key={r}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${(r / rows) * 100}%`,
          height: `${100 / rows + 0.3}%`,
          background: color,
          opacity: 1 - ct,
        }}
      />,
    );
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {bands}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${t * 100}%`,
          height: 3,
          background: "#fff",
          boxShadow: `0 0 22px ${C.cyan}, 0 0 60px ${C.cyan}`,
          opacity: clamp(1 - t) * 0.9,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------- 场景外壳 ---------- */
export const Scene: React.FC<{
  from: number;
  dur: number;
  kind?: SceneXF;
  children: React.ReactNode;
  /** push 方向：-1 从上推入，1 从下推入 */
  dir?: -1 | 1;
}> = ({ from, dur, kind = "wipe", children, dir = 1 }) => {
  const frame = useCurrentFrame();
  const local = frame - from;
  if (local < 0 || local >= dur) return null;
  const t = easeInOut(clamp(local / XF));

  if (kind === "none") return <AbsoluteFill>{children}</AbsoluteFill>;

  if (kind === "wipe") {
    const p = -18 + t * 136;
    const mask = `linear-gradient(114deg, #000 0%, #000 ${p}%, rgba(0,0,0,0) ${p + 17}%)`;
    return (
      <AbsoluteFill
        style={{
          WebkitMaskImage: mask,
          maskImage: mask,
          transform: `scale(${(1.03 - 0.03 * t).toFixed(4)})`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  if (kind === "push") {
    return (
      <AbsoluteFill
        style={{
          transform: `translateY(${dir * (1 - t) * 22}%) scale(${(0.9 + 0.1 * t).toFixed(4)})`,
          opacity: clamp(t * 1.4),
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {children}
      <CoverPlate t={t} mode={kind === "blocks" ? "blocks" : "scan"} />
    </AbsoluteFill>
  );
};

/* ---------- 镜头推拉（场景内的摄影机运动） ---------- */
export const CameraPush: React.FC<{
  local: number;
  from: number;
  to: number;
  dur: number;
  children: React.ReactNode;
  origin?: string;
}> = ({ local, from, to, dur, children, origin = "50% 46%" }) => {
  const k = easeInOut(seg(local, 0, dur));
  const s = from + (to - from) * k;
  return (
    <AbsoluteFill style={{ transform: `scale(${s.toFixed(4)})`, transformOrigin: origin }}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * 变体：帧号由外层 <Sequence> 提供（local 即 useCurrentFrame()）
 * 用于需要 <Sequence> 重置帧上下文的场景（GSAP 场景）
 */
export const SceneLocal: React.FC<{
  dur: number;
  kind?: SceneXF;
  children: React.ReactNode;
  dir?: -1 | 1;
}> = ({ dur, kind = "wipe", children, dir = 1 }) => {
  const local = useCurrentFrame();
  const t = easeInOut(clamp(local / XF));

  if (kind === "none") return <AbsoluteFill>{children}</AbsoluteFill>;

  if (kind === "wipe") {
    const p = -18 + t * 136;
    const mask = `linear-gradient(114deg, #000 0%, #000 ${p}%, rgba(0,0,0,0) ${p + 17}%)`;
    return (
      <AbsoluteFill
        style={{
          WebkitMaskImage: mask,
          maskImage: mask,
          transform: `scale(${(1.03 - 0.03 * t).toFixed(4)})`,
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  if (kind === "push") {
    return (
      <AbsoluteFill
        style={{
          transform: `translateY(${dir * (1 - t) * 22}%) scale(${(0.9 + 0.1 * t).toFixed(4)})`,
          opacity: clamp(t * 1.4),
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {children}
      <CoverPlate t={t} mode={kind === "blocks" ? "blocks" : "scan"} />
    </AbsoluteFill>
  );
};

/* ---------- 出场：留旧的场景用于过渡（可选） ---------- */
export const FadeOutShell: React.FC<{
  local: number;
  dur: number;
  children: React.ReactNode;
  kind?: "zoom" | "blur" | "plain";
}> = ({ local, dur, children, kind = "zoom" }) => {
  const t = easeInOut(clamp(seg(local, dur - XF, dur)));
  const style: React.CSSProperties =
    kind === "zoom"
      ? { transform: `scale(${(1 + t * 0.14).toFixed(4)})`, opacity: 1 - t }
      : kind === "blur"
        ? { filter: `blur(${t * 8}px)`, opacity: 1 - t * 0.6 }
        : { opacity: 1 - t };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
