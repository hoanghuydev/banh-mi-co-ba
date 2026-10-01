import Phaser from "phaser";
import { buildTextures, preloadArt } from "../art";
import { sfx } from "../audio/sfx";

/**
 * Tải ảnh artist + nướng texture + đợi font rồi sang menu.
 *
 * Ảnh phải tải XONG trước `buildTextures`, vì art v2 (`art/photo.ts`) đè lên art v1
 * ngay trong đó. Ảnh chưa về kịp thì cảnh vẫn dựng được, chỉ là ra bản vẽ code.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

  preload() {
    preloadArt(this);
    /*
     * Âm báo giao diện nạp NGAY TỪ ĐẦU, bốn bus kia thì không.
     *
     * Lý do: mọi nút trong game đều kêu (xem `ui/theme.ts`), kể cả nút đầu tiên ở
     * sảnh — mà sảnh thì không có `preload` của riêng nó. Cả nhóm `amBao` chỉ cỡ
     * vài chục KB nên nạp hết cũng không làm chậm màn mở. Foley, giọng người và
     * ambience thì nặng hơn nhiều và chỉ cảnh quán mới cần, nên chúng nạp ở đó.
     */
    sfx.preload(this, sfx.idsOfBus("amBao"));
    // Hai tiếng của lúc SANG NGÀY MỚI. Chúng phát từ `DayScene` — scene thường trực,
    // không có `preload` của riêng nó — nên phải nạp ở đây, không thì ngày nào cũng
    // lặng lẽ trượt sang ngày sau. (Lỗi này đã thật sự xảy ra, và chỉ lộ ra ở một
    // dòng cảnh báo trong console.)
    sfx.preload(this, ["sfx_cua_cuon"]);
  }

  async create() {
    buildTextures(this);

    // Chờ font Việt tải xong, nếu không chữ có dấu sẽ nhảy layout một nhịp.
    try {
      await (document as any).fonts?.load?.('700 32px "Be Vietnam Pro"');
      await (document as any).fonts?.ready;
    } catch { /* không có Font Loading API thì thôi, fallback sans vẫn đọc được */ }

    document.getElementById("boot")?.classList.add("gone");
    this.scene.start("menu");
  }
}
