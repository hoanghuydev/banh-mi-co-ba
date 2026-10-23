import { newGame } from "../src/core/save";
import { HeadlessStall, POLICIES } from "../src/sim/headless";
import { DAY_END_MIN, DAY_START_MIN, fmtHhmm } from "../src/core/clock";
import { EXPRESS_FEE } from "../src/sim/shop";

/** Lãi gộp một ổ ốp la, hàng thường Fresh24 (docs/revamp/R0.7-PLAN.md §11). */
const LAI_O = 12_030;
const N = 400;
const LEADS = [30, 45, 60];

const arrivals: number[] = [];
for (let i = 0; i < N; i++) {
  const w = newGame("bot", `band-${i}`);
  w.progress.dayIndex = 6;
  for (const v of new HeadlessStall(w, POLICIES.greedy).service.upcoming) arrivals.push(v.at);
}
const perDay = arrivals.length / N;
/** Số khách trung bình một ngày trong khoảng [a, b). */
const between = (a: number, b: number) => arrivals.filter((t) => t >= a && t < b).length / N;

console.log(`${perDay.toFixed(1)} khách/ngày · ${N} seed · lãi gộp ${LAI_O.toLocaleString("vi")}₫/ổ · phí ${EXPRESS_FEE.toLocaleString("vi")}₫\n`);
for (const lead of LEADS) {
  const last = DAY_END_MIN - lead;
  console.log(`— hoả tốc ${lead} phút · đặt chót ${fmtHhmm(last)} —`);
  console.log("hết hàng   mất   cứu   lãi ròng");
  for (let t = DAY_START_MIN + 30; t <= last; t += 30) {
    const mat = between(t, t + lead);
    const cuu = between(t + lead, DAY_END_MIN);
    const net = cuu * LAI_O - EXPRESS_FEE;
    console.log(`${fmtHhmm(t)}     ${mat.toFixed(1).padStart(4)}  ${cuu.toFixed(1).padStart(4)}   ${(net / 1000).toFixed(0).padStart(5)}k`);
  }
  const hoa = [...Array(60).keys()].map((k) => DAY_START_MIN + 30 + k * 5)
    .filter((t) => t <= last && between(t + lead, DAY_END_MIN) * LAI_O >= EXPRESS_FEE).pop();
  console.log(`hoà vốn tới ${hoa ? fmtHhmm(hoa) : "—"}\n`);
}
