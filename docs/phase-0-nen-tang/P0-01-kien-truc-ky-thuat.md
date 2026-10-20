# P0-01 — Kiến trúc kỹ thuật

> ## ⚡ REVAMP 2026-10-20 — ⚠️ CHẾT MỘT PHẦN
> Căn cứ: [`CANON.md`](../CANON.md) bản revamp. Phần ☠️ không dùng làm căn cứ.
>
> | Mục | Trạng thái | Lý do / thay bằng |
> |---|---|---|
> | §2.2 Thư mục: `sim/memory`, `sim/gossip`, `ui/notebook` | ☠️ | Trí nhớ, đồn thổi, sổ tay chết (CANON §2, §12) |
> | §2.2 `sim/reputation` (3 bucket) · §3 `RelTier` | ☠️→🔁 | Hết quan hệ ngầm → module sao/review, thêm `ui/phone` (R4) |
> | §2.3 `MarketScene` · payload chợ | 🔁 | Đi chợ → đặt nhà cung cấp 3 mức chất lượng (R3) |
> | §2.3 `EveningScene` (ghi sổ tay, `newGossip`, `notebookPrompts`) · nhánh `dayIndex === 40` "kết mùa" · cảnh mở đầu | ☠️ | Sổ tay, đồn thổi, mùa 40 ngày chết. Kết = thắng tiền / thua ATTP (R4–R5) |
> | §2.3 `expectedNpcs` từ `sim/schedule` | 🔁 | Số khách theo `Y(x)` × hệ số sao (R5) |
> | §2.5 EventMap: nhóm `memory:*`, `gossip:*`, `relationship:*`, `notebook:*` · con số "44 event" (§6) | ☠️ | Gỡ khi phase chạm tới; thêm event review/sao (R4) |
> | §2.6 Bubble pool 8 (2 slot cho nghe lỏm) | ⏳ | Nghe lỏm chết, đo lại kích thước pool |
> | §3 `StimId`: `WRONG_NAME`, `REMEMBERED_USUAL`, `REMEMBERED_STORY` · `world` chứa gossip/sổ tay · `coreMemorySeed` · `gossipEnabled` | ☠️ | Còn 8 sự kiện (CANON §3) |
> | §3 `AttentionTool` `CO_BA`, `NpcId` `CO_BA` · `ba_bay.json` `coreMemorySeed` bất hoà với cô Ba | ☠️ | Bỏ hẳn nhân vật Cô Ba (R0.5) |
> | §2.3 Cảnh mở đầu (P4) · §3 `NpcId` · `budget`/ngày | 🔁 / ⏳ | Màn giới thiệu kể qua điện thoại, nhân vật Phương Anh (R0.5); tên NPC đổi R6; vốn/chi phí mô phỏng lại R2/R5 |
> | §6 "chạy 40 ngày headless < 20 s" | 🔁 | Headless vẫn cần cho `tools/sim.ts`, không còn mốc 40 ngày |
>
> **Còn dùng được:** gỡ Colyseus, luật không import `phaser` trong `sim/`, cấm `Math.random()`, vòng đời frame, render/đóng gói/hiệu năng, `DayScene` thường trực — nền cho mọi phase R.

**Thuộc phase:** P0 — Nền tảng
**Phụ thuộc:** `CANON.md` §2 (định danh kỹ thuật), §3 (11 sự kiện), §5 (perception), §11 (rule DB), §15 (trợ năng), §16 (ba thứ đừng làm) · `P0-02` (clock / rng / save) · `P0-03` (telemetry & dev tools)
**Trạng thái:** **Chốt** — trừ các dòng gắn nhãn *Cần đo* ở §5

---

## 1. Mục tiêu

Dựng bộ khung kỹ thuật để **T1** (khách chấm quá trình) và **T5** (attention nhìn thấy được) có chỗ chạy: mọi sai sót người chơi gây ra phải phát thành một `stim` **trong cùng frame** nó xảy ra, và tầng perception phải đọc được `stim` đó **trước khi** NPC quyết định nét mặt của frame kế.

Đồng thời gỡ toàn bộ Colyseus/server/netcode khỏi v1 theo HT5 và §23, để không gánh chi phí hosting vĩnh viễn cho một game một người chơi, và để **ngày server chết không phải là ngày game chết**.

Kiến trúc chốt: **Phaser 3 + Vite + TypeScript, client-only, offline-first** (CANON §2).

---

## 2. Cơ chế

### 2.1. Gỡ Colyseus — cái gì xoá, cái gì giữ

**Lý do (HT5, §23):**
- Colyseus cho game 1 người = **tiền hosting vĩnh viễn** + ngày server chết là ngày game chết.
- *"'netcode đã có' là câu nói của người chưa ship multiplayer"* — xoá khỏi pitch deck.
- Bằng chứng số từ cộng đồng VN: cùng dev, cùng hype — *Bad Parenting* 97% tích cực → *Night Shippers* (co-op 8 người) tụt xuống **76%**.
- §12.4 của `idea.md` vẫn đúng về mặt kỹ thuật ("netcode đã có, để sau") nhưng **Phần III thắng khi mâu thuẫn** (CANON §0 dòng nguồn gốc): cắt khỏi v1 **và** khỏi pitch deck.

**Hiện trạng thật của `OnlineGameTest/` (đã đọc từng file):**

| File | Dòng | Nội dung thật | Phán quyết |
|---|---|---|---|
| `server/src/index.ts` | 16 | `@colyseus/core` + `WebSocketTransport`, listen :2567 | **Đóng băng → `_archive/netcode-v2/`** |
| `server/src/CozyRoom.ts` | 182 | Authoritative sim 30Hz, patchRate 50ms, `isBlocked()`, trồng/tưới cây, chat broadcast | **Đóng băng** |
| `server/src/schema.ts` | 38 | `@colyseus/schema` — Player / Plant / WorldState | **Đóng băng** |
| `tools/bots.mjs` | — | Bot test headless cho netcode | **Đóng băng** |
| `client/src/net.ts` | 16 | `Client.joinOrCreate("cozy")`, `getStateCallbacks` | **XOÁ** |
| `client/src/main.ts` | 55 | Lobby HTML (chọn tên + skin) → `connect()` → `new Phaser.Game` | **Viết lại** — bỏ lobby, bỏ `connect()`, vào thẳng `BootScene` |
| `client/src/GameScene.ts` | 374 | Render + prediction + reconcile + lerp + bake nền + bubble + emote | **Mổ xẻ** — xem bảng tài sản bên dưới |
| `client/src/iso.ts` | 43 | `toScreen()`, `depthOf()`, `PALETTE`, `isBlocked()`, `isWater()`, `WORLD=24` | **Giữ một nửa** |
| `client/src/art.ts` | 157 | Vẽ sprite bằng `Graphics` → `generateTexture()` | **Giữ nguyên tư duy**, đổi nội dung |
| `client/vite.config.ts` | — | `server: { host: true, port: 5173 }` | **Giữ** (test từ điện thoại cùng wifi) |
| `client/index.html` | — | DOM overlay: `#hud`, `#stat`, `#log`, `#chat`, `#hint` | **Giữ mô hình, đổi nội dung** |
| `package.json` (root) | — | `workspaces: ["server","client"]`, script `dev` chạy song song, `concurrently` | **Viết lại** — bỏ workspace, một package duy nhất |
| `client/package.json` | — | dep `@colyseus/sdk@^0.18.4` | **Gỡ dependency** |

**Kế hoạch gỡ — 6 bước, làm đúng thứ tự (mỗi bước phải build xanh trước khi sang bước sau):**

