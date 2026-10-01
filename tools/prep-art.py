#!/usr/bin/env python3
"""
art-raw/  ->  public/art/

Xưởng rửa ảnh, chạy MỘT LẦN mỗi khi artist gửi file mới:

    python3 tools/prep-art.py

Ảnh gốc nằm NGOÀI `public/` là cố ý: `public/` được vite chép nguyên si vào `dist/`,
mà bộ ảnh gốc nặng ~10 MB — người chơi tải về làm gì bộ ảnh chưa rửa.

Ảnh artist gửi là render 3D nền trong suốt (hoặc nền đen), cỡ vài trăm px, và
một số nằm XÉO. Game thì cần: nền trong thật, cắt sát mép, ổ bánh NẰM NGANG
(vì nó nằm trên tay người chơi, không bay lơ lửng), và cỡ vừa đủ nét ở 2x.

Bốn việc file này làm, không hơn:

  1. nền đen -> alpha            mấy tấm còn lại nền đen đặc (pate, chả, ớt…)
  2. cắt sát mép + co nhỏ        bớt vài MB tải về, và mép alpha là mốc neo
                                 duy nhất mà `src/art/photo.ts` dựa vào
  3. xoay về ngang               theo TRỤC CHÍNH của hình, không xoay tay
  4. ô sàn -> hình thoi 2:1      ảnh ô sàn là khối 3D tỉ lệ ~1,7:1, phải ép về
                                 đúng 2:1 của phép chiếu iso thì mới lát kín

CHỖ ĐẶT (cao bao nhiêu px, lệch trái phải bao nhiêu) KHÔNG nằm ở đây —
nó nằm ở `src/art/photo.ts`, cạnh mấy quy ước vẽ khác. File này chỉ rửa ảnh.
"""
import math
import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    sys.exit("cần Pillow: python3 -m pip install --user Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "art-raw")
OUT = os.path.join(ROOT, "public", "art")

# Bề rộng / bề cao một ô trên màn hình, và độ dày lớp mặt đường.
# Phải khớp `src/world/iso.ts` và `BASE` trong `src/art/canvas.ts`.
TW, TH, BASE = 60, 30, 6

R = "-removebg-preview.png"


def raw(name):
    """
    Ảnh gốc + CÓ SẴN ALPHA HAY CHƯA.

    Phần lớn ảnh artist gửi đã tách nền tử tế rồi. Chỉ vài tấm (pate, chả lụa,
    thịt nguội, đồ chua, ớt) là còn nền đen đặc. Phân biệt hai loại là bắt buộc:
    đem thuốc tẩy nền đen xối lên ảnh đã có alpha thì mọi mảng TỐI của chính vật
    — vỏ ổ bánh cháy, lốp xe, mép thùng rác — bị ăn mất một phần độ đục.
    """
    im = Image.open(os.path.join(SRC, name))
    has_alpha = "A" in im.getbands() and im.getchannel("A").getextrema()[0] < 250
    return im.convert("RGBA"), has_alpha


# ───────────────────────────────────────────────────────────── rửa nền, cắt mép

def cut_black(im, cut=14, soft=44):
    """
    Nền ĐEN -> trong suốt, bằng cách LOANG TỪ MÉP ẢNH vào.

    Cắt theo ngưỡng độ sáng toàn ảnh thì mọi chỗ tối của chính vật cũng bay theo:
    đó là vì sao mấy que đồ chua từng bị mất hẳn đường viền sẫm quanh mình. Loang
    từ mép thì chỉ vùng đen NỐI LIỀN ra rìa ảnh mới là nền; một hốc tối nằm giữa
    vật vẫn đục nguyên.

    Dải `cut..soft` cho viền mềm 1–2 px — ở cỡ 36 px đó là khác biệt giữa "ảnh
    dán lên" và "ảnh nằm trong game".
    """
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
    """
    Bỏ mấy mẩu alpha vụn rời khỏi vật chính.

    Vài tấm còn sót một hai chấm ở góc. Chấm đó không ai thấy, nhưng nó NỚI RỘNG
    khung alpha, mà khung alpha chính là thứ `photo.ts` dùng để canh cỡ — nên một
    chấm bụi ở góc làm trái ớt bị thu nhỏ lại trong ô của nó.
    """
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


def clean(name):
    """Ảnh sẵn sàng dùng: có alpha thì giữ NGUYÊN, chưa có thì mới tách nền đen."""
    im, has_alpha = raw(name)
    return trim(despeckle(im if has_alpha else cut_black(im)))


def trim(im, pad=0):
    """
    Cắt sát mép alpha. Mép alpha là mốc neo của `photo.ts`, phải sát thật —
    nhưng ngưỡng để RẤT thấp, vì viền mềm của vật cũng là một phần của vật.
    """
    box = im.getchannel("A").point(lambda v: 255 if v > 2 else 0).getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
    return im.crop((x0, y0, x1, y1))


def fit(im, longest):
    """Co về cạnh dài `longest` px. Không phóng to: phóng ảnh render là ra mờ."""
    k = longest / max(im.size)
    if k >= 1:
        return im
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


# ─────────────────────────────────────────────────────────────── xoay về ngang

def tilt(im):
    """
    Góc nghiêng của TRỤC CHÍNH, tính bằng mô-men bậc hai của mảng alpha.

    Xoay bằng mắt thì mỗi ổ bánh lệch một kiểu. Trục chính thì máy đo được:
    ổ bánh là một khối thon, trục dài của nó chính là hướng "nằm" của ổ.
    """
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
    # Trục chính của ma trận hiệp phương sai — chia đôi vì công thức cho góc 2θ.
    return math.degrees(0.5 * math.atan2(2 * xy, xx - yy))


def level(im):
    """Xoay cho trục chính nằm NGANG. Ảnh gốc co lại trước cho đỡ răng cưa."""
    a = tilt(im)
    if abs(a) < 0.7:
        return im
    return trim(im.rotate(a, Image.BICUBIC, expand=True))


# ──────────────────────────────────────────────────────────── ô sàn -> hình thoi

def topface(im):
    """
    Bốn góc MẶT TRÊN của khối ô sàn, đọc từ bóng hình.

    Ảnh ô sàn là một phiến 3D: mặt trên hình bình hành + một vạt dày phía dưới.
    Đỉnh trên cùng là góc N; điểm trái nhất / phải nhất (lấy điểm CAO nhất trong
    số đó, vì cạnh đứng của vạt dày cũng chạm hai mốc này) là W và E; góc S suy
    ra bằng luật hình bình hành W + E − N.
    """
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


# Hình thoi nướng ra RỘNG HƠN ô thật 2 px mỗi chiều, nên hai ô cạnh nhau CHỒNG LÊN
# nhau 1 px. Hình thoi vừa khít 60×30 thì mép nào cũng rơi đúng vào ranh giới pixel,
# và chỉ cần một pixel làm tròn xuống là hở một đường chỉ tối chạy dọc cả mặt sàn.
# Chồng mép là rẻ: nền lát từ xa tới gần nên ô trước luôn vẽ đè lên phần dư của ô sau.
OVER = 2


def unwrap(im, side=128, inset=0.035):
    """
    Mặt trên nghiêng -> ảnh vuông nhìn thẳng từ trên xuống ("trải phẳng" ô).

    `inset` thu bốn góc vào phía trong một chút. Phiến 3D nào cũng có mép vát tối và
    góc bo tròn; lấy đúng tới góc là kéo luôn vệt tối đó vào ảnh, rồi nó nằm ngay
    trên đường ráp giữa hai ô — ra đúng cái "viền đen lấm tấm" quanh từng viên gạch.
    """
    corners = topface(im)
    mx = sum(c[0] for c in corners) / 4
    my = sum(c[1] for c in corners) / 4
    n, wv, e, s = [(x + (mx - x) * inset, y + (my - y) * inset) for x, y in corners]
    # QUAD nhận bốn góc NGUỒN theo thứ tự: trên-trái, dưới-trái, dưới-phải, trên-phải
    # của khung ĐÍCH. Đích là ô vuông (u sang phải = trục +x thế giới, v xuống = +y).
    quad = (n[0], n[1], wv[0], wv[1], s[0], s[1], e[0], e[1])
    return im.transform((side, side), Image.QUAD, quad, Image.BICUBIC)


def diamond(flat, spin):
    """
    Ô vuông trải phẳng -> hình thoi iso, rộng hơn ô thật `OVER` px để hai ô chồng mép.

    `spin` (0–3) xoay ô trong mặt phẳng của chính nó — biến thể của cùng một tấm ảnh,
    đủ để mắt thôi đếm nhịp lặp mà vẫn chỉ tốn một file.

    Lát ảnh 3×3 trước khi xoay nghiêng là mấu chốt: phép nội suy ở sát mép hình thoi
    cần đọc cả điểm NGOÀI ô, mà ngoài ô là vùng trống thì nó pha ra một viền đen
    mảnh. Lát 3×3 thì ngoài ô vẫn là mặt gạch thật, không còn gì để pha ra viền.
    """
    flat = flat.rotate(-90 * spin, expand=True)
    n = flat.width
    big = Image.new("RGBA", (n * 3, n * 3))
    for i in range(3):
        for j in range(3):
            big.paste(flat, (i * n, j * n))

    W, H = TW + OVER, TH + OVER
    # Ánh xạ (0,0)->đỉnh trên, (n,0)->đỉnh phải, (0,n)->đỉnh trái, cộng lệch một ô
    # vì ta đọc từ ô GIỮA của tấm 3×3. Image.transform nhận ma trận NGƯỢC (đích ->
    # nguồn), nên đây là nghịch đảo đã giải sẵn.
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


def floor_tile(flat, spin):
    """
    Một texture ô sàn, ĐÚNG cỡ mà `bakeGround()` trong StallScene giả định:
    rộng `TW + 2`, cao `TH + BASE + 2`, tâm hình thoi ở `H − 1 − BASE − TH/2`.

    Vạt dày `BASE` px phía dưới chỉ lộ ra ở rìa bản đồ (ô phía trước vẽ đè lên),
    nên nó chỉ cần đúng TÔNG: lấy màu trung bình của ô rồi làm tối, đúng như
    `isoBox()` đang làm cho mọi khối iso khác.
    """
    top = diamond(flat, spin)
    W, H = TW + 2, TH + BASE + 2
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cx, cy = W // 2, H - 1 - BASE - TH // 2        # tâm hình thoi

    r, g, b = average(top)
    d = ImageDraw.Draw(out)
    for side, k in (("l", 0.68), ("r", 0.84)):     # trái khuất nắng, phải bắt nắng
        x = cx - TW / 2 if side == "l" else cx
        d.polygon([(x, cy), (x + TW / 2, cy + TH / 2),
                   (x + TW / 2, cy + TH / 2 + BASE), (x, cy + BASE)],
                  fill=(int(r * k), int(g * k), int(b * k), 255))
    out.alpha_composite(top, (cx - top.width // 2, cy - top.height // 2))
    return out


# ────────────────────────────────────────────────────────────────── bảng công việc

# Ô sàn: (tên game, file gốc). Mỗi loại ra 4 biến thể xoay.
#
# KHÔNG có ô sàn trong quán ở đây. Tấm gạch bông `encaustic_floor_tile` hoa văn quá
# dày: lát kín cả sàn quán thì nền rối hơn thứ đứng trên nó, mà sàn quán chính là
# phông của khoảnh khắc quan trọng nhất game (khách nhìn tay mình làm — T1).
# Sàn quán để trắng, dùng bản vẽ code ở `art/tiles.ts`. Ảnh gạch bông vẫn còn trong
# `art-raw/` nếu sau này muốn dùng cho một mảng nhỏ.
#
# Bốn biến thể của mỗi loại là bốn góc xoay, nhưng CHỈ XOAY 180°: gạch vỉa hè xếp
# theo một chiều, xoay 90° là chiều gạch quay ngang, lát cạnh nhau ra ngay bàn cờ.
# Xoay 180° thì chiều gạch giữ nguyên mà nhịp so le vẫn đổi — vừa đủ phá nhịp lặp.
FLOORS = [
    ("f_walk", "brick_pavement" + R, (0, 2, 2, 0)),
    ("f_road", "asphalt_ground_tile" + R, (0, 2, 0, 2)),
]
# Biến thể 1 của mặt đường là ô có vạch sơn — `tiles.ts` vốn đã quy ước như vậy.
# Vạch phải chạy theo trục +x của thế giới, và đó đúng là góc xoay 1.
ROAD_PAINT = "asphalt_road_with_lane_marking" + R
ROAD_PAINT_SPIN = 1

# đạo cụ đứng trên ô: (tên ra, file gốc, cạnh dài tối đa)
# Cạnh dài giữ ở 384 px, tức gấp 4–5 lần cỡ thật trên màn hình. Thừa là cố ý:
# `photo.ts` thu nhỏ bằng cách CHIA ĐÔI nhiều nhịp, mà chia đôi thì cần dư chỗ.
# Co sẵn xuống sát cỡ dùng là mất chi tiết vĩnh viễn, không lấy lại được.
PROPS = [
    ("prop_oven", "brick_bread_oven" + R, 384),
    ("prop_shelf", "bread_display_cabinet" + R, 384),
    ("prop_tea", "water_dispenser" + R, 384),
    ("prop_sink", "wall_hung_sink" + R, 384),
    ("prop_stool", "red_round_stool" + R, 320),
    ("prop_table", "plastic_table_and_stools" + R, 384),
    ("prop_bike", "vintage_motorbike" + R, 384),
    ("prop_scooter", "vespa_scooter" + R, 384),
    ("prop_pothos", "potted_plant" + R, 320),
    ("prop_bin", "recycling_bin" + R, 320),
    ("prop_sign", "wooden_a_frame_sign" + R, 320),
    ("prop_extinguisher", "fire_extinguisher" + R, 288),
]

# món trên tay: xoay về NGANG vì nó nằm trên hai bàn tay người chơi
HELD = [
    ("held_loaf_cold", "bread_dough" + R, True),
    ("held_loaf_hot", "baked_baguette" + R, True),
    ("held_loaf_burnt", "burnt_baguette" + R, True),
    ("held_loaf_filled", "banh_mi_on_paper_tray" + R, True),
    ("held_tea", "iced_tea_glass" + R, False),
]

# nhân trong bảng kẹp. `dualeo` (dưa leo) và `tuongot` (tương ớt) artist chưa vẽ
# -> hai món đó vẫn dùng hình code cũ, xem `photo.ts`.
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


def open_loaf():
    """
    Ổ bánh rạch đôi -> hai nửa RỜI: `loaf_lid` (nắp) và `loaf_trough` (máng).

    Ảnh gốc là hai nửa dựng ĐỨNG cạnh nhau, CÁCH NHAU một rãnh trong suốt. Tách
    đôi ở ĐÚNG cái rãnh đó — KHÔNG đi qua `clean()`, vì `despeckle()` chỉ giữ
    mảng alpha lớn nhất nên nó xoá sạch một nửa ổ, rồi nhát cắt giữa ảnh lại xẻ
    đôi cái nửa còn sót: ra hai mẩu bánh cụt. Mỗi nửa despeckle RIÊNG, sau khi
    đã rời nhau.

    Xoay 90° theo chiều kim đồng hồ thì nửa trái thành nửa TRÊN (vỏ ngửa lên —
    đúng cái nắp lật ra sau) và nửa phải thành nửa DƯỚI (mặt cắt ngửa lên — đúng
    cái máng để thả nhân vào). Tách đôi ở đây để `photo.ts` xếp chồng được:
    nắp thò ra sau lưng máng.
    """
    im, has_alpha = raw("sliced_open_baguette" + R)
    im = trim(im if has_alpha else cut_black(im))

    # Rãnh giữa hai nửa: dải cột RỘNG NHẤT mà alpha gần như bằng 0.
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


def main():
    os.makedirs(OUT, exist_ok=True)
    made = 0

    def save(name, im):
        nonlocal made
        im.save(os.path.join(OUT, name + ".png"))
        made += 1
        print(f"  {name}.png  {im.width}×{im.height}")

    print("ô sàn")
    for key, src, spins in FLOORS:
        flat = unwrap(raw(src)[0])
        paint = unwrap(raw(ROAD_PAINT)[0]) if key == "f_road" else None
        for i, spin in enumerate(spins):
            if i == 1 and paint:
                save(f"{key}{i}", floor_tile(paint, ROAD_PAINT_SPIN))
            else:
                save(f"{key}{i}", floor_tile(flat, spin))

    print("đạo cụ")
    for key, src, longest in PROPS:
        save(key, fit(clean(src), longest))

    print("món trên tay")
    for key, src, flat in HELD:
        im = clean(src)
        save(key, fit(level(im) if flat else im, 288))

    print("nhân")
    for key, src in INGREDIENTS:
        save(key, fit(clean(src), 224))

    print("ổ bánh rạch đôi")
    lid, trough = open_loaf()
    save("loaf_lid", lid)
    save("loaf_trough", trough)

    print(f"\nxong — {made} file trong public/art/")


if __name__ == "__main__":
    main()
