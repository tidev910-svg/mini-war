# Công trình (xây dựng, nâng cấp, tiền đồn, tháp)

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Mọi công trình người chơi xây (nông trại, tiền đồn, tháp phòng thủ) dùng chung một hệ thống. Nhà lính bộ, nhà lính cung và chuồng ngựa **đã bỏ** ngày 2026-10-17 ("Yêu cầu sửa game RTS 1vs1 — 17/10/2026"):
- Bấm nút xây → rê chuột chọn chỗ (riêng tiền đồn: chọn cờ rồi bấm "Xây tiền đồn", chỗ đặt tự tìm) (khung xanh = hợp lệ, đỏ = bị chặn, thanh dưới màn hình ghi lý do) → nhấp trái để đặt; nhấp phải hoặc Escape để huỷ.
- Trả tiền ngay khi đặt; công trình **mất thời gian xây**, mờ đi và có thanh tiến độ vàng; đang xây vẫn có thể bị đánh phá.
- Xây xong mới có tác dụng (sinh lúa, bắn).
- Nhấp vào công trình của mình để chọn (vòng nét đứt) và xem thông tin trong nhật ký; nút nâng cấp dùng công trình đang chọn.
- Công trình bị phá thì mất hẳn. Quân hai phe tự tấn công công trình địch khi nhìn thấy.

Cột cờ (có sẵn, không phải công trình) và vùng lãnh thổ: xem [territory.md](territory.md). Chi tiết riêng của nông trại: [farms.md](farms.md).

## Luật & thông số
**Các loại công trình** (`BUILDING_TYPES`):
| `kind` | Tên | Giá | Thời gian xây | Máu | Nửa kích thước (`halfW×halfH`) | Tầm nhìn | Được đặt ở (`where`) | Tác dụng |
|---|---|---|---:|---:|---|---:|---|---|
| `farm` | Nông trại | 100 gỗ | 3s | 180 | 31×34 | 90 | `explored` | +20/30/45 lúa/phút theo cấp |
| `outpost` | Tiền đồn | 200 gỗ, 100 đá | 40s, **cần quân đứng cạnh** | 1.500 | 26×24 | 14 ô (`visionTiles`) | `flag` (cạnh cờ vùng mình đã chiếm, ≤ 4 ô) | Súng: tầm 160, ST 10, 1 phát/1,2 giây; **giữ cờ**: còn tiền đồn thì đối phương không chiếm được cờ vùng đó |
| `tower` | Tháp phòng thủ | 100 gỗ, 200 đá, 50 vàng | 25s | 520 | 22×24 | 200 | `territory` | Súng: tầm 190, ST 17, 1 phát/giây |

**Nâng cấp**
| Nâng cấp | Giá | Thời gian | Kết quả |
|---|---|---:|---|
| Nông trại cấp 2 | 80 gỗ, 40 đá | 15s (`FARM_UPGRADE_SECONDS`) | 30 lúa/phút |
| Nông trại cấp 3 | 120 gỗ, 80 đá | 15s | 45 lúa/phút |
Trong lúc nâng cấp công trình vẫn hoạt động ở mức cũ; thanh tiến độ màu xanh nhạt.

**Tuyển quân:** không còn công trình mở khoá quân; mọi loại quân tuyển tại pháo đài (xem [units.md](units.md)).

