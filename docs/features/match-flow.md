# Luồng trận đấu

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-15

## Mô tả
Một trận bắt đầu khi người chơi chọn chế độ. Hai phe xuất phát ở hai đầu bản đồ, mỗi phe có một pháo đài. Trong 120 giây đầu (giai đoạn trinh sát) chỉ trinh sát được rời vùng căn cứ. Phe nào mất pháo đài trước thì thua.

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Thời gian khoá xuất quân | 120 giây | `DEPLOYMENT_LOCK_SECONDS` |
| Bán kính vùng căn cứ khi khoá | 8 ô (`TILE_SIZE*8`) | `BASE_DEPLOYMENT_RADIUS` |
| Bước mô phỏng tối đa | 0.05 giây | `loop()` |
| Vị trí pháo đài xanh | x ∈ [220, 220+0.16·W], y ngẫu nhiên, cách mép ≥ 260 | `fresh()` |
| Vị trí pháo đài đỏ | đối xứng bên phải | `fresh()` |
| Tài nguyên ban đầu | 150 vàng, 100 năng lượng mỗi phe | `fresh()` |
| Nhật ký giữ tối đa | 12 dòng | `addLog()` |

Quy tắc khoá (áp dụng mọi quân trừ `scout` khi `gameTime < 120`):
- `isDeploymentLocked(unit)` đúng → `constrainToBaseDeploymentZone()` kéo quân về trong bán kính căn cứ mỗi frame.
- Lệnh `move` có điểm đến ngoài vùng → quân bị chuyển `order='hold'` và có log cảnh báo.
- Quân `attack` không đuổi mục tiêu ngoài tầm cho tới khi hết khoá.
- Khi hết khoá: log "Thời gian khóa đã kết thúc..." và HUD đổi thành "Đã mở khóa xuất quân".

Kết thúc:
- `hurt()` làm HP pháo đài ≤ 0 → `finish(win)`; `win` tính theo **team 0** (`bases[1]` chết → thắng).
- `finish()` đặt `ended=true`, hiện `#overlay` với tiêu đề "🏆 CHIẾN THẮNG!" / "💥 THẤT THỦ!".
- Nút "↻ Chơi lại" (`#overlayRestart`) gọi `fresh()` ở chế độ AI; ở PvP chỉ log hướng dẫn tạo phòng mới.

Tạm dừng: nút `#pause` hoặc phím Space. Ở guest PvP gửi action `pause`; ở host/AI đổi `paused` trực tiếp.

## Code liên quan
- [src/main.ts](../../src/main.ts): `fresh()` tạo `state` mới, đặt pháo đài, mỏ, decor, camera về căn cứ xanh.
- `update(dt)` — bước mô phỏng; dừng khi `!gameStarted`, `paused`, `ended` hoặc là guest.
- `loop(ts)` — vòng `requestAnimationFrame`.
- `finish(win)`, `isDeploymentLocked()`, `insideBaseDeploymentZone()`, `constrainToBaseDeploymentZone()`, `updateMatchClockHUD()`, `addLog()`.
- `startAIMode()`, `startHostGame()`, `startGuestFromSnapshot()` — điểm vào trận.
- Lúc tải trang: `fresh(); gameStarted=false;` nên bản đồ đã có sẵn sau màn hình chọn chế độ.

## Tương tác
- [units.md](units.md): vị trí xuất quân bị giới hạn trong vùng căn cứ khi khoá.
- [controls.md](controls.md): lệnh `move`/`attack` bị khoá ảnh hưởng.
- [multiplayer.md](multiplayer.md): guest không chạy `update()`; kết quả trận đi qua snapshot.
- [hud-ui.md](hud-ui.md): đồng hồ, overlay kết quả.

## Multiplayer
- `pause` là action: guest gửi `{paused: !paused}`, host áp dụng cho cả trận.
- Guest đảo nghĩa thắng/thua trong `applySnapshot()` dựa vào `resultTitle` của host (có chứa "CHIẾN THẮNG!" hay không).

## Kiểm thử thủ công
- [ ] AI: trước 120s, tạo lính và ra lệnh đi xa → lính không ra khỏi vùng căn cứ; trinh sát thì đi được.
- [ ] Tới 02:00 log mở khoá xuất hiện, lính đi được.
- [ ] Phá pháo đài đỏ → overlay thắng; "Chơi lại" tạo trận mới với vị trí căn cứ khác.
- [ ] Space tạm dừng/tiếp tục; khi tạm dừng các nút mua bị vô hiệu.
- [ ] PvP: guest bấm tạm dừng → cả hai bên dừng.

## Giới hạn / việc tồn đọng
- PvP không có "chơi lại" trong cùng phòng.
- Tạm dừng ở PvP: bên nào cũng có thể bỏ tạm dừng của bên kia.
