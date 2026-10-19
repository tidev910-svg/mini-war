# Cài đặt & hiệu ứng mở menu

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-19

## Mô tả
Hộp **Cài đặt** cho người chơi chỉnh đồ hoạ, hiển thị và điều khiển. Mở từ menu ☰ trong trận ("Cài đặt") hoặc từ sảnh chính (nút "Cài đặt"). Có 4 tab: Đồ hoạ, Hiển thị, Âm thanh, Điều khiển.
- Mỗi thay đổi áp dụng ngay và **tự lưu trên trình duyệt** (`localStorage`). Dòng "Đã lưu" sáng lên mỗi lần đổi.
- Nút "Khôi phục mặc định" trả mọi giá trị về như ban đầu.
- Cài đặt chỉ là tuỳ chọn hiển thị/điều khiển, không đổi luật trận; riêng "Độ khó AI" đổi nhịp độ của đối thủ máy (chỉ chế độ Chơi với AI, không ảnh hưởng PvP).

Kèm theo là bộ **hiệu ứng mở/đóng** cho menu và hộp thoại, theo phong cách huy hiệu:
- **Menu ☰:** bung ra từ góc nút như dải cờ thả xuống, một vệt vàng chạy dọc mép trên, các mục trượt vào lần lượt, biểu tượng ☰ xoay 90°. Khi đóng thì cuộn ngược lên.
- **Hộp thoại** (Cài đặt, Hướng dẫn, xác nhận rời trận): nền tối dần và mờ (blur), khung trải ra từ giữa như cuộn giấy da, một vệt sáng đồng lướt qua một lần. Khi đóng thì cuộn lại.
- **Cài đặt:** bánh răng xoay vào; tab có gạch chân vàng trượt ra; trang tab trượt vào khi đổi tab; từng dòng xuất hiện lần lượt.
  - Nút chọn (segmented) có lớp nền đồng trượt tới lựa chọn.
  - Công tắc có núm trượt nảy nhẹ.
- **Bảng Huấn luyện/Xây dựng** chìm xuống khi đóng (mở đã có hiệu ứng trồi lên từ trước).
- **Sảnh chính:** tiêu đề trồi lên, các nút menu xuất hiện lần lượt.

## Luật & thông số
| Cài đặt (`settings.<khoá>`) | Lựa chọn (mặc định in đậm) | Tác dụng |
|---|---|---|
| `quality` — Chất lượng hình | Thấp / **Vừa** / Cao | Trần độ phân giải canvas `QUALITY_PIXELS` = 1 / 2,1 / 3,6 triệu điểm ảnh và tối đa `QUALITY_MAX_SCALE` điểm ảnh canvas cho mỗi điểm ảnh CSS (Thấp = 0,75: luôn vẽ dưới độ phân giải màn hình). "Thấp" còn bỏ đốm chi tiết mặt đất (`drawTerrainDetail()`). Đổi là gọi lại `syncWorldMetrics()` |
| `reduceMotion` — Hiệu ứng chuyển động | **Đầy đủ** / Giảm | "Giảm" thêm class `reduce-motion` trên `<html>`: tắt mọi animation/transition; đóng bảng không chờ hiệu ứng. Hệ điều hành bật giảm chuyển động (`prefers-reduced-motion`) cũng có tác dụng tương tự |
| `hpBars` — Thanh máu quân | **Luôn hiện** / Khi bị thương / Khi chọn | Lọc trong vòng vẽ thanh máu của `draw()`; thanh máu pháo đài/công trình không đổi |
| `mapLabels` — Nhãn mỏ và công trình | **Bật** / tắt | Nhãn mỏ (`draw()`), tên công trình và "SÂN TẬP KẾT" (`render/buildings.ts`); nhãn pháo đài và cột cờ luôn hiện |
| `unitPaths` — Đường đi của quân đang chọn | **Bật** / tắt | Gọi hay không `drawUnitPaths()` |
| `territory` — Ranh giới vùng | **Bật** / tắt | Đồng bộ hai chiều với phím T và nút bản đồ (`setShowTerritory()` ghi lại cài đặt) |
| `uiScale` — Cỡ giao diện | 90% / **100%** / 115% | Biến CSS `--ui-scale` → `zoom` của các khối trong `.hud-layer` |
| `scrollSpeed` — Tốc độ cuộn bản đồ | Chậm 0,6 / **Vừa 1** / Nhanh 1,6 | Nhân bước cuộn của phím mũi tên trong `ui/hotkeys.ts` |
| `noticeSeconds` — Thông báo tự ẩn sau | 3 / **5** / 10 giây | Thời gian dải thông báo mờ đi (`showNotice()`, `ui/panels.ts`) |
| `aiDifficulty` — Độ khó AI | Dễ / **Thường** / Khó | Nhịp ra quân và các đợt tấn công của AI (`AI_DIFFICULTY`, [ai-opponent.md](ai-opponent.md)); cũng chọn được ở sảnh (`#aiDifficulty`). Chỉ ảnh hưởng chế độ Chơi với AI |
| `muted` — Tắt tiếng | **tắt** / bật | Tắt mọi âm thanh; phím M ([audio.md](audio.md)) |
| `musicVolume`, `ambienceVolume` — Nhạc nền / Tiếng môi trường | 0–100%, **50 / 50%** | Thanh trượt bước 5%, không có tiếng thử ([audio.md](audio.md)) |
| `masterVolume`, `sfxVolume`, `uiVolume` — Âm lượng tổng / trận đánh / giao diện & sự kiện | 0–100%, **80 / 80 / 70%** | Thanh trượt bước 5%; thả tay phát thử một tiếng của nhóm đó |

