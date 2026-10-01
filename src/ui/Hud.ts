import Phaser from "phaser";
import { ICON } from "../art";
import { fitPhoto } from "../art/photo";
import { GAME_W, GAME_H } from "../core/config";
import { BAND_LABEL, type Clock } from "../core/clock";
import type { Settings } from "../core/save";
import { blockedReason, type Hand, type Station } from "../world/stations";
import { INGREDIENTS, portionsOf, type Ingredient } from "../sim/order";
import { FOOD } from "../art/food";
import { FONT, UI } from "./theme";

const DEPTH = 9_000_000;
/** P1-04 §2.10: hướng dẫn phím thường trực chỉ tới hết ngày 3. */
const HELP_UNTIL_DAY = 3;

/**
 * Dòng phím ở đáy màn hình, DẠY DẦN theo ngày.
 *
 * Bản cũ đổ cả chín phím vào MỘT dòng ngăn bằng dấu "·": ngày đầu tiên, lúc người chơi
 * còn chưa biết cái thớt nằm đâu, họ đã phải đọc "R cầm ổ trên thớt lên" và "giữ C che
 * tay" — hai phím chưa có việc gì để dùng. Dòng dài tới mức ở cỡ chữ 100% nó đã chiếm
 * gần trọn bề ngang khung, và mắt không bắt được phím nào cả: tất cả cùng một cỡ, cùng
 * một màu, xếp ngang hàng nhau.
 *
 * Ba ngày, ba dòng, mỗi dòng thêm đúng những phím mà hôm đó mới có chỗ dùng. Dòng dài
 * nhất (ngày 3) vẫn ngắn hơn dòng cũ. Hết ngày 3 thì tắt hẳn — lúc đó dòng nhắc theo
 * trạm (`drawPrompt`) đã làm nốt phần việc còn lại.
 */
const HELP_BY_DAY = [
  "WASD đi · E làm việc · Esc tạm dừng",
  "WASD đi · Shift chạy · E làm việc · Q đặt xuống · Tab sổ tay",
  "WASD đi · E làm việc · R cầm ổ trên thớt · Q đặt xuống · F hỏi chuyện · giữ C che tay · Tab sổ tay",
];

/**
 * Có ai đang nhìn mình không — P1-04 §2.5 vẽ lại.
 *  · NONE   không ai để mắt tới tay mình (ai cũng đang bấm điện thoại / ngó quanh / uống trà)
 *  · GLANCE có người đang nhìn MẶT mình — họ ở đây, nhưng không soi tay
 *  · CLOSE  có người đang nhìn thẳng vào TAY mình — làm bậy lúc này là bị thấy
 */
export type Watch = "NONE" | "GLANCE" | "CLOSE";

/**
 * Con mắt "có người nhìn" — ô thứ BA của hàng icon ở đỉnh màn hình, đối xứng với icon
 * bàn tay qua nút tạm dừng.
 *
 * ── Vì sao nó rời khỏi chỗ cũ (giữa màn hình, y = 76) ────────────────────────
 * Chỗ đó KHÔNG phải chrome của HUD, nó là mặt tiền cái quán. Hàng trạm nằm ở hàng trên
 * cùng bản đồ, nên vòng ĐỘ GIÒN trên cửa lò rơi đúng vào quãng y 60–90 — và con mắt
 * ngồi đè lên nó. Đó là đổi một thứ ĐỌC GẤP (ổ sắp cháy, có vạch đỏ, hỏng là mất ổ bánh)
 * lấy một thứ CHỈ ĐỂ THAM KHẢO. Sai thứ tự ưu tiên.
 *
 * ── Vì sao là hàng icon chứ không phải chỗ khác ──────────────────────────────
 * Đây là TRẠNG THÁI TOÀN CỤC, liên tục, và nó trả lời đúng một câu: "ngay bây giờ có gì
 * đúng về MÌNH mà đổi việc mình nên làm tiếp không?" — y hệt câu mà icon bàn tay (sạch /
 * dính tiền) trả lời. Hai thứ cùng họ thì xếp cạnh nhau (Gestalt: gần nhau là cùng nhóm),
 * và trạng thái liên tục thì thuộc về viền HUD chứ không trôi nổi trên vùng chơi.
 *
 * Mấy game sống bằng "bị để ý" đều chia đúng hai tầng như vậy: tình trạng của TỪNG người
 * thì vẽ trên chính người đó (Metal Gear: `!`/`?` trên đầu lính; Assassin's Creed: vòng
 * phát hiện trên NPC), còn tổng kết TOÀN CỤC thì nằm trong chrome và không bao giờ che
 * cảnh (Thief: viên đá sáng dưới đáy HUD; Hitman: chấm phát hiện; MGS: radar góc màn).
 * Game này đã có tầng thứ nhất rồi — dấu `?`/`!`/cặp mày trên đầu từng khách. Con mắt là
 * tầng thứ hai, nên nó phải ở trong chrome.
 *
 * ── Cách vẽ ──────────────────────────────────────────────────────────────────
 * Cùng đĩa giấy 44×36 với icon bàn tay, nên hàng icon đọc ra là MỘT hàng chứ không phải
 * ba thứ rời. Phân biệt bằng HÌNH trước (có mắt / không có mắt), rồi tới NHỊP (nháy khi
 * bị soi tay, đứng yên khi chỉ bị liếc) — màu chỉ là tầng thứ ba (P1-04 §4.1).
 * KHÔNG phóng to thu nhỏ: ô trong một hàng cố định mà đổi cỡ thì đọc ra là lỗi layout.
 */
