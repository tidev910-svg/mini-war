# Công trình (xây dựng, nâng cấp, nhà lính, tháp)

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-16

## Mô tả
Mọi công trình người chơi xây (nông trại, cột cờ, nhà lính bộ, nhà lính cung, chuồng ngựa, tháp phòng thủ) dùng chung một hệ thống:
- Bấm nút xây → rê chuột chọn chỗ (khung xanh = hợp lệ, đỏ = bị chặn, thanh dưới màn hình ghi lý do) → nhấp trái để đặt; nhấp phải hoặc Escape để huỷ.
- Trả tiền ngay khi đặt; công trình **mất thời gian xây**, mờ đi và có thanh tiến độ vàng; đang xây vẫn có thể bị đánh phá.
- Xây xong mới có tác dụng (sinh lúa, chiếm vùng, mở khoá quân, bắn).
- Nhấp vào công trình của mình để chọn (vòng nét đứt) và xem thông tin trong nhật ký; nút nâng cấp dùng công trình đang chọn.
- Công trình bị phá thì mất hẳn. Quân hai phe tự tấn công công trình địch khi nhìn thấy.

Cột cờ và vùng lãnh thổ: xem [territory.md](territory.md). Chi tiết riêng của nông trại: [farms.md](farms.md).

## Luật & thông số
**Các loại công trình** (`BUILDING_TYPES`):
| `kind` | Tên | Giá | Thời gian xây | Máu | Nửa kích thước (`halfW×halfH`) | Tầm nhìn | Được đặt ở (`where`) | Tác dụng |
|---|---|---|---:|---:|---|---:|---|---|
| `farm` | Nông trại | 100 gỗ | 20s | 180 | 31×34 | 90 | `explored` | +20/30/45 lúa/phút theo cấp |
| `flag` | Cột cờ | 100 gỗ | 20s | 500 | 16×22 | 8 ô (`visionTiles`) | `neutralRegion` | Chiếm vùng sau 10s không bị tranh chấp |
| `barracks` | Nhà lính bộ | 150 gỗ, 50 đá | 30s | 420 | 40×32 | 100 | `territory` | Mở khoá lính bộ |
| `archery` | Nhà lính cung | 150 gỗ, 50 vàng | 30s | 380 | 40×32 | 100 | `territory` | Mở khoá cung thủ |
| `stable` | Chuồng ngựa | 200 gỗ, 100 đá, 100 vàng | 30s | 460 | 46×34 | 100 | `territory` | Mở khoá kỵ binh |
| `tower` | Tháp phòng thủ | 100 gỗ, 200 đá, 50 vàng | 25s | 520 | 22×24 | 200 | `territory` | Súng: tầm 190, ST 17, 1 phát/giây |

**Nâng cấp**
| Nâng cấp | Giá | Thời gian | Kết quả |
|---|---|---:|---|
| Nông trại cấp 2 | 80 gỗ, 40 đá | 15s (`FARM_UPGRADE_SECONDS`) | 30 lúa/phút |
| Nông trại cấp 3 | 120 gỗ, 80 đá | 15s | 45 lúa/phút |
| Cột cờ → tiền đồn (`OUTPOST`) — chỉ khi đã chiếm xong vùng | 200 gỗ, 100 đá | 40s | Máu 1.500, tầm nhìn 14 ô, súng tầm 160, ST 10, 1 phát/1,2 giây |
Trong lúc nâng cấp công trình vẫn hoạt động ở mức cũ; thanh tiến độ màu xanh nhạt.

**Mở khoá quân** (`UNIT_REQUIREMENTS`): lính bộ ← nhà lính bộ, cung thủ ← nhà lính cung, kỵ binh ← chuồng ngựa (phải **xây xong**). Trinh sát và lính giáo tuyển ngay tại pháo đài. Quân vẫn xuất hiện ở sân tập kết cạnh pháo đài.

**Xây dựng**
- Lúc đặt: máu = 20% tối đa, `progress = 0`. Mỗi giây `progress += 1/buildTime`, máu tăng thêm 80% tối đa chia đều theo thời gian xây.
- Đặt hợp lệ khi (`buildingPlacementProblem()` trả về chuỗi rỗng):
  1. Nằm trong bản đồ.
  2. Mọi điểm lấy mẫu (bước 8) trên footprint đã được phe đó khám phá và không phải nước/đá.
  3. Không chồng công trình khác, pháo đài, **sân tập kết** của hai phe, hay quân đang đứng.
  4. `territory`: trong lãnh thổ của mình (≤ 14 ô quanh pháo đài hoặc trong vùng mình sở hữu — `inOwnTerritory()`).
  5. `neutralRegion` (cột cờ): trong một vùng chưa có chủ, không phải vùng gần nhà, chưa có cột cờ nào (kể cả đang xây), và cách pháo đài địch ≥ 20 ô. Chi tiết: [territory.md](territory.md).
- Không đủ tài nguyên → log "thiếu …", không trừ.

**Bắn** (tháp, tiền đồn — `updateBuildings()`): nhắm quân địch gần nhất trong tầm mà phe mình **đang nhìn thấy** (ở chế độ AI, phe xanh thấy hết, giống pháo pháo đài). Đạn đuổi mục tiêu như đạn pháo.

