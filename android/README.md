# Pet Studio cho Android

Vỏ Android (Java + WebView) bọc Pet Studio thành app cài được, chạy hoàn toàn
offline: pet pack, ảnh, JS đều nằm trong APK.

- **Tải APK**: [PetStudio.apk](https://github.com/vukiengiang2025-sys/dsh-go-pets/releases/download/android-latest/PetStudio.apk)
- **Yêu cầu**: Android 7.0+ (minSdk 24), WebView hệ thống bật JavaScript (mặc định).
- **Không cần mạng**, không quyền nào ngoài quyền mặc định.

## Có gì trong app

- 2 pet pack: **Mây** (pixel) và **DSH Bot**; đổi pack, cỡ 22–64 dp, im lặng.
- Đủ 9 trạng thái; poke/cù/nhấc; tự ngủ sau 60 giây; bong bóng "Chờ bạn" có nút
  **Đã xử lý**.
- Nhớ lựa chọn (pack, cỡ, im lặng) qua localStorage.
- Dừng vẽ khi app ra nền; nút Back thoát app.

## Cấu trúc

```text
android/
├─ app/src/main/java/.../MainActivity.java   WebView + WebViewAssetLoader
├─ app/src/main/res/                          theme, icon adaptive, layout
├─ app/src/main/AndroidManifest.xml
├─ app/build.gradle                           minSdk 24, target 34
└─ build.gradle, settings.gradle              AGP 8.5.2, Gradle 8.9
```

Trang web nằm ở `../pet-studio/`; lúc build, CI chép vào
`app/src/main/assets/www/` (thư mục này không commit).

## Build trên máy

Cần JDK 17, Android SDK platform 34 + build-tools 34.0.0, Gradle 8.9:

```sh
# chép web app vào assets
mkdir -p android/app/src/main/assets/www/app/assets/pets
cp -r pet-studio android/app/src/main/assets/www/pet-studio
cp -r app/assets/pets/may app/assets/pets/dsh-bot android/app/src/main/assets/www/app/assets/pets/

gradle -p android :app:assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Build tự động

`.github/workflows/android.yml` chạy khi `android/`, `pet-studio/` hoặc
`app/assets/pets/` thay đổi: cài SDK, build release, đăng lên release
`android-latest` (link tải cố định) và lưu artifact.

## Ký APK

APK ký bằng `app/petstudio-release.p12` (PKCS12, mật khẩu `petstudio`), cố ý
commit vào repo để **mọi bản build có cùng chữ ký** — cài đè bản mới không phải
gỡ app. Khoá này công khai, chỉ dùng cho bản cài tay; **không** dùng để phát
hành CH Play. Muốn phát hành store: tạo keystore riêng, đưa vào GitHub Secrets
và sửa `signingConfigs.release` trong `app/build.gradle`.

## Kiểm thử trên máy ảo

Workflow `android-smoke.yml` (chạy tay) tải APK mới nhất, bật emulator API 30,
cài, mở app, chụp 2 ảnh (mặc định và shortcut `dsh-bot`) rồi lưu artifact
`emulator-screenshot`. Đây là bằng chứng app chạy thật, không chỉ build xong.

## Sửa giao diện

Sửa `pet-studio/` (HTML/CSS/JS) rồi push — workflow tự build lại APK. Không cần
đụng tới Java trừ khi đổi cách nạp WebView.
