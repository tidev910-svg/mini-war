# Vùng lãnh thổ & cột cờ

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-20

## Mô tả
Bản đồ (256 × 256 ô) được chia thành **đúng 20 vùng lãnh thổ** có cờ, cộng 2 vùng nhà chứa pháo đài. Ranh giới vùng là ranh giới tự nhiên, bám theo sông và vùng đá. Mỗi vùng có **đúng một loại tài nguyên** (lúa, gỗ, đá hoặc vàng), **một mỏ** loại đó, và **một cột cờ có sẵn** ở gần tâm vùng.

- **Vùng nhà:** vùng chứa pháo đài. Vùng này thuộc phe đó từ đầu trận, không có cờ, không bị chiếm và **không có mỏ** (thu nhập pháo đài thay cho mỏ gỗ cũ, xem [economy.md](economy.md)).
- **Hai pháo đài đặt ngẫu nhiên ở bất kỳ đâu trên bản đồ** (không cố định trái/phải), cách nhau ít nhất 55% bề ngang bản đồ. Sân tập kết và pháo phía trước quay về phía pháo đài địch.
- **Gần mỗi nhà luôn có đủ 4 loại vùng.** Trong 4 vùng gần mỗi nhà nhất, mỗi loại tài nguyên có ít nhất một vùng; các vùng còn lại được gán loại ngẫu nhiên.
- **Chiếm cờ:** không tốn tài nguyên; đưa quân **chiến đấu** vào vòng quanh cờ (trinh sát không chiếm được). Càng nhiều quân thì chiếm càng nhanh, nhưng có giới hạn. Nếu hai phe cùng đứng trong vòng, tiến độ tạm dừng. Bỏ trống cờ 5 giây thì tiến độ giảm dần về 0, nhưng cờ không tự đổi chủ. Chiếm xong thì cờ đổi màu, vùng và mỏ trong vùng chuyển sang phe mình, và **cả vùng sáng lên**: phe giữ cờ có tầm nhìn trực tiếp toàn vùng (thấy cả quân địch trong vùng) cho tới khi mất cờ.
- **Cờ của địch** chiếm qua 2 giai đoạn: giai đoạn 1 hạ cờ về trung lập, giai đoạn 2 chiếm. Nhãn và thanh tiến độ ghi rõ đang ở giai đoạn nào.
- **Vùng lúa:** mỏ lúa sinh 25 lúa/phút, và nông trại của chủ vùng xây trong vùng đó sinh thêm 25%.
- **Tiền đồn** xây cạnh cờ đã chiếm. Khi tiền đồn còn đứng, đối phương không chiếm được cờ đó; xem [buildings.md](buildings.md).
- Mỗi cờ có **vòng kiểm soát phát sáng** ở bán kính chiếm, màu phe đang giữ (kem nếu trung lập), sáng nhẹ theo nhịp.
- Nhấp vào cờ để chọn: hiện vòng phạm vi chiếm và ghi thông tin vào nhật ký.
- Lớp lãnh thổ (màu phe và ranh giới) bật/tắt bằng phím **T** hoặc nút "Ranh giới vùng". Cờ thì luôn được vẽ.

Nguồn thiết kế:
- "Thiết kế hệ thống tài nguyên" (15/10/2026).
- "Thiết kế hệ thống lãnh thổ" (16/10/2026).
- "Tổng kết yêu cầu sửa game RTS 1vs1" (16/10/2026). Mục 8 của tài liệu này đã được chốt ngày 17/10, xem "Quyết định đã chốt" bên dưới.
- "Chốt thiết kế 20 lãnh thổ" (17/10/2026): đúng 20 vùng, nhà ở vị trí ngẫu nhiên, viền phát sáng, tầm nhìn trực tiếp toàn vùng khi giữ cờ.