```
B1  git mv OnlineGameTest/server              _archive/netcode-v2/server
    git mv OnlineGameTest/tools/bots.mjs      _archive/netcode-v2/bots.mjs
    → thêm _archive/netcode-v2/README.md: "Đóng băng 29/09/2026 theo CANON §2.
      Đây là tài sản cho v2 co-op, KHÔNG build, KHÔNG nằm trong tsconfig, KHÔNG đưa vào pitch."
    → thêm _archive/** vào .npmignore + loại khỏi tsconfig "include"

B2  Xoá client/src/net.ts. Sửa main.ts: bỏ lobby, bỏ connect(), bỏ (window as any).cozy.
    npm rm @colyseus/sdk                  → client không còn socket nào

B3  Mổ GameScene.ts thành 3 mảnh (xem bảng tài sản), xoá phần prediction/reconcile/lerp.
    GameScene.ts biến mất khỏi repo — không rename, để lịch sử git rõ ràng.

B4  Cắt iso.ts: giữ TW/TH/toScreen/depthOf. Xoá WORLD, isBlocked, isWater
    (chúng tồn tại chỉ để khớp 1:1 với server — không còn server thì không còn lý do).
    PALETTE pastel → thay bằng bảng màu CANON §14: xanh xám + nắng gắt trắng.

B5  Gộp workspace: một package.json duy nhất ở gốc repo game mới.
    Bỏ "workspaces", bỏ concurrently, bỏ script "server"/"bots".
    scripts: dev / build / preview / test / validate:rules / lint:lines / build:electron

B6  Dựng cấu trúc thư mục §2.2 + BootScene rỗng chạy được.
    Cổng: `grep -ri colyseus src/ | wc -l` phải ra **0**.
```

**Tài sản kỹ thuật giữ lại — đây là phần đáng tiền nhất của prototype, không được vứt:**

| Tài sản | Nguồn | Dùng lại ở đâu |
|---|---|---|
| **Bake nền vào 1 RenderTexture** bằng `beginDraw / batchDrawFrame / endDraw` | `GameScene.drawGround()` | `render/background.ts`. Prototype đã chứng minh: 576 ô → **1 draw call**; gọi `drawFrame()` 576 lần riêng lẻ **treo tab vài giây**. Đây là bài học đắt nhất trong repo |
| **Phép chiếu iso 2:1** `toScreen()` + `depthOf() = (wx+wy)*1000` | `iso.ts` | `render/iso.ts` — quầy hàng vẫn 2.5D |
| **Sprite vẽ bằng code → `generateTexture()`** | `art.ts` | `render/placeholder.ts` — giữ làm pipeline placeholder cho tới khi artist giao asset. Đổi 1 hằng số màu là cả game đổi tone: rất hợp lúc thử bảng màu §14 |
| **DOM overlay cho toàn bộ UI chữ** | `index.html` `#hud/#log/#stat` | `ui/` — **quyết định giữ có chủ đích**: CANON §15.1 đòi cỡ chữ 4 mức + hộp thoại tự giãn khi chữ ≥200%. CSS làm việc đó miễn phí; `Phaser.GameObjects.Text` phải tự tính lại wrap từng lần |
| **Bubble có đuôi tam giác + tween `Back.out`** | `GameScene.showBubble()` | `ui/stall/bark.ts` — nhưng **phải pool lại**, xem §2.6 |
| **`vite.config` `host: true`** | `vite.config.ts` | Giữ — cần test cảm giác chạm trên điện thoại thật ngay từ P0 dù mobile là v2 |
| **Kỷ luật "client vẽ đúng cái server nói"** | README | Đổi thành: **hệ mô phỏng và hệ render tách bạch**. `sim/` không được import `phaser`. Cổng CI: `grep -r "from \"phaser\"" src/sim src/dialog src/econ` phải ra 0 |

**Tài sản đóng băng cho v2 (không xoá, không build):** authoritative sim loop 30Hz + patch 20Hz, `@colyseus/schema` delta-encode, bot test headless. Khi nào mở lại: **sau khi bán 30k bản** (CANON §2, mobile/v2), và chỉ cho **co-op 2 người một xe**, không phải server thế giới chung.

> ⚠️ Kỷ luật: từ nay pitch deck, Steam page, README **không được chứa chữ "multiplayer", "co-op", "netcode"**. Một dòng "sẽ có co-op sau" đủ để publisher trừ điểm và để người mua kỳ vọng sai.

---

### 2.2. Cấu trúc thư mục — trách nhiệm từng module

Đường dẫn lấy nguyên từ CANON §2. Mọi doc khác dùng đúng các đường dẫn này.

```
client/src/
  core/        clock.ts  rng.ts  save.ts  eventbus.ts  flags.ts
  sim/         perception.ts  memory.ts  gossip.ts  reputation.ts  schedule.ts
  dialog/      ruledb.ts  query.ts  shufflebag.ts  barks.ts
  craft/       recipe.ts  assembly.ts  diff.ts  equipment.ts
  econ/        market.ts  inventory.ts  supplier.ts  ledger.ts  obligations.ts
  content/     npcs/  rules/  lines/  days/  recipes/
  ui/          stall/  notebook/  market/  settings/
  scenes/      BootScene  DayScene  StallScene  MarketScene  EveningScene
```

| Module | Chịu trách nhiệm | KHÔNG được làm |
|---|---|---|
| `core/clock.ts` | Nguồn thời gian **duy nhất**. Quy đổi phút thật ↔ giờ game, `timeScale` theo khung giờ, cờ `paused`. Mọi hệ lấy `dt` từ đây, **không ai được đọc `delta` của Phaser** | Không biết gì về NPC, không tự pause |
| `core/rng.ts` | `seed = hash(saveId, dayIndex)`, tách stream theo hệ. Mọi số ngẫu nhiên đi qua đây | Không được gọi `Math.random()` ở bất kỳ đâu khác trong repo — có lint rule |
| `core/save.ts` | Serialize/deserialize, autosave sau mỗi khách, migration theo `schemaVersion`, double-buffer A/B | Không biết cấu trúc nội bộ của từng hệ — mỗi hệ tự nộp `toJSON()/fromJSON()` |
| `core/eventbus.ts` | Bus đồng bộ, typed, **có thứ tự phát định trước**. Xương sống nối mọi hệ (§2.5) | Không async, không promise. Sự kiện trong frame phải xong trong frame |
| `core/flags.ts` | Cờ trợ năng (6 công tắc §15), cờ dev-build, cờ nội dung đã mở khoá | Không chứa state chơi |
| `sim/perception.ts` | `certainty` tích luỹ theo công thức CANON §5, 4 state, bảng `visibility` tĩnh. **Duyệt từ phía SỰ KIỆN** | Không roll xúc xắc mỗi frame (Đừng-2). Không mô phỏng viewcone |
| `sim/memory.ts` | 3 tầng slot (short 6–8 / long 3–4 / core 1), ghi đè theo `intensity` thấp nhất, decay tapering có sàn, chồng chất `0.75^(n-1)` | Không tự sinh memory — chỉ nhận `perception:confirmed` |
| `sim/gossip.ts` | Tick 1 lần/ngày, mutation graph author tay, hop cap 2–3, `confidence *= 0.7–0.85`, truy vết nguồn | **Không được chạm vào hệ quả** (Đừng-3): đổi thoại/dáng/món/tip/thứ tự đến thì được; đổi công thức có ra đúng món không thì không |
| `sim/reputation.ts` | 3 bucket Rival/Acquaintance/Friend, bất đối xứng, sàn theo tier | **Không xuất ra UI dưới dạng số** (T3) |
| `sim/schedule.ts` | Lịch sinh hoạt 12 NPC, giờ đến, ngày nghỉ, arc (chú Tư biến mất ~ngày 30) | Không mô phỏng đời sống ngoài quầy (Đừng-1) |
| `dialog/ruledb.ts` | Load + index rule, `score = criteria.length` tính sẵn lúc load, sort criteria theo alphabet | Không chứa logic chọn |
| `dialog/query.ts` | Walk tuyến tính + early reject, chọn rule điểm cao nhất, `applycontext`, `followup` tra **lúc callback** | Không được chạy quá 1 query/frame (§2.4) |
| `dialog/shufflebag.ts` | Bag theo `(ruleId, responseId)`, persist qua save | — |
| `dialog/barks.ts` | Bark 3 tầng + cooldown tier-1, luật **35% im lặng**, delay phản ứng ngẫu nhiên **0,2–0,4s** | — |
| `craft/recipe.ts` | Định nghĩa công thức + preset nhà | — |
| `craft/assembly.ts` | Trạng thái ổ bánh đang làm, thao tác, **nơi phát ra phần lớn `stim`** | — |
| `craft/diff.ts` | Delivery-time diff (CANON §6), `take(1)`, `silentScore` | — |
| `craft/equipment.ts` | Thiết bị đã mua, ảnh hưởng tốc độ/chất lượng | — |
| `econ/*` | Giá chợ có pattern, kho + hạn dùng, nhà cung cấp (tái dùng engine tính cách), sổ cái, nghĩa vụ định kỳ | — |
| `content/` | **JSON thuần, không code.** NPC, rule, dòng thoại, kịch bản ngày, công thức | Không import module nào |
| `ui/` | DOM + Phaser layer hiển thị. Đọc state, phát intent | **Không được tự thay đổi state** — chỉ phát event |
| `scenes/` | Vòng đời Phaser, layout, nối `ui/` với `core/sim/` | Không chứa luật chơi |

