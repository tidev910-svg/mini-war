# Kinh tế & tài nguyên

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-22

## Mô tả
Bốn tài nguyên: **lúa, gỗ, đá, vàng**. Ba nguồn thu cộng dồn:
- **Pháo đài:** luôn sinh 40 lúa, 30 gỗ, 10 đá, 10 vàng mỗi phút từ giây đầu tiên, kể cả khi không có lãnh thổ (cân bằng V3.1). Không tăng theo thời gian. Mất hết đất mà còn pháo đài thì vẫn tuyển được quân để phản công.
- **Nông trại:** sinh lúa.
- **Mỏ:** mỗi vùng có cờ có một mỏ cùng loại, chỉ sinh cho phe đang giữ vùng (xem [territory.md](territory.md)). Vùng nhà **không có mỏ**: thu nhập pháo đài thay cho mỏ gỗ cũ của vùng nhà, nên không bị cộng trùng.

Nguồn: **"Cân bằng game V3.1 — bản thử nghiệm"** (19/10/2026; mục tiêu trận 15–20 phút), thay cho các mức của "Yêu cầu sửa đổi V2" (18/10). Hàng đợi tuyển quân V2 giữ nguyên. Đây là bộ số **để chơi thử**, chưa khoá chính thức.

**Công thức thu nhập mỗi phút (V3.1)**: thu nhập ròng = nhà chính + lãnh thổ đang giữ + công trình − tiêu thụ (lúa nuôi quân chỉ trừ vào lúa).
```text
Lúa  = 40 (nhà chính) + 45 × số vùng lúa đang giữ + Σ nông trại (35 / 50 / 70 theo cấp — tổng ở mỗi cấp, +25% nếu trong vùng lúa của mình) − lúa nuôi quân
Gỗ   = 30 (nhà chính) + 45 × số vùng gỗ đang giữ
Đá   = 10 (nhà chính) + 35 × số vùng đá đang giữ
Vàng = 10 (nhà chính) + 35 × số vùng vàng đang giữ
```
Ví dụ: giữ 2 vùng gỗ, 1 vùng đá, 1 vùng vàng, không nông trại, không quân → 40 lúa, 120 gỗ, 45 đá, 45 vàng mỗi phút.

Quân tiêu lúa liên tục (**lúa duy trì**); hết lúa thì quân bị **thiếu tiếp tế**. Thiết kế đầy đủ: [resource-system.md](resource-system.md).

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Tài nguyên ban đầu mỗi phe | 200 lúa, 250 gỗ, 75 đá, 75 vàng | `STARTING_RESOURCES` |
| Thu nhập pháo đài | 40 lúa, 30 gỗ, 10 đá, 10 vàng mỗi phút cho mỗi pháo đài còn đứng | `FORTRESS_INCOME_PER_MINUTE` |
| Nông trại | 35 / 50 / 70 lúa/phút ở cấp 1 / 2 / 3 (tổng ở mỗi cấp, không cộng dồn), chỉ khi đã xây xong; giá 120 gỗ, nâng cấp 100 gỗ + 40 đá / 160 gỗ + 80 đá | `FARM_LEVELS`, xem [farms.md](farms.md) |
| Chu kỳ cộng thu nhập | Mỗi 1 giây (`incomeTimer`) | `update()` |

**Loại mỏ** (`MINE_TYPES`):
| `resource` | Sản lượng | Nhãn trên bản đồ |
|---|---:|---|
| `food` | 45 lúa/phút; nông trại của chủ vùng trong vùng lúa +25% | MỎ LÚA +45/PHÚT |
| `wood` | 45 gỗ/phút | MỎ GỖ +45/PHÚT |
| `stone` | 35 đá/phút | MỎ ĐÁ +35/PHÚT |
| `gold` | 35 vàng/phút | MỎ VÀNG +35/PHÚT |

**Mỏ**: mỗi vùng có cờ có **đúng 1 mỏ** (vùng nhà không có), cùng loại tài nguyên với vùng (lúa, gỗ, đá hoặc vàng). **Mọi vùng cùng loại sinh đúng một mức cố định**, ở đâu cũng vậy: mỏ giàu (× 1,5 ở giữa bản đồ) đã bỏ ngày 2026-10-18 theo tài liệu "Cơ chế sinh tài nguyên lãnh thổ". Gần mỗi nhà luôn có đủ 4 loại vùng. Cách sinh vùng và mỏ: [territory.md](territory.md).

