# Lộ trình 100 ý tưởng (đã gộp nhóm, tránh chồng chéo)

100 ý tưởng ban đầu được gộp thành **10 nhóm**, mỗi nhóm là một mảng tính năng
dùng chung hạ tầng — làm một lần, phục vụ nhiều ý tưởng. Thứ tự triển khai theo
phụ thuộc: cá nhân hoá → pack → biểu cảm → tương tác → AI → tích hợp agent →
nền tảng Android → cộng đồng → kỹ thuật → sản phẩm.

| Nhóm | Ý tưởng | Gộp gì | Trạng thái |
|---|---|---|---|
| **G. Cá nhân hoá** | 61–70 | tên, màu, cỡ (09, 63), hồ sơ, thống kê, nhật ký, sao lưu, chế độ đơn giản, theme theo giờ (69≈62), ngôn ngữ | đang làm |
| **A. Nhân vật & pack** | 01–10, 79, 80 | pack theo mùa/nghề/động vật, tạo pack trong app (04), nhập GIF/APNG (05), pack đồng nghiệp (07), sáng/đêm (08), mini (09), bộ sưu tập (10), template (79), preset (80) | chờ |
| **B. Biểu cảm** | 11–20 | chớp mắt, nhìn theo tay, nghe, gõ phím, pin, hạt, crossfade, nhịp thở, vươn vai, buồn ngủ | chờ |
| **C. Tương tác** | 21–30 | vuốt ve, nhấc/thả, ném, chạm đúp, vẽ đường, bánh xe, lực rung, ba ngón, menu cảm xúc, trốn | chờ (tickle đã có) |
| **D. AI & giọng** | 31–40 | chat ngắn, tóm tắt, TTS, giọng riêng, hỏi lại, ghi nhớ, nhắc nghỉ, kể chuyện, cảm xúc tin nhắn, im lặng | chờ |
| **E. Tích hợp agent** | 41–50 | WebSocket, tool bubble, subagent, màu host, mở hội thoại, widget trạng thái, lỗi + log, nhiều host | chờ |
| **F. Android** | 51–60 | overlay, widget, QS tile, live wallpaper, notification, PiP, pin/sạc, AOD, splash (59 đã có), AAB | một phần |
| **H. Cộng đồng** | 71–78 | chợ pack, link, GIF, QR, xếp hạng, bình chọn, gallery, chia sẻ cấu hình | chờ |
| **I. Kỹ thuật** | 81–90 | Espresso, golden, FPS/pin, nén atlas, lazy pack, chữ ký, quyền, crash opt-in, A/B, AAB | một phần |
| **J. Sản phẩm** | 91–100 | onboarding, nhiệm vụ, streak, nghỉ mắt, Pomodoro, âm thanh, ủng hộ, tặng pet, widget đôi, roadmap | chờ |

## Chống chồng chéo

- **Cỡ pet**: 09 (mini) và 63 (tự co) dùng chung một hàm `layout()`, không làm hai lần.
- **Màu/theme**: 62 (bảng màu) và 69 (theme theo giờ) dùng chung bộ lọc màu; 69 chỉ
  là chọn bảng màu theo giờ.
- **Chia sẻ**: 72 (link), 74 (QR), 78 (cấu hình) dùng chung một định dạng gói.
- **Widget**: 48 (trạng thái agent) và 99 (widget đôi) là một widget với hai kiểu.
- **Kiểm thử**: 81/82/83/89 đều nằm trong pipeline CI, không tách repo.
- **Nhắc nghỉ**: 37, 94 là một tính năng (một bộ đếm, hai câu nhắc).

## Thứ tự làm

1. **G** — nền cài đặt, thống kê, nhật ký, sao lưu (đang làm).
2. **A** — quản lý pack + nhập pack; mở đường cho mọi nội dung sau.
3. **B + C** — biểu cảm và tương tác, không cần thêm hạ tầng.
4. **D** — giọng nói/TTS và chat ngắn (dùng Web Speech API trước).
5. **E** — cầu nối agent thật (WebSocket tới engine).
6. **F** — overlay/widget/PiP (native, mỗi thứ một đợt).
7. **H** — chợ pack và chia sẻ.
8. **I** — test/CI nâng cao.
9. **J** — onboarding và tính năng giữ chân.

Mỗi đợt: cập nhật web app → test engine → build APK → smoke emulator → cập nhật
`QUALITY.md` nếu tiêu chí thay đổi.
