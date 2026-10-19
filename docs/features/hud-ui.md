# HUD & giao diện

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-19

## Mô tả
Giao diện theo phong cách **huy hiệu & cờ hiệu**, tông màu "sắt & máu": bản đồ phủ toàn màn hình, các bảng nổi có hình khiên và dải cờ đuôi én. **Màu phe** là điểm nhấn chính. Vàng đồng chỉ dùng làm viền cho thành phần quan trọng. Hình khối vẽ bằng CSS/SVG (bộ icon đơn sắc nét viền trong `index.html`), không thêm ảnh bitmap. Toàn bộ chữ tiếng Việt.

```
[⛨] QUÂN XANH▶ ⏱03:12 (Chơi với AI)      ▼🌾 ▼🪵 ▼🪨 ▼🪙 ▼🚩   ← panel người chơi · dải cờ tài nguyên
    ⛉ 6 · Giai đoạn mở rộng                              (☰)(🗺)(⛶) ← cột nút (menu gộp)
    👁0 🗡2 🏹1 ⟋0 ∩0
[Hàng đợi]                 BẢN ĐỒ                [bảng Huấn luyện / Xây dựng]
[minimap]       ◀ thông báo mới nhất (tự mờ) 📜 ▶      ⛨Huấn luyện ⛨Xây dựng ⛨Tấn công
```

## Luật & thông số
**Design tokens** (một nơi duy nhất): [src/config/theme.ts](../../src/config/theme.ts).
- `THEME` chứa màu nền/bề mặt, kim loại, chữ, trạng thái, font, cỡ chữ `--fs-*`, khoảng cách `--sp-*`, độ bo và độ dày viền `--border-1/2/3`.
- `TEAM_COLORS` chứa màu từng phe (primary/light/dark + tên phe).
- `MAP_UI` chứa thông số lớp phủ trên bản đồ: chữ tối thiểu 12px, thanh máu 6px, độ mượt đường biên, độ nhiễu sương mù.
- [src/ui/theme.ts](../../src/ui/theme.ts) ghi mọi token lên `:root` thành biến CSS (`--ui-bg-panel`, `--gold`…). `setFactionTheme(team)` trỏ `--faction-primary/light/dark` về màu của phe đó. `updateHUD()` và `setGameModeLabel()` gọi hàm này theo `localTeam()`.
- Đổi màu một phe hoặc thêm phe chỉ cần sửa `TEAM_COLORS`.
- `src/style.css` không chứa mã màu nào, chỉ dùng `var(--…)`.
- Canvas (nhãn, thanh máu, đường biên, sương mù, minimap) đọc cùng giá trị từ `config/theme.ts`.

