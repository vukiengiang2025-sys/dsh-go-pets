# DSH Bot

Nhân vật robot xanh, tách từ bộ `DSH-Go_Mascot_Reference_Pack` (3 sheet 1536×1024)
của chủ repo. Đây là **bản nháp chạy được**, không phải bản vẽ lại sạch.

## Đã làm

- Tách 40 frame từ sheet 2 (sheet duy nhất có nền trong suốt thật).
- Chuẩn hoá: một scale chung (0,71×), canvas 200×200, baseline 180 → mọi frame
  đứng cùng một đường chân.
- Bỏ 2 trạng thái có tay người / con trỏ chuột vẽ lẫn vào ảnh: **poke**, **drag**
  (chỉ giữ tickle).
- Đóng pack bằng `app/tool/pet_theme_convert.py`, canvas 144, `pixelArt:false`,
  PASS `pet_pack_check.py --compat-reactions`.

Trạng thái có trong pack: idle (5 frame), thinking (4), working (4), done (5),
error (4), notification (3), sleeping (4), waking (3), roam (4), tickle (4).

## Còn phải sửa nếu muốn dùng thật

- **Zzz của sleeping** bị cắt ở mép trên ở frame 1–2 (sheet gốc đã cắt).
- **done**: frame 4–5 không còn ngôi sao; 3 frame đầu dính nhau phải cắt theo
  cột alpha nên có thể lệch vài px.
- **working**: laptop nằm trong khung, hitbox rộng hơn thân.
- **error**: frame 4 đổi hẳn tư thế (bỏ laptop, giơ tay) — nên vẽ lại cho liền mạch.
- Ảnh gốc là render mềm có glow; ở 30 dp chi tiết nhỏ bết lại. Muốn nét: vẽ lại
  phẳng, viền tối 1–2 px, bỏ bóng mờ.

## Giấy phép

Hình thuộc về chủ repo, phát hành CC BY 4.0 (xem `art/may/LICENSE-ART.md`).
