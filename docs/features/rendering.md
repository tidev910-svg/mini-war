# Bản đồ, địa hình & đồ hoạ

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-18

## Mô tả
Bản đồ vuông lớn, nhìn từ trên xuống: đồng cỏ, rừng dày, một con sông và 9 hồ có bãi cát, vùng đá, ruộng tài nguyên, đường đất. Khoảng 2.900 vật thể trang trí (cây thông, cây lá rộng, bụi cây, cụm đá, đá nhỏ, cỏ lau ven nước, lá súng trên hồ) được vẽ như sprite đứng và sắp xếp theo chiều sâu cùng quân lính để quân có thể đi trước/sau cây. Vật thể trang trí không chặn đường đi.

## Luật & thông số
**Địa hình** (`buildTerrain()`, cố định — không ngẫu nhiên theo trận): lưới 256×256 = 65.536 ô, `terrainType` mã:
| Mã | Loại | Số ô | Đi qua/xây được |
|---:|---|---:|---|
| 0 | Đồng cỏ (ô sát nước tô màu bãi cát) | phần còn lại | Có |
| 1 | Rừng | 13.107 (~20%) | Có (chỉ trang trí) |
| 2 | Nước: sông + 2 hồ cũ (5.243 ô) + 7 hồ thêm ngày 2026-10-18 (`lakeRegions`, 2.058 ô) | 7.301 (~11%) | Chặn đường đi (trừ 4 cầu), không xuất quân / xây |
| 3 | Đá | 4.588 (~7%) | Không xuất quân / xây |
| 4 | Ruộng tài nguyên | 3.276 (~5%) | Có; là nơi đặt mỏ (`resourceTiles`) |

Vùng rừng/đá/tài nguyên lấy từ `forestRegions`, `rockRegions`, `goldRegions` (toạ độ tỉ lệ 0–1, `src/config/map.ts`). Thứ tự gán: sông (5.243 ô có điểm "nước" thấp nhất) → hồ `lakeRegions` (elip có mép lượn sóng, chỉ lấy ô cỏ) → đá → ruộng → rừng, nên hồ không bị biome khác ghi đè. Hồ đặt trên đồng cỏ giữa các biome, cách sông.

**Lớp vẽ trong `draw()`** (theo thứ tự):
1. Nền `--ui-fog` (`THEME['ui-fog']`), rồi `terrainSmoothCanvas` (bản địa hình làm mờ 8 px + đốm màu) và 8% lớp `terrainCanvas` gốc.
2. `drawTerrainDetail(viewLeft, viewTop, viewRight, viewBottom)` (đốm cỏ/đá dựng sẵn, chỉ vẽ trong camera; xem mục Hiệu năng), đường chính (bezier ngang ~y=0.55H, cắt theo khung bản đồ để không thò ra ngoài) và đường phụ phía trên.
3. Lớp lãnh thổ `drawTerritory()` (tô màu phe, ranh giới theo ô dày theo pixel màn hình; bật/tắt phím T), mỏ (nếu đã khám phá/đang thấy), vòng tầm pháo khi chọn pháo đài.
4. Lá súng (phẳng, dưới mọi vật đứng), rồi danh sách `sceneActors` sắp theo Y: cây/bụi, đá, cỏ lau, pháo đài (+ sân tập kết), cột cờ (`drawFlag()`, chỗ đã khám phá), công trình (`drawBuilding()`; công trình địch chỉ vẽ khi đang thấy), quái canh mỏ, quân. Khi zoom < `DECOR_LAYER_SCALE` (0,2) mọi vật trang trí lấy từ một ảnh lớp vẽ sẵn (`decorLayerCanvas()`) thay vì vẽ từng cái.
5. Thanh máu quân, vòng chọn, đạn, hiệu ứng.
6. Sương mù `drawFog()` (một ảnh phủ toàn bản đồ do `refreshFog()` dựng: đục hoàn toàn ở vùng chưa khám phá, mờ ở chỗ đã khám phá nhưng không đang nhìn thấy, mép mềm), rồi lượt viền `drawTerritory(…, 'over')`, bản xem trước công trình đang đặt.
7. Lớp màn hình: khung chọn, thanh trạng thái đặt công trình (ở 14% chiều cao từ trên xuống, tránh bảng nhật ký).
8. Minimap `drawMinimap()` lên canvas riêng `#minimap` ([minimap.md](minimap.md)).

