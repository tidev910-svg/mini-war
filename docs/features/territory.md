# Vùng lãnh thổ & cột cờ

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Bản đồ được chia thành khoảng 16–20 **vùng lãnh thổ** trung lập cùng 2 vùng nhà. Ranh giới vùng là ranh giới tự nhiên, bám theo sông và vùng đá. Mỗi vùng có **đúng một loại tài nguyên** (lúa, gỗ, đá hoặc vàng), **một mỏ** loại đó, và **một cột cờ có sẵn** ở gần tâm vùng.

- **Vùng nhà:** vùng chứa pháo đài. Vùng này thuộc phe đó từ đầu trận, luôn là vùng gỗ, không có cờ và không bị chiếm.
- **Gần mỗi nhà luôn có đủ 4 loại vùng.** Trong 4 vùng gần mỗi nhà nhất, mỗi loại tài nguyên có ít nhất một vùng; các vùng còn lại được gán loại ngẫu nhiên.
- **Chiếm cờ:** đưa quân vào vòng quanh cờ. Càng nhiều quân thì chiếm càng nhanh, nhưng có giới hạn. Nếu hai phe cùng đứng trong vòng, tiến độ tạm dừng. Chiếm xong thì cờ đổi màu, vùng và mỏ trong vùng chuyển sang phe mình.
- **Cờ của địch** phải hạ về trung lập trước, sau đó mới chiếm tiếp được.
- **Tiền đồn** xây cạnh cờ đã chiếm. Khi tiền đồn còn đứng, đối phương không chiếm được cờ đó; xem [buildings.md](buildings.md).
- Nhấp vào cờ để chọn: hiện vòng phạm vi chiếm và ghi thông tin vào nhật ký.
- Lớp lãnh thổ (màu phe và ranh giới) bật/tắt bằng phím **T** hoặc nút "Ranh giới vùng". Cờ thì luôn được vẽ.

Nguồn thiết kế:
- "Thiết kế hệ thống tài nguyên" (15/10/2026).
- "Thiết kế hệ thống lãnh thổ" (16/10/2026).
- "Tổng kết yêu cầu sửa game RTS 1vs1" (16/10/2026). Những mục chưa chốt trong tài liệu này được ghi ở "Quyết định tạm" bên dưới.

## Luật & thông số
**Sinh bản đồ** (`fresh()` → `generateRegions()`)
| Bước | Chi tiết |
|---|---|
| Vị trí pháo đài | Ngẫu nhiên: xanh trong dải 16% bên trái, đỏ trong dải 16% bên phải. Bỏ vị trí mà pháo đài hoặc sân tập kết có dưới 85% ô đi được (`baseSiteClear()`, `BASE_SITE_MIN_CLEAR`) |
| Hạt giống | 2 vùng nhà đặt tại ô của pháo đài. Ứng viên là tâm các biome rừng/đá/ruộng (`forestRegions`, `rockRegions`, `goldRegions`); bỏ ứng viên cách pháo đài < 22 ô (`REGION_MIN_BASE_TILES`), rồi chọn ngẫu nhiên tối đa `REGION_COUNT` = 20 |
| Chia ô | **Giữ nguyên**: Dijkstra nhiều nguồn trên lưới 256×256 (4 hướng). Chi phí vào ô: đất 1, đá 3, nước 6, nên ranh giới chạy theo sông và đá (`buildRegionMap()`) |
| Cột cờ (`r.cp`) | Ô gần **tâm khối** của vùng nhất thoả các điều kiện: 3×3 ô đi được, cùng vùng, nằm trên khối đất liền ≥ 400 ô (không phải đảo nhỏ: `landPatchSizes()`, `MIN_LAND_PATCH_TILES`), và cách cả hai pháo đài > 21 ô (`FLAG_ENEMY_BASE_MIN_TILES`) |
| Chỗ đặt mỏ | Vùng thường: ô gần cờ nhất mà cách cờ ≥ 6 ô (để nhãn không đè nhau). Vùng nhà: cách pháo đài 9–16 ô. Mọi mỏ cách nhau ≥ 260 và ở trên khối đất lớn. Vùng không có cờ hoặc không có chỗ đặt mỏ bị loại **trước** khi gán loại |
| Loại tài nguyên | Với từng nhà (thứ tự ngẫu nhiên), xếp các vùng theo **chi phí đi bộ** tới cờ (`walkDistances()`). Loại nào chưa có trong 4 vùng gần nhất thì gán, theo thứ tự ngẫu nhiên, cho các vùng gần nhất chưa có loại. Các vùng còn lại gán ngẫu nhiên 1 trong 4 loại (`REGION_TYPES`) |
| Mỏ | Một mỏ mỗi vùng, cùng loại với vùng. Vùng có hạt giống nằm trong 15% quanh giữa bản đồ có mỏ giàu (× 1,5). Mỏ lúa sinh 30/phút, bằng mỏ gỗ (thông số thử) |
| Công bằng | Với mỗi loại tài nguyên, lấy chi phí đi bộ từ mỗi nhà tới cờ gần nhất của loại đó. Độ lệch = Σ\|d₀ − d₁\| ÷ Σ max(d₀, d₁). Nếu lớn hơn `MAP_FAIRNESS_TOLERANCE` (0,3) thì chọn lại vị trí nhà, tối đa `MAP_GENERATION_TRIES` = 15 lần; nếu vẫn không đạt thì lấy lần công bằng nhất |

