#!/usr/bin/env python3
"""
Tra Freesound để KIẾM asset — bước làm một lần, không nằm trong build.

Chỉ nhận hai giấy phép:
  · CC0          — public domain, không nghĩa vụ gì
  · CC BY 4.0    — phải ghi tên tác giả ở nơi người chơi thấy (trang Giới thiệu)
Cố ý BỎ `Attribution NonCommercial` và `Sampling+`: game này bán.

    python3 tools/audio/fs_search.py "pour glass" --max 4
"""
import argparse, re, sys, time, urllib.parse, urllib.request

UA = "Mozilla/5.0 (ByeSep asset sourcing; hoanghuy@sepay.vn)"
BASE = "https://freesound.org/search/"

LICENSES = {
    "cc0": ('license:"Creative Commons 0"', "CC0 1.0", "https://creativecommons.org/publicdomain/zero/1.0/"),
    "by":  ('license:"Attribution"',        "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/"),
}

PLAYER = re.compile(r'<div\s+class="bw-player"(?P<attrs>[\s\S]{0,2000}?)tabindex=')
ATTR = re.compile(r'data-([a-z-]+)="([^"]*)"')


def fetch(url: str, retry: int = 4) -> str:
    for i in range(retry):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:
            if i == retry - 1:
                raise
            time.sleep(2.5 * (i + 1))        # 429 là chuyện thường, lùi rồi thử lại
    return ""


def preview(sound_id: str, user_id: str, quality="hq", ext="mp3") -> str:
    """Bản nghe thử của Freesound — công khai, không cần đăng nhập, 192 kbps."""
    return f"https://cdn.freesound.org/previews/{sound_id[:3]}/{sound_id}_{user_id}-{quality}.{ext}"


def search(q, dmin=0.0, dmax=30.0, lic="cc0", sort="Downloads (decreasing)", page=1, extra=""):
    filt = f"{LICENSES[lic][0]} duration:[{dmin} TO {dmax}]"
    if extra:
        filt += " " + extra
    url = BASE + "?" + urllib.parse.urlencode({"q": q, "f": filt, "s": sort, "page": page})
    out = []
    for m in PLAYER.finditer(fetch(url)):
        a = dict(ATTR.findall(m.group("attrs")))
        sid, uid = a.get("sound-id"), a.get("user-id")
        if not sid or not uid:
            continue
        out.append({
            "id": sid, "user": a.get("username", ""), "title": a.get("title", ""),
            "duration": round(float(a.get("duration") or 0), 2),
            "samplerate": a.get("samplerate", ""),
            "downloads": int(a.get("num-downloads") or 0),
            "license": lic,
            "page_url": f"https://freesound.org/s/{sid}/",
            "mp3": preview(sid, uid),
        })
    return out


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("query"); p.add_argument("--min", type=float, default=0.0)
    p.add_argument("--max", type=float, default=30.0); p.add_argument("--n", type=int, default=12)
    p.add_argument("--lic", default="cc0", choices=list(LICENSES))
    a = p.parse_args()
    for r in search(a.query, a.min, a.max, a.lic)[: a.n]:
        print(f'{r["id"]:>8} {r["duration"]:>6.2f}s {r["downloads"]:>7}dl  {r["title"][:60]:<60} @{r["user"]}')
