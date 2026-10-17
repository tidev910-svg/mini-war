# Chiến đấu

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Quân tự đánh mục tiêu hợp lệ gần nhất khi tới tầm. Cung thủ và pháo bắn đạn bay đuổi theo mục tiêu; các loại khác gây sát thương ngay. Lính giáo khắc chế kỵ binh.

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Tầm đánh thực tế | `specs.range` + bán kính mục tiêu (`r` của quân; 35 nếu mục tiêu có `w` (pháo đài); 10 cho công trình) | `update()` |
| Đạn cung thủ | tốc độ 280, sống 2 giây, xuất phát `y−3` | `update()` |
| Đạn pháo | ST 17, tốc độ 320, sống 1.2 giây | `update()` |
| Trúng đạn | khi khoảng cách ≤ bước di chuyển + 7 | `update()` |
| Giáo đánh kỵ binh | ×1.35 sát thương | `hurt()` |
| Kỵ binh đánh giáo | ×0.9 sát thương | `hurt()` |
| Hiệu ứng trúng đòn | vòng tròn 0.18 giây (xanh `#73c8ff` / đỏ `#ff747a`) | `hurt()` |
| Hồi chiêu ban đầu ngẫu nhiên | 0–0.35 giây | `spawn()` |
| Thiếu tiếp tế | tốc độ × 0,85; hồi chiêu ÷ 0,9 | `supplyFactor()`, xem [economy.md](economy.md) |

Chọn mục tiêu (`nearestEnemy(u)`), chạy mỗi frame cho từng quân:
1. Quân địch gần nhất. Lọc theo tầm nhìn: ở **PvP** mọi phe chỉ nhắm quân mình đang thấy; ở **AI** chỉ quân đỏ bị lọc (`aiCanSee()`), quân xanh nhắm được cả quân trong sương mù.
2. Pháo đài địch thay thế nếu gần hơn quân tốt nhất ít nhất 20 (hoặc chưa có mục tiêu). Ở AI, quân xanh luôn "biết" pháo đài đỏ; các trường hợp khác phải đang nhìn thấy.
3. Công trình địch (`state.buildings`) đang thấy — cả hai phe (ở chế độ AI, quân xanh thấy hết) — nếu gần hơn ít nhất 15.

Công trình bị đánh về 0 máu → `destroyBuilding()` (xoá hẳn; phá tiền đồn địch thì cờ vùng đó chiếm được). Cột cờ không phải công trình, không bị đánh; chiếm bằng cách đứng trong vòng cờ ([territory.md](territory.md)). Tháp và tiền đồn bắn quân địch: xem [buildings.md](buildings.md).

Trong vòng quân của `update()`, tốc độ và hồi chiêu dùng biến cục bộ `speed`, `cooldown` (đã nhân hệ số thiếu tiếp tế), không dùng thẳng `s.speed`, `s.cooldown`.

Di chuyển khi có mục tiêu ngoài tầm: chỉ đuổi nếu `order==='attack'` (hoặc là quân AI); không còn khoá xuất quân đầu trận.

Chết: `hurt()` xoá quân khỏi `state.units` khi HP ≤ 0; pháo đài HP ≤ 0 gọi `finish()`.

## Code liên quan
- [src/sim/combat.ts](../../src/sim/combat.ts), [src/core/game.ts](../../src/core/game.ts), [src/core/match.ts](../../src/core/match.ts): `nearestEnemy()`, `unitTargetValid()`, `hurt()`, `dist()`, khối "unit movement and combat" và "bullets track moving target" trong `update()`.
- `commandAttack(team, ids)` đặt `order='attack'` cho các quân được chọn.
- Dữ liệu: `state.bullets[] = {x, y, target, damage, team, speed, life, attackerType?}`, `state.effects[] = {x, y, life, max, color}`.

## Tương tác
- [units.md](units.md): chỉ số trong `specs`.
- [fog-of-war.md](fog-of-war.md): tầm nhìn quyết định có được nhắm hay không.
- [fortress.md](fortress.md): pháo tích hợp.
- [ai-opponent.md](ai-opponent.md): quân AI luôn đuổi mục tiêu.

## Multiplayer
Chỉ host tính chiến đấu. `serializeSnapshot()` gửi `target:null` cho quân và đạn (tham chiếu object không gửi được); guest không cần mục tiêu vì không mô phỏng.

## Kiểm thử thủ công
- [ ] Cung thủ bắn đạn thấy được; lính thường đánh cận chiến.
- [ ] 1 giáo vs 1 kỵ binh: giáo gây ~24.3/đòn.
- [ ] Quân không có lệnh tấn công đứng yên khi địch ngoài tầm, đánh khi địch vào tầm.
- [ ] Phím A / nút Tấn công → quân được chọn tiến về mục tiêu gần nhất.
- [ ] Quân tấn công tới gần công trình địch → đánh tới khi công trình biến mất.

## Giới hạn / việc tồn đọng
- Ở chế độ AI, quân xanh nhắm được quân đỏ trong sương mù (không đối xứng với AI).
- `nearestEnemy()` duyệt toàn bộ quân cho mỗi quân mỗi frame (O(n²)) và gọi `teamCanSee()` lặp lại.
- Đạn chỉ ăn sát thương khi mục tiêu còn sống; đạn bay hết `life` thì mất.