**Quy tắc phụ thuộc một chiều (kiểm bằng CI):**

```
content/  →  (không phụ thuộc ai)
core/     →  content/
sim/ dialog/ craft/ econ/  →  core/ + content/
ui/ scenes/                →  tất cả
```
`sim/`, `dialog/`, `craft/`, `econ/` **không được import `phaser`**. Lý do thật: để chạy được 40 ngày headless trong 20 giây khi tune cân bằng (xem `P0-03` §2.3).

---

### 2.3. Scene Phaser — danh sách và state machine

| Scene | Vai trò | Vòng đời |
|---|---|---|
| `BootScene` | Load font, atlas, `content/*.json`; đọc save; chạy migration; dựng `GameContext` | Chạy **một lần**, rồi `stop()` chính mình |
| `DayScene` | **Khung ngày.** Không vẽ gameplay. Sở hữu `GameContext`, chạy `clock`, điều phối scene con, vẽ header ngày (ngày mấy / giờ / thời tiết / tiền) | **Chạy suốt từ lúc boot tới lúc thoát.** Không bao giờ restart |
| `MarketScene` | Đi chợ sáng. Theo **lượt**, đồng hồ không trôi | `launch` → `stop` |
| `StallScene` | Bán. Đây là 90% giá trị của game | `launch` → `stop` |
| `EveningScene` | Đếm tiền, ghi sổ tay, một cảnh yên tĩnh | `launch` → `stop` |

**Vì sao `DayScene` là scene thường trực chứ không phải một scene nữa trong hàng đợi:** nếu `GameContext` (clock, rng stream, state 12 NPC) sống trong scene bị `stop()`, mỗi lần chuyển cảnh phải serialize/deserialize toàn bộ — tốn, và là **nguồn bug tất định**: chỉ cần quên một field thì seed lệch, mà seed lệch thì cơ chế chống save-scum (§8e) hỏng âm thầm. Để `DayScene` giữ context, scene con chỉ nhận **intent**.

```
                  ┌──────────────┐
                  │  BootScene   │  load + migrate save
                  └──────┬───────┘
                         │ ctx sẵn sàng
                  ┌──────▼───────┐
      ┌──────────►│   DayScene   │  (thường trực — sở hữu ctx)
      │           └──┬───┬───┬───┘
      │      MORNING │   │   │ EVENING
      │              │   │ SELLING
      │        ┌─────▼┐ ┌▼───────┐ ┌▼──────────┐
      │        │Market│ │ Stall  │ │ Evening   │
      │        └─────┬┘ └┬───────┘ └┬──────────┘
      │  market:done │   │stall:closed│evening:done
      └──────────────┴───┴───────────┘
                         │ dayIndex === 40
                  ┌──────▼───────┐
                  │ EveningScene │ biến thể "kết mùa" (P4, chưa dựng ở P0)
                  └──────────────┘
```

**Điều kiện chuyển:**

| Từ | Sự kiện | Tới | Điều kiện phụ |
|---|---|---|---|
| `BootScene` | `boot:ready` | `DayScene` + `MarketScene` | Save mới → chèn cảnh mở đầu (P4) |
| `MarketScene` | `market:done` | `StallScene` | Kho đã chốt, ngân sách đã trừ, `econ:stockChanged` đã phát |
| `StallScene` | `stall:closed` | `EveningScene` | Đồng hồ ≥ 11:00 **hoặc** hết hàng **hoặc** người chơi dẹp sớm (bị phạt §8l) |
| `EveningScene` | `evening:done` | `MarketScene` (ngày +1) | `gossip` tick đã chạy, `memory` đã promote, autosave đã ghi xong |
| Bất kỳ | `ui:pauseToggled` | — | Không đổi scene. Pause là cờ của `clock`, không phải scene (CANON §15.2) |

**Dữ liệu truyền giữa scene — typed, hẹp, một chiều:**

```ts
// Không truyền GameContext qua scene data. Scene con nhận ctx qua injection
// lúc DayScene.launch(), và chỉ nhận thêm đúng một payload mô tả Ý ĐỊNH.
type ScenePayload = {
  MarketScene:  { dayIndex: number; budget: number; hints: DemandHint[]; weather: Weather }
  StallScene:   { dayIndex: number; standPoint: StandPointId; weather: Weather
                  stock: StockSnapshot; presets: RecipePreset[]      // tối đa 3, §22.1
                  expectedNpcs: NpcId[] }                            // từ sim/schedule
  EveningScene: { dayIndex: number; ledger: DayLedger
                  newGossip: GossipCard[]                            // cái người chơi NGHE LỎM được
                  notebookPrompts: NotebookPrompt[] }
}

// Trả về: KHÔNG dùng giá trị trả về của scene. Scene con phát event, DayScene nghe.
// 'market:done'  { spent: number; bought: LineItem[] }
// 'stall:closed' { reason: 'CLOCK'|'SOLD_OUT'|'PLAYER'; served: number; revenue: number }
// 'evening:done' { dayIndex: number }
```

---

### 2.4. Vòng đời một frame ở `StallScene`

Thứ tự **bắt buộc**, không được đổi:

```ts
update(_time: number, rawDelta: number) {
  // 0 ── CLOCK GATE ────────────────────────────────────────────── ~0,2 ms
  const dt = ctx.clock.advance(rawDelta);      // trả 0 khi pause
  if (dt === 0) { this.renderer.syncPaused(); return; }

  // 1 ── INPUT ─────────────────────────────────────────────────── ~0,5 ms
  //     drain hàng đợi tap/drag; giải quyết "chạm-để-đặt"; nút Hoàn tác
  const intents = this.input.drain();

  // 2 ── ASSEMBLY / CRAFT ──────────────────────────────────────── ~1,5 ms
  //     áp intent lên ổ bánh đang làm → PHÁT stim ngay trong frame này
  craft.apply(intents, dt);                    // bus.emit('stim:emitted', …)

  // 3 ── PERCEPTION TICK ───────────────────────────────────────── ~2,0 ms
  //     duyệt từ phía SỰ KIỆN: for stim in activeStims → for npc in canSee(stim)
  perception.tick(dt);                         // bus.emit('perception:stateChanged', …)

  // 4 ── NPC STATE ─────────────────────────────────────────────── ~1,5 ms
  //     kiên nhẫn, mood, gaze, slot hàng chờ, lịch đến/đi, bộ đếm rời quầy
  npc.tick(dt);

  // 5 ── DIALOG QUEUE ──────────────────────────────────────────── ~3,0 ms (amortized)
  //     tối đa 1 rule-query mỗi frame; bark queue; delay 0,2–0,4 s
  dialog.tick(dt);

  // 6 ── RENDER SYNC ───────────────────────────────────────────── ~8,0 ms
  //     đồng bộ sprite/mặt/bubble theo state vừa tính. KHÔNG đọc input, KHÔNG đổi state
  this.renderer.sync(dt);
}
```