"Đường đi thực tế": con sông chia đôi toàn bộ đất liền (không có ô đất nào đi tới được từ cả hai nhà), còn quân thì chưa có tìm đường và vẫn lội qua nước. Vì thế `walkDistances()` tính chi phí theo địa hình (đất 1, đá 3, nước 6) chứ không chỉ đi trên đất.

Kết quả chạy thử 2026-10-17 với 40 bản đồ:
- 16–20 vùng thường.
- Mỗi vùng một mỏ đúng loại.
- 4 vùng gần mỗi nhà luôn đủ lúa, gỗ, đá, vàng.
- Cờ nằm trong vùng của nó; cờ và mỏ đều ở trên khối đất lớn.
- Độ lệch tối đa 0,30, trung bình 0,22.
- Pháo đài và sân tập kết đều ở trên đất, xuất quân được.
- Sinh mỗi bản đồ mất khoảng 140 ms.

**Chiếm cờ** (`updateCaptures()`, host chạy mỗi bước mô phỏng, trong `updateBuildings()`)
- Quân tính là đang chiếm khi còn sống và đứng trong bán kính `FLAG_CAPTURE_RADIUS_TILES` = 4 ô quanh cờ (`flagCapturers()`). Trinh sát cũng được tính (`FLAG_SCOUTS_CAPTURE`).
- Thời gian chiếm với n quân = `FLAG_CAPTURE_BASE_SECONDS` / min(n, `FLAG_CAPTURE_MAX_UNITS`)^`FLAG_CAPTURE_EXPONENT` (`captureSeconds()`):

| Số quân | 1 | 2 | 5 | 10 trở lên |
|---|---:|---:|---:|---:|
| Thời gian | 60 s | ~40 s | ~23 s | ~15 s |

- Chỉ một phe trong vòng:
  - **Cờ trung lập:** `r.cap` tăng tới 1, khi đó `r.owner = phe đó`.
  - **Cờ của địch:** `r.cap` tăng tới 1, khi đó cờ **về trung lập** (`owner = -1`) và việc chiếm tiếp tục từ 0. Tổng thời gian gấp đôi.
  - **Phe khác đang có tiến độ dở:** tiến độ của họ giảm về 0 trước, rồi mới tới lượt phe đang đứng.
  - **Chủ cờ đứng ở cờ của mình:** xoá tiến độ dở của đối phương với cùng tốc độ.
- Cả hai phe cùng ở trong vòng → `r.contested`, tiến độ **dừng**.
- Đối phương đứng ở cờ khi chủ cờ còn **tiền đồn** trong vùng (`regionOutpost()`) → cũng tính là tranh chấp. Phải phá tiền đồn trước.
- Không ai trong vòng → tiến độ **giữ nguyên**.
- Mỗi giây: `mine.owner = region.owner`; mỏ có chủ cộng `income` cho chủ.
- **Lãnh thổ** (`inOwnTerritory()`): vùng mình sở hữu (gồm vùng nhà) hoặc trong 14 ô quanh pháo đài. Nhà lính, chuồng ngựa và tháp chỉ xây được trong lãnh thổ.
- Công trình khác phải cách cờ ≥ 2,5 ô; tiền đồn ≥ 1,2 ô (`buildingPlacementProblem()`).

**Hiển thị**
- **Cờ (`drawFlag()`):**
  - Bệ đá, cột, lá cờ màu chủ (kem nếu trung lập) có biểu tượng tài nguyên. Cao khoảng 190 đơn vị, ngang cỡ pháo đài.
  - Khi thu nhỏ dưới zoom 0,3, cờ được phóng to theo (`flagScale()`, `FLAG_MIN_SCREEN_ZOOM`) và chữ giữ tối thiểu 11 px (`FLAG_LABEL_MIN_PX`).
  - Khi đang chiếm, màu phe chiếm phủ dần lá cờ từ phía cột; dưới bệ có thanh tiến độ (cam nếu đang tranh chấp).
  - Nhãn 2 dòng: dòng 1 ghi "CỜ XANH/ĐỎ/TRUNG LẬP · VÙNG …", dòng 2 ghi "ĐANG CHIẾM x%" / "ĐANG HẠ CỜ x%" / "TRANH CHẤP".
  - Vòng phạm vi chiếm hiện khi cờ được chọn, đang có tiến độ, hoặc đang tranh chấp.
  - Cờ chỉ vẽ ở chỗ phe mình đã khám phá.
