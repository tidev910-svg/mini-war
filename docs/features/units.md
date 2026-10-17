# Quân lính & xuất quân

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Người chơi dùng lúa (và gỗ/vàng tuỳ loại) để mua 5 loại quân tại pháo đài. Quân đã trả tiền vào **hàng đợi huấn luyện**: mỗi phe huấn luyện lần lượt từng quân (4–12 giây), xong thì xuất hiện ở **sân tập kết** cạnh pháo đài. Nếu sân đã kín, quân vào hàng chờ xuất quân và tự ra khi có chỗ.

Nguồn: "Đề xuất cân bằng kinh tế và quân đội" (17/10/2026), bản thử nghiệm v1 — các con số còn phải kiểm chứng bằng playtest.

## Luật & thông số
Bảng `specs` (đơn vị: HP, sát thương/đòn, tầm & tốc độ theo đơn vị thế giới, cooldown giây):

| Khoá | Tên | HP | ST | Tầm | Tốc độ | Cooldown | Giá (`cost`) | Huấn luyện (`train`, giây) | Nuôi (`upkeep`, lúa/phút) | Bán kính `r` | Tầm nhìn |
|---|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|
| `scout` | Trinh sát | 60 | 5 | 18 | 72 | 1.1 | 30 lúa | 4 | 0,5 | 8 | 145 |
| `infantry` | Lính | 100 | 13 | 22 | 45 | 0.8 | 45 lúa | 5 | 1 | 10 | 105 |
| `archer` | Cung thủ | 65 | 10 | 125 | 34 | 1.05 | 55 lúa, 25 gỗ, 10 vàng | 8 | 1,5 | 9 | 130 |
| `spearman` | Lính giáo | 145 | 18 | 26 | 38 | 0.82 | 45 lúa, 15 gỗ | 6 | 1 | 11 | 150 |
| `cavalry` | Lính kỵ binh | 210 | 24 | 27 | 58 | 0.9 | 80 lúa, 40 vàng | 12 | 3 | 13 | 105 |

Giá đổi ngày 2026-10-17 theo đề xuất v1: lính bỏ 10 vàng (40 → 45 lúa) để luôn tuyển được quân cơ bản khi thiếu vàng; lính giáo 20 → 15 gỗ; cung thủ 30 → 25 gỗ; kỵ binh 50 → 40 vàng. Chỉ số chiến đấu giữ nguyên.

`cost` là object `{food, wood, stone, gold}`; nhãn giá trên nút được sinh từ `specs` bằng `costText()` nên luôn khớp. Nhãn nút có thêm thời gian huấn luyện và "nuôi X lúa/phút". Hết lúa nuôi quân thì quân bị chậm, xem "Lúa duy trì & thiếu tiếp tế" trong [economy.md](economy.md). **Mọi loại quân tuyển tại pháo đài** qua hàng đợi huấn luyện rồi xuất hiện ở sân tập kết (không còn nhà lính, không khoá thời gian đầu trận). Ba nhà lính đã bỏ ngày 2026-10-17; cùng ngày người dùng chốt cho lính bộ, cung thủ, kỵ binh tuyển thẳng tại nhà chính như trinh sát và lính giáo.

(Tầm nhìn lấy từ `unitVisionRadius()`; AI dùng số khác, xem [fog-of-war.md](fog-of-war.md).)

Quy tắc mua: mọi điều kiện nằm trong `buyProblem(type, team)` (trả về lý do, hoặc chuỗi rỗng nếu mua được). `buy()` gọi hàm này rồi mới trừ tiền. Nút quân gọi `requestBuy(type)`: ở guest PvP, hàm này kiểm tra trước bằng `buyProblem()` trên snapshot, báo lý do ngay trên màn hình guest và không gửi lệnh; host vẫn kiểm tra lại mọi lệnh mua.
- Không mua khi `ended` hoặc `paused`, hoặc `type` không phải khoá riêng của `specs` (`Object.hasOwn`).
- Tối đa **2 trinh sát** mỗi phe (tính cả quân đang huấn luyện và trong hàng chờ xuất quân).
- Hàng đợi huấn luyện tối đa `TRAIN_QUEUE_MAX` = 5 quân mỗi phe (kể cả quân đang luyện) → "Hàng đợi huấn luyện đã đầy (5 quân)."
- Không có khoá thời gian đầu trận và không cần công trình nào.
- Không đủ tài nguyên (`canAfford()`) → log "thiếu …" (`missingText()`), không trừ.
- Trừ tiền **lúc xếp hàng**, rồi `queueTraining()` thêm `{id, team, type, order, left, total}` vào `state.trainQueue`. Không có nút huỷ, không hoàn tiền.
- `updateTraining(dt)` (trong `update()`, chỉ host): mỗi phe chỉ phần tử đầu hàng giảm `left`; về 0 thì `spawn()` (giữ `order`, AI dùng `'explore'` cho trinh sát). Nếu sân kín, quân vào `state.pendingSpawns`. Tạm dừng thì hàng đợi cũng dừng.
- Thời gian chạy thử 2026-10-17: lính ra ở giây 5,0 (giây 4,9 chưa có); xếp lính giáo + cung thủ cùng lúc → ra ở giây 6 và 14 (lần lượt).