Bảng màu **"sắt & máu"** (đổi ngày 2026-10-18, thay cho tông xanh navy): nền da thuộc nâu sẫm và màu than lò rèn, kim loại đồng thau, chữ màu giấy da, điểm nhấn đỏ máu. Màu hai phe vẫn là xanh/đỏ để phân biệt quân.

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--ui-bg-panel` / `-glass` / `-soft` / `-deep` | #241A15 / 93% / #35271F / #17100C | Panel chính, panel nổi, ô tài nguyên, ô nhập |
| `--ui-fog` | #0E0A08 | Sương mù và nền ngoài bản đồ, tối hơn mọi panel |
| `--ui-ember` | #5C1D12 | Quầng lửa than đỏ trên nền sảnh chính |
| `--faction-*` | Xanh #2F5DB8/#6F95E0/#1A3570 · Đỏ #B03030/#E07070/#6E1818 | Khiên, dải cờ, nền nút |
| `--gold` / `--gold-muted` | #D29A45 / #8A6236 | Viền đồng thau cấp 1–2 / viền cấp 3 |
| `--text-main` / `--text-sub` | #F6EAD6 / #D8C5AA | Chữ chính / chữ phụ (tương phản trên `--ui-bg-panel` ≈ 14:1 / 10:1) |
| `--danger` / `--success` / `--resource` / `--warning` | #C9372A / #5FA84E / #E9B949 / #E0882E | Tấn công, thiếu, máu thấp / hoàn thành / tài nguyên / cảnh báo |

**Phân cấp viền:**
- **Cấp 1:** 3 nút khiên lệnh chính, viền `--gold` 3px.
- **Cấp 2:** panel người chơi, modal và màn chọn chế độ, viền `--gold` 2px.
- **Cấp 3:** mọi thứ khác, viền `--gold-muted` 1px.

**Chữ:**
- Tiêu đề và tên phe dùng font có chân `--font-title` (Palatino Linotype / Book Antiqua / Noto Serif / Times New Roman). Các font này đủ dấu tiếng Việt và không phải tải về.
- Số liệu và chữ phụ dùng `--font-ui` (system-ui).
- Chữ trên HUD tối thiểu 12px. Số tài nguyên 18px.

**Vùng giao diện** (markup trong [index.html](../../index.html), tất cả nằm trong `.hud-layer` phủ trên `#game`):
| Vùng | Phần tử | Nội dung |
|---|---|---|
| Panel người chơi (trên trái, cấp 2) | `#crest`, `#sideName`, `#time`, `#modeStatus`, `#unitCount`, `#phaseHint`, `#unitBreakdown` | Khiên màu phe có icon lâu đài (class `red` cho phe đỏ); dải cờ tên phe "QUÂN XANH/ĐỎ"; đồng hồ `mm:ss`; thẻ nhỏ chế độ ("Chơi với AI · Offline", "Solo với bạn bè · Chủ phòng/Khách"); tổng quân gồm hàng chờ; giai đoạn ("phát triển kinh tế" < 5 phút, "mở rộng" < 10 phút, "giao tranh"); hàng icon + số cho từng loại quân (`armyRow()`: trinh sát 👁, lính 🗡, cung 🏹, giáo, kỵ binh, quân chờ ⏳), mỗi icon có tooltip |
| Dải cờ tài nguyên (trên phải, cấp 3) | `#resFood` `#resWood` `#resStone` `#resGold` (`data-res`), `#food`… `#foodRate`…; `#resTerritory` > `#territory`, `#territoryIncome` | Mỗi ô là dải cờ treo có đáy đuôi én. Hiện số lượng và tốc độ "+N/phút". Riêng lúa hiện đủ **thu nhập gộp − tiêu hao quân đội = ròng** ("+50 −12 = +38/phút", theo mục 7.8 của tài liệu "Cơ chế sinh tài nguyên lãnh thổ"). Class `supply-warn` khi ròng âm, `supply-bad` khi thiếu ("Thiếu lúa · Ns" / "Thiếu tiếp tế" thay cho dòng số). Tooltip ghi nguồn của từng khoản. Icon khác nhau cả về hình: bông lúa, khúc gỗ, tảng đá góc cạnh, thỏi vàng, lá cờ. Ô cờ: "N vùng" + "N mỏ đang khai thác" / "Chưa có mỏ"; tooltip giải thích công dụng của vùng/mỏ và thu nhập theo loại |
| Cột nút + menu (phải, cấp 3) | `#menuBtn` > `#gameMenu` (`#pause`, `#openGuide`, `#openSettings`, `#toggleSideHud`, `#leaveMatch`); `#toggleTerritory`, `#fullscreen` | Nút tròn icon đơn sắc, đều có tooltip. Menu ☰ (bung ra có hiệu ứng, xem [settings.md](settings.md)) gộp: Tạm dừng/Tiếp tục (F10, `setPauseButton()`), Hướng dẫn (phím ?), **Cài đặt**, Ẩn/Hiện giao diện (class `panel-collapsed` trên `#gameApp`; cột nút vẫn hiện), **Rời trận** (hộp xác nhận `#confirmModal` → `leaveMatch()`). Menu đóng khi chọn một mục, bấm ra ngoài hoặc Esc. Ranh giới (class `placing` khi đang ẩn) và toàn màn hình là nút riêng |
| Hàng đợi (trái) | `.queue-panel` > `#trainQueue` | `updateTrainQueueHUD()`: các quân đang huấn luyện song song (mỗi quân một thanh `--success` + giây còn lại), quân chờ ("chờ n/4"), hàng đợi đang mở thêm, công trình đang xây ("Đang xây …", hoặc "cần quân đứng cạnh" khi tiền đồn chưa có thợ), nông trại đang nâng cấp (thanh `--resource`). Ẩn khi trống |
| Minimap (dưới trái, cấp 3) | `#minimap` + 4 `.corner` | Khung có góc trang trí kiểu huy hiệu. Xem [minimap.md](minimap.md) |
| Thông báo (dưới giữa, cấp 3) | `#chatStrip` > `#feed`, `#chatToggle` | Dải cờ ngang rộng tối đa 40% màn hình (≤ 560px), nằm giữa, ngang hàng cụm nút lệnh. `addLog(msg, tone)` thêm dòng lên đầu, giữ 12 dòng. Dòng mới nhất hiện rồi **tự mờ sau 5 giây** (class `idle`, `NOTICE_SECONDS`). Nút 📜 / bấm vào dòng mở **lịch sử** (class `open`). Dòng `tone='danger'` hiện chữ đỏ, banner viền `--danger` (class `alert`) |
| Nút lệnh chính (dưới phải, cấp 1) | `.dock-slot` > `#openTrain`, `#openBuild`, `#attack` | Khiên huy hiệu viền `--gold` 3px. Huấn luyện và Xây dựng nền `--faction-primary`, Tấn công nền `--danger`. Nhãn nằm trên dải băng vắt ngang đáy khiên; phím tắt ở góc (H, B, A). Rê chuột: sáng lên; nhấn: thu về 0,96; bị khoá: mờ + xám, tooltip nêu lý do ("Trận đấu đang tạm dừng" / "đã kết thúc", `data-why` trên `.dock-slot`). Nút đang mở bảng có class `active` |

