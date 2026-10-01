/**
 * npm run icons — sinh icon vector của HUD vào `public/art/`.
 *
 * Icon HUD vẽ bằng CÔNG THỨC chứ không ngồi gõ toạ độ: hình quả hạnh là hai cung bậc
 * hai đối xứng, nét viền là hình lớn trừ hình nhỏ. Đổi một con số ở đây rồi chạy lại là
 * ra icon mới, còn sửa tay trong file SVG thì lần sau chạy lại mất hết.
 *
 * Không phải bước bắt buộc của build: file SVG sinh ra được commit, `npm run build`
 * không gọi tool này. Chạy lại khi nào đụng vào hình.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib";

const OUT = join(ROOT, "public/art");

/** Khung của con mắt. Cỡ hiển thị thật do HUD quyết định (`EYE_W`/`EYE_H` trong Hud.ts). */
const W = 72, H = 44, CX = W / 2, CY = H / 2;

/** Làm tròn 2 số lẻ — `36 - 2 * 21.6` trong IEEE754 ra `-7.199999999999999`, đừng ghi thế vào file. */
const n = (v: number) => +v.toFixed(2);

/** Hình quả hạnh: hai cung bậc hai gặp nhau ở hai khoé, đỉnh cách tâm đúng `b`. */
const lens = (a: number, b: number) =>
  `M ${n(CX - a)} ${n(CY)} Q ${n(CX)} ${n(CY - 2 * b)} ${n(CX + a)} ${n(CY)} `
  + `Q ${n(CX)} ${n(CY + 2 * b)} ${n(CX - a)} ${n(CY)} Z`;

/** Đường tròn bằng hai cung — path không có lệnh circle, phải ghép hai nửa. */
const circle = (x: number, y: number, r: number) =>
  `M ${n(x - r)} ${n(y)} a ${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0 a ${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0 Z`;

/**
 * MỘT path, `fill-rule="evenodd"`: mí ngoài, trừ mí trong ra nét viền, cộng tròng mắt
 * lại, trừ đốm sáng ra. Một path một màu thì đổi màu chỉ là đổi đúng một chỗ.
 */
const EYE = [
  lens(34, 19),
  lens(29.5, 14.6),
  circle(CX, CY, 10.6),
  circle(CX - 4.2, CY - 4.2, 3.3),
].join(" ");

/**
 * Hai bản màu SẴN chứ không để Phaser `setTint`: `Phaser.AUTO` rơi về renderer canvas
 * trên máy không có WebGL, mà canvas nuốt luôn tint — con mắt sẽ trắng trơn, biến mất
 * trên nền giấy của HUD. Hai file thì renderer nào cũng ra đúng màu.
 */
const ICONS: { name: string; color: string; path: string }[] = [
  { name: "eye-ink", color: "#222a31", path: EYE },
  { name: "eye-red", color: "#c0392b", path: EYE },
];

for (const { name, color, path } of ICONS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <!-- Sinh bởi tools/make-icons.ts — đừng sửa tay, chạy \`npm run icons\` lại. -->
  <path fill="${color}" fill-rule="evenodd" d="${path}"/>
</svg>
`;
  writeFileSync(join(OUT, `${name}.svg`), svg);
  console.log(`✓ public/art/${name}.svg`);
}