const EYE_X = GAME_W / 2 + 58;
const EYE_Y = 26;
/** Đĩa giấy: đúng cỡ đĩa của icon bàn tay. */
const EYE_PLATE_W = 44, EYE_PLATE_H = 36;
/** Cỡ icon bên trong — file SVG tỉ lệ 72×44, giữ đúng tỉ lệ đó. */
const EYE_W = 33, EYE_H = 20;
/** Cùng màu với `eye-red.svg` — viền đĩa giấy phải ăn màu với con mắt trên đó. */
const EYE_RED = 0xc0392b;
/** Chu kỳ nháy (ms). Chậm — đây là lời nhắc, không phải báo động. */
const EYE_BLINK_MS = 1150;

/**
 * ── DẢI THÔNG BÁO ───────────────────────────────────────────────────────────
 *
 * HAI kênh chữ, KHÔNG được trộn vào nhau:
 *
 *   · `say()`   — LỜI NGƯỜI. Khách nói, mình nói. Ở góc dưới trái, đọc từ dưới lên,
 *                 ba dòng gần nhất. Đây là thứ người chơi phải NGHE để làm đúng đơn.
 *   · `toast()` — VIỆC MÁY BÁO. "lau thớt", "khét rồi!", "Bà Bảy quý hơn". Ở đỉnh
 *                 màn hình, hiện rồi tắt.
 *
 * Trước đây cả hai chung một hộp ba dòng ở góc dưới trái. Người chơi thao tác trong lúc
 * khách đang nói thì mấy dòng "tay đang bận" đẩy câu gọi món ra khỏi hộp — đúng câu họ
 * cần nhớ để kẹp cho đúng thì biến mất vì chính thao tác của họ. Hai loại chữ này có
 * tuổi thọ khác nhau (lời khách phải nán lại, thông báo thì qua là xong) và mức quan
 * trọng khác nhau, nên chúng phải ở hai chỗ.
 */
/**
 * Mép PHẢI, thẳng hàng với ô tiền và phiếu đơn.
 *
 * Thử ở giữa đỉnh màn hình trước, và hỏng: giữa đỉnh màn hình chính là chỗ NHÃN TRẠM
 * của cái quán (kệ, lò, thớt, rổ bánh) — thông báo đè lên đúng mấy cái tên mà người
 * chơi đang đọc để biết mình đứng ở đâu. Dạt về cột phải thì cả màn hình chia ra sạch
 * sẽ: trái-dưới là LỜI NGƯỜI, phải là SỔ SÁCH CỦA MÁY (tiền · phiếu đơn · thông báo),
 * giữa để nguyên cho cái quán.
 */
const TOAST_RIGHT = GAME_W - 26;
/** Sàn: không bao giờ chui lên trên phiếu đơn, dù phiếu có ngắn tới đâu. */
const TOAST_TOP = 150;
const TOAST_GAP = 6;
const TOAST_MAX = 3;
/**
 * Thời gian sống tính THEO SỐ KÝ TỰ, không phải một con số cố định và cũng không phải
 * theo số từ.
 *
 * Đếm từ là cách thông dụng, và với tiếng Việt thì nó sai 1,6–2 lần: chữ Việt tách theo
 * ÂM TIẾT nên "bấm E gác ổ vô" đếm ra 5 "từ" trong khi tiếng Anh cùng nghĩa chỉ 3 —
 * cùng một lượng chữ phải đọc mà máy lại cho thời gian khác nhau. Ký tự thì không nói dối.
 *
 * `BASE` là phần cố định cho việc MẮT TÌM RA dòng mới (chuyển ánh nhìn, nhận ra có chữ);
 * `PER_CHAR` là phần đọc. 55 ms/ký tự ≈ 18 ký tự/giây — chậm hơn tốc độ đọc thật khá
 * nhiều, vì người chơi đang bận hai tay chứ không ngồi đọc.
 */
const TOAST_BASE_MS = 1800;
const TOAST_PER_CHAR_MS = 55;
const TOAST_MIN_MS = 2600;
const TOAST_MAX_MS = 6000;
/** Bắt đầu mờ ở mốc này của vòng đời; phần đầu phải còn rõ để đọc kịp. */
const TOAST_FADE_FROM = 0.78;
/**
 * Dòng mới trượt vào từ mép phải chừng này px.
 *
 * 20 chứ không phải 6: dưới ngưỡng chừng 15–20 px thì mắt NGOẠI VI không bắt được
 * chuyển động — mà ngoại vi mới là chỗ dòng này nằm, vì mắt người chơi đang ở giữa màn
 * hình. Trượt 6 px là trả giá animation mà không mua được gì.
 */
