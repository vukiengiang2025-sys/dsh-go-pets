# Cách bản trích xuất này được tạo

## Nguồn

- Repo: https://github.com/ccch1mneyyy/dsh-Go
- Nhánh: `main`
- Commit: `5fc5f41a20a33cb95fcd8ac119d67a32a7559dfa` — 2026-11-22 00:35:08 +0800 — *Merge pull request #1686 from ccch1mneyyy/feat/star-prompt-tiers*
- Giấy phép mã nguồn: AGPL-3.0 ([LICENSE](LICENSE)); tài nguyên thương hiệu/hình ảnh tách riêng ở [ASSETS.md](ASSETS.md) và **không** nằm trong bản này.

## Cách làm

Repo gốc rất lớn (~730 MB), nên không clone đầy đủ:

```sh
git clone --filter=blob:none --depth 1 --no-checkout https://github.com/ccch1mneyyy/dsh-Go.git
cd dsh-Go
git sparse-checkout init --no-cone
git sparse-checkout set <các đường dẫn trong bảng dưới>
git checkout main
```

Sau đó chép nguyên văn (giữ đường dẫn gốc), thêm README/EXTRACT này, và bỏ các tệp nhị phân không thuộc AGPL-3.0.

## Đã lấy

| Đường dẫn | Tệp | Nội dung |
|---|---|---|
| `app/lib/pets/` | 20 | lõi: trạng thái, mood, signals, pack, validator, thư viện, prefs, overlay channel, actions |
| `app/lib/ui/pets/` | 9 | widget: stage, bubble, picker, settings, menu, sprite, perch, custom size, overlay tile |
| `app/lib/dev/` | 2 | probe cho pet actions |
| `app/lib/l10n/parts/pet_actions_*.arb` | 2 | chuỗi tiếng Anh / tiếng Trung |
| `app/lib/plugins/seams/adapters/pet_adapter.dart` | 1 | adapter của plugin seam |
| `app/lib/ui/phone/ios_pet_pip_section.dart` | 1 | mục cài đặt PiP trên iOS |
| `app/android/.../pet/` | 22 | overlay Kotlin: service, view, menu, wheel, ask bar, screenshot, policy, edge snap |
| `app/android/.../test/.../pet/` | 17 | unit test Kotlin |
| `app/android/.../res/drawable/ic_pet_*` | 2 | icon mic/send của thanh hỏi |
| `app/ios/Runner/PetOverlay/` | 5 | overlay + PiP trên iOS |
| `app/test/pets/` | 28 | test Dart (pack, golden, overlay, actions, stage, import, workshop) |
| `app/test/{access,notify,phone,ui_config}/…pet…` | 4 | test liên quan |
| `app/tool/` | 10 | `make_pet_pack.py`, `pet_theme_convert.py`, `pet_svg_frames.py`, rules JSON, probe… |
| `app/assets/pets/*/pack.json` | 3 | manifest mẫu (không kèm ảnh) |
| `docs/` | 9 | đặc tả `design/pets.md`, hướng dẫn làm pack, guide 06-pets (zh/en/harmony), kiểm thử |
| `LICENSE`, `ASSETS.md` | 2 | giấy phép + ghi công tài nguyên |

Tổng phần trích xuất: **141 tệp**, ~2,2 MB. Cộng phần tự làm (art + pack + 2 tệp mô tả) repo có **173 tệp**, ~2,4 MB.

## Đã bỏ (và vì sao)

| Bỏ | Lý do |
|---|---|
| `app/assets/pets/*/*.png`, `app/tool/pet_src/**`, `docs/assets/pet-*.gif`, `app/test/pets/**/goldens/*.png` | Ảnh nhân vật (Deepy, cá hồng, whale-girl) do upstream giữ bản quyền, không thuộc AGPL-3.0 |
| `app/pubspec.yaml` | thuộc về app, không phải chức năng pets; phụ thuộc được liệt kê trong README |
| `app/assets/skills/**` | bản sao tài liệu hướng dẫn; đã có bản gốc trong `docs/guide/` |
| Phần còn lại của dsh-go | không thuộc pets; xem bảng “Điểm nối vào app” trong README |