Vị trí xuất quân (`spawn()`):
- Sân tập kết: `musterYard(base)` — hình chữ nhật 170×144, phía trước pháo đài, quay về phía pháo đài địch theo trục ngang (`baseDir()`).
- Xếp theo lưới 4 hàng ngang theo số quân cùng loại; nếu ô bận thì dò lưới 7×5 trong sân; nếu cả sân bận (quân đứng kín, hoặc sân nằm trên đá/nước) thì dò vòng tròn quanh sân tới 8 vòng.
- Ô bị coi là bận nếu: ngoài sân, trên nước/đá, đè quân khác, công trình (theo footprint) hay pháo đài. Công trình không được đặt đè sân tập kết.
- `processPendingSpawns()` thử lại hàng chờ mỗi 0.35 giây; quân xuất từ hàng chờ giữ `id` và `order` đã đặt.

Dữ liệu một quân: `{id, team, type, x, y, hp, max, attackTimer, order('hold'|'move'|'attack'|'explore'), target, dest, selected, walk, moving, facing?}`.

Hướng quay `facing` (`'down'|'left'|'up'|'right'`, mặc định `down`): tính cuối mỗi lượt quân trong `update()` bằng `facingFrom(dx, dy)` (trục lớn hơn thắng). Quân di chuyển thì quay theo hướng vừa đi; đứng yên thì quay về mục tiêu **nếu mục tiêu trong tầm đánh**, còn không thì giữ hướng cũ. Mọi loại quân đều có `facing`, nhưng hiện chỉ lính giáo có sprite 4 hướng; các quân khác luôn vẽ hướng xuống.

## Code liên quan
- [src/main.ts](../../src/main.ts): `specs`, `TRAIN_QUEUE_MAX`, `trainQueueOf()`, `buyProblem()`, `buy()`, `requestBuy()`, `queueTraining()`, `updateTraining()`, `updateTrainQueueHUD()`, `spawn()`, `processPendingSpawns()`, `musterYard()`, `normalizeUnitType()`, `unitVisionRadius()`.
- Hình ảnh: `*SpriteSheet` và `*Clips` (hàng 0–1 xanh idle/walk, hàng 2–3 đỏ), `drawUnit()`, `unitTargetHeight()`, `unitHitRadius()`.
- Nút: `#scout`, `#infantry`, `#archer`, `#spearman`, `#cavalry` trong [index.html](../../index.html) → `requestAction('buy',{unit})`.

## Tương tác
- [combat.md](combat.md): cách mỗi loại quân đánh, khắc chế giáo ↔ kỵ.
- [match-flow.md](match-flow.md): tuyển quân và di chuyển ngay từ giây 0 (không còn khoá).
- [territory.md](territory.md): quân đứng trong vòng cờ để chiếm vùng.
- [fortress.md](fortress.md): sân tập kết gắn với pháo đài.
- [hud-ui.md](hud-ui.md): đếm quân, số quân trong hàng chờ.
- [rendering.md](rendering.md): spritesheet.

## Multiplayer
Guest gửi `buy` với `{unit}` (qua `requestBuy()`, sau khi tự kiểm tra `buyProblem()` để hiện lý do từ chối); host gọi `buy(unit, 1)` và kiểm tra lại. Snapshot có thể trễ tới 0,18 giây, nên hiếm khi guest gửi được một lệnh mà host vẫn từ chối; khi đó guest chỉ thấy là không có quân mới.

## Kiểm thử thủ công
- [ ] Mua đủ 5 loại ngay giây 0 → tiền trừ đúng bảng.
- Đã chạy thử 2026-10-17 (sau khi mở tuyển tại pháo đài): bấm cả 5 nút ở giây 0 → ra đủ 5 quân, trừ 250 lúa, 50 gỗ, 70 vàng (khớp bảng); PvP guest mua lính bộ được; AI tự tuyển lính bộ và cung thủ.
- [ ] PvP: guest bấm trinh sát thứ 3 / lính giáo khi thiếu lúa → log lý do hiện ở guest, host không tạo quân.
- Đã chạy thử 2026-10-17 (2 Chrome headless): `buyProblem()` trả đúng lý do cho loại quân lạ (`'constructor'`), trinh sát thứ 3 (tính cả 2 trinh sát trong hàng chờ), thiếu lúa; guest thấy lý do trên màn hình, host không tạo quân; đủ tài nguyên thì guest mua lính giáo, trừ 45 lúa.
- [ ] Mua trinh sát thứ 3 → bị từ chối.
- [ ] Mua liên tục cho kín sân → quân xuất ra chỗ trống quanh sân; khi cả vùng quanh sân cũng kín → log "Sân tập kết đã kín", HUD hiện "Chờ N"; dời quân đi → quân trong hàng chờ xuất hiện.
- Đã chạy thử 2026-10-16: chặn toàn bộ sân tập kết bằng đá → lính giáo vẫn xuất hiện cách pháo đài 5,3 ô, không vào hàng chờ.
- [ ] Lính giáo: ra lệnh đi lên/xuống/trái/phải → hình quay đúng hướng và có hoạt ảnh bước; dừng lại vẫn giữ hướng; đứng cạnh địch thì quay về phía địch. Ở PvP, guest thấy hướng quay giống host.
- [ ] Thêm loại quân mới: cập nhật `specs`, `unitVisionRadius()`, `unitTargetHeight()`, `drawUnit()`, `updateHUD()`, nút trong `index.html`, AI trong `update()`, và file này.

## Giới hạn / việc tồn đọng
- Quân di chuyển không kiểm tra nước/đá; chỉ lúc xuất quân mới kiểm tra.
- Lính thường, cung thủ, trinh sát, kỵ binh chưa có sprite 4 hướng (spritesheet chỉ có hướng xuống).
