import { loadSettings } from "../core/save";
import { sfx } from "../audio/sfx";
import { fadeOut } from "./bootScreen";
import type Phaser from "phaser";

const SHUTTER_MS = 900;
const NIGHT_MS = 800;
const HOLD_MS = 700;
const FADE_MS = 700;

const el = (id: string) => document.getElementById(id) as HTMLElement | null;
const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const ms = (full: number) => (loadSettings().reducedMotion ? 0 : full);

export async function shutterDown(scene: Phaser.Scene) {
  sfx.play(scene, "sfx_cua_cuon");
  el("shutter")?.classList.add("down");
  await wait(ms(SHUTTER_MS));
}

export async function shutterUp(scene: Phaser.Scene) {
  sfx.play(scene, "sfx_cua_cuon");
  el("shutter")?.classList.remove("down");
  await wait(ms(SHUTTER_MS));
}

/** Cửa đã đóng: giữ một nhịp rồi mờ ra, không kéo lên. */
export async function shutterHold() {
  await wait(ms(HOLD_MS));
}

export async function shutterFade() {
  const shutter = el("shutter");
  if (!shutter) return;
  shutter.classList.add("fade");
  await wait(ms(FADE_MS));
  shutter.style.transition = "none";
  shutter.classList.remove("down", "fade");
  void shutter.offsetWidth;
  shutter.style.transition = "";
}

export async function nightIn(label: string) {
  const night = el("night");
  if (!night) return;
  night.textContent = label;
  night.classList.add("on");
  await wait(ms(NIGHT_MS) + 500);
}

/** Cảnh quán dựng xong: ngủ dậy thì đổi màn đêm sang cửa cuốn rồi kéo lên, còn lại thì mờ màn mở. */
export function reveal(scene: Phaser.Scene) {
  const night = el("night"), shutter = el("shutter");
  if (!night?.classList.contains("on") || !shutter) { fadeOut(); return; }
  night.style.transition = shutter.style.transition = "none";
  shutter.classList.add("down");
  night.classList.remove("on");
  void shutter.offsetWidth;
  night.style.transition = shutter.style.transition = "";
  void shutterUp(scene);
}
