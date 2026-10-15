# Nông trại

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-15

## Mô tả
Nông trại là công trình kinh tế. Người chơi bấm "Xây nông trại", rê chuột chọn chỗ (xanh = hợp lệ, đỏ = bị chặn), nhấp trái để đặt; nhấp phải hoặc Escape để huỷ. Nông trại đã xây có thể kéo đi chỗ khác bằng chuột trái. Quân đỏ có thể tấn công và phá nông trại.

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Giá | 80 vàng | `placeFarmAt()`, `buildFarm()`, `beginFarmPlacement()` |
| Thu nhập | +2 vàng/giây mỗi nông trại có `hp > 0` | `update()` |
| HP | 180 | `placeFarmAt()` |
| Footprint logic | 62 × 68 (nửa: 31 × 34) | `farmPlacementValid()` |
| Số lượng tối đa | không giới hạn | — |
| Hoàn vốn | 40 giây | (80 / 2) |

Vị trí hợp lệ (`farmPlacementValid(team, x, y, ignoreFarm)`):
1. Footprint nằm trong bản đồ (cách mép ≥ 2).
2. Mọi điểm lấy mẫu (bước 8) trên footprint **đã được phe đó khám phá** (`isTeamAreaExplored()`).
3. Không có điểm nào trên ô nước (2) hoặc đá (3).
4. Không đè nông trại khác còn HP, không đè pháo đài, không đè quân còn sống.

## Code liên quan
- [src/main.ts](../../src/main.ts):
  - `beginFarmPlacement()` — vào chế độ đặt (UI, chưa trừ tiền); `endFarmPlacement()` — thoát.
  - Sự kiện `pointermove` cập nhật `farmPlacement {x, y, valid}`; `pointerdown` trái → `requestAction('placeFarm',{x,y})`.
  - `placeFarmAt(team, x, y)` — kiểm tra lại, trừ 80 vàng, thêm vào `state.farms`.
  - `buildFarm(team)` + `findOpenBaseSpot()` — tự tìm chỗ quanh căn cứ (action `farm`; hiện nút UI không dùng nữa).
  - Kéo: `draggingFarm` trong `pointerdown`/`pointermove`/`endPointer()`; action `moveFarm`.
  - Vẽ: `drawFarm(f, preview)` với sprite `/assets/farmstead-v2.png`.
- Dữ liệu: `state.farms[] = {x, y, hp, max, team}`.

## Tương tác
- [economy.md](economy.md): thu nhập +2/giây.
- [fog-of-war.md](fog-of-war.md): chỉ xây được trên vùng đã khám phá.
- [combat.md](combat.md) / [ai-opponent.md](ai-opponent.md): chỉ quân **team 1** chọn nông trại làm mục tiêu (`nearestEnemy()`).
- [controls.md](controls.md): nhấp trái vào nông trại ưu tiên kéo hơn là chọn quân.

## Multiplayer
- `placeFarm {x, y}`: host gọi `placeFarmAt(1, x, y)` và kiểm tra lại toàn bộ.
- `moveFarm {index, x, y}`: `index` là thứ tự trong danh sách nông trại của phe guest. Host kiểm tra `farmPlacementValid()`.
- Guest kéo nông trại cục bộ; snapshot đến trong lúc kéo được giữ ở `window._miniWarQueuedSnapshot` và áp dụng khi thả chuột.
- Host/AI kéo nông trại thì sửa trực tiếp `f.x/f.y`, không qua `applyAction()`.

## Kiểm thử thủ công
- [ ] Đặt trên vùng sương mù / nước / đá / đè quân → bị chặn, không trừ tiền.
- [ ] Đặt hợp lệ → −80 vàng, thu nhập tăng 2/giây.
- [ ] Kéo nông trại sang chỗ hợp lệ / không hợp lệ.
- [ ] PvP: guest đặt và kéo nông trại, host thấy đúng vị trí.

## Giới hạn / việc tồn đọng
- Nông trại HP ≤ 0 **không bị xoá** khỏi `state.farms`: nó ngừng sinh tiền và bị bỏ qua khi kiểm tra chỗ trống, nhưng `drawFarm()` không kiểm tra HP nên vẫn được vẽ như còn nguyên (không có thanh máu).
- Quân xanh không thể tấn công nông trại đỏ (luật không đối xứng ở PvP).
- `moveFarm` dùng chỉ số mảng: nếu danh sách nông trại đổi giữa lúc kéo, có thể dời nhầm nông trại.