## Luật & thông số
**Sinh bản đồ** (`fresh()` → `generateRegions()`)
| Bước | Chi tiết |
|---|---|
| Vị trí pháo đài | Ngẫu nhiên ở bất kỳ đâu (cách mép ≥ 420), hai nhà cách nhau ≥ 55% bề ngang bản đồ (`BASE_MIN_SEPARATION`); `base.dir` hướng về nhà địch. Bỏ vị trí mà pháo đài hoặc sân tập kết có dưới 85% ô đi được (`baseSiteClear()`, `BASE_SITE_MIN_CLEAR`) |
| Hạt giống | 2 vùng nhà đặt tại ô của pháo đài. Kho hạt giống: tâm các biome rừng/đá/ruộng (`forestRegions`, `rockRegions`, `goldRegions`, xáo ngẫu nhiên) rồi thêm ô đất ngẫu nhiên trên khối đất lớn cho đủ 40; mọi hạt giống cách pháo đài ≥ 22 ô (`REGION_MIN_BASE_TILES`) và cách nhau ≥ 20 ô (`REGION_SEED_SPACING_TILES`). Lấy đúng `REGION_COUNT` = 20 hạt giống đầu kho |
| Chia ô | **Giữ nguyên**: Dijkstra nhiều nguồn trên lưới 256×256 (4 hướng). Chi phí vào ô: đất 1, đá 3, nước 6, nên ranh giới chạy theo sông, hồ và đá (`buildRegionMap()`). Từ 2026-10-18 bản đồ có thêm 7 hồ (`lakeRegions`, [rendering.md](rendering.md)); cờ, mỏ và nhà vẫn tránh nước như trước |
| Cột cờ (`r.cp`) | Ô gần **tâm khối** của vùng nhất thoả các điều kiện: 3×3 ô đi được, cùng vùng, nằm trên khối đất liền ≥ 400 ô (không phải đảo nhỏ: `landPatchSizes()`, `MIN_LAND_PATCH_TILES`), và cách cả hai pháo đài > 21 ô (`FLAG_ENEMY_BASE_MIN_TILES`) |
| Chỗ đặt mỏ | Chỉ vùng có cờ: ô gần cờ nhất mà cách cờ ≥ 6 ô (để nhãn không đè nhau). Mọi mỏ cách nhau ≥ 260 và ở trên khối đất lớn. Vùng nhà không có mỏ (bỏ ngày 2026-10-17) |
| Giữ đúng 20 vùng | Vùng nào không đặt được cờ hoặc mỏ thì hạt giống của nó bị bỏ khỏi kho, hạt giống kế tiếp thế chỗ và bản đồ được chia lại (tối đa 6 lượt; nếu vẫn thiếu, lần sinh đó bị coi là không đạt). Việc này làm **trước** khi gán loại tài nguyên |
| Loại tài nguyên | Với từng nhà (thứ tự ngẫu nhiên), xếp các vùng theo **chi phí đi bộ** tới cờ (`walkDistances()`). Loại nào chưa có trong 4 vùng gần nhất thì gán, theo thứ tự ngẫu nhiên, cho các vùng gần nhất chưa có loại. Các vùng còn lại gán ngẫu nhiên 1 trong 4 loại (`REGION_TYPES`) |
| Mỏ | Một mỏ mỗi vùng (mỏ có sẵn từ trước, không thêm mỏ riêng), cùng loại với vùng. Mọi vùng cùng loại sinh đúng một mức: lúa 45, gỗ 45, đá 35, vàng 35 mỗi phút (`MINE_TYPES`, V3.1). Mỏ giàu × 1,5 ở giữa bản đồ đã bỏ ngày 2026-10-18 |
| Công bằng | Với mỗi loại tài nguyên, lấy chi phí đi bộ từ mỗi nhà tới cờ gần nhất của loại đó. Độ lệch = Σ\|d₀ − d₁\| ÷ Σ max(d₀, d₁). Nếu lớn hơn `MAP_FAIRNESS_TOLERANCE` (0,3) thì chọn lại vị trí nhà, tối đa `MAP_GENERATION_TRIES` = 15 lần; nếu vẫn không đạt thì lấy lần công bằng nhất |

