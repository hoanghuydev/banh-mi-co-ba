#!/usr/bin/env python3
"""Vẽ khối xám isometric 2:1 đúng góc camera của game để làm ảnh tham chiếu cho AI gen ảnh.

  python3 blockout.py --w 2 --d 1 --h 1.5 --front right --out khoi.png
  python3 blockout.py --w 1 --d 1 --h 0.3 --shape cylinder --out thot.png   (w = đường kính)

w = số ô theo trục x (cạnh chạy xuống-phải), d = số ô theo trục y (cạnh chạy xuống-trái),
h = cao tính bằng ô (1 ô cao ≈ 37 px khi 1 ô rộng 60 px). front = mặt trước nằm bên right hay left.
"""
import argparse
import os
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    sys.exit("cần Pillow: python3 -m pip install --user Pillow")

# Khớp `src/world/iso.ts` (TW 60, TH 30); V = TW/2 / cos45° · cos30° với camera nâng 30°.
TW, TH, V = 60, 30, 37
SIZE = 1024


def project(wx, wy, z):
    return ((wx - wy) * TW / 2, (wx + wy) * TH / 2 - z * V)


def draw_cylinder(dr, dia, h, T, k):
    """Đường tròn nằm trên mặt đất thành elip 2:1: bán trục ngang 30·√2·r px, dọc 15·√2·r px."""
    r = dia / 2
    ax, ay = TW / 2 * 2 ** 0.5 * r * k, TH / 2 * 2 ** 0.5 * r * k
    cx, cy = T(project(r, r, 0))
    top_cy = cy - h * V * k

    def ellipse(y, fill):
        dr.ellipse([cx - ax, y - ay, cx + ax, y + ay], fill=fill, outline=(90, 90, 96))

    ellipse(cy, (170, 170, 178))
    dr.rectangle([cx - ax, top_cy, cx + ax, cy], fill=(170, 170, 178))
    dr.line([(cx - ax, top_cy), (cx - ax, cy)], fill=(90, 90, 96))
    dr.line([(cx + ax, top_cy), (cx + ax, cy)], fill=(90, 90, 96))
    ellipse(top_cy, (226, 226, 230))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--w", type=float, required=True)
    ap.add_argument("--d", type=float, required=True)
    ap.add_argument("--h", type=float, required=True)
    ap.add_argument("--front", choices=["right", "left"], default="right")
    ap.add_argument("--shape", choices=["box", "cylinder"], default="box")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    w, d, h = a.w, a.d, a.h
    pts = {
        "top": [project(0, 0, h), project(w, 0, h), project(w, d, h), project(0, d, h)],
        "right": [project(w, 0, h), project(w, d, h), project(w, d, 0), project(w, 0, 0)],
        "left": [project(0, d, h), project(w, d, h), project(w, d, 0), project(0, d, 0)],
    }
    xs = [p[0] for poly in pts.values() for p in poly]
    ys = [p[1] for poly in pts.values() for p in poly]
    bw, bh = max(xs) - min(xs), max(ys) - min(ys)
    k = SIZE * 0.7 / max(bw, bh)
    ox = SIZE / 2 - (min(xs) + max(xs)) / 2 * k
    oy = SIZE / 2 - (min(ys) + max(ys)) / 2 * k

    def T(p):
        return (ox + p[0] * k, oy + p[1] * k)

    im = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
    dr = ImageDraw.Draw(im)
    if a.shape == "cylinder":
        draw_cylinder(dr, w, h, T, k)
        im.save(a.out)
        print(f"{a.out}  trụ đường kính {w} ô, cao {h} ô")
        return
    colors = {"top": (226, 226, 230), "left": (150, 150, 158), "right": (192, 192, 200)}
    for face in ("left", "right", "top"):
        dr.polygon([T(p) for p in pts[face]], fill=colors[face], outline=(90, 90, 96))

    # Mũi tên đỏ trên mặt trên chỉ hướng mặt trước; +x = xuống-phải, +y = xuống-trái.
    cx, cy = w / 2, d / 2
    dx, dy = (1, 0) if a.front == "right" else (0, 1)
    reach = (w if dx else d) * 0.32
    tail = T(project(cx - dx * reach, cy - dy * reach, h))
    tip = T(project(cx + dx * reach, cy + dy * reach, h))
    dr.line([tail, tip], fill=(220, 40, 40), width=10)
    ux, uy = tip[0] - tail[0], tip[1] - tail[1]
    n = (ux * ux + uy * uy) ** 0.5
    ux, uy = ux / n, uy / n
    for s in (1, -1):
        dr.line([tip, (tip[0] - ux * 40 - s * uy * 24, tip[1] - uy * 40 + s * ux * 24)],
                fill=(220, 40, 40), width=10)

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    im.save(a.out)
    print(f"{a.out}  {w}×{d}×{h} ô, mặt trước {a.front}")


if __name__ == "__main__":
    main()
