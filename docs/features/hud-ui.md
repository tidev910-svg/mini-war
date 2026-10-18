# HUD & giao diện

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-18

## Mô tả
Giao diện theo phong cách game chiến thuật vương quốc (kiểu Rise of Kingdoms): **bản đồ phủ toàn màn hình**, các bảng nổi trên bản đồ với nền xanh đậm, viền vàng đồng hai lớp, nút tròn viền vàng. Không dùng ảnh của game khác; hình ảnh là sprite có sẵn của Mini War, emoji và CSS. Toàn bộ chữ tiếng Việt.

```
(◉) QUÂN XANH ⏱ 03:12            [🌾][🪵][🪨][🪙][🚩]   ← huy hiệu chỉ huy · thanh tài nguyên
[Hàng đợi]                                       (Ⅱ)(🗺)(⛶)(❓)(▣) ← cột nút tròn
                     BẢN ĐỒ                 [bảng Huấn luyện / Xây dựng]
[minimap]  📜 nhật ký một dòng…      (🛡 Huấn luyện)(🔨 Xây dựng)(⚔ Tấn công)
```

## Luật & thông số
**Vùng giao diện** (markup trong [index.html](../../index.html), tất cả nằm trong `.hud-layer` phủ trên `#game`):
| Vùng | Phần tử | Nội dung |
|---|---|---|
| Huy hiệu chỉ huy (trên trái) | `#crest`, `#sideName`, `#time`, `#modeStatus`, `#unitCount`, `#phaseHint`, `#unitBreakdown` | Huy hiệu tròn màu phe (class `red` cho phe đỏ), "QUÂN XANH/ĐỎ", đồng hồ `mm:ss`, chế độ ("Chơi với AI · Offline", "Solo với bạn bè · Chủ phòng/Khách"), tổng quân + hàng chờ, giai đoạn ("phát triển kinh tế" < 5 phút, "mở rộng" < 10 phút, "giao tranh"), chi tiết từng loại quân |
| Thanh tài nguyên (trên phải) | `#food` `#wood` `#stone` `#gold` + `#foodRate` `#woodRate` `#stoneRate` `#goldRate`; `#territory`, `#territoryIncome` | Số tài nguyên của `localTeam()` (làm tròn xuống) trong "viên nang". Dòng nhỏ: lúa "+sản xuất −tiêu thụ = ròng/phút" (class `supply-warn` cam khi âm, `supply-bad` đỏ khi thiếu tiếp tế: "Thiếu lúa · chậm sau Ns" / "Thiếu tiếp tế · quân chậm"); gỗ/đá/vàng "+N/phút" = thu nhập pháo đài + mỏ đang giữ. Ô 🚩: số vùng đang giữ (gồm vùng nhà) và thu nhập từ mỏ |
| Cột nút tròn (phải) | `#pause`, `#toggleTerritory`, `#fullscreen`, `#openGuide`, `#toggleSideHud` | Tạm dừng/tiếp tục (`setPauseButton()`, phím F3), ẩn/hiện lớp lãnh thổ (class `placing` khi đang ẩn), toàn màn hình, mở hướng dẫn, ẩn/hiện mọi bảng (class `panel-collapsed` trên `#gameApp`; cột nút vẫn hiện để bật lại). Tên nút hiện khi rê chuột |
| Hàng đợi (trái) | `.queue-panel` > `#trainQueue` | `updateTrainQueueHUD()`: quân đang huấn luyện (thanh xanh lá + giây còn lại), quân chờ ("chờ n/4"), công trình đang xây ("Đang xây …", hoặc "cần quân đứng cạnh" với tiền đồn chưa có thợ) và nông trại đang nâng cấp (thanh vàng). Ẩn cả khung khi trống (`:has(.queue-list:empty)`) |
| Minimap (dưới trái) | `#minimap` | Xem [minimap.md](minimap.md) |
| Nhật ký (dưới giữa) | `#chatStrip` > `#feed`, `#chatToggle` | `addLog()` thêm dòng mới lên đầu, giữ 12 dòng. Thu gọn: chỉ hiện dòng mới nhất; bấm 📜 hoặc bấm vào dòng để mở rộng (class `open`) |
| Nút lệnh chính (dưới phải) | `#openTrain`, `#openBuild`, `#attack` | Mở bảng huấn luyện (phím H, rồi Q W E R T), bảng xây dựng (phím B, rồi F T O U P), lệnh tấn công cho nhóm đang chọn (phím A). Nút đang mở bảng có class `active` |