"Đường đi thực tế": từ 2026-10-18 nước và đá chặn đường, sông chỉ qua được bằng 4 cầu ([pathfinding.md](pathfinding.md)). `walkDistances()` là quãng đường đi bộ thật (chỉ qua ô đi được, có cầu). Lần sinh bản đồ bị loại nếu từ sân tập kết xanh không đi bộ tới được sân tập kết đỏ, mọi cột cờ, mọi mỏ (`reachableFrom()`). (Trước đó, khi quân còn lội qua nước, hàm này dùng chi phí địa hình đất 1, đá 3, nước 6.)

Kết quả chạy thử 2026-10-17 (sau bản 20 lãnh thổ) với 40 bản đồ: luôn đúng 20 cờ + 2 vùng nhà; mỗi vùng đúng một mỏ đúng loại; 4 vùng gần mỗi nhà đủ 4 loại; cờ nằm trong vùng và trên khối đất lớn; pháo đài xanh rải khắp bản đồ (x 505–9.136, y 750–8.882; 21/40 lần ở nửa phải), hai nhà cách nhau ≥ 5.345; sân tập kết quay về phía địch; khoảng 70 ms mỗi bản đồ.

Kết quả chạy thử 2026-10-17 trước đó (bản 16–20 vùng) với 40 bản đồ:
- 16–20 vùng thường.
- Mỗi vùng một mỏ đúng loại.
- 4 vùng gần mỗi nhà luôn đủ lúa, gỗ, đá, vàng.
- Cờ nằm trong vùng của nó; cờ và mỏ đều ở trên khối đất lớn.
- Độ lệch tối đa 0,30, trung bình 0,22.
- Pháo đài và sân tập kết đều ở trên đất, xuất quân được.
- Sinh mỗi bản đồ mất khoảng 140 ms.

**Chiếm cờ** (`updateCaptures()`, host chạy mỗi bước mô phỏng, trong `updateBuildings()`)
- Quân tính là đang chiếm khi còn sống, **không phải trinh sát**, và đứng trong bán kính `FLAG_CAPTURE_RADIUS_TILES` = 4 ô quanh cờ (`flagCapturers()`, `FLAG_SCOUTS_CAPTURE = false`). Trinh sát không chiếm và cũng không gây tranh chấp. Mọi loại quân chiến đấu góp sức như nhau.
- Thời gian chiếm với n quân = `FLAG_CAPTURE_BASE_SECONDS` / min(n, `FLAG_CAPTURE_MAX_UNITS`)^`FLAG_CAPTURE_EXPONENT` (`captureSeconds()`):

| Số quân | 1 | 2 | 5 | 10 trở lên |
|---|---:|---:|---:|---:|
| Thời gian | 60 s | ~40 s | ~23 s | ~15 s |

