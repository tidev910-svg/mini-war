# Vùng lãnh thổ & cột cờ

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-16

## Mô tả
Toàn bộ bản đồ được chia thành khoảng 20 **vùng lãnh thổ** có ranh giới tự nhiên (bám theo sông và vùng đá). Mỗi vùng có 1–2 mỏ (gỗ, đá hoặc vàng) và một **điểm chiếm** (vòng tròn có lá cờ nhỏ).

- **Vùng nhà**: vùng chứa pháo đài, thuộc về phe đó từ đầu trận, không ai cắm cờ được.
- **Chiếm vùng trung lập**: cắm cột cờ đúng điểm chiếm → cột cờ chỉ xây khi có **quân của mình đứng cạnh** (thợ xây) → xây xong (20 giây) → giữ thêm **10 giây** không có quân địch trong vùng → vùng thuộc về mình, mọi mỏ trong vùng tự sinh tài nguyên.
- Cột cờ (hoặc tiền đồn) bị phá → vùng về trung lập, ngừng sinh.
- Lớp lãnh thổ (màu phe, ranh giới, điểm chiếm) bật/tắt bằng phím **T** hoặc nút "Ranh giới vùng"; luôn hiện khi đang đặt cột cờ.

Nguồn thiết kế: "Thiết kế hệ thống tài nguyên" (15/10/2026) và "Thiết kế hệ thống lãnh thổ" (16/10/2026) — đối chiếu ở cuối file. Mỏ và cột cờ theo **phương án B** (chiếm vùng là có mọi mỏ trong vùng).

## Luật & thông số
**Sinh vùng** (`generateRegions()` trong `fresh()`):
| Bước | Chi tiết |
|---|---|
| Hạt giống | 2 vùng nhà đặt tại ô của pháo đài; tối đa 7 vùng gỗ (`forestRegions`), 6 đá (`rockRegions`), 7 vàng (`goldRegions`) — `REGION_TARGETS`; bỏ ứng viên cách pháo đài < 22 ô (`REGION_MIN_BASE_TILES`), chọn ngẫu nhiên trong số còn lại |
| Chia ô | Dijkstra nhiều nguồn trên lưới 256×256 (4 hướng). Chi phí vào ô: thường 1, đá 3, nước 6 → ranh giới chạy theo sông/đá. Mọi ô đều thuộc một vùng (`regionMap`) |
| Mỏ chính | Ô gần hạt giống nhất có 3×3 ô đi được, cùng vùng, cách mỏ khác ≥ 260; vùng nhà: cách pháo đài 9–16 ô; vùng khác: cách mỗi pháo đài ≥ 340. Loại mỏ = loại vùng. Vùng có hạt giống trong 15% quanh giữa bản đồ → mỏ giàu (× 1,5) |
| Mỏ phụ | 40% vùng thường (`SECOND_MINE_CHANCE`) có thêm 1 mỏ loại khác, cách mỏ chính ≥ 8 ô |
| Điểm chiếm | Ô gần hạt giống nhất có 3×3 ô đi được, cách mỏ ≥ 4 ô, cách **cả hai** pháo đài > 21 ô |
| Loại bỏ | Vùng không có mỏ hoặc (vùng thường) không có điểm chiếm bị bỏ; bản đồ dựng lại từ các hạt giống còn lại |
Kết quả chạy thử: 21 vùng (2 nhà, 7 gỗ, 7 vàng, 5 đá), 32 mỏ (11 vùng có 2 mỏ), không ô nào thiếu vùng, dựng bản đồ ~12 ms.