**Bảng thông tin** (`#selInfo`, góc phải dưới, trên 3 nút khiên): máu, sát thương, khắc chế, lệnh, tiến độ xây/nâng cấp/chiếm cờ của thứ đang chọn — xem [selection-info.md](selection-info.md).

**Thanh quân** (`#unitBar`, giữa phía dưới, trên dải thông báo): chỉ hiện khi đang chọn quân; mỗi loại trong nhóm một ô (biểu tượng, số lượng, phím 1–5), ô đang chọn viền `--gold` nền `--faction-dark`. Xem [controls.md](controls.md) (Unit Control V1.0).

**Tooltip** (`src/ui/panels.ts`): một khung `#tooltip` dùng chung cho mọi phần tử có `data-tip`. Khung hiện dưới phần tử, hoặc bên trái nếu có `data-tip-side="left"`, và tự lật để không tràn màn hình. `refreshTooltip()` (gọi từ `updateHUD()`) cập nhật số liệu khi đang rê chuột. Thiết bị cảm ứng không hiện tooltip.

**Cảnh báo:**
- Thiếu tài nguyên: `notifyShortfall(team, cost)` trong `src/core/game.ts` phát sự kiện `resource-shortfall` khi người chơi của máy này mua/xây mà không đủ. Ô tài nguyên thiếu có viền và nền đỏ khoảng 0,5 giây (class `short`).
- Pháo đài mất máu: `updateHUD()` ghi "Pháo đài đang bị tấn công!" (tone `danger`), tối đa một lần mỗi `HOME_ALERT_SECONDS` = 15 giây. Chỉ là hiển thị, chạy cả trên máy khách.
- Các dòng `tone='danger'` khác: công trình bị phá, mất vùng, kho lúa cạn, quân thiếu tiếp tế.

**Bảng trượt** (`src/ui/panels.ts`; mỗi lúc chỉ mở một bảng; `openPanel()`, `closePanels()`, `togglePanel()`):
- `#trainDrawer`: 5 thẻ quân (`#scout`, `#infantry`, `#archer`, `#spearman`, `#cavalry`) và thanh **Hàng đợi** (`#laneBar`, `updateLaneBar()`): số hàng đợi (`#laneCount`), các ô (xanh = đang luyện, nét đứt = đang mở), nút `#buyLane` "Mở hàng đợi thứ N" với giá + thời gian (`#laneCost`, chữ đỏ khi thiếu), thanh tiến độ khi đang mở ([units.md](units.md)).
  - Mỗi thẻ có ảnh chân dung vẽ từ khung đứng yên đầu tiên của spritesheet theo màu phe (`drawPortraits()`), tên, giá + thời gian huấn luyện + lúa nuôi, số quân đang có.
  - Thẻ có class `cant` (giá chữ đỏ) khi thiếu tài nguyên; tooltip là lý do từ `buyProblem()`.
  - Bấm thẻ gọi `requestBuy()`; bảng vẫn mở để mua tiếp.
- `#buildDrawer`: `#farm`, `#buildTower`, `#upgradeOutpost`, `#upgradeFarm`, `#turret`. Bấm công trình cần đặt thì đóng bảng rồi gọi `beginPlacement()`.
- `#guideModal`: hướng dẫn và chú thích màu `.legend` (`.dot.blue/.red`, đổi chữ theo phe trong `setGameModeLabel()`).
- `#confirmModal`: hộp xác nhận chung, `confirmAction(title, text, yesLabel, onYes)`. Khi hộp mở, mọi phím tắt trừ Esc bị bỏ qua.
- Cách đóng bảng: nút ✕ (`[data-close]`), Esc, bấm xuống bản đồ (bảng huấn luyện/xây dựng), bấm ra ngoài modal.