Thời lượng hiệu ứng: menu mở 0,26 giây, đóng 0,16 giây; hộp thoại mở 0,38 giây, đóng 0,22 giây; các mục trễ nhau 40–70 ms.

## Code liên quan
- [src/core/settings.ts](../../src/core/settings.ts):
  - `DEFAULT_SETTINGS`, `settings` (đọc trực tiếp ở mọi nơi), `setSetting()` (lưu và báo cho người nghe), `onSettingChange()`, `resetSettings()`.
  - `QUALITY_PIXELS`, `QUALITY_MAX_SCALE`.
  - Khoá lưu: `miniwar.settings`; dữ liệu hỏng thì dùng mặc định.
- [src/ui/settings.ts](../../src/ui/settings.ts):
  - `SETTINGS_SCHEMA` (tab, nhãn, gợi ý, lựa chọn; giao diện dựng từ bảng này).
  - `openSettings()`, `apply()` (class `reduce-motion`, `--ui-scale`, `syncWorldMetrics()`, `setShowTerritory()`).
- [src/ui/panels.ts](../../src/ui/panels.ts):
  - `showAnimated()` / `hideAnimated()`: `hidden` đổi ngay, class `.closing` giữ phần tử hiện thêm trong lúc chạy hiệu ứng đóng. CSS: `[hidden]:not(.closing)`.
  - `openPanel('settings')`, `closeMenu()`, `toggleMenu()` dùng hai hàm này.
- Đọc cài đặt khi vẽ:
  - `maxCanvasPixels()` ([src/core/view.ts](../../src/core/view.ts)).
  - `draw()`, `render/buildings.ts`, `drawTerrainDetail()`.
- Giao diện:
  - `#settingsModal` (`#settingsTabs`, `#settingsBody`, `#settingsReset`, `#settingsSaved`), `#openSettings` trong `#gameMenu`, `#lobbySettings` ở sảnh, biểu tượng `#i-gear` trong [index.html](../../index.html).
  - Mục "Motion" và "Settings dialog" trong [src/style.css](../../src/style.css): `.segmented`, `.switch`, `@keyframes menuOpen/scrollOpen/glint/...`.

## Tương tác
- [hud-ui.md](hud-ui.md): menu ☰, hộp thoại, sảnh chính.
- [rendering.md](rendering.md): độ phân giải canvas, thanh máu, nhãn, đường đi.
- [controls.md](controls.md): tốc độ cuộn, phím T, Esc đóng hộp Cài đặt.
- [territory.md](territory.md): lớp ranh giới.

## Multiplayer
Không áp dụng cho dữ liệu trận: cài đặt nằm trong trình duyệt của từng người, không gửi qua mạng. Chủ phòng và khách có thể chọn khác nhau.

## Kiểm thử thủ công
- [ ] Menu ☰: bung ra, các mục trượt vào lần lượt, biểu tượng xoay; đóng thì cuộn lại.
- [ ] Mở Cài đặt từ menu và từ sảnh; Esc hoặc bấm ra ngoài để đóng (có hiệu ứng cuộn lại).
- [ ] Đổi từng cài đặt, thấy tác dụng ngay; tải lại trang (F5) vẫn giữ.
- [ ] "Hiệu ứng chuyển động: Giảm" → menu và hộp thoại mở/đóng tức thì.
- [ ] Phím T và công tắc "Ranh giới vùng" luôn khớp nhau.
- Đã chạy thử 2026-10-18 (Chrome headless 1366×768):
  - Mở từ sảnh và từ menu đều được.
  - "Thấp" giảm độ phân giải canvas; giá trị lưu trong `localStorage`; cỡ giao diện 115% đặt `--ui-scale`.
  - Công tắc ranh giới và phím T đồng bộ; "Khôi phục mặc định" đưa về mặc định.
  - `pnpm smoke` nhóm `ui` có kiểm tra Cài đặt.

## Giới hạn / việc tồn đọng
- `zoom` (cỡ giao diện) cần trình duyệt hỗ trợ thuộc tính CSS `zoom` (Chrome, Edge, Safari, Firefox ≥ 126); trình duyệt cũ hơn thì giữ 100%.
- Chưa đổi được phím tắt.
