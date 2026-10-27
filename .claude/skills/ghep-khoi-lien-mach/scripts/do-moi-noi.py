#!/usr/bin/env python3
"""Đo độ sáng ngang qua mối nối trên ảnh chụp game: python3 do-moi-noi.py anh.png x [y0 y1] [nua_rong].
Đạt khi biên độ (max − min) trong dải ≤ 3: vạch thật là bướu +5 trở lên rộng 8–10 px ở độ phóng 2,6×, vữa tự nhiên dao động chừng 2."""
import sys

import numpy as np
from PIL import Image

img, x = sys.argv[1], int(sys.argv[2])
y0, y1 = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (560, 640)
half = int(sys.argv[5]) if len(sys.argv) > 5 else 14
prof = np.array(Image.open(img).convert("L")).astype(float)[y0:y1, x - half:x + half + 1].mean(0)
print(" ".join(f"{v:.0f}" for v in prof))
span = prof.max() - prof.min()
print(f"biên độ {span:.1f}", "ĐẠT" if span <= 3 else "CÒN VẠCH")