**Bố cục theo kích thước màn hình:**
- ≤ 1400px: dải cờ tài nguyên hẹp hơn.
- ≤ 1100px: dải cờ xuống dưới panel người chơi, minimap sang phải, thông báo nằm trên cụm nút.
- ≤ 560px: khiên nhỏ hơn, ẩn dòng phụ, bảng trượt rộng hết màn hình.

**Sảnh chính** (`#modeScreen`, lớp trên cùng khi chưa vào trận):
- Nền tối có quầng lửa than đỏ (`--ui-ember`) và hai quầng khói trôi chậm (`.mist`). Hai lá cờ phe treo hai bên (`.lobby-banner.team0/.team1`): xanh có icon lâu đài, đỏ có icon kiếm; cờ đung đưa nhẹ, ẩn khi màn ≤ 820px. Khi trình duyệt bật giảm chuyển động (`prefers-reduced-motion`) thì không có hiệu ứng.
- Khung giữa viền `--gold` 2px: khiên lớn màu phe kèm tiêu đề "MINI WAR" và dòng giới thiệu.
- Menu dải cờ đuôi én (`.lobby-btn`):
  - **Chơi với AI** (`#modeAI`, nổi bật màu phe, phím **Enter**)
  - **Cài đặt** (`#lobbySettings` → `#settingsModal`, [settings.md](settings.md))
  - **Solo với bạn bè** (`#modeFriends` → `#friendPanel`)
  - **Hướng dẫn & phím tắt** (`#lobbyGuide` → `#guideModal`; Esc để đóng)
  - **Toàn màn hình** (`#lobbyFullscreen`)
- Rê chuột hoặc dùng Tab vào một nút: nút sáng lên và lùi sang phải 4px.
- Chân trang: "Quân xanh đấu Quân đỏ".
- `#guideModal`, `#confirmModal` và `#tooltip` nằm ngoài `#gameApp`, dùng `position:fixed` với z-index 1100/1200, nên hiện được trên cả sảnh.
- Toàn màn hình áp dụng cho cả trang (`document.documentElement`), nên sảnh và hộp thoại vẫn thấy được ở chế độ toàn màn hình.

**Nạp CSS không bị chớp trang trần:**
- `src/style.css` là `<link rel="stylesheet">` trong `<head>`, đặt trước script game. Trước đây CSS được `import` trong `main.ts`, nên ở chế độ dev chỉ áp dụng sau khi mọi module JS tải xong; trong lúc đó trang hiện HTML không có kiểu.
- Plugin trong `vite.config.ts` chèn sẵn mọi biến token vào `<style id="theme-tokens">` của HTML. Nhờ vậy lần vẽ đầu đã đủ màu, kể cả khi JavaScript chưa chạy. `ui/theme.ts` ghi lại các biến đó lúc chạy và đổi `--faction-*` theo phe.

**Canvas** (`syncWorldMetrics()` trong `src/core/view.ts`): phủ toàn `#gameApp`. Độ phân giải nền = kích thước CSS × `devicePixelRatio`, nhưng không quá `maxCanvasPixels()` (theo cài đặt chất lượng: 1 / 2,1 / 3,6 triệu điểm ảnh; xem [settings.md](settings.md)).

**Camera đầu trận** (`centerCameraOnHome()`): pháo đài của mình nằm giữa phần màn hình không bị HUD che. `hudInsets()` đo phần bị panel người chơi che ở trên và cụm nút lệnh che ở dưới.

## Code liên quan
- [src/config/theme.ts](../../src/config/theme.ts): `THEME`, `TEAM_COLORS`, `MAP_UI`, `hexRgb()`, `hexA()`, `healthColor()`.
- [src/ui/theme.ts](../../src/ui/theme.ts): ghi token lên `:root`, `setFactionTheme()`.
- [vite.config.ts](../../vite.config.ts): chèn token vào `<head>`.
- [index.html](../../index.html): markup, sảnh chính, bộ icon `<symbol id="i-…">`, hình khiên `#shield` (lưu ý `<title>` chứa "Mini War", vì `scripts/start-game.bat` dò server bằng chuỗi này).
- [src/style.css](../../src/style.css): toàn bộ giao diện, chỉ dùng biến.
- [src/ui/hud.ts](../../src/ui/hud.ts): `updateHUD()`, `updateMatchClockHUD()`, `updateTrainQueueHUD()`, `setPauseButton()`, `setShowTerritory()`, `setSidebarCollapsed()`, `setText()`, cảnh báo pháo đài, nháy ô thiếu.
- [src/ui/panels.ts](../../src/ui/panels.ts): `openPanel()`, `closePanels()`, `togglePanel()`, `openPanelName`, `updateUnitCards()`, `drawPortraits()`, thông báo tự mờ, `closeMenu()`, `toggleMenu()`, `menuOpen()`, `confirmAction()`, `refreshTooltip()`, `hideTooltip()`. Phím tắt: [controls.md](controls.md).
- [src/ui/modeScreen.ts](../../src/ui/modeScreen.ts): `setGameModeLabel()`, `leaveMatch()`, `showModeScreen()`, `showFriendPanel()`. Nút sảnh và toàn màn hình (`toggleFullscreen()`) gán trong [src/ui/input.ts](../../src/ui/input.ts); Enter/Esc ở sảnh trong `src/ui/hotkeys.ts`.
- [src/ui/input.ts](../../src/ui/input.ts): gán nút (giá, `requestBuy()`, `beginPlacement()`, `#pause`, `#fullscreen`, `#overlayRestart`).
- [src/core/game.ts](../../src/core/game.ts): `addLog()`, `notifyShortfall()`. [src/core/view.ts](../../src/core/view.ts): `syncWorldMetrics()`, `maxCanvasPixels()`, `hudInsets()`, `centerCameraOnHome()`.