**Bảng trượt** (`src/ui/panels.ts`; mỗi lúc chỉ mở một bảng; `openPanel()`, `closePanels()`, `togglePanel()`):
- `#trainDrawer`: 5 thẻ quân (`#scout`, `#infantry`, `#archer`, `#spearman`, `#cavalry`). Mỗi thẻ có ảnh chân dung vẽ từ khung đứng yên đầu tiên của spritesheet theo màu phe (`drawPortraits()`, vẽ lại khi ảnh nạp xong và khi vào trận), tên, giá + thời gian huấn luyện + lúa nuôi, số quân đang có. Thẻ có class `cant` (giá chữ đỏ) khi không đủ tài nguyên; tooltip là lý do từ `buyProblem()`. Bấm thẻ = `requestBuy()`; bảng **vẫn mở** để mua tiếp.
- `#buildDrawer`: `#farm`, `#buildTower`, `#upgradeOutpost` (tiền đồn cho cờ đang chọn hoặc vùng gần nhất), `#upgradeFarm` (giá cấp kế), `#turret` (pháo thứ hai). Bấm công trình cần đặt → **đóng bảng** rồi `beginPlacement()`.
- `#guideModal`: hướng dẫn luật chơi và điều khiển (chữ viết cứng trong `index.html`), chú thích màu `.legend` (đổi theo phe trong `setGameModeLabel()`).
- Đóng bảng: nút ✕ (`[data-close]`), Esc, bấm xuống bản đồ (chỉ với bảng huấn luyện/xây dựng), bấm ra ngoài khung hướng dẫn.
- Hai bảng trượt mang class `controls` để `endPlacement()` tìm được nút đang `placing`.

Nhãn giá trên thẻ được gán lúc tải trang và cập nhật trong `updateHUD()` qua `setText()` (chỉ ghi khi đổi), từ `specs`, `BUILDING_TYPES`, `FORTRESS_GUN_COST` (`costText()`). Khi `paused`/`ended` các nút mua/xây/tấn công và hai nút mở bảng bị vô hiệu; `#turret` còn bị vô hiệu khi đã đủ 2 pháo.

**Phong cách** ([src/style.css](../../src/style.css), viết lại 2026-10-18): token màu trên `:root` (`--navy-*`, `--gold*`, `--blue`, `--red`), khung chung `--frame`, chữ tiêu đề `--title-font` = Palatino Linotype / Book Antiqua / Noto Serif / Times New Roman (đủ dấu tiếng Việt; không tải font ngoài để chơi offline vẫn đúng), chữ thường `system-ui`.
- Màn ≤ 900 px: thanh tài nguyên xuống hàng thứ hai, minimap lên góc phải dưới thanh tài nguyên, nhật ký nằm trên các nút lệnh.
- Màn ≤ 560 px (điện thoại dọc): huy hiệu và nút nhỏ hơn, ẩn dòng phụ của tài nguyên, bảng trượt rộng hết màn hình và cuộn được, thẻ 3 cột.

**Canvas** (`syncWorldMetrics()` trong `src/core/view.ts`): phủ toàn `#gameApp`; độ phân giải nền = kích thước CSS × `devicePixelRatio` nhưng không quá `MAX_CANVAS_PIXELS` = 2,1 triệu điểm ảnh (CSS phóng lên) để giữ `draw()` nhẹ.

