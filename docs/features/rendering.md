# Bản đồ, địa hình & đồ hoạ

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Bản đồ vuông lớn, nhìn từ trên xuống, phong cách "Storybook": đồng cỏ, rừng, sông/hồ, đá, ruộng tài nguyên, đường đất. Cây và đá được vẽ như sprite đứng và sắp xếp theo chiều sâu cùng quân lính để quân có thể đi trước/sau cây.

## Luật & thông số
**Địa hình** (`buildTerrain()`, cố định — không ngẫu nhiên theo trận): lưới 256×256 = 65.536 ô, `terrainType` mã:
| Mã | Loại | Số ô | Đi qua/xây được |
|---:|---|---:|---|
| 0 | Đồng cỏ | phần còn lại | Có |
| 1 | Rừng | 13.107 (~20%) | Có (chỉ trang trí) |
| 2 | Nước (sông + 2 hồ) | 5.243 (~8%) | Không xuất quân / xây |
| 3 | Đá | 4.588 (~7%) | Không xuất quân / xây |
| 4 | Ruộng tài nguyên | 3.276 (~5%) | Có; là nơi đặt mỏ (`resourceTiles`) |

Vùng rừng/đá/tài nguyên lấy từ `forestRegions`, `rockRegions` và mảng `resources` trong `buildTerrain()` (toạ độ tỉ lệ 0–1).

**Lớp vẽ trong `draw()`** (theo thứ tự):
1. Nền tối `#0b1411`, rồi `terrainSmoothCanvas` (bản địa hình làm mờ 8 px + đốm màu) và 8% lớp `terrainCanvas` gốc.
2. `drawTerrainDetail()`, đường chính (bezier ngang ~y=0.55H, cắt theo khung bản đồ để không thò ra ngoài) và đường phụ phía trên.
3. Lớp lãnh thổ `drawTerritory()` (tô màu phe, ranh giới theo ô dày theo pixel màn hình; bật/tắt phím T), mỏ (nếu đã khám phá/đang thấy), vòng tầm pháo khi chọn pháo đài.
4. Danh sách `sceneActors` sắp theo Y: cây, đá, pháo đài (+ sân tập kết), cột cờ (`drawFlag()`, chỗ đã khám phá), công trình (`drawBuilding()`; công trình địch chỉ vẽ khi đang thấy), quái canh mỏ, quân.
5. Thanh máu quân, vòng chọn, đạn, hiệu ứng.
6. Sương mù `drawFog()` (một ảnh phủ toàn bản đồ, đục hoàn toàn ở vùng chưa khám phá, mép mềm), bản xem trước công trình đang đặt.
7. Lớp màn hình: khung chọn, thanh trạng thái đặt công trình, nhãn "CHIẾN TRƯỜNG 01".

**Sprite** (`public/assets/units/<quân>/`, đường dẫn `/assets/units/<quân>/...`; quy ước thư mục và tên: [assets.md](../assets.md)):
| Đối tượng | File | Ghi chú |
|---|---|---|
| Lính | `infantry-sheet.png` | 4 hàng: xanh idle, xanh walk, đỏ idle, đỏ walk; 4 khung |
| Trinh sát | `scout-sheet.png` | như trên; `scoutFootAnchors` canh chân theo khung |
| Cung thủ | `archer-sheet.png` | như trên |
| Lính giáo | `spearman-sheet.png` | **4 hướng**: 16 hàng = phe×8 + hướng×2 + (idle 0 / walk 1), hướng theo `SPEARMAN_DIRECTIONS` (`down`, `left`, `up`, `right`); ô 256×256, chân ở 90% chiều cao ô. Dựng từ `art/units/spearman/source/spearman-motion-4dir.png` bằng `tools/build_spearman_sheet.py`; bản đỏ do script đổi màu xanh → đỏ |
| Kỵ binh | `cavalry-sheet.png` | idle 3 khung, walk 4 khung |
| Pháo đài | `public/assets/fortress-sprite.png` | 238×200; dự phòng hình khối nếu chưa tải |
| Nông trại | `public/assets/farmstead-v2.png` | 88×69 |
Clip `walk` dùng khi `u.moving`; riêng lính giáo chọn hàng theo `u.facing` (xem [units.md](units.md)); fps idle 1–1.25, walk 7. Ảnh nguồn, tham chiếu và bản cũ nằm trong `art/units/<quân>/`, không vào bản build.

Màu phe: `teamPalette(team)` — xanh lá-lam cho team 0, đỏ đất cho team 1; thanh máu `#4baeff` / `#ff626b`.

## Code liên quan
- [src/main.ts](../../src/main.ts): `buildTerrain()`, `buildWorldDecor()` (cây/đá tránh căn cứ, mỏ, đường), `makePineSprite()`, `drawTree()`, `drawRock()`, `drawRockClusterSprite()`, `drawGrassPatch()`, `drawTerrainDetail()`, `drawBase()`, `drawMusterYard()`, `drawUnit()`, `drawUnitHealthBar()`, `drawUnitSelection()`, `drawFarm()`, `drawBuilding()`, `drawBuildingOverlay()`, `draw()`.
- Tiện ích: `drawUprightAt()`, `roundRect()`, `bar()`, `pill()`, `teamPalette()`, `unitTargetHeight()`, `zoomLerp()`, `decorRandom()`.
- Toạ độ & camera: xem [architecture.md](../architecture.md).

## Tương tác
- [fog-of-war.md](fog-of-war.md): lớp sương mù và việc ẩn địch.
- [units.md](units.md): thêm quân mới cần spritesheet + nhánh trong `drawUnit()`.
- Quy tắc: thay đổi phần vẽ không được làm đổi logic ([conventions.md](../conventions.md)).

## Multiplayer
Vẽ chạy cục bộ ở mọi trình duyệt; địa hình giống nhau vì `buildTerrain()` tất định. Decor (`buildWorldDecor()`) được gọi trong `fresh()` của từng trình duyệt.

## Kiểm thử thủ công
- [ ] Mở game: không có sprite nào hiện ô vuông dự phòng (kiểm tra tab Network không có 404 ở `/assets/`).
- [ ] Quân đi sau cây bị tán cây che, đi trước cây thì hiện đè lên cây; thanh máu luôn ở trên.
- [ ] Zoom tối đa ra/vào vẫn mượt (sương mù chỉ dựng lại khi vùng khám phá đổi).

## Giới hạn / việc tồn đọng
- Hình ảnh sông/hồ chỉ là địa hình; quân **đi xuyên** nước và đá khi di chuyển.
- `worldToScreenPlane()` là hàm đồng nhất: chưa phải isometric thật dù có thư mục backup "isometric-renderer".
