// Dò bốn lớp lỗi lời thoại (xem `ten` bên dưới), in ra để sửa tay.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

type Node = {
  say?: string; reply?: string; act?: { kind: string }; then?: Node[]; ref?: string;
  flag?: string; onKept?: unknown;
};
type Talk = { id: string; npc: string; opener?: string; tree: Node[] };

const DIR = "src/content/talks";
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));

/** `\b` của JS tính theo ASCII nên không dùng sau chữ có dấu; dùng `(?![\p{L}])` với cờ `u`. */
const NHAN_LOI = /(cho|lấy|mua|bán|gói|làm|đổi|thêm)\s+(?:\S+\s+){0,2}?(?:một|hai|ba|[123])?\s*(ổ|cái|phần)(?![\p{L}])|lấy luôn|đổi (qua|sang|thành|lại)|(làm|lấy) (ổ )?đầy đủ|khỏi hỏi/iu;
/** Đòi đuôi mời ("đi/nghen…") để không bắt nhầm câu nói đá. */
const MOI_CHO = /((ngồi|đứng) (đây|đó|xuống|vô|lại)|vô đây|ghé vô|lại đây|đứng cho mát)[^.?!]*\b(đi|nghen|nha|được mà|chút)\b/i;
const MUA_VU = /\bmai\b|\bhôm qua\b|bữa trước|bữa nay như|như mọi khi|như thường|dạo này|lần trước|tuần rồi|hổm rày/i;
const HEN_MAI = /\bmai\b.*(ghé|qua|lấy|đem|trả|đưa)|(ghé|qua|lấy|đem|trả|đưa).*\bmai\b/i;

const ACT_HUA = new Set(["PROMISE", "PROMISE_DEED"]);
const ACT_DOI_CHO = new Set(["STAND_IN_SHADE", "THEY_SIT", "STEP_ASIDE", "INVITE"]);

const hit: Record<string, string[]> = { M1: [], M2: [], M3: [], M4: [] };
let nodes = 0;

for (const f of files) {
  const raw = JSON.parse(readFileSync(join(DIR, f), "utf8")) as { talks?: Talk[] };
  for (const t of raw.talks ?? []) {
    const diNgang = t.npc === "QUA_DUONG";
    const laKhach = t.npc === "WALKIN" || diNgang;
    const walk = (n: Node, path: string) => {
      nodes++;
      const o = `${t.id} · ${path}`;
      const noAct = !n.act;
      if (n.reply && NHAN_LOI.test(n.reply) && noAct && !n.then?.length && !n.ref)
        hit.M1.push(`${o}\n     mình: ${n.say}\n     họ:   ${n.reply}`);
      if (n.say && MOI_CHO.test(n.say) && !(n.act && ACT_DOI_CHO.has(n.act.kind)) && !n.then?.length)
        hit.M2.push(`${o}\n     mình: ${n.say}`);
      if (laKhach && diNgang && [n.say, n.reply].some((x) => x && MUA_VU.test(x)))
        hit.M3.push(`${o}\n     ${n.say ?? ""} / ${n.reply ?? ""}`);
      const ghi = !!n.flag || !!n.act || !!n.onKept;
      if (n.reply && HEN_MAI.test(n.reply) && !ghi && !(n.act && ACT_HUA.has((n.act as { kind: string }).kind)))
        hit.M4.push(`${o}\n     họ: ${n.reply}`);
      n.then?.forEach((c, i) => walk(c, `${path}.${i}`));
    };
    t.tree.forEach((n, i) => walk(n, `${i}`));
  }
}

const ten: Record<string, string> = {
  M1: "HỨA SUÔNG — nhận lời mà không có act",
  M2: "MỜI SUÔNG — mời dời chỗ mà không ai dời",
  M3: "SAI THÂN PHẬN — người đi ngang nói chuyện mùa vụ",
  M4: "HẸN MAI — hẹn hôm sau mà không ghi lời hứa",
};
for (const k of ["M1", "M2", "M3", "M4"]) {
  console.log(`\n=== ${k} ${ten[k]} — ${hit[k].length} chỗ ===`);
  for (const h of hit[k]) console.log("  " + h);
}
console.log(`\nquét ${nodes} nút / ${files.length} kho.`);
console.log(
  "\nCòn sót thì đọc kỹ trước khi sửa — mấy chỗ này đã soi và CHO QUA:\n"
  + "  · \"mai ghé nữa\" của người ngày nào cũng tới (chị Hà giao hàng, chú Quang) —\n"
  + "    game giữ được lời đó mà không cần ghi gì.\n"
  + "  · người lạ hẹn hôm sau: các dáng `walkin<dáng>` dùng chung cả ván,\n"
  + "    nên cái dáng đó CÓ quay lại thật.\n"
  + "  · câu nói đá kiểu \"chú đứng đây hai phút là con mất một khách\" không phải lời mời.",
);