**Vì sao đúng thứ tự đó — từng cặp một:**

| Cặp | Nếu đảo thì sao |
|---|---|
| **input → assembly** | Đảo lại thì thao tác của người chơi trễ 1 frame = 33 ms. Với tay kéo–thả, 33 ms là khoảng "dính tay" cảm nhận được |
| **assembly → perception** | **Đây là cặp quan trọng nhất của cả game.** `stim` phải được phát *trước* khi perception duyệt, nếu không mọi sự kiện trễ đúng 1 frame. Ở 30fps, `DROPPED_FOOD` cần ~1,4 s để `CONFIRMED` (CANON §5) = 42 frame; trễ 1 frame chỉ là 2,4% — nhưng thứ tự sai sẽ khiến **frame cuối cùng trước khi khách ngẩng đầu lên** tính sai, và đó chính là frame người chơi đang nín thở nhìn. T1 sống chết ở chỗ này |
| **perception → npc state** | NPC state đọc `certainty` để chọn nét mặt và mức kiên nhẫn. Đọc giá trị của frame trước = mặt NPC luôn chậm hơn hệ perception 1 frame, và người xem clip sẽ thấy "bả nhíu mày sau khi chữ `?` tắt" |
| **npc state → dialog** | `query.ts` đọc blackboard `Customer` (mood, memory, visitCount) và `Session` (thời gian chờ). Blackboard phải là của frame hiện tại, nếu không rule "khách đang bực" thắng ở frame mà khách vừa hết bực |
| **dialog → render** | Render là **read-only**. Đây là ranh giới kỷ luật: nếu render được phép đổi state thì không ai debug nổi tại sao mặt NPC đổi |
| **clock ở bước 0** | Pause phải đóng băng **cả sự kiên nhẫn của khách** (CANON §15.2). Cách duy nhất chắc chắn: một điểm trả `dt = 0`, mọi hệ dưới nó tự đứng im. Không có hệ nào được tự hỏi "có đang pause không" |

**Ngân sách ms ở 30 fps** — ngân sách frame là **33,3 ms**. Mục tiêu: logic ≤ **9 ms**, render ≤ **8 ms**, tổng ≤ **17 ms**, chừa ~16 ms cho GC, trình duyệt, tween engine của Phaser và máy yếu.

| # | Bước | Ngân sách | Trần cứng | Tại sao đủ |
|---|---|---|---|---|
| 0 | Clock gate | 0,2 ms | 0,5 | Vài phép nhân |
| 1 | Input | 0,5 ms | 1,0 | ≤ 4 intent/frame |
| 2 | Assembly | 1,5 ms | 3,0 | ≤ 1 ổ bánh đang làm, ≤ 12 thành phần |
| 3 | Perception | 2,0 ms | 4,0 | ≤ 8 `stim` sống × ≤ 6 NPC = **48 cặp**, mỗi cặp là 1 tra bảng + 4 phép nhân. Bảng `visibility` là O(1) — đây là lý do CANON §5 chọn bảng tra thay vì viewcone |
| 4 | NPC state | 1,5 ms | 3,0 | ≤ 6 NPC tại quầy |
| 5 | Dialog queue | 3,0 ms | 6,0 | **Trần cứng 1 rule-query/frame.** Nếu có 2 yêu cầu cùng frame → hoãn cái thứ hai. Miễn phí về mặt cảm nhận: delay phản ứng vốn đã ngẫu nhiên 0,2–0,4 s (CANON §11) = 6–12 frame |
| 6 | Render sync | 8,0 ms | 14,0 | ≤ 180 GameObject, ≤ 60 draw call (§2.8) |
| | **Tổng** | **16,7 ms** | **31,5 ms** | Dư ~50% ở mức mục tiêu |

**Cơ chế bảo vệ ngân sách:** `dialog.tick` giữ một `budgetMs`; nếu `performance.now()` vượt, nó **không chạy query mới mà đẩy sang frame sau**. Không bao giờ bỏ query — chỉ hoãn. `perception.tick` **không** được phép hoãn: hoãn perception là đổi kết quả game.

---

### 2.5. EventBus — xương sống nối các hệ

**Nguyên tắc:**
1. **Đồng bộ.** `emit()` gọi listener ngay. Không promise, không microtask. Sự kiện phát trong frame phải xử lý xong trong frame — nếu không, thứ tự ở §2.4 vô nghĩa.
2. **Typed.** Một `EventMap`, `emit`/`on` suy kiểu từ tên. Sai payload = lỗi biên dịch.
3. **Một hệ không import hệ khác.** `craft/` không biết `sim/perception` tồn tại. Nó phát `stim:emitted`.
4. **Ghi lại được.** Ở dev build, bus ghi mọi event vào ring buffer 2.000 mục → dump ra file khi bấm hotkey. Đây là công cụ debug rẻ nhất có thể có (xem `P0-03`).
5. **Cấm listener phát lại cùng loại event** (chống vòng lặp). Cổng: bus đếm độ sâu, >8 thì throw ở dev build.

```ts
type EventMap = {
  // ── thời gian & ngày ────────────────────────────────────────────────
  'clock:tick':              { dt: number; gameMinutes: number; hhmm: string }
  'clock:bandChanged':       { from: TimeBand; to: TimeBand }      // PRE_OPEN|PEAK|MID|LULL
  'day:started':             { dayIndex: number; daySeed: number; weather: Weather }
  'day:ended':               { dayIndex: number; summary: DaySummary }
  'ui:pauseToggled':         { paused: boolean; source: 'PLAYER'|'FOCUS_LOST'|'MENU' }

  // ── người chơi thao tác ────────────────────────────────────────────
  'craft:stepDone':          { step: CraftStep; zone: StallZone }
  'craft:undo':              { step: CraftStep }
  'craft:dropped':           { itemId: ItemId }                    // econ trừ kho, KHÔNG có nút nhặt (XĐ1.2)
  'stall:cleanlinessChanged':{ value: number; delta: number }

  // ── tầng NHẬN THẤY ─────────────────────────────────────────────────
  'stim:emitted':            { stimId: StimId; zone: StallZone; salience: number; at: number }
  'stim:expired':            { stimId: StimId }
  'perception:stateChanged': { npcId: NpcId; stimId: StimId
                               from: ObsState; to: ObsState; certainty: number }
  'perception:confirmed':    { npcId: NpcId; stimId: StimId }
  'gaze:changed':            { npcId: NpcId; gazeFactor: number
                               reason: 'PHONE'|'TRA_DA'|'ASKED'|'IDLE'|'CO_BA'|'TALKING' }
  'attention:toolUsed':      { tool: AttentionTool; npcId: NpcId; durationSec: number }

  // ── khách ──────────────────────────────────────────────────────────
  'npc:arrived':             { npcId: NpcId; slot: CustomerSlot; atHhmm: string }
  'npc:slotChanged':         { npcId: NpcId; from: CustomerSlot; to: CustomerSlot }
  'npc:left':                { npcId: NpcId
                               reason: 'SERVED'|'IMPATIENT'|'SILENT_EXIT'|'SOLD_OUT'|'REFUSED' }
  'order:placed':            { npcId: NpcId; spec: OrderSpec; phrasing: string }
  'order:delivered':         { npcId: NpcId; dish: Dish; waitedSec: number }
  'delivery:diffed':         { npcId: NpcId; defects: Defect[]
                               spoken: Defect | null; silentScore: number
                               mode: 'ANTICIPATED'|'DISCOVERED'|'NONE' }

  // ── thoại ──────────────────────────────────────────────────────────
  'dialog:requested':        { npcId: NpcId; concept: Symbol; blackboard: BlackboardSnapshot }
  'dialog:selected':         { npcId: NpcId; ruleId: string; responseId: string
                               score: number; rejected: number }
  'dialog:spoken':           { npcId: NpcId; text: string; tier: 1|2|3 }
  'dialog:silent':           { npcId: NpcId; reason: 'RATE_35'|'COOLDOWN'|'NO_RULE' }
  'bark:queued':             { npcId: NpcId; tier: 1|2|3; delaySec: number }

  // ── trí nhớ · quan hệ · đồn thổi ───────────────────────────────────
  'memory:written':          { npcId: NpcId; kind: StimId; intensity: number
                               tier: 'SHORT'|'LONG'|'CORE'; evicted?: string }
  'memory:promoted':         { npcId: NpcId; memoryId: string }
  'memory:decayed':          { npcId: NpcId; memoryId: string; from: number; to: number }
  'relationship:tierChanged':{ npcId: NpcId; from: RelTier; to: RelTier }   // nội bộ + telemetry, KHÔNG ra UI (T3)
  'gossip:seeded':           { sourceNpc: NpcId; factId: string; confidence: number }
  'gossip:propagated':       { from: NpcId; to: NpcId; factId: string
                               hop: number; confidence: number; mutatedTo?: string }
  'gossip:overheard':        { npcA: NpcId; npcB: NpcId; factId: string; corner: string }

  // ── kinh tế ────────────────────────────────────────────────────────
  'econ:purchased':          { itemId: ItemId; qty: number; unitPrice: number; supplierId: string }
  'econ:stockChanged':       { itemId: ItemId; from: number; to: number; cause: StockCause }
  'econ:spoiled':            { itemId: ItemId; qty: number; ageDays: number }
  'econ:ledgerEntry':        { kind: LedgerKind; amount: number; note: string }
  'money:changed':           { delta: number; balance: number; reason: string }
  'obligation:due':          { kind: 'RENT'|'HUI'|'TUITION'; amount: number; dayIndex: number }
  'equipment:bought':        { equipId: string; price: number }

  // ── sổ tay & trợ năng & hạ tầng ────────────────────────────────────
  'notebook:entryAdded':     { npcId: NpcId; field: string; value: string }
  'notebook:hypothesisResolved': { npcId: NpcId; hypothesisId: string; correct: boolean }
  'a11y:settingChanged':     { key: A11yKey; value: unknown }
  'save:autosaveRequested':  { reason: 'CUSTOMER_DONE'|'EVENT'|'SCENE_CHANGE'|'QUIT' }
  'save:written':            { bytes: number; ms: number; slot: 'A'|'B' }
  'scene:transition':        { from: SceneKey; to: SceneKey }
  'telemetry:mark':          { key: string; value: number | string }
}
```

