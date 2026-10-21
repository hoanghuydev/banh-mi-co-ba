# Giọng Hoàng Huy + tin nhắn điện thoại

> Research 2026-10-21. Dùng khi viết tin nhắn trong app Message (Huy, Linh, Thái, mẹ, sếp) và review ác ý của Huy (R4).
> ⚠️ **Giới hạn thật:** WebSearch chỉ trả kết quả Mỹ, không vào được Facebook/TikTok/Threads/Google Maps (cần đăng nhập). Phần đo dưới đây lấy từ dataset công khai; phần "kiểu câu" là bản rút lại, không copy nguyên văn. Cần bạn duyệt giọng.

## 1. Nguồn đã đo

| Nguồn | Loại | Mẫu | Ghi chú |
|---|---|---|---|
| `ura-hcmut/UIT-ViHSD` (Hugging Face) | Comment Facebook, có cả chửi | 1.000 | Chỉ lấy thống kê từ/emoji, bỏ phần chính trị và chửi nặng |
| `pqthinh232/vietnamese-restaurant-review-sentiment-dataset` | Review quán ăn | 1.000 | |
| `visolex/ViSpamReviews` | Review sàn TMĐT | 600 | |
| `thanh29nt/vietnamese-toxic-comment` | Comment dịch từ tiếng Anh | 600 | Không dùng, giọng dịch máy |
| Bài báo/blog về OT, sếp nhắn khuya (itviec, advertisingvietnam) | Bối cảnh | 3 bài | Xác nhận: "sếp nhắn sửa chút xíu lúc 11 giờ đêm", OT triền miên là nỗi đau quen |

## 2. Số đo (mỗi 1.000 comment)

| Dấu hiệu | Comment Facebook | Review quán | Review TMĐT |
|---|---|---|---|
| Độ dài TB | **10,7 từ** | 60,8 | 25,5 |
| `luôn` | 33 | **227** | 115 |
| `nha` | 28 | 105 | 80 |
| `chắc` | 14 | 81 | 77 |
| `ok` | 9 | 71 | 128 |
| `tui` / `tôi` | 12 / 21 | — / 82 | 3 / 25 |
| `ông` / `bà` | 37 / 11 | 17 / 20 | — |
| `mày` | 16 | — | — |
| 🤣 / 😂 / `=))` | 52 / 44 / 49 | — | 7 / 15 / 10 |
| `mà` (ngon **mà** mắc…) | 77 | 411 | 87 |
| `quá` | 68 | 230 | 78 |

## 3. Luật rút ra

| # | Luật | Căn cứ |
|---|---|---|
| 1 | **Tin nhắn ngắn: 6–14 từ**, một ý. Comment Facebook trung bình ~11 từ. | §2 |
| 2 | **Cười bằng emoji hoặc `=))`, tối đa 1 lần/tin.** 🤣 và 😂 xuất hiện ở ~1/20 comment; không rải mỗi câu. | §2 |
| 3 | **Giữa đồng nghiệp ngang tuổi gọi `ông`/`bà`, xưng `tui`.** `mày–tao` chỉ khi cãi nhau thật, Huy không dùng (hỗn nhưng còn "lịch sự"). | `tui` 12‰, `ông` 37‰ |
| 4 | **`chắc`, `luôn`, `mà`** là xương sống câu chê/khịa: "chắc mua view", "ngon mà mắc". | `chắc` 77–81‰ ở review |
| 5 | **`nha` ở cuối câu**, `nè`/`á` hiếm hơn. Không `nghen`, `hổng`. | `giong-phuong-anh.md` luật 1–2 |
| 6 | **Khịa theo khuôn:** `tưởng … ai ngờ` · `chắc … thôi` · `để coi …` · `giỏi thì …` · `rảnh vậy` · `lo mà …`. | mẫu comment lọc theo từ khoá |
| 7 | **Không tục, không chê ngoại hình/vùng miền** (`redlines.json`). Khịa bằng khinh thường + tự tin sai, không bằng chửi. | luật dự án |

## 4. Giọng Hoàng Huy

**Hồ sơ:** đồng nghiệp cùng cấp, tự cao, coi thường nữ chính, ghen nhưng chối, **tự tin sai** (logic ngược, tự mâu thuẫn). Không ác kiểu phim, ác kiểu "người cứ phải hơn".

| Đặc điểm | Cách viết | Ví dụ (đã dùng trong game) |
|---|---|---|
| Khoe chuyện chưa chắc | Thêm "sếp hứa miệng", "sắp" | "tui sắp lên trưởng nhóm rồi nha, sếp hứa với tui rồi 😎" |
| Đoán sai rất tự tin | "tui đoán X" rồi X sai | "ngày đầu bán được mấy ổ vậy bà 😏 tui đoán 5 ổ" |
| Chối ghen | "tình cờ thấy thôi", "tui bận lắm nha!!" | "ủa quán bà lên group review hả. chắc mua view thôi 🙄" → "tui bận lắm nha!! chỉ là tình cờ thấy thôi" |
| Ban ơn khinh người | "tui nói giúp cho" | "tui nói rồi mà. về xin sếp đi bà, tui nói giúp cho 😌" |
| Logic lủng | Tự mâu thuẫn trong 2 câu | "tui làm nhiều hơn bà nha. bà đi rồi thì biết" |
| Khi sa cơ | Đổi giọng nhưng vẫn giữ sĩ | "tui nghỉ việc rồi… quán bà có tuyển phụ bếp không 🥲" → "rửa chén?? thôi để tui suy nghĩ lại" |

**Cấm:** chửi tục, `mày–tao`, chê ngoại hình, chê nghề bánh mì (lằn ranh "không chê nghề").

## 5. Review ác ý của Huy (R4, chưa làm)

- Tài khoản tên giả (vd. "Khách Quen 123"), 1★, **vô cớ hoặc sai sự thật** ("đợi 40 phút", "bánh nguội") dù quán vắng.
- Ngắn, không chủ ngữ: "dở. đợi lâu. không quay lại" · "mắc mà ít nhân" (khi quán rẻ).
- Điểm nhận ra được: dùng đúng khuôn câu của Huy ("chắc … thôi", "tui đoán"). Người chơi tinh ý bắt được.
- Mất não: lỡ ghi "nhân viên cũ của sếp tui" hoặc nhắc đúng chi tiết chỉ Huy biết.

## 6. Giọng các nhân vật khác trong Message

| Ai | Giọng | Ví dụ |
|---|---|---|
| Sếp Tùng | Ngọt, ép, "mình là gia đình", nhắn khuya | "anh biết hơi gấp nhưng mình là gia đình mà 😊" |
| Thuỳ Linh | Bạn thân, thẳng, ủng hộ, cười `💪` | "im đi Huy. bà làm đi, tui ủng hộ ổ đầu tiên 💪" |
| Văn Thái | Đàn em, gọi chị, hơi nịnh, cười `🥲` | "chị ơi quán có tuyển thêm người không 🥲" |
| Mẹ | Lo, câu cụt, không emoji lòe loẹt | "mẹ lo lắm. buôn bán đâu có dễ" |
| Chú Tâm (chủ nhà) | Gọn, thực tế, gọi "cháu" | "hợp đồng 6 tháng, cọc 2 tháng nha cháu" |

## 7. Đã áp vào

`src/content/phone/intro.ts`, `src/content/phone/events.ts` (tin Huy, mẹ xin tiền học).
