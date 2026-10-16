# Vùng lãnh thổ & cột cờ

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-16

## Mô tả
Bản đồ có các **vùng tài nguyên** (viền nét đứt hình elip): vùng gỗ, vùng đá, vùng vàng. Mỗi vùng có một mỏ. Cắm **cột cờ** trong vùng trung lập, đợi xây xong (20 giây) rồi **chiếm thêm 10 giây** không bị tranh chấp → vùng thuộc về phe mình, mọi mỏ trong vùng tự sinh tài nguyên. Cột cờ (hoặc tiền đồn) bị phá → vùng về trung lập, ngừng sinh. Đây là phương án B trong [resource-system.md](resource-system.md); luật cũ "đứng nhiều quân hơn cạnh mỏ để chiếm" đã bỏ.

**Vùng gỗ gần nhà** của mỗi phe thuộc về phe đó ngay từ đầu trận và không thể bị cắm cờ chiếm. Ngoài các vùng, **khu đất nhà** (14 ô quanh pháo đài) luôn là lãnh thổ của phe đó và được khám phá sẵn từ đầu trận.

Nguồn thiết kế: tài liệu "Thiết kế hệ thống tài nguyên" (15/10/2026) và "Thiết kế hệ thống lãnh thổ" (áp dụng các mục 1, 4, 5–6, 7 ngày 16/10/2026 — xem bảng cuối file).

## Luật & thông số
**Sinh vùng** (`fresh()`), vị trí tâm cố định theo địa hình, chỉ vùng nhà là ngẫu nhiên:
| Nguồn | Số vùng | Loại | Kích thước |
|---|---:|---|---|
| Vùng gỗ gần nhà (`home` = 0/1) | 2 | gỗ | tròn bán kính 5 ô (`HOME_REGION_TILES`), tâm cách pháo đài 10–14 ô về phía giữa bản đồ; **sở hữu sẵn** (`owner` = phe đó) |
| `forestRegions` | 12 | gỗ | elip theo bảng × 0,8 |
| `rockRegions` | 6 | đá | elip theo bảng × 0,8 |
| `goldRegions` | 8 | vàng | elip theo bảng × 0,8 |
- Mỗi vùng một mỏ, đặt trên ô đi được: thử gần tâm trước (≤ 45% bán kính), rồi ra tới rìa (≤ 95%); cách pháo đài ≥ 340 và cách mỏ khác ≥ 260. Vùng nhà đặt mỏ ngay tâm.
- Vùng không đặt được mỏ bị bỏ và đánh số lại (`regions[id]` luôn đúng). Khi chạy thử: đủ 28 vùng (14 gỗ, 6 đá, 8 vàng).
- Mỏ trong vùng có tâm nằm trong 15% quanh giữa bản đồ là **mỏ giàu** (× 1,5).
- Một điểm thuộc vùng nhà nếu nằm trong vùng nhà; nếu không, thuộc vùng có khoảng cách chuẩn hoá tới tâm nhỏ nhất trong các vùng chứa nó (`regionAt()`).

**Sở hữu**
- Vùng gần nhà: sở hữu sẵn, không ai cắm cờ được (`buildingPlacementProblem()` báo "Vùng gần nhà luôn thuộc phe sở hữu…").
- Đặt cột cờ: trong một vùng có `owner = -1`, chưa có cột cờ nào của bất kỳ phe nào (kể cả đang xây/đang chiếm), và **cách pháo đài địch ≥ 20 ô** (`FLAG_ENEMY_BASE_MIN_TILES`). Điều kiện đặt chung ở [buildings.md](buildings.md).
- Cột cờ xây xong → bắt đầu **chiếm**: `b.capture` tăng từ 0 lên 1 trong `FLAG_CAPTURE_SECONDS` = 10 giây (`updateCapture()`).
  - Có quân địch còn sống **trong elip của vùng** (`unitInRegion()`) → `b.contested = true`, tiến trình **dừng** (không giảm, không đặt lại); log "Đang bị tranh chấp…" một lần mỗi đợt.
  - Đủ 10 giây → `region.owner = team` (log "Đã chiếm vùng …").
