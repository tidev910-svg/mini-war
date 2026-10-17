# Nông trại

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Nông trại là công trình sinh **lúa** — nguồn lúa chính để tuyển và nuôi quân (nguồn còn lại là mỏ lúa trong vùng lúa đã chiếm, xem [territory.md](territory.md)). Nông trại là một loại công trình (`kind: 'farm'`) trong hệ thống chung ở [buildings.md](buildings.md): đặt bằng nút "Xây nông trại", có thời gian xây, có thể bị phá, có thể nâng cấp. Riêng nông trại còn **kéo được** sang chỗ khác bằng chuột trái.

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Giá | 100 gỗ | `BUILDING_TYPES.farm.cost` |
| Thời gian xây | 5 giây (đổi từ 20 giây ngày 2026-10-17) | `BUILDING_TYPES.farm.buildTime` |
| Máu | 180 | `BUILDING_TYPES.farm.hp` |
| Footprint logic | 62 × 68 (nửa: 31 × 34) | `halfW`, `halfH` |
| Sản lượng | cấp 1: 20 · cấp 2: 30 · cấp 3: 45 lúa/phút (chỉ khi đã xây xong) | `FARM_LEVELS` |
| Thưởng vùng lúa | +25% khi nông trại nằm trong vùng lúa do phe mình giữ (cấp 1: 25, cấp 2: 37,5, cấp 3: 56,25); nông trại vẫn xây được ở chỗ khác | `FOOD_REGION_FARM_BONUS`, `farmFoodPerMinute()` |
| Nâng cấp | cấp 2: 80 gỗ + 40 đá · cấp 3: 120 gỗ + 80 đá · 15 giây mỗi lần | `FARM_LEVELS`, `FARM_UPGRADE_SECONDS` |
| Nơi đặt | Bất kỳ đâu đã khám phá (`where: 'explored'`), không cần lãnh thổ | — |
| Số lượng tối đa | không giới hạn | — |

Điều kiện vị trí chung (khám phá, không nước/đá, không chồng công trình/pháo đài/sân tập kết/quân): xem [buildings.md](buildings.md).

Nút "Nâng cấp nông trại": nếu đang chọn một nông trại của mình thì nâng nông trại đó, nếu không thì nâng nông trại cấp thấp nhất, gần pháo đài nhất. Nhãn nút hiện giá của cấp kế tiếp.

## Code liên quan
- [src/main.ts](../../src/main.ts): `BUILDING_TYPES.farm`, `FARM_LEVELS`, `FARM_UPGRADE_SECONDS`; sinh lúa qua `farmFoodPerMinute(b)` trong khối thu nhập của `update()` và trong `foodPerMinute()`. Kéo nông trại vào/ra vùng lúa đổi sản lượng ngay.
- Đặt/nâng cấp dùng chung: `beginPlacement('farm')`, `placeBuilding()`, `startUpgrade(team, 'farm', id)`.
- Kéo: `draggingFarm` trong `pointerdown`/`pointermove`/`endPointer()`; kiểm tra bằng `buildingPlacementProblem(team, 'farm', x, y, farm)`; action `moveFarm {id, x, y}`.
- Vẽ: `drawFarm(f, preview)` (sprite `/assets/farmstead-v2.png`, mờ khi đang xây) + `drawBuildingOverlay()` (nhãn "NÔNG TRẠI CẤP n").

## Tương tác
- [economy.md](economy.md): lúa ròng, thiếu tiếp tế.
- [buildings.md](buildings.md): hệ thống công trình chung.
- [combat.md](combat.md): quân hai phe tấn công nông trại địch khi thấy.
- [ai-opponent.md](ai-opponent.md): AI xây nông trại theo nhu cầu lúa.

## Multiplayer
- Đặt: action `build {kind:'farm', x, y}`; nâng cấp: `upgrade {kind:'farm', id}`; kéo: `moveFarm {id, x, y}` — host kiểm tra lại vị trí.
- Guest kéo nông trại cục bộ; snapshot đến trong lúc kéo được giữ ở `window._miniWarQueuedSnapshot` và áp dụng khi thả chuột.
- Host/AI kéo nông trại thì sửa trực tiếp `x/y`, không qua `applyAction()`.

## Kiểm thử thủ công
- [ ] Đặt trên vùng sương mù / nước / đá / sân tập kết / đè quân → bị chặn, có lý do, không trừ gỗ.
- [ ] Đặt hợp lệ → −100 gỗ; 5 giây sau lúa ròng tăng 20/phút.
- [ ] Nông trại không đặt được sát cột cờ (< 2,5 ô) — "Quá sát cột cờ."
- [ ] Nâng cấp 2 lần → 45 lúa/phút; nút nâng cấp báo hết khi đã cấp 3.
- [ ] Kéo nông trại sang chỗ hợp lệ / không hợp lệ.
- [ ] PvP: guest đặt, nâng cấp và kéo nông trại; host thấy đúng.

## Giới hạn / việc tồn đọng
- Kéo được cả nông trại đang xây và nông trại đã nâng cấp; có thể dùng để "dọn đường" cho quân.
- Kéo nông trại ở host/AI không qua `applyAction()`.
