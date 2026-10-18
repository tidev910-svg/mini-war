# Bản đồ thu nhỏ (minimap)

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-18

## Mô tả
Khung vuông ở góc trái dưới màn hình (trên điện thoại: góc phải, dưới thanh tài nguyên) cho thấy toàn bộ bản đồ 256 × 256 ô: địa hình, màu vùng theo phe, cột cờ, pháo đài, quân, và khung nhìn hiện tại của camera. Nhấp hoặc kéo trên minimap để đưa camera tới đó. Minimap tôn trọng sương mù của phe mình.

## Luật & thông số
| Thông số | Giá trị | Nguồn trong code |
|---|---|---|
| Kích thước | Canvas 200 × 200 điểm ảnh, hiển thị 180 px (130 px khi màn ≤ 900 px, 104 px khi ≤ 560 px) | `#minimap` trong `index.html`, CSS `#minimap` |
| Nền địa hình | `terrainCanvas` thu về 256 × 256, dựng một lần (địa hình không đổi) | `drawMinimap()` |
| Chưa khám phá | Màu sương mù đục `FOG_RGB` | `buildLayer()` |
| Đã khám phá, không đang thấy | Sương mờ `FOG_MEMORY_ALPHA` (vùng có chủ: màu phe đậm hơn) | `buildLayer()`, `fogVisible` |
| Màu vùng có chủ | Xanh (74, 170, 255) / đỏ (255, 98, 107), alpha `MINIMAP_TINT_ALPHA` = 70 | `MINIMAP_COLORS` |
| Lớp vùng + sương mù | Dựng lại tối đa `MINIMAP_LAYER_HZ` = 4 lần/giây | `drawMinimap()` |
| Cột cờ | Chấm tròn bán kính 3 màu chủ (kem nếu trung lập), chỉ ở chỗ đã khám phá | `drawMinimap()` |
| Pháo đài | Ô vuông 10 px màu phe viền vàng; của địch chỉ hiện khi chỗ đó đã khám phá | `drawMinimap()` |
| Quân | Chấm 3 px; quân địch chỉ khi đang nhìn thấy (`teamCanSee()`) | `drawMinimap()` |
| Khung camera | Viền vàng = vùng `VIEW_W/zoom × VIEW_H/zoom` từ `camX, camY` (cả bản đồ khi đã thu nhỏ hết) | `drawMinimap()` |

Thao tác: nhấn chuột trái (hoặc chạm) rồi kéo trên minimap → tâm camera đi theo điểm dưới con trỏ (`setCamX()`, `setCamY()`, `clampCamera()`). Chỉ là camera cục bộ, không gửi gì cho host.

## Code liên quan
- [src/render/minimap.ts](../../src/render/minimap.ts): `drawMinimap()` (gọi cuối `draw()`), `buildLayer()`, `buildTerrainSmall()`, `minimapToWorld()`, `minimapCanvas`; hằng số `MINIMAP_LAYER_HZ`, `MINIMAP_TINT_ALPHA`, `MINIMAP_COLORS`.
- [src/ui/input.ts](../../src/ui/input.ts): `centerCameraOnMinimap()`, sự kiện `pointerdown/pointermove/pointerup` trên `#minimap`.
- Dùng lại: `terrainCanvas` ([src/map/terrain.ts](../../src/map/terrain.ts)), `regionMap` ([src/map/regions.ts](../../src/map/regions.ts)), `fogVisible` ([src/render/fog.ts](../../src/render/fog.ts), do `refreshFog()` tính cho `localTeam()`), `isTeamAreaExplored()`, `teamCanSee()` ([src/sim/fog.ts](../../src/sim/fog.ts)).
- Giao diện: `.minimap-frame`, `#minimap` trong [index.html](../../index.html) và [src/style.css](../../src/style.css).

## Tương tác
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
- [ ] Quân địch ngoài tầm nhìn không hiện trên minimap.
- Đã chạy thử 2026-10-18: `pnpm smoke ui` — nhấp giữa minimap đưa tâm camera về (4800, 4800) ± 60, kéo tới (¼, ¾) camera đi theo; không lỗi JavaScript.

## Giới hạn / việc tồn đọng
- Chưa có ping/đánh dấu trên minimap, chưa hiện mỏ.
- Minimap vẽ lại mỗi frame (lớp vùng 4 lần/giây); trên máy yếu có thể giảm nhịp nếu cần.