const TOAST_SLIDE_PX = 20;
/** Trượt xong trong chừng này ms. */
const TOAST_SLIDE_MS = 190;
/** Vạch màu bên trái mỗi dòng — kênh MÀU chỉ là phụ, chữ mới là chính (P1-04 §4.1). */
const TOAST_TONE: Record<ToastTone, number> = {
  good: 0x3f7d5a,
  bad: 0xc0392b,
  info: 0x6a7680,
};

/** Sắc thái một dòng thông báo: được / mất / chỉ là chuyện đang xảy ra. */
export type ToastTone = "good" | "bad" | "info";

type Toast = {
  text: Phaser.GameObjects.Text;
  /** Thời điểm sinh theo ĐỒNG HỒ HIỆU ỨNG của scene. −1 = đang rảnh. */
  born: number;
  tone: ToastTone;
  /** Chữ gốc, chưa gắn "×N" — để nhận ra dòng trùng. */
  body: string;
  /** Dòng này đã xảy ra mấy lần liên tiếp. */
  count: number;
  life: number;
};

/**
 * Lớp thông tin trên màn hình. Tách khỏi scene vì HUD là thứ sẽ đổi nhiều nhất.
 *
 * CANON §15 / P1-04: cỡ chữ theo cài đặt và HỘP TỰ GIÃN theo chữ (200% không tràn),
 * nền ĐỤC (alpha 1), không viết hoa toàn bộ. Được hiện: giờ, tiền, câu khách gọi NGUYÊN
 * VĂN, thứ đã bỏ vào ổ đang cầm. KHÔNG hiện: điểm, sao, thanh kiên nhẫn, chỉ số quan hệ,
 * "đúng/sai" của hệ thống (P1-04 §2.10).
 */
export class Hud {
  private left: Phaser.GameObjects.Text;
  private right: Phaser.GameObjects.Text;
  private statBg: Phaser.GameObjects.Graphics;
  private prompt: Phaser.GameObjects.Text;
  private promptBg: Phaser.GameObjects.Graphics;
  private bar: Phaser.GameObjects.Graphics;
  private feedText: Phaser.GameObjects.Text;
  private feedBg: Phaser.GameObjects.Graphics;
  private feed: string[] = [];
  private ticketBg: Phaser.GameObjects.Graphics;
  private ticketText: Phaser.GameObjects.Text;
  private help: Phaser.GameObjects.Text;
  private saveDot: Phaser.GameObjects.Arc;
  private carryBg: Phaser.GameObjects.Graphics;
  private carryIcons: Phaser.GameObjects.Image[] = [];
  private carryNums: Phaser.GameObjects.Text[] = [];
  private carryKey = "";
  private handsGfx: Phaser.GameObjects.Graphics;
  private handsKey = "";
  private eyePlate: Phaser.GameObjects.Graphics;
  private eye: Phaser.GameObjects.Image | null = null;
  private toastBg: Phaser.GameObjects.Graphics;
  private toasts: Toast[] = [];
  private scene: Phaser.Scene;
  private fs: (n: number) => string;