Cầu gỗ `drawBridges()` vẽ ngay trước lớp lãnh thổ; đường đi của quân đang chọn `drawUnitPaths()` vẽ ngay trước danh sách `sceneActors` ([pathfinding.md](pathfinding.md)).

Canvas `#game` phủ toàn màn hình; `syncWorldMetrics()` giới hạn độ phân giải nền ở `MAX_CANVAS_PIXELS` = 2,1 triệu điểm ảnh (CSS phóng lên).

**Quân (vẽ bằng code, từ 2026-10-18)** — [src/render/unitArt.ts](../../src/render/unitArt.ts), thay cho các spritesheet `public/assets/units/*` (không còn được tải):
- **Góc nhìn theo `u.facing`:**
  - `down`: nhìn thẳng, thấy mặt; tay phải cầm vũ khí ở bên trái màn hình, khiên/cung bên phải.
  - `up`: quay lưng, thấy mặt sau khiên, áo choàng ngắn, ống tên.
  - `right`: nghiêng sang phải.
  - `left`: bản lật của góc nghiêng, lật lúc vẽ (`ctx.scale(-1, 1)`), không dựng khung riêng.
- **Động tác** (`unitArtPose(u)`):
  - `walk`: 4 khung khi `u.moving`, tốc độ `UNIT_ANIM.walkFps` = 7 (kỵ binh `cavalryWalkFps` = 8), chân bước, tay vung, thân nhún.
  - `idle`: 4 khung thở nhẹ, `UNIT_ANIM.idleFps` = 1,25.
  - `strike`: 1 khung trong `UNIT_ANIM.strikeSeconds` = 0,22 giây sau mỗi đòn, ước từ `u.attackTimer` và `specs[type].cooldown`. Lính và trinh sát giơ kiếm/dao, lính giáo và kỵ binh đâm ngang, cung thủ kéo dây cung.
- **Trang bị:**

| Quân | Trang bị |
|---|---|
| Lính | Mũ sắt có lông nhỏ, kiếm, khiên tròn màu phe viền vàng |
| Lính giáo | Mũ trụ có khe nhìn, chùm lông lớn, giáo dài, khiên diều màu phe |
| Cung thủ | Mũ trùm màu phe đậm, cung, ống tên sau lưng |
| Trinh sát | Áo choàng có mũ trùm màu rêu, khăn quàng màu phe, dao găm |
| Kỵ binh | Ngựa nâu phủ vải màu phe viền vàng, yên; người cưỡi mũ trụ, thương, khiên diều. Ngựa phi 4 chân lệch pha; nhìn thẳng thấy đầu ngựa, quay lưng thấy mông và đuôi |

- **Màu:** màu phe lấy từ `TEAM_COLORS` (`config/theme.ts`); màu vật liệu (da, thép, gỗ, ngựa, mực viền) lấy từ `UNIT_ART` trong `config/visuals.ts`.
- **Bộ đệm:** mỗi khung (loại × phe × góc nhìn × động tác × khung) chỉ vẽ một lần vào canvas nhỏ, siêu lấy mẫu `SS` = 1,6 (`unitArtFrame()`), lần đầu cần thì mới dựng.
- **Kích thước:** `drawUnit()` co khung theo `unitTargetHeight(type)` / `FIGURE_H[type]` (chiều cao chân → đỉnh mũ trong đơn vị thiết kế). Thanh máu quân (`drawUnitHealthBar()`) nằm ngay trên mũ, rộng 30 (kỵ binh 46).
- **Chân dung** trên thẻ Huấn luyện (`drawPortraits()` trong `ui/panels.ts`) là khung `down` / `idle` của phe mình.

