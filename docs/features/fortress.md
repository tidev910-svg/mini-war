# Pháo đài & pháo tích hợp

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-19

## Mô tả
Mỗi phe có một pháo đài, vừa là căn cứ chính vừa là công trình phòng thủ. Pháo đài có sẵn 1 khẩu pháo; người chơi trả 150 đá để mở khẩu thứ hai, đồng thời pháo đài được tăng máu. Nhấp vào pháo đài để chọn nó và xem tầm bắn của pháo. Tính năng này thay cho "tháp canh" trong tài liệu cũ.

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| HP pháo đài ban đầu | 1230 | `fresh()` |
| Kích thước logic | `TILE_SIZE*5.5` × `TILE_SIZE*5.0` | `fresh()` |
| Số pháo | 2 khe; khe 0 bật sẵn | `base.guns` |
| Giá mở pháo thứ hai | 150 đá | `FORTRESS_GUN_COST` |
| Thưởng khi mở | +230 HP tối đa và HP hiện tại | `buildTurret()` |
| Vị trí pháo | `base.x ± 82`, pháo 1 ở phía pháo đài địch (`baseDir()`) | `fortressGunPosition()` |
| Tầm bắn pháo | 190 | `update()` |
| Sát thương / cooldown / tốc độ đạn | Khẩu chính 18, khẩu thứ hai 45 (Combat V3.1) / 1.0 giây / 320 | `FORTRESS_GUN_DAMAGE`, `update()` |
| Tầm nhìn pháo đài | 175 (xanh); AI dùng 160 cho căn cứ đỏ | `teamCanSee()`, `update()` |
| Tầm nhìn mỗi pháo đang bật | 105 | `teamCanSee()` |

Pháo chọn quân địch gần nhất trong tầm **mà phe mình đang nhìn thấy**. Đạn đuổi theo mục tiêu (xem [combat.md](combat.md)).

## Code liên quan
- [src/sim/buildings.ts](../../src/sim/buildings.ts), [src/map/bases.ts](../../src/map/bases.ts): `buildTurret()`, `activeFortressGuns()`, `fortressGunPosition()`, `musterYard()`.
- Khối "Integrated fortress cannons" trong `update()`.
- Vẽ: `drawBase()` (sprite `/assets/fortress-sprite.png`, thanh máu, nhãn "PHÁO ĐÀI XANH/ĐỎ"), `drawMusterYard()`; vòng tầm bắn vẽ trong `draw()` khi `selectedFortress` là pháo đài của mình.
- Dữ liệu: `state.bases[0|1] = {team, x, y, hp, max, w, h, guns:[{active, cool}, {active, cool}]}`.
- Nút `#turret` (bị vô hiệu khi đã có 2 pháo, xem `updateHUD()`).

## Tương tác
- [match-flow.md](match-flow.md): pháo đài HP ≤ 0 → `finish()`.
- [units.md](units.md): sân tập kết nằm cạnh pháo đài.
- [fog-of-war.md](fog-of-war.md): pháo đài và pháo là nguồn tầm nhìn.
- [ai-opponent.md](ai-opponent.md): AI có 25% cơ hội mở pháo thứ hai mỗi 5 giây khi đủ 150 đá.
- [farms.md](farms.md): nông trại không được đè lên pháo đài.

## Multiplayer
Action `turret` không có payload; host gọi `buildTurret(1)` cho guest.

## Kiểm thử thủ công
- [ ] Bấm "Nâng cấp pháo đài" khi có 150 đá → HP tối đa 1230 → 1460, nút bị khoá.
- [ ] Nhấp pháo đài → thấy 1 hoặc 2 vòng tầm bắn nét đứt.
- [ ] Đưa quân địch vào tầm → pháo bắn khoảng 1 phát/giây.

## Giới hạn / việc tồn đọng
- Vùng nhấp chọn pháo đài là hình chữ nhật cố định (±124 ngang, từ y−196 tới y+34), không khớp `w/h` logic.
- Vòng lặp sương mù cho căn cứ xanh trong `update()` chỉ dùng tâm pháo đài (175), không cộng tầm nhìn của pháo.
