# Kinh tế & tài nguyên

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

## Mô tả
Bốn tài nguyên: **lúa, gỗ, đá, vàng**. **Không có thu nhập nền**: lúa đến từ nông trại và mỏ lúa, gỗ/đá/vàng đến từ mỏ; mỏ chỉ sinh cho phe giữ **vùng đã chiếm cờ** (xem [territory.md](territory.md)). Mỗi phe sở hữu sẵn vùng nhà (vùng chứa pháo đài, có một mỏ gỗ) nên có +30 gỗ/phút ngay từ đầu trận.

Quân tiêu lúa liên tục (**lúa duy trì**); hết lúa thì quân bị **thiếu tiếp tế**. Thiết kế đầy đủ: [resource-system.md](resource-system.md).

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Tài nguyên ban đầu mỗi phe | 150 lúa, 400 gỗ, 50 đá, 50 vàng | `STARTING_RESOURCES` |
| Thu nhập nền | Không có | — |
| Nông trại | +20/30/45 lúa/phút theo cấp, chỉ khi đã xây xong | `FARM_LEVELS`, xem [farms.md](farms.md) |
| Chu kỳ cộng thu nhập | Mỗi 1 giây (`incomeTimer`) | `update()` |

**Loại mỏ** (`MINE_TYPES`):
| `resource` | Sản lượng | Nhãn trên bản đồ |
|---|---:|---|
| `food` | 15 lúa/phút; nông trại của chủ vùng trong vùng lúa +25% | MỎ LÚA +15/PHÚT |
| `wood` | 30 gỗ/phút | MỎ GỖ +30/PHÚT |
| `stone` | 20 đá/phút | MỎ ĐÁ +20/PHÚT |
| `gold` | 15 vàng/phút | MỎ VÀNG +15/PHÚT |
| mỏ giàu (`rich`) | × 1,5 (`RICH_MINE_MULTIPLIER`), có vòng vàng quanh mỏ | thêm chữ "GIÀU" |

**Mỏ**: mỗi vùng lãnh thổ có **đúng 1 mỏ**, cùng loại tài nguyên với vùng (lúa, gỗ, đá hoặc vàng); vùng gần giữa bản đồ có mỏ giàu. Gần mỗi nhà luôn có đủ 4 loại vùng. Cách sinh vùng và mỏ: [territory.md](territory.md).

**Lúa duy trì & thiếu tiếp tế** (`updateSupply(team)`, mỗi giây sau khi cộng thu nhập):
- Mỗi quân còn sống tiêu `specs[type].upkeep` lúa/phút (trinh sát 0,5; lính, lính giáo 1; cung thủ 1,5; kỵ binh 3), kể cả khi đứng yên. Quân trong hàng chờ xuất quân chưa tính.
- Lúa ròng/phút = `foodPerMinute(team)` (tổng `farmFoodPerMinute()` của nông trại đã xong — +25% nếu nằm trong vùng lúa mình giữ — cộng mỏ lúa của vùng mình) − `upkeepPerMinute(team)`.
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
- [src/main.ts](../../src/main.ts): hằng số `RESOURCE_NAMES`, `STARTING_RESOURCES`, `FORTRESS_GUN_COST`, `MINE_TYPES`, `RICH_MINE_MULTIPLIER` (ngay sau `specs`).
- Tiện ích tài nguyên: `teamResources(team)`, `canAfford(team, cost)`, `spend(team, cost)`, `costText(cost)`, `missingText(team, cost)`, `formatAmount(value)` (số thập phân kiểu Việt, dấu phẩy).
- Lúa duy trì: `foodPerMinute(team)`, `upkeepPerMinute(team)`, `updateSupply(team)`, `supplyFactor(team, kind)`; hằng số `SUPPLY_GRACE_SECONDS`, `SUPPLY_SPEED_FACTOR`, `SUPPLY_ATTACK_SPEED_FACTOR`; dữ liệu `state.supply[team] = {status: 'ok'|'warning'|'starving', grace}`. Giá luôn là object dạng `{food, wood, stone, gold}` (chỉ ghi khoá cần).
- Khối thu nhập trong `update()` (vòng `while(incomeTimer>=1)`).
- Sinh mỏ theo vùng trong `fresh()` — xem [territory.md](territory.md).
- Dữ liệu: `state.resources = [{food, wood, stone, gold}, {…}]` (chỉ số = team); `state.mines[] = {x, y, resource, rich, regionId, income (mỗi giây), owner(-1|0|1)}`.
- Vẽ mỏ: trong `draw()`; màu tinh thể theo `MINE_TYPES[resource].crystal`; mỏ chỉ hiện khi đã khám phá hoặc đang nhìn thấy.
- `state.guards` (quái canh mỏ) luôn rỗng — xem Giới hạn.

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
- [ ] Đầu trận HUD hiện 150 lúa, 400 gỗ, 50 đá, 50 vàng; không làm gì thì chỉ gỗ tăng (~30/phút từ vùng gần nhà).
- [ ] Xây 1 nông trại → lúa tăng ~20 mỗi phút.
- [ ] Đứng 1 quân ở cờ một vùng gỗ trung lập → ~60 giây sau nhãn mỏ đổi "XANH", gỗ tăng thêm ~30/phút.
- [ ] Chiếm vùng lúa → `#foodRate` tăng thêm 15/phút; nông trại đặt trong vùng đó sinh 25 thay vì 20 lúa/phút.
- [ ] Địch hạ cờ vùng mình → mỏ về "TRUNG LẬP", ngừng thu.
- [ ] Mỏ vàng giàu hiện "+23/PHÚT" (15 × 1,5 làm tròn) và có vòng vàng.
- [ ] Tuyển quân vượt sức nuôi của nông trại → HUD lúa hiện số ròng âm (màu cam); khi kho về 0 → log "Kho lúa đã cạn", HUD đếm ngược 30s; hết giờ → log thiếu tiếp tế, quân chậm rõ rệt.
- [ ] Xây thêm nông trại cho lúa ròng ≥ 0 → log "hết thiếu tiếp tế", tốc độ trở lại bình thường.
  (Đã chạy thử bằng debugger 2026-10-16: kỵ binh đi 49 đơn vị/giây khi thiếu tiếp tế, 58 khi bình thường.)

## Giới hạn / việc tồn đọng
- Gỗ là nút thắt đầu trận (≈ 30 gỗ/phút mỗi vùng gỗ) nên trận phát triển chậm; cần chạy thử nhiều trận để chỉnh `STARTING_RESOURCES` và sản lượng mỏ.
- `state.guards` và khối "Neutral monsters guarding the gold mines" trong `update()` là code chết: không nơi nào thêm quái canh mỏ.
- Không có giới hạn trần tài nguyên.
