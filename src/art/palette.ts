/**
 * Bảng màu — nguồn duy nhất của tone game.
 * CANON §14: Sài Gòn buổi sáng là XANH XÁM + NẮNG GẮT TRẮNG, không phải vàng nghệ kiểu phim Mỹ.
 * Đổi file này là đổi tone cả game mà không phải đụng tới một hàm vẽ nào.
 */
export const PAL = {
  // ── ba loại mặt sàn: trong quán / vỉa hè / lòng đường
  //
  // Sàn quán là GẠCH MEN TRẮNG, không hoa văn. Đây là chỗ duy nhất trong game cố ý
  // để trống hẳn: nó là phông cho khoảnh khắc lõi — khách đứng nhìn tay mình làm
  // (T1). Sàn có hoa văn thì cái nền rối hơn chính thứ đứng trên nó. Vẫn giữ 4 sắc
  // độ chênh nhau một chút để mặt sàn không phẳng lì như tờ giấy.
  shopFloor: [0xf1efe9, 0xeceae3, 0xf4f2ed, 0xe8e6df] as const,
  shopJoint: 0xd0cdc4,
  walkFloor: [0x9fa9ab, 0x99a4a7, 0xa5aeb0, 0x95a0a3] as const,
  walkJoint: 0x7a878b,
  roadFloor: [0x5f696e, 0x5b656a, 0x646e73, 0x586268] as const,
  roadJoint: 0x4c565b,
  roadPaint: 0xd8d5c6,
  floorStain: 0x7d8c90,

  // ── tường quét vôi bạc màu + vệt rêu chân tường
  wall: 0xcfc7b4,
  wallTop: 0xded7c6,
  wallShade: 0xa79f8d,
  wallMoss: 0x8d9a7e,

  // ── nhà hàng xóm hai bên: khác tông để đọc ra là NHÀ KHÁC, không phải tường quán
  neighbour: [0xb9a893, 0xa8b0a2, 0xc3b0a4, 0x9fada9] as const,
  shutter: 0x6f7c85,
  window: 0x7e929c,
  windowFrame: 0xe4dfd0,

  // ── cửa ra vào phía sau quán
  doorWood: 0x8a5a3c,
  doorWoodDark: 0x6b4430,
  doorFrame: 0xcfc7b4,

  // ── quầy bánh mì (cố định, xây tại chỗ — không phải xe đẩy)
  counterTile: 0xe3ded1,        // mặt ốp gạch men của bệ quầy
  counterBase: 0x7f8a90,        // chân bệ xi măng
  counterBoard: 0xb98b5e,       // mặt thớt gỗ
  counterBoardDark: 0x9a7048,
  glass: 0xd6e7ec,
  glassFrame: 0x9aa3a6,

  // ── bảng hiệu đỏ chữ vàng (CANON §14)
  signRed: 0xc0392b,
  signRedDark: 0x8e2a20,
  signYellow: 0xf5c542,

  // ── vỏ kiến trúc: chi tiết vặt làm bức tường đọc ra là NHÀ chứ không phải khối hộp
  wallTile: 0x9fb2b8,           // gạch men ốp chân tường, kiểu nhà phố Sài Gòn
  wallTileJoint: 0x7d9198,
  meterBox: 0xd8d2c0,           // hộp đồng hồ điện
  meterGlass: 0x6f8891,
  wire: 0x2f363b,               // dây điện chằng chịt — không có nó thì không phải hẻm
  posterRed: 0xb8433a,          // tờ rao vặt / lịch treo tường
  posterPaper: 0xeee8d8,
  beadCurtain: 0xb9524a,        // rèm hạt cửa sau
  awning: 0x8fa3ab,             // mái tôn che nắng nhà hàng xóm
  awningStripe: 0xbf4b3f,

  // ── đồ nghề
  charcoal: 0x4a4038,
  charcoalDark: 0x332c26,
  ember: 0xff7a3c,
  emberHot: 0xffcf8a,
  grill: 0x8d8579,
  teaBarrel: 0x2f7350,
  teaBarrelDark: 0x225840,
  teaLid: 0x9fd6b6,
  crate: [0x3f7d9e, 0xd2a044, 0x8a5f8f] as const,

  // ── kệ nguyên liệu: khung sắt + hũ + rổ. Hạn dùng là ràng buộc kinh tế #1 (CANON §13)
  rackSteel: 0xa9b2b8,
  rackSteelDark: 0x76828a,
  shelfBoard: 0xb98b5e,
  jarGlass: 0xdde9eb,
  jarLid: 0xc0564a,
  pate: 0xb08055,
  pickle: 0xe6c86a,
  chilli: 0xc9432f,
  soySauce: 0x4a2f1f,
  herb: 0x6aa85f,
  herbDark: 0x4a8243,
  basket: 0xc79a5d,
  basketDark: 0x9a743f,
  bread: 0xdfa96b,
  breadDark: 0xb9834b,
  breadSlash: 0xf7e3c2,
  newsprint: 0xe4dfd0,

  // ── rác và két nước ngọt trên vỉa hè
  binBody: 0x4b6b58,
  binLid: 0x36503f,
  crateRed: 0xb8443a,
  bottle: [0x3f8a5a, 0xd9852f, 0x8c5a2b] as const,

  stool: 0xd9443b,
  stoolDark: 0xa93029,
  tableTop: 0xe6e2d6,
  bike: 0x3b4650,
  bikeDark: 0x232b32,
  tyre: 0x2a2a2a,
  chrome: 0xb9bfc4,

  // ── cây cối
  leaf: 0x5d9b5a,
  leafDark: 0x3d7440,
  pot: 0xb5705a,
  potDark: 0x8e5544,

  // ── ánh sáng
  sun: 0xfffdf2,
  skyTop: 0x7e939e,
  skyLow: 0xb9c6c9,

  // ── phụ kiện nhân vật
  capBlue: 0x2f4a6b,            // nón kết bảo vệ
  helmet: 0xd8d3c6,             // nón bảo hiểm nửa đầu

  // ── nhân vật
  skin: 0xecbb8c,
  skinShade: 0xcf9a6d,
  hair: 0x241d1a,
  hairLight: 0x3a2e28,
  shirt: 0x5686b0,
  shirtDark: 0x3f6a90,
  apron: 0xe6d8b6,
  apronDark: 0xc3b48f,
  trousers: 0x3c4a57,
  sandal: 0x2a2f34,

  ink: 0x232a30,
  paper: 0xf3f0e7,
} as const;

/** Bóng đổ chung, tách ra để mọi chỗ dùng cùng một độ đậm. */
export const SHADOW = { color: 0x19222a, alpha: 0.26 } as const;
