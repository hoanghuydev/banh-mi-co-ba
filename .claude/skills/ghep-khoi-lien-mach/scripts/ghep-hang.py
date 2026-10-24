#!/usr/bin/env python3
"""Ghép hàng thử các ô tường ở độ phân giải gốc (6,4 px/px thiết kế), kèm ảnh phóng từng mối nối.
   python3 ghep-hang.py ra_thu_muc plain rent meter ...   (tên sau `prop_wall_`; `door`, `shop_*` ghi đủ tên có tiền tố `prop_`)
Chạy ở thư mục gốc dự án. Ra `hang.png` (nhìn tổng thể) và `moi-noi.png` (các mối nối, mỗi ô phóng 2×)."""
import os
import sys

from PIL import Image

out, names = sys.argv[1], sys.argv[2:]
os.makedirs(out, exist_ok=True)


def path(n):
    n = n if n.startswith("prop_") else f"prop_wall_{n}"
    return f"public/art/{n}.webp"


ims = [Image.open(path(n)).convert("RGBA") for n in names]
w, h = ims[0].size
step = (192, 96)                                   # 30 × 15 px thiết kế × 6,4
sheet = Image.new("RGBA", (w + step[0] * (len(ims) - 1) + 40, h + step[1] * (len(ims) - 1) + 40), (120, 160, 170, 255))
for i, im in enumerate(ims):
    sheet.alpha_composite(im, (20 + i * step[0], 20 + i * step[1]))
sheet = sheet.convert("RGB")
sheet.save(f"{out}/hang.png")
crops = []
for i in range(len(ims) - 1):
    x, y0 = 20 + i * step[0] + 250, 20 + i * step[1]
    crops.append(sheet.crop((x - 100, y0 + 100, x + 100, y0 + 640)).resize((400, 1080), Image.LANCZOS))
strip = Image.new("RGB", (410 * len(crops), 1080), (255, 0, 255))
for i, c in enumerate(crops):
    strip.paste(c, (i * 410, 0))
strip.save(f"{out}/moi-noi.png")
print(f"{out}/hang.png, {out}/moi-noi.png")
