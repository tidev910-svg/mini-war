# HUD & giao diện

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-16

## Mô tả
Giao diện quanh canvas: thanh trên (tiêu đề, chế độ, chỉ số), bảng bên (nút điều khiển, chú thích, nhật ký, hướng dẫn), overlay kết quả. Có nút thu gọn bảng bên và chế độ toàn màn hình. Toàn bộ chữ tiếng Việt.

## Luật & thông số
**Thanh HUD** (`updateHUD()`, gọi sau mỗi action và cuối mỗi `update()`):
| Phần tử | Nội dung |
|---|---|
| `#food`, `#wood`, `#stone`, `#gold` | 4 tài nguyên của `localTeam()` (lúa, gỗ, đá, vàng), làm tròn xuống; id trùng khoá trong `RESOURCE_NAMES` |
| `#foodRate` | Dưới ô lúa: "+sản xuất −tiêu thụ = ròng/phút"; class `supply-warn` (cam) khi ròng âm. Khi thiếu tiếp tế: "Thiếu lúa · chậm sau Ns" hoặc "Thiếu tiếp tế · quân chậm", class `supply-bad` (đỏ). Màu định nghĩa cuối [src/style.css](../../src/style.css) |
| `#territory`, `#territoryIncome` | Ô "🚩 Lãnh thổ": số vùng đang giữ (từ 1 vì vùng gần nhà sở hữu sẵn); dòng dưới là tổng thu từ mỏ theo chủ vùng ("+60 gỗ · +15 vàng/phút" hoặc "Chưa có mỏ") |
| `#time`, `#deployTimer` | Đồng hồ trận `mm:ss`; "Mở khóa xuất quân sau mm:ss" / "Đã mở khóa xuất quân" (`updateMatchClockHUD()`) |
| `#unitCount`, `#unitBreakdown` | Tổng quân + hàng chờ; chi tiết "Lính · Cung · Lính giáo · Kỵ binh · Chờ" |
| `#spearmanCount` | Số lính giáo |
| `#modeStatus` | Dòng chế độ (`setGameModeLabel()`) |

Nhãn giá trên các nút mua/xây được gán lúc tải trang từ `specs`, `BUILDING_TYPES`, `OUTPOST`, `FORTRESS_GUN_COST` (qua `costText()`). Nhãn "Quân xanh/đỏ" và "Lính giáo xanh/đỏ" lấy theo phần tử cha của `#unitCount`, `#spearmanCount`.

Nút trong `.controls` (theo thứ tự): `#scout`, `#infantry`, `#archer`, `#spearman`, `#cavalry`, `#attack`, `#farm`, `#upgradeFarm`, `#buildFlag`, `#upgradeOutpost`, `#buildBarracks`, `#buildArchery`, `#buildStable`, `#buildTower`, `#turret`, `#pause`, `#toggleTerritory` (ẩn/hiện lớp lãnh thổ, nhãn "Đang hiện/ẩn · phím T"), `#fullscreen`. Nút quân thiếu công trình mở khoá có class `locked` (mờ) và nhãn "· cần …"; nút "Nâng cấp nông trại" hiện giá cấp kế. Các nhãn này cập nhật trong `updateHUD()` qua `setText()` (chỉ ghi khi đổi). Khi `paused`/`ended` các nút mua/xây/tấn công bị vô hiệu; `#turret` còn bị vô hiệu khi đã đủ 2 pháo.

Khác:
- `#feed`: nhật ký, mới nhất ở trên, tối đa 12 dòng (`addLog()`).
- `#overlay`: kết quả trận + `#overlayRestart`.
- `#toggleSideHud`: thu gọn bảng bên (class `panel-collapsed` trên `#gameApp`), gọi lại `syncWorldMetrics()`.
- `#fullscreen`: `requestFullscreen()` trên `#gameApp`.
- Kích thước canvas: dọc màn hình ≤ 720 px → 540×960; rộng ≥ 900 px → 960×960; nhân `devicePixelRatio`.

## Code liên quan
- [index.html](../../index.html): toàn bộ markup (lưu ý `<title>` chứa "Mini War" — `start-game.bat` dựa vào chuỗi này để dò server).
- [src/style.css](../../src/style.css): theme, bố cục, responsive, `.mode-screen`, `.lobby`, `.overlay`.
- [src/main.ts](../../src/main.ts): `updateHUD()`, `updateMatchClockHUD()`, `addLog()`, `setGameModeLabel()`, `setSidebarCollapsed()`, `syncWorldMetrics()`, handler `#pause`, `#fullscreen`, `#overlayRestart`.

## Tương tác
- [match-flow.md](match-flow.md), [units.md](units.md), [fortress.md](fortress.md), [multiplayer.md](multiplayer.md).

## Multiplayer
HUD luôn hiển thị theo `localTeam()`; nhãn chỉ số và chú thích (`.legend`) đổi sang "đỏ" cho guest.

## Kiểm thử thủ công
- [ ] Chỉ số HUD cập nhật mỗi giây và sau mỗi lần mua.
- [ ] Thu gọn bảng bên → canvas giãn ra, bản đồ không méo.
- [ ] Toàn màn hình bật/tắt, nhãn nút đổi theo.
- [ ] Màn hình dọc điện thoại hiển thị được.

## Giới hạn / việc tồn đọng
- Văn bản hướng dẫn trong `index.html` viết cứng; cần sửa tay khi luật đổi (giá nông trại, số pháo…).
- 18 nút khiến bảng điều khiển phải cuộn trên màn hình thấp.
