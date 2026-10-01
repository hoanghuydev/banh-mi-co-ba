#!/usr/bin/env python3
"""Nhiều truy vấn một lượt, TUẦN TỰ có nghỉ (bắn song song là ăn 429 ngay)."""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fs_search import search

GAP = 1.0


def run(specs, lics=("cc0", "by")):
    for spec in specs:
        label, q, dmin, dmax, n = spec[:5]
        print(f"\n### {label}  <- {q!r}  [{dmin}–{dmax}s]", flush=True)
        for lic in lics:
            try:
                rows = search(q, dmin, dmax, lic)[:n]
            except Exception as e:
                print(f"  {lic}: !! {e!r}", flush=True); continue
            for r in rows:
                print(f'  {lic:<3} {r["id"]:>8} {r["duration"]:>6.2f}s {r["downloads"]:>7}dl  {r["title"][:56]:<56} @{r["user"]}', flush=True)
            time.sleep(GAP)
