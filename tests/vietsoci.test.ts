import { test } from "node:test";
import assert from "node:assert/strict";
import { newGame } from "../src/core/save";
import { guestsOf } from "../src/sim/demand";
import { isRain, weatherOf } from "../src/sim/econ";
import { CLIP_REACH, FEED_MAX, dailyTin, feedPosts, filmedToday, postClip } from "../src/sim/vietsoci";
import { filmChannels, visibleOptions, type Talk, type TalkNode } from "../src/sim/talk";
import SU from "../src/content/talks/be-su.json";
import CONTENT from "../src/content/vietsoci.json";
import { existsSync } from "node:fs";

const game = (seed = "vs-1") => {
  const w = newGame("t", seed);
  w.progress.dayIndex = 6;
  return w;
};

test("clip dơ của anh review kéo 5 đánh giá 1★, rải sau lúc quay, và Huy nhắn link", () => {
  const w = game();
  postClip(w, { channel: "review", state: "ruoi" }, 400);
  const q = w.reviews.queue;
  assert.equal(q.length, CLIP_REACH.review.reviews.ruoi);
  assert.ok(q.every((p) => p.r.stars === 1 && p.r.noise === "clip" && p.at > 400));
  const link = w.phone.threads.flatMap((t) => t.msgs).find((m) => m.link);
  assert.equal(link?.link, w.vietsoci.posts[0].id);
  assert.equal(link?.from, "huy");
});

test("clip sạch thêm khách đúng ngày mai, không đụng hôm nay", () => {
  const w = game();
  const today = guestsOf(w);
  const before = guestsOf(w, 7);
  postClip(w, { channel: "su", state: "sach" }, 400);
  assert.equal(guestsOf(w), today);
  assert.equal(guestsOf(w, 7), before + CLIP_REACH.su.boost);
  assert.ok(w.reviews.queue.every((p) => p.r.stars === 5));
});

test("Hệ thống chỉ báo khi người chơi đã kết nối", () => {
  const w = game();
  assert.equal(postClip(w, { channel: "su", state: "sach" }, 400).system, null);
  w.system.stage = "linked";
  w.progress.dayIndex = 7;
  assert.match(postClip(w, { channel: "su", state: "sach" }, 400).system ?? "", /\+1/);
});

test("mỗi kênh một clip mỗi ngày: quay rồi thì ẩn cuộc xin quay và lựa chọn rủ quay", () => {
  const w = game();
  const talks = (SU as { talks: Talk[] }).talks;
  const film = talks.filter((t) => filmChannels(t).includes("su"));
  assert.ok(film.length >= 2);
  assert.equal(filmedToday(w, "su"), false);
  postClip(w, { channel: "su", state: "sach" }, 400);
  assert.equal(filmedToday(w, "su"), true);
  assert.equal(filmedToday(w, "review"), false);
  const nodes: TalkNode[] = [
    { say: "quay đi", tone: "THUONG", reply: "dạ", act: { kind: "FILM", forSec: 20, channel: "su" } },
    { say: "thôi", tone: "THUONG", reply: "dạ" },
  ];
  const shown = visibleOptions(nodes, { flags: {}, filmed: (ch) => filmedToday(w, ch) });
  assert.deepEqual(shown.map((o) => o.say), ["thôi"]);
});

test("bảng tin chỉ có 20 bài; bài cũ có link thì vẫn giữ, không link thì bỏ", () => {
  const w = game();
  for (let d = 0; d < 25; d++) {
    w.progress.dayIndex++;
    postClip(w, { channel: "review", state: "tay" }, 400);
  }
  const oldest = Math.min(...w.vietsoci.posts.map((p) => p.id));
  assert.equal(feedPosts(w).length, FEED_MAX);
  assert.ok(!feedPosts(w).some((p) => p.id === oldest));
  assert.equal(w.vietsoci.posts.length, 25, "bài có link trong tin nhắn phải còn để mở");
  w.phone.threads = [];
  w.progress.dayIndex++;
  dailyTin(w);
  postClip(w, { channel: "su", state: "sach" }, 400);
  assert.ok(w.vietsoci.posts.length <= FEED_MAX + 1);
});

test("tin mưa chỉ lên ngày mưa; tin trend thêm khách đúng hôm đăng", () => {
  const w = game("vs-tin");
  let rainPosted = false, boosted = false;
  for (let d = 1; d <= 120; d++) {
    w.progress.dayIndex = d;
    const before = guestsOf(w);
    const p = dailyTin(w);
    if (p?.tin === "mua-chieu-thanh-song") {
      rainPosted = true;
      assert.ok(isRain(weatherOf(d)), `ngày ${d} không mưa mà đăng tin mưa ngập`);
    }
    if (p?.tin === "trend-ghe-nhua-an-sang") {
      boosted = true;
      assert.equal(guestsOf(w), before + 2);
    }
  }
  assert.ok(rainPosted && boosted, "120 ngày mà chưa gặp đủ hai tin để kiểm");
});

test("mọi ảnh bài VietSoci đều có file thật", () => {
  const want = [
    ...(CONTENT as { tin: { anh: string }[] }).tin.map((t) => t.anh),
    "clip_sach", "clip_ruoi", "clip_tay",
  ];
  for (const n of want) assert.ok(existsSync(`public/art/vietsoci/${n}.webp`), `thiếu public/art/vietsoci/${n}.webp`);
});
