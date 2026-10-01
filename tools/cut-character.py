#!/usr/bin/env python3
"""
art-raw/character_model_list.png  ->  public/art/player/p_*.png

Xưởng cắt BẢNG XOAY NHÂN VẬT, chạy lại mỗi khi artist gửi bảng mới:

    python3 tools/cut-character.py

Artist gửi MỘT tấm có tám tư thế xoay quanh nhân vật, nền trong suốt, xếp hai
hàng bốn cột. Game thì cần tám file rời, mỗi file một hướng, và — đây mới là
phần khó — tám file đó phải CHỒNG KHÍT lên nhau khi đổi hướng.

Bốn việc file này làm, không hơn:

  1. dò tám ô               theo khoảng trống alpha, không gõ tay toạ độ: artist
                            đổi bố cục bảng thì không ai phải sửa con số nào
  2. cắt sát mép alpha      mép alpha là mốc neo duy nhất `src/art/photo.ts` dựa vào
  3. căn CHÂN, không căn khung
  4. một KHUNG CHUNG        tám file cùng cỡ -> `photo.ts` chỉ cần một con số

── Vì sao phải căn chân và dùng khung chung ──────────────────────────────────
Cắt sát mép từng hình rồi thả vào game là nhân vật GIẬT mỗi lần quay:
 · búi tóc nhô cao ở hướng này, thấp ở hướng kia -> khung alpha cao thấp khác
   nhau, mà `photo.ts` ép mọi ảnh về cùng một chiều cao, nên người lúc cao lúc
   thấp 8% — mắt bắt được ngay;
 · nhìn nghiêng thì búi tóc thò hẳn ra sau gáy -> tâm KHUNG lệch khỏi tâm BÀN
   CHÂN, mà chân mới là chỗ chạm đất, nên người bị trượt ngang vài px khi quay.
Nên: tất cả vào chung một khung, đáy khung là mặt đất, tâm ngang khung là tâm
hai bàn chân. Khung chung thì tỉ lệ giữa tám hướng cũng tự khắc giữ nguyên.

CHỖ ĐẶT (cao bao nhiêu px trên màn) KHÔNG nằm ở đây — nó nằm ở `src/art/photo.ts`
cạnh mấy quy ước vẽ khác. File này chỉ cắt ảnh, rồi IN RA con số cao bao nhiêu
để chép sang bên đó.
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("cần Pillow: python3 -m pip install --user Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET = os.path.join(ROOT, "art-raw", "character_model_list.png")
OUT = os.path.join(ROOT, "public", "art", "player")

# Cạnh dài tối đa của file ra. Giữ dư như đạo cụ (xem `prep-art.py`): `photo.ts`
# thu nhỏ bằng cách CHIA ĐÔI nhiều nhịp, mà chia đôi thì cần dư chỗ.
LONGEST = 384

# Ngưỡng alpha coi là "có hình". Để thấp: viền mềm của nhân vật cũng là nhân vật.
INK = 8

# Bao nhiêu phần đáy hình được coi là BÀN CHÂN, để tìm tâm chân.
# 6% của một người cao ~380 px là ~23 px — đúng khoảng đế giày, chưa chạm ống quần.
SOLE = 0.06

# ─────────────────────────────────────────────────────────────── bảng tám hướng
#
# Tên hướng là hướng TRÊN MÀN HÌNH, không phải hướng trong thế giới — đúng quy ước
# của `Facing` trong `src/world/iso.ts`: "s" là đi XUỐNG màn hình (mặt quay về phía
# người chơi), "e" là đi sang PHẢI màn hình.
#
# Số là ô thứ mấy trên bảng, đếm từ 1 theo thứ tự đọc (trái->phải, trên->dưới).
# Đọc ra hướng của một ô bằng MŨI GIÀY: ô 4 mũi giày chỉ sang phải -> "e".
#
# Ô 6 KHÔNG dùng: artist render trùng góc với ô 5 (cùng là 3/4 trước-phải), nên
# bảng thiếu đúng một hướng — 3/4 sau-phải. Lấy ô 7 (3/4 sau-trái) lật ngang là ra.
# Lật ngang được vì tạp dề thắt nơ GIỮA lưng: ở cỡ 64 px không ai thấy khác biệt.
# Artist render bù ô còn thiếu thì đổi dòng "ne" thành (6, False) — hết, không
# file nào khác phải sửa.
SLOTS = [
    ("s",  1, False),   # chính diện, mặt nhìn thẳng vào người chơi
    ("n",  2, False),   # quay lưng
    ("w",  3, False),   # nghiêng, mũi giày sang TRÁI
    ("e",  4, False),   # nghiêng, mũi giày sang PHẢI
    ("se", 5, False),   # 3/4 trước-phải
    ("sw", 8, False),   # 3/4 trước-trái
    ("nw", 7, False),   # 3/4 sau-trái
    ("ne", 7, True),    # THIẾU trên bảng -> lật ngang ô 7
]

# Hướng lấy làm MỐC CỠ: `photo.ts` ép khung chung về bao nhiêu px thì tính sao cho
# đúng hướng này cao bằng `BODY_H`. Chọn chính diện vì đó là tư thế mắt nhìn nhiều
# nhất, và vì mọi nhân vật vẽ bằng code cũng cao đúng `BODY_H` ở tư thế đó.
REF = "s"

# Chiều cao nhân vật trên màn, px thiết kế. Phải khớp `BODY_H` ở `src/art/character.ts`.
BODY_H = 64


def bands(hits, gap_min=8):
    """Các dải LIỀN MẠCH có hình, bỏ dải mỏng hơn `gap_min` (bụi, viền lẻ)."""
    out, start = [], None
    for i, v in enumerate(hits):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= gap_min:
                out.append((start, i))
            start = None
    if start is not None and len(hits) - start >= gap_min:
        out.append((start, len(hits)))
    return out


def cells(im):
    """
    Tám ô của bảng, theo thứ tự đọc.

    Dò HAI NHỊP: cắt ngang ra các hàng trước, rồi trong TỪNG hàng mới cắt dọc.
    Cắt dọc một lần cho cả tấm thì hai hàng lệch cột nhau là mọi ô dính làm một.
    """
    w, h = im.size
    a = im.getchannel("A").point(lambda v: 255 if v > INK else 0)
    px = a.load()

    rows = bands([any(px[x, y] for x in range(w)) for y in range(h)])
    out = []
    for y0, y1 in rows:
        cols = bands([any(px[x, y] for y in range(y0, y1)) for x in range(w)])
        out += [(x0, y0, x1, y1) for x0, x1 in cols]
    return out


def sole_center(im):
    """
    Tâm ngang của hai BÀN CHÂN — chỗ nhân vật thật sự chạm đất.

    Không dùng tâm khung: búi tóc nhìn nghiêng thò ra sau gáy kéo tâm khung lệch
    đi cả chục px, và lệch bao nhiêu thì mỗi hướng một khác -> quay người là
    trượt ngang.
    """
    px = im.load()
    y0 = max(0, im.height - max(1, round(im.height * SOLE)))
    xs = [x for y in range(y0, im.height) for x in range(im.width) if px[x, y][3] > INK]
    if not xs:
        return im.width / 2
    return (min(xs) + max(xs) + 1) / 2


def main():
    if not os.path.exists(SHEET):
        sys.exit(f"không thấy bảng xoay: {SHEET}")
    sheet = Image.open(SHEET).convert("RGBA")

    boxes = cells(sheet)
    if len(boxes) != 8:
        sys.exit(f"bảng phải có đúng 8 ô, dò ra {len(boxes)} — xem lại ảnh gốc")

    # Cắt sát mép từng ô, rồi đo tâm chân của nó.
    figs = []
    for box in boxes:
        fig = sheet.crop(box)
        fig = fig.crop(fig.getbbox())
        figs.append((fig, sole_center(fig)))

    # Khung chung: cao bằng hình cao nhất, rộng gấp đôi khoảng vươn xa nhất tính
    # TỪ TÂM CHÂN. Đối xứng quanh tâm chân nên tâm ngang khung = tâm chân, ở mọi hướng.
    used = {slot for _, slot, _ in SLOTS}
    H = max(figs[i - 1][0].height for i in used)
    reach = max(max(c, f.width - c) for i in used for f, c in [figs[i - 1]])
    W = int(round(reach)) * 2

    os.makedirs(OUT, exist_ok=True)
    k = LONGEST / max(W, H)
    size = (max(1, round(W * k)), max(1, round(H * k))) if k < 1 else (W, H)

    print(f"khung chung {W}×{H} -> file {size[0]}×{size[1]}")
    for name, slot, flip in SLOTS:
        fig, cx = figs[slot - 1]
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        canvas.alpha_composite(fig, (int(round(W / 2 - cx)), H - fig.height))
        if flip:
            canvas = canvas.transpose(Image.FLIP_LEFT_RIGHT)
        if size != (W, H):
            canvas = canvas.resize(size, Image.LANCZOS)
        canvas.save(os.path.join(OUT, f"p_{name}.png"))
        print(f"  p_{name}.png   (ô {slot}{', lật ngang' if flip else ''})")

    # Khung chung cao hơn hình mốc (hướng nào búi tóc cao nhất thì hình đó định
    # chiều cao khung). `photo.ts` ép cả TEXTURE về `h`, nên `h` phải nới ra đúng
    # tỉ lệ đó thì người ở hướng mốc mới cao đúng `BODY_H`.
    ref = next(slot for name, slot, _ in SLOTS if name == REF)
    print(f"\n-> src/art/photo.ts: PLAYER = {{ h: {round(BODY_H * H / figs[ref - 1][0].height)} }}"
          f"  (hướng {REF!r} cao đúng BODY_H = {BODY_H})")


if __name__ == "__main__":
    main()