  constructor(scene: Phaser.Scene, private settings: Settings, onPause?: () => void) {
    this.scene = scene;
    const fs = this.fs = (n: number) => `${Math.round(n * settings.textScale)}px`;
    const fixed = <T extends Phaser.GameObjects.GameObject>(o: T, d = DEPTH) =>
      (o as any).setScrollFactor(0).setDepth(d) as T;

    this.statBg = fixed(scene.add.graphics());
    const stat = (x: number, origin: number) => fixed(scene.add.text(x, 20, "", {
      fontFamily: FONT, fontSize: fs(14), fontStyle: "500", color: UI.ink, lineSpacing: Math.round(7 * settings.textScale),
    }).setOrigin(origin, 0), DEPTH + 100);
    this.left = stat(26, 0);
    this.right = stat(GAME_W - 26, 1);

    this.promptBg = fixed(scene.add.graphics());
    // Hộp tự giãn theo chữ, và không bao giờ rộng hơn khung (CANON §15.1): dòng nhắc dài
    // nhất ở cỡ chữ 200% đo được 783 px / 1024 — nhưng câu mới thì cứ xuống dòng, đừng tràn.
    this.prompt = fixed(scene.add.text(GAME_W / 2, GAME_H - 66, "", {
      fontFamily: FONT, fontSize: fs(15), fontStyle: "500", color: UI.ink, align: "center",
      wordWrap: { width: GAME_W - 80 },
    }).setOrigin(0.5), DEPTH + 100);

    this.bar = fixed(scene.add.graphics(), DEPTH + 50);

    // Phiếu đơn: câu khách gọi NGUYÊN VĂN, ghim suốt lượt (P1-03 §2.4.3). Ở góc trên PHẢI,
    // dưới ô tiền: góc đó là tường sau quán — không che mặt khách, không bị bảng kẹp nhân
    // (bên trái) che, dù câu dài hay chữ to cỡ nào.
    this.ticketBg = fixed(scene.add.graphics());
    this.ticketText = fixed(scene.add.text(GAME_W - 26, 100, "", {
      fontFamily: FONT, fontSize: fs(13), fontStyle: "500", color: UI.ink, align: "right",
      lineSpacing: Math.round(7 * settings.textScale), wordWrap: { width: 320 * Math.min(settings.textScale, 1.5) },
    }).setOrigin(1, 0), DEPTH + 100);

    // Nhật ký lời khách — nền đục để đọc được trên mọi nền.
    this.feedBg = fixed(scene.add.graphics());
    this.feedText = fixed(scene.add.text(26, GAME_H - 100, "", {
      fontFamily: FONT, fontSize: fs(12), color: "#f2efe9", lineSpacing: Math.round(6 * settings.textScale),
      wordWrap: { width: 380 },
    }).setOrigin(0, 1), DEPTH + 100);

    // CANON §15.1 / P1-04: ở cỡ chữ 200% dòng này dài 1131 px so với khung 1024 — tràn
    // hẳn ra ngoài hai mép. Cho nó XUỐNG DÒNG theo bề ngang khung (ngắt đúng dấu "·" vì
    // hai bên dấu đều có khoảng trắng) và neo ở ĐÁY màn hình, rồi `drawPrompt` đẩy dòng
    // nhắc lên trên nó — không cắt chữ, không thu nhỏ chữ của người cần chữ to.
    this.help = fixed(scene.add.text(GAME_W / 2, GAME_H - 8, HELP_BY_DAY[0], {
      fontFamily: FONT, fontSize: fs(11), color: "#f2efe9", stroke: "#1b2429", strokeThickness: 3,
      align: "center", wordWrap: { width: GAME_W - 32 },
    }).setOrigin(0.5, 1), DEPTH + 100);

    this.carryBg = fixed(scene.add.graphics());

    // Nút tạm dừng bấm được bằng chuột / chạm — không bắt ai phải có bàn phím (CANON §15.2).
    const px = GAME_W / 2, py = 26;
    const pbg = fixed(scene.add.graphics());
    pbg.fillStyle(UI.paper, 1).fillRoundedRect(px - 24, py - 18, 48, 36, 10);
    pbg.fillStyle(0x222a31, 1).fillRect(px - 7, py - 8, 5, 16).fillRect(px + 2, py - 8, 5, 16);
    const hit = fixed(scene.add.zone(px, py, 48, 36).setInteractive({ useHandCursor: true }), DEPTH + 200);
    hit.on("pointerup", () => onPause?.());

    this.handsGfx = fixed(scene.add.graphics());

    // Con mắt "có người nhìn". Trên nút tạm dừng một nấc — nó không được nằm dưới gì cả.
    // Icon chưa tải xong (hoặc thiếu file) thì bỏ qua: HUD vẫn chạy, chỉ là không có mắt.
    this.eyePlate = fixed(scene.add.graphics(), DEPTH + 150);
    if (scene.textures.exists(ICON.eyeInk) && scene.textures.exists(ICON.eyeRed)) {
      this.eye = fixed(scene.add.image(EYE_X, EYE_Y, ICON.eyeInk), DEPTH + 151)
        .setDisplaySize(EYE_W, EYE_H).setVisible(false);
    }

    // Dải thông báo. POOL cố định, không `add.text` mỗi lần: giờ cao điểm là vài chục
    // dòng mỗi phút, cấp phát từng cái là một cú GC rơi đúng lúc đông khách nhất
    // (cùng lý do với `BubblePool` và `MoneyPops`).
    this.toastBg = fixed(scene.add.graphics(), DEPTH + 160);
    for (let i = 0; i < TOAST_MAX; i++) {
      this.toasts.push({
        text: fixed(scene.add.text(TOAST_RIGHT, 0, "", {
          fontFamily: FONT, fontSize: fs(13), fontStyle: "500", color: UI.ink,
          // 236 px: một dòng thông báo dài ("Bà Bảy quý hẳn lên — cho thêm đồ chua") ở
          // 330 px thì thò sang tận giữa màn hình và đè lên nhãn trạm. Ở 236 nó xuống
          // dòng và nằm gọn trong cột phải, chung mép với ô tiền và phiếu đơn.
          align: "right", wordWrap: { width: 236 },
        }).setOrigin(1, 0).setVisible(false), DEPTH + 161),
        born: -1,
        tone: "info",
        body: "",
        count: 0,
        life: TOAST_MIN_MS,
      });
    }

    this.saveDot = fixed(scene.add.circle(GAME_W - 14, GAME_H - 14, 4, 0xf4f1e8), DEPTH + 100).setAlpha(0);
  }

