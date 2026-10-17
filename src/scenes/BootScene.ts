import Phaser from "phaser";
import { buildTextures, preloadArt } from "../art";
import { sfx } from "../audio/sfx";
import { fadeOut, paintTick, setLoading, setStep } from "../ui/bootScreen";

/**
 * Tải ảnh artist + nướng texture + đợi font rồi sang menu.
 *
 * Ảnh phải tải XONG trước `buildTextures`, vì art v2 (`art/photo.ts`) đè lên art v1
 * ngay trong đó. Ảnh chưa về kịp thì cảnh vẫn dựng được, chỉ là ra bản vẽ code.
 *
 * Mỗi bước ở đây báo một mốc cho thanh tiến độ của màn mở (`ui/bootScreen`). Ba bước chứ
 * không một: nạp ảnh là khúc dài nhất nhưng KHÔNG phải khúc cuối, và hai khúc sau
 * (`buildTextures` chặn luồng, chờ phông chữ Việt) đủ lâu để một thanh chạy tới 100% rồi
 * đứng im trông như treo.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super("boot"); }

  preload() {
    /*
     * Nối TRƯỚC khi xin tải file nào: `preloadArt` có đường bỏ qua (texture đã có thì
     * không xin lại), nên lượt tải rỗng là `progress` không bao giờ bắn. Đặt mốc đầu ở
     * đây cũng là chỗ thanh rời trạng thái "không xác định" sang có phần trăm thật.
     */
    setLoading(0);
    this.load.on("progress", setLoading);
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
    // `paintTick` TRƯỚC `buildTextures`: hàm đó chặn luồng chính, không nhường một nhịp
    // vẽ thì dòng chữ này không bao giờ hiện ra (xem `ui/bootScreen.paintTick`).
    setStep("đang dựng hình…", 0.9);
    await paintTick();
    buildTextures(this);

    // Chờ font Việt tải xong, nếu không chữ có dấu sẽ nhảy layout một nhịp.
    setStep("đang chờ phông chữ…", 0.96);
    try {
      await (document as any).fonts?.load?.('700 32px "Be Vietnam Pro"');
      await (document as any).fonts?.ready;
    } catch { /* không có Font Loading API thì thôi, fallback sans vẫn đọc được */ }

    fadeOut();
    this.scene.start("menu");
  }
}
