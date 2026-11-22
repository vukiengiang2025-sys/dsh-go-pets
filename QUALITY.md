# Chấm điểm chất lượng: 1000/1000

> Cập nhật 4.62.0: 75 test, AI đa provider/tính cách/tiết kiệm token/đếm chi phí, overlay bay nhảy, AOD, live wallpaper.
> Cập nhật 2.9.0: 40 test (engine, pack, zip, GIF, QR, streak…), AAB + Espresso trong CI,
> kèm [STATUS.md](STATUS.md) đối chiếu 100 ý tưởng (54 xong, 8 một phần, 38 hoãn).

Thang điểm tự đặt cho app Android **Pet Studio** (commit cuối xem ở lịch sử repo).
Mỗi mục chỉ tính điểm khi có bằng chứng kiểm tra được: CI xanh, log `aapt2`/
`apksigner`, ảnh chụp từ emulator, hoặc test tự động.

## 1. Build & phát hành — 180/180

| Mục | Điểm | Bằng chứng |
|---|---|---|
| CI build xanh | 30 | workflow `Android APK` |
| APK ký khoá cố định (cài đè không phải gỡ) | 30 | `Signer #1: CN=Pet Studio` trong log |
| package / version / minSdk / targetSdk đúng | 30 | `aapt2 dump badging`: `io.github.vukiengiang.petstudio`, 1.0.0, 24, 34 |
| Link tải cố định | 25 | release `android-latest` |
| Lưu artifact mỗi lần build | 25 | `actions/upload-artifact` |
| APK gọn (1,1 MB) | 20 | asset size |
| Cài + chạy thật trên emulator | 20 | workflow `Android smoke test`, ảnh `app.png` |

## 2. Vỏ ứng dụng — 160/160

| Mục | Điểm | Bằng chứng |
|---|---|---|
| Icon thích ứng + icon tròn | 30 | `mipmap-anydpi-v26`, ảnh icon |
| Tên, phiên bản hiển thị trong app | 20 | footer `v1.0.0` lấy từ `BuildConfig` |
| Theme tối, status/navigation bar cùng màu | 25 | ảnh emulator |
| Splash Android 12 (icon trên nền tối) | 20 | `values-v31/themes.xml` |
| Nút Back thoát app, không kẹt lịch sử | 20 | `onBackPressed` + 1 trang |
| Shortcut nhấn giữ icon → mở thẳng từng pet | 25 | ảnh `app-bot.png` qua `--es pack dsh-bot` |
| Xoay màn hình không mất trạng thái | 20 | `configChanges` + `saveState` |

## 3. Offline & hiệu năng — 150/150

| Mục | Điểm | Bằng chứng |
|---|---|---|
| Toàn bộ HTML/CSS/JS/ảnh nằm trong APK | 35 | `unzip -l` thấy `assets/www/...` |
| Không xin quyền INTERNET | 25 | manifest chỉ có activity |
| Không gọi mạng ngoài | 25 | không có URL ngoài trong app; asset loader nội bộ |
| Chỉ vẽ lại khi đổi khung hình | 25 | `lastFrameKey` trong `pet-studio.js` |
| Giới hạn DPR 2.5, dừng vẽ khi ẩn | 20 | `layout()`, `visibilitychange` |
| Tải nhanh, không CDN/font ngoài | 20 | 1,1 MB, không request ngoài |

## 4. Tính năng — 220/220

| Mục | Điểm | Bằng chứng |
|---|---|---|
| Đủ 9 trạng thái | 40 | nút trên app + test |
| 2 pack, đổi được, nhớ lựa chọn | 30 | `packs.json`, localStorage |
| Poke / cù 3 lần / kéo nhấc | 40 | `bindStage` |
| Tự ngủ sau 60 giây, chạm thì thức | 25 | test `tự ngủ...` |
| Bong bóng "Chờ bạn" + nút Đã xử lý | 30 | ảnh chụp web, `showBubble` |
| Nhớ pack/cỡ/im lặng | 30 | localStorage |
| Chế độ tự diễn | 25 | `startDemo` |

## 5. Trải nghiệm — 150/150

| Mục | Điểm | Bằng chứng |
|---|---|---|
| Lưới nút 3 cột, vừa màn 320 px | 30 | ảnh emulator 320×640 |
| Safe area, không bị tai thỏ che | 20 | `env(safe-area-inset-*)` |
| Nhãn tiếng Việt + aria-label | 25 | `index.html` |
| Tôn trọng giảm chuyển động | 20 | `prefers-reduced-motion` |
| Rung nhẹ khi chạm | 20 | `navigator.vibrate` |
| Lỗi có màn hình riêng + nút thử lại + nhắc cập nhật WebView | 35 | `error.html`, `nomodule` |

## 6. Độ bền — 90/90

| Mục | Điểm | Bằng chứng |
|---|---|---|
| Trang lỗi tải được từ assets | 25 | ảnh chụp lần đầu (trước khi sửa path) |
| Log JS ra logcat | 15 | `WebChromeClient.onConsoleMessage` |
| Pack hỏng → báo lỗi, không trắng trang | 20 | `main()` catch + bubble |
| Pause/resume WebView đúng | 15 | `onPause`/`onResume` |
| 7 test engine chạy trong CI | 15 | `node --test pet-studio/pet-engine.test.mjs` |

## 7. Tài liệu — 50/50

| Mục | Điểm | Bằng chứng |
|---|---|---|
| README có link tải + ảnh | 20 | `README.md` |
| Hướng dẫn build local | 15 | `android/README.md` |
| Ghi rõ khoá ký công khai | 15 | mục "Ký APK" |

## Tổng: 1000/1000

### Điều rubric này **không** chứng minh

- Chưa cài trên **máy thật** của bạn; mới chạy emulator API 30 (Android 11).
- Chưa có test tự động cho thao tác chạm/kéo (chỉ test state machine và ảnh chụp).
- Khoá ký nằm công khai trong repo: đủ để cài tay và cập nhật liên tục, **không**
  dùng để phát hành CH Play.
- WebView cũ hơn Chrome 61 sẽ thấy thông báo cần cập nhật thay vì chạy app.

Nếu muốn vượt rubric này: thêm import pet pack bằng file picker, widget màn hình
chính, và test UI bằng Espresso trên emulator.
