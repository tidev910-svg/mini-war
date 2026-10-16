# Quân lính & xuất quân

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-16

## Mô tả
Người chơi dùng lúa (và gỗ/vàng tuỳ loại) để mua 5 loại quân. Quân mới xuất hiện ở **sân tập kết** cạnh pháo đài. Nếu sân đã kín, quân vào hàng chờ và tự xuất khi có chỗ.

## Luật & thông số
Bảng `specs` (đơn vị: HP, sát thương/đòn, tầm & tốc độ theo đơn vị thế giới, cooldown giây):

| Khoá | Tên | HP | ST | Tầm | Tốc độ | Cooldown | Giá (`cost`) | Nuôi (`upkeep`, lúa/phút) | Bán kính `r` | Tầm nhìn |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---:|
| `scout` | Trinh sát | 60 | 5 | 18 | 72 | 1.1 | 30 lúa | 0,5 | 8 | 145 |
| `infantry` | Lính | 100 | 13 | 22 | 45 | 0.8 | 40 lúa, 10 vàng | 1 | 10 | 105 |
| `archer` | Cung thủ | 65 | 10 | 125 | 34 | 1.05 | 55 lúa, 30 gỗ, 10 vàng | 1,5 | 9 | 130 |
| `spearman` | Lính giáo | 145 | 18 | 26 | 38 | 0.82 | 45 lúa, 20 gỗ | 1 | 11 | 150 |
| `cavalry` | Lính kỵ binh | 210 | 24 | 27 | 58 | 0.9 | 80 lúa, 50 vàng | 3 | 13 | 105 |

`cost` là object `{food, wood, stone, gold}`; nhãn giá trên nút được sinh từ `specs` bằng `costText()` nên luôn khớp. Nhãn nút có thêm "nuôi X lúa/phút". Hết lúa nuôi quân thì quân bị chậm, xem "Lúa duy trì & thiếu tiếp tế" trong [economy.md](economy.md). Lính bộ, cung thủ, kỵ binh cần **nhà lính bộ / nhà lính cung / chuồng ngựa đã xây xong** (`UNIT_REQUIREMENTS`, xem [buildings.md](buildings.md)); trinh sát và lính giáo tuyển ngay tại pháo đài. Nút quân bị khoá mờ đi và ghi "cần …".

(Tầm nhìn lấy từ `unitVisionRadius()`; AI dùng số khác, xem [fog-of-war.md](fog-of-war.md).)

Quy tắc mua (`buy()`):
- Không mua khi `ended` hoặc `paused`, hoặc `type` không phải khoá riêng của `specs` (`Object.hasOwn`).
- Tối đa **2 trinh sát** mỗi phe (tính cả quân trong hàng chờ).
- Thiếu công trình mở khoá (`hasBuilding()`) → log "Cần xây xong …", không trừ.
- Không đủ tài nguyên (`canAfford()`) → log "thiếu …" (`missingText()`), không trừ.
- Trừ tiền **trước**, rồi `spawn()`. Nếu sân kín, quân vào `state.pendingSpawns` (tiền đã trừ).

Vị trí xuất quân (`spawn()`):
- Sân tập kết: `musterYard(base)` — hình chữ nhật 170×144, phía trước pháo đài (bên phải với xanh, bên trái với đỏ).
- Xếp theo lưới 4 hàng ngang theo số quân cùng loại; nếu ô bận thì dò lưới 7×5 trong sân; nếu cả sân bận (quân đứng kín, hoặc sân nằm trên đá/nước) thì dò vòng tròn quanh sân tới 8 vòng, vẫn trong vùng căn cứ khi đang khoá xuất quân.
- Ô bị coi là bận nếu: ngoài sân, trên nước/đá, đè quân khác, công trình (theo footprint) hay pháo đài. Công trình không được đặt đè sân tập kết. Khi đang khoá xuất quân, quân không phải trinh sát phải nằm trong `BASE_DEPLOYMENT_RADIUS`.
- `processPendingSpawns()` thử lại hàng chờ mỗi 0.35 giây; quân xuất từ hàng chờ giữ `id` và `order` đã đặt.

Dữ liệu một quân: `{id, team, type, x, y, hp, max, attackTimer, order('hold'|'move'|'attack'|'explore'), target, dest, selected, walk, moving, facing?}`.

Hướng quay `facing` (`'down'|'left'|'up'|'right'`, mặc định `down`): tính cuối mỗi lượt quân trong `update()` bằng `facingFrom(dx, dy)` (trục lớn hơn thắng). Quân di chuyển thì quay theo hướng vừa đi; đứng yên thì quay về mục tiêu **nếu mục tiêu trong tầm đánh**, còn không thì giữ hướng cũ. Mọi loại quân đều có `facing`, nhưng hiện chỉ lính giáo có sprite 4 hướng; các quân khác luôn vẽ hướng xuống.

## Code liên quan
- [src/main.ts](../../src/main.ts): `specs`, `buy()`, `spawn()`, `processPendingSpawns()`, `musterYard()`, `normalizeUnitType()`, `unitVisionRadius()`.
- Hình ảnh: `*SpriteSheet` và `*Clips` (hàng 0–1 xanh idle/walk, hàng 2–3 đỏ), `drawUnit()`, `unitTargetHeight()`, `unitHitRadius()`.
- Nút: `#scout`, `#infantry`, `#archer`, `#spearman`, `#cavalry` trong [index.html](../../index.html) → `requestAction('buy',{unit})`.

## Tương tác
- [combat.md](combat.md): cách mỗi loại quân đánh, khắc chế giáo ↔ kỵ.
- [match-flow.md](match-flow.md): khoá xuất quân 120 giây.
- [fortress.md](fortress.md): sân tập kết gắn với pháo đài.
- [hud-ui.md](hud-ui.md): đếm quân, số quân trong hàng chờ.
- [rendering.md](rendering.md): spritesheet.

## Multiplayer
Guest gửi `buy` với `{unit}`; host gọi `buy(unit, 1)`.

## Kiểm thử thủ công
- [ ] Mua đủ 5 loại; tiền trừ đúng bảng.
- [ ] Mua trinh sát thứ 3 → bị từ chối.
- [ ] Mua liên tục cho kín sân → quân xuất ra chỗ trống quanh sân; khi cả vùng quanh sân cũng kín → log "Sân tập kết đã kín", HUD hiện "Chờ N"; dời quân đi → quân trong hàng chờ xuất hiện.
- Đã chạy thử 2026-10-16: chặn toàn bộ sân tập kết bằng đá → lính giáo vẫn xuất hiện cách pháo đài 5,3 ô, không vào hàng chờ.
- [ ] Lính giáo: ra lệnh đi lên/xuống/trái/phải → hình quay đúng hướng và có hoạt ảnh bước; dừng lại vẫn giữ hướng; đứng cạnh địch thì quay về phía địch. Ở PvP, guest thấy hướng quay giống host.
- [ ] Thêm loại quân mới: cập nhật `specs`, `unitVisionRadius()`, `unitTargetHeight()`, `drawUnit()`, `updateHUD()`, nút trong `index.html`, AI trong `update()`, và file này.

## Giới hạn / việc tồn đọng
- Quân di chuyển không kiểm tra nước/đá; chỉ lúc xuất quân mới kiểm tra.
- Lính thường, cung thủ, trinh sát, kỵ binh chưa có sprite 4 hướng (spritesheet chỉ có hướng xuống).