- **Lớp lãnh thổ (`drawTerritory()`):**
  - Màu phe tô mờ trên vùng sở hữu (`regionTintCanvas`).
  - Ranh giới có độ dày tính theo **pixel màn hình**, nên không mỏng đi khi thu nhỏ: trung lập 3 px màu kem, vùng có chủ 5 px màu phe (`TERRITORY_BORDER_PX`, `TERRITORY_COLORS`). Bên dưới có nét tối rộng hơn 2,5 px để nổi trên nền sáng.
  - Chỉ vẽ cạnh mà một trong hai ô kề đã được khám phá. Lớp này vẽ trước quân và công trình nên không che chúng.
- **HUD "🚩 Lãnh thổ":** số vùng đang giữ và tổng thu từ mỏ mỗi phút (có cả lúa).

## Quyết định tạm (tài liệu 16/10 ghi "chưa chốt")
Đây là những điểm tài liệu 16/10 để ngỏ. Mỗi điểm đều là một hằng số hoặc một nhánh code nhỏ, dễ đổi khi đã chốt.
| Câu hỏi | Cách đang làm |
|---|---|
| 8.1 Chiếm cờ của địch: chiếm thẳng hay về trung lập trước? | Về trung lập trước |
| 8.2 Tiền đồn riêng hay nâng từ cột cờ? | Công trình riêng (`BUILDING_TYPES.outpost`) đặt cạnh cờ của vùng đã chiếm; giá/thời gian/máu như tiền đồn cũ; giữ cờ khi còn đứng |
| 8.3 Vùng lúa sinh lúa hay hỗ trợ nông trại? | Mỏ lúa sinh lúa trực tiếp, 30/phút, bằng mỏ gỗ (`MINE_TYPES.food`) |
| 8.4 Công thức, giới hạn, quân rời phạm vi, trinh sát | Theo số thử nghiệm: 60 / n^0,6, tối đa 10 quân; quân rời đi thì giữ tiến độ; trinh sát được tính |
| Vị trí nhà "ngẫu nhiên" | Vẫn giữ hai dải trái/phải; ngẫu nhiên trong dải |
| Cờ "to cỡ nhà chính" | Chỉ to về hình vẽ; quân đi xuyên qua được; công trình phải đứng cách cờ |

## Code liên quan
- [src/main.ts](../../src/main.ts):
  - Khối "Territory map": `regionMap` (Int16Array, **biến cấp module, không nằm trong `state`**), `buildRegionMap()`, `ensureRegionMap()`, `regionSeedKey()`, `walkDistances()`, `landPatchSizes()`, `generateRegions()`, `refreshRegionTint()`, `drawTerritory()`, `setShowTerritory()`; `regionEdges`, `regionEdgesByRegion`.
  - Trong `fresh()`: vòng chọn lại vị trí nhà; `baseSiteClear()`.
- Chiếm cờ: `updateCaptures()`, `captureSeconds()`, `flagCapturers()`, `regionOutpost()`.
- Vẽ: `drawFlag()`, `flagScale()`, `flagHit()` (vùng nhấp chọn cờ).
- Hằng số:
  - Sinh bản đồ: `REGION_TYPES`, `REGION_COUNT`, `REGION_MIN_BASE_TILES`, `MAP_FAIRNESS_TOLERANCE`, `MAP_GENERATION_TRIES`, `MIN_LAND_PATCH_TILES`, `BASE_SITE_MIN_CLEAR`.
  - Chiếm cờ: `FLAG_ENEMY_BASE_MIN_TILES`, `FLAG_CAPTURE_RADIUS_TILES`, `FLAG_CAPTURE_BASE_SECONDS`, `FLAG_CAPTURE_EXPONENT`, `FLAG_CAPTURE_MAX_UNITS`, `FLAG_SCOUTS_CAPTURE`.
  - Hiển thị: `FLAG_COLORS`, `FLAG_MIN_SCREEN_ZOOM`, `FLAG_LABEL_MIN_PX`, `RESOURCE_ICONS`, `TERRITORY_COLORS`, `TERRITORY_BORDER_PX`.
  - Khác: `HOME_TERRITORY_TILES`.
- Tra cứu: `regionAt(x, y)`, `inOwnTerritory()`, `regionLabel()`. Khám phá: `revealHomeTerritory()`, `revealCircle()`, `tilePassable()`.
- Dữ liệu:
  - `state.regions[] = {id, resource, sgx, sgy, home (null|0|1), owner (-1|0|1), cp: {x, y}|null, cap (0..1), capTeam (-1|0|1), contested}`.
  - `state.mines[] = {x, y, resource, rich, regionId, income (mỗi giây), owner}`.
