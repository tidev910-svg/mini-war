# Bản đồ thu nhỏ (minimap)

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-22

## Mô tả
Khung vuông viền `--gold-muted` có 4 góc trang trí kiểu huy hiệu, nằm ở góc trái dưới màn hình (màn hẹp: góc phải, dưới thanh tài nguyên). Khung cho thấy toàn bộ bản đồ 256 × 256 ô: địa hình, màu vùng theo phe, mỏ, cầu và cột cờ đã khám phá, công trình, pháo đài, quân, và khung nhìn của camera. Đồ của mình vẽ bằng màu phe, địch đang thấy vẽ bằng `--danger`. Nhấp hoặc kéo trên minimap để đưa camera tới đó. Minimap tôn trọng sương mù của phe mình.

## Luật & thông số
| Thông số | Giá trị | Nguồn trong code |
|---|---|---|
| Kích thước | Canvas 200 × 200 điểm ảnh, hiển thị 180 px (130 px khi màn ≤ 1100 px, 104 px khi ≤ 560 px) | `#minimap` trong `index.html`, CSS `#minimap` |
| Nền địa hình | `terrainCanvas` thu về 256 × 256, dựng một lần (địa hình không đổi) | `drawMinimap()` |
| Chưa khám phá | Màu sương mù đục `FOG_RGB` (= `--ui-fog`) | `buildLayer()` |
| Đã khám phá, không đang thấy | Sương mờ `FOG_MEMORY_ALPHA` (vùng có chủ: màu phe đậm hơn) | `buildLayer()`, `fogVisible` |
| Màu vùng có chủ | Màu sáng của phe chủ vùng (`TEAM_COLORS[team].light`), alpha `MINIMAP_TINT_ALPHA` = 70 | `TINT` |
| Lớp vùng + sương mù | Dựng lại tối đa `MINIMAP_LAYER_HZ` = 4 lần/giây | `drawMinimap()` |
| Cột cờ | Lá cờ nhỏ màu sáng của phe chủ (kem `--text-main` nếu trung lập), chỉ ở chỗ đã khám phá | `drawMinimap()` |
| Mỏ | Ký hiệu theo hình: lúa ●, gỗ ▲, đá ■, vàng ◆ (`MINE_MARK`, `MINE_COLOR`), chỉ ở chỗ đã khám phá | `mark()` |
| Cầu | Thanh gỗ `--gold-muted` viền tối vắt qua sông, chỉ khi đã khám phá. Các vạch cam ở bản trước là cầu vẽ cả trong vùng chưa khám phá, nên làm lộ bản đồ | `drawMinimap()` |
| Công trình | Ô 5 px: của mình màu phe, của địch `--danger` khi đang thấy | `drawMinimap()` |
| Pháo đài | Ô vuông 10 px viền `--gold`: của mình `--faction-primary`, của địch `--danger` (chỉ khi chỗ đó đã khám phá) | `drawMinimap()` |
| Quân | Chấm 3 px: của mình màu sáng của phe, địch `--danger` và chỉ khi đang nhìn thấy (`teamCanSee()`) | `drawMinimap()` |
| Khung camera | Viền `--text-main` = vùng `VIEW_W/zoom × VIEW_H/zoom` từ `camX, camY` (cả bản đồ khi đã thu nhỏ hết) | `drawMinimap()` |

Thao tác: nhấn chuột trái (hoặc chạm) rồi kéo trên minimap → tâm camera đi theo điểm dưới con trỏ (`setCamX()`, `setCamY()`, `clampCamera()`). Chỉ là camera cục bộ, không gửi gì cho host.

## Code liên quan
- [src/render/minimap.ts](../../src/render/minimap.ts): `drawMinimap()` (gọi cuối `draw()`), `buildLayer()`, `buildTerrainSmall()`, `minimapToWorld()`, `minimapCanvas`, `mark()`; hằng số `MINIMAP_LAYER_HZ`, `MINIMAP_TINT_ALPHA`, `TINT`, `MINE_MARK`, `MINE_COLOR`. Màu từ [src/config/theme.ts](../../src/config/theme.ts).
- [src/ui/input.ts](../../src/ui/input.ts): `centerCameraOnMinimap()`, sự kiện `pointerdown/pointermove/pointerup` trên `#minimap`.
- Dùng lại: `terrainCanvas` ([src/map/terrain.ts](../../src/map/terrain.ts)), `regionMap` ([src/map/regions.ts](../../src/map/regions.ts)), `fogVisible` ([src/render/fog.ts](../../src/render/fog.ts), do `refreshFog()` tính cho `localTeam()`), `isTeamAreaExplored()`, `teamCanSee()` ([src/sim/fog.ts](../../src/sim/fog.ts)).
- Giao diện: `.minimap-frame`, `.corner`, `#minimap` trong [index.html](../../index.html) và [src/style.css](../../src/style.css).

## Tương tác
- [neutral-camps.md](neutral-camps.md): hang phe mình biết hiện bằng hình thoi cam (đã dọn: xám), Lăng cổ to hơn và hiện cho cả hai phe khi đã mở.
- [fog-of-war.md](fog-of-war.md): cùng quy tắc đã khám phá / đang nhìn thấy.
- [territory.md](territory.md): màu vùng, cờ.
- [controls.md](controls.md): di chuyển camera.
- [hud-ui.md](hud-ui.md): vị trí trong bố cục.

## Multiplayer
Không áp dụng cho dữ liệu trận: minimap chỉ đọc `state` (đã có từ snapshot ở khách) và sương mù cục bộ của trình duyệt. Khách thấy theo phe đỏ.

## Kiểm thử thủ công
- [ ] Đầu trận: chỉ quanh pháo đài sáng, phần còn lại đục; khung camera bao quanh pháo đài.
- [ ] Đưa quân đi xa → vùng sáng trên minimap mở rộng; quân rời đi → chỗ đó mờ đi.
- [ ] Chiếm cờ → vùng đổi màu phe trên minimap.
- [ ] Nhấp giữa minimap → camera về giữa bản đồ; kéo → camera đi theo.
- [ ] Quân địch ngoài tầm nhìn không hiện trên minimap; quân địch đang thấy là chấm đỏ.
- [ ] Mỏ và cầu chỉ hiện ở chỗ đã khám phá.
- Đã chạy thử 2026-10-18: `pnpm smoke ui` — nhấp giữa minimap đưa tâm camera về (4800, 4800) ± 60, kéo tới (¼, ¾) camera đi theo; không lỗi JavaScript.

## Giới hạn / việc tồn đọng
- Chưa có ping/đánh dấu trên minimap.
- Minimap vẽ lại mỗi frame (lớp vùng 4 lần/giây); trên máy yếu có thể giảm nhịp nếu cần.
