# Cổng P1 — checklist một trang cho người điều phối

> Nguồn: `P0-03` §2.4. Câu hỏi DUY NHẤT: **"Bạn có biết vì sao khách đó giận không?"**
> Đạt khi **≥ 7,0 / 10**. Dưới ngưỡng = hệ thống chưa đọc được — **không lượng thoại nào cứu được nó**.

## Trước buổi

- [ ] Build riêng: `npm run build:playtest` → thư mục `dist-playtest/`
      (không overlay dev, telemetry bật sẵn, **tự pause ở `perception:confirmed` của sự kiện tiêu cực**)
- [ ] Máy KHÔNG phải của dev · PC + chuột + tai nghe
- [ ] Người chơi: **người lạ** (không bạn bè / người nhà / người trong Hội Làm Game),
      chưa xem trailer, chỉ biết "một game nhỏ về bán bánh mì"
- [ ] Phân bố 10 người: 5 hay chơi cozy / 5 không · ≥ 7 người Việt · 2–3 người nước ngoài chơi phụ đề Anh
- [ ] Mã ẩn danh: `T-01` … `T-10`

## Trong buổi (~35 phút)

1. **Đọc nguyên văn:** *"Đây là bản thử. Bạn cứ chơi tự nhiên. Tôi sẽ không hướng dẫn gì.
   Nếu bạn bí, cứ bí — đó cũng là dữ liệu. Bạn nghĩ gì cứ nói ra thành tiếng."*
2. Bật ghi màn hình + mic (webcam: hỏi trước, tuỳ chọn).
3. **20 phút chơi.** Không nói gì. Câu trả lời duy nhất được phép: *"Bạn cứ thử xem sao."*
4. **Khi game TỰ PAUSE** (hộp "Tạm dừng một chút") và trên màn hình có khách vừa phản ứng tiêu cực:
   hỏi đúng câu cổng, **không thêm không bớt**. Chép **nguyên văn** câu trả lời.
   - Hỏi **đúng 2 lần / người**, ở 2 loại sự kiện khác nhau:
     một kiểu QUÁ TRÌNH (`DROPPED_FOOD` / `DIRTY_HANDS` / `BURNT_OR_COLD`),
     một kiểu KẾT QUẢ / QUAN HỆ (`ORDER_DEFECT` / `WRONG_NAME`).
   - Các lần tự pause khác: bấm "Tiếp tục bán", không hỏi.
   - **Cấm:** gợi ý, nhắc lại, hỏi *"bạn có thấy bà ấy nhìn không?"*, hỏi *"vì sao bạn nghĩ vậy?"* trước khi chấm.
5. **10 phút phỏng vấn sau** (không tính điểm): *"Theo bạn, khách để ý những gì?"* …
6. Cài đặt → **"Xuất số liệu"** → lưu file `.jsonl` theo mã người chơi.

## Chấm — 2 người chấm MÙ, độc lập, bằng transcript + video

| Điểm | Mức | Định nghĩa |
|---|---|---|
| **1,0** | ĐÚNG | Đúng **sự kiện gốc** VÀ đúng **cơ chế** (khách *chứng kiến*, hoặc *phát hiện lúc ăn*) |
| **0,5** | GẦN ĐÚNG | Đúng sự kiện gốc, không nêu được cơ chế |
| **0** | SAI | Sai sự kiện, quy cho thứ không phải nguyên nhân, "không biết", "game random" |

- Điểm một người = trung bình 2 lần. **Điểm cổng = tổng 10 người.**
- Tính **Cohen's κ** giữa 2 người chấm. **κ < 0,70 → rubric chưa rõ, viết lại rubric, chấm lại.** Không lấy kết quả đó làm cổng.
- Bất đồng từng ca → người thứ ba phân xử.

## Ghi phụ cho MỌI phiên (không tính cổng)

| Chỉ số | Lấy từ |
|---|---|
| Lần đầu nhìn lên mặt khách (> 5 phút = bố cục giấu mặt) | video |
| Có ai tự thốt *"ủa bả thấy kìa"* | ghi âm |
| Số lần dùng công cụ hạ attention (≈ 0 = cơ chế thành cờ bạc) | telemetry `attention:toolUsed` |
| Có nghe lỏm được đồn thổi không | telemetry `gossip:overheard` |
| Nghe lại một dòng thoại trong 2 giờ đầu | telemetry `lineRepeatWithin2h` |

## Nếu < 7,0 — chẩn đoán BẰNG VĂN BẢN trước khi sửa bất cứ gì

| Nhánh | Dấu hiệu | Sửa |
|---|---|---|
| **A. Không nhìn thấy** | Mắt không rời bàn làm bánh | Render / bố cục. **Không** thêm thoại |
| **B. Thấy nhưng không nối được nhân quả** | Nhìn lên nhưng "không biết vì sao" | Rút độ trễ, tier-1 cụ thể hơn, siết `take(1)` |
| **C. Biết nhưng diễn đạt khác** | Mô tả đúng bằng từ khác, bị chấm 0 oan | Rubric sai → viết lại rubric (κ thấp là dấu hiệu) |

> **Cấm** sửa bằng cách thêm thoại giải thích (*"tôi thấy con làm rớt bánh đó nha"*):
> điểm lên nhưng T1 chết — khách đang tường thuật luật chơi thay vì phản ứng như người.

## Mẫu ghi (một người) — `PlaytestRecord` ở P0-03 §3

```json
{ "sessionId": "", "testerId": "T-01", "cohort": "COZY", "lang": "vi", "buildId": "", "dateIso": "",
  "gateQuestions": [
    { "atRealMs": 0, "stimId": "DROPPED_FOOD", "npcId": "BA_BAY", "npcObsState": "CONFIRMED",
      "answerVerbatim": "", "scoreRaterA": 0, "scoreRaterB": 0, "scoreFinal": 0 },
    { "atRealMs": 0, "stimId": "ORDER_DEFECT", "npcId": "", "npcObsState": "",
      "answerVerbatim": "", "scoreRaterA": 0, "scoreRaterB": 0, "scoreFinal": 0 }
  ],
  "secondary": { "firstLookAtFaceMs": null, "saidBaThayKia": false, "attentionToolUses": 0,
                 "overheardGossip": false, "lineRepeatWithin2h": 0 },
  "notes": "" }
```
