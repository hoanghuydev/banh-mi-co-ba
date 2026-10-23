/**
 * In ra hai khoá localStorage của một ván dựng sẵn, cho `tools/screenshot.mjs` nạp vào.
 *
 *   npx tsx tools/dev-save.ts --day 3 --tour done|THOT|… --stock 1 > /tmp/save.json
 */
import { Bus } from "../src/core/eventbus";
import { SaveService, newGame } from "../src/core/save";
import { memoryPlatform } from "../src/core/platform";
import { buy } from "../src/sim/econ";
import { tourSkip } from "../src/sim/tour";

const arg = (k: string, d: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const day = Number(arg("day", "1"));
const w = newGame("Bánh Mì Phương Anh", arg("seed", "shot"));
w.progress.dayIndex = day;
const tour = arg("tour", "on");
if (tour === "done") tourSkip(w);
else if (tour !== "on") w.flags.tour = tour;
if (arg("system", "linked") === "linked") { w.system.stage = "linked"; w.system.unlocked = day > 1; }
if (arg("stock", "1") === "1") {
  for (const g of ["BANH", "TRUNG", "PATE", "RAU", "OT", "SOT", "DO_CHUA_SAN"] as const) buy(w.inventory, g, 30, day);
}
for (const id of arg("equip", "").split(",").filter(Boolean)) {
  w.equipment.owned.push(id);
  w.equipment.installed.push(id);
}

const platform = memoryPlatform();
const svc = new SaveService(new Bus(false), () => w, platform);
svc.flushNow("QUIT");
const rows: Record<string, string> = {};
for (const k of platform.keys("byesep.")) rows[k] = platform.read(k)!;
process.stdout.write(JSON.stringify(rows));