**44 event.** Đọc bảng này theo chiều dọc là đọc được toàn bộ luồng dữ liệu của game — đó là mục đích. Khi thêm hệ mới ở P2–P4, **thêm event trước, viết code sau**.

**Hai luồng mẫu, để thấy bus thực sự nối cái gì:**

```
Người chơi làm rớt ổ bánh:
  input → craft.apply
    ├─ emit 'craft:dropped'        → econ/inventory trừ 1 ổ + 'econ:stockChanged'
    └─ emit 'stim:emitted' {DROPPED_FOOD, zone:HANDS, salience:75}
         → perception.tick tích certainty cho từng NPC đang ở slot
            └─ emit 'perception:stateChanged' {bà Bảy, NOTICED}
                 ├─ render: nhíu mày (layered sprite)
                 └─ dialog: emit 'dialog:requested' {concept: NOTICE_DROP}
                      └─ emit 'bark:queued' {tier:1, delaySec: 0.31}
                           └─ 0,31 s sau: 'dialog:spoken'
            └─ emit 'perception:confirmed' → 'memory:written' → tối nay 'gossip:seeded'

Người chơi đưa bánh thiếu hành cho khách KHÔNG chứng kiến:
  'order:delivered' → craft/diff → 'delivery:diffed' {mode: DISCOVERED, spoken: MISSING_HANH}
    → dialog: "ủa... thiếu hành rồi"     (nếu NOTICED trước đó: "tôi thấy con quên bỏ hành rồi đó")
```

---

### 2.6. Chiến lược render

**(a) Nền bake vào `RenderTexture`.** Khúc hẻm, mái hiên, xe máy dựng sát vách, bảng hiệu đỏ chữ vàng, chậu trầu bà (CANON §14) — tất cả là tĩnh. Bake **một lần** lúc vào `StallScene`:

```ts
const rt = this.add.renderTexture(minX, minY, w, h).setOrigin(0,0).setDepth(LAYER.BG);
rt.beginDraw();                               // 1 lần bind framebuffer
for (const p of props) rt.batchDrawFrame(p.key, undefined, p.x - minX, p.y - minY);
rt.endDraw();
```
Bài học đã trả giá ở prototype: `drawFrame()` riêng lẻ 576 lần **treo tab vài giây**; `beginDraw/batchDrawFrame/endDraw` gộp thành **1 draw call**.
Bake lại chỉ khi: đổi **chỗ đứng** (CANON §10), đổi thời tiết lớn (mưa), hoặc bật/tắt "giảm chuyển động" (§15.3 — tắt xe máy chạy qua = xe máy thành prop tĩnh trong nền).

**(b) Layered sprite cho mặt NPC** (CANON §16 Đừng-4 — chống bẫy Cuphead >25 phút/frame):

```
NpcFace = Container [
  layer 0  head      (1 file × 12 npc, hoặc 1 atlas)
  layer 1  brow      (6 file)   ─┐
  layer 2  eye       (6 file)    ├─ 6 × 6 × 6 = 216 trạng thái từ 18 file
  layer 3  mouth     (6 file)   ─┘
  layer 4  overlay   (mồ hôi, đỏ mặt, dấu "?") — chỉ bật khi cần
]
```
Cộng rig kiểu Rain World: **3 node** (đầu / thân / tay) nối bằng `spring + lerp` → lean, tilt, nhún vai, gật đầu — **không tốn thêm một file sprite nào**.

Ánh xạ bắt buộc từ `ObsState` sang mặt (CANON §5 — mỗi state có biểu hiện hình ảnh **bắt buộc**):

| `ObsState` | brow | eye | mouth | rig | overlay |
|---|---|---|---|---|---|
| `UNAWARE` | neutral | idle-blink | rest | thở nhẹ | — |
| `GLIMPSED` | raise-1 | **dời về phía `stim.zone`** | rest | quay đầu 8–12° | dấu `?` nhỏ |
| `NOTICED` | furrow-1 | fix on zone | press | nghiêng người 4° | — |
| `CONFIRMED` | furrow-2 | fix on **mặt người chơi** | theo cảm xúc | dựng thẳng | tuỳ tính cách |

**Điều kiện bắt buộc từ §18.2: gaze phải được VẼ RA.** Nếu khách đang bấm điện thoại (`gazeFactor` 0.05) mà người chơi làm rớt bánh không sao, người chơi **phải nhìn thấy lý do**. Cụ thể: layer eye có 1 frame "nhìn xuống điện thoại" + prop điện thoại có ánh sáng xanh nhấp nháy + đầu cúi 20°. Không được để "không sao" trở thành "hên".

**(c) Object pool cho bark bubble.** Prototype tạo `Graphics + Text + Container` rồi `destroy()` cho **mỗi** câu nói — với 6 NPC nói liên tục trong giờ cao điểm, đó là vài trăm lần cấp phát/giải phóng mỗi phút → GC spike rơi đúng lúc đông khách nhất.

```ts
class BubblePool {
  private free: Bubble[] = [];
  private live: Bubble[] = [];
  constructor(scene, size = 8) { /* dựng sẵn 8 container, setVisible(false) */ }

  acquire(npcId: NpcId, text: string, tier: 1|2|3): Bubble {
    const b = this.free.pop() ?? this.stealOldest();   // KHÔNG BAO GIỜ cấp phát mới
    b.label.setText(text);                             // dùng lại Text, chỉ đổi nội dung
    b.redrawFrame(b.label.width, b.label.height);      // vẽ lại Graphics tại chỗ, không tạo mới
    b.show(); this.live.push(b); return b;
  }
  release(b: Bubble) { b.hide(); this.free.push(b); }
}
```
**Kích thước pool: 8.** Lý do: tối đa 6 NPC ở quầy + 2 dự phòng cho bong bóng **nghe lỏm** ở góc hẻm (CANON §12 ràng buộc 4). Khi cạn pool → cướp cái cũ nhất, không cấp phát. Nếu logic đúng thì việc cướp không bao giờ xảy ra (luật 35% im lặng + cooldown tier-1 giữ số bong bóng cùng lúc thấp) — nên **cướp pool được đếm vào telemetry như một tín hiệu lỗi cân bằng**, không chỉ là chuyện hiệu năng.

