#!/usr/bin/env python3
"""art-raw/ -> public/art/: tách nền, cắt sát mép, xoay ngang, ép ô sàn về hình thoi 2:1."""
import math
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("cần Pillow: python3 -m pip install --user Pillow")

from wall_block import normalise, recolor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "art-raw")
OUT = os.path.join(ROOT, "public", "art")

# Phải khớp `src/world/iso.ts` và `BASE` trong `src/art/canvas.ts`.
TW, TH, BASE = 60, 30, 6

R = "-removebg-preview.png"


def raw(name):
    """Ảnh gốc + đã có alpha chưa (tẩy nền đen trên ảnh có alpha sẽ ăn mảng tối của vật)."""
    im = Image.open(os.path.join(SRC, name))
    has_alpha = "A" in im.getbands() and im.getchannel("A").getextrema()[0] < 250
    return im.convert("RGBA"), has_alpha


def cut_black(im, cut=14, soft=44):
    """Nền đen -> trong suốt bằng cách loang từ mép ảnh, để hốc tối giữa vật vẫn đục; `cut..soft` cho viền mềm."""
    w, h = im.size
    px = im.load()
    lum = [0.0] * (w * h)
    for y in range(h):
        row = y * w
        for x in range(w):
            r, g, b, _ = px[x, y]
            lum[row + x] = 0.299 * r + 0.587 * g + 0.114 * b

    bg = bytearray(w * h)
    stack = [(x, y) for x in range(w) for y in (0, h - 1)]
    stack += [(x, y) for y in range(h) for x in (0, w - 1)]
    while stack:
        x, y = stack.pop()
        i = y * w + x
        if bg[i] or lum[i] > soft:
            continue
        bg[i] = 1
        if x > 0: stack.append((x - 1, y))
        if x < w - 1: stack.append((x + 1, y))
        if y > 0: stack.append((x, y - 1))
        if y < h - 1: stack.append((x, y + 1))

    for y in range(h):
        row = y * w
        for x in range(w):
            i = row + x
            if not bg[i]:
                continue
            r, g, b, a = px[x, y]
            k = 0.0 if lum[i] <= cut else (lum[i] - cut) / (soft - cut)
            px[x, y] = (r, g, b, int(a * k))
    return im


def despeckle(im, floor=0.004):
    """Bỏ mẩu alpha vụn rời vật chính, vì chúng nới khung alpha mà `photo.ts` dùng để canh cỡ."""
    w, h = im.size
    A = list(im.getchannel("A").getdata())
    seen = bytearray(w * h)
    best = None
    for start in range(w * h):
        if seen[start] or A[start] <= 8:
            continue
        stack, blob = [start], []
        seen[start] = 1
        while stack:
            i = stack.pop()
            blob.append(i)
            x, y = i % w, i // w
            for j in ((i - 1) if x else -1, (i + 1) if x < w - 1 else -1,
                      (i - w) if y else -1, (i + w) if y < h - 1 else -1):
                if j >= 0 and not seen[j] and A[j] > 8:
                    seen[j] = 1
                    stack.append(j)
        if best is None or len(blob) > len(best):
            best = blob
    if best is None:
        return im
    keep = bytearray(w * h)
    for i in best:
        keep[i] = 255
    # Giữ cả viền mềm quanh mảng chính: nở mặt nạ ra 2 px rồi mới nhân vào alpha.
    mask = Image.frombytes("L", (w, h), bytes(keep)).filter(ImageFilter.MaxFilter(5))
    im.putalpha(Image.frombytes("L", (w, h), bytes(
        bytearray(min(a, m) for a, m in zip(A, mask.getdata())))))
    return im


# Ngưỡng `cut_black` riêng; nền dù là xám-đen (lum ~24) nên cần ngưỡng cao hơn.
BG_CUT = {
    "patio_umbrella.png": (30, 46),
}


def clean(name):
    im, has_alpha = raw(name)
    if has_alpha:
        return trim(despeckle(im))
    return trim(despeckle(cut_black(im, *BG_CUT.get(name, (14, 44)))))


