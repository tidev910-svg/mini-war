# Sương mù chiến tranh & tầm nhìn

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-20 · Theo đặc tả "MINI WAR V3.1 — Hệ thống sương mù chiến tranh và tầm nhìn"

## Mô tả
Ba trạng thái cho mỗi ô và mỗi phe:

| Trạng thái | Địa hình | Mỏ / tài nguyên | Công trình, pháo đài địch | Cờ / màu lãnh thổ | Quân địch |
|---|---|---|---|---|---|
| **Sương đậm** — chưa khám phá | Không thấy | Không thấy | Không thấy | Không thấy | Không thấy |
| **Sương mờ** — đã khám phá, không đang nhìn thấy | Thấy (dưới lớp mờ) | Thấy như lần cuối (màu chủ cũ) | **Như lần cuối nhìn thấy** (kể cả khi đã bị phá ngoài tầm nhìn) | **Như lần cuối nhìn thấy** | **Không thấy** |
| **Sáng rõ** — đang nhìn thấy | Thấy | Hiện trạng | Hiện trạng | Hiện trạng | Thấy |

- Ô đã khám phá **không bao giờ** về lại sương đậm; hết nguồn nhìn thì sáng rõ chuyển thành mờ.
- Phe mình luôn biết vùng **của mình** (đang giữ, hoặc vừa mất), tiến độ cờ **mình đang chiếm**, và công trình, quân của mình.
- Nhiều nguồn chồng nhau: chỉ cần **một** nguồn còn nhìn thấy là ô sáng rõ.

## Luật & thông số
| Nguồn nhìn | Bán kính (đơn vị thế giới) | Nguồn |
|---|---:|---|
| Trinh sát | **500** | `UNIT_VISION.scout` |
| Lính bộ / Lính giáo | **320** / **320** | `UNIT_VISION` |
| Cung thủ | **360** | `UNIT_VISION.archer` |
| Kỵ binh | **420** | `UNIT_VISION.cavalry` |
| Vùng lãnh thổ đang giữ | **450** quanh cột cờ, chừng nào còn giữ (mất vùng thì mất nguồn nhìn này) | `TERRITORY_VISION` |
| Công trình của mình (nông trại, tháp, tiền đồn — kể cả đang xây) và pháo đài | **350** | `BUILDING_VISION` |
| Khu đất nhà | 14 ô quanh pháo đài, khám phá sẵn từ đầu trận (không phải "đang nhìn thấy") | `revealHomeTerritory()` |
| Lưới sương mù | 256 × 256 ô (`MAP_TILES`), ô 37,5 đơn vị | — |
| Màu ô chưa khám phá | Gần đen, **đục hoàn toàn**: `FOG_RGB` = `--ui-fog` #0E0A08; mỗi ô lệch sáng tối ngẫu nhiên ± `MAP_UI.fogNoise` = 9 | `config/theme.ts` |
| Ô đã khám phá, không đang nhìn thấy | Cùng màu, alpha `FOG_MEMORY_ALPHA` = 115/255 (≈ 45%) | `teamVisibleTiles()`, `refreshFog()` |

**Người chơi và AI dùng chung một bộ nguồn nhìn** (`visionSources(team)`), nên hai bên nhìn xa như nhau. Trước 2026-10-20: trinh sát 260, giáo 150, cung 130, lính và kỵ 105, pháo đài 175 (AI 160), mỗi pháo 105, công trình theo loại (đang xây 60), giữ cờ thì thấy và khám phá **cả vùng**.

Hai khái niệm luôn tách riêng:
- **Đã khám phá**: `state.fogSeen` (team 0) và `state.enemyFogSeen` (team 1), `Uint8Array` 0/1. Đọc bằng `isTeamAreaExplored(team, x, y)`.
- **Đang nhìn thấy**: tính lại mỗi lần gọi `teamCanSee(team, x, y)` từ `visionSources(team)` (quân còn sống, pháo đài còn đứng, công trình, cờ vùng đang giữ; so bình phương khoảng cách). Để vẽ, `teamVisibleTiles(team, out)` tính cùng các nguồn đó ra lưới 256 × 256 (`fogVisible`).
- **Ký ức vùng mờ** (chỉ để hiển thị, `render/intel.ts`): `updateIntel()` mỗi frame ghi lại cờ, mỏ, công trình và pháo đài địch mà phe mình đang thấy; `knownFlag()`, `knownRegionOwner()`, `knownMine()`, `ghostBuildings()`, `ghostBases()` trả về bản ghi lần cuối cho chỗ không đang thấy. Công trình địch bị quên khi phe mình nhìn lại chỗ đó và thấy trống. Không nằm trong `state`, không gửi qua mạng. AI dùng trí nhớ riêng (`state.enemyMemory`).