**(d) Thứ tự layer (depth), chốt cứng:**

| Layer | Depth | Nội dung |
|---|---|---|
| `BG` | −1e6 | RenderTexture nền |
| `PROPS_BACK` | −5e5 | Prop sau quầy |
| `NPC` | `depthOf(wx,wy)` | Khách — sắp theo iso |
| `STALL` | 5e5 | Xe bánh mì, lò, thớt |
| `HANDS` | 6e5 | Tay người chơi + ổ bánh đang làm |
| `FX` | 8e5 | Khói, hơi nước, giọt |
| `BUBBLE` | 1e6 | Bong bóng thoại (pool) |
| `DOM_UI` | — | HTML overlay: sổ tay, đơn hàng, cài đặt, mọi chữ đọc lâu |

Chữ **đọc lướt** (bark) ở trong Phaser để bám theo đầu NPC. Chữ **đọc lâu** (sổ tay, đơn, menu) ở DOM để CSS lo cỡ chữ 4 mức + hộp tự giãn (§15.1).

---

### 2.7. Lộ trình đóng gói

```
[1] Web (Vite build)  →  [2] itch.io demo  →  [3] Electron → Steam
```

| Bước | Khi nào | Nội dung | Cổng ra |
|---|---|---|---|
| **1. Web** | Từ P0 | `vite build` → `dist/` tĩnh. Không backend, không env var, không CORS. Save ở `localStorage` | Mở `dist/index.html` bằng `file://` phải chạy được (điều kiện cho bước 3) |
| **2. itch.io demo** | Tuần 9 (§23) | Zip `dist/`, bật "This file will be played in the browser", chỉnh viewport. **Demo web miễn phí là kênh phát hành #1** (§23: seeding vào Stardew Valley VN 29.200 tv, Team Việt Hoá SDV 51.200 tv, Hội Làm Game VN 203.600 tv) | Tải xong < 8 s trên 4G → xem ngân sách build §2.8 |
| **3. Electron** | Tuần 3–4 (§23: "song song: chuyển sang Electron") | `electron-builder` → `.exe` + `.dmg`. Save đổi sang file JSON (CANON §2). Steamworks SDK qua `steamworks.js` | Steam Overlay bật được, controller nhận được, không đòi quyền mạng |

**Vì sao Electron chứ không Tauri** — CANON §2 đã chốt, đây là lý do đầy đủ:

| | Electron | Tauri |
|---|---|---|
| Runtime | **Chromium đóng gói kèm** | **WebView của hệ điều hành** |
| Dung lượng | ~100 MB | ~5 MB |
| Render | Giống hệt nhau trên mọi máy | **WebView2 (Win) / WKWebView (mac) / WebKitGTK (Linux) render khác nhau** |
| Steam Overlay / Input | Đường đi mòn, nhiều game đã ship | **Hay lỗi** |

Đổi lại 95 MB, ta mua được: **cái người chơi thấy giống hệt cái mình test**. Với một game mà toàn bộ giá trị nằm ở *nét mặt NPC thay đổi 1–2 frame* và *1 hàng pixel lệch* (§16 Đừng-4, bài học Celeste), một WebView cũ render font/blend khác đi là **hỏng thiết kế**, không phải hỏng thẩm mỹ. Và WebKitGTK trên Linux là biến số không kiểm soát được — trong khi Steam Deck là thị trường thật của game cozy.

Ba lý do phụ: (1) `steamworks.js` chạy trong Node context của Electron, không cần FFI thủ công; (2) devtools giống hệt bản web → một bug reproduce được ở cả hai; (3) **không cần biết Rust** — mọi giờ học Rust là giờ không viết rule DB.

Chi phí phải trả và cách trả: dung lượng → `asar` + loại `devDependencies` + không nhúng ffmpeg codec thừa; khởi động chậm → splash native trước khi Chromium sẵn sàng.

**Capacitor (iOS/Android) — không phải v1.** CANON §2: mobile là v2, sau khi bán 30k bản. Giữ `client/src` sạch khỏi API Electron-only để đường đó còn mở: mọi truy cập file/hệ điều hành đi qua đúng một adapter `core/platform.ts` (`web` | `electron`).

---

### 2.8. Ngân sách hiệu năng

**Mục tiêu: 30 fps ổn định** (CANON §2 — và §7.1: *"30fps là đủ cho cozy"*, tiết kiệm pin/nhiệt). Không nhắm 60: ngân sách frame gấp đôi cho phép tăng chiều sâu hệ mô phỏng, và không ai cần 60 fps để nhìn một bà cô nhíu mày.

| Hạng mục | Ngân sách | Trần cứng | Ghi chú |
|---|---|---|---|
| Frame time | 17 ms | 31 ms | §2.4 |
| **GameObject hoạt động** | **180** | 260 | NPC ≤ 6 × 12 (3 rig + 4 face layer + 5 prop) = 72 · prop quầy ≤ 40 · FX pool 24 · bubble pool 8 × 2 = 16 · UI Phaser ≤ 20 |
| **Draw call** | **≤ 60** | 90 | 1 atlas cho NPC+prop, nền là 1 RT. Mỗi draw call thừa đều là một texture chưa gộp vào atlas |
| Texture memory | ≤ 96 MB | 160 MB | 1 atlas 2048² NPC/prop + 1 atlas 2048² UI + RT nền |
| Cấp phát/frame | **0** ở trạng thái ổn định | — | Pool bubble, pool FX, không `new` trong `update()`. Đo bằng Chrome Memory allocation timeline |
| Tween sống cùng lúc | ≤ 30 | 60 | Tween của Phaser tốn hơn lerp tay; chỉ dùng cho hiệu ứng có nhịp |
| Audio voice cùng lúc | ≤ 12 | 16 | 5 kênh tách riêng (§15.4) |
| **Build web (gzip)** | **≤ 12 MB** | 20 MB | Demo itch.io phải tải xong < 8 s trên 4G. Phaser ~1,1 MB gzip; phần còn lại là atlas + audio |
| Build web (giải nén) | ≤ 28 MB | 45 MB | |
| **Build Electron** | **≤ 250 MB** | 400 MB | Chromium ~100 MB là sàn không tránh được |
| Bộ nhớ RSS lúc chơi | ≤ 500 MB | 800 MB | |
| Thời gian vào `StallScene` | ≤ 1,2 s | 2,0 s | Gồm bake nền |
| Thời gian autosave (blocking) | ≤ 2 ms | 5 ms | Xem `P0-02` §2.5 |

**Máy chuẩn để đo (Cần đo, chốt ở P0):** laptop tích hợp Intel Iris Xe / Ryzen 5 APU, 8 GB RAM, Chrome mới nhất, độ phân giải 1920×1080. Nếu máy chuẩn không giữ nổi 30 fps thì **cắt tính năng**, không hạ mục tiêu fps.

---

## 3. Dữ liệu & schema