- Chỉ nâng cột cờ thành tiền đồn sau khi đã chiếm xong vùng.
- Cột cờ/tiền đồn bị phá (kể cả khi đang chiếm) → vùng về `owner = -1` (log "Mất vùng …" / "Đã phá … địch").
- Mỗi giây: `mine.owner = region.owner`; mỏ có chủ cộng `income` loại tài nguyên của nó cho chủ. Một mỏ chỉ thuộc đúng một vùng nên không bị cộng đôi.
- **Lãnh thổ** (`inOwnTerritory()`): ≤ 14 ô quanh pháo đài (`HOME_TERRITORY_TILES`) hoặc trong vùng mình sở hữu (gồm vùng gần nhà). Nhà lính, chuồng ngựa, tháp chỉ xây trong lãnh thổ.

**Hiển thị**
- Viền vùng hiện khi mỏ của vùng đã được khám phá: trung lập màu kem, xanh/đỏ theo chủ (có tô mờ).
- Cột cờ đang chiếm: thanh tiến trình màu phe (cam khi bị tranh chấp), nhãn "CỘT CỜ · ĐANG CHIẾM" / "· TRANH CHẤP"; chọn cột cờ thì log hiện phần trăm.
- Nhãn mỏ: "XANH/ĐỎ/TRUNG LẬP · MỎ GỖ +30/PHÚT".
- HUD ô "🚩 Lãnh thổ": số vùng đang giữ và tổng thu từ mỏ mỗi phút (xem [hud-ui.md](hud-ui.md)).

## Code liên quan
- [src/main.ts](../../src/main.ts): `forestRegions`, `rockRegions`, `goldRegions` (đầu file, cũng dùng cho `buildTerrain()`); sinh vùng và mỏ trong `fresh()` (`homeRegionCenter()`, `addRegion()`).
- `regionAt(x, y)`, `inOwnTerritory(team, x, y)`, `regionLabel(r)`, `revealHomeTerritory()`, `revealCircle()`, `tilePassable()`, `unitInRegion(u, r)`.
- Chiếm vùng: `updateCapture(b, dt)` (gọi trong `updateBuildings()`), hằng số `FLAG_CAPTURE_SECONDS`, `FLAG_ENEMY_BASE_MIN_TILES`; trường cột cờ `capture` (0..1), `contested`.
- Cột cờ: `kind: 'flag'` trong [buildings.md](buildings.md); `completeBuilding()` bắt đầu chiếm, `updateCapture()` đổi chủ, `destroyBuilding()` trả vùng về trung lập.
- Thu nhập mỏ: khối "Mines pay whoever owns their region" trong `update()`.
- Vẽ viền vùng: đầu phần vẽ mỏ trong `draw()`.
- Dữ liệu: `state.regions[] = {id, resource, cx, cy, rx, ry, home (null|0|1), owner (-1|0|1)}` (vùng nhà khởi tạo với `owner = home`); `state.mines[] = {x, y, resource, rich, regionId, income (mỗi giây), owner}`.

## Tương tác
- [buildings.md](buildings.md): cột cờ, tiền đồn, điều kiện lãnh thổ cho nhà lính/tháp.
- [economy.md](economy.md): mỏ sinh gỗ/đá/vàng.
- [fog-of-war.md](fog-of-war.md): khu đất nhà khám phá sẵn; viền vùng chỉ hiện khi đã thấy mỏ.
- [ai-opponent.md](ai-opponent.md): AI cắm cờ theo thứ tự ưu tiên; quân AI rảnh đi tới mỏ chưa thuộc phe đỏ (và đánh cột cờ địch ở đó).
- [combat.md](combat.md): cột cờ là mục tiêu.

