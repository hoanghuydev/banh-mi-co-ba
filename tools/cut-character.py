#!/usr/bin/env python3
"""
art-raw/<bảng xoay>.png  ->  public/art/<thư mục riêng của người đó>/*.png

Xưởng cắt BẢNG XOAY NHÂN VẬT, chạy lại mỗi khi artist gửi bảng mới:

    python3 tools/cut-character.py            # cắt lại cả dàn
    python3 tools/cut-character.py anh-dung   # cắt lại một người

Mỗi người MỘT THƯ MỤC RIÊNG, file đặt tên bằng đúng tên hướng. Nhét chung một thư
mục rồi phân biệt bằng tiền tố thì người thứ ba là bắt đầu phải nghĩ tên, mà đặt
trùng tên một cái là ảnh người này lặng lẽ đè lên người kia — hỏng kiểu khó tìm
nhất, vì không có lỗi nào nổ ra cả.

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
RAW = os.path.join(ROOT, "art-raw")
ART = os.path.join(ROOT, "public", "art")

# Cạnh dài tối đa của file ra. Giữ dư như đạo cụ (xem `prep-art.py`): `photo.ts`
# thu nhỏ bằng cách CHIA ĐÔI nhiều nhịp, mà chia đôi thì cần dư chỗ.
LONGEST = 384

# Ngưỡng alpha coi là "có hình". Để thấp: viền mềm của nhân vật cũng là nhân vật.
INK = 8

# Bao nhiêu phần đáy hình được coi là BÀN CHÂN, để tìm tâm chân.
# 6% của một người cao ~380 px là ~23 px — đúng khoảng đế giày, chưa chạm ống quần.
SOLE = 0.06

# Chiều cao nhân vật trên màn, px thiết kế. Phải khớp `BODY_H` ở `src/art/character.ts`.
BODY_H = 64

# ───────────────────────────────────────────────────────────────────── cả dàn
#
# Mỗi người một dòng. Thêm người = thêm một dòng, không hàm nào phải sửa.
#
#   sheet  tên file bảng xoay trong `art-raw/`
#   out    thư mục riêng trong `public/art/` + tiền tố tên file (thường để rỗng)
#   knob   con số bên `src/art/photo.ts` phải chép lại sau mỗi lần cắt
#   ref    hướng lấy làm MỐC CỠ (xem dưới)
#   san    san bằng chiều cao tám hướng hay để nguyên (xem dưới)
#   slots  ô nào ra hướng nào (xem dưới)
#
# ── bảng tám hướng ───────────────────────────────────────────────────────────
#
# Tên hướng là hướng TRÊN MÀN HÌNH, không phải hướng trong thế giới — đúng quy ước
# của `Facing` trong `src/world/iso.ts`: "s" là đi XUỐNG màn hình (mặt quay về phía
# người chơi), "e" là đi sang PHẢI màn hình.
#
# Số là ô thứ mấy trên bảng, đếm từ 1 theo thứ tự đọc (trái->phải, trên->dưới).
# Đọc ra hướng của một ô bằng MŨI GIÀY: mũi giày chỉ sang phải -> nửa "e".
# Mỗi bảng artist xếp một kiểu, nên ĐỪNG chép bảng của người này sang người kia.
#
# ── hướng lấy làm MỐC CỠ (`ref`) ─────────────────────────────────────────────
# `photo.ts` ép khung chung về bao nhiêu px thì tính sao cho đúng hướng này cao
# bằng `BODY_H`. Chọn chính diện vì đó là tư thế mắt nhìn nhiều nhất, và vì mọi
# nhân vật vẽ bằng code cũng cao đúng `BODY_H` ở tư thế đó.
#
# ── san bằng chiều cao (`san`) ───────────────────────────────────────────────
# Mặc định KHÔNG san: khung chung giữ nguyên tỉ lệ artist render, vì chênh lệch
# thường là thật (búi tóc nhìn nghiêng cao hơn nhìn thẳng, người hơi khom ở tư
# thế này mà thẳng lưng ở tư thế kia).
#
# Nhưng có bảng artist render HAI HÀNG BẰNG HAI GÓC MÁY khác nhau — máy cao hơn
# thì thân người bị nén lại theo chiều dọc trong khi cái đầu gần như không đổi.
# Dấu hiệu nhận ra: thân chênh cả chục phần trăm giữa hai hàng mà BỀ NGANG ĐẦU
# chỉ chênh vài phần trăm (bảng bà Bảy: thân 302 -> 338 px, tức +12%, đầu chỉ
# 81 -> 84 px, tức +4%). Để nguyên thì người chơi xoay một vòng là bà cao lên
# thấp xuống 7 px trên màn — mắt đọc ra ngay là lỗi, không ai đọc ra là "tư thế".
#
# `san` ép mọi hướng về đúng cỡ hướng mốc. Đổi lại thì cái đầu co lại vài % ở
# mấy hướng bị thu — ít lộ hơn hẳn so với cả người cao thấp. Cách sửa thật nằm
# ở phía artist: render lại cả tám ô bằng MỘT góc máy, rồi tắt `san` đi.
CAST = {
    # Cô bán bánh — người chơi.
    #
    # Ô 6 KHÔNG dùng: artist render trùng góc với ô 5 (cùng là 3/4 trước-phải), nên
    # bảng thiếu đúng một hướng — 3/4 sau-phải. Lấy ô 7 (3/4 sau-trái) lật ngang là ra.
    # Lật ngang được vì tạp dề thắt nơ GIỮA lưng: ở cỡ 64 px không ai thấy khác biệt.
    # Artist render bù ô còn thiếu thì đổi dòng "ne" thành (6, False) — hết, không
    # file nào khác phải sửa.
    "co-ba": {
        "sheet": "character_model_list.png",
        "out": ("player", "p_"),
        "knob": "PLAYER_H",
        "ref": "s",
        # Để NGUYÊN, dù bảng của cô cũng chênh ~8%: bộ ảnh này đã chốt và cả game
        # căn theo nó (chỗ đứng, bóng đổ, chỗ món nằm trên tay). Muốn san thì đổi
        # dòng này rồi soi lại `artsheet.html` và mấy cảnh có cô đứng cạnh đạo cụ.
        "san": False,
        "slots": [
            ("s",  1, False),   # chính diện, mặt nhìn thẳng vào người chơi
            ("n",  2, False),   # quay lưng
            ("w",  3, False),   # nghiêng, mũi giày sang TRÁI
            ("e",  4, False),   # nghiêng, mũi giày sang PHẢI
            ("se", 5, False),   # 3/4 trước-phải
            ("sw", 8, False),   # 3/4 trước-trái
            ("nw", 7, False),   # 3/4 sau-trái
            ("ne", 7, True),    # THIẾU trên bảng -> lật ngang ô 7
        ],
    },
    # Anh Dũng — tài xế công nghệ, nón bảo hiểm nửa đầu có ngôi sao vàng ĐẰNG TRƯỚC.
    #
    # Bảng ĐỦ TÁM HƯỚNG, không ô nào trùng, không ô nào phải lật — bảng duy nhất
    # tới giờ được như vậy. Ba cặp đối xứng soi gương khớp nhau (ô 3-4, 5-6, 7-8 lệch
    # 7,0 / 7,1 / 8,9 trên 255), tức artist render đủ cả hai bên.
    #
    # Đọc hướng:
    #  · ô 3 và 4 là NGHIÊNG HẲN — vai chỉ còn 0,19 chiều cao, so với 0,38 lúc nhìn
    #    thẳng; ô 5 và 6 vai 0,29 nên là 3/4. (Bảng CŨ `driver_char_list.png` sai đúng
    #    chỗ này: hai ô "nghiêng" của nó mới xoay chừng 70°, vai 0,25 — gần bằng ô 3/4
    #    là 0,29 — nên `e` nhìn ra như `se` và `w` như `sw`. Artist render lại, bảng cũ
    #    còn trong `art-raw/` nhưng KHÔNG dùng nữa.)
    #  · trái hay phải thì xem MẢNG DA trên mặt và VẠT ÁO TRẮNG trước ngực: ô 3 cả hai
    #    đều dạt sang phải (+0,24 và +0,17 bề ngang) nên mặt và ngực cùng quay sang
    #    phải -> "e"; ô 4 ngược lại.
    #  · hai ô quay lưng phân biệt bằng CÁI KÍNH LẬT: nó nằm ở MẶT TRƯỚC nón, nên ô 7
    #    thò kính ra mép trái (−0,18) là đang quay lưng chếch sang trái -> "nw", ô 8
    #    thò ra mép phải (+0,20) -> "ne".
    "anh-dung": {
        "sheet": "anh-dung-list.png",
        "out": ("npc/anh-dung", ""),
        "knob": "NPC_PHOTOS.ANH_DUNG.h",
        "ref": "s",
        # Cái nón là một khối cầu, nên chênh 9% giữa các ô không phải "tóc cao thấp"
        # mà là góc máy — san.
        "san": True,
        "slots": [
            ("s",  1, False),   # chính diện
            ("n",  2, False),   # quay lưng
            ("e",  3, False),   # nghiêng hẳn, mặt và ngực quay sang PHẢI
            ("w",  4, False),   # nghiêng hẳn, mặt và ngực quay sang TRÁI
            ("se", 5, False),   # 3/4 trước-phải
            ("sw", 6, False),   # 3/4 trước-trái
            ("nw", 7, False),   # 3/4 sau-trái  (kính lật ló ra mép TRÁI)
            ("ne", 8, False),   # 3/4 sau-phải  (kính lật ló ra mép PHẢI)
        ],
    },
    # Bà Bảy — tóc búi bạc, áo tím nhạt, quần xám, đi chân đất.
    #
    # Bố cục ô TRÙNG bảng anh Dũng (may, không phải trùng thì cũng chỉ là một bảng
    # khác ở đây). Đọc hướng bằng MẢNG DA trên khuôn mặt: ô 3 da dạt sang phải
    # (+0,23 bề ngang) nên mặt quay sang phải; ô 4 ngược lại. Ô 3 và 4 vai hẹp nhất
    # (0,227 chiều cao) nên là hai ô nghiêng hẳn; ô 5 và 6 vai 0,277 nên là 3/4.
    #
    # Ô 8 KHÔNG dùng: trùng góc ô 7 (chồng thẳng lên nhau chỉ lệch 3,6/255 — gần như
    # cùng một tấm). Cả hai đều là 3/4 sau-TRÁI: chỉ ló một mảng da nhỏ ở mép trái.
    # Nên thiếu 3/4 sau-phải, lấy ô 7 lật ngang. Lật được vì nhìn từ sau bà đối xứng:
    # búi tóc giữa gáy, áo trơn, không túi không giỏ.
    #
    # Lưu ý: bảng này KHÔNG có kính lão, mà `content/npcs.ts` ghi `glasses: true` —
    # xem ghi chú ở `NPC_PHOTOS` trong `art/photo.ts`.
    "ba-bay": {
        "sheet": "ba-bay-list.png",
        "out": ("npc/ba-bay", ""),
        "knob": "NPC_PHOTOS.BA_BAY.h",
        "ref": "s",
        "san": True,            # hai hàng hai góc máy — xem đoạn `san` ở trên
        "slots": [
            ("s",  1, False),   # chính diện
            ("n",  2, False),   # quay lưng
            ("e",  3, False),   # nghiêng, mặt quay sang PHẢI
            ("w",  4, False),   # nghiêng, mặt quay sang TRÁI
            ("se", 5, False),   # 3/4 trước-phải
            ("sw", 6, False),   # 3/4 trước-trái
            ("nw", 7, False),   # 3/4 sau-trái
            ("ne", 7, True),    # THIẾU trên bảng -> lật ngang ô 7
        ],
    },
    # Anh Bảo — sinh viên, kính tròn gọng đen, áo cardigan xám, tóc rối.
    #
    # Bảng KHÓ nhất tới giờ: thiếu HAI hướng, và không ô nào xếp giống hai bảng kia.
    # Ô 1 là lưng (không phải ô 2), còn nửa phía ĐÔNG trống hoàn toàn — artist render
    # lệch hẳn về một bên:
    #
    #   ô1 lưng · ô2 chính diện · ô3 và ô4 CÙNG là nghiêng-trái (ô 4 xoay sâu hơn một
    #   chút: mặt còn lộ 598 px da so với 694 của ô 3) · ô5 và ô6 trùng nhau gần như
    #   tuyệt đối (lệch 4,7/255) và cùng là 3/4 sau-trái · ô7 và ô8 là một cặp gương
    #   thật (lệch 14,3/255 khi soi gương, 41,8 khi chồng thẳng) nên là 3/4 trước-phải
    #   và 3/4 trước-trái.
    #
    # Nên thiếu `e` và `ne`, lấy ô 4 và ô 5 lật ngang. Lật được vì áo cardigan cài nút
    # GIỮA ngực, kính tròn hai bên như nhau; chỉ cái mái tóc rẽ ngôi là soi gương, mà ở
    # cỡ 64 px thì không ai thấy. Artist render bù hai ô đó thì đổi `True` thành `False`
    # và trỏ sang ô mới.
    #
    # KHÔNG san: bảng này render đều tay, tám hướng chỉ chênh 3,2%.
    #
    # Lưu ý: ảnh có KÍNH nhưng không có NÓN KẾT, còn `content/npcs.ts` ghi ngược lại
    # (`hat: "cap"`, không `glasses`) — xem ghi chú ở `NPC_PHOTOS` trong `art/photo.ts`.
    "anh-bao": {
        "sheet": "anh-bao-list.png",
        "out": ("npc/anh-bao", ""),
        "knob": "NPC_PHOTOS.ANH_BAO.h",
        "ref": "s",
        "san": False,
        "slots": [
            ("s",  2, False),   # chính diện
            ("n",  1, False),   # quay lưng
            ("w",  4, False),   # nghiêng, mũi giày sang TRÁI
            ("e",  4, True),    # THIẾU trên bảng -> lật ngang ô 4
            ("se", 7, False),   # 3/4 trước-phải
            ("sw", 8, False),   # 3/4 trước-trái
            ("nw", 5, False),   # 3/4 sau-trái
            ("ne", 5, True),    # THIẾU trên bảng -> lật ngang ô 5
        ],
    },
}


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


def cut(who, spec):
    path = os.path.join(RAW, spec["sheet"])
    if not os.path.exists(path):
        sys.exit(f"không thấy bảng xoay: {path}")
    sheet = Image.open(path).convert("RGBA")

    boxes = cells(sheet)
    if len(boxes) != 8:
        sys.exit(f"{who}: bảng phải có đúng 8 ô, dò ra {len(boxes)} — xem lại ảnh gốc")

    slots = spec["slots"]
    ref = spec["ref"]
    ref_slot = next(s for n, s, _ in slots if n == ref)

    # Cắt sát mép từng ô.
    figs = [sheet.crop(box) for box in boxes]
    figs = [f.crop(f.getbbox()) for f in figs]

    # San bằng chiều cao TRƯỚC khi đo tâm chân — đo trước rồi co sau là tâm chân
    # còn nằm theo thang cũ, tức lệch ngang đúng bằng phần vừa co.
    if spec["san"]:
        tall = figs[ref_slot - 1].height
        figs = [f if f.height == tall else
                f.resize((max(1, round(f.width * tall / f.height)), tall), Image.LANCZOS)
                for f in figs]

    figs = [(f, sole_center(f)) for f in figs]

    # Khung chung: cao bằng hình cao nhất, rộng gấp đôi khoảng vươn xa nhất tính
    # TỪ TÂM CHÂN. Đối xứng quanh tâm chân nên tâm ngang khung = tâm chân, ở mọi hướng.
    used = {slot for _, slot, _ in slots}
    H = max(figs[i - 1][0].height for i in used)
    reach = max(max(c, f.width - c) for i in used for f, c in [figs[i - 1]])
    W = int(round(reach)) * 2

    folder, prefix = spec["out"]
    out = os.path.join(ART, folder)
    os.makedirs(out, exist_ok=True)
    k = LONGEST / max(W, H)
    size = (max(1, round(W * k)), max(1, round(H * k))) if k < 1 else (W, H)

    print(f"{who}: khung chung {W}×{H} -> file {size[0]}×{size[1]}"
          f"  ({folder}/{prefix or ''}<hướng>.png{', đã san chiều cao' if spec['san'] else ''})")
    for name, slot, flip in slots:
        fig, cx = figs[slot - 1]
        canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        canvas.alpha_composite(fig, (int(round(W / 2 - cx)), H - fig.height))
        if flip:
            canvas = canvas.transpose(Image.FLIP_LEFT_RIGHT)
        if size != (W, H):
            canvas = canvas.resize(size, Image.LANCZOS)
        canvas.save(os.path.join(out, f"{prefix}{name}.png"))
        print(f"  {prefix}{name}.png   (ô {slot}{', lật ngang' if flip else ''})")

    # Khung chung cao hơn hình mốc (hướng nào đầu cao nhất thì hình đó định chiều
    # cao khung). `photo.ts` ép cả TEXTURE về `h`, nên `h` phải nới ra đúng tỉ lệ
    # đó thì người ở hướng mốc mới cao đúng `BODY_H`.
    print(f"\n-> src/art/photo.ts: {spec['knob']} = {round(BODY_H * H / figs[ref_slot - 1][0].height)}"
          f"  (hướng {ref!r} cao đúng BODY_H = {BODY_H})")

    # Người quay một vòng mà cao thấp khác nhau là mắt bắt được ngay. In ra để
    # còn biết bảng nào cần `san`, thay vì phải tự mở tám file lên đo.
    lo = min(figs[i - 1][0].height for i in used)
    print(f"   chênh cao giữa tám hướng: {100 * (H - lo) / H:.1f}%\n")


def main():
    want = sys.argv[1:] or list(CAST)
    for who in want:
        if who not in CAST:
            sys.exit(f"không có ai tên {who!r} trong bảng — có: {', '.join(CAST)}")
    for who in want:
        cut(who, CAST[who])


if __name__ == "__main__":
    main()