## Khác biệt so với upstream

Phần trích xuất: **không sửa một dòng mã nào**, mọi đường dẫn giữ nguyên để có thể `diff` trực tiếp với upstream.

Phần thêm vào (không lấy từ upstream):

| Thêm | Nội dung |
|---|---|
| `README.md`, `EXTRACT.md` | mô tả bản trích xuất |
| `art/may/` | script vẽ + đóng gói pet mẫu "Mây", khung APNG, preview, giấy phép CC BY 4.0 |
| `app/assets/pets/may/` | pack "Mây" đã đóng (13 tệp), PASS `pet_pack_check.py --compat-reactions` |

## Danh sách tệp

<details>
<summary>141 tệp</summary>

- `ASSETS.md`
- `LICENSE`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/AskBar.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/CompanionFloatPolicy.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/CompanionFloatView.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/EdgeSnap.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/FrameClock.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/OverlayAccess.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/OverlayPolicy.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/OverlayViews.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/OverlayWindowOwner.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetActionState.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetFrames.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetMenuView.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetOverlay.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetOverlayPlugin.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetOverlayProbe.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetOverlayService.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetPack.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetScreenshot.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetSprites.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetView.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetWheelGeometry.kt`
- `app/android/app/src/main/kotlin/io/github/ccch1mneyyy/dsh_app/pet/ResultSilence.kt`
- `app/android/app/src/main/res/drawable/ic_pet_mic.xml`
- `app/android/app/src/main/res/drawable/ic_pet_send.xml`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/CompanionFloatPolicyTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/EdgeSnapTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/FrameClockTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/OverlayAccessTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/OverlayActivityDimmingTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/OverlayMachineTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/OverlayWindowOwnerTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetActionStateTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetActionsTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetBubbleTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetFramesTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetPackTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetPushTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetScreenshotTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetTapsTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/PetWheelTest.kt`
- `app/android/app/src/test/kotlin/io/github/ccch1mneyyy/dsh_app/pet/ResultSilenceTest.kt`
- `app/assets/pets/deepy-whale/pack.json`
- `app/assets/pets/pink-fish/pack.json`
- `app/assets/pets/whale-girl/pack.json`
- `app/assets/skills/dsh-go-guide/en-06-pets.md`
- `app/assets/skills/dsh-go-guide/harmony-en-06-pets.md`
- `app/assets/skills/dsh-go-guide/harmony-zh-06-pets.md`
- `app/assets/skills/dsh-go-guide/zh-06-pets.md`
- `app/ios/Runner/PetOverlay/IOSPetOverlay.swift`
- `app/ios/Runner/PetOverlay/PetOverlayFrameRenderer.swift`
- `app/ios/Runner/PetOverlay/PetOverlayPack.swift`
- `app/ios/Runner/PetOverlay/PetOverlayPictureInPicture.swift`
- `app/ios/Runner/PetOverlay/PetOverlayState.swift`
- `app/lib/dev/pet_actions_probe_main.dart`
- `app/lib/dev/pet_probe_support.dart`
- `app/lib/l10n/parts/pet_actions_en.arb`
- `app/lib/l10n/parts/pet_actions_zh.arb`
- `app/lib/pets/codex_pet_converter.dart`
- `app/lib/pets/overlay_channel.dart`
- `app/lib/pets/pet_archive.dart`
- `app/lib/pets/pet_json.dart`
- `app/lib/pets/pet_library.dart`
- `app/lib/pets/pet_library_export.dart`
- `app/lib/pets/pet_mood.dart`
- `app/lib/pets/pet_name_alias.dart`
- `app/lib/pets/pet_overlay_actions.dart`
- `app/lib/pets/pet_overlay_bridge.dart`
- `app/lib/pets/pet_pack.dart`
- `app/lib/pets/pet_pack_rules.g.dart`
- `app/lib/pets/pet_pack_validator.dart`
- `app/lib/pets/pet_png.dart`
- `app/lib/pets/pet_prefs.dart`
- `app/lib/pets/pet_sheets.dart`
- `app/lib/pets/pet_signals.dart`
- `app/lib/pets/pet_state.dart`
- `app/lib/pets/pet_unicode_data.g.dart`
- `app/lib/pets/pet_voice_dialog.dart`
- `app/lib/plugins/seams/adapters/pet_adapter.dart`
- `app/lib/ui/pets/overlay_settings_tile.dart`
- `app/lib/ui/pets/pet_bubble.dart`
- `app/lib/ui/pets/pet_custom_size.dart`
- `app/lib/ui/pets/pet_menu.dart`
- `app/lib/ui/pets/pet_perch.dart`
- `app/lib/ui/pets/pet_picker.dart`
- `app/lib/ui/pets/pet_settings_page.dart`
- `app/lib/ui/pets/pet_sprite.dart`
- `app/lib/ui/pets/pet_stage.dart`
- `app/lib/ui/phone/ios_pet_pip_section.dart`
- `app/test/access/access_pet_default_test.dart`
- `app/test/notify/pet_answer_generation_test.dart`
- `app/test/pets/codex_pet_converter_test.dart`
- `app/test/pets/fixtures/pet-pack-local-v1.json`
- `app/test/pets/fixtures/pet-png-v2.json`
- `app/test/pets/fixtures/pet-validation-small.json`
- `app/test/pets/overlay/fake_overlay_native.dart`
- `app/test/pets/overlay/overlay_channel_test.dart`
- `app/test/pets/overlay/overlay_settings_tile_test.dart`
- `app/test/pets/overlay/pet_actions_test.dart`
- `app/test/pets/overlay/pet_overlay_keepalive_test.dart`
- `app/test/pets/overlay/pet_voice_dialog_test.dart`
- `app/test/pets/pet_focus_background_test.dart`
- `app/test/pets/pet_golden_test.dart`
- `app/test/pets/pet_import_test.dart`
- `app/test/pets/pet_library_test.dart`
- `app/test/pets/pet_mood_test.dart`
- `app/test/pets/pet_overlay_renderer_prefs_test.dart`
- `app/test/pets/pet_pack_test.dart`
- `app/test/pets/pet_pack_validator_test.dart`
- `app/test/pets/pet_parts_test.dart`
- `app/test/pets/pet_pixel_test.dart`
- `app/test/pets/pet_plugin_bars_test.dart`
- `app/test/pets/pet_sheets_test.dart`
- `app/test/pets/pet_sprite_blend_test.dart`
- `app/test/pets/pet_sprite_pause_test.dart`
- `app/test/pets/pet_stage_pause_gate_test.dart`
- `app/test/pets/pet_stage_test.dart`
- `app/test/pets/pet_workshop_export_test.dart`
- `app/test/pets/support.dart`
- `app/test/phone/ios_pet_pip_section_test.dart`
- `app/test/ui_config/pet_theme_skill_test.dart`
- `app/tool/build_pet_ui_dump.sh`
- `app/tool/generate_pet_validation_data.py`
- `app/tool/make_pet_pack.py`
- `app/tool/pet-pack.rules.json`
- `app/tool/pet_actions_probe.py`
- `app/tool/pet_actions_probe_smoke_test.dart`
- `app/tool/pet_svg_frames.py`
- `app/tool/pet_theme_convert.py`
- `app/tool/test_make_pet_pack.py`
- `app/tool/test_pet_theme_convert.py`
- `docs/design/pets.md`
- `docs/guide/en/06-pets.md`
- `docs/guide/harmony/en/06-pets.md`
- `docs/guide/harmony/zh/06-pets.md`
- `docs/guide/zh/06-pets.md`
- `docs/pets/README.en.md`
- `docs/pets/README.md`
- `docs/testing/pet-actions-probe.md`
- `docs/testing/pet-screenshot-wheel.md`

</details>