## Multiplayer
`state.regions` và `state.mines` đi qua snapshot. Host quyết định chủ vùng. Guest xoá sương mù của bản đồ riêng trước khi vào phòng rồi gọi `revealHomeTerritory()` với vị trí pháo đài thật của host.

## Kiểm thử thủ công
- [ ] Đầu trận: khu đất nhà sáng, vùng gỗ gần nhà tô màu phe; HUD "Lãnh thổ 1 · +30 gỗ/phút", gỗ tăng ngay.
- [ ] Cắm cờ trong vùng gần nhà → bị chặn; cắm cờ trong vòng 20 ô quanh pháo đài địch → bị chặn.
- [ ] Cắm cờ ở vùng trung lập → 20 giây xây + 10 giây chiếm; đưa quân địch vào vùng giữa chừng → thanh chiếm chuyển cam và đứng yên; rút quân → chiếm xong.
- [ ] Cắm cờ lần hai trong cùng vùng → bị chặn "Vùng này đã có cột cờ".
- [ ] Phá cột cờ → vùng về trung lập, HUD giảm.
- Đã chạy thử 2026-10-16 (Chrome headless + debugger): vùng nhà sở hữu sẵn; luật 20 ô (261/271 điểm thử bị chặn đúng lý do, còn lại do sân tập kết/công trình); chiếm 51% → có lính đỏ trong vùng thì dừng ở 51% → rút lính thì chiếm xong; tiền đồn 1500 máu, tầm nhìn 14 ô; PvP: guest chiếm vùng vàng, HUD guest "Lãnh thổ 2 · +30 gỗ · +15 vàng/phút".

## Giới hạn / việc tồn đọng
- Vị trí vùng cố định theo bảng địa hình, không đối xứng giữa hai phe; vùng nhà bù một phần.
- Vùng elip lớn chồng lên nhau; điểm chồng thuộc vùng có tâm gần hơn (theo tỉ lệ), người chơi có thể khó đoán.
- Chưa có thưởng lãnh thổ (thiết kế để mặc định: không).
- Viền vùng chỉ hiện sau khi thấy mỏ, nên vùng lớn có thể được đi qua mà không thấy viền.

## Đối chiếu với "Thiết kế hệ thống lãnh thổ"
| Mục thiết kế | Trạng thái |
|---|---|
| 1. Vùng nhà sở hữu sẵn, không bị lật bằng cờ | ✅ Đã làm (vùng gỗ gần nhà; vùng thiết kế "chứa nhà chính" ứng với khu đất nhà 14 ô) |
| 2. Đơn vị xây dựng đi tới điểm chiếm | ❌ Chưa làm — không có đơn vị xây; công trình đặt từ xa trên vùng đã khám phá |
| 3. Điểm chiếm cố định mỗi vùng | ❌ Chưa làm — cờ đặt chỗ nào trong vùng cũng được |
| 4. Chiếm 10 giây sau khi xây, dừng khi tranh chấp | ✅ Đã làm (dừng, không giảm/không đặt lại) |
| 5. Cột cờ 100 gỗ, 20s, 500 máu, tầm nhìn 8 ô | ✅ Đã làm |
| 6. Tiền đồn 200 gỗ + 100 đá, 40s, 1.500 máu, tầm nhìn 14 ô | ✅ Đã làm; tiền đồn **có súng** (thiết kế chưa quyết) |
| 7. Không cắm cờ trong ~20 ô quanh nhà chính địch | ✅ Đã làm |
| 8. ~20 vùng bám địa hình, nhiều mỏ mỗi vùng | ❌ Chưa làm — 28 vùng elip, 1 mỏ/vùng |
| 9. Thưởng +10% sản lượng | ❌ Không làm (đã chốt mặc định: không) |
| 10. Lớp ranh giới bật/tắt | ❌ Chưa làm |
| Câu hỏi mở: mỏ cạn dần? điều kiện thắng theo vùng? | Chưa quyết — hiện mỏ vô hạn, thắng bằng phá pháo đài |
