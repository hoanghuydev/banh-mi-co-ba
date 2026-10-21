// `npm run icons`: sinh SVG của HUD vào `public/art/` (file sinh ra được commit, build không gọi).
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib";

const OUT = join(ROOT, "public/art");

// Cỡ hiển thị thật do HUD quyết định (`EYE_W`/`EYE_H`).
const W = 72, H = 44, CX = W / 2, CY = H / 2;

// Làm tròn để khỏi ghi số kiểu `-7.199999999999999` vào file.
const n = (v: number) => +v.toFixed(2);

// Quả hạnh: hai cung bậc hai gặp nhau ở hai khoé, đỉnh cách tâm `b`.
const lens = (a: number, b: number) =>
  `M ${n(CX - a)} ${n(CY)} Q ${n(CX)} ${n(CY - 2 * b)} ${n(CX + a)} ${n(CY)} `
  + `Q ${n(CX)} ${n(CY + 2 * b)} ${n(CX - a)} ${n(CY)} Z`;

const circle = (x: number, y: number, r: number) =>
  `M ${n(x - r)} ${n(y)} a ${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0 a ${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0 Z`;

// Một path evenodd: mí ngoài − mí trong + tròng − đốm sáng.
const EYE = [
  lens(34, 19),
  lens(29.5, 14.6),
  circle(CX, CY, 10.6),
  circle(CX - 4.2, CY - 4.2, 3.3),
].join(" ");

// Hai file màu sẵn thay vì `setTint`, vì renderer canvas bỏ qua tint.
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
