# Chiến đấu

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-20

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
| Sát thương thực tế | ST cơ bản × hệ số khắc chế (mục tiêu là quân) hoặc × hệ số công trình (mục tiêu là công trình hay pháo đài; không nhân chồng). Súng và quái canh mỏ không có hệ số | `damageMultiplier()`, `hurt()` |
| Hiệu ứng trúng đòn | vòng tròn 0.18 giây (xanh `#73c8ff` / đỏ `#ff747a`) | `hurt()` |
| Hồi chiêu ban đầu ngẫu nhiên | 0–0.35 giây | `spawn()` |
| Thiếu tiếp tế | tốc độ × 0,85; hồi chiêu ÷ 0,9 | `supplyFactor()`, xem [economy.md](economy.md) |

Chọn mục tiêu (`nearestEnemy(u)`), chạy mỗi frame cho từng quân:
1. Quân địch gần nhất. Lọc theo tầm nhìn: ở **PvP** mọi phe chỉ nhắm quân mình đang thấy; ở **AI** chỉ quân đỏ bị lọc (`aiCanSee()`), quân xanh nhắm được cả quân trong sương mù.
2. Pháo đài địch thay thế nếu gần hơn quân tốt nhất ít nhất 20 (hoặc chưa có mục tiêu). Ở AI, quân xanh luôn "biết" pháo đài đỏ; các trường hợp khác phải đang nhìn thấy.
3. Công trình địch (`state.buildings`) đang thấy — cả hai phe (ở chế độ AI, quân xanh thấy hết) — nếu gần hơn ít nhất 15.

Công trình bị đánh về 0 máu → `destroyBuilding()` (xoá hẳn; phá tiền đồn địch thì cờ vùng đó chiếm được). Cột cờ không phải công trình, không bị đánh; chiếm bằng cách đứng trong vòng cờ ([territory.md](territory.md)). Tháp và tiền đồn bắn quân địch: xem [buildings.md](buildings.md).

Trong vòng quân của `update()`, tốc độ và hồi chiêu dùng biến cục bộ `speed`, `cooldown` (đã nhân hệ số thiếu tiếp tế), không dùng thẳng `s.speed`, `s.cooldown`.

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
- [src/sim/combat.ts](../../src/sim/combat.ts), [src/core/game.ts](../../src/core/game.ts), [src/core/match.ts](../../src/core/match.ts): `nearestEnemy()`, `attackRange()`, `structureReach()`, `unitTargetValid()`, `hurt()`, `dist()`, khối "unit movement and combat" và "bullets track moving target" trong `update()`.
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
- Đã kiểm thử 2026-10-19 (`tests/combat.test.ts`): ST cơ bản; từng cặp khắc chế; hệ số công trình với nông trại và pháo đài (lính giáo đánh pháo đài chỉ 12, không ×2,2); súng không hệ số; pháo đài bắn 18 (khẩu chính) và 45 (khẩu thứ hai). `pnpm smoke ai` (AI tự chơi 8 phút) vẫn đạt.
- [ ] Cung thủ bắn đạn thấy được; lính thường đánh cận chiến.
- [ ] 1 giáo vs 1 kỵ binh: giáo gây ~24.3/đòn.
- [ ] Quân không có lệnh tấn công đứng yên khi địch ngoài tầm, đánh khi địch vào tầm.
- [ ] Phím A / nút Tấn công → quân được chọn tiến về mục tiêu gần nhất.
- [ ] Quân tấn công tới gần công trình địch → đánh tới khi công trình biến mất.

## Giới hạn / việc tồn đọng
- Ở chế độ AI, quân xanh nhắm được quân đỏ trong sương mù (không đối xứng với AI).
- `nearestEnemy()` duyệt toàn bộ quân cho mỗi quân mỗi frame (O(n²)) và gọi `teamCanSee()` lặp lại.
- Đạn chỉ ăn sát thương khi mục tiêu còn sống; đạn bay hết `life` thì mất.
