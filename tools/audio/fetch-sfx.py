#!/usr/bin/env python3
"""
tools/audio/sources.py  ->  public/audio/sfx/*.mp3  +  PROVENANCE.csv  +  catalog.json

Xưởng kéo âm thanh về, chạy MỘT LẦN mỗi khi `sources.py` đổi:

    python3 tools/audio/fetch-sfx.py            # chỉ làm phần còn thiếu
    python3 tools/audio/fetch-sfx.py --force    # làm lại từ đầu
    python3 tools/audio/fetch-sfx.py --only sfx_dao_rach,amb_cho

Giống `tools/prep-art.py` với ảnh: bản tải về nằm ở `.cache/audio/` NGOÀI `public/`
(vite chép nguyên si `public/` vào `dist/` — người chơi tải về làm gì bản gốc).

── Ba việc file này làm ────────────────────────────────────────────────────────
 1. KIỂM GIẤY PHÉP    đọc trang sound, **từ chối** mọi thứ không phải CC0.
                      Đây là cổng, không phải khuyến nghị: lọt một file CC BY-NC
                      vào bản bán ra là một lá thư luật sư, và sẽ không ai nhớ
                      file nào lọt nếu không chặn ngay tại đây.
 2. GỌT              cắt đoạn, bỏ im lặng đầu/cuối, nối vòng, chuẩn RMS, nén mp3.
 3. GHI SỔ           `PROVENANCE.csv` (P5-02 §2.8.2) + `src/audio/catalog.json`
                      để game và bảng ghi công đọc cùng một nguồn sự thật.
"""
import argparse, csv, html, json, os, re, shutil, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)

from audioproc import process                                    # noqa: E402
from sources import SFX                                          # noqa: E402

CACHE = os.path.join(ROOT, ".cache", "audio")
OUT = os.path.join(ROOT, "public", "audio", "sfx")
PROV = os.path.join(ROOT, "public", "audio", "PROVENANCE.csv")
CATALOG = os.path.join(ROOT, "src", "audio", "catalog.json")
TMP = os.path.join(CACHE, "_tmp")

UA = "Mozilla/5.0 (ByeSep asset fetch; hoanghuy@sepay.vn)"
CC0 = "https://creativecommons.org/publicdomain/zero/1.0/"


# ────────────────────────────────────────────────────────────── lấy về từ mạng

def get(url: str, retry: int = 4) -> bytes:
    for i in range(retry):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception:
            if i == retry - 1:
                raise
            time.sleep(2.5 * (i + 1))
    return b""


def attr(page: str, key: str):
    m = re.search(key + r'="([^"]*)"', page)
    return html.unescape(m.group(1)) if m else None