**Xây dựng**
- Lúc đặt: máu = 20% tối đa, `progress = 0`. Mỗi giây `progress += 1/buildTime` (sai số số thực < 1e-6 được làm tròn lên 1, để nông trại 3 giây xong đúng giây thứ 3), máu tăng thêm 80% tối đa chia đều theo thời gian xây.
- Đặt hợp lệ khi (`buildingPlacementProblem()` trả về chuỗi rỗng):
  1. Nằm trong bản đồ.
  2. Mọi điểm lấy mẫu (bước 8) trên footprint đã được phe đó khám phá và không phải nước/đá.
  3. Không chồng công trình khác, pháo đài, **sân tập kết** của hai phe, hay quân đang đứng (riêng tiền đồn được đặt lên chỗ có quân).
  4. Cách mọi cột cờ ≥ 2,5 ô (tiền đồn ≥ 1,2 ô) — "Quá sát cột cờ."
  5. `territory`: trong lãnh thổ của mình (≤ 14 ô quanh pháo đài hoặc trong vùng mình sở hữu — `inOwnTerritory()`).
  6. `flag` (tiền đồn): trong vùng mình đã chiếm, cách cờ ≤ 4 ô, vùng chưa có tiền đồn. `startOutpost(team, regionId)` chọn vùng (vùng đang chọn, hoặc vùng gần pháo đài nhất còn thiếu tiền đồn) rồi tự tìm chỗ cách cờ 1,8–3,5 ô. Chi tiết: [territory.md](territory.md).
- Tiền đồn đang xây chỉ tiến triển khi có quân của phe đó trong bán kính 4 ô (`hasBuilder()`); không có thì `b.waiting = true`, thanh xám, nhãn "CHỜ QUÂN XÂY". Các công trình khác tự xây.
- Không đủ tài nguyên → log "thiếu …", không trừ.

**Bắn** (tháp, tiền đồn — `updateBuildings()`, `buildingGun()`): nhắm quân địch gần nhất trong tầm mà phe mình **đang nhìn thấy** (ở chế độ AI, phe xanh thấy hết, giống pháo pháo đài). Đạn đuổi mục tiêu như đạn pháo.

## Code liên quan
- [src/main.ts](../../src/main.ts), khối "Buildings & territory":
  - Hằng số `BUILDING_TYPES` (`farm`, `outpost`, `tower`), `FARM_LEVELS`, `FARM_UPGRADE_SECONDS`, `HOME_TERRITORY_TILES`.
  - `buildingDef()`, `buildingDone()`, `buildingName()`, `buildingVision()`, `buildingGun()`, `hasBuilding(team, kind)`.
  - `buildingPlacementProblem(team, kind, x, y, ignore)`, `findBuildSpot(team, kind, ax, ay, minR, maxR)` (AI dùng), `placeBuilding(team, kind, x, y)`.
  - `upgradeCost()`, `upgradeTarget(team, kind, id)`, `startUpgrade(team, 'farm', id)` (chỉ nông trại); `outpostRegions(team)`, `startOutpost(team, regionId)`.
  - `updateBuildings(dt)` (gọi `updateCaptures()`, rồi xây, nâng cấp, súng, thợ xây), `completeBuilding()`, `destroyBuilding()` (gọi từ `hurt()`), `needsBuilder()`, `hasBuilder()`.
  - UI: `beginPlacement(kind)`, `endPlacement()`, biến `placement {kind, x, y, valid, problem}`, `selectedBuilding`.
  - Vẽ: `drawBuilding(b, preview)`, `drawFarm()`, `drawBuildingOverlay()` (thanh tiến độ/máu, vòng chọn, nhãn).
- Dữ liệu: `state.buildings[] = {id, kind, team, x, y, hp, max, level, progress (0..1), upgrade: null|{progress, time}, cool, regionId (tiền đồn), waiting}`. Tầm nhìn khai báo bằng `vision` (đơn vị thế giới) hoặc `visionTiles` (ô) — đọc qua `visionOf()`. Công trình dùng trường `kind` (quân dùng `type`).
- Nút trong [index.html](../../index.html): `#farm`, `#upgradeFarm`, `#upgradeOutpost` ("Xây tiền đồn"), `#buildTower`. Nhãn giá sinh từ `BUILDING_TYPES` lúc tải trang (loại không có `button` — tiền đồn — được bỏ qua trong vòng gán nút).