**Cột cờ & sở hữu**
- Đặt cột cờ (`buildingPlacementProblem()`): đúng điểm chiếm (lệch ≤ 4 đơn vị; khi rê chuột, cờ tự **hút** vào điểm chiếm trong bán kính 3 ô — `CAPTURE_POINT_SNAP_TILES`), vùng trung lập, không phải vùng nhà, chưa có cột cờ nào, cách pháo đài địch ≥ 20 ô (`FLAG_ENEMY_BASE_MIN_TILES`). Cột cờ được phép đặt dù có quân đứng ở đó.
- **Thợ xây**: cột cờ đang xây và tiền đồn đang nâng cấp chỉ tiến triển khi có ít nhất một quân còn sống của phe đó trong bán kính 4 ô (`BUILDER_RADIUS_TILES`, `hasBuilder()`); không có thì đứng yên (`b.waiting`, thanh xám, nhãn "CHỜ QUÂN XÂY"). Bất kỳ loại quân nào cũng là thợ xây; trong 120 giây khoá xuất quân chỉ trinh sát ra được. Đặt cột cờ khi đang chọn quân → quân đó tự được gửi tới.
- Xây xong → **chiếm**: `b.capture` 0 → 1 trong 10 giây (`FLAG_CAPTURE_SECONDS`, `updateCapture()`); có quân địch còn sống trong vùng (`unitInRegion()`) → `b.contested`, tiến trình **dừng** (không giảm, không đặt lại).
- Đủ 10 giây → `region.owner = team`. Chỉ nâng tiền đồn sau khi chiếm xong.
- Cột cờ/tiền đồn bị phá → `region.owner = -1`.
- Mỗi giây: `mine.owner = region.owner`; mỏ có chủ cộng `income` cho chủ. Mỗi mỏ thuộc đúng một vùng nên không cộng đôi.
- **Lãnh thổ** (`inOwnTerritory()`): vùng mình sở hữu (gồm vùng nhà) hoặc ≤ 14 ô quanh pháo đài. Nhà lính, chuồng ngựa, tháp chỉ xây trong lãnh thổ.

**Hiển thị** (`drawTerritory()`, bật/tắt bằng `showTerritory`)
- Màu phe tô mờ trên toàn vùng sở hữu (`regionTintCanvas` 256×256, vẽ lại khi chủ vùng đổi).
- Ranh giới: màu kem giữa mọi vùng, màu phe dày hơn quanh vùng có chủ; chỉ vẽ cạnh mà một trong hai ô kề đã được khám phá.
- Điểm chiếm: vòng nét đứt + lá cờ nhỏ (vàng đậm khi đang đặt cột cờ), ẩn khi đã có cột cờ.
- Nhãn mỏ: "XANH/ĐỎ/TRUNG LẬP · MỎ GỖ +30/PHÚT". Cột cờ đang chiếm: thanh màu phe (cam khi tranh chấp), nhãn "ĐANG CHIẾM"/"TRANH CHẤP".
- HUD "🚩 Lãnh thổ": số vùng đang giữ (từ 1) và tổng thu từ mỏ mỗi phút.

## Code liên quan
- [src/main.ts](../../src/main.ts), khối "Territory map": `regionMap` (Int16Array, **biến cấp module, không nằm trong `state`**), `buildRegionMap()`, `ensureRegionMap()`, `regionSeedKey()`, `generateRegions()`, `refreshRegionTint()`, `drawTerritory()`, `setShowTerritory()`; `regionEdges`, `regionEdgesByRegion`.
- Hằng số: `REGION_TARGETS`, `REGION_MIN_BASE_TILES`, `SECOND_MINE_CHANCE`, `CAPTURE_POINT_SNAP_TILES`, `BUILDER_RADIUS_TILES`, `FLAG_CAPTURE_SECONDS`, `FLAG_ENEMY_BASE_MIN_TILES`, `HOME_TERRITORY_TILES`; hạt giống lấy từ `forestRegions`, `rockRegions`, `goldRegions`.
- Tra cứu: `regionAt(x, y)` (tra `regionMap`), `unitInRegion(u, r)`, `inOwnTerritory()`, `regionLabel()`, `needsBuilder()`, `hasBuilder()`, `updateCapture()`.
- Khám phá: `revealHomeTerritory()`, `revealCircle()`, `tilePassable()`.
- Dữ liệu: `state.regions[] = {id, resource, sgx, sgy (ô hạt giống), home (null|0|1), owner (-1|0|1), cp: {x, y}|null}`; `state.mines[] = {x, y, resource, rich, regionId, income (mỗi giây), owner}`; cột cờ có thêm `capture`, `contested`, `waiting`.
- Nút `#toggleTerritory` trong [index.html](../../index.html); phím T trong `keydown`.

## Tương tác
- [buildings.md](buildings.md): cột cờ, tiền đồn, điều kiện lãnh thổ cho nhà lính/tháp.
- [economy.md](economy.md): mỏ sinh gỗ/đá/vàng.
- [fog-of-war.md](fog-of-war.md): ranh giới chỉ hiện ở chỗ đã khám phá; khu đất nhà khám phá sẵn.
- [ai-opponent.md](ai-opponent.md): AI chọn vùng theo điểm chiếm đã thấy và cử thợ xây.
- [controls.md](controls.md): phím T, cờ hút vào điểm chiếm, gửi quân đang chọn.
- [combat.md](combat.md): cột cờ là mục tiêu; quân địch trong vùng làm dừng việc chiếm.