**Sprite công trình:**
| Đối tượng | File | Ghi chú |
|---|---|---|
| Pháo đài | `public/assets/fortress-sprite.png` | 238×200; dự phòng hình khối nếu chưa tải |
| Nông trại | `public/assets/farmstead-v2.png` | 88×69 |

**Vật thể trang trí** (`buildWorldDecor()`, gọi trong `fresh()` và ở khách khi nhận bản đồ của chủ phòng). Mỗi lượt đi trên lưới ô theo bước `step`, chọn điểm ngẫu nhiên tất định (`decorRandom()`) trong ô, giữ lại với xác suất `chance`, và cách mọi vật đã đặt ≥ `gap` (bảng băm không gian ô 128). Bảng `DECOR_PASSES`:
| Lượt | Nơi | step / chance / gap | Số lượng (chạy thử) |
|---|---|---|---:|
| `forest` | ô rừng; xác suất + `coreBonus` × độ sâu rừng (tỉ lệ ô rừng trong 5×5) | 2 / 0,30 (+0,45) / 34 | ~1.600 thông, ~500 lá rộng, bụi ở bìa rừng |
| `grassTree`, `bush` | đồng cỏ (cây lẻ không mọc sát nước) | 4 / 0,05 / 70; 4 / 0,07 / 40 | ~200 bụi tổng |
| `rockCluster`, `rockStone`, `grassStone` | ô đá; đá nhỏ cả trên cỏ | 4 / 0,32 / 115; 2 / 0,16 / 30; 5 / 0,035 / 40 | ~76 cụm, ~210 đá nhỏ |
| `reed` | ô cỏ/rừng sát nước | 1 / 0,20 / 30 | ~300 |
| `lily` | ô nước có 4 phía đều là nước | 2 / 0,09 / 34 | ~166 |
Chừa trống: quanh pháo đài (nửa kích thước + 150), sân tập kết (+40), mỏ (95), cột cờ (120), đường chính. Sprite vẽ sẵn bằng canvas: `makePineSprite()` (5 kiểu), `makeBroadleafSprite()` (3, kiểu 2 màu thu), `makeBushSprite()` (2, một kiểu có hoa), `drawRockClusterSprite()`, `makeStoneSprite()` (3), `makeReedSprite()` (2), `makeLilySprite()` (2, một kiểu có hoa). `decorSprite(item)` trả về ảnh + khung cho mỗi loại (`kind`); `drawDecor(item)` vẽ một vật. Dựng toàn bộ mất ~80 ms mỗi trận.

Màu phe của công trình vẽ bằng code (tháp, tiền đồn): `teamPalette(team)`.

