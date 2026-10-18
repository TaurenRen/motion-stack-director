/**
 * 可复用视觉组件
 * 纯 React / CSS / SVG —— 对应样片 01 的“零第三方动画库”路线
 */
import React, { useMemo } from "react";
import { C, F_CN, F_MONO, F_SERIF, clamp, easeOut, easeOutBack, noise1, seg } from "./theme";

/* ==================== 科技卡 ==================== */
export const TechCard: React.FC<{
  title?: string;
  hint?: string;
  accent?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  o?: number;
  w?: number;
  pad?: number;
}> = ({ title, hint, accent = C.cyan, children, style, o = 1, w, pad = 22 }) => (
  <div
    style={{
      width: w,
      padding: pad,
      borderRadius: 18,
      background: "linear-gradient(160deg, rgba(22,36,58,0.92) 0%, rgba(11,19,32,0.94) 100%)",
      border: "1px solid rgba(122,164,214,0.20)",
      boxShadow: `0 18px 46px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05), inset 0 0 60px ${accent}10`,
      opacity: o,
      fontFamily: F_CN,
      color: C.ink,
      position: "relative",
      overflow: "hidden",
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 3,
        height: "100%",
        background: `linear-gradient(to bottom, ${accent}, transparent)`,
      }}
    />
    <div
      style={{
        position: "absolute",
        right: -40,
        top: -40,
        width: 140,
        height: 140,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}22, transparent 70%)`,
      }}
    />
    {title ? (
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 10,
        }}
      >
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 0.5 }}>{title}</span>
        {hint ? (
          <span style={{ fontFamily: F_MONO, fontSize: 13, color: C.faint }}>{hint}</span>
        ) : null}
      </div>
    ) : null}
    {children}
  </div>
);

/* ==================== 标签 ==================== */
export const Badge: React.FC<{
  text: string;
  color?: string;
  o?: number;
  size?: number;
  ghost?: boolean;
}> = ({ text, color = C.cyan, o = 1, size = 20, ghost }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: `6px ${size * 0.6}px`,
      borderRadius: 999,
      fontSize: size,
      fontFamily: F_CN,
      fontWeight: 600,
      color: ghost ? color : "#05090F",
      background: ghost ? `${color}1A` : color,
      border: ghost ? `1px solid ${color}55` : "none",
      opacity: o,
      boxShadow: ghost ? "none" : `0 6px 18px ${color}33`,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </span>
);

/* ==================== 印章 ==================== */
export const Stamp: React.FC<{
  text: string;
  sub?: string;
  color?: string;
  rot?: number;
  o?: number;
  size?: number;
}> = ({ text, sub, color = C.rose, rot = -14, o = 1, size = 30 }) => (
  <div
    style={{
      transform: `rotate(${rot}deg)`,
      opacity: o,
      border: `3px double ${color}`,
      borderRadius: 10,
      padding: "12px 22px",
      textAlign: "center",
      background: `${color}12`,
      boxShadow: `inset 0 0 22px ${color}18`,
    }}
  >
    <div
      style={{
        fontFamily: F_CN,
        fontSize: size,
        fontWeight: 800,
        color,
        letterSpacing: 3,
        lineHeight: 1.15,
      }}
    >
      {text}
    </div>
    {sub ? (
      <div style={{ fontFamily: F_MONO, fontSize: 12, color, opacity: 0.8, letterSpacing: 1 }}>
        {sub}
      </div>
    ) : null}
  </div>
);

/* ==================== 引用框 ==================== */
export const QuoteBox: React.FC<{
  text: string;
  cite?: string;
  o?: number;
  color?: string;
  w?: number;
}> = ({ text, cite, o = 1, color = C.amber, w = 560 }) => (
  <div
    style={{
      width: w,
      opacity: o,
      position: "relative",
      padding: "4px 0 4px 26px",
      borderLeft: `4px solid ${color}`,
    }}
  >
    <span
      style={{
        position: "absolute",
        left: 16,
        top: -22,
        fontFamily: F_SERIF,
        fontSize: 74,
        color,
        opacity: 0.28,
        lineHeight: 1,
      }}
    >
      &ldquo;
    </span>
    <div
      style={{
        fontFamily: F_SERIF,
        fontSize: 34,
        lineHeight: 1.5,
        color: "#F1E7D2",
        letterSpacing: 0.5,
      }}
    >
      {text}
    </div>
    {cite ? (
      <div
        style={{
          marginTop: 12,
          fontFamily: F_MONO,
          fontSize: 15,
          color,
          letterSpacing: 1,
          opacity: 0.85,
        }}
      >
        — {cite}
      </div>
    ) : null}
  </div>
);

/* ==================== 拍立得 ==================== */
export const Polaroid: React.FC<{
  caption: string;
  seed?: number;
  o?: number;
  rot?: number;
  w?: number;
  hue?: string;
}> = ({ caption, seed = 7, o = 1, rot = -6, w = 300, hue = "#4A9EFF" }) => {
  const h = w * 1.2;
  const bars = useMemo(
    () => Array.from({ length: 7 }, (_, i) => 0.3 + noise1(seed * 13 + i, seed) * 0.7),
    [seed],
  );
  return (
    <div
      style={{
        width: w,
        opacity: o,
        transform: `rotate(${rot}deg)`,
        background: "#F6F3EA",
        padding: 16,
        paddingBottom: 76,
        boxShadow: "0 26px 54px rgba(0,0,0,0.62), inset 0 0 0 1px rgba(0,0,0,0.12)",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          height: h,
          background: `linear-gradient(150deg, #0d1728 0%, #14263f 55%, ${hue}55 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: "58%",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            padding: "0 14px 16px",
          }}
        >
          {bars.map((v, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${v * 100}%`,
                background: `linear-gradient(to top, ${hue}, ${hue}22)`,
                opacity: 0.85,
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.14), transparent 60%)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 22,
          fontFamily: F_SERIF,
          fontStyle: "italic",
          fontSize: 22,
          color: "#3A4A60",
          textAlign: "center",
        }}
      >
        {caption}
      </div>
    </div>
  );
};

/* ==================== 新闻卡 ==================== */
export const NewsCard: React.FC<{
  kicker: string;
  title: string;
  lines: string[];
  footer?: string;
  o?: number;
  accent?: string;
  w?: number;
}> = ({ kicker, title, lines, footer, o = 1, accent = C.blue, w = 480 }) => (
  <div
    style={{
      width: w,
      opacity: o,
      background: "linear-gradient(180deg, #132133 0%, #0C1524 100%)",
      border: "1px solid rgba(122,164,214,0.18)",
      borderRadius: 6,
      padding: 22,
      fontFamily: F_CN,
      boxShadow: "0 20px 44px rgba(0,0,0,0.55)",
    }}
  >
    <div
      style={{
        display: "inline-block",
        fontFamily: F_MONO,
        fontSize: 13,
        letterSpacing: 2,
        color: accent,
        borderBottom: `2px solid ${accent}`,
        paddingBottom: 3,
        marginBottom: 12,
      }}
    >
      {kicker}
    </div>
    <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.28, color: C.ink, letterSpacing: 0.3 }}>
      {title}
    </div>
    <div
      style={{
        height: 1,
        background: "linear-gradient(90deg, rgba(122,164,214,0.5), transparent)",
        margin: "14px 0 12px",
      }}
    />
    {lines.map((l, i) => (
      <div
        key={i}
        style={{
          fontSize: 18,
          lineHeight: 1.72,
          color: C.dim,
          display: "flex",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <span style={{ color: accent, fontFamily: F_MONO, fontSize: 14, paddingTop: 4 }}>▍</span>
        <span>{l}</span>
      </div>
    ))}
    {footer ? (
      <div
        style={{
          marginTop: 14,
          fontFamily: F_MONO,
          fontSize: 13,
          color: C.faint,
          letterSpacing: 1,
        }}
      >
        {footer}
      </div>
    ) : null}
  </div>
);

/* ==================== 逐词字幕 ==================== */
export const PerWordCaption: React.FC<{
  text: string;
  local: number;
  start?: number;
  per?: number;
  o?: number;
  color?: string;
  activeColor?: string;
  size?: number;
  align?: "left" | "center";
  w?: number;
}> = ({
  text,
  local,
  start = 0,
  per = 5,
  o = 1,
  color = C.ink,
  activeColor = C.cyan,
  size = 40,
  align = "left",
  w = 620,
}) => {
  const words = useMemo(() => text.split(/(?<=[\u4e00-\u9fa5])|(?<=\s)/).filter((s) => s.trim().length > 0), [text]);
  return (
    <div
      style={{
        width: w,
        opacity: o,
        textAlign: align,
        fontFamily: F_CN,
        fontSize: size,
        fontWeight: 700,
        lineHeight: 1.5,
        letterSpacing: 1,
        textShadow: "0 4px 22px rgba(0,0,0,0.7)",
      }}
    >
      {words.map((wd, i) => {
        const t0 = start + i * per;
        const t = seg(local, t0, t0 + per * 1.6);
        const e = easeOutBack(t);
        const isNew = t > 0 && local - t0 < per * 1.4;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: e,
              transform: `translateY(${(1 - e) * 16}px) scale(${0.86 + 0.14 * e})`,
              color: isNew ? activeColor : color,
              transition: "none",
              whiteSpace: "pre",
            }}
          >
            {wd}
          </span>
        );
      })}
    </div>
  );
};

/* ==================== 文本强调（高亮 / 下划线 / 划掉） ==================== */
export const Emph: React.FC<{
  children: React.ReactNode;
  mode: "highlight" | "underline" | "strike";
  local: number;
  start: number;
  dur?: number;
  color?: string;
  size?: number;
}> = ({ children, mode, local, start, dur = 16, color, size = 30 }) => {
  const t = easeOut(seg(local, start, start + dur));
  const c = color ?? (mode === "highlight" ? C.amber : mode === "underline" ? C.cyan : C.rose);
  const common: React.CSSProperties = {
    fontFamily: F_CN,
    fontSize: size,
    color: C.ink,
    position: "relative",
    display: "inline-block",
    fontWeight: 600,
  };
  if (mode === "highlight") {
    return (
      <span style={common}>
        <span
          style={{
            position: "absolute",
            left: -4,
            top: -2,
            bottom: -2,
            width: `calc(${t * 100}% + 8px)`,
            background: `${c}44`,
            borderBottom: `2px solid ${c}88`,
            zIndex: -1,
          }}
        />
        {children}
      </span>
    );
  }
  if (mode === "underline") {
    return (
      <span style={common}>
        {children}
        <svg
          style={{ position: "absolute", left: 0, bottom: -8, width: "100%", height: 12 }}
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
        >
          <path
            d="M2 8 C 22 2, 34 11, 52 6 S 80 2, 98 7"
            stroke={c}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - t}
          />
        </svg>
      </span>
    );
  }
  return (
    <span style={common}>
      {children}
      <span
        style={{
          position: "absolute",
          left: -3,
          top: "52%",
          height: 3,
          width: `calc(${t * 100}% + 6px)`,
          background: c,
          transform: "translateY(-50%) rotate(-1.2deg)",
          boxShadow: `0 0 10px ${c}`,
        }}
      />
    </span>
  );
};

/* ==================== 波形（程序合成） ==================== */
export const Waveform: React.FC<{
  frame: number;
  bars?: number;
  seed?: number;
  o?: number;
  color?: string;
  h?: number;
  w?: number;
  dur?: number;
  scan?: boolean;
}> = ({ frame, bars = 84, seed = 5, o = 1, color = C.cyan, h = 190, w = 620, scan = true, dur = 210 }) => {
  const amps = useMemo(() => {
    const out: number[] = [];
    // 合成包络：低频起伏 + 周期性 beat，完全确定性
    for (let i = 0; i < bars; i++) {
      const env = Math.sin((i / bars) * Math.PI) * 0.72 + 0.22;
      const beat =
        0.55 +
        0.45 *
          Math.abs(
            Math.sin((i / bars) * Math.PI * 8 + Math.sin(i * 0.7 + seed) * 1.4),
          );
      const fine = 0.5 + 0.5 * Math.abs(Math.sin(i * 1.9 + seed * 3.1) * Math.cos(i * 0.53));
      out.push(clamp(env * (0.35 + 0.65 * beat) * (0.45 + 0.55 * fine)));
    }
    return out;
  }, [bars, seed]);

  const progress = scan ? seg(frame, 0, dur) : 1;
  return (
    <div style={{ width: w, opacity: o, position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          height: h,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 1,
            background: "rgba(140,180,220,0.22)",
          }}
        />
        {amps.map((a, i) => {
          const played = i / bars <= progress;
          const wob = played ? 1 + 0.18 * Math.sin(frame * 0.22 + i * 0.35) : 0.55;
          const hh = Math.max(3, a * h * 0.5 * wob);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: hh,
                minWidth: 2,
                borderRadius: 2,
                background: played
                  ? `linear-gradient(to bottom, ${color}, ${color}55)`
                  : "rgba(140,180,220,0.24)",
                boxShadow: played ? `0 0 8px ${color}66` : "none",
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: `${progress * 100}%`,
          top: 0,
          bottom: 0,
          width: 2,
          background: "#fff",
          boxShadow: "0 0 12px #fff",
          opacity: scan ? 0.9 : 0,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: F_MONO,
          fontSize: 13,
          color: C.faint,
          marginTop: 10,
          letterSpacing: 1,
        }}
      >
        <span>WAVEFORM</span>
        <span>{`${(frame / 30).toFixed(2)}s / ${(dur / 30).toFixed(2)}s`}</span>
      </div>
    </div>
  );
};

/* ==================== 频谱 ==================== */
export const Spectrum: React.FC<{
  frame: number;
  bars?: number;
  o?: number;
  color?: string;
  h?: number;
  w?: number;
}> = ({ frame, bars = 30, o = 1, color = C.violet, h = 260, w = 620 }) => {
  const peaks = useMemo(() => Array.from({ length: bars }, (_, i) => 0.35 + 0.62 * Math.pow(Math.cos((i / bars) * Math.PI * 1.1), 2) * (0.6 + 0.4 * noise1(i, 9))), [bars]);
  return (
    <div style={{ width: w, opacity: o }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: h }}>
        {peaks.map((p, i) => {
          const live =
            p *
            (0.42 +
              0.58 *
                Math.abs(
                  Math.sin(frame * 0.19 + i * 0.42) * 0.6 +
                    Math.sin(frame * 0.07 + i * 1.13) * 0.4,
                ));
          const fall = Math.max(
            0,
            peaks[i] * 0.92 -
              ((frame * 0.6 + i * 7) % 40) * 0.012,
          );
          return (
            <div key={i} style={{ flex: 1, position: "relative", height: "100%" }}>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${live * 100}%`,
                  background: `linear-gradient(to top, ${color}22, ${color})`,
                  boxShadow: `0 0 10px ${color}55`,
                  borderRadius: "3px 3px 0 0",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: `${fall * 100}%`,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "#fff",
                  opacity: 0.8,
                  boxShadow: "0 0 8px #fff",
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: F_MONO,
          fontSize: 13,
          color: C.faint,
          marginTop: 8,
          letterSpacing: 1,
        }}
      >
        <span>SPECTRUM · 30 BANDS</span>
        <span>PEAK-HOLD</span>
      </div>
    </div>
  );
};

