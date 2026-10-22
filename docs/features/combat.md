# Chiến đấu

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-22

## Mô tả
Quân tự đánh mục tiêu hợp lệ gần nhất khi tới tầm. Cung thủ và pháo bắn đạn bay đuổi theo mục tiêu; các loại khác gây sát thương ngay. Lính giáo khắc chế kỵ binh.

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Tầm đánh thực tế | `specs.range` + bán kính mục tiêu (`r` của quân; 35 nếu mục tiêu có `w` (pháo đài); 10 cho công trình). Quân cận chiến (tầm < `MELEE_RANGE_MAX` = 60) đánh công trình/pháo đài từ sát khung: lấy max với `structureReach()` = √((halfW + ¾ ô)² + (halfH + ¾ ô)²) + 0,6 ô, vì công trình chặn đường ([pathfinding.md](pathfinding.md)) | `attackRange()` |
| Đạn cung thủ | tốc độ 280, sống 2 giây, xuất phát `y−3` | `update()` |
| Đạn pháo pháo đài | ST 18 (khẩu chính) / 45 (khẩu thứ hai), tốc độ 320, sống 1.2 giây | `FORTRESS_GUN_DAMAGE`, `update()` |
| Súng tháp / tiền đồn | ST 30 / 12 | `BUILDING_TYPES.tower.gun`, `.outpost.gun` |
| Trúng đạn | khi khoảng cách ≤ bước di chuyển + 7 | `update()` |
| Sát thương thực tế | ST cơ bản × hệ số khắc chế (mục tiêu là quân) hoặc × hệ số công trình (mục tiêu là công trình hay pháo đài; không nhân chồng). Súng không có hệ số; quái dùng hệ số của loại quân trong `counterAs` ([neutral-camps.md](neutral-camps.md)) | `damageMultiplier()`, `hurt()` |
| Hiệu ứng trúng đòn | vòng tròn 0.18 giây (xanh `#73c8ff` / đỏ `#ff747a`) | `hurt()` |
| Hồi chiêu ban đầu ngẫu nhiên | 0–0.35 giây | `spawn()` |
| Thiếu tiếp tế | tốc độ × 0,85; hồi chiêu ÷ 0,9 | `supplyFactor()`, xem [economy.md](economy.md) |

Chọn mục tiêu (`nearestEnemy(u)`), chạy mỗi frame cho từng quân:
**Mọi phe, ở mọi chế độ, chỉ nhắm thứ phe mình đang nhìn thấy** (`teamCanSee()`; quyết định 8.4, 2026-10-22 — trước đó ở chế độ AI quân xanh nhắm được cả quân, công trình và pháo đài đỏ trong sương mù). Súng pháo đài và súng công trình theo cùng luật.
1. Quân địch gần nhất đang thấy (bỏ qua quân đang đồn trú trong cờ).
2. Pháo đài địch (còn đứng, đang thấy) thay thế nếu gần hơn quân tốt nhất ít nhất 20 (hoặc chưa có mục tiêu).
3. Công trình địch đang thấy, nếu gần hơn ít nhất 15.

Công trình bị đánh về 0 máu → `destroyBuilding()` (xoá hẳn; phá tiền đồn địch thì cờ vùng đó chiếm được). Cột cờ không phải công trình, không bị đánh; chiếm bằng cách đứng trong vòng cờ ([territory.md](territory.md)). Tháp và tiền đồn bắn quân địch: xem [buildings.md](buildings.md).

Trong vòng quân của `update()`, tốc độ và hồi chiêu dùng biến cục bộ `speed`, `cooldown` (đã nhân hệ số thiếu tiếp tế), không dùng thẳng `s.speed`, `s.cooldown`.

**Lệnh tấn công** (phím A / nút khiên đỏ, `commandAttack()`): quân nhận `order='attack'`.
- Có địch đang thấy: đuổi mục tiêu gần nhất như dưới đây.
- **Không thấy địch nào:** quân của người chơi tiến tới **mục tiêu địch gần nhất mà phe mình đã phát hiện** (`attackGoal()`, `sim/knowledge.ts`): công trình, cờ do địch giữ, pháo đài — như lần cuối nhìn thấy. Tới nơi thì thấy và đánh (công trình), hoặc đứng trong vòng cờ để chiếm (cờ). Mục tiêu đã mất (nhìn lại thấy trống, cờ đổi chủ) thì chuyển sang mục tiêu đã biết kế tiếp.
- Chưa phát hiện gì: quân đứng chờ, thông báo đỏ "chưa phát hiện địch nào — hãy cho trinh sát đi trước".
- Ký ức mỗi phe (`updateKnowledge()` mỗi frame ở chủ phòng / chế độ AI; không nằm trong `state`): công trình địch và pháo đài đã thấy, cờ do địch giữ đã thấy; công trình chỉ bị quên khi phe đó nhìn lại chỗ cũ thấy trống. AI vẫn dùng trí nhớ riêng (`state.enemyMemory`).

Di chuyển khi có mục tiêu ngoài tầm: chỉ đuổi nếu `order==='attack'` (hoặc là quân AI); không còn khoá xuất quân đầu trận. Đuổi theo đường đi vòng vật cản (`steerTo()`, tính lại tối đa 1 lần/giây khi mục tiêu dịch quá 1,5 ô; [pathfinding.md](pathfinding.md)).

Chết: `hurt()` xoá quân khỏi `state.units` khi HP ≤ 0; pháo đài HP ≤ 0 gọi `finish()`.