**Lớp phủ trên bản đồ** (màu và cỡ từ [src/config/theme.ts](../../src/config/theme.ts), cùng nguồn với HUD):
- **Thanh máu quân** `bar()`: màu sáng của phe (`TEAM_COLORS[team].light`), viền tối.
- **Thanh máu pháo đài và công trình** `healthBar()`: cao `MAP_UI.healthBarPx` = 6 px trên màn hình, viền `--text-on-map-stroke`. Màu chuyển từ `--success` (đầy) qua `--resource` (một nửa) sang `--danger` (gần hết) theo `healthColor()`.
- **Nhãn pháo đài** `mapBanner()`: "PHÁO ĐÀI XANH/ĐỎ" trên dải cờ đuôi én màu phe, viền `--gold-muted`, chữ `--text-main` serif.
- **Nhãn khác** `mapText()`: "SÂN TẬP KẾT" (15 px thế giới, đậm) và tên công trình, viền chữ `--text-on-map-stroke` để đọc được trên mọi nền.
- Mọi chữ trên bản đồ tối thiểu `MAP_UI.labelMinPx` = 12 px trên màn hình (`mapFontPx()`).
- **Nhãn mỏ** (`draw()`): "XANH/ĐỎ/TRUNG LẬP · MỎ … +N/PHÚT" bằng `mapText()`, màu sáng của phe chủ vùng (`--text-main` khi trung lập). Trước 2026-10-18 nhãn này chỉ khoảng 6 px ở zoom mặc định và dùng màu viết cứng.
- **Lớp nhãn trên cùng**: nhãn mỏ, công trình, sân tập kết, dải cờ và thanh máu pháo đài, thanh máu công trình được xếp hàng bằng `queueMapLabel()` trong lúc vẽ cảnh theo chiều sâu. Sau đó `flushMapLabels()` vẽ chúng ngay sau `sceneActors`, nên cây và sprite phía dưới không che được.
- Nhãn **tiền đồn** đặt phía trên công trình, vì tiền đồn luôn đứng sát cột cờ và nhãn cờ đã nằm dưới chân cột.
- Nhãn mỏ, công trình và sân tập kết ẩn khi `renderView.scale` < `MAP_LABEL_MIN_SCALE` = 0,28.
- **Nhãn cờ** (`drawFlag()`):
  - Zoom bình thường: "CỜ XANH/ĐỎ/TRUNG LẬP · VÙNG …" và dòng trạng thái ("ĐANG CHIẾM 45%", "GĐ 1/2 · HẠ CỜ …", "TRANH CHẤP").
  - Zoom < `FLAG_SHORT_LABEL_ZOOM` = 0,2: rút gọn còn "VÙNG …" và "45%" / "TRANH CHẤP", để nhãn 20 cờ không chồng lên nhau khi thu nhỏ hết; chủ vùng vẫn thấy qua màu chữ và màu lá cờ.
  - Màu chữ là màu sáng của phe (`--text-main` khi trung lập), viền `--text-on-map-stroke`.
- Tên công trình và sân tập kết ẩn khi `renderView.scale` < `MAP_LABEL_MIN_SCALE` = 0,28, để không phủ kín bản đồ khi thu nhỏ hết.

## Code liên quan
- [src/map/terrain.ts](../../src/map/terrain.ts), [src/render/terrain.ts](../../src/render/terrain.ts), [src/render/buildings.ts](../../src/render/buildings.ts), [src/render/units.ts](../../src/render/units.ts), [src/render/draw.ts](../../src/render/draw.ts): `buildTerrain()`, `buildWorldDecor()`, `DECOR_PASSES`, `decorSprite()`, `drawDecor()`, `decorLayerCanvas()`, `DECOR_LAYER_SCALE`, `makePineSprite()`, `makeBroadleafSprite()`, `makeBushSprite()`, `makeStoneSprite()`, `makeReedSprite()`, `makeLilySprite()`, `drawRockClusterSprite()`; danh sách `treeDecor`, `rockDecor`, `shoreDecor`, `waterDecor`; `drawGrassPatch()`, `drawTerrainDetail()`, `drawBase()`, `drawMusterYard()`, `drawUnit()`, `drawUnitHealthBar()`, `drawUnitSelection()`, `drawFarm()`, `drawBuilding()`, `drawBuildingOverlay()`, `draw()`.
- Tiện ích: `drawUprightAt()`, `roundRect()`, `bar()`, `healthBar()`, `mapText()`, `mapBanner()`, `mapFontPx()`, `queueMapLabel()`, `flushMapLabels()`, `pill()`, `teamPalette()`, `unitTargetHeight()`, `zoomLerp()`, `decorRandom()`.
- Toạ độ & camera: xem [architecture.md](../architecture.md).

## Tương tác
- [fog-of-war.md](fog-of-war.md): lớp sương mù và việc ẩn địch.
- [units.md](units.md): thêm quân mới cần thêm nhánh vẽ trong `render/unitArt.ts` (`drawFoot()` hoặc hàm riêng như `drawCavalry()`) và `FIGURE_H`.
- Quy tắc: thay đổi phần vẽ không được làm đổi logic ([conventions.md](../conventions.md)).

