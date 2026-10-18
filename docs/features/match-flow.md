# Luồng trận đấu

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Một trận bắt đầu khi người chơi chọn chế độ. Hai phe xuất phát ở hai đầu bản đồ, mỗi phe có một pháo đài. **Không có khoá đầu trận**: từ giây 0 có thể tuyển quân (nếu đủ tài nguyên và công trình) và đưa quân đi bất kỳ đâu. Phe nào mất pháo đài trước thì thua.

Nhịp độ dự kiến (định hướng, không phải luật): 0–5 phút phát triển kinh tế, 5–10 phút mở rộng, sau 10 phút giao tranh. HUD ghi giai đoạn dưới đồng hồ.

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Bước mô phỏng tối đa | 0.05 giây | `loop()` |
| Vị trí pháo đài | Cả hai ngẫu nhiên ở bất kỳ đâu, cách mép bản đồ ≥ 420, cách nhau ≥ 55% bề ngang bản đồ (`BASE_MIN_SEPARATION`). `base.dir` = ±1 hướng về pháo đài địch theo trục ngang (sân tập kết, pháo phía trước, khung camera ban đầu) | `fresh()`, `baseDir()` |
| Chọn lại vị trí | Bỏ vị trí mà pháo đài/sân tập kết < 85% ô đi được; chọn lại tới khi bản đồ đủ công bằng (≤ 15 bản đồ) | `fresh()`, `baseSiteClear()`, [territory.md](territory.md) |
| Nhãn giai đoạn | < 5 phút "phát triển kinh tế", < 10 phút "mở rộng", sau đó "giao tranh" | `updateMatchClockHUD()` → `#phaseHint` |
| Tài nguyên ban đầu | 150 lúa, 400 gỗ, 50 đá, 50 vàng mỗi phe | `STARTING_RESOURCES` |
| Nhật ký giữ tối đa | 12 dòng | `addLog()` |

Khoá xuất quân 120 giây (`DEPLOYMENT_LOCK_SECONDS`, `isDeploymentLocked()`, `constrainToBaseDeploymentZone()`…) **đã bỏ hẳn** ngày 2026-10-17 theo tài liệu "Tổng kết yêu cầu sửa game RTS 1vs1" (16/10/2026).

Kết thúc:
- `hurt()` làm HP pháo đài ≤ 0 → `finish(win)`; `win` tính theo **team 0** (`bases[1]` chết → thắng).
- `finish()` đặt `ended=true`, hiện `#overlay` với tiêu đề "🏆 CHIẾN THẮNG!" / "💥 THẤT THỦ!".
- Nút "↻ Chơi lại" (`#overlayRestart`) gọi `fresh()` ở chế độ AI; ở PvP chỉ log hướng dẫn tạo phòng mới.

Tạm dừng: nút `#pause` hoặc phím Space. Ở guest PvP gửi action `pause`; ở host/AI đổi `paused` trực tiếp.

## Code liên quan
- [src/core/match.ts](../../src/core/match.ts), [src/map/regions.ts](../../src/map/regions.ts), [src/core/game.ts](../../src/core/game.ts): `fresh()` chọn vị trí pháo đài (vòng chọn lại), gọi `generateRegions()`, tạo `state` mới, decor, camera về căn cứ của mình.
- `update(dt)` — bước mô phỏng; dừng khi `!gameStarted`, `paused`, `ended` hoặc là guest.
- `loop(ts)` — vòng `requestAnimationFrame`.
- `finish(win)`, `updateMatchClockHUD()`, `addLog()`.
- `startAIMode()`, `startHostGame()`, `startGuestFromSnapshot()` — điểm vào trận.
- Lúc tải trang: `fresh(); gameStarted=false;` nên bản đồ đã có sẵn sau màn hình chọn chế độ.

## Tương tác
- [territory.md](territory.md): sinh bản đồ và vùng trong `fresh()`.
- [multiplayer.md](multiplayer.md): guest không chạy `update()`; kết quả trận đi qua snapshot.
- [hud-ui.md](hud-ui.md): đồng hồ, overlay kết quả.

## Multiplayer
- `pause` là action: guest gửi `{paused: !paused}`, host áp dụng cho cả trận.
- Guest đảo nghĩa thắng/thua trong `applySnapshot()` dựa vào `resultTitle` của host (có chứa "CHIẾN THẮNG!" hay không).

## Kiểm thử thủ công
- [ ] Giây 0: tuyển lính giáo và ra lệnh đi xa → lính đi ngay. HUD ghi "Giai đoạn phát triển kinh tế", không còn đếm ngược mở khoá.
- Đã chạy thử 2026-10-17: lính giáo tuyển ở giây 0 nhận lệnh `move` và rời pháo đài; 40 trận mới đều có pháo đài và sân tập kết trên đất, xuất quân được.
- [ ] Phá pháo đài đỏ → overlay thắng; "Chơi lại" tạo trận mới với vị trí căn cứ khác.
- [ ] F3 (hoặc Pause) tạm dừng/tiếp tục; khi tạm dừng các nút mua bị vô hiệu.
- [ ] PvP: guest bấm tạm dừng → cả hai bên dừng.

## Giới hạn / việc tồn đọng
- PvP không có "chơi lại" trong cùng phòng.
- Tạm dừng ở PvP: bên nào cũng có thể bỏ tạm dừng của bên kia.