## Multiplayer
`state.regions` (kèm ô hạt giống) và `state.mines` đi qua snapshot; `regionMap` thì **không**. Guest gọi `ensureRegionMap()` trong `applySnapshot()`: khi chuỗi hạt giống khác bản đã dựng, guest tự chạy lại `buildRegionMap()` và ra đúng bản đồ của host (thuật toán tất định). Host quyết định chủ vùng, thợ xây và tiến trình chiếm.

## Kiểm thử thủ công
- [ ] Đầu trận vùng nhà tô màu phe; HUD "Lãnh thổ 1 · +30 gỗ/phút", gỗ tăng ngay.
- [ ] Đi trinh sát: ranh giới vùng hiện dần theo vùng đã khám phá, chạy dọc sông/đá; thấy vòng điểm chiếm.
- [ ] Bấm "Cắm cột cờ", rê gần điểm chiếm → cờ hút vào; đặt lệch → bị chặn.
- [ ] Không có quân cạnh cột cờ → "CHỜ QUÂN XÂY", không tiến; đưa trinh sát tới → xây 20 giây rồi chiếm 10 giây.
- [ ] Quân địch vào vùng lúc đang chiếm → thanh cam, dừng; rút ra → chiếm xong.
- [ ] Phím T ẩn/hiện lớp lãnh thổ; đang đặt cột cờ thì lớp luôn hiện.
- Đã chạy thử 2026-10-16 (Chrome headless + debugger): sinh vùng như số liệu trên; cờ lệch điểm chiếm bị chặn; không thợ xây → tiến độ 0; có trinh sát → xây xong và chiếm vùng; nâng tiền đồn không có thợ xây → đứng yên; phím T và nút hoạt động; AI tự cử thợ xây và chiếm vùng gỗ ở phút 2,5; PvP: guest cắm cờ ở điểm chiếm, chiếm vùng, HUD guest đúng.

## Giới hạn / việc tồn đọng
- Hạt giống lấy từ bảng địa hình cố định; vị trí vùng không đối xứng giữa hai phe (vùng nhà bù một phần).
- Mỗi vùng tối đa 2 mỏ; chưa có thưởng lãnh thổ (+10%) — mặc định không.
- Thợ xây là "bất kỳ quân nào", chưa có loại quân thợ xây riêng.
- Mỏ vô hạn; điều kiện thắng vẫn là phá pháo đài (câu hỏi mở của thiết kế).

## Đối chiếu với "Thiết kế hệ thống lãnh thổ"
| Mục thiết kế | Trạng thái |
|---|---|
| 1. Vùng chứa nhà chính sở hữu sẵn, không bị lật bằng cờ | ✅ |
| 2. Đơn vị xây dựng đi tới điểm chiếm | ✅ Mọi quân đều là thợ xây; cột cờ chỉ xây khi có quân đứng cạnh |
| 3. Điểm chiếm cố định mỗi vùng | ✅ |
| 4. Chiếm 10 giây sau khi xây, dừng khi tranh chấp | ✅ (dừng, không giảm/không đặt lại) |
| 5. Cột cờ 100 gỗ, 20s, 500 máu, tầm nhìn 8 ô | ✅ |
| 6. Tiền đồn 200 gỗ + 100 đá, 40s, 1.500 máu, tầm nhìn 14 ô | ✅; tiền đồn **có súng** (thiết kế chưa quyết) |
| 7. Không cắm cờ trong ~20 ô quanh nhà chính địch | ✅ |
| 8. ~20 vùng bám địa hình (7 vàng, 6 đá, 7 gỗ), vùng có thể chứa mỏ khác loại | ✅ (thực tế 19–20 vùng thường + 2 vùng nhà) |
| 9. Thưởng +10% sản lượng | ❌ Không làm (đã chốt mặc định: không) |
| 10. Lớp ranh giới bật/tắt | ✅ Phím T / nút |
| Câu hỏi mở: mỏ cạn dần? điều kiện thắng theo vùng? | Chưa quyết — mỏ vô hạn, thắng bằng phá pháo đài |
