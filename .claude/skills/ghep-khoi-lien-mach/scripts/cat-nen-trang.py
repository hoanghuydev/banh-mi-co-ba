#!/usr/bin/env python3
"""Cắt nền trắng thuần của ảnh gen (flood fill từ bốn góc) ra PNG có alpha: python3 cat-nen-trang.py vao.png ra.png.
Đủ dùng cho khối tường vì `wall_block.normalise` tự lấp lại bên trong khối; đồ có chi tiết mảnh vẫn nên qua Photoroom."""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
work = im.copy()
for seed in ((0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)):
    ImageDraw.floodfill(work, seed, (255, 0, 255), thresh=14)
w, o = np.array(work).astype(int), np.array(im).astype(int)
bg = (w[..., 0] == 255) & (w[..., 1] == 0) & (w[..., 2] == 255) & ~((o[..., 0] == 255) & (o[..., 1] == 0))
im.putalpha(Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)))
im.save(dst)
print(dst, im.getchannel("A").getbbox())