## Code liên quan
- [src/main.ts](../../src/main.ts), khối "Buildings & territory":
  - Hằng số `BUILDING_TYPES`, `OUTPOST`, `FARM_LEVELS`, `FARM_UPGRADE_SECONDS`, `UNIT_REQUIREMENTS`, `HOME_TERRITORY_TILES`.
  - `buildingDef()`, `buildingDone()`, `buildingName()`, `buildingVision()`, `buildingGun()`, `hasBuilding(team, kind)`.
  - `buildingPlacementProblem(team, kind, x, y, ignore)`, `findBuildSpot(team, kind, ax, ay, minR, maxR)` (AI dùng), `placeBuilding(team, kind, x, y)`.
  - `upgradeCost()`, `upgradeTarget(team, kind, id)`, `startUpgrade(team, kind, id)`.
  - `updateBuildings(dt)` (xây, nâng cấp, súng), `completeBuilding()`, `destroyBuilding()` (gọi từ `hurt()`).
  - UI: `beginPlacement(kind)`, `endPlacement()`, biến `placement {kind, x, y, valid, problem}`, `selectedBuilding`.
  - Vẽ: `drawBuilding(b, preview)`, `drawFarm()`, `drawBuildingOverlay()` (thanh tiến độ/máu, vòng chọn, nhãn).
- Dữ liệu: `state.buildings[] = {id, kind, team, x, y, hp, max, level, progress (0..1), upgrade: null|{progress, time}, cool, outpost, regionId, capture (0..1, cột cờ), contested}`. Tầm nhìn khai báo bằng `vision` (đơn vị thế giới) hoặc `visionTiles` (ô) — đọc qua `visionOf()`. Công trình dùng trường `kind` (quân dùng `type`).
- Nút trong [index.html](../../index.html): `#farm`, `#upgradeFarm`, `#buildFlag`, `#upgradeOutpost`, `#buildBarracks`, `#buildArchery`, `#buildStable`, `#buildTower`. Nhãn giá sinh từ `BUILDING_TYPES` lúc tải trang.

## Tương tác
- [territory.md](territory.md): cột cờ/tiền đồn chiếm vùng; lãnh thổ quyết định chỗ xây nhà lính và tháp.
- [farms.md](farms.md): nông trại là một loại công trình; kéo nông trại.
- [units.md](units.md): nhà lính mở khoá quân.
- [combat.md](combat.md): quân nhắm công trình địch; tháp và tiền đồn bắn.
- [fog-of-war.md](fog-of-war.md): công trình cho tầm nhìn (đang xây: 60).
- [economy.md](economy.md): giá công trình, lúa từ nông trại.
- [ai-opponent.md](ai-opponent.md): AI xây theo thứ tự ưu tiên.

## Multiplayer
- `build {kind, x, y}` → host gọi `placeBuilding(team, kind, x, y)` và kiểm tra lại toàn bộ (vị trí, lãnh thổ, tài nguyên).
- `upgrade {kind: 'farm'|'flag', id|null}` → `startUpgrade()`; `id` là công trình đang chọn ở phía người gửi, `null` thì host tự chọn.
- `moveFarm {id, x, y}` (kéo nông trại).
- `state.buildings` đi qua snapshot; `selectedBuilding` được khôi phục theo `id` sau mỗi `applySnapshot()`.
- Log xây xong/bị phá chỉ hiện ở host; guest thấy kết quả trên bản đồ và HUD.

## Kiểm thử thủ công
- [ ] Đặt mỗi loại công trình; chỗ không hợp lệ hiện lý do trên thanh dưới màn hình.
- [ ] Nhà lính/tháp ngoài lãnh thổ → bị chặn "Phải xây trong lãnh thổ…".
- [ ] Trước khi có nhà lính bộ, nút lính bộ mờ và ghi "cần Nhà lính bộ"; xây xong thì tuyển được.
- [ ] Chọn nông trại → "Nâng cấp nông trại" hiện giá cấp kế; nâng xong lúa/phút tăng.
- [ ] Cột cờ → tiền đồn (sau khi chiếm xong vùng): máu 1.500, bắn quân địch đến gần.
- [ ] Để quân địch phá một công trình → công trình biến mất, log báo.
- Đã chạy thử 2026-10-16 (Chrome headless + debugger): đặt nông trại bằng chuột, cột cờ, nhà lính; khoá/mở lính bộ; nâng cấp nông trại cấp 2 và tiền đồn; phá tiền đồn; PvP 2 trình duyệt (guest xây 3 công trình và tuyển lính bộ). Không lỗi JavaScript.

## Giới hạn / việc tồn đọng
- Nút chiếm 17 ô nên bảng điều khiển phải cuộn trên màn hình thấp.
- Công trình nhỏ ở mức zoom mặc định; nhãn khó đọc.
- Không huỷ được công trình đang xây để lấy lại tài nguyên.
- Quân tuyển từ nhà lính vẫn xuất hiện ở sân tập kết pháo đài, không ở nhà lính.
- Hình công trình (trừ nông trại) vẽ bằng Canvas, chưa có sprite.