- Chỉ một phe trong vòng:
  - **Cờ trung lập:** `r.cap` tăng tới 1, khi đó `r.owner = phe đó` (từ đó cờ cho tầm nhìn 450, [fog-of-war.md](fog-of-war.md); trước 2026-10-20 `revealRegion()` đánh dấu mọi ô của vùng là đã khám phá cho phe đó. Guest giữ sương mù riêng nên mỗi snapshot gọi `revealOwnedRegions()` (trong `revealTeamVision()`) cho các vùng có cờ mình đang giữ.
  - **Tầm nhìn trực tiếp:** khi giữ cờ, `teamCanSee()` trả về đúng cho mọi điểm trong vùng (kiểm tra bằng `regionAt()`), nên quân/công trình địch trong vùng hiện ra và bị nhắm bắn như trong tầm nhìn thường; `teamVisibleTiles()` cũng tính cả vùng nên lớp sương mờ không phủ lên. Mất cờ thì tầm nhìn chuyển sang phe mới; phe cũ vẫn giữ phần "đã khám phá" (địa hình dưới lớp sương mờ) và vẫn nhìn được bằng quân/công trình riêng. Sương mù hai phe tính độc lập.
  - **Cờ của địch:** giai đoạn 1: `r.cap` tăng tới 1 thì cờ **về trung lập** (`owner = -1`, `r.stage2 = phe đó`). Giai đoạn 2: chiếm tiếp từ 0. Tổng thời gian gấp đôi. `captureStage(r)` trả về 1, 2, hoặc 0 nếu là cờ trung lập thường.
  - **Phe khác đang có tiến độ dở:** tiến độ của họ giảm về 0 trước, rồi mới tới lượt phe đang đứng.
  - **Chủ cờ đứng ở cờ của mình:** xoá tiến độ dở của đối phương với cùng tốc độ.
- Cả hai phe cùng ở trong vòng → `r.contested`, tiến độ **dừng**.
- Đối phương đứng ở cờ khi chủ cờ còn **tiền đồn** trong vùng (`regionOutpost()`) → cũng tính là tranh chấp. Phải phá tiền đồn trước.
- Không ai trong vòng (`r.idle` giây): trong `FLAG_DECAY_DELAY_SECONDS` = 5 giây đầu tiến độ giữ nguyên, sau đó **giảm dần** (cả thanh hết trong `FLAG_DECAY_SECONDS` = 60 giây) về 0. Khi về 0 thì xoá `capTeam`, `stage2`; **không đổi chủ** (bỏ dở giai đoạn 2 thì cờ vẫn trung lập).
- Mỗi giây: `mine.owner = region.owner`; mỏ có chủ cộng `income` cho chủ.
- **Lãnh thổ** (`inOwnTerritory()`): vùng mình sở hữu (gồm vùng nhà) hoặc trong 14 ô quanh pháo đài. Tháp chỉ xây được trong lãnh thổ.
- Công trình khác phải cách cờ ≥ 2,5 ô; tiền đồn ≥ 1,2 ô (`buildingPlacementProblem()`).

**Hiển thị**
- **Cờ (`drawFlag()`):**
  - Bệ đá, cột, lá cờ màu chủ (kem nếu trung lập) có biểu tượng tài nguyên. Cao khoảng 190 đơn vị, ngang cỡ pháo đài.
  - Khi thu nhỏ dưới zoom 0,3, cờ được phóng to theo (`flagScale()`, `FLAG_MIN_SCREEN_ZOOM`) và chữ giữ tối thiểu 11 px (`FLAG_LABEL_MIN_PX`).
  - Khi đang chiếm, màu phe chiếm phủ dần lá cờ từ phía cột. Dưới bệ có thanh tiến độ: cam nếu tranh chấp, xám nếu đang giảm. Với cờ địch, thanh chia đôi bằng vạch trắng: nửa trái là giai đoạn 1, nửa phải là giai đoạn 2.
  - Nhãn 2 dòng: dòng 1 ghi "CỜ XANH/ĐỎ/TRUNG LẬP · VÙNG …". Dòng 2 ghi "ĐANG CHIẾM x%", "GĐ 1/2 · HẠ CỜ x%", "GĐ 2/2 · CHIẾM x%" hoặc "TRANH CHẤP", thêm "· ĐANG GIẢM" khi tiến độ đang giảm.
  - Vòng phạm vi chiếm hiện khi cờ được chọn, đang có tiến độ, hoặc đang tranh chấp.
  - Cờ chỉ vẽ ở chỗ phe mình đã khám phá.
- **Lớp lãnh thổ (`drawTerritory()`):**
  - Màu phe tô mờ trên vùng sở hữu (`regionTintCanvas`).
  - Ranh giới là **đường liền phát sáng nhẹ**, độ dày tính theo **pixel màn hình** nên không mỏng đi khi thu nhỏ: 3,5 px màu sáng của phe (`TERRITORY_BORDER_PX.owned`, `TERRITORY_COLORS` = `TEAM_COLORS[team].light` trong `config/theme.ts`); quầng sáng mờ cùng màu rộng thêm 3 px mỗi bên (`TERRITORY_GLOW`, `TERRITORY_GLOW_PX`), cộng một nét tối mảnh để nổi trên nền sáng. Lớp tô màu vùng cũng dùng màu sáng của phe.
  - **Đường mềm, không bậc thang** (từ 2026-10-18): các cạnh ô được nối thành đường liền (`borderLines()`, dừng ở chỗ 3 vùng gặp nhau nên các đường vẫn khớp nhau). Sau đó chỉ giữ 1 điểm mỗi `MAP_UI.borderSmoothTiles` = 2 ô và bo góc bằng đường cong bậc hai qua trung điểm (`traceSmooth()`).
  - **Chỉ vẽ ranh giới của vùng có chủ** (từ 2026-10-18): giữa hai vùng trung lập không vẽ gì; đoạn nằm trên hoặc sát nước (sông, hồ) cũng bỏ vì sông/hồ đã là ranh giới. Mỗi ranh giới vẽ **một** đường: màu của phe sở hữu một trong hai vùng kề; giữa vùng xanh và vùng đỏ thì lấy màu phe của người đang xem. Đổi màu ngay khi vùng đổi chủ. Vùng trung lập vẫn nhận biết qua cột cờ và vòng kiểm soát.
  - Chỉ vẽ cạnh mà một trong hai ô kề đã được khám phá. `drawTerritory(…, 'under')` vẽ các đoạn ở chỗ đang nhìn thấy, trước quân và công trình nên không che chúng; các đoạn chạm mép sương mù (`fogMask`) hoặc nằm ở chỗ không đang nhìn thấy (`fogVisible`) được vẽ ở lượt `'over'` sau `drawFog()`, để không bị lớp sương che hoặc làm tối (ở đó không có quân đang hiện nên không che gì).
- **HUD "🚩 Lãnh thổ":** số vùng đang giữ và tổng thu từ mỏ mỗi phút (có cả lúa).

## Quyết định đã chốt (2026-10-17, trả lời mục 8 của tài liệu 16/10)
| Câu hỏi | Quyết định |
|---|---|
| 8.1 Chiếm cờ của địch | Trả về trung lập trước: 2 giai đoạn (hạ cờ → chiếm), hiển thị tiến độ từng giai đoạn |
| 8.2 Tiền đồn | Công trình riêng (`BUILDING_TYPES.outpost`): 200 gỗ + 100 đá, 40 giây, 1.500 máu, có súng; phải phá tiền đồn trước khi chiếm được cờ |
| 8.3 Vùng lúa | Mỏ lúa 15 lúa/phút (`MINE_TYPES.food`; **đổi thành 25 lúa/phút ngày 2026-10-17** theo đề xuất cân bằng v1, giữ thưởng 25%) + nông trại xây trong vùng lúa mình giữ được +25% (`FOOD_REGION_FARM_BONUS`, `farmFoodPerMinute()`); nông trại vẫn xây được ở chỗ khác |
| 8.4 Công thức & luật | T = 60 / N^0,6, tối đa 10 quân; rời cờ 5 giây thì tiến độ giảm dần về 0, không đổi chủ; trinh sát không chiếm; mọi quân chiến đấu như nhau; hai phe cùng đứng thì dừng |

Chưa chốt, đang làm tạm:
- "Đúng 20 lãnh thổ" hiểu là 20 vùng có cờ; 2 vùng nhà (không cờ, không chiếm được) tính riêng.
- Khoảng cách tối thiểu giữa hai nhà: 55% bề ngang bản đồ (`BASE_MIN_SEPARATION`).
- Cờ "to cỡ nhà chính" chỉ to về hình vẽ.
- Tốc độ giảm khi bỏ trống: cả thanh hết trong 60 giây.
- Thưởng nông trại chỉ áp dụng khi phe của nông trại đang giữ vùng lúa đó.

## Code liên quan
- [src/map/regions.ts](../../src/map/regions.ts), [src/core/game.ts](../../src/core/game.ts), [src/map/terrain.ts](../../src/map/terrain.ts), [src/render/territory.ts](../../src/render/territory.ts), [src/ui/hud.ts](../../src/ui/hud.ts), [src/core/match.ts](../../src/core/match.ts), [src/map/bases.ts](../../src/map/bases.ts):
  - Khối "Territory map": `regionMap` (Int16Array, **biến cấp module, không nằm trong `state`**), `buildRegionMap()`, `ensureRegionMap()`, `regionSeedKey()`, `walkDistances()`, `landPatchSizes()`, `generateRegions()`, `refreshRegionTint()`, `drawTerritory()`, `setShowTerritory()`; `regionEdges`.
  - Trong `fresh()`: vòng chọn lại vị trí nhà; `baseSiteClear()`, `baseDir()` (hướng `base.dir` về phía địch).
- Tầm nhìn của vùng đang giữ: 450 quanh cờ (`TERRITORY_VISION`, `visionSources()`; `revealRegion()` / `revealOwnedRegions()` đã bỏ); tầm nhìn trực tiếp: `teamCanSee()`, `teamVisibleTiles()`.
- Chiếm cờ: `updateCaptures()`, `captureSeconds()`, `flagCapturers()`, `captureStage()`, `regionOutpost()`. Thưởng vùng lúa: `farmFoodPerMinute()`.
- Vẽ: `drawFlag()`, `flagScale()`, `flagHit()` (vùng nhấp chọn cờ).
- Hằng số:
  - Sinh bản đồ: `REGION_TYPES`, `REGION_COUNT`, `REGION_SEED_SPACING_TILES`, `REGION_MIN_BASE_TILES`, `MAP_FAIRNESS_TOLERANCE`, `MAP_GENERATION_TRIES`, `MIN_LAND_PATCH_TILES`, `BASE_SITE_MIN_CLEAR`, `BASE_MIN_SEPARATION`.
  - Chiếm cờ: `FLAG_ENEMY_BASE_MIN_TILES`, `FLAG_CAPTURE_RADIUS_TILES`, `FLAG_CAPTURE_BASE_SECONDS`, `FLAG_CAPTURE_EXPONENT`, `FLAG_CAPTURE_MAX_UNITS`, `FLAG_SCOUTS_CAPTURE`, `FLAG_DECAY_DELAY_SECONDS`, `FLAG_DECAY_SECONDS`; `FOOD_REGION_FARM_BONUS`.
  - Hiển thị: `FLAG_COLORS`, `FLAG_MIN_SCREEN_ZOOM`, `FLAG_LABEL_MIN_PX`, `FLAG_SHORT_LABEL_ZOOM`, `FLAG_RING_PX`, `RESOURCE_ICONS`, `TERRITORY_COLORS`, `TERRITORY_BORDER_PX`, `TERRITORY_GLOW`, `TERRITORY_GLOW_PX`.
  - Khác: `HOME_TERRITORY_TILES`.
- Tra cứu: `regionAt(x, y)`, `inOwnTerritory()`, `regionLabel()`. Khám phá: `revealHomeTerritory()`, `revealCircle()`, `tilePassable()`.
- Dữ liệu:
  - `state.regions[] = {id, resource, sgx, sgy, home (null|0|1), owner (-1|0|1), cp: {x, y}|null, cap (0..1), capTeam (-1|0|1), contested, idle (giây không ai đứng), stage2 (-1|0|1: phe đã hạ cờ địch)}`.
  - `state.mines[] = {x, y, resource, regionId, income (mỗi giây), owner}`.
- Biến giao diện `selectedFlag` (id vùng, chỉ ở máy người chơi). Nút `#toggleTerritory`; phím T trong `keydown`.

## Tương tác
- [flag-defense.md](flag-defense.md): cờ có chủ tự bắn (10 sát thương / 2 giây, tầm 180); cờ còn quân đồn trú thì phe khác không chiếm được; cờ về trung lập thì thả quân đồn trú.
- [buildings.md](buildings.md): tiền đồn giữ cờ; điều kiện lãnh thổ cho tháp; khoảng cách tới cờ.
- [economy.md](economy.md): mỏ sinh lúa/gỗ/đá/vàng; mỏ lúa tính vào `foodPerMinute()`.
- [fog-of-war.md](fog-of-war.md): cờ và ranh giới chỉ hiện ở chỗ đã khám phá.
- [ai-opponent.md](ai-opponent.md): AI cử nhóm quân đứng ở cờ.
- [controls.md](controls.md): nhấp chọn cờ, phím T.
- [match-flow.md](match-flow.md): vòng chọn vị trí nhà trong `fresh()`.

## Multiplayer
- `state.regions` (kèm ô hạt giống, `cap`, `capTeam`, `contested`) và `state.mines` đi qua snapshot, nên guest thấy màu cờ và tiến độ.
- `state.bases` (kèm `dir`) đi qua snapshot nên guest đặt sân tập kết đúng hướng.
- `regionMap` thì **không** đi qua snapshot. Guest gọi `ensureRegionMap()` trong `applySnapshot()` để dựng lại bản đồ vùng từ các hạt giống (thuật toán tất định).
- Host quyết định việc chiếm. Guest xin xây tiền đồn bằng action `outpost {regionId}`.
- Log chiếm cờ chỉ hiện ở host (giới hạn chung của log, xem [multiplayer.md](multiplayer.md)).

## Kiểm thử thủ công
- [ ] Tạo nhiều trận mới: luôn 20 cờ; vị trí hai nhà thay đổi khắp bản đồ (có lúc xanh ở phải/trên/dưới), sân tập kết quay về phía địch; 4 vùng gần mỗi nhà có đủ lúa, gỗ, đá, vàng; mỗi vùng chỉ một mỏ.
- [ ] Mỗi vùng thường có một cờ lớn ở gần giữa vùng, không nằm trên nước hoặc đá.
- [ ] Đưa 1 quân vào vòng cờ trung lập → khoảng 60 giây thì chiếm xong. 5 quân khoảng 23 giây. 10 quân trở lên khoảng 15 giây.
- [ ] Quân địch vào vòng → thanh cam, "TRANH CHẤP", tiến độ dừng. Trinh sát địch vào vòng → không dừng.
- [ ] Chỉ có trinh sát ở cờ → không chiếm.
- [ ] Rút hết quân → 5 giây đầu giữ nguyên, sau đó thanh xám "ĐANG GIẢM" về 0, cờ không đổi chủ.
- [ ] Chiếm cờ địch → "GĐ 1/2 · HẠ CỜ", về trung lập, rồi "GĐ 2/2 · CHIẾM"; thanh có vạch chia giữa.
- [ ] Nông trại trong vùng lúa mình giữ → nhấp vào thấy 25 lúa/phút (cấp 1) "có thưởng vùng lúa". Khi địch có tiền đồn ở vùng đó thì không chiếm được, phải phá tiền đồn trước.
- [ ] Chiếm xong → cờ đổi màu, viền vùng đổi màu, mỏ đổi "XANH", HUD lãnh thổ tăng, cả vùng hết sương mù và viền hiện rõ.
- Đã chạy thử 2026-10-17: chiếm vùng lúa 2.257 ô → phe xanh khám phá đủ 2.257 ô (trước đó 0), sương mù phe đỏ không đổi; PvP: guest chiếm vùng 673 ô → sương mù guest mở đủ 673 ô; ảnh chụp thấy cả vùng sáng và viền xanh trên mép sương mù.
- [ ] Chiếm cờ rồi rút hết quân → vẫn thấy quân địch đi vào vùng đó; bị chiếm lại → mất tầm nhìn vùng, địa hình vẫn nhớ dưới lớp sương mờ; mỏ đổi chủ, chỉ phe mới nhận thu nhập.
- Đã chạy thử 2026-10-17 (bản 20 lãnh thổ): ô xa cờ 46 ô — trước khi chiếm không thấy; chiếm xong, rút quân vẫn thấy, phe đỏ không thấy; thu nhập 0,333 đá/giây chỉ vào phe xanh; đổi sang đỏ → xanh mất tầm nhìn, ô vẫn "đã khám phá", thu nhập chỉ vào đỏ. PvP: guest chiếm vùng 4.396 ô, rút quân → `fogVisible` đủ 4.396 ô, guest thấy ô xa, host không thấy; guest có cùng vị trí/hướng nhà và 20 cờ. AI: 3 bản đồ ngẫu nhiên × 8 phút, AI giữ 3–7 vùng, không lỗi.
- [ ] Nhấp cờ → vòng nét đứt và log thông tin. Mọi cờ có vòng kiểm soát phát sáng màu phe. Viền vùng liền, phát sáng nhẹ, rõ ở mọi mức zoom, kể cả ở chỗ đã khám phá nhưng không đang nhìn thấy. Phím T ẩn/hiện lớp lãnh thổ.
- Đã chạy thử lại 2026-10-17 sau khi chốt mục 8: 1/5/10/15 lính giáo mất 60/22,9/15,1/15,1 giây; 5 kỵ binh hoặc 5 cung thủ cũng 22,9 giây; 3 trinh sát trong 20 giây không chiếm được (0%); trinh sát địch không gây tranh chấp; quân thường gây tranh chấp (giữ 33%); rời cờ: sau 4,9 giây vẫn 53%, sau 15 giây còn 36%, về 0 không đổi chủ; cờ địch: hạ cờ ở giây 23, chiếm ở giây 46, nhãn đúng giai đoạn; bỏ dở giai đoạn 2 thì cờ trung lập; mỏ lúa 15/phút; nông trại trong vùng lúa của mình 25, ngoài vùng hoặc vùng chưa chiếm 20; AI không cử trinh sát đi chiếm. Không lỗi JavaScript.
- Đã chạy thử 2026-10-17 (luật tạm trước khi chốt, Chrome headless + debugger):
  - Bản đồ: 40 bản đồ đều đạt các tiêu chí trên.
  - Chiếm cờ: 1 / 5 / 10 / 15 quân mất 60 / 22,9 / 15,1 / 15,1 giây; 1 trinh sát chiếm 17% trong 10 giây; tranh chấp giữ 32%; rút quân vẫn giữ 32%; cờ địch với 5 quân về trung lập ở giây 23 và đổi chủ ở giây 46; có tiền đồn thì 10 quân không chiếm được; chủ cờ xoá tiến độ dở của đối phương.
  - Ảnh chụp ở zoom mặc định và zoom xa: cờ và viền rõ.
  - AI tự chiếm được 8–10 vùng sau 8 phút.
  - PvP (2 trình duyệt): cờ trùng vị trí ở hai bên; guest thấy tiến độ 35%, chiếm xong HUD hiện 2 vùng; guest bấm "Xây tiền đồn" → host tạo tiền đồn, lần thứ hai cho cùng vùng bị từ chối.

## Giới hạn / việc tồn đọng
- Vị trí vùng không đối xứng; công bằng chỉ đo theo chi phí đi bộ tới cờ gần nhất của từng loại (độ lệch ≤ 0,3).
- Tốc độ giảm khi bỏ trống cờ (60 giây cho cả thanh) là số tạm, chưa chốt.
- Chưa có thưởng lãnh thổ (+10%); mỏ vô hạn; điều kiện thắng vẫn là phá pháo đài (câu hỏi mở).
- Thợ xây tiền đồn là "bất kỳ quân nào", chưa có loại quân thợ xây riêng.
- Ở chỗ đã khám phá nhưng không đang nhìn thấy, màu cờ vẫn được cập nhật theo thực tế (không "nhớ" trạng thái cũ).
