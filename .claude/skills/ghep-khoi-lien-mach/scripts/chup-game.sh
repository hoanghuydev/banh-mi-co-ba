#!/usr/bin/env bash
# Chụp cảnh quán phóng to ở 2732 px từ BẢN BUILD TĨNH (dev server tự tải lại trang mỗi lần có file đổi nên ảnh hay ra menu).
#   chup-game.sh ra_thu_muc x,y [x,y ...]     toạ độ thế giới (px thiết kế) để camera nhìn vào, xem `window.__game.scene.getScene('stall')`
# Chạy ở thư mục gốc dự án. Mỗi điểm một ảnh `diem-N.png`.
set -euo pipefail
out=$1; shift
mkdir -p "$out"
npx vite build --mode development --outDir /tmp/dist-ghep --emptyOutDir > /dev/null
(cd /tmp/dist-ghep && python3 -m http.server 5199 > /dev/null 2>&1 &) ; sleep 2
cam="window.__game.scene.getScene('stall').cameras.cameras[0]"
args=(--url http://localhost:5199/ --out "$out/cuoi.png" --save "$(npx tsx tools/dev-save.ts)" --wait 20000 --size 2732,1536)
args+=(--eval "(()=>{document.querySelector('.tg-skip')?.click();const c=$cam;c.stopFollow();c.setZoom(c.zoom*2.6);return 1})()")
i=0
for p in "$@"; do
  i=$((i + 1)); x=${p%,*}; y=${p#*,}
  args+=(--eval "$cam.centerOn($x,$y)" --wait-ms 8000 --shot "$out/diem-$i.png")
done
node tools/screenshot.mjs "${args[@]}"
pkill -f "http.server 5199" || true
