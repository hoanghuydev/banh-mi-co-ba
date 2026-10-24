export type AchTier = "dong" | "bac" | "vang" | "kc";

export type AchDef = {
  id: string;
  name: string;
  tier: AchTier;
  /** Che tên và điều kiện trong app cho tới khi đạt. */
  hidden: boolean;
  /** Danh hiệu "thất bại", đạt được khi làm hỏng việc gì đó. */
  fail: boolean;
  /** Điều kiện một câu, tiếng phổ thông. */
  cond: string;
  /** Mô tả một câu, giọng Hệ thống. */
  desc: string;
};

export const TIER_LABEL: Record<AchTier, string> = { dong: "Đồng", bac: "Bạc", vang: "Vàng", kc: "Kim cương" };

const a = (
  id: string, name: string, tier: AchTier, cond: string, desc: string, flags: { hidden?: true; fail?: true } = {},
): AchDef => ({ id, name, tier, hidden: !!flags.hidden, fail: !!flags.fail, cond, desc });

export const ACH_LIST: readonly AchDef[] = [
  a("dau_xuoi", "Đầu xuôi đuôi lọt", "dong", "Bán ổ bánh mì đầu tiên", "Vạn sự khởi đầu nan. Ổ đầu tiên đã xuất quầy."),
  a("co_tieng", "Có tiếng có tăm", "dong", "Nhận đánh giá đầu tiên", "Có người lên tiếng, quầy bánh mì chính thức có danh tiếng."),
  a("hoc_an", "Học ăn học nói", "dong", "Làm xong hướng dẫn ngày đầu", "Tân thủ thôn đã xuất sư."),
  a("troi_xui", "Trời xui đất khiến", "dong", "Liên kết với Hệ thống", "Duyên phận đã định, Hệ thống đã ràng buộc ký chủ."),
  a("vui_long", "Vui lòng khách đến", "dong", "Nhận đánh giá 5 sao đầu tiên", "Khách hài lòng, hảo cảm +1."),
  a("nang_nhat", "Năng nhặt chặt bị", "dong", "Bán tổng cộng 100 ổ", "Trăm ổ vào tay, tích tiểu thành đại."),
  a("mot_nang", "Một nắng hai sương", "dong", "Mở quầy qua ngày 30", "Ba mươi ngày dãi nắng dầm mưa, ký chủ vẫn đứng vững."),
  a("lua_thu", "Lửa thử vàng", "dong", "Làm cháy 5 ổ trong một ngày", "Lửa thử vàng, gian nan thử sức.", { fail: true }),
  a("ngua_co", "Ngựa có lúc sẩy chân", "dong", "Nhận đánh giá đau bụng đầu tiên", "Thất thủ một lần, Hệ thống đã ghi vào sổ.", { fail: true }),
  a("chin_nguoi", "Chín người mười ý", "dong", "Nhận đánh giá 1 sao đầu tiên", "Thiên hạ rộng lớn, không thiếu người khó tính.", { fail: true }),
  a("vang_chua", "Vắng như chùa Bà Đanh", "dong", "Mở quầy cả ngày mà không bán được ổ nào", "Cả ngày không một bóng khách, quầy lạnh như chùa.", { fail: true }),
  a("that_lung", "Thắt lưng buộc bụng", "dong", "Lỗ 3 ngày liên tiếp", "Chi nhiều hơn thu ba ngày liền, túi tiền bị siết chặt.", { fail: true }),
  a("gia_cat_co", "Giá cắt cổ", "dong", "Có 5 khách bỏ đi vì giá trong một ngày", "Giá cao ngất ngưởng, khách nhìn rồi quay đi.", { fail: true }),
  a("o_hien", "Ở hiền gặp lành", "dong", "Đãi 20 ly trà đá", "Thiện duyên đã kết, phúc báo sẽ đến."),
  a("cua_ben", "Của bền tại người", "dong", "Bán được một món đồ cũ", "Đồ cũ gặp chủ mới, bạc lẻ vào túi."),

  a("kien_tha", "Kiến tha lâu đầy tổ", "bac", "Bán tổng cộng 1.000 ổ", "Kiến tha lâu cũng đầy tổ, một nghìn ổ đã vào sổ."),
  a("dung_mui", "Đứng mũi chịu sào", "bac", "Mở quầy qua ngày 60", "Sáu mươi ngày chống đỡ, ký chủ đã là trụ cột của con hẻm."),
  a("cua_an", "Của ăn của để", "bac", "Có 10 triệu tiền mặt", "Tiền trong ống đã chạm mốc mười triệu."),
  a("dat_tom", "Đắt như tôm tươi", "bac", "Bán hết sạch bánh khi vẫn còn khách đến", "Hàng hết sạch, khách đến sau đành tay không."),
  a("co_qua", "Có qua có lại", "bac", "Trả lời 10 đánh giá", "Lễ nghĩa qua lại, nhân duyên thêm một bậc."),
  a("loi_ra", "Lời ra tiếng vào", "bac", "Nhận 100 đánh giá", "Trăm lời đồn, quầy bánh mì đã nổi danh khắp hẻm."),
  a("tai_bay", "Tai bay vạ gió", "bac", "Nhận 5 đánh giá 1 sao", "Họa từ trên trời rơi xuống, ký chủ không thể tránh.", { fail: true }),
  a("quay_dau", "Quay đầu là bờ", "bac", "Dùng thẻ sửa đánh giá lần đầu", "Quay đầu là bờ, một đánh giá đã được viết lại."),
  a("lo_bat_quai", "Lò Bát Quái", "bac", "Làm cháy 10 ổ trong một ngày", "Lò than bừng cháy, mười ổ hóa thành tro tàn.", { fail: true, hidden: true }),
  a("nuoc_do", "Nước đổ lá khoai", "bac", "Mất 10 khách vì làm rơi ổ bánh", "Mười ổ rơi xuống đất, mười khách phất tay áo bỏ đi.", { fail: true, hidden: true }),
  a("benh_tu", "Bệnh từ miệng vào", "bac", "Bị đóng cửa vì an toàn thực phẩm", "Bệnh tòng khẩu nhập, quầy bánh mì bị phong ấn.", { fail: true, hidden: true }),
  a("nha_tan", "Nhà tan cửa nát", "bac", "Phá sản", "Gia sản tiêu tán, giang hồ hẹn ngày tái ngộ.", { fail: true, hidden: true }),
  a("ngoi_cho", "Ngồi chờ sung rụng", "bac", "Bán dưới 5 ổ trong 3 ngày liên tiếp", "Ba ngày ngồi không, sung vẫn chưa rụng.", { fail: true, hidden: true }),
  a("lay_cong", "Lấy công làm lãi", "bac", "Cả ngày để mọi món giá thấp nhất và bán từ 25 ổ", "Bán rẻ lấy lượng, góp từng đồng lẻ.", { hidden: true }),
  a("quen_mat", "Quen mặt đắt hàng", "bac", "Một khách ghé quầy 50 lần", "Một vị khách đã hóa khách quen, năm mươi lần ghé quầy."),
  a("tien_nao", "Tiền nào của nấy", "bac", "Mua tủ mát", "Tiền nào của nấy, thần khí bảo quản đã nhập xe."),
  a("an_ngon", "Ăn ngon ngủ yên", "bac", "30 ngày liền không khách nào đau bụng", "Ba mươi ngày bình an, thực phẩm đạt chuẩn."),
  a("buon_co_ban", "Buôn có bạn bán có phường", "bac", "Đặt hàng đủ 7 nhà cung cấp", "Bảy nhà cung cấp, bảy mối giao hảo."),
  a("kho_truoc", "Khổ trước sướng sau", "bac", "Trả hết nợ mặt bằng sau khi từng nợ", "Nợ cũ đã xóa, khổ tận cam lai."),
  a("rau_ong", "Râu ông cằm bà", "bac", "Nhận một đánh giá nhầm quán", "Có người nhầm quán, Hệ thống không tiếp nhận khiếu nại.", { hidden: true }),
  a("tren_troi", "Trên trời rơi xuống", "bac", "Quay trúng đồ nghề miễn phí", "Bảo khí từ trên trời rơi xuống, ký chủ nhận lấy.", { hidden: true }),

  a("gop_gio", "Góp gió thành bão", "vang", "Bán tổng cộng 1.600 ổ", "Một nghìn sáu trăm ổ, gió nhỏ đã thành bão lớn."),
  a("tien_vao", "Tiền vào như nước", "vang", "Có 20 triệu tiền mặt", "Tiền vào như nước, két sắt đã đầy hai mươi triệu."),
  a("mo_may", "Mở mày mở mặt", "vang", "Đạt mốc tiền thắng", "Mục tiêu tối thượng đã hoàn thành."),
  a("buon_may", "Buôn may bán đắt", "vang", "Thắng trước ngày 100", "Buôn may bán đắt, mục tiêu tối thượng hoàn thành sớm."),
  a("tram_hoa", "Trăm hoa đua nở", "vang", "Nhận 120 đánh giá 5 sao", "Một trăm hai mươi đóa hoa nở rộ trước quầy."),
  a("dat_xat", "Đắt xắt ra miếng", "vang", "Cả ngày mọi món giá cao nhất, bán từ 10 ổ, không mất khách vì chờ lâu hay làm rơi", "Giá cao ngất ngưởng mà khách vẫn xếp hàng.", { hidden: true }),
  a("them_ban", "Thêm bạn bớt thù", "vang", "Nói chuyện sâu với đủ 12 nhân vật có tên", "Mười hai tấm lòng đã mở, hẻm nhỏ nhiều duyên.", { hidden: true }),
  a("dau_vao", "Đâu vào đấy", "vang", "Lắp kín 14 chỗ trên xe", "Mọi thứ đâu vào đấy, xe đã đủ pháp bảo."),
  a("menh_ta", "Mệnh ta do ta", "vang", "Từ chối Hệ thống 2 lần", "Mệnh ta do ta, không do Hệ thống.", { hidden: true }),
  a("da_trang", "Dã tràng xe cát", "vang", "Trúng ô may mắn 8 lượt quay liên tiếp", "Dã tràng xe cát, tám lượt quay trắng tay.", { hidden: true }),
  a("chim_sa", "Chim sa cá lặn", "vang", "Nhan sắc đạt cấp 10", "Nghiêng nước nghiêng thành, chim sa cá lặn.", { hidden: true }),

  a("mot_von", "Một vốn bốn lời", "kc", "Thắng trước ngày 90", "Một vốn bốn lời, kỳ tích hiếm thấy.", { hidden: true }),
  a("tieng_lanh", "Tiếng lành đồn xa", "kc", "Sao trung bình từ 4,2 với ít nhất 50 đánh giá", "Tiếng lành đồn xa, thiên hạ đều biết."),
  a("sach_nhu", "Sạch như lau như li", "kc", "Thắng ván mà không cháy hay làm rơi ổ nào", "Sạch như lau như li, bụi trần không dính thân.", { hidden: true }),
  a("hai_ban_tay", "Hai bàn tay trắng", "kc", "Thắng ván mà không liên kết Hệ thống", "Hai bàn tay trắng, không mượn ngoại lực.", { hidden: true }),
  a("pha_gia", "Phá gia chi tử", "kc", "Phá sản trong 3 ngày đầu", "Phá gia chi tử, Hệ thống cạn lời.", { fail: true, hidden: true }),
];

export const ACH_BY_ID: Readonly<Record<string, AchDef>> = Object.fromEntries(ACH_LIST.map((x) => [x.id, x]));