/* ==================== 生长线 + 箭头 ==================== */
export const GrowArrow: React.FC<{
  local: number;
  start: number;
  dur?: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  width?: number;
  label?: string;
}> = ({ local, start, dur = 22, x1, y1, x2, y2, color = C.cyan, width = 2.5, label }) => {
  const lt = easeOut(seg(local, start, start + dur));
  const at = easeOut(seg(local, start + dur * 0.72, start + dur));
  const dx = x2 - x1;
  const dy = y2 - y1;
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const headSize = 14 * at;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x1 + dx * lt}
        y2={y1 + dy * lt}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
      <g transform={`translate(${x2} ${y2}) rotate(${ang})`} opacity={at}>
        <path
          d={`M${-headSize} ${-headSize * 0.62} L0 0 L${-headSize} ${headSize * 0.62}`}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {label ? (
        <text
          x={(x1 + x2) / 2}
          y={y1 - 14}
          fill={color}
          fontSize={15}
          fontFamily={F_MONO}
          textAnchor="middle"
          opacity={lt}
          letterSpacing={1}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

/* ==================== 蒙版擦除 ==================== */
export const MaskWipe: React.FC<{
  children: React.ReactNode;
  t: number;
  dir?: "lr" | "rl" | "diag" | "tb";
  soft?: number;
}> = ({ children, t, dir = "lr", soft = 22 }) => {
  const s = `${soft}%`;
  const map: Record<string, string> = {
    lr: `polygon(0 0, ${t * 100}% 0, ${Math.max(0, t * 100 - soft)}% 100%, 0 100%)`,
    rl: `polygon(${100 - t * 100}% 0, 100% 0, 100% 100%, ${Math.max(0, 100 - t * 100 - soft)}% 100%)`,
    diag: `polygon(0 0, ${t * 130}% 0, ${t * 130 - 30}% 100%, 0 100%)`,
    tb: `polygon(0 0, 100% 0, 100% ${t * 100}%, 0 ${Math.max(0, t * 100 - soft)}%)`,
  };
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        WebkitMaskImage: `linear-gradient(${dir === "tb" ? "to bottom" : dir === "rl" ? "to left" : dir === "diag" ? "115deg" : "90deg"}, #000 0%, #000 ${Math.max(0, t * 100 - soft)}%, transparent ${Math.min(100, t * 100)}%)`,
        maskImage: `linear-gradient(${dir === "tb" ? "to bottom" : dir === "rl" ? "to left" : dir === "diag" ? "115deg" : "90deg"}, #000 0%, #000 ${Math.max(0, t * 100 - soft)}%, transparent ${Math.min(100, t * 100)}%)`,
      }}
    >
      {children}
      <div style={{ display: "none" }}>{s}</div>
    </div>
  );
};

/* ==================== 章节标题小组件 ==================== */
export const SectionLabel: React.FC<{ text: string; o?: number; color?: string }> = ({
  text,
  o = 1,
  color = C.faint,
}) => (
  <div
    style={{
      fontFamily: F_MONO,
      fontSize: 15,
      letterSpacing: 3,
      color,
      opacity: o,
      textTransform: "uppercase",
    }}
  >
    {text}
  </div>
);
