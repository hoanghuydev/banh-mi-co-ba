"""Ảnh ChatGPT -> frame rời cho tools/pack-atlas.py.

  python3 .claude/skills/tao-npc-anh/scripts/ghep-npc.py art-raw/_duyet/<ten> <ten-atlas> [--giay-trang]

Đọc <thư mục>/8huong.png (2 hàng × 4: s se e ne / n nw w sw), <thư mục>/walk/<h>.png (4 pha bước, mẫu frame 1,3,5,7)
và <thư mục>/walk-chan/<h>.png (4 pha chuyển tiếp, mẫu frame 0,2,4,6); ghi art-raw/render/<ten-atlas>/idle/<h>_00.png
và walk/<h>_00..07.png xen kẽ chẵn = chuyển tiếp, lẻ = bước.
`--giay-trang`: NPC đi giày trắng — giữ lòng giày khỏi bị coi là nền (Minh Quân).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[4]
DIRS = ["s", "se", "e", "ne", "n", "nw", "w", "sw"]
CANVAS = (360, 520)  # ô chung, chân đặt tại FOOT_Y
FOOT_Y = 500
WHITE = 236
SHOE_WHITE = 251  # giày trắng: chỉ điểm sáng hơn mức này mới là nền nối ra mép
FEET = 0.86       # dưới mốc này (theo chiều cao hình) là vùng bàn chân
SHOE_GAP = 15     # px: khuyết lòng giày lấp tối đa


def height_at(body, cy, cx):
    """Vị trí (0 = đỉnh, 1 = đáy) của điểm (cy, cx) trong hình chứa nó: đo theo dải hàng liền có thân quanh cột cx."""
    rows = body[:, max(0, cx - 60): cx + 60].any(axis=1)
    top = bot = cy
    while top > 0 and rows[top - 1]:
        top -= 1
    while bot < len(rows) - 1 and rows[bot + 1]:
        bot += 1
    return (cy - top) / (bot - top) if bot > top else 0.0


def thin(comp):
    core = np.asarray(Image.fromarray((comp * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))) > 0
    return core.sum() < 0.2 * comp.sum()


def close_feet(alpha, bg):
    """Lấp khuyết lòng giày trắng: đóng hình ở 12% dưới mỗi hàng nhân vật."""
    rows = (alpha > 0).any(axis=1)
    y = 0
    while y < len(rows):
        if not rows[y]:
            y += 1
            continue
        t = y
        while y < len(rows) and rows[y]:
            y += 1
        if y - t < 100:
            continue
        z0 = y - int((y - t) * 0.12)
        band = Image.fromarray(alpha[z0:y])
        closed = np.asarray(band.filter(ImageFilter.MaxFilter(SHOE_GAP)).filter(ImageFilter.MinFilter(SHOE_GAP)))
        alpha[z0:y] = np.maximum(alpha[z0:y], closed)
        bg[z0:y] &= closed == 0


def cut_alpha(im, white_shoes=False):
    """Nền = vùng gần trắng nối với mép ảnh, cộng các lỗ trắng kín to (khe tay–thân)."""
    rgb = np.asarray(im.convert("RGB")).astype(np.int16)
    mn = rgb.min(axis=2)
    m = Image.fromarray(np.where(mn >= (SHOE_WHITE if white_shoes else WHITE), 255, 0).astype(np.uint8)).copy()
    w, h = m.size
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if m.getpixel(xy) == 255:
            ImageDraw.floodfill(m, xy, 128)
    a = np.asarray(m)
    bg = a == 128
    # lỗ kín (khe tay–thân, khe chân): dưới phần đầu xoá cả lỗ nhỏ; trong phần đầu chỉ lỗ to để giữ lòng trắng mắt
    body = ~bg
    hole = Image.fromarray(np.where((mn >= WHITE) & ~bg, 255, 0).astype(np.uint8)).copy()
    B = 2
    hb = np.asarray(hole)[: h // B * B, : w // B * B].reshape(h // B, B, w // B, B).min(axis=(1, 3)) == 255
    # hạt: ô trắng 2×2, cộng điểm trắng tinh để bắt cả vệt khe rộng 1–2 px
    seeds = [(int(by * B), int(bx * B)) for by, bx in zip(*np.nonzero(hb))]
    seeds += [(int(y), int(x)) for y, x in zip(*np.nonzero((np.asarray(hole) == 255) & (mn >= 249)))]
    for y, x in seeds:
        if hole.getpixel((x, y)) != 255:
            continue
        ImageDraw.floodfill(hole, (x, y), 128)
        comp = np.asarray(hole) == 128
        n = comp.sum()
        ys, xs = np.nonzero(comp)
        at = height_at(body, int(ys.mean()), int(xs.mean()))
        if white_shoes and at > FEET:
            pass
        elif n > 400 and mn[comp].mean() >= 250:
            bg |= comp
        # khe nền sáng ≥247; mảng sáng của áo trắng/xanh nhạt (Ngọc Trâm) chỉ 236–246.6
        elif n > 8 and mn[comp].mean() >= 247 and at > 0.38:
            bg |= comp
        # vệt khe mảnh: pha viền tối nên trung bình dưới 247, nhưng lõi là nền thật (≥253, 90% điểm ≥251) và co 1 px là gần biến mất;
        # vệt sáng trên áo trắng chỉ 90% ≥ 247–250
        elif (n > 4 and at > 0.38 and mn[comp].max() >= 253 and np.percentile(mn[comp], 90) >= 251
              and thin(comp)):
            bg |= comp
        ImageDraw.floodfill(hole, (x, y), 64)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    if white_shoes:
        close_feet(alpha, bg)
    # viền mềm: pixel sát nền lấy alpha theo độ "không trắng"
    near = np.asarray(Image.fromarray(alpha).filter(ImageFilter.MinFilter(5))) < 255
    soft = np.clip((255 - mn) * 255 / (255 - 200), 0, 255).astype(np.uint8)
    alpha = np.where(near & ~bg, np.minimum(255, soft), alpha)
    # gỡ màu trắng lẫn ở viền
    af = alpha[..., None] / 255.0
    col = np.where(af > 0.05, (rgb - (1 - af) * 255) / np.maximum(af, 0.05), rgb)
    out = np.dstack([np.clip(col, 0, 255).astype(np.uint8), alpha])
    return Image.fromarray(out, "RGBA")


def split(rgba, n):
    """Tách n nhân vật theo cột trống."""
    a = np.asarray(rgba)[..., 3] > 40
    cols = a.any(axis=0)
    runs, x = [], 0
    while x < len(cols):
        if cols[x]:
            s = x
            while x < len(cols) and cols[x]:
                x += 1
            runs.append((s, x))
        x += 1
    runs = sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:n]
    if len(runs) != n:
        raise SystemExit(f"tach duoc {len(runs)} khung, can {n}")
    out = []
    for s, e in sorted(runs):
        c = rgba.crop((s, 0, e, rgba.height))
        out.append(c.crop(c.getbbox()))
    return out


def stats(im):
    a = np.asarray(im).astype(float)
    m = a[..., 3] > 250
    return a[m][:, :3].mean(axis=0), a[m][:, :3].std(axis=0)


def head_w(im):
    """Bề ngang đầu (15% trên cùng): thước đo cỡ không đổi theo dáng chân."""
    a = np.asarray(im)[..., 3] > 128
    top = a[: max(1, int(im.height * 0.15))]
    return np.median(top.sum(axis=1)[-5:])


def shift(im, off):
    a = np.asarray(im).astype(float)
    a[..., :3] += off
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


def place(im, height):
    """Co theo chiều cao, căn giữa theo khối thân, đặt chân lên FOOT_Y."""
    im = im.resize((round(im.width * height / im.height), height), Image.LANCZOS)
    a = np.asarray(im)[..., 3].astype(float)
    cx = (a.sum(axis=0) * np.arange(im.width)).sum() / a.sum()
    cv = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    cv.alpha_composite(im, (round(CANVAS[0] / 2 - cx), FOOT_Y - height))
    return cv


def main():
    shoes = "--giay-trang" in sys.argv
    args = [x for x in sys.argv[1:] if x != "--giay-trang"]
    if len(args) != 2:
        sys.exit(__doc__)
    src, out = Path(args[0]), ROOT / "art-raw" / "render" / args[1]
    sheet = cut_alpha(Image.open(src / "8huong.png"), shoes)
    w, h = sheet.size
    idle = {}
    for i, d in enumerate(DIRS):
        cell = sheet.crop((i % 4 * w // 4, i // 4 * h // 2, (i % 4 + 1) * w // 4, (i // 4 + 1) * h // 2))
        idle[d] = cell.crop(cell.getbbox())
    scale = 440 / max(im.height for im in idle.values())
    for d in DIRS:
        hi = round(idle[d].height * scale)
        p = out / "idle" / f"{d}_00.png"
        p.parent.mkdir(parents=True, exist_ok=True)
        place(idle[d], hi).save(p)
        steps = split(cut_alpha(Image.open(src / "walk" / f"{d}.png"), shoes), 4)
        between = split(cut_alpha(Image.open(src / "walk-chan" / f"{d}.png"), shoes), 4)
        # đầu và chiều cao cho hai tỉ lệ lệch nhau (ChatGPT vẽ thân hơi khác giữa các lượt): lấy trung bình nhân
        by_head = head_w(idle[d]) / np.median([head_w(f) for f in steps])
        by_height = 0.98 * idle[d].height / np.median([f.height for f in steps])
        k_steps = (by_head * by_height) ** 0.5
        # pha chuyển tiếp nhún cao hơn pha bước chừng 2%; đầu và chiều cao lệch nhau nên lấy trung bình nhân
        k_head = k_steps * np.median([head_w(f) for f in steps]) / np.median([head_w(f) for f in between])
        k_tall = k_steps * 1.02 * np.median([f.height for f in steps]) / np.median([f.height for f in between])
        k_between = (k_head * k_tall) ** 0.5
        heights = []
        for j in range(8):
            strip, k = (between, k_between) if j % 2 == 0 else (steps, k_steps)
            # một độ bù chung cả dải: kéo màu về ảnh đứng im mà frame trong dải vẫn đều nhau
            off = stats(idle[d])[0] - np.mean([stats(f)[0] for f in strip], axis=0)
            f = strip[j // 2]
            hj = round(f.height * k * scale)
            q = out / "walk" / f"{d}_{j:02d}.png"
            q.parent.mkdir(parents=True, exist_ok=True)
            place(shift(f, off), hj).save(q)
            heights.append(hj)
        print(d, "idle", hi, "walk", heights)

if __name__ == "__main__":
    main()
