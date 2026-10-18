#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
视频成片质检：抽帧 + 指标法自检。

用法:
  python qc_video.py <视频1> [<视频2> ...] [--out 报告目录] [--samples 10] [--keep]

  --out      报告输出目录（默认当前目录），报告名 qc-report.md
  --samples  每条视频采样帧数（默认 10）
  --keep     保留抽出的 PNG 帧（默认渲到临时目录并在结束后删除，避免污染交付目录）

判定:
  - 平均亮度 < 2 或 > 250        -> 黑屏 / 白屏
  - 量化色组 < 6                 -> 元素缺失（可能只有一个纯色块）
  - 相邻采样帧四项指标完全相同    -> 静帧事故（动画没动）

依赖: numpy, Pillow；ffmpeg / ffprobe 需在 PATH 或通过环境变量指定：
  FFMPEG_BIN / FFPROBE_BIN

输出 UTF-8 markdown，避免 PowerShell 中文乱码。
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

# ---------- ffmpeg 定位（可移植） ----------
_FFMPEG_FALLBACKS = [
    r"D:\ProgramData\ffmpeg-win64\bin\ffmpeg.exe",
    r"C:\ffmpeg\bin\ffmpeg.exe",
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
]


def _resolve(exe: str, env_key: str) -> str:
    env = os.environ.get(env_key)
    if env and Path(env).exists():
        return env
    found = shutil.which(exe)
    if found:
        return found
    for cand in _FFMPEG_FALLBACKS:
        p = Path(cand)
        if p.name.lower().startswith(exe.lower()) and p.exists():
            return str(p)
    # 同目录推断
    for cand in _FFMPEG_FALLBACKS:
        p = Path(cand).with_name(exe + (".exe" if os.name == "nt" else ""))
        if p.exists():
            return str(p)
    raise SystemExit(
        f"找不到 {exe}。请安装 ffmpeg 或用环境变量 {env_key} 指定完整路径。"
    )


FFMPEG = _resolve("ffmpeg", "FFMPEG_BIN")
FFPROBE = _resolve("ffprobe", "FFPROBE_BIN")


def probe(path: Path) -> dict:
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,r_frame_rate,nb_frames,duration",
         "-show_entries", "format=duration,size",
         "-of", "json", str(path)],
        capture_output=True, text=True, encoding="utf-8").stdout
    data = json.loads(out)
    if not data.get("streams"):
        raise RuntimeError(f"{path.name} 没有视频流")
    st = data["streams"][0]
    return {
        "width": st["width"],
        "height": st["height"],
        "fps": st["r_frame_rate"],
        "nb_frames": st.get("nb_frames"),
        "duration": float(data["format"]["duration"]),
        "size_mb": round(int(data["format"]["size"]) / 1048576, 2),
    }


def metrics(img: Image.Image) -> dict:
    a = np.asarray(img.convert("RGB"), dtype=np.float32)
    gray = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    gy, gx = np.gradient(gray)
    edge = float(np.mean(np.abs(gx) + np.abs(gy)))
    q = (a // 32).astype(np.int32)
    colors = len(np.unique(q[:, :, 0] * 64 + q[:, :, 1] * 8 + q[:, :, 2]))
    return {
        "brightness": round(float(gray.mean()), 2),
        "contrast": round(float(gray.std()), 2),
        "edge": round(edge, 3),
        "colors": colors,
    }


def sample(path: Path, tmp: Path, n: int) -> tuple:
    info = probe(path)
    dur = info["duration"]
    rows = []
    for i in range(n):
        t = dur * (i + 0.5) / n
        png = tmp / f"{path.stem}_{i:02d}.png"
        subprocess.run(
            [FFMPEG, "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", str(path),
             "-frames:v", "1", str(png)],
            check=True)
        m = metrics(Image.open(png))
        m["t"] = round(t, 2)
        rows.append(m)
    return info, rows


def judge(info: dict, rows: list) -> list:
    issues = []
    for r in rows:
        if r["brightness"] < 2:
            issues.append(f"黑屏 @{r['t']}s（亮度 {r['brightness']}）")
        if r["brightness"] > 250:
            issues.append(f"白屏 @{r['t']}s（亮度 {r['brightness']}）")
        if r["colors"] < 6:
            issues.append(f"色彩过少 @{r['t']}s（{r['colors']} 组）")
    sig = {(r["brightness"], r["contrast"], r["edge"], r["colors"]) for r in rows}
    if len(sig) <= 2:
        issues.append(f"疑似静帧：{len(rows)} 个采样点只有 {len(sig)} 种画面指标")
    if info["duration"] < 1:
        issues.append(f"时长异常：{info['duration']:.2f}s")
    return issues


def main() -> int:
    args = list(sys.argv[1:])
    out_dir = Path.cwd()
    n_samples = 10
    keep = False

    if "--out" in args:
        i = args.index("--out")
        out_dir = Path(args[i + 1])
        del args[i:i + 2]
    if "--samples" in args:
        i = args.index("--samples")
        n_samples = max(3, int(args[i + 1]))
        del args[i:i + 2]
    if "--keep" in args:
        keep = True
        args.remove("--keep")

    files = [Path(a) for a in args if not a.startswith("-")]
    if not files:
        print(__doc__)
        return 2

    out_dir.mkdir(parents=True, exist_ok=True)
    tmp = out_dir / "_qc" if keep else Path(tempfile.mkdtemp(prefix="qc-frames-"))
    tmp.mkdir(parents=True, exist_ok=True)

    blocks = []
    summary = []
    try:
        for f in files:
            if not f.exists():
                blocks.append(f"## {f.name}\n- 状态: 缺失（文件不存在）\n")
                summary.append((f.name, "MISSING", 0))
                continue
            info, rows = sample(f, tmp, n_samples)
            issues = judge(info, rows)
            b = [f"## {f.name}"]
            b.append(
                f"- 规格: {info['width']}x{info['height']} @ {info['fps']}"
                + (f" · {info['nb_frames']}f" if info.get("nb_frames") else "")
                + f" · {info['duration']:.2f}s · {info['size_mb']} MB")
            b.append("- 采样指标:")
            for r in rows:
                b.append(
                    f"  - {r['t']:>5.2f}s  亮度 {r['brightness']:>6.2f}  "
                    f"对比 {r['contrast']:>6.2f}  边缘 {r['edge']:>6.3f}  色组 {r['colors']:>3}")
            b.append(f"- 判定: {'PASS' if not issues else 'FAIL'}")
            for it in issues:
                b.append(f"  - {it}")
            blocks.append("\n".join(b))
            summary.append((f.name, "PASS" if not issues else "FAIL", len(issues)))
    finally:
        if not keep:
            shutil.rmtree(tmp, ignore_errors=True)

    head = ["# 成片质检报告", ""]
    head.append("| 文件 | 判定 | 问题数 |")
    head.append("|---|---|---|")
    for name, verdict, cnt in summary:
        head.append(f"| {name} | {verdict} | {cnt} |")
    head.append("")
    passed = sum(1 for _, v, _ in summary if v == "PASS")
    head.append(f"**合计 {passed}/{len(summary)} 通过**")
    head.append("")

    text = "\n".join(head) + "\n" + "\n\n".join(blocks) + "\n"
    out = out_dir / "qc-report.md"
    out.write_text(text, encoding="utf-8")
    print(text)
    print(f"报告已写入: {out}")
    return 0 if passed == len(summary) else 1


if __name__ == "__main__":
    raise SystemExit(main())
