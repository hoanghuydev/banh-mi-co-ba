#!/usr/bin/env python3
"""Gộp art-raw/render/<nhân vật>/<tư thế>/<hướng>_<frame>.png thành atlas Phaser, ô tên `<tư thế>_<hướng>_<frame>`."""
import argparse
import json
import math
import os
import re
import sys
from pathlib import Path

from PIL import Image

FRAME_RX = re.compile(r"^(?P<dir>[a-z]{1,2})_(?P<idx>\d+)\.png$")


def collect(root: Path):
    out = []
    for pose_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        for f in sorted(pose_dir.iterdir()):
            m = FRAME_RX.match(f.name)
            if not m:
                continue
            out.append((f"{pose_dir.name}_{m['dir']}_{int(m['idx']):02d}", f))
    return out


def union_box(paths):
    """Khung chung cho mọi ô, để chân không giật khi đổi hướng hay frame."""
    box = None
    for p in paths:
        with Image.open(p) as im:
            b = im.convert("RGBA").getbbox()
        if b is None:
            continue
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]),
                                     max(box[2], b[2]), max(box[3], b[3]))
    if box is None:
        sys.exit("moi anh deu trong suot hoan toan")
    return box


def main():
    ap = argparse.ArgumentParser(description="Gop anh render thanh atlas cho Phaser")
    ap.add_argument("name", help="ten nhan vat (ten thu muc trong art-raw/render)")
    ap.add_argument("--src", default="art-raw/render")
    ap.add_argument("--out", default="public/art")
    ap.add_argument("--height", type=int, default=384,
                    help="chieu cao moi o sau khi co lai (px)")
    ap.add_argument("--pad", type=int, default=2,
                    help="vien trong giua cac o, chong ri mau khi GPU noi suy")
    a = ap.parse_args()

    root = Path(a.src) / a.name
    if not root.is_dir():
        sys.exit(f"khong thay {root} — chay render-character.py truoc")

    frames = collect(root)
    if not frames:
        sys.exit(f"{root} khong co anh nao dung dang <huong>_<frame>.png")

    box = union_box([p for _, p in frames])
    bw, bh = box[2] - box[0], box[3] - box[1]
    scale = a.height / bh
    cw, ch = max(1, round(bw * scale)), a.height
    print(f"[atlas] {len(frames)} o | khung chung {bw}x{bh} -> moi o {cw}x{ch}")

    cols = max(1, round(math.sqrt(len(frames) * ch / cw)))
    rows = math.ceil(len(frames) / cols)
    pad = a.pad
    W, H = cols * (cw + pad) + pad, rows * (ch + pad) + pad
    print(f"[atlas] luoi {cols}x{rows} -> anh {W}x{H}")

    sheet = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    meta = {}
    for i, (key, path) in enumerate(frames):
        with Image.open(path) as im:
            cell = im.convert("RGBA").crop(box).resize((cw, ch), Image.LANCZOS)
        x = pad + (i % cols) * (cw + pad)
        y = pad + (i // cols) * (ch + pad)
        sheet.paste(cell, (x, y))
        meta[key] = {
            "frame": {"x": x, "y": y, "w": cw, "h": ch},
            "rotated": False, "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": cw, "h": ch},
            "sourceSize": {"w": cw, "h": ch},
        }

    outdir = Path(a.out)
    outdir.mkdir(parents=True, exist_ok=True)
    png = outdir / f"{a.name}.png"
    sheet.save(png, optimize=True)
    (outdir / f"{a.name}.json").write_text(json.dumps(
        {"frames": meta,
         "meta": {"image": png.name, "format": "RGBA8888",
                  "size": {"w": W, "h": H}, "scale": 1,
                  "app": "tools/pack-atlas.py"}},
        indent=1))

    # Neo tay: x lệch tâm ô, y cao hơn đáy ô, cả hai chia chiều cao ô vì game nhân lại với `PLAYER_H`.
    holds: dict[str, dict[str, list[float]]] = {}
    for f in sorted(root.glob("*.anchor.json")):
        raw = json.loads(f.read_text())
        conv = {}
        for k, (px, py) in raw.items():
            cx = (px - box[0]) * (cw / bw)
            cy = (py - box[1]) * (ch / bh)
            conv[k] = [round((cx - cw / 2) / ch, 5), round((ch - cy) / ch, 5)]
        holds[f.name[:-len(".anchor.json")]] = conv
    if holds:
        hp = outdir / f"{a.name}_hold.json"
        hp.write_text(json.dumps(holds, indent=1))
        n = sum(len(v) for v in holds.values())
        print(f"[atlas] neo tay: {', '.join(holds)} ({n} o) -> {hp.name}")

    poses = sorted({k.rsplit("_", 2)[0] for k in meta})
    print(f"[atlas] tu the: {', '.join(poses)}")
    print(f"[atlas] -> {png} ({png.stat().st_size // 1024} KB) + {a.name}.json")


if __name__ == "__main__":
    main()