**Lúa duy trì & thiếu tiếp tế** (`updateSupply(team)`, mỗi giây sau khi cộng thu nhập):
- Mỗi quân còn sống tiêu `specs[type].upkeep` lúa/phút (trinh sát 0,5; lính, lính giáo 1; cung thủ 1,5; kỵ binh 3), kể cả khi đứng yên. Quân đang huấn luyện hoặc trong hàng chờ xuất quân chưa tính.
- Lúa ròng/phút = `foodPerMinute(team)` (25 lúa của pháo đài, cộng tổng `farmFoodPerMinute()` của nông trại đã xong — +25% nếu nằm trong vùng lúa mình giữ — cộng mỏ lúa của vùng mình) − `upkeepPerMinute(team)`.
- Mỗi giây trừ `upkeep/60` khỏi kho; kho không đủ thì về 0.
- `state.supply[team] = {status, grace}`:

| Trạng thái | Vào khi | Hiệu ứng | Ra khi |
|---|---|---|---|
| `ok` | — | — | — |
| `warning` | Kho không đủ trả và lúa ròng < 0 | Đếm ngược `SUPPLY_GRACE_SECONDS` = 30 giây | Lúa ròng ≥ 0 → `ok` |
| `starving` | Hết 30 giây ân hạn | Tốc độ di chuyển × `SUPPLY_SPEED_FACTOR` (0,85); hồi chiêu ÷ `SUPPLY_ATTACK_SPEED_FACTOR` (0,9) → −10% tốc độ đánh | Lúa ròng ≥ 0 → `ok` |

Chỉ thoát khi **nông trại đủ nuôi quân** (lúa ròng ≥ 0), không phải khi kho tạm có lúa, nên trạng thái không bật tắt liên tục. Pháo pháo đài không bị ảnh hưởng.

**Thu từ mỏ** (mỗi giây, `update()`): `mine.owner = region.owner`; mỏ có chủ cộng `income` (mỗi giây) loại tài nguyên của mỏ cho chủ. Chủ vùng do việc chiếm cờ quyết định. Mỏ lúa cũng được cộng vào `foodPerMinute()`, nên tính vào lúa ròng, HUD `#foodRate`, điều kiện thoát thiếu tiếp tế và tính toán lúa của AI.

## Code liên quan
- [src/config/balance.ts](../../src/config/balance.ts): hằng số `RESOURCE_NAMES`, `STARTING_RESOURCES`, `FORTRESS_GUN_COST`, `MINE_TYPES` (ngay sau `specs`).
- Tiện ích tài nguyên: `teamResources(team)`, `canAfford(team, cost)`, `spend(team, cost)`, `costText(cost)`, `missingText(team, cost)`, `formatAmount(value)` (số thập phân kiểu Việt, dấu phẩy).
- Lúa duy trì: `foodPerMinute(team)`, `upkeepPerMinute(team)` (tính cả quân đồn trú trong cờ, [flag-defense.md](flag-defense.md)), `updateSupply(team)`, `supplyFactor(team, kind)`; hằng số `SUPPLY_GRACE_SECONDS`, `SUPPLY_SPEED_FACTOR`, `SUPPLY_ATTACK_SPEED_FACTOR`; dữ liệu `state.supply[team] = {status: 'ok'|'warning'|'starving', grace}`. Giá luôn là object dạng `{food, wood, stone, gold}` (chỉ ghi khoá cần).
- Khối thu nhập trong `update()` (vòng `while(incomeTimer>=1)`).
- Sinh mỏ theo vùng trong `fresh()` — xem [territory.md](territory.md).
- Dữ liệu: `state.resources = [{food, wood, stone, gold}, {…}]` (chỉ số = team); `state.mines[] = {x, y, resource, regionId, income (mỗi giây), owner(-1|0|1)}`.
- Vẽ mỏ: trong `draw()`; màu tinh thể theo `MINE_TYPES[resource].crystal`; mỏ chỉ hiện khi đã khám phá hoặc đang nhìn thấy.
- Hang quái trung lập thưởng tài nguyên thẳng vào kho ([neutral-camps.md](neutral-camps.md)).

## Tương tác
- [resource-system.md](resource-system.md): thiết kế đầy đủ và các giai đoạn tiếp theo.
- [farms.md](farms.md), [units.md](units.md), [fortress.md](fortress.md): nơi tiêu tài nguyên.
- [fog-of-war.md](fog-of-war.md): mỏ chưa khám phá bị che.
- [territory.md](territory.md): vùng, cột cờ, sở hữu mỏ.
- [buildings.md](buildings.md): giá công trình.
- [ai-opponent.md](ai-opponent.md): AI quản lý kinh tế.
- [hud-ui.md](hud-ui.md): 4 ô tài nguyên.

## Multiplayer
Chỉ host tính thu nhập, lúa duy trì và thiếu tiếp tế; `state.resources` và `state.supply` đi qua snapshot, guest hiển thị phần tử `[1]`. Log cảnh báo thiếu tiếp tế chỉ hiện ở host (guest vẫn thấy trạng thái trên HUD).