Khác:
- `#overlay`: kết quả trận + `#overlayRestart`.
- `#fullscreen`: `requestFullscreen()` trên `#gameApp`.
- Banner hướng dẫn đặt công trình vẽ trên canvas ở 14% chiều cao từ trên xuống (không bị nhật ký che).

## Code liên quan
- [index.html](../../index.html): markup (lưu ý `<title>` chứa "Mini War" — `scripts/start-game.bat` dựa vào chuỗi này để dò server).
- [src/style.css](../../src/style.css): toàn bộ giao diện.
- [src/ui/hud.ts](../../src/ui/hud.ts): `updateHUD()`, `updateMatchClockHUD()`, `updateTrainQueueHUD()`, `setPauseButton()`, `setShowTerritory()`, `setSidebarCollapsed()`, `setText()`.
- [src/ui/panels.ts](../../src/ui/panels.ts): `openPanel()`, `closePanels()`, `togglePanel()`, `openPanelName`, `updateUnitCards()`, `drawPortraits()`, nhật ký thu/mở. Phím tắt: [controls.md](controls.md) (`src/ui/hotkeys.ts`).
- [src/ui/modeScreen.ts](../../src/ui/modeScreen.ts): `setGameModeLabel()` (chế độ, huy hiệu phe, chân dung).
- [src/ui/input.ts](../../src/ui/input.ts): gán nút (giá, `requestBuy()`, `beginPlacement()`, `#pause`, `#fullscreen`, `#overlayRestart`).
- [src/core/game.ts](../../src/core/game.ts): `addLog()`. [src/core/view.ts](../../src/core/view.ts): `syncWorldMetrics()`, `MAX_CANVAS_PIXELS`.

## Tương tác
- [minimap.md](minimap.md), [controls.md](controls.md) (phím tắt), [units.md](units.md) (hàng đợi huấn luyện), [buildings.md](buildings.md), [match-flow.md](match-flow.md), [multiplayer.md](multiplayer.md).

## Multiplayer
HUD luôn hiển thị theo `localTeam()`: khách thấy huy hiệu đỏ "QUÂN ĐỎ", chân dung quân đỏ, tài nguyên và hàng đợi của phe đỏ (đi qua snapshot). Thẻ quân của khách vẫn gửi `requestBuy()` → host kiểm tra.

## Kiểm thử thủ công
- [ ] Chỉ số HUD cập nhật mỗi giây và sau mỗi lần mua; gỗ/đá/vàng có dòng "+N/phút".
- [ ] H / nút Huấn luyện mở bảng, bấm thẻ thêm quân vào hàng đợi bên trái; B chuyển sang bảng xây dựng; chọn nông trại → bảng đóng, vào chế độ đặt; Esc đóng bảng / huỷ đặt.
- [ ] Ẩn giao diện (▣) → chỉ còn cột nút; bấm lại để hiện.
- [ ] Nhật ký: một dòng, bấm để mở rộng 12 dòng.
- [ ] Toàn màn hình bật/tắt, nhãn nút đổi theo.
- [ ] 1400×1000, 1920×1080 và điện thoại dọc 390×844 đều không tràn, bảng không che nút lệnh.
- Đã chạy thử 2026-10-18: `pnpm smoke ui` (mọi id, bảng, phím, minimap, nhật ký) và `pnpm smoke` đầy đủ đạt; ảnh chụp ở 3 kích thước; `draw()` ≈ 29 ms ở canvas 1382×904 (bản cũ ≈ 30 ms ở 960×960, Chrome headless không GPU).

## Giới hạn / việc tồn đọng
- Văn bản hướng dẫn trong `#guideModal` viết cứng; cần sửa tay khi luật đổi.
- Chưa có bảng thông tin cho quân/công trình/cờ đang chọn (thông tin vẫn ghi vào nhật ký khi nhấp).
- Thanh tiến độ trong bảng hàng đợi nhảy theo nhịp cập nhật HUD.