**Hiển thị & âm thanh** (2026-10-18; không đổi luật): hiệu ứng trúng đòn mang `id` và `src` (loại quân ra đòn, `'gun'`, `'guard'`), đạn mang `id`, để âm thanh phát đúng một lần ([audio.md](audio.md)). Quân chết: `hurt()` thêm hiệu ứng `{kind: 'fall', type, team, facing, x, y, life, max}` vào `state.effects` khi quân chết (sprite ngã rồi mờ, `UNIT_ANIM.fallSeconds` = 1,4 giây). Xem [rendering.md](rendering.md).

**Combat V3.1** (19/10/2026, chỉ đổi sát thương; tốc độ, hồi chiêu, tầm, máu, AI giữ nguyên):

| Quân | ST mỗi đòn | Trước |
|---|---:|---:|
| Trinh sát | 7 | 5 |
| Lính | 14 | 13 |
| Lính giáo | 12 | 18 |
| Cung thủ | 16 | 10 |
| Kỵ binh | 24 | 24 |

| Khắc chế (`COUNTER_MULTIPLIERS`) | Hệ số |
|---|---:|
| Lính giáo → kỵ binh | ×2,2 (trước ×1,35) |
| Kỵ binh → cung thủ | ×1,5 |
| Cung thủ → lính giáo | ×1,3 |
| Lính → lính giáo | ×1,2 |
| Cặp khác (kể cả kỵ binh → lính giáo, trước ×0,9) | ×1,0 |

| Đánh công trình (`STRUCTURE_DAMAGE_MULTIPLIERS`) | Trinh sát | Lính | Lính giáo | Cung thủ | Kỵ binh |
|---|---:|---:|---:|---:|---:|
| Hệ số | ×0,5 | ×1,1 | ×1,0 | ×0,6 | ×0,8 |

Súng: pháo đài 18 (trước 17), pháo thứ hai 45 (trước 17), tháp 30 (trước 17), tiền đồn 12 (trước 10). Cột cờ có chủ (từ 2026-10-20): 10 mỗi 2 giây, tầm 180, hệ số ×1 ([flag-defense.md](flag-defense.md)).

## Code liên quan
- [src/sim/combat.ts](../../src/sim/combat.ts), [src/core/game.ts](../../src/core/game.ts), [src/core/match.ts](../../src/core/match.ts): `nearestEnemy()`, `commandAttack()`, `attackGoal()`, `nearestKnownTarget()`, `updateKnowledge()` ([src/sim/knowledge.ts](../../src/sim/knowledge.ts)), `attackRange()`, `structureReach()`, `unitTargetValid()`, `hurt()`, `dist()`, khối "unit movement and combat" và "bullets track moving target" trong `update()`.
- `commandAttack(team, ids)` đặt `order='attack'` cho các quân được chọn.
- Dữ liệu: `state.bullets[] = {x, y, target, damage, team, speed, life, attackerType?}`, `state.effects[] = {x, y, life, max, color}`.

## Tương tác
- [neutral-camps.md](neutral-camps.md): quân đánh quái của hang đang thức trong tầm (+40) hoặc của hang được lệnh dọn (`creepTargetFor()`, chen vào mục tiêu khi địch còn ngoài tầm); `hurt(target, damage, team, attackerType, src)` nhân `buffFactor()` của Lăng cổ cho đòn của quân; sát thương vào quái không tính vào thống kê; `attackRange()` và `damageMultiplier()` hiểu quái (`counterAs`). Chuỗi đuổi mục tiêu gồm cả `order==='camp'`.
- [units.md](units.md): chỉ số trong `specs`.
- [fog-of-war.md](fog-of-war.md): tầm nhìn quyết định có được nhắm hay không.
- [fortress.md](fortress.md): pháo tích hợp.
- [ai-opponent.md](ai-opponent.md): quân AI luôn đuổi mục tiêu.

## Multiplayer
Chỉ host tính chiến đấu. `serializeSnapshot()` gửi `target:null` cho quân và đạn (tham chiếu object không gửi được); guest không cần mục tiêu vì không mô phỏng.

## Kiểm thử thủ công
- Đã kiểm thử 2026-10-19 (`tests/combat.test.ts`): ST cơ bản; từng cặp khắc chế; hệ số công trình với nông trại và pháo đài (lính giáo đánh pháo đài chỉ 12, không ×2,2); súng không hệ số; pháo đài bắn 18 (khẩu chính) và 45 (khẩu thứ hai). `pnpm smoke ai` (AI tự chơi 8 phút) vẫn đạt.
- [ ] Cung thủ bắn đạn thấy được; lính thường đánh cận chiến.
- [ ] 1 giáo vs 1 kỵ binh: giáo gây ~24.3/đòn.
- [ ] Quân không có lệnh tấn công đứng yên khi địch ngoài tầm, đánh khi địch vào tầm.
- [ ] Phím A / nút Tấn công → quân được chọn tiến về mục tiêu gần nhất.
- [ ] Quân tấn công tới gần công trình địch → đánh tới khi công trình biến mất.

## Giới hạn / việc tồn đọng
- `nearestEnemy()` duyệt toàn bộ quân cho mỗi quân mỗi frame (O(n²)) và gọi `teamCanSee()` lặp lại.
- Đạn chỉ ăn sát thương khi mục tiêu còn sống; đạn bay hết `life` thì mất.