## Kiểm thử thủ công
- [ ] Đầu trận HUD hiện 200 lúa, 250 gỗ, 75 đá, 75 vàng, `#foodRate` "+40 −0 = +40/phút" (thu nhập gộp − tiêu hao quân = ròng); không làm gì thì mỗi phút được 40 lúa, 30 gỗ, 10 đá, 10 vàng.
- Đã chạy thử 2026-10-17: kho về 0, không lãnh thổ, không quân, chạy 120 giây → mỗi phe đúng 50 lúa, 40 gỗ, 16 đá, 16 vàng; vùng nhà 0 mỏ, 20 mỏ ở 20 vùng; mỏ thường lúa 25, gỗ 30, đá 20, vàng 20/phút; chiếm vùng đá → chỉ phe giữ nhận 0,333 đá/giây, đổi chủ thì chuyển hẳn.
- [ ] Xây 1 nông trại → lúa tăng ~20 mỗi phút.
- [ ] Đứng 1 quân ở cờ một vùng gỗ trung lập → ~60 giây sau nhãn mỏ đổi "XANH", gỗ tăng thêm ~30/phút.
- [ ] Chiếm vùng lúa → `#foodRate` tăng thêm 25/phút; nông trại đặt trong vùng đó sinh 25 thay vì 20 lúa/phút.
- [ ] Địch hạ cờ vùng mình → mỏ về "TRUNG LẬP", ngừng thu.
- [ ] Mỏ vàng nào cũng hiện "+20/PHÚT", kể cả ở giữa bản đồ.
- [ ] Tuyển quân vượt sức nuôi của nông trại → HUD lúa hiện số ròng âm (màu cam); khi kho về 0 → log "Kho lúa đã cạn", HUD đếm ngược 30s; hết giờ → log thiếu tiếp tế, quân chậm rõ rệt.
- [ ] Xây thêm nông trại cho lúa ròng ≥ 0 → log "hết thiếu tiếp tế", tốc độ trở lại bình thường.
  (Đã chạy thử bằng debugger 2026-10-16: kỵ binh đi 49 đơn vị/giây khi thiếu tiếp tế, 58 khi bình thường.)
- Đã kiểm thử V3.1 2026-10-19 (`tests/economy.test.ts`, `pnpm smoke economy`): 0 vùng → 40/30/10/10 mỗi phút; 1 vùng gỗ → +45 gỗ chỉ cho chủ, đổi chủ thì chuyển hẳn; nông trại 120 gỗ, xong sau 3 giây thêm +35 lúa; ví dụ 2 gỗ + 1 đá + 1 vàng → 40/120/45/45; AI tự chơi 8 phút vẫn chạy.
- (V2) Đã kiểm thử V2 2026-10-18 (`tests/economy.test.ts`, `pnpm smoke economy`): 0 vùng → 80/50/15/20 mỗi phút; 1 vùng gỗ → +100 gỗ chỉ cho chủ, đổi chủ thì chuyển hẳn; nông trại xong sau 3 giây thêm +60 lúa; ví dụ 2 gỗ + 1 đá + 1 vàng → 80/250/55/90.
- (Trước V2) Đã đối chiếu 2026-10-18 với tài liệu "Cơ chế sinh tài nguyên lãnh thổ" (mục 7, trên 30 bản đồ):
  - Luôn 20 vùng có cờ, mỗi vùng 1 loại tài nguyên + 1 cờ + 1 mỏ; nhà nào cũng đi bộ tới được đủ 4 loại.
  - Vùng trung lập không sinh gì; đổi chủ thì thu nhập chuyển hẳn sang chủ mới.
  - Chạy ở 144 FPS hay 20 FPS đều ra đúng mức mỗi phút; 0 vùng vẫn có thu nhập nhà chính, mất nhà chính thì khoản này dừng.
  - Unit test mới: mọi vùng cùng loại có đúng một mức; ví dụ 2 gỗ + 1 đá + 1 vàng → 25/80/28/28.

## Giới hạn / việc tồn đọng
- Bộ số V3.1 là đề xuất để chơi thử (mục tiêu trận 15–20 phút): cần 10–20 trận giữa người chơi cùng trình độ, ghi thời lượng, số quân, tài nguyên dư, tỉ lệ thắng của từng chiến thuật. Máu, sát thương, tốc độ huấn luyện và sức mạnh pháo chưa cân bằng lại.
- Nông trại lệch với công thức của tài liệu 18/10 ("20 × số nông trại"): còn nâng cấp cấp 2/3 và thưởng +25% trong vùng lúa. Đã quyết định giữ nguyên ngày 2026-10-18.
- Không có giới hạn trần tài nguyên.