## Tương tác
- [minimap.md](minimap.md), [rendering.md](rendering.md) (nhãn, thanh máu, đường biên, sương mù), [controls.md](controls.md), [units.md](units.md), [buildings.md](buildings.md), [match-flow.md](match-flow.md), [multiplayer.md](multiplayer.md).

## Multiplayer
HUD luôn hiển thị theo `localTeam()`. Khách có `--faction-*` đỏ, nên khiên, dải cờ, nút và thẻ đều đỏ; thấy "QUÂN ĐỎ", chân dung quân đỏ, tài nguyên và hàng đợi phe đỏ (qua snapshot). Thẻ quân của khách vẫn gửi `requestBuy()` để host kiểm tra; trước khi gửi, khách tự kiểm tra và nháy ô thiếu. Rời trận khi đang PvP sẽ ngắt kết nối (`destroyPeer()`) mà không báo "mất kết nối".

## Kiểm thử thủ công
- [ ] Rê chuột lên ô tài nguyên: thấy chi tiết thu/chi; mọi nút chỉ có icon đều có tooltip.
- [ ] Mua quân khi thiếu lúa: ô lúa nháy đỏ.
- [ ] Menu ☰: Tạm dừng / Hướng dẫn / Ẩn giao diện / Rời trận (hỏi xác nhận; "Ở lại" giữ trận).
- [ ] Thông báo mờ sau 5 giây; 📜 mở lịch sử; "Pháo đài đang bị tấn công!" có viền đỏ.
- [ ] H / B / Esc, thẻ quân, đặt công trình như trước.
- [ ] 1366×768 và 1920×1080: các khối không đè nhau.
- [ ] PvP: máy khách toàn bộ HUD màu đỏ.
- [ ] Sảnh: Enter vào trận AI; Hướng dẫn mở trên sảnh, Esc đóng; Solo với bạn bè → Quay lại sảnh chính; tải lại trang (F5) không thấy chớp HTML trần.
- Đã chạy thử 2026-10-18:
  - `pnpm smoke` đầy đủ đạt. Nhóm `ui` kiểm tra tooltip, menu, nháy ô thiếu, viền cảnh báo, xác nhận rời trận, chữ ≥ 12px, các khối không đè nhau.
  - Nhóm `pvp` kiểm tra `--faction-primary` đỏ ở máy khách.
  - Nhóm `boot` kiểm tra token và CSS có sẵn trong HTML trước script, hướng dẫn mở trên sảnh, Esc đóng, Enter vào trận. Đã chụp sảnh khi tắt JavaScript: vẫn đủ màu và khung.
  - Đã xem ảnh chụp ở 1366×768 và 1920×1080. `draw()` ≈ 25–29 ms (Chrome headless không GPU).

## Giới hạn / việc tồn đọng
- Văn bản hướng dẫn trong `#guideModal` viết cứng; cần sửa tay khi luật đổi.
- Thanh tiến độ trong bảng hàng đợi nhảy theo nhịp cập nhật HUD.
- Với phe Đỏ, nền khiên Huấn luyện/Xây dựng (`--faction-primary` #B03030) gần màu nút Tấn công (`--danger` #D94A3A); nút Tấn công chỉ khác nhờ dải băng tối hơn và icon.
- Biểu tượng trong hàng đợi và thẻ xây dựng vẫn là emoji (chưa thay bằng icon SVG).
- Sảnh chưa có mục Cài đặt (âm lượng, đồ hoạ) vì game chưa có các tuỳ chọn đó.