  /**
   * MỘT dòng máy báo cho người chơi: việc vừa làm, thứ vừa được, thứ vừa mất.
   * KHÔNG dùng cho lời người nói — lời người đi `say()`.
   *
   * Hết chỗ thì cướp dòng GIÀ NHẤT: cái vừa xảy ra bao giờ cũng cần hơn cái sắp tắt.
   */
  toast(text: string, tone: ToastTone = "info", now = this.scene.time.now) {
    // Cùng một chuyện xảy ra liên tiếp thì GỘP thành "×N", không xếp ba dòng y hệt:
    // ba dòng giống nhau chiếm hết chỗ của ba chuyện KHÁC NHAU, mà thông tin thì vẫn
    // chỉ là một. Bơm lại `born` để cái gộp cũng được đếm lại giờ từ đầu.
    const same = this.toasts.find((t) => t.born >= 0 && t.body === text);
    if (same) {
      same.count++;
      same.born = now;
      same.tone = tone;
      this.dressToast(same);
      return;
    }
    // Hết chỗ thì cướp dòng GIÀ NHẤT: cái vừa xảy ra bao giờ cũng cần hơn cái sắp tắt.
    const slot = this.toasts.find((t) => t.born < 0)
      ?? this.toasts.reduce((a, b) => (a.born <= b.born ? a : b));
    slot.body = text;
    slot.count = 1;
    slot.tone = tone;
    slot.born = now;
    slot.text.setVisible(true).setAlpha(1);
    this.dressToast(slot);
  }

  /** Viết chữ ra (kèm "×N" nếu lặp) rồi tính lại tuổi thọ theo đúng lượng chữ phải đọc. */
  private dressToast(t: Toast) {
    t.text.setText(t.count > 1 ? `${t.body}  ×${t.count}` : t.body);
    const chars = t.text.text.length;
    t.life = Math.min(TOAST_MAX_MS, Math.max(TOAST_MIN_MS, TOAST_BASE_MS + chars * TOAST_PER_CHAR_MS));
  }

  /**
   * Chỉ báo autosave — P0-02 §4: một chấm nhỏ mờ dần 0,8 s ở góc.
   * KHÔNG vòng xoay, KHÔNG chặn thao tác.
   */
  flashSaved() {
    this.scene.tweens.killTweensOf(this.saveDot);
    this.saveDot.setAlpha(0.85);
    this.scene.tweens.add({ targets: this.saveDot, alpha: 0, duration: 800, ease: "Sine.easeIn" });
  }

  /** Đáy khung ngày/giờ góc trên trái — để bảng kẹp nhân nằm ngay dưới, không đè lên. */
  get statsBottom() {
    return this.left.getBounds().bottom + 11;
  }

  /**
   * Bảng kẹp nhân mở (bên trái) thì nhật ký LỜI NGƯỜI dời sang phải, sát đáy màn hình —
   * không thì câu gọi món nằm khuất sau bảng đúng lúc đang kẹp nhân theo câu đó.
   * (Thông báo của máy không vướng bảng: nó ở đỉnh màn hình — xem `drawToasts`.)
   */
  dockFeed(right: boolean) {
    const x = right ? 496 : 26;
    if (this.feedText.x === x) return;
    this.feedText.setPosition(x, right ? GAME_H - 14 : GAME_H - 100);
    this.redrawFeedBg();
  }

  private redrawFeedBg() {
    this.feedBg.clear();
    if (!this.feed.length) return;
    const b = this.feedText.getBounds();
    this.feedBg.fillStyle(0x2b2f31, 1).fillRoundedRect(b.x - 10, b.y - 6, b.width + 20, b.height + 12, 8);
  }

  /**
   * Kênh LỜI NGƯỜI — khách nói, mình nói. Góc dưới trái, ba dòng gần nhất.
   *
   * Việc máy báo ("lau thớt", "khét rồi!") KHÔNG đi đường này nữa — xem `toast()` và
   * khối chú thích ở `TOAST_X`. Vẫn không có lời phán của hệ thống ở cả hai kênh:
   * không "đúng rồi", không "sai rồi", chỉ sự việc.
   */
  say(line: string) {
    this.log(line);
  }

  /** Tên cũ của `say` — còn chỗ gọi nào chưa đổi thì vẫn chạy đúng kênh lời người. */
  log(line: string) {
    this.feed.push(line);
    if (this.feed.length > 3) this.feed.shift();
    this.feedText.setText(this.feed.join("\n"));
    this.redrawFeedBg();
  }

  /** Dọn cả hai kênh chữ — đổi ngày, rời cảnh. */
  clearLog() {
    this.feed = [];
    this.feedText.setText("");
    this.feedBg.clear();
    for (const t of this.toasts) { t.born = -1; t.count = 0; t.body = ""; t.text.setVisible(false); }
    this.toastBg.clear();
  }