Ai cập nhật bản đồ khám phá:
- Host/AI trong `update()`: `revealTeamVision(0)` và `revealTeamVision(1)` — đánh dấu đã khám phá mọi ô đang nhìn thấy. Mỗi nguồn chỉ được đánh dấu lại khi đổi ô (hoặc mới xuất hiện), vì ô đã khám phá không bao giờ tối lại; bộ nhớ đệm gắn với mảng khám phá nên trận mới bắt đầu lại từ đầu.
- Guest: lúc vào phòng (`startGuestFromSnapshot()`) xoá fog của bản đồ riêng, áp snapshot rồi gọi `revealHomeTerritory()`; sau đó mỗi `applySnapshot()` giữ bản đồ khám phá của mình (snapshot không gửi fog) và gọi `revealTeamVision(0)`, `revealTeamVision(1)` (gồm cả tầm nhìn công trình).

Hiển thị: `refreshFog()` (gọi trong `draw()` trước `drawTerritory()`) dựng ảnh sương, `drawFog()` vẽ phủ sau quân. Chọn bản đồ theo `localTeam()`.
- Tạo mặt nạ `fogMask`: ô chưa khám phá, và ô đã khám phá nằm trong `FOG_EDGE_TILES` = 2 ô quanh ô chưa khám phá, có alpha 255; ô đã khám phá không đang nhìn thấy alpha `FOG_MEMORY_ALPHA`; ô đang nhìn thấy alpha 0.
- Mặt nạ được đặt giữa một viền đục rộng `FOG_PAD` = 4 ô (`fogCanvas`), làm mờ (blur 4 px ≈ 1 ô) lên canvas gấp 4 lần (`fogSoftCanvas`, `FOG_BLUR_SCALE`), rồi cắt đúng phần bản đồ để vẽ phủ.
- Nhờ vậy vùng chuyển mờ nằm trong mép vùng đã khám phá; ô chưa khám phá luôn bị che kín, kể cả ở mép bản đồ.
- Dựng lại tối đa 5 lần/giây (vì tầm nhìn thay đổi theo quân), hoặc ngay khi đổi bản đồ sương.
- Hiệu năng (2026-10-18):
  - Mép mềm `fogMask` tính bằng hai lượt cửa sổ trượt (hàng rồi cột qua `fogRowMask`), cho kết quả giống hệt cách đánh dấu 25 ô cũ.
  - Bước làm mờ (`filter: blur`) chỉ chạy khi có ô đổi độ phủ (`fogBlurred`).
  - Mỗi lần dựng lại ≈ 0,7–1 ms (trước ≈ 3,8 ms, gây giật định kỳ).

## Code liên quan
- [src/config/balance.ts](../../src/config/balance.ts): `UNIT_VISION`, `BUILDING_VISION`, `TERRITORY_VISION`.
- [src/sim/fog.ts](../../src/sim/fog.ts): `visionSources()`, `teamCanSee()`, `aiCanSee()`, `unitVisionRadius()`, `revealTeamVision()`, `revealCircle()`, `revealHomeTerritory()`, `teamVisibleTiles()`, `isTeamAreaExplored()`.
- [src/render/intel.ts](../../src/render/intel.ts): ký ức vùng mờ (xem trên); dùng trong `draw()` (mỏ, cờ, công trình và pháo đài địch), `refreshRegionTint()` / `drawTerritory()`, minimap và bảng thông tin cờ.
- [src/render/fog.ts](../../src/render/fog.ts), [src/config/visuals.ts](../../src/config/visuals.ts), [src/core/match.ts](../../src/core/match.ts)., `revealTeamVision()`, `isTeamAreaExplored()`, các khối fog cuối `update()`, `teamVisibleTiles()`, `refreshFog()`, `drawFog()` (hằng số `FOG_RGB`, `FOG_EDGE_TILES`, `FOG_BLUR_SCALE`, `FOG_PAD`, `FOG_MEMORY_ALPHA`; `fogMask`, `fogVisible`, canvas `fogCanvas`, `fogSoftCanvas`), hàm lồng `currentlyVisible()` trong `draw()`.
- `serializeSnapshot()` bỏ `fogSeen`, `enemyFogSeen` khỏi gói gửi.

