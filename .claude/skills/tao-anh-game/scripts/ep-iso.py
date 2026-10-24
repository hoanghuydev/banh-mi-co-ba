#!/usr/bin/env python3
"""Ép ảnh đồ hình hộp (đã xóa nền) về đúng iso 2:1: cạnh chân dốc 0,5, cạnh đứng thẳng, hai nửa trái/phải co giãn ngang cho đúng số ô, thân gỗ kéo cao đúng `--body` (mặt bàn giữ nguyên).

    python3 ep-iso.py in.png out.png --w 1 --d 2 --body 28

W: cạnh chạy xuống-phải (mặt trái), D: cạnh chạy xuống-trái (mặt phải), tính theo ô. In ra kích thước thiết kế
(`w`, `h`), vị trí ngang đỉnh dưới (`foot`) và `body` (bề cao thân, ước từ chiều cao ảnh), để chép vào `src/art/photo.ts`.
"""
import argparse
import json
import sys

import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("out")
ap.add_argument("--w", type=float, default=1)
ap.add_argument("--d", type=float, default=1)
ap.add_argument("--body", type=float, default=28, help="bề cao thân gỗ (px thiết kế)")
args = ap.parse_args()

im = Image.open(args.src).convert("RGBA")
alpha = np.array(im.getchannel("A")) > 128
H, W = alpha.shape
cols = np.where(alpha.any(axis=0))[0]
x_min, x_max = int(cols.min()), int(cols.max())
bot = np.array([np.where(alpha[:, x])[0].max() if alpha[:, x].any() else -1 for x in range(W)])
top = np.array([np.where(alpha[:, x])[0].min() if alpha[:, x].any() else -1 for x in range(W)])

# Đỉnh dưới B: giữa đoạn đáy thấp nhất.
low = np.where(bot >= bot.max() - 1)[0]
bx, by = float(low.mean()), float(bot.max())

# Góc thân hai đầu: chỗ đáy nhảy vọt (mép tấm mặt bàn nhô ra nằm ngoài góc thân).
step = np.abs(np.diff(bot))
jumps = [x + 1 for x in range(len(step)) if step[x] > 4]
lx = float(max([j for j in jumps if j < bx], default=x_min))
rx = float(min([j - 1 for j in jumps if j > bx], default=x_max))


def slope(xs):
    xs = np.array(list(xs))
    return float(np.polyfit(xs, bot[xs], 1)[0])


span_l, span_r = bx - lx, rx - bx
s_l = slope(range(int(lx + span_l * 0.15), int(bx - span_l * 0.15)))
s_r = slope(range(int(bx + span_r * 0.15), int(rx - span_r * 0.15)))

S = span_r / (30 * args.d)  # px ảnh gốc trên một px thiết kế

# Bề cao phần gỗ ở mặt dài bên phải (đo bằng màu: gỗ đỏ hơn lục, mặt bàn teal thì ngược lại).
rgb = np.array(im.convert("RGB")).astype(int)
heights = []
for x in range(int(bx + span_r * 0.2), int(bx + span_r * 0.8)):
    y = int(bot[x])
    while y > 0 and rgb[y, x, 0] > rgb[y, x, 1]:
        y -= 1
    heights.append(int(bot[x]) - y)
hw0 = float(np.median(heights))


def stretch(extra):
    """Kéo thân gỗ cao thêm `extra` px: giãn dải giữa ô panel (gỗ phẳng, không có gờ), phần trên tịnh tiến lên."""
    global im, alpha, H, bot, by
    if extra < 1:
        return
    pad = int(np.ceil(extra))
    src = np.array(im).astype(float)
    src[..., :3] *= src[..., 3:4] / 255
    out = np.zeros((H + pad, W, 4))
    yn = np.arange(H + pad, dtype=float)
    band = 0.3 * hw0
    for x in range(W):
        if bot[x] < 0:
            continue
        if lx <= x <= rx:
            y0, y1 = bot[x] - 0.65 * hw0, bot[x] - 0.35 * hw0
            n0, n1 = y0 + pad - extra, y1 + pad
            ys = np.where(yn < n0, yn - pad + extra,
                          np.where(yn < n1, y0 + (yn - n0) * band / (band + extra), yn - pad))
        else:
            ys = yn - pad + extra
        for c in range(4):
            out[:, x, c] = np.interp(ys, np.arange(H), src[:, x, c], left=0, right=0)
    a = out[..., 3:4]
    out[..., :3] = np.where(a > 0, out[..., :3] / np.maximum(a, 1) * 255, 0)
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA")
    H += pad
    bot = np.where(bot >= 0, bot + pad, -1)
    by += pad


def warp(v):
    """Một phép affine cho cả ảnh (co ngang f, co dọc v, cắt xiên k) để hai cạnh đáy cùng dốc 0,5 và bề ngang đúng số ô; không chia nửa nên cạnh đứng phía trước không gãy."""
    sl = abs(s_l)
    k = 0.5 * f - v * sl
    out_w = int(W * f) + 4
    out_h = int(H * v * 2) + 40
    bxo, byo = bx * f, out_h - 20
    # out -> src: x = bx + (xo - bxo)/f ; y = by + (yo - byo)/v - k·(xo - bxo)/(f·v)
    canvas = im.transform((out_w, out_h), Image.AFFINE,
                          (1 / f, 0, bx - bxo / f, -k / (f * v), 1 / v, by - byo / v + k * bxo / (f * v)),
                          Image.BICUBIC)
    return canvas, bxo, byo


# Co dọc vừa đủ để hai cạnh đáy dốc trung bình 0,5; phần dư mỗi bên bù bằng cắt xiên nhỏ.
f = 30 * (args.w + args.d) * S / (span_l + span_r)
v = f / (abs(s_l) + abs(s_r))
canvas, bxo, byo = warp(v)
want = (args.body + 15 * (args.w + args.d) + 1) * S
box = canvas.getbbox()
stretch((want - (box[3] - box[1])) / v)
canvas, bxo, byo = warp(v)

box = canvas.getbbox()
canvas = canvas.crop(box)
canvas.save(args.out)
w_px, h_px = canvas.size
print(json.dumps({
    "w": round(w_px / S, 2), "h": round(h_px / S, 2),
    "foot": round((bxo - box[0]) / w_px, 3), "body": round(h_px / S - 15 * (args.w + args.d) - 1, 1),
    "slopes_in": [round(s_l, 3), round(-s_r, 3)],
}))
