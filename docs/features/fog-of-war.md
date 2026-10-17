# Sương mù chiến tranh & tầm nhìn

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Bản đồ phủ sương xanh xám đục. Vùng quân mình từng đi qua được **khám phá** và hiện địa hình vĩnh viễn; chỗ đã khám phá mà hiện không ai nhìn thấy được phủ **lớp sương mờ** (vẫn thấy địa hình). Quân và công trình địch chỉ hiện khi đang nằm trong vùng **đang nhìn thấy**. Mỏ đã khám phá thì luôn hiện.

## Luật & thông số
| Nguồn nhìn | Bán kính | Nguồn |
|---|---:|---|
| Trinh sát / Cung thủ / Lính giáo | 145 / 130 / 150 | `unitVisionRadius()` |
| Lính / Kỵ binh | 105 | `unitVisionRadius()` |
| Pháo đài | 175 | `teamCanSee()`, `revealTeamVision()` |
| Mỗi pháo đang bật | 105 (chỉ cho "đang nhìn thấy") | `teamCanSee()` |
| Vùng có cờ đang giữ | Toàn bộ vùng thành "đã khám phá" lúc chiếm xong (`revealRegion()`; guest: `revealOwnedRegions()`) **và** "đang nhìn thấy" chừng nào còn giữ cờ (`teamCanSee()` qua `regionAt()`) | [territory.md](territory.md) |
| Công trình | theo loại (nông trại 90, tiền đồn 14 ô, tháp 200); đang xây: 60. Cột cờ không cho tầm nhìn | `buildingVision()`, `visionOf()` |
| Khu đất nhà | 14 ô quanh pháo đài, khám phá sẵn từ đầu trận (không phải "đang nhìn thấy") | `revealHomeTerritory()` |
| Lưới sương mù | 256 × 256 ô (`MAP_TILES`) | — |
| Màu ô chưa khám phá | Xanh xám **đục hoàn toàn** `FOG_RGB` = (30, 40, 60): không nhìn thấy gì của địa hình bên dưới. Mép mềm khoảng 2 ô, nằm hoàn toàn ở phía đã khám phá | `refreshFog()`, `drawFog()` |
| Ô đã khám phá, không đang nhìn thấy | Cùng màu, alpha `FOG_MEMORY_ALPHA` = 115/255 (≈ 45%): địa hình vẫn thấy rõ | `teamVisibleTiles()`, `refreshFog()` |

Hai khái niệm luôn tách riêng:
- **Đã khám phá**: `state.fogSeen` (team 0) và `state.enemyFogSeen` (team 1), `Uint8Array` 0/1. Đọc bằng `isTeamAreaExplored(team, x, y)`.
- **Đang nhìn thấy**: tính lại mỗi lần gọi `teamCanSee(team, x, y)` từ quân còn sống, pháo đài, công trình, pháo và vùng có cờ đang giữ. Để vẽ, `teamVisibleTiles(team, out)` tính cùng các nguồn đó ra lưới 256 × 256 (`fogVisible`).

Ai cập nhật bản đồ khám phá:
- Host/AI trong `update()`: team 0 từ quân + pháo đài xanh; team 1 theo bán kính riêng của AI (xem [ai-opponent.md](ai-opponent.md)).
- Guest: lúc vào phòng (`startGuestFromSnapshot()`) xoá fog của bản đồ riêng, áp snapshot rồi gọi `revealHomeTerritory()`; sau đó mỗi `applySnapshot()` giữ bản đồ khám phá của mình (snapshot không gửi fog) và gọi `revealTeamVision(0)`, `revealTeamVision(1)` (gồm cả tầm nhìn công trình).

Hiển thị: `refreshFog()` (gọi trong `draw()` trước `drawTerritory()`) dựng ảnh sương, `drawFog()` vẽ phủ sau quân. Chọn bản đồ theo `localTeam()`.
- Tạo mặt nạ `fogMask`: ô chưa khám phá, và ô đã khám phá nằm trong `FOG_EDGE_TILES` = 2 ô quanh ô chưa khám phá, có alpha 255; ô đã khám phá không đang nhìn thấy alpha `FOG_MEMORY_ALPHA`; ô đang nhìn thấy alpha 0.
- Mặt nạ được đặt giữa một viền đục rộng `FOG_PAD` = 4 ô (`fogCanvas`), làm mờ (blur 4 px ≈ 1 ô) lên canvas gấp 4 lần (`fogSoftCanvas`, `FOG_BLUR_SCALE`), rồi cắt đúng phần bản đồ để vẽ phủ.
- Nhờ vậy vùng chuyển mờ nằm trong mép vùng đã khám phá; ô chưa khám phá luôn bị che kín, kể cả ở mép bản đồ.
- Dựng lại tối đa 5 lần/giây (vì tầm nhìn thay đổi theo quân), hoặc ngay khi đổi bản đồ sương.

## Code liên quan
- [src/main.ts](../../src/main.ts): `teamCanSee()`, `aiCanSee()`, `unitVisionRadius()`, `revealTeamVision()`, `isTeamAreaExplored()`, các khối fog cuối `update()`, `teamVisibleTiles()`, `refreshFog()`, `drawFog()` (hằng số `FOG_RGB`, `FOG_EDGE_TILES`, `FOG_BLUR_SCALE`, `FOG_PAD`, `FOG_MEMORY_ALPHA`; `fogMask`, `fogVisible`, canvas `fogCanvas`, `fogSoftCanvas`), hàm lồng `currentlyVisible()` trong `draw()`.
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
- [ ] Chỗ đã khám phá mà quân đã rời đi → phủ sương mờ, vẫn thấy địa hình; vùng có cờ đang giữ thì sáng hẳn.
- Đã chạy thử 2026-10-17: mở 45 ô quanh pháo đài → chỉ vòng 175 quanh pháo đài sáng, phần còn lại sương mờ thấy địa hình, viền vùng vẫn rõ; ngoài vòng 45 ô vẫn đục.
- [ ] PvP: guest thấy fog của phe đỏ, không thấy vùng phe xanh đã khám phá.
- [ ] Vùng chưa khám phá đục hoàn toàn (không thấy địa hình mờ mờ), mép mềm, phân biệt được với đá/nước; zoom xa vẫn rõ.
- Đã chạy thử 2026-10-17 (sau khi đổi sang đục): đọc điểm ảnh canvas ở ô chưa khám phá đầu tiên sát mép → (31, 41, 61), các ô xa hơn → đúng (30, 40, 60); ô đã khám phá vẫn thấy địa hình; ảnh zoom mặc định và zoom nhỏ nhất không còn lộ địa hình.
- Đã chạy thử 2026-10-17: ảnh chụp ở zoom mặc định, zoom xa và zoom nhỏ nhất — mép mềm, không còn bậc thang ô vuông đen.

## Giới hạn / việc tồn đọng
- Bán kính nhìn của AI trong `update()` khác `unitVisionRadius()`.
- Ở chế độ AI, quân xanh vẫn nhắm được mục tiêu trong sương mù ([combat.md](combat.md)).
- Khoảng 2 ô ở mép vùng đã khám phá bị phủ mờ một phần (đổi lấy việc ô chưa khám phá không lộ chút nào).
- Cờ, mỏ và công trình của mình ở chỗ không đang nhìn thấy nằm dưới lớp sương mờ (hơi tối đi).
- Ở guest, `enemyFogSeen` của host và của guest có thể khác nhau → host có thể từ chối chỗ đặt nông trại mà guest thấy hợp lệ.