```ts
// ─────────────────────────────────────────────────────── core/eventbus.ts
export interface Bus {
  on   <K extends keyof EventMap>(k: K, fn: (p: EventMap[K]) => void): () => void
  once <K extends keyof EventMap>(k: K, fn: (p: EventMap[K]) => void): () => void
  emit <K extends keyof EventMap>(k: K, p: EventMap[K]): void
  /** Chỉ có ở dev build — ring buffer 2.000 mục, dump ra JSONL */
  readonly trace?: { dump(): string; clear(): void }
}

// ─────────────────────────────────────────────────────── GameContext
export type GameContext = {
  readonly saveId:  string
  readonly bus:     Bus
  readonly clock:   Clock          // core/clock.ts   — P0-02
  readonly rng:     RngHub         // core/rng.ts     — P0-02
  readonly save:    SaveService    // core/save.ts    — P0-02
  readonly flags:   Flags
  readonly content: ContentDb      // đã load, chỉ đọc
  readonly world:   WorldState     // mutable — tiền, kho, 12 NPC, gossip, sổ tay
}

// ─────────────────────────────────────────────────────── định danh cố định
export type StimId =
  | 'WRONG_NAME' | 'MADE_THEM_WAIT' | 'BURNT_OR_COLD' | 'DROPPED_FOOD'
  | 'ORDER_DEFECT' | 'DIRTY_HANDS'                                    // 6 tiêu cực
  | 'REMEMBERED_USUAL' | 'REMEMBERED_STORY' | 'CARED_FOR_THEM'
  | 'FREE_EXTRA' | 'FLOURISH'                                          // 5 tích cực

export type StallZone    = 'HANDS' | 'BOARD' | 'OVEN' | 'UNDER_COUNTER'
export type CustomerSlot = 'FRONT_CENTER' | 'FRONT_SIDE' | 'QUEUE_2' | 'QUEUE_3' | 'SEATED_FAR'
export type ObsState     = 'UNAWARE' | 'GLIMPSED' | 'NOTICED' | 'CONFIRMED'
export type RelTier      = 'RIVAL' | 'ACQUAINTANCE' | 'FRIEND'
export type SceneKey     = 'Boot' | 'Day' | 'Market' | 'Stall' | 'Evening'
export type TimeBand     = 'PRE_OPEN' | 'PEAK' | 'MID' | 'LULL'
export type AttentionTool= 'TRA_DA' | 'ASK_QUESTION' | 'OCCLUDE_BODY' | 'SWITCH_SIDE' | 'CO_BA'
export type NpcId =
  | 'BA_BAY' | 'CHU_TU' | 'ANH_DUNG' | 'CHI_LAN' | 'BE_SU' | 'ONG_HAI'
  | 'CO_MAI' | 'THAY_PHUC' | 'CHI_HANH' | 'ANH_BAO' | 'BA_SAU' | 'CHU_KIET'
  | 'CO_BA' | 'KHACH_VANG_LAI'
```

**Ví dụ content thật** — `content/npcs/ba_bay.json` (số lấy đúng từ CANON §9):

```json
{
  "id": "BA_BAY",
  "ten": "Bà Bảy",
  "vai": "Bán vé số",
  "personality": { "soi": 0.9, "nongTinh": 0.6, "deTha": 0.8, "thanThien": 0.7 },
  "schedule": { "daysOfWeek": [1,2,3,4,5,6,0], "arriveHhmm": "06:20", "variancMin": 12 },
  "face": { "atlas": "npc_faces", "head": "ba_bay_head",
            "browSet": "ba_bay_brow", "eyeSet": "ba_bay_eye", "mouthSet": "ba_bay_mouth" },
  "voiceTags": ["nam_bo", "lon_tieng", "thuong"],
  "coreMemorySeed": "bat_hoa_15_nam_voi_co_ba",
  "designNote": "Người soi nhất hẻm nhưng dễ tha — an toàn để học luật. Mê cải lương. §19.5: không tồn tại để bị thương hại."
}
```

`content/days/day_01.json` (khung một ngày ở P0 — chưa có nội dung kịch bản):

```json
{
  "dayIndex": 1,
  "weather": "NANG",
  "standPoint": "DAU_HEM",
  "budget": 180000,
  "expectedNpcs": ["CHU_TU", "BA_BAY", "ANH_BAO"],
  "tutorialBeats": ["GIOI_THIEU_DAI_TU_XUNG_HO", "CACH_RACH_BANH"],
  "gossipEnabled": false
}
```

---

## 4. UI/UX hai thiết bị

**v1 là PC (Steam) + demo web itch.io. Mobile là v2** (CANON §2). Nhưng các ràng buộc §7.1 phải được tôn trọng **ngay từ P0** ở những chỗ miễn phí — sửa sau thì đắt gấp nhiều lần.

| Ràng buộc §7.1 | Làm ngay ở P0 | Hoãn tới v2 |
|---|---|---|
| **Không có hover** | Mọi thông tin hiện khi rê chuột phải có đường thứ hai (click, hoặc luôn hiện). Cấm tooltip-only | — |
| **Vùng chạm ≥ 44×44 pt** | Mọi nút nguyên liệu/thao tác đặt trên lưới 48 px từ đầu | — |
| **Tap-to-interact thay đi tự do** | **Đã chốt**: bỏ WASD, bỏ di chuyển tự do của prototype. Người chơi đứng tại quầy. Đúng cả về thiết kế (T1: bạn là người bị nhìn) lẫn về mobile | — |
| **Chạm-để-đặt + Hoàn tác + xác nhận trước khi đưa bánh** (§15.5, ba cái đi chung) | **Làm ngay**, đây là luật trợ năng bắt buộc chứ không phải chuyện mobile | — |
| **Portrait / nửa dưới màn hình** | Layout đọc `scale.orientation`, **một scene, không fork code** (§12.3) | Tinh chỉnh vị trí ngón cái |
| **Phiên 3–5 phút kết trọn vẹn** | Khung ngày đã tách MORNING/SELLING/EVENING → mỗi khung tự kết | — |
| Phím tắt 1–9 nguyên liệu | Có trên PC, là **đường thứ hai**, không phải đường duy nhất | — |

**Debug overlay** (`P0-03`) chỉ tồn tại ở dev build, không nằm trong ngân sách GameObject ở §2.8.

---

## 5. Tham số cần tune

| Tên | Giá trị khởi điểm | Khoảng | Cách đo |
|---|---|---|---|
| `TARGET_FPS` | 30 | 30 | Cố định. Nếu không giữ được thì cắt tính năng, không hạ fps |
| `FRAME_BUDGET_LOGIC_MS` | 9,0 | 6–12 | `performance.now()` quanh bước 0–5, p95 qua một ngày chơi |
| `FRAME_BUDGET_RENDER_MS` | 8,0 | 5–14 | Chrome Performance, p95 |
| `DIALOG_QUERIES_PER_FRAME` | 1 | 1–2 | Đếm query bị hoãn/ngày. >20 lần/ngày → nâng lên 2 |
| `BUBBLE_POOL_SIZE` | 8 | 6–12 | Đếm số lần "cướp pool"/ngày. >0 là tín hiệu lỗi cân bằng, không phải lỗi hiệu năng |
| `FX_POOL_SIZE` | 24 | 16–48 | Như trên |
| `MAX_GAMEOBJECTS` | 180 | 120–260 | `scene.children.length` p95 |
| `MAX_DRAW_CALLS` | 60 | 40–90 | Spector.js / `game.renderer.drawCount` |
| `MAX_NPC_AT_STALL` | 6 | 4–8 | **Cần đo.** Nối thẳng vào §22.3 (thông lượng giờ cao điểm) và §15 (chế độ "một khách một lượt") |
| `ACTIVE_STIM_CAP` | 8 | 6–16 | Số `stim` sống cùng lúc. Vượt trần → bỏ cái `salience` thấp nhất |
| `BG_REBAKE_TRIGGERS` | 3 | — | Đổi chỗ đứng / đổi thời tiết / bật-tắt giảm chuyển động |
| `WEB_BUILD_GZIP_MB` | 12 | 8–20 | `du -sh dist` sau gzip; đo thời gian tải thật trên 4G |
| `ELECTRON_BUILD_MB` | 250 | 180–400 | Kích thước installer |
| `SCENE_ENTER_MS` | 1200 | 800–2000 | Đo từ `launch()` tới frame đầu ổn định |

---

## 6. Tiêu chí đạt (cổng ra P0 cho doc này)