def trim(im, pad=0):
    """Cắt sát mép alpha, ngưỡng rất thấp để giữ viền mềm."""
    box = im.getchannel("A").point(lambda v: 255 if v > 2 else 0).getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def fit(im, longest):
    """Co về cạnh dài `longest` px, không phóng to."""
    k = longest / max(im.size)
    if k >= 1:
        return im
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def tilt(im):
    """Góc nghiêng trục chính, tính bằng mô-men bậc hai của mảng alpha."""
    m = im.getchannel("A").resize((96, 96), Image.BILINEAR)
    w, h = m.size
    d = list(m.getdata())
    s = sum(d)
    if not s:
        return 0.0
    cx = sum(d[y * w + x] * x for y in range(h) for x in range(w)) / s
    cy = sum(d[y * w + x] * y for y in range(h) for x in range(w)) / s
    xx = yy = xy = 0.0
    for y in range(h):
        for x in range(w):
            v = d[y * w + x]
            if not v:
                continue
            dx, dy = x - cx, y - cy
            xx += v * dx * dx
            yy += v * dy * dy
            xy += v * dx * dy
    # Chia đôi vì công thức cho góc 2θ.
    return math.degrees(0.5 * math.atan2(2 * xy, xx - yy))


def level(im):
    a = tilt(im)
    if abs(a) < 0.7:
        return im
    return trim(im.rotate(a, Image.BICUBIC, expand=True))


def iso2(im):
    """Một phép affine cho cả ảnh (co dọc `v`, cắt xiên `k`) để hai cạnh đáy cùng dốc 0,5; không cắt đôi nên không có nếp gãy giữa vật."""
    import numpy as np
    a = np.array(im.getchannel("A")) > 128
    h, w = a.shape
    bot = np.array([np.where(a[:, x])[0].max() if a[:, x].any() else -1 for x in range(w)])
    cols = np.where(bot >= 0)[0]
    lo = int(np.argmax(bot))

    def slope(x0, x1):
        xs = np.arange(int(x0), int(x1))
        xs = xs[bot[xs] >= 0]
        return abs(float(np.polyfit(xs, bot[xs], 1)[0]))

    sl = slope(cols[0] + (lo - cols[0]) * 0.2, lo - (lo - cols[0]) * 0.2)
    sr = slope(lo + (cols[-1] - lo) * 0.2, cols[-1] - (cols[-1] - lo) * 0.2)
    v = 1 / (sl + sr)
    k = 0.5 - v * sl
    pad = 80
    src = Image.new("RGBA", (w, h + 2 * pad))
    src.paste(im, (0, pad))
    # y' = v·(y - yb) + k·(x - lo) + yb; ảnh đích -> ảnh nguồn là phép ngược.
    yb = float(bot[lo]) + pad
    f = yb - (-k * lo - 0) / v - 0
    out = src.transform(src.size, Image.AFFINE, (1, 0, 0, -k / v, 1 / v, yb - yb / v + k * lo / v), Image.BICUBIC)
    return trim(out)


def topface(im):
    """Bốn góc mặt trên phiến ô sàn: N đỉnh, W/E điểm trái/phải cao nhất, S = W + E − N."""
    w, h = im.size
    A = list(im.getchannel("A").getdata())
    rows = [[x for x in range(w) if A[y * w + x] > 128] for y in range(h)]
    ys = [y for y in range(h) if rows[y]]
    ny, nx = ys[0], sum(rows[ys[0]]) / len(rows[ys[0]])
    lx = min(min(r) for r in rows if r)
    rx = max(max(r) for r in rows if r)
    ly = min(y for y in ys if lx in rows[y])
    ry = min(y for y in ys if rx in rows[y])
    return (nx, ny), (lx, ly), (rx, ry), (lx + rx - nx, ly + ry - ny)


# Ô rộng hơn 2 px để hai ô chồng mép 1 px, tránh đường chỉ hở do làm tròn.
OVER = 2


def unwrap(im, side=128, inset=0.035):
    """Trải phẳng mặt trên thành ảnh vuông; `inset` né mép vát tối của phiến 3D."""
    corners = topface(im)
    mx = sum(c[0] for c in corners) / 4
    my = sum(c[1] for c in corners) / 4
    n, wv, e, s = [(x + (mx - x) * inset, y + (my - y) * inset) for x, y in corners]
    # QUAD nhận góc nguồn theo thứ tự trên-trái, dưới-trái, dưới-phải, trên-phải của đích.
    quad = (n[0], n[1], wv[0], wv[1], s[0], s[1], e[0], e[1])
    return im.transform((side, side), Image.QUAD, quad, Image.BICUBIC)