  update(s: {
    day: number; seasonDays: number; clock: Clock; money: number; served: number;
    near: Station | null; hand: Hand; busy: { st: Station; ms: number } | null;
    frozen: boolean;
    ticket: { name: string; text: string; urgent: boolean } | null;
    /** Scene biết điều trạm không biết (vd. ổ đang gác trên thớt) → ghi đè dòng nhắc. */
    prompt?: string | null;
    /** Ổ đã gói đang cầm trên tay — dải "đã bỏ" (P1-01 §4, CANON §15.5). */
    carry?: readonly Ingredient[] | null;
    /** Tay sạch / dính tiền (P1-01 §2.8). */
    hands?: "CLEAN" | "MONEY";
    /** Có ai đang để mắt tới mình không — con mắt ở đỉnh màn hình. */
    watch?: Watch;
    /** Đồng hồ hiệu ứng của scene (dừng khi pause) — nhịp của dải thông báo. */
    now?: number;
    /** Tay đang dở một việc có thời lượng (lau thớt, nhận tiền) — 0..1. */
    work?: { frac: number } | null;
  }) {
    // Tên khung giờ bằng CHỮ, không thanh tiến trình (P0-02 §4). Giờ viết kiểu "6h47".
    const m = Math.floor(s.clock.minutes);
    const hhmm = `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
    const slow = this.settings.noTimePressure ? " · thong thả" : "";
    // P4-02 §4: KHÔNG có "/40" — người chơi không được đếm ngược, chữ đó biến mùa thành thanh tiến trình
    this.left.setText(`ngày ${s.day}\n${hhmm} · ${BAND_LABEL[s.clock.band]}${slow}`);
    this.right.setText(`${s.money.toLocaleString("vi-VN")}₫\nđã bán ${s.served} ổ`);
    this.drawStats();

    const show = s.day <= HELP_UNTIL_DAY && this.feedText.x < 100;
    if (show) this.help.setText(HELP_BY_DAY[Math.min(s.day, HELP_BY_DAY.length) - 1]);
    this.help.setVisible(show);
    this.drawPrompt(s.near, s.hand, s.frozen, s.prompt ?? null);
    this.drawBar(s.busy, s.work ?? null);
    this.drawTicket(s.ticket, s.frozen);
    this.drawCarry(s.frozen ? null : s.carry ?? null);
    this.drawHands(s.hands ?? "CLEAN");
    this.drawEye(s.frozen ? "NONE" : s.watch ?? "NONE");
    this.drawToasts(s.now ?? this.scene.time.now, this.settings.reducedMotion);
  }

  /**
   * Dải thông báo ở đỉnh màn hình — xem khối chú thích ở `TOAST_X`.
   *
   * MỚI NHẤT Ở TRÊN: dòng mới rơi sát ngay dưới phiếu đơn — chỗ mắt người chơi đã
   * phải liếc tới sẵn — rồi mới bị đẩy xuống khi có dòng mới hơn.
   *
   * Nhận `now` là ĐỒNG HỒ HIỆU ỨNG của scene chứ không phải `time.now`: bảng trò chuyện
   * và menu đóng băng `clock` chứ không đóng băng Phaser — dùng `time.now` thì thông báo
   * tắt mất trong lúc người chơi đang đọc bảng (cùng lý do với `MoneyPops.update`).
   */
  private drawToasts(now: number, reducedMotion: boolean) {
    const g = this.toastBg;
    g.clear();
    // Trẻ nhất trước — `born` lớn hơn là sinh sau.
    const live = this.toasts.filter((t) => t.born >= 0).sort((a, b) => b.born - a.born);
    // Bắt đầu dưới phiếu đơn — phiếu là thứ người chơi phải đọc suốt lượt, không được đè.
    const ticketBottom = this.ticketText.text ? this.ticketText.getBounds().bottom + 18 : 0;
    let y = Math.max(TOAST_TOP, ticketBottom);
    for (const t of live) {
      const age = (now - t.born) / t.life;
      if (age >= 1) { t.born = -1; t.count = 0; t.body = ""; t.text.setVisible(false); continue; }
      const alpha = age < TOAST_FADE_FROM ? 1 : 1 - (age - TOAST_FADE_FROM) / (1 - TOAST_FADE_FROM);
      const slide = reducedMotion ? 0 : Math.max(0, 1 - (now - t.born) / TOAST_SLIDE_MS) * TOAST_SLIDE_PX;
      const h = t.text.height + 12, w = t.text.width + 30;
      const x1 = TOAST_RIGHT + slide, x0 = x1 - w, y0 = y;
      g.fillStyle(0x0d1216, 0.18 * alpha).fillRoundedRect(x0 + 1, y0 + 4, w, h, 9);
      g.fillStyle(UI.paper, alpha).fillRoundedRect(x0, y0, w, h, 9);
      // Vạch màu đầu dòng: được / mất / chuyện đang xảy ra. Bỏ màu đi vẫn đọc được chữ.
      g.fillStyle(TOAST_TONE[t.tone], alpha).fillRoundedRect(x0 + 5, y0 + 6, 3, h - 12, 1.5);
      t.text.setPosition(x1 - 12, y0 + 6).setAlpha(alpha);
      y += h + TOAST_GAP;
    }
  }

  /**
   * Con mắt ở đỉnh màn hình — xem khối chú thích ở `EYE_X`.
   *
   * Icon là file SVG (`public/art/eye-*.svg`, sinh bởi `tools/make-icons.ts`), không vẽ
   * tay bằng Graphics: nét sắc ở mọi cỡ màn hình và sửa hình không phải sửa code.
   *
   * Hai bậc KHÔNG phân biệt bằng màu không thôi (P1-04 §4.1) — bậc nặng NHÁY, bậc nhẹ
   * đứng yên; nhấp nháy là một kênh riêng, người không phân biệt được đỏ vẫn đọc ra.
   * `reducedMotion` thì tắt nháy, giữ nguyên mức đậm nhất (CANON §15.3).
   */
  private drawEye(w: Watch) {
    const eye = this.eye;
    const on = w !== "NONE";
    this.eyePlate.clear();
    eye?.setVisible(on);
    // Icon thiếu thì KHÔNG vẽ đĩa giấy: một cái đĩa trống ở đỉnh màn hình khó hiểu hơn
    // là không có gì.
    if (!on || !eye) return;

    const close = w === "CLOSE";
    // 0 → 1 → 0, hình sin nên không giật ở hai đầu chu kỳ
    const beat = this.settings.reducedMotion || !close
      ? 1
      : 0.5 + 0.5 * Math.sin((this.scene.time.now / EYE_BLINK_MS) * Math.PI * 2);

    // Đĩa giấy đục y hệt icon bàn tay và nút tạm dừng — ba ô một hàng (CANON §15: nền ĐỤC).
    const pw = EYE_PLATE_W, ph = EYE_PLATE_H;
    this.eyePlate.fillStyle(UI.paper, 1).fillRoundedRect(EYE_X - pw / 2, EYE_Y - ph / 2, pw, ph, 10);
    if (close) {
      this.eyePlate.lineStyle(2, EYE_RED, 0.35 + 0.5 * beat);
      this.eyePlate.strokeRoundedRect(EYE_X - pw / 2, EYE_Y - ph / 2, pw, ph, 10);
    }

    // Đổi TEXTURE chứ không `setTint` — xem lý do ở `tools/make-icons.ts`.
    // `setTexture` làm mất displaySize (Phaser đặt lại theo frame mới), set lại ngay sau.
    eye.setTexture(close ? ICON.eyeRed : ICON.eyeInk)
      .setDisplaySize(EYE_W, EYE_H)
      .setAlpha(close ? 0.55 + 0.45 * beat : 0.75);
  }

  /**
   * Icon bàn tay, khác nhau về HÌNH DẠNG (P1-04 §2.8): CLEAN = bàn tay rỗng viền ·
   * MONEY = bàn tay + tờ tiền đặt chéo. Nằm cạnh nút tạm dừng, luôn thấy.
   */
  private drawHands(state: "CLEAN" | "MONEY") {
    if (state === this.handsKey) return;
    this.handsKey = state;
    const g = this.handsGfx;
    g.clear();
    const x = GAME_W / 2 - 58, y = 26;
    g.fillStyle(UI.paper, 1).fillRoundedRect(x - 22, y - 18, 44, 36, 10);
    const ink = 0x222a31;
    g.lineStyle(2, ink, 1);
    g.strokeRoundedRect(x - 7, y - 3, 14, 13, 3);                     // lòng bàn tay
    for (let i = 0; i < 4; i++) g.strokeRoundedRect(x - 7 + i * 3.6, y - 12, 2.6, 10, 1.2);  // bốn ngón
    g.strokeRoundedRect(x + 7, y - 1, 5, 3, 1.2);                     // ngón cái
    if (state === "MONEY") {
      g.fillStyle(0x5f9e6e, 1);
      g.fillPoints([{ x: x - 12, y: y + 6 }, { x: x + 2, y: y - 6 }, { x: x + 12, y: y + 2 }, { x: x - 2, y: y + 14 }], true);
      g.lineStyle(1.5, 0xf2efe9, 1).strokeCircle(x, y + 4, 3);
    }
  }

  private drawStats() {
    const g = this.statBg;
    g.clear();
    for (const t of [this.left, this.right]) {
      const b = t.getBounds();
      g.fillStyle(0x0d1216, 0.18).fillRoundedRect(b.x - 14, b.y - 9, b.width + 28, b.height + 18, 12);
      g.fillStyle(UI.paper, 1).fillRoundedRect(b.x - 14, b.y - 11, b.width + 28, b.height + 18, 12);
    }
  }

  private drawTicket(t: { name: string; text: string; urgent: boolean } | null, frozen: boolean) {
    this.ticketBg.clear();
    if (!t || frozen) { this.ticketText.setText(""); return; }
    const top = this.right.getBounds().bottom + 20;
    this.ticketText.setText(`${t.name}\n${t.text}`).setPosition(GAME_W - 26, top);
    const b = this.ticketText.getBounds();
    this.ticketBg.fillStyle(UI.paper, 1).fillRoundedRect(b.x - 12, b.y - 8, b.width + 24, b.height + 16, 10);
    this.ticketBg.lineStyle(1.2, UI.line, 1).strokeRoundedRect(b.x - 12, b.y - 8, b.width + 24, b.height + 16, 10);
  }

  /** "Đã bỏ": icon từng món + số phần, luôn thấy lúc cầm ổ đã gói đi ra quầy. */
  private drawCarry(dish: readonly Ingredient[] | null) {
    const key = dish ? dish.join(",") : "";
    if (key === this.carryKey) return;
    this.carryKey = key;
    this.carryBg.clear();
    for (const o of [...this.carryIcons, ...this.carryNums]) o.setVisible(false);
    if (!dish || !dish.length || !this.scene.textures.exists(FOOD.icon("pate"))) return;

    const counts = portionsOf(dish as Ingredient[]);
    const items = INGREDIENTS.filter((i) => counts.has(i.id));
    // Ngay dưới nút tạm dừng ở giữa trên — vùng tường sau, không đụng nhật ký góc dưới trái.
    const step = 46, w = items.length * step + 16, y = 76;
    // không lấn sang phiếu đơn ở góc phải
    const x0 = Math.max(16, Math.min(GAME_W / 2 - w / 2, this.ticketText.getBounds().left - 24 - w));
    this.carryBg.fillStyle(UI.paper, 1).fillRoundedRect(x0, y - 22, w, 44, 10);
    items.forEach((ing, i) => {
      const icon = this.carryIcons[i] ??= this.scene.add.image(0, 0, FOOD.icon(ing.id)).setScrollFactor(0).setDepth(DEPTH + 100);
      const num = this.carryNums[i] ??= this.scene.add.text(0, 0, "", {
        fontFamily: FONT, fontSize: this.fs(11), fontStyle: "700", color: UI.ink,
      }).setOrigin(0, 1).setScrollFactor(0).setDepth(DEPTH + 101);
      const cx = x0 + 8 + step * i + step / 2 - 4;
      fitPhoto(icon.setTexture(FOOD.icon(ing.id)), 0.62).setPosition(cx, y).setVisible(true);
      num.setText(`×${counts.get(ing.id)}`).setPosition(cx + 11, y + 18).setVisible(true);
    });
  }

  /**
   * Mép trên của dòng hướng dẫn phím — dòng nhắc và thanh tiến trình xếp NGƯỢC LÊN từ
   * đây. Ở cỡ chữ 200% dòng hướng dẫn chiếm hai dòng, đặt cứng `GAME_H − 66` là đè lên.
   */
  private get stackTop() {
    return this.help.visible ? this.help.getBounds().top - 8 : GAME_H - 48;
  }

  /** `override` không cần trạm: khoảng lặng ngày 40 nhắc phím bỏ qua giữa hẻm trống. */
  private drawPrompt(st: Station | null, hand: Hand, frozen: boolean, override: string | null) {
    this.promptBg.clear();
    if (frozen || (!st && !override)) { this.prompt.setText(""); return; }

    const why = override || !st ? null : blockedReason(st, hand);
    const keyHint = st && st.holdMs === 0 ? "bấm E" : "giữ E";
    this.prompt.setText(override ?? (why
      ? `${st!.name} — ${why}`
      : `${st!.name} — ${keyHint} để ${st!.verb}`));

    const w = this.prompt.width + 34, h = this.prompt.height + 16;
    const x = GAME_W / 2 - w / 2, y = this.stackTop - h;
    this.prompt.setPosition(GAME_W / 2, y + h / 2);
    this.promptBg.fillStyle(0x0d1216, 0.22);
    this.promptBg.fillRoundedRect(x, y + 3, w, h, 10);
    this.promptBg.fillStyle(why ? 0xe7e0d2 : UI.paper, 1);
    this.promptBg.fillRoundedRect(x, y, w, h, 10);
  }

  /** Thanh tiến trình của thao tác giữ phím (rót trà). */
  /**
   * Thanh tiến trình dưới dòng nhắc — MỘT thanh dùng cho HAI loại việc:
   *
   *  · GIỮ PHÍM ở một trạm (`busy`): đầy rồi thì xanh, vì người chơi được quyền nhả tay.
   *  · TAY ĐANG BẬN (`work`): một việc đã lỡ bắt đầu, không bấm gì nhanh hơn được, nên
   *    không bao giờ xanh — xanh là lời mời nhả phím, mà ở đây có phím nào để nhả đâu.
   *
   * Có cái thanh này thì câu "đang lau thớt…" mới thành thông tin: người chơi thấy việc
   * đang chạy tới đâu thay vì tưởng máy từ chối vô cớ. Ngược lại, việc xong trong tích tắc
   * (đặt xuống, nhặt lên, bỏ vô thùng, nhận tiền) KHÔNG gửi `work` xuống đây — xem
   * `beBusy(…, "quick")` ở `StallScene`.
   */
  private drawBar(busy: { st: Station; ms: number } | null, work: { frac: number } | null) {
    this.bar.clear();
    const frac = busy ? Math.min(1, busy.ms / busy.st.holdMs) : work ? work.frac : -1;
    if (frac < 0) return;
    const done = !!busy && busy.ms >= busy.st.holdMs;
    const promptH = this.prompt.text ? this.prompt.height + 16 : 0;
    const W = 200, H = 10, x = GAME_W / 2 - W / 2, y = this.stackTop - promptH - H - 12;
    this.bar.fillStyle(0x1b2429, 0.55);
    this.bar.fillRoundedRect(x - 2, y - 2, W + 4, H + 4, 6);
    this.bar.fillStyle(done ? 0x6fbf8a : 0xe8c27a, 1);
    this.bar.fillRoundedRect(x, y, Math.max(4, W * frac), H, 5);
  }
}