## Tương tác
- [territory.md](territory.md): tiền đồn giữ cờ; lãnh thổ quyết định chỗ xây tháp.
- [farms.md](farms.md): nông trại là một loại công trình; kéo nông trại.
- [units.md](units.md): tuyển quân (không còn nhà lính).
- [combat.md](combat.md): quân nhắm công trình địch; tháp và tiền đồn bắn.
- [fog-of-war.md](fog-of-war.md): công trình cho tầm nhìn (đang xây: 60).
- [economy.md](economy.md): giá công trình, lúa từ nông trại.
- [ai-opponent.md](ai-opponent.md): AI xây theo thứ tự ưu tiên.

## Multiplayer
- `build {kind, x, y}` → host gọi `placeBuilding(team, kind, x, y)` và kiểm tra lại toàn bộ (vị trí, lãnh thổ, tài nguyên).
- `upgrade {kind: 'farm', id|null}` → `startUpgrade()`; `id` là nông trại đang chọn ở phía người gửi, `null` thì host tự chọn.
- `outpost {regionId|null}` → `startOutpost()`; `regionId` là cờ đang chọn (`selectedFlag`) ở phía người gửi.
- `moveFarm {id, x, y}` (kéo nông trại).
- `state.buildings` đi qua snapshot; `selectedBuilding` được khôi phục theo `id` sau mỗi `applySnapshot()`.
- Log xây xong/bị phá chỉ hiện ở host; guest thấy kết quả trên bản đồ và HUD.

## Kiểm thử thủ công
- [ ] Đặt mỗi loại công trình; chỗ không hợp lệ hiện lý do trên thanh dưới màn hình.
- [ ] Tháp ngoài lãnh thổ → bị chặn "Phải xây trong lãnh thổ…".
- [ ] Không còn nút nhà lính bộ, nhà lính cung, chuồng ngựa; gọi `placeBuilding(…,'barracks',…)` bị từ chối.
- [ ] Chọn nông trại → "Nâng cấp nông trại" hiện giá cấp kế; nâng xong lúa/phút tăng.
- [ ] Chọn cờ vùng đã chiếm → "Xây tiền đồn" → tiền đồn hiện cạnh cờ, "CHỜ QUÂN XÂY" khi không có quân; xong thì máu 1.500, bắn quân địch đến gần. Lần thứ hai cho cùng vùng bị từ chối.
- [ ] Thả nông trại vào chỗ hợp lệ → đúng 3 giây sau xong (lúa bắt đầu sinh).
- [ ] Để quân địch phá một công trình → công trình biến mất, log báo.
- Đã chạy thử 2026-10-17 (yêu cầu 17/10): đặt nông trại qua `requestAction('build')` → −100 gỗ, giây 2,9 chưa xong, giây 3,0 xong, sinh 20 lúa/phút; `BUILDING_TYPES` chỉ còn farm/outpost/tower, 3 nút nhà lính không còn trong trang.
- Đã chạy thử 2026-10-17: nông trại 5 giây (trước khi đổi 3 giây); tiền đồn cạnh cờ (cách 2–3,5 ô, chờ thợ xây), không xây được tiền đồn thứ hai trong cùng vùng; nông trại đặt sát cờ bị chặn; PvP guest xây tiền đồn.
- Đã chạy thử 2026-10-16 (Chrome headless + debugger): đặt nông trại bằng chuột, cột cờ (cơ chế cũ), nhà lính; khoá/mở lính bộ; nâng cấp nông trại cấp 2 và tiền đồn; phá tiền đồn; PvP 2 trình duyệt (guest xây 3 công trình và tuyển lính bộ). Không lỗi JavaScript.

## Giới hạn / việc tồn đọng
- 14 nút; trên màn hình thấp bảng điều khiển vẫn có thể phải cuộn.
- Công trình nhỏ ở mức zoom mặc định; nhãn khó đọc.
- Không huỷ được công trình đang xây để lấy lại tài nguyên.
- Hình công trình (trừ nông trại) vẽ bằng Canvas, chưa có sprite.
