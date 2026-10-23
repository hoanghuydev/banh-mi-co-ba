#!/usr/bin/env python3
"""Nhạc nền: tải bản gốc theo PROVENANCE.csv về .cache/audio/music-src/, nén lại VBR ~64 kbps vào public/audio/music/."""
import csv, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)

from audioproc import decode, encode_mp3  # noqa: E402

SRC = os.path.join(ROOT, ".cache", "audio", "music-src")
BITRATE = 64


def main():
    os.makedirs(SRC, exist_ok=True)
    before = after = 0
    for r in csv.DictReader(open(os.path.join(ROOT, "public", "audio", "PROVENANCE.csv"), encoding="utf-8")):
        if not r["file"].startswith("audio/music/"):
            continue
        name = os.path.basename(r["file"])
        src = os.path.join(SRC, name)
        if not os.path.exists(src):
            req = urllib.request.Request(r["source_url"], headers={"User-Agent": "Mozilla/5.0"})
            with open(src, "wb") as f:
                f.write(urllib.request.urlopen(req, timeout=60).read())
        dst = os.path.join(ROOT, "public", r["file"])
        wav = os.path.join(SRC, name + ".wav")
        before += os.path.getsize(dst)
        decode(src, wav)
        encode_mp3(wav, dst, BITRATE)
        os.remove(wav)
        after += os.path.getsize(dst)
        print(f"  {name}  {os.path.getsize(dst) / 1e6:.2f} MB")
    print(f"{before / 1e6:.1f} MB -> {after / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
