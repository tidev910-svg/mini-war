# Sương mù chiến tranh & tầm nhìn

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Bản đồ phủ sương đen. Vùng quân mình từng đi qua được **khám phá** và hiện địa hình vĩnh viễn. Quân và công trình địch chỉ hiện khi đang nằm trong vùng **đang nhìn thấy**. Mỏ đã khám phá thì luôn hiện.

## Luật & thông số
| Nguồn nhìn | Bán kính | Nguồn |
|---|---:|---|
| Trinh sát / Cung thủ / Lính giáo | 145 / 130 / 150 | `unitVisionRadius()` |
| Lính / Kỵ binh | 105 | `unitVisionRadius()` |
| Pháo đài | 175 | `teamCanSee()`, `revealTeamVision()` |
| Mỗi pháo đang bật | 105 (chỉ cho "đang nhìn thấy") | `teamCanSee()` |
| Công trình | theo loại (nông trại 90, tiền đồn 14 ô, tháp 200, nhà lính 100); đang xây: 60. Cột cờ không cho tầm nhìn | `buildingVision()`, `visionOf()` |
| Khu đất nhà | 14 ô quanh pháo đài, khám phá sẵn từ đầu trận (không phải "đang nhìn thấy") | `revealHomeTerritory()` |
| Lưới sương mù | 256 × 256 ô (`MAP_TILES`) | — |
| Màu ô chưa khám phá | Xanh xám `FOG_RGB` = (30, 40, 60), alpha `FOG_ALPHA` = 212/255 (hơi trong), mép mềm khoảng 2 ô | `drawFog()` |

Hai khái niệm luôn tách riêng:
- **Đã khám phá**: `state.fogSeen` (team 0) và `state.enemyFogSeen` (team 1), `Uint8Array` 0/1. Đọc bằng `isTeamAreaExplored(team, x, y)`.
- **Đang nhìn thấy**: tính lại mỗi lần gọi `teamCanSee(team, x, y)` từ quân còn sống, pháo đài và pháo.

Ai cập nhật bản đồ khám phá:
- Host/AI trong `update()`: team 0 từ quân + pháo đài xanh; team 1 theo bán kính riêng của AI (xem [ai-opponent.md](ai-opponent.md)).
- Guest: lúc vào phòng (`startGuestFromSnapshot()`) xoá fog của bản đồ riêng, áp snapshot rồi gọi `revealHomeTerritory()`; sau đó mỗi `applySnapshot()` giữ bản đồ khám phá của mình (snapshot không gửi fog) và gọi `revealTeamVision(0)`, `revealTeamVision(1)` (gồm cả tầm nhìn công trình).

Hiển thị (`drawFog()`, gọi trong `draw()`): chọn bản đồ theo `localTeam()`. Mỗi ô một giá trị alpha trong canvas 256×256 (`fogCanvas`), làm mờ (blur 6 px) lên canvas 1024×1024 (`fogSoftCanvas`, `FOG_BLUR_SCALE`), rồi vẽ phủ toàn bản đồ có làm mịn. Nhờ vậy mép sương mù mềm, màu khác hẳn đá (nâu xám) và nước (xanh lục), địa hình bên dưới chỉ hiện rất mờ. Chỉ dựng lại khi số ô đã khám phá thay đổi, và tối đa 5 lần/giây. Quân/pháo đài địch bị ẩn nếu `!currentlyVisible()`.

## Code liên quan
- [src/main.ts](../../src/main.ts): `teamCanSee()`, `aiCanSee()`, `unitVisionRadius()`, `revealTeamVision()`, `isTeamAreaExplored()`, các khối fog cuối `update()`, `drawFog()` (hằng số `FOG_RGB`, `FOG_ALPHA`, `FOG_BLUR_SCALE`; canvas `fogCanvas`, `fogSoftCanvas`), hàm lồng `currentlyVisible()` trong `draw()`.
- `serializeSnapshot()` bỏ `fogSeen`, `enemyFogSeen` khỏi gói gửi.

## Tương tác
- [combat.md](combat.md): lọc mục tiêu theo tầm nhìn.
- [buildings.md](buildings.md): mọi công trình chỉ đặt được trên vùng đã khám phá; công trình là nguồn tầm nhìn.
- [territory.md](territory.md): ranh giới vùng chỉ vẽ ở cạnh mà một ô kề đã khám phá; điểm chiếm hiện khi đã khám phá.
- [economy.md](economy.md): mỏ ẩn khi chưa khám phá.
- [multiplayer.md](multiplayer.md): mỗi trình duyệt giữ fog riêng.

## Multiplayer
Fog là dữ liệu cục bộ của từng trình duyệt, không đồng bộ. Host vẫn tính `enemyFogSeen` cho phe đỏ để kiểm tra đặt nông trại của guest; guest tự tính bản đồ của mình từ snapshot. Hai bản có thể lệch nhau nhẹ.

## Kiểm thử thủ công
- [ ] Đầu trận chỉ thấy quanh căn cứ; đi trinh sát mở rộng vùng sáng và vùng đó giữ nguyên khi quân rời đi.
- [ ] Quân đỏ biến mất khi ra khỏi tầm nhìn dù ô đã khám phá.
- [ ] PvP: guest thấy fog của phe đỏ, không thấy vùng phe xanh đã khám phá.
- [ ] Mép sương mù mềm, màu xanh xám hơi trong, phân biệt được với đá/nước; zoom xa vẫn rõ.
- Đã chạy thử 2026-10-17: ảnh chụp ở zoom mặc định, zoom xa và zoom nhỏ nhất — mép mềm, không còn bậc thang ô vuông đen.

## Giới hạn / việc tồn đọng
- Bán kính nhìn của AI trong `update()` khác `unitVisionRadius()`.
- Ở chế độ AI, quân xanh vẫn nhắm được mục tiêu trong sương mù ([combat.md](combat.md)).
- Lớp sương mù để lộ rất mờ địa hình bên dưới (địa hình mỗi trận giống nhau nên không lộ thông tin); quân, công trình, mỏ, cờ vẫn ẩn như cũ.
- Ở guest, `enemyFogSeen` của host và của guest có thể khác nhau → host có thể từ chối chỗ đặt nông trại mà guest thấy hợp lệ.
