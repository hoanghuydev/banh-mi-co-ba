"""Tô giày trắng lọt từ mẫu dáng thành nâu sẫm, trên dải 4 ô nền trắng (trước khi ghép).

  python3 .claude/skills/tao-npc-anh/scripts/to-giay.py <vào.png> <ra.png> <ô 1–4> [ô …]

Chỉ tô vùng chân (30% dưới) của ô được chỉ: điểm sáng ít màu (kem hoặc xám), không phải nền trắng tinh.
Da (ngả đỏ mạnh) và quần tối không bị đụng. Soi lại bằng mắt sau khi tô.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

BROWN = np.array([92, 58, 38])

if len(sys.argv) < 4:
    sys.exit(__doc__)
im = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(float)
H, W, _ = im.shape
mn, mx = im.min(2), im.max(2)
rb = im[..., 0] - im[..., 2]
out = im.copy()
for c in (int(x) - 1 for x in sys.argv[3:]):
    x0, x1 = c * W // 4, (c + 1) * W // 4
    ys = np.nonzero((mn[:, x0:x1] < 240).any(1))[0]
    t, b = ys[0], ys[-1]
    zone = np.zeros(mn.shape, bool)
    zone[t + int((b - t) * 0.70): b + 1, x0:x1] = True
    shoe = zone & (mn > 110) & (mn < 248) & (rb < 55) & (mx - mn < 45)
    # bỏ chấm lẻ ở viền quần/nền
    core = Image.fromarray((shoe * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(9))
    shoe &= np.asarray(core) > 0
    out[shoe] = np.clip(BROWN[None] * (im[shoe].mean(1) / 220.0)[:, None], 0, 255)
    print(f"ô {c + 1}: tô {int(shoe.sum())} px")
Image.fromarray(out.astype(np.uint8)).save(sys.argv[2])