## Tương tác
- [combat.md](combat.md): lọc mục tiêu theo tầm nhìn.
- [buildings.md](buildings.md): mọi công trình chỉ đặt được trên vùng đã khám phá; công trình là nguồn tầm nhìn.
- [territory.md](territory.md): ranh giới vùng chỉ vẽ ở cạnh mà một ô kề đã khám phá; điểm chiếm hiện khi đã khám phá.
- [economy.md](economy.md): mỏ ẩn khi chưa khám phá.
- [pathfinding.md](pathfinding.md): quân lập đường theo bản đồ đã khám phá của phe (vùng mù coi là đi được, gặp vật cản mới tìm đường khác).
- [multiplayer.md](multiplayer.md): mỗi trình duyệt giữ fog riêng.

## Multiplayer
Fog là dữ liệu cục bộ của từng trình duyệt, không đồng bộ. Host vẫn tính `enemyFogSeen` cho phe đỏ để kiểm tra đặt nông trại của guest; guest tự tính bản đồ của mình từ snapshot. Hai bản có thể lệch nhau nhẹ.

## Kiểm thử thủ công
- [ ] Đầu trận chỉ thấy quanh căn cứ (350 quanh pháo đài, đất nhà khám phá sẵn); trinh sát mở vùng sáng 500, đi qua thì vùng đó thành mờ, không tối lại.
- [ ] Quân đỏ biến mất khi ra khỏi tầm nhìn dù ô đã khám phá.
- [ ] Chiếm cờ → sáng 450 quanh cờ; mất cờ → vùng đó thành mờ.
- [ ] Thấy công trình địch rồi đi khỏi: công trình vẫn hiện dưới lớp mờ; địch phá/đổi cờ ngoài tầm nhìn thì không cập nhật tới khi nhìn lại.
- [ ] PvP: khách thấy theo phe đỏ, không thấy vùng phe xanh đã khám phá.
- Unit test: `tests/fog.test.ts`, `tests/territory.test.ts` (vùng lãnh thổ 450). Smoke `vision` (bán kính 5 loại quân, 450 quanh cờ, đổi chủ, ký ức), `pvp` (khách giữ cờ thấy 450).
- Đã chạy thử 2026-10-20: ảnh chụp trinh sát thấy nông trại đỏ rồi đi khỏi — nông trại vẫn hiện trong vùng mờ; toàn bộ smoke đạt; `draw()` 2,8 ms/frame; AI 8 phút × 3 bản đồ không lỗi.

## Giới hạn / việc tồn đọng
- Ở chế độ AI, quân xanh vẫn nhắm được mục tiêu trong sương mù ([combat.md](combat.md)).
- Khoảng 2 ô ở mép vùng đã khám phá bị phủ mờ một phần (đổi lấy việc ô chưa khám phá không lộ chút nào).
- Cờ, mỏ và công trình của mình ở chỗ không đang nhìn thấy nằm dưới lớp sương mờ (hơi tối đi).
- Ký ức vùng mờ tính ở máy mỗi người từ `state`; đặt công trình, chọn cờ để chiếm vẫn kiểm tra theo bản đồ đã khám phá như trước.
- Bán kính lớn hơn trước 3–4 lần: cả hai phe (kể cả AI) thấy địch sớm hơn, giao tranh bắt đầu từ xa hơn.
- Ở guest, `enemyFogSeen` của host và của guest có thể khác nhau → host có thể từ chối chỗ đặt nông trại mà guest thấy hợp lệ.