- [ ] `grep -ri "colyseus" client/ package.json` → **0 kết quả**. `client/src/net.ts` không tồn tại. `npm ls` không có `@colyseus/sdk`
- [ ] `_archive/netcode-v2/` tồn tại, có README ghi rõ lý do đóng băng, **không nằm trong `tsconfig.include`**, không bị build
- [ ] Repo build xanh, chạy được **không cần bất kỳ tiến trình nào ngoài Vite**. Tắt wifi vẫn chơi được từ đầu tới cuối một ngày
- [ ] `grep -rn "from \"phaser\"" src/sim src/dialog src/craft src/econ` → **0 kết quả** (CI chặn)
- [ ] `grep -rn "Math.random()" src/ --exclude-dir=core` → **0 kết quả** (CI chặn)
- [ ] 5 scene tồn tại và chuyển được đủ vòng: Boot → Day → Market → Stall → Evening → Market(ngày+1)
- [ ] `ui:pauseToggled` đóng băng đồng hồ **và** thanh kiên nhẫn **và** `certainty` — kiểm bằng test: pause 10 s, `certainty` không đổi 1 chữ số thập phân nào
- [ ] Vòng đời frame ở `StallScene` đúng thứ tự §2.4 — có unit test bắt được nếu ai đó đổi thứ tự (spy theo trình tự gọi)
- [ ] `EventMap` khai báo đủ **44 event**; `bus.trace.dump()` chạy được ở dev build
- [ ] Nền `StallScene` bake vào **đúng 1** `RenderTexture`; `game.renderer.drawCount` ≤ 60 trong một ngày chơi đủ 6 NPC
- [ ] `BubblePool` size 8, **0 lần cấp phát** `Container` mới sau khi vào scene (đo bằng allocation timeline)
- [ ] Mặt NPC dựng từ **18 file** cho 4 layer; đổi đủ 4 trạng thái `ObsState` với biểu hiện khác nhau nhìn thấy được
- [ ] `vite build` ra `dist/` mở bằng `file://` chạy được; gzip ≤ 12 MB
- [ ] `npm run build:electron` ra installer chạy được, mở Steam Overlay được (kiểm ở tuần 3–4)
- [ ] 30 fps ổn định trên máy chuẩn §2.8 qua một ngày chơi đầy đủ, p95 frame ≤ 31 ms

---

## 7. Rủi ro & cách bịt

| # | Rủi ro | Mức | Cách bịt |
|---|---|---|---|
| R1 | **Gỡ Colyseus làm vỡ cái đang chạy được**, mất vài ngày dựng lại | Cao | Gỡ theo 6 bước §2.1, **mỗi bước một commit, build xanh mới sang bước sau**. Code netcode được `git mv` chứ không `rm` — có đường lùi |
| R2 | Ai đó "tiện tay" import `phaser` vào `sim/` → không chạy headless được nữa → không tune cân bằng được | Cao | CI grep chặn. Đây là cổng, không phải khuyến nghị |
| R3 | `Math.random()` lọt vào một hệ → **cơ chế chống save-scum §8e hỏng âm thầm**, không ai biết cho tới khi người chơi phát hiện | Rất cao | CI grep chặn + test tất định: chạy 1 ngày 2 lần cùng seed, so `bus.trace.dump()` phải **giống hệt từng byte** |
| R4 | Ngân sách frame vỡ ở giờ cao điểm — đúng lúc T1 quan trọng nhất | Cao | `MAX_NPC_AT_STALL = 6`, `ACTIVE_STIM_CAP = 8`, trần 1 query/frame. Đo p95 chứ không đo trung bình |
| R5 | Bị cám dỗ **mô phỏng sâu đời sống NPC ngoài quầy** | Cao | CANON §16 Đừng-1. Kiến trúc đã bịt: `sim/schedule.ts` chỉ trả *giờ đến / ngày nghỉ / arc*, không có vị trí NPC ngoài scene. Cái xe thủng lốp của chú Tư = **một dòng thoại + một prop** (tay băng, áo ướt) |
| R6 | Layered sprite trượt thành frame-by-frame animation khi artist về | Cao | CANON §16 Đừng-4. Hợp đồng artist ghi rõ: giao **18 file layer + 1 atlas**, không giao chuỗi frame. Ngân sách draw call §2.8 là cổng kỹ thuật cho điều đó |
| R0.5 | Tauri "nhẹ hơn 95 MB" được đem ra bàn lại ở P5 | Trung bình | CANON §2 đã chốt. §2.7 ghi sẵn lý do đầy đủ để khỏi bàn lại |
| R8 | Demo web nặng → tỉ lệ thử tụt → mất kênh phát hành #1 (§23) | Cao | `WEB_BUILD_GZIP_MB ≤ 12`, đo **thời gian tải thật trên 4G**, không đo dung lượng suông. Demo cắt bớt nội dung chứ không cắt chất lượng art |
| R9 | Render đổi state (tiện tay sửa `npc.mood` trong `sync()`) → không ai debug nổi | Trung bình | `renderer.sync()` nhận `Readonly<WorldState>`. TypeScript chặn ở biên dịch |
| R10 | Bus phát vòng lặp vô hạn (A → B → A) | Trung bình | Đếm độ sâu, >8 thì throw ở dev build |
| R11 | Nhắc "co-op sẽ có sau" lọt vào Steam page → kỳ vọng sai → review xấu (bằng chứng: 97% → 76%) | Trung bình | §2.1 kỷ luật. Thêm vào checklist duyệt Steam page ở P6 |

---

## 8. Truy vết

| Nội dung | `idea.md` | `CANON.md` |
|---|---|---|
| Giữ stack Phaser + Vite, web là lợi thế marketing | §7 | §2 |
| Ràng buộc 2 thiết bị (không hover, 44pt, tap-to-interact, 30fps, bake nền) | §7.1 | §2 |
| Vertical slice trên code đang có, *"đừng gánh netcode khi chưa cần"* | §13 | §17 (P0) |
| Cắt co-op / multiplayer / Colyseus | HT5 (§16), §23 | §2 |
| Tauri → Electron | §23 | §2 |
| Bố cục 2 thiết bị, một scene không fork code | §12.3 | §2 |
| Certainty tích luỹ, bảng `visibility` O(1), duyệt từ phía sự kiện, gaze phải vẽ ra | §18.2 | §5 |
| Delivery-time diff, `take(1)` | §18.3 | §6 |
| Rule DB Valve + Firewatch blackboard | §18.1 | §11 |
| Bark 3 tầng, 35% im lặng, delay 0,2–0,4 s | §18.7 | §11 |
| Đừng-1 (Radiant AI), Đừng-2, Đừng-3, Đừng-4 (Cuphead → layered sprite) | §18.6 | §16 |
| Trợ năng: pause đóng băng kiên nhẫn, cỡ chữ 4 mức, chạm-để-đặt + hoàn tác + xác nhận | §20 | §15 |
| Bảng màu xanh xám + nắng gắt trắng, chi tiết môi trường | §19.4 | §14 |
| Demo web itch.io là kênh phát hành #1 | §23 | §17 |

---

## 9. Đề xuất sửa CANON

| # | Đề xuất | Lý do |
|---|---|---|
| 1 | Thêm vào §2 một dòng: **`_archive/netcode-v2/` là nơi đóng băng code Colyseus** — không xoá, không build, không nhắc trong pitch | Mọi doc sau này sẽ hỏi "code cũ đi đâu". Ghi một lần ở CANON rẻ hơn giải thích 6 lần |
| 2 | Thêm vào §2 ba cổng kỹ thuật cứng: (a) `sim/dialog/craft/econ` **không import `phaser`**; (b) **cấm `Math.random()`** ngoài `core/rng.ts`; (c) render **read-only** | (b) là điều kiện sống còn của §8e (chống save-scum) nhưng hiện chỉ tồn tại như một suy luận, không phải một luật. Nó phải là luật |
| 3 | Bổ sung §16 Đừng-4 một dòng: **bong bóng thoại phải dùng object pool** | Không phải chuyện hiệu năng thuần: số lần "cướp pool" là tín hiệu đo được cho biết luật 35% im lặng có đang chạy đúng hay không |