- Biến giao diện `selectedFlag` (id vùng, chỉ ở máy người chơi). Nút `#toggleTerritory`; phím T trong `keydown`.

## Tương tác
- [buildings.md](buildings.md): tiền đồn giữ cờ; điều kiện lãnh thổ cho nhà lính/tháp; khoảng cách tới cờ.
- [economy.md](economy.md): mỏ sinh lúa/gỗ/đá/vàng; mỏ lúa tính vào `foodPerMinute()`.
- [fog-of-war.md](fog-of-war.md): cờ và ranh giới chỉ hiện ở chỗ đã khám phá.
- [ai-opponent.md](ai-opponent.md): AI cử nhóm quân đứng ở cờ.
- [controls.md](controls.md): nhấp chọn cờ, phím T.
- [match-flow.md](match-flow.md): vòng chọn vị trí nhà trong `fresh()`.

## Multiplayer
- `state.regions` (kèm ô hạt giống, `cap`, `capTeam`, `contested`) và `state.mines` đi qua snapshot, nên guest thấy màu cờ và tiến độ.
- `regionMap` thì **không** đi qua snapshot. Guest gọi `ensureRegionMap()` trong `applySnapshot()` để dựng lại bản đồ vùng từ các hạt giống (thuật toán tất định).
- Host quyết định việc chiếm. Guest xin xây tiền đồn bằng action `outpost {regionId}`.
- Log chiếm cờ chỉ hiện ở host (giới hạn chung của log, xem [multiplayer.md](multiplayer.md)).

## Kiểm thử thủ công
- [ ] Tạo nhiều trận mới: vị trí hai nhà thay đổi; 4 vùng gần mỗi nhà có đủ lúa, gỗ, đá, vàng; mỗi vùng chỉ một mỏ.
- [ ] Mỗi vùng thường có một cờ lớn ở gần giữa vùng, không nằm trên nước hoặc đá.
- [ ] Đưa 1 quân vào vòng cờ trung lập → khoảng 60 giây thì chiếm xong. 5 quân khoảng 23 giây. 10 quân trở lên khoảng 15 giây.
- [ ] Quân địch vào vòng → thanh cam, "TRANH CHẤP", tiến độ dừng. Rút hết quân → tiến độ giữ nguyên.
- [ ] Chiếm cờ địch → "ĐANG HẠ CỜ", về trung lập, rồi chiếm tiếp. Khi địch có tiền đồn ở vùng đó thì không chiếm được, phải phá tiền đồn trước.
- [ ] Chiếm xong → cờ đổi màu, viền vùng đổi màu, mỏ đổi "XANH", HUD lãnh thổ tăng.
- [ ] Nhấp cờ → vòng nét đứt và log thông tin. Viền vùng dày và rõ ở mọi mức zoom. Phím T ẩn/hiện lớp lãnh thổ.
- Đã chạy thử 2026-10-17 (Chrome headless + debugger):
  - Bản đồ: 40 bản đồ đều đạt các tiêu chí trên.
  - Chiếm cờ: 1 / 5 / 10 / 15 quân mất 60 / 22,9 / 15,1 / 15,1 giây; 1 trinh sát chiếm 17% trong 10 giây; tranh chấp giữ 32%; rút quân vẫn giữ 32%; cờ địch với 5 quân về trung lập ở giây 23 và đổi chủ ở giây 46; có tiền đồn thì 10 quân không chiếm được; chủ cờ xoá tiến độ dở của đối phương.
  - Ảnh chụp ở zoom mặc định và zoom xa: cờ và viền rõ.
  - AI tự chiếm được 8–10 vùng sau 8 phút.
  - PvP (2 trình duyệt): cờ trùng vị trí ở hai bên; guest thấy tiến độ 35%, chiếm xong HUD hiện 2 vùng; guest bấm "Xây tiền đồn" → host tạo tiền đồn, lần thứ hai cho cùng vùng bị từ chối.

## Giới hạn / việc tồn đọng
- Vị trí vùng không đối xứng; công bằng chỉ đo theo chi phí đi bộ tới cờ gần nhất của từng loại (độ lệch ≤ 0,3). Hai nhà vẫn ở hai dải trái/phải.
- Các thông số chiếm cờ và mỏ lúa là **thông số thử, chưa chốt** (xem "Quyết định tạm").
- Chưa có thưởng lãnh thổ (+10%); mỏ vô hạn; điều kiện thắng vẫn là phá pháo đài (câu hỏi mở).
- Thợ xây tiền đồn là "bất kỳ quân nào", chưa có loại quân thợ xây riêng.
- Sương mù không có trạng thái "đã khám phá nhưng không đang nhìn thấy", nên màu cờ ở chỗ đã khám phá luôn được cập nhật.
