/**
 * 后处理特效 + 程序化背景
 * 全部使用 CSS / SVG 原生能力（01 号样片强调：不加第三方动效库也能做到）
 */
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { C, clamp, VW, VH, mulberry32, noise1, seg } from "./theme";

/* ============ 胶片颗粒（确定性“沸腾”，非逐帧随机） ============ */
export const Grain: React.FC<{ frame: number; opacity?: number; id?: string }> = ({
  frame,
  opacity = 0.07,
  id = "grain",
}) => {
  // 每 2 帧换一次位置，模拟胶片颗粒的“呼吸”，但不产生白噪声闪烁
  const step = Math.floor(frame / 2) % 6;
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity,
        pointerEvents: "none",
        mixBlendMode: "overlay",
        transform: `translate(${((step % 3) - 1) * 3}px, ${(Math.floor(step / 3) - 1) * 3}px)`,
      }}
    >
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="110%" height="110%" x="-5%" y="-5%" filter={`url(#${id})`} />
    </svg>
  );
};

/* ============ 扫描线 ============ */
export const Scanlines: React.FC<{ opacity?: number; gap?: number }> = ({
  opacity = 0.22,
  gap = 4,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      opacity,
      background: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.055) 0px, rgba(255,255,255,0.055) 1px, transparent 1px, transparent ${gap}px)`,
    }}
  />
);

/* ============ 暗角 ============ */
export const Vignette: React.FC<{ opacity?: number }> = ({ opacity = 0.55 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      opacity,
      background:
        "radial-gradient(ellipse 76% 62% at 50% 45%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.62) 100%)",
    }}
  />
);

/* ============ 色差（RGB 通道错位） ============ */
let chromaticId = 0;
export const Chromatic: React.FC<{
  children: React.ReactNode;
  amount?: number;
  frame?: number;
}> = ({ children, amount = 3, frame = 0 }) => {
  const uid = useMemo(() => `ca${chromaticId++}`, []);
  const pulse = amount * (1 + 0.35 * Math.sin(frame * 0.06));
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id={`${uid}r`}>
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            />
          </filter>
          <filter id={`${uid}c`}>
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill
        style={{
          transform: `translateX(${-pulse}px)`,
          mixBlendMode: "screen",
          filter: `url(#${uid}r)`,
          opacity: 0.85,
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `translateX(${pulse}px)`,
          mixBlendMode: "screen",
          filter: `url(#${uid}c)`,
          opacity: 0.85,
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ============ 网格底纹 ============ */
export const GridBackdrop: React.FC<{
  frame: number;
  cell?: number;
  color?: string;
  speed?: number;
  o?: number;
  major?: number;
}> = ({ frame, cell = 46, color = "rgba(122,180,255,0.15)", speed = 0.6, o = 1, major = 5 }) => {
  const off = (frame * speed) % cell;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
          backgroundSize: `${cell}px ${cell}px, ${cell}px ${cell}px`,
          backgroundPosition: `0 ${-off}px, ${-off * 0.4}px 0`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(160,200,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(160,200,255,0.12) 1px, transparent 1px)`,
          backgroundSize: `${cell * major}px ${cell * major}px, ${cell * major}px ${cell * major}px`,
          backgroundPosition: `0 ${-off}px, ${-off * 0.4}px 0`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 42%, rgba(0,0,0,0) 40%, rgba(5,8,15,0.92) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/* ============ 等高线（程序生成 SVG 闭合曲线） ============ */
export const ContourBackdrop: React.FC<{
  frame: number;
  seed?: number;
  rings?: number;
  o?: number;
  cy?: number;
  color?: string;
}> = ({ frame, seed = 3, rings = 11, o = 1, cy = 0.44, color = "#4FE3C1" }) => {
  const paths = useMemo(() => {
    const out: string[] = [];
    const cx = VW / 2;
    const cyy = VH * cy;
    const N = 120;
    for (let r = 0; r < rings; r++) {
      const base = 42 + r * 46;
      const ph = (r * 0.55 + seed) % 6.283;
      let d = "";
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const wob =
          1 +
          0.16 * Math.sin(3 * a + ph) +
          0.09 * Math.sin(5 * a - ph * 1.7) +
          0.05 * Math.sin(7 * a + ph * 0.6);
        const rr = base * wob;
        const x = cx + Math.cos(a) * rr * 1.18;
        const y = cyy + Math.sin(a) * rr * 0.72;
        d += i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : `L${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      out.push(d + "Z");
    }
    return out;
  }, [rings, seed, cy]);

  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`}>
        <defs>
          <radialGradient id="contourFade" cx="50%" cy={`${cy * 100}%`} r="58%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.04" />
          </radialGradient>
          <mask id="contourMask">
            <rect width={VW} height={VH} fill="url(#contourFade)" />
          </mask>
        </defs>
        <g mask="url(#contourMask)" fill="none">
          {paths.map((d, i) => {
            const drift = Math.sin(frame * 0.012 + i * 0.5) * 5;
            return (
              <path
                key={i}
                d={d}
                stroke={color}
                strokeWidth={i % 4 === 0 ? 1.6 : 0.9}
                strokeOpacity={i % 4 === 0 ? 0.42 : 0.2}
                transform={`translate(${drift.toFixed(2)} ${(drift * 0.4).toFixed(2)})`}
              />
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* ============ 波浪层 ============ */
export const WaveBackdrop: React.FC<{
  frame: number;
  o?: number;
  layers?: { y: number; amp: number; len: number; spd: number; c: string; op: number }[];
}> = ({ frame, o = 1, layers }) => {
  const ls = layers ?? [
    { y: 0.62, amp: 34, len: 1.7, spd: 0.026, c: "#4A9EFF", op: 0.16 },
    { y: 0.72, amp: 44, len: 1.3, spd: -0.019, c: "#4FE3C1", op: 0.14 },
    { y: 0.83, amp: 54, len: 1.0, spd: 0.014, c: "#A78BFA", op: 0.12 },
  ];
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width={VW} height={VH} viewBox={`0 0 ${VW} ${VH}`}>
        {ls.map((L, li) => {
          const y0 = VH * L.y;
          const t = frame * L.spd;
          let d = `M0 ${VH}`;
          for (let x = 0; x <= VW; x += 12) {
            const k = x / VW;
            const y =
              y0 +
              Math.sin(k * Math.PI * 2 * L.len + t * 6.283) * L.amp +
              Math.sin(k * Math.PI * 2 * L.len * 2.3 + t * 4.1 + li) * L.amp * 0.35;
            d += ` L${x} ${y.toFixed(1)}`;
          }
          d += ` L${VW} ${VH} Z`;
          return <path key={li} d={d} fill={L.c} fillOpacity={L.op} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ============ 粒子（CSS / 绝对定位） ============ */
export const Particles: React.FC<{
  frame: number;
  count?: number;
  seed?: number;
  o?: number;
  color?: string;
}> = ({ frame, count = 70, seed = 21, o = 1, color = "#8FD8FF" }) => {
  const items = useMemo(() => {
    const rnd = mulberry32(seed);
    return Array.from({ length: count }, () => ({
      x: rnd() * VW,
      y: rnd() * VH,
      r: 1 + rnd() * 3.2,
      vy: 0.18 + rnd() * 0.55,
      ph: rnd() * 6.283,
      sw: 6 + rnd() * 22,
      a: 0.2 + rnd() * 0.55,
    }));
  }, [count, seed]);

  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: "none" }}>
      {items.map((p, i) => {
        const y = (p.y - frame * p.vy) % (VH + 60);
        const yy = y < -40 ? y + VH + 60 : y;
        const x = p.x + Math.sin(frame * 0.02 + p.ph) * p.sw;
        const tw = 0.65 + 0.35 * Math.sin(frame * 0.09 + p.ph * 2);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: yy,
              width: p.r * 2,
              height: p.r * 2,
              borderRadius: "50%",
              background: color,
              opacity: p.a * tw,
              boxShadow: `0 0 ${p.r * 5}px ${color}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ============ 广播网 / 渐变底 ============ */
export const BaseBackdrop: React.FC<{ tint?: string }> = ({ tint = "#4A9EFF" }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: `linear-gradient(170deg, ${C.bg1} 0%, ${C.bg0} 62%, #04070D 100%)` }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 22%, ${tint}22 0%, transparent 52%), radial-gradient(circle at 18% 82%, ${C.violet}18 0%, transparent 46%)`,
      }}
    />
  </AbsoluteFill>
);

/* ============ 进度条 ============ */
export const ProgressBar: React.FC<{ frame: number; total: number; color?: string }> = ({
  frame,
  total,
  color = C.cyan,
}) => (
  <div
    style={{
      position: "absolute",
      left: 34,
      right: 34,
      bottom: 14,
      height: 3,
      background: "rgba(255,255,255,0.08)",
      borderRadius: 2,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${clamp(frame / total) * 100}%`,
        height: "100%",
        background: color,
        boxShadow: `0 0 10px ${color}`,
      }}
    />
  </div>
);

/* ============ 通用：由帧驱动的数值（替代 Scene instrument） ============ */
export const useScaleProbe = (frame: number) => seg(frame, 0, 1);

export { noise1 };
