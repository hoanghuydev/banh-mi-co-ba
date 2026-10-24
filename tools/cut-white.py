#!/usr/bin/env python3
"""Xoá nền trắng thuần của ảnh gen: python3 tools/cut-white.py vao.png ra.png [--tol 6]. Loang từ mép, viền mềm, bỏ nhiễm trắng."""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter


def flood_background(white: np.ndarray) -> np.ndarray:
    h, w = white.shape
    seen = np.zeros_like(white)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    return seen


def fill_colors(rgb: np.ndarray, known: np.ndarray, rounds: int = 8) -> np.ndarray:
    """Phủ màu vật ra ngoài vùng đục để viền mềm không nhiễm trắng."""
    out = rgb.copy()
    k = known.copy()
    for _ in range(rounds):
        kf = k.astype(np.float32)
        pad = np.pad(out * kf[..., None], ((1, 1), (1, 1), (0, 0)))
        padk = np.pad(kf, 1)
        s = sum(pad[1 + dy:pad.shape[0] - 1 + dy, 1 + dx:pad.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        n = sum(padk[1 + dy:padk.shape[0] - 1 + dy, 1 + dx:padk.shape[1] - 1 + dx] for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        new = (n > 0) & ~k
        out[new] = s[new] / n[new][:, None]
        k |= new
    return out


def cut(src: str, dst: str, tol: int = 6):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    white = a.min(axis=2) >= 255 - tol
    bg = flood_background(white)
    mask = Image.fromarray(((~bg) * 255).astype(np.uint8))
    soft = np.asarray(mask.filter(ImageFilter.GaussianBlur(0.8)), dtype=np.float32) / 255.0
    inner = np.asarray(mask.filter(ImageFilter.MinFilter(5))) > 200
    rgb = fill_colors(a, inner)
    rgb = np.where((soft >= 0.999)[..., None], a, rgb)
    out = np.dstack([np.clip(rgb, 0, 255), soft * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(dst)


if __name__ == "__main__":
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    tol = int(sys.argv[sys.argv.index("--tol") + 1]) if "--tol" in sys.argv else 6
    if "--tol" in sys.argv:
        args = [x for x in args if x != str(tol)]
    if len(args) != 2:
        sys.exit("dùng: cut-white.py vao.png ra.png [--tol N]")
    cut(args[0], args[1], tol)