## Multiplayer
Vẽ chạy cục bộ ở mọi trình duyệt; địa hình giống nhau vì `buildTerrain()` tất định. Vật trang trí tất định theo bản đồ: host dựng trong `fresh()`, khách dựng lại trong `startGuestFromSnapshot()` sau khi nhận bản đồ của host (trước 2026-10-18 khách giữ cây đá của bản đồ riêng lúc tải trang, có thể mọc đè nhà/mỏ thật).

## Kiểm thử thủ công
- [ ] Mở game: không có sprite nào hiện ô vuông dự phòng (kiểm tra tab Network không có 404 ở `/assets/`).
- [ ] Quân đi sau cây bị tán cây che, đi trước cây thì hiện đè lên cây; thanh máu luôn ở trên.
- [ ] Zoom tối đa ra/vào vẫn mượt (sương mù chỉ dựng lại khi vùng khám phá đổi).
- [ ] Rừng dày có cả thông và cây lá rộng; hồ có bãi cát, cỏ lau, lá súng; vùng đá có cụm đá và đá nhỏ; không có vật nào đè lên pháo đài, sân tập kết, mỏ, cờ, đường.
- Đã chạy thử 2026-10-18 (Chrome headless, canvas 1382×904): `draw()` 27–33 ms ở zoom mặc định (rừng dày nhất 33 ms), 32–36 ms khi thấy cả bản đồ (nhờ ảnh lớp; vẽ từng cây thì 65 ms); 40 bản đồ vẫn đúng 20 cờ, đủ 4 loại gần nhà; PvP: cây đá ở khách trùng với chủ phòng.

## Hiệu năng
Đo 2026-10-18 trong Chrome headless 1920×1080, canvas 1902×984, giữa trận có 51 quân:
| Đo | Trước | Sau |
|---|---:|---:|
| `draw()` zoom mặc định | 9,5 ms | ≈ 1 ms |
| `draw()` thu nhỏ hết | 84 ms | ≈ 0,8 ms |
| CPU rảnh khi chạy thật | 18% | 78% |
| Một lần `refreshFog()` | 3,8 ms | 0,7 ms |

Các cách đã áp dụng:
- **Đốm địa hình** (`drawTerrainDetail()`): trước đây mỗi frame tính lại khoảng 8.000 đốm và vẽ khoảng 16.000 elip trên toàn bản đồ. Giờ:
  - Đốm được tính một lần (`buildTerrainDetail()`) và chia theo hàng ô.
  - Mỗi frame chỉ vẽ hàng/cột trong camera, mỗi màu một path và một lần `fill` (`paintTerrainDetail()`).
  - Khi `renderView.scale` < `DETAIL_LAYER_SCALE` = 0,3, vẽ một ảnh dựng sẵn ở độ phân giải `DETAIL_LAYER_RES` = 0,25 (`terrainDetailLayer()`).
- **Lọc theo camera** trong `draw()`: mỏ, nhà, cờ, công trình, quân, thanh máu, vòng chọn, đạn, hiệu ứng ngoài khung camera không vẽ. Lề `cullPad` = max(260, 130/zoom) nới ra khi thu nhỏ, vì cờ và nhãn to lên.
- **HUD**: vòng lặp gọi `updateHUD()` tối đa mỗi `HUD_REFRESH_MS` = 100 ms (trước là mỗi frame); các thao tác vẫn gọi ngay. `setHTML()` / `setData()` chỉ ghi DOM khi giá trị đổi và so với chuỗi đã ghi, không đọc lại `innerHTML`.
- **Sương mù**: xem [fog-of-war.md](fog-of-war.md).

## Giới hạn / việc tồn đọng
- `worldToScreenPlane()` là hàm đồng nhất: chưa phải isometric thật dù có thư mục backup "isometric-renderer".