def meta(sound_id: int) -> dict:
    """
    Siêu dữ liệu + KIỂM GIẤY PHÉP, đọc thẳng từ trang sound (không cần API key).

    Cố ý đọc lại trang từng file thay vì tin bộ lọc ở trang tìm kiếm: tác giả đổi
    giấy phép được bất cứ lúc nào, mà `sources.py` thì ghi id từ hôm tra.
    """
    cached = os.path.join(CACHE, "meta", f"{sound_id}.json")
    if os.path.exists(cached):
        return json.load(open(cached, encoding="utf-8"))

    page = get(f"https://freesound.org/s/{sound_id}/").decode("utf-8", "replace")
    lic = re.search(r'creativecommons\.org/(publicdomain/zero/1\.0|licenses/[a-z-]+/[0-9.]+)', page)
    lic_url = "https://" + lic.group(0) if lic else ""
    if lic_url.rstrip("/") != CC0.rstrip("/"):
        raise SystemExit(
            f"\n  DỪNG — freesound #{sound_id} KHÔNG phải CC0 (thấy: {lic_url or 'không rõ'}).\n"
            f"  Sửa `tools/audio/sources.py` rồi chạy lại. Xem https://freesound.org/s/{sound_id}/\n"
        )
    mp3 = attr(page, "data-mp3") or ""
    author = (re.search(r'/people/([^/"]+)/sounds/%d' % sound_id, page) or [None, ""])[1]
    info = {
        "id": sound_id,
        "title": attr(page, "data-title") or f"freesound {sound_id}",
        "author": author or attr(page, "data-username") or "",
        "license": "CC0 1.0",
        "license_url": CC0,
        "page_url": f"https://freesound.org/s/{sound_id}/",
        # Bản nghe thử 192 kbps; bản gốc cần đăng nhập mới tải được. CC0 nên dùng
        # bản nghe thử là hợp lệ, và SFX một phát thì 192 kbps thừa sức.
        "mp3": mp3.replace("-lq.mp3", "-hq.mp3"),
        "duration": float(attr(page, "data-duration") or 0),
    }
    os.makedirs(os.path.dirname(cached), exist_ok=True)
    json.dump(info, open(cached, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    time.sleep(0.6)                                   # lịch sự với máy chủ người ta
    return info


def download(info: dict) -> str:
    dst = os.path.join(CACHE, "raw", f"{info['id']}.mp3")
    if os.path.exists(dst) and os.path.getsize(dst) > 2000:
        return dst
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    data = get(info["mp3"])
    if len(data) < 2000:
        raise RuntimeError(f"#{info['id']}: bản nghe thử về quá ngắn ({len(data)}B)")
    open(dst, "wb").write(data)
    time.sleep(0.4)
    return dst


# ───────────────────────────────────────────────────────────────────── làm việc

def build(only: set[str] | None, force: bool):
    os.makedirs(OUT, exist_ok=True)
    rows, catalog, made, skipped = [], {}, 0, 0

    for sid, spec in SFX.items():
        if only and sid not in only:
            continue
        proc = dict(spec["proc"])
        seg = proc.pop("_seg", None)                  # ambience: độ dài vòng lặp
        files = []

        for n, src in enumerate(spec["sources"]):
            info = meta(src["fs"])
            name = f"{sid}.{n}.mp3"
            dst = os.path.join(OUT, name)
            rel = f"audio/sfx/{name}"

            if force or not os.path.exists(dst):
                raw = download(info)
                kw = dict(proc)
                kw["start"] = src.get("start", 0.0)
                kw["dur"] = src.get("dur", seg)
                if "gain" in src:
                    kw["gain"] = src["gain"]
                try:
                    st = process(raw, dst, os.path.join(TMP, sid), **kw)
                except Exception as e:
                    print(f"  !! {name}: {e}")
                    continue
                print(f"  + {name:<34} {st['seconds']:>6.2f}s  rms {st['rms_db']:>6.1f}dB  {st['bytes'] // 1024:>4} KB")
                made += 1
            else:
                skipped += 1

            files.append(rel)
            rows.append({
                "file": rel, "cue": sid, "title": info["title"], "author": info["author"],
                "license": info["license"], "license_url": info["license_url"],
                "source_url": info["page_url"], "attribution_required": "no",
                "notes": spec["desc"],
            })

        if files:
            catalog[sid] = {"bus": spec["bus"], "desc": spec["desc"], "files": files}

    return rows, catalog, made, skipped


def write_provenance(rows: list[dict]):
    """
    Ghi đè phần SFX, GIỮ NGUYÊN các dòng khác (nhạc CC BY đang nằm sẵn ở đây —
    đó là những dòng BẮT BUỘC ghi công, xoá là vi phạm giấy phép).
    """
    keep = []
    if os.path.exists(PROV):
        with open(PROV, newline="", encoding="utf-8") as f:
            keep = [r for r in csv.DictReader(f) if not r["file"].startswith("audio/sfx/")]
    cols = ["file", "cue", "title", "author", "license", "license_url", "source_url",
            "attribution_required", "notes"]
    with open(PROV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, cols)
        w.writeheader()
        for r in keep + sorted(rows, key=lambda r: r["file"]):
            w.writerow({c: r.get(c, "") for c in cols})


def write_catalog(catalog: dict):
    """
    `src/audio/catalog.json` — DANH MỤC MÁY SINH, đừng sửa tay.

    Game `import` thẳng file này, nên nó là chỗ duy nhất biết "id này có mấy biến
    thể, tên file là gì". Nhờ vậy thêm/bớt một biến thể chỉ là chạy lại tool, không
    phải nhớ sửa thêm một mảng ở đâu đó trong code — mà cái mảng-quên-sửa đó là
    kiểu hỏng âm thầm: game vẫn chạy, chỉ là biến thể thứ 5 không bao giờ phát.
    """
    os.makedirs(os.path.dirname(CATALOG), exist_ok=True)
    json.dump(catalog, open(CATALOG, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--force", action="store_true", help="làm lại cả những file đã có")
    p.add_argument("--only", default="", help="chỉ làm mấy id này, ngăn bằng dấu phẩy")
    p.add_argument("--clean", action="store_true", help="xoá public/audio/sfx trước khi làm")
    a = p.parse_args()

    if a.clean and os.path.isdir(OUT):
        shutil.rmtree(OUT)
    only = {s.strip() for s in a.only.split(",") if s.strip()} or None

    rows, catalog, made, skipped = build(only, a.force)
    if only:
        # Chạy một phần thì vẫn phải dựng lại SỔ cho đủ, không thì sổ mất các id khác.
        rows, catalog, _, _ = build(None, False)
    write_provenance(rows)
    write_catalog(catalog)

    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"\n{len(catalog)} id · {len(rows)} file · mới {made} · có sẵn {skipped} · tổng {total / 1048576:.1f} MB")
    print(f"sổ: {os.path.relpath(PROV, ROOT)} · danh mục: {os.path.relpath(CATALOG, ROOT)}")
