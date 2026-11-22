# Bàn giao: trạng thái & việc tiếp theo

## Hiện tại

- App **Pet Studio 4.20.1** (versionCode 60), Android 7.0+, offline mặc định; chat AI tuỳ chọn.
- APK: https://github.com/vukiengiang2025-sys/dsh-go-pets/releases/download/android-latest/PetStudio.apk
- Bản trong máy: /sdcard/Download/DSH-Go/PetStudio.apk
- 4 pet: Mây, Mây Tuyết, Mây Tết, DSH Bot + nhập ảnh/GIF/zip/link.
- 40 test, CI build APK + AAB, Espresso trên emulator, smoke chụp ảnh.

## Đã xong / còn lại

Xem [STATUS.md](STATUS.md): **82 xong · 1 một phần · 17 hoãn** trên 100 ý tưởng.
Mục một phần duy nhất: PiP (WebView đen trên emulator).

## Việc tiếp theo (theo thứ tự đề xuất)

1. **i18n vi/en (70)** — khoảng 60 chuỗi; thêm từ điển + đánh dấu data-i18n, đổi ngôn ngữ
   trong Cài đặt. Không đụng native, làm trong 1–2 đợt.
2. **Overlay ngoài app (51)** — service SYSTEM_ALERT_WINDOW + WebView nhỏ; cần quyền
   người dùng, dễ bị ROM chặn; nên làm sau khi có thời gian thử máy thật.
3. **Golden test renderer (82)** — so ảnh từng khung với ảnh chuẩn; cần thêm bộ ảnh mẫu.
4. **Nén atlas (84)** — giảm dung lượng pack (PNG palette/WebP) và đo lại.
5. **AOD / live wallpaper (54, 58)** — chỉ nên làm nếu thật sự cần; tốn pin và quyền.

## Vì sao dừng ở đây (chờ quyết định)

Mục tiêu “triển khai 100 ý tưởng” đã đi được 59 xong, 11 một phần, 30 hoãn.
30 mục còn lại **không thể tự làm tiếp một cách an toàn** vì cần một trong các thứ sau:

1. Backend + kiểm duyệt cho chợ pack/xếp hạng/ủng hộ.
2. Bộ art mới (pack nghề, động vật, template).
3. Quyền hệ thống Android cho overlay/AOD/live wallpaper (dễ bị ROM chặn, tốn pin).
4. Giao thức engine DSH cho WebSocket/mở hội thoại/đa host.
5. Quyết định phạm vi cho 11 mục một phần (i18n, mini mode, bộ sưu tập…).

Khi bạn chọn hướng, mình có thể mở lại và làm tiếp từng đợt như trước.
Repo, APK và CI vẫn đang ở trạng thái chạy được.

## Cần bạn quyết định

| Việc | Vì sao cần bạn |
|---|---|
| Chợ pack thật (71) | cần backend + kiểm duyệt, hoặc chọn “chỉ dán link” như hiện tại |
| Pack nghề/động vật (02, 03, 07) | cần bộ art mới hoặc ngân sách thuê vẽ |
| AOD / live wallpaper / overlay (51, 54, 58) | quyền hệ thống, rủi ro pin, cần thử máy thật |
| Ủng hộ (97) | cần kênh nhận tiền thật |
| Đa host / WebSocket (42, 50) | cần giao thức engine DSH |

## Hạn chế đã biết

- **PiP**: vào được nhưng WebView hiện khung đen trên emulator; đã ẩn nút sau cờ thử nghiệm.
- **Overlay**: kéo bằng chấm nhỏ góc dưới; nhớ vị trí và cỡ (120/150/200) qua lần mở sau.
- **Live wallpaper**: đã build service nhưng chưa đặt thử; smoke mở trình chọn hình nền bị treo nên đã bỏ bước đó.
- **AI chat**: cần endpoint/model/key của bạn; request đi qua bridge native để tránh CORS, chưa thử với key thật.
- **Pet nổi tự bay nhảy**: đã xác nhận bằng 2 ảnh chụp cách nhau 2 giây (pet lệch ~20 px).
- **Dạy đi**: đường nét đứt chỉ hiện lúc đang đi, ảnh chụp chỉ thấy pet đã dời chỗ.
- **FPS**: chip có nhưng chưa chụp được ảnh xác nhận số.
- **Widget/thông báo**: đã đăng ký và có log; muốn thấy trên máy thật phải tự thêm widget.
- **Khoá ký** nằm công khai trong repo: cài tay thì tiện, **không** dùng phát hành CH Play.
- **TTS**: phụ thuộc giọng hệ thống của máy.

## Cách chạy tiếp

    git clone https://github.com/vukiengiang2025-sys/dsh-go-pets
    cd dsh-go-pets
    python3 -m http.server 8099        # web app: http://127.0.0.1:8099/pet-studio/
    node --test pet-studio/*.test.mjs  # 40 test
    # APK: push lên main, GitHub Actions tự build + phát hành

Mỗi đợt nên: sửa pet-studio/ → test → push → xem workflow Android APK xanh →
tải APK mới ở release android-latest.