def diamond(flat, spin, ss=1):
    """Ô vuông -> hình thoi iso ở mật độ `ss` px mỗi px thiết kế; lát 3×3 trước để nội suy ở mép không pha ra viền đen."""
    flat = flat.rotate(-90 * spin, expand=True)
    n = flat.width
    big = Image.new("RGBA", (n * 3, n * 3))
    for i in range(3):
        for j in range(3):
            big.paste(flat, (i * n, j * n))

    W, H = (TW + OVER) * ss, (TH + OVER) * ss
    # Ma trận ngược (đích -> nguồn), đọc từ ô giữa của tấm 3×3.
    a, b, c = n / W, n / H, n / 2
    d, e, f = -n / W, n / H, n * 3 / 2
    warped = big.transform((W, H), Image.AFFINE, (a, b, c, d, e, f), Image.BICUBIC)

    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon([(W / 2, 0), (W, H / 2), (W / 2, H), (0, H / 2)], fill=255)
    warped.putalpha(mask)
    return warped


def average(im):
    px = im.load()
    n = r = g = b = 0
    for y in range(0, im.height, 2):
        for x in range(0, im.width, 2):
            pr, pg, pb, pa = px[x, y]
            if pa > 200:
                r, g, b, n = r + pr, g + pg, b + pb, n + 1
    return (r // n, g // n, b // n) if n else (128, 128, 128)


def floor_tile(flat, spin, ss=1):
    """Texture ô sàn đúng cỡ `bakeGround()` giả định: (TW + 2) × (TH + BASE + 2), nhân `ss`."""
    top = diamond(flat, spin, ss)
    W, H = (TW + 2) * ss, (TH + BASE + 2) * ss
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cx, cy = W // 2, H - (1 + BASE + TH // 2) * ss
    tw, th, base = TW * ss, TH * ss, BASE * ss

    r, g, b = average(top)
    d = ImageDraw.Draw(out)
    for side, k in (("l", 0.68), ("r", 0.84)):     # trái khuất nắng, phải bắt nắng
        x = cx - tw / 2 if side == "l" else cx
        d.polygon([(x, cy), (x + tw / 2, cy + th / 2),
                   (x + tw / 2, cy + th / 2 + base), (x, cy + base)],
                  fill=(int(r * k), int(g * k), int(b * k), 255))
    out.alpha_composite(top, (cx - top.width // 2, cy - top.height // 2))
    return out


FLOOR_SS = 4

# Ranh khe vữa của ảnh gạch men 1254 px; 4 ô giữa, mỗi ô cắt từ giữa khe này tới giữa khe kia.
SHOP_GRID = (313, 627, 940)
SHOP_SRC = "_duyet/gach_men/final.png"
SHOP_SPINS = (0, 2, 0, 2)


def whiten(im, k=0.65):
    """Albedo trắng hơn: 1 − (1 − a)·k."""
    import numpy as np
    a = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0
    a = 1 - (1 - a) * k
    return Image.fromarray((a * 255 + 0.5).astype(np.uint8)).convert("RGBA")


def shop_cells():
    im = Image.open(os.path.join(SRC, SHOP_SRC)).convert("RGB")
    g = SHOP_GRID
    return [whiten(im.crop((g[c], g[r], g[c + 1], g[r + 1])).resize((320, 320), Image.LANCZOS))
            for r, c in ((0, 0), (0, 1), (1, 0), (1, 1))]


CANOPIES = {"leaf_a": "_duyet/tan_la_v2/A-treo.png", "leaf_c": "_duyet/tan_la_v2/C-la-to.png", "leaf_b": "_duyet/tan_la_v2/B-giua.png", "leaf_eave": "_duyet/tan_la_v2/D3-bong-do-vat.png"}


def canopy(src):
    """Ảnh bóng xám cạnh dài 1024 hoặc 1536 (ảnh rộng), giữ nguyên giá trị xám."""
    im = Image.open(os.path.join(SRC, src)).convert("L")
    long = 1536 if im.width > im.height * 1.5 else 1024
    k = long / max(im.size)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).convert("RGBA")


WALK_SRC = "_duyet/gach_do/chatgpt-1.png"
# Biến thể sàn vỉa hè: ảnh gốc, xoay 180°, lật ngang, lật dọc (không xoay 90° vì gạch xếp ngang).
WALK_VARIANTS = (None, Image.ROTATE_180, Image.FLIP_LEFT_RIGHT, Image.FLIP_TOP_BOTTOM)


def walk_cells():
    im = Image.open(os.path.join(SRC, WALK_SRC)).convert("RGBA").resize((480, 480), Image.LANCZOS)
    return [im if m is None else im.transpose(m) for m in WALK_VARIANTS]


# Chỉ xoay 0/180° vì xoay 90° làm gạch lát ra bàn cờ.
FLOORS = [
    ("f_road", "asphalt_ground_tile" + R, (0, 2, 0, 2)),
]
# Biến thể 1 của mặt đường là ô có vạch sơn (quy ước của `tiles.ts`).
ROAD_PAINT = "asphalt_road_with_lane_marking" + R
ROAD_PAINT_SPIN = 1
ROAD_INSET = 0.10

# Đồ có chân, không ép bằng `ep-iso.py` được: co dọc cho cạnh đáy dốc 0,5.
ISO_FIX: set[str] = {"prop_crate"}

# Khối tường 1 ô: chuẩn hoá về đúng 60 × 86 px và cắt gờ vát để các ô liền nhau; không qua `clean`/`fit` vì trục khối phải nằm giữa khung.
BLOCKS = {"prop_wall_plain", "prop_wall_meter", "prop_wall_window", "prop_wall_poster", "prop_door",
          "prop_shop_shutter_half", "prop_shop_window_clothes", "prop_shop_shutter_closed", "prop_shop_window_ac"}
RECOLOR = {"prop_shop_window_clothes"}

# Cạnh dài ≥ 3,2 × cỡ thiết kế (màn 27" QHD); `photo.ts` thu nhỏ bằng nhiều nhịp chia đôi.
PROPS = [
    ("prop_oven", "lo_nuong-Photoroom.png", 640),
    ("prop_shelf", "tu_kinh-Photoroom.png", 768),
    ("prop_tea", "binh_tra-Photoroom.png", 640),
    ("prop_sink", "bon_rua-Photoroom.png", 640),
    ("prop_stool", "ghe_do-Photoroom.png", 640),
    ("prop_table", "ban_nhua-Photoroom.png", 640),
    ("prop_order", "order_counter-Photoroom.png", 384),
    ("prop_bench", "topping_bench-Photoroom.png", 448),
    ("prop_table_long", "ban_2o-Photoroom.png", 448),
    ("prop_bike", "xe_may-Photoroom.png", 640),
    ("prop_scooter", "xe_vespa-Photoroom.png", 640),
    ("prop_pothos", "chau_cay-Photoroom.png", 640),
    ("prop_bin", "thung_rac-Photoroom.png", 640),
    ("prop_sign", "bang_a-Photoroom.png", 640),
    ("prop_extinguisher", "binh_chua_chay-Photoroom.png", 640),
    # Dù cao nhất bộ (110 px) nên cần dư pixel hơn.
    ("prop_umbrella", "du-Photoroom.png", 768),
    ("prop_fridge", "tu_lanh-Photoroom.png", 640),
    ("prop_cooler", "thung_xop-Photoroom.png", 640),
    ("prop_crate", "ket_nuoc_ngot-Photoroom.png", 640),
    ("prop_e-oven", "lo_dien-Photoroom.png", 640),
    ("prop_wall_plain", "wall_plain-Photoroom.png", 768),
    ("prop_wall_meter", "wall_meter-Photoroom.png", 768),
    ("prop_wall_window", "wall_window-Photoroom.png", 768),
    ("prop_wall_poster", "wall_poster-Photoroom.png", 768),
    ("prop_door", "door-Photoroom.png", 768),
    ("prop_shop_shutter_half", "shop_shutter_half-Photoroom.png", 768),
    ("prop_shop_window_clothes", "shop_window_clothes-Photoroom.png", 768),
    ("prop_shop_shutter_closed", "shop_shutter_closed-Photoroom.png", 768),
    ("prop_shop_window_ac", "shop_window_ac-Photoroom.png", 768),
]

# Cột 3: có xoay về ngang không.
HELD = [
    ("held_loaf_cold", "bread_dough" + R, True),
    ("held_loaf_baked", "o_nguoi-Photoroom.png", True),
    ("held_loaf_hot", "baked_baguette" + R, True),
    ("held_loaf_burnt", "burnt_baguette" + R, True),
    ("held_loaf_filled", "banh_mi_on_paper_tray" + R, True),
    ("held_tea", "iced_tea_glass" + R, False),
]

# Thiếu `dualeo` và `tuongot`: hai món này vẽ bằng code trong `photo.ts`.
INGREDIENTS = [
    ("ing_pate", "pate_spread" + R),
    ("ing_thit", "ham_slice" + R),
    ("ing_chalua", "pork_roll_slice" + R),
    ("ing_xiumai", "meatball_in_tomato_sauce" + R),
    ("ing_opla", "fried_egg" + R),
    ("ing_dochua", "pickled_carrot_and_daikon" + R),
    ("ing_hanhngo", "cilantro_and_scallion" + R),
    ("ing_ot", "sliced_red_chili" + R.replace(".png", " (2).png")),
]

# Ảnh ô kho, khác ảnh nhân đặt lên bánh.
STOCK = [
    ("kho_ot", "ot_trai-Photoroom.png"),
    ("kho_tuongot", "chai_tuong_ot-Photoroom.png"),
]


# Vật không đứng trên lưới ô; phải cắt sát mép vì `photo.ts` suy bề cao từ tỉ lệ ảnh.
SMALL = [
    ("fly", "fly.png", 192),
    ("shopfront", "mai_bang-Photoroom.png", 1360),
    ("cutting_board", "cutting_board-Photoroom.png", 384),
    ("ro_banh_mi", "ro-banh-mi.png", 384),
]


def open_loaf():
    """Tách ổ rạch đôi ở rãnh trong suốt thành `loaf_lid` + `loaf_trough`; không qua `clean()` vì despeckle sẽ xoá một nửa."""
    im, has_alpha = raw("sliced_open_baguette" + R)
    im = trim(im if has_alpha else cut_black(im))

    # Rãnh = dải cột rộng nhất có alpha gần 0.
    A = im.getchannel("A")
    cols = [sum(A.crop((x, 0, x + 1, im.height)).getdata()) for x in range(im.width)]
    gap, run = None, None
    for x in range(im.width + 1):
        if x < im.width and cols[x] <= 255 * 3:
            run = [x, x] if run is None else [run[0], x]
        elif run is not None:
            if gap is None or run[1] - run[0] > gap[1] - gap[0]:
                gap = run
            run = None
    if gap is None:
        sys.exit("sliced_open_baguette: không thấy rãnh giữa hai nửa ổ bánh")
    cut = (gap[0] + gap[1] + 1) // 2

    def half(x0, x1):
        piece = despeckle(im.crop((x0, 0, x1, im.height)).copy())
        return fit(trim(piece.transpose(Image.ROTATE_270)), 448)

    return half(0, cut), half(cut, im.width)


def phone_frame():
    """phone.png: cắt sát thân máy, màn xanh -> trong suốt. Vùng màn đo ở PHONE_SCREEN, khớp `ui/phone/phoneStyle.ts`."""
    im = Image.open(os.path.join(SRC, "phone.png")).convert("RGBA")
    im = im.crop((529, 79, 967, 914))
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            green = g - max(r, b)
            if a and green > 30:
                k = max(0.0, min(1.0, 1 - (green - 30) / 110))
                px[x, y] = (r, g if k > 0.5 else min(g, max(r, b)), b, int(a * k))
    return im


def lamp_pair(longest=256):
    """Đèn tường bật và tắt cùng khung: tắt = bóng thuỷ tinh sẫm, mất lõi sáng."""
    on = Image.open(os.path.join(SRC, "_duyet", "den_tuong", "final-Photoroom.png")).convert("RGBA")
    on = on.resize((round(on.width * longest / on.height), longest), Image.LANCZOS)
    px = on.load()
    off = on.copy()
    q = off.load()
    for y in range(int(on.height * 0.7), on.height):
        for x in range(on.width):
            r, g, b, a = px[x, y]
            if a == 0 or not (r - b > 40 or min(r, g, b) > 200):
                continue
            lum = (r + g + b) / 765
            k = 0.16 + 0.22 * lum
            q[x, y] = (int(150 * k * 1.8), int(88 * k * 1.8), int(34 * k * 1.8), a)
    return on, off


def main():
    """Không tham số thì rửa cả bộ, có tên thì chỉ rửa những tấm đó."""
    os.makedirs(OUT, exist_ok=True)
    made = 0
    only = set(sys.argv[1:])

    def want(key):
        """Khớp theo tiền tố: `f_walk` gọi luôn `f_walk0..3`."""
        return not only or any(o == key or key.startswith(o) for o in only)

    def save(name, im):
        nonlocal made
        im.save(os.path.join(OUT, name + ".png"))
        made += 1
        print(f"  {name}.png  {im.width}×{im.height}")

    if want("phone"):
        print("điện thoại")
        save("phone", phone_frame())

    if want("lamp"):
        print("đèn tường")
        on, off = lamp_pair()
        save("lamp_on", on)
        save("lamp_off", off)

    for key, src in CANOPIES.items():
        if want(key):
            save(key, canopy(src))

    if any(want(f"f_walk{i}") for i in range(4)):
        print("sàn vỉa hè")
        for i, cell in enumerate(walk_cells()):
            if want(f"f_walk{i}"):
                save(f"f_walk{i}", floor_tile(cell, 0, FLOOR_SS))

    if any(want(f"f_shop{i}") for i in range(4)):
        print("sàn men")
        for i, cell in enumerate(shop_cells()):
            if want(f"f_shop{i}"):
                save(f"f_shop{i}", floor_tile(cell, SHOP_SPINS[i], FLOOR_SS))

    if any(want(f"{k}{i}") for k, _, _ in FLOORS for i in range(4)):
        print("ô sàn")
    for key, src, spins in FLOORS:
        if not any(want(f"{key}{i}") for i in range(len(spins))):
            continue
        inset = ROAD_INSET if key == "f_road" else 0.035
        flat = unwrap(raw(src)[0], inset=inset)
        paint = unwrap(raw(ROAD_PAINT)[0], inset=inset) if key == "f_road" else None
        for i, spin in enumerate(spins):
            if not want(f"{key}{i}"):
                continue
            if i == 1 and paint:
                save(f"{key}{i}", floor_tile(paint, ROAD_PAINT_SPIN, FLOOR_SS))
            else:
                save(f"{key}{i}", floor_tile(flat, spin, FLOOR_SS))

    if any(want(k) for k, _, _ in PROPS):
        print("đạo cụ")
    for key, src, longest in PROPS:
        if want(key) and key in BLOCKS:
            im = normalise(Image.open(os.path.join(SRC, src)))
            if key in RECOLOR:
                im = recolor(im, normalise(Image.open(os.path.join(SRC, "wall_plain-Photoroom.png"))))
            save(key, im)
        elif want(key):
            im = clean(src)
            save(key, fit(iso2(im) if key in ISO_FIX else im, longest))

    if any(want(k) for k, _, _ in HELD):
        print("món trên tay")
    for key, src, flat in HELD:
        if not want(key):
            continue
        im = clean(src)
        save(key, fit(level(im) if flat else im, 288))

    if any(want(k) for k, _ in INGREDIENTS):
        print("nhân")
    for key, src in INGREDIENTS:
        if want(key):
            save(key, fit(clean(src), 224))

    if any(want(k) for k, _ in STOCK):
        print("ô kho")
    for key, src in STOCK:
        if want(key):
            save(key, fit(clean(src), 224))

    if any(want(k) for k, _, _ in SMALL):
        print("vật nhỏ")
    for key, src, longest in SMALL:
        if want(key):
            save(key, fit(clean(src), longest))

    if want("loaf_lid") or want("loaf_trough"):
        print("ổ bánh rạch đôi")
        lid, trough = open_loaf()
        if want("loaf_lid"):
            save("loaf_lid", lid)
        if want("loaf_trough"):
            save("loaf_trough", trough)

    if only and not made:
        sys.exit(f"không có tấm nào tên {', '.join(sorted(only))}")
    print(f"\nxong — {made} file trong public/art/")


if __name__ == "__main__":
    main()
