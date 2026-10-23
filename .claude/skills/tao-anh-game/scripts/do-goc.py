#!/usr/bin/env python3
"""Đo độ dẹt elip của vật tròn dẹt trên nền trắng: bán trục dọc / bán trục ngang phải ≈ 0.5."""
import sys

from PIL import Image

TARGET, TOL = 0.5, 0.06


def main():
    im = Image.open(sys.argv[1]).convert("L")
    w, h = im.size
    px = im.load()
    ink = [[px[x, y] < 235 for x in range(w)] for y in range(h)]
    xs = [x for x in range(w) if any(ink[y][x] for y in range(h))]
    x0, x1 = xs[0], xs[-1]
    ax = (x1 - x0) / 2

    # Cột cách mép dx px dài thêm 2·ay·√(2dx/ax) so với thân: hồi quy theo √dx lấy ay và bề cao thân.
    pts = []
    for dx in range(3, 41, 2):
        col = [y for y in range(h) if ink[y][x0 + dx]]
        pts.append((dx ** 0.5, col[-1] - col[0]))
    n = len(pts)
    mx = sum(p[0] for p in pts) / n
    my = sum(p[1] for p in pts) / n
    slope = sum((p[0] - mx) * (p[1] - my) for p in pts) / sum((p[0] - mx) ** 2 for p in pts)
    thick = my - slope * mx
    ay = slope * (ax / 2) ** 0.5 / 2
    ratio = ay / ax
    print(f"rộng {2 * ax:.0f}px, thân cao {thick:.0f}px ({thick / (2 * ax):.2f} đường kính), elip cao/rộng {ratio:.2f} (cần {TARGET})")
    print("ĐẠT" if abs(ratio - TARGET) <= TOL else "LỆCH")


if __name__ == "__main__":
    main()
