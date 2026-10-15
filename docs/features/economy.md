# Kinh tế & mỏ vàng

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-15

## Mô tả
Hai tài nguyên: **vàng** và **năng lượng**. Cả hai tăng đều theo thời gian. Vàng tăng thêm nhờ nông trại và mỏ. Mỗi trận có 3 mỏ đặt ngẫu nhiên; phe có nhiều quân đứng cạnh mỏ hơn sẽ chiếm mỏ.

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Vàng / năng lượng ban đầu | 150 / 100 mỗi phe | `fresh()` |
| Thu nhập nền | +8 vàng, +5 năng lượng mỗi giây mỗi phe | `update()` |
| Nông trại | +2 vàng/giây mỗi nông trại còn HP | `update()`, xem [farms.md](farms.md) |
| Bán kính chiếm mỏ | 58 đơn vị thế giới | `update()` |
| Mất quyền sở hữu khi bỏ trống/hoà | sau 5 giây liên tục | `mine.emptyTime` |

Ba mỏ (tạo trong `fresh()`):
| `kind` | Thu nhập/giây | Ghi chú | Nhãn trên bản đồ |
|---|---:|---|---|
| `ordinary` | +3 vàng | vị trí ngẫu nhiên | MỎ THƯỜNG +3 |
| `rich` | +5 vàng | ưu tiên ô tài nguyên gần tâm bản đồ (±15%) | MỎ GIÀU +5 |
| `special` | +3 vàng | giữ liên tục 30 giây → thưởng **+25 năng lượng** một lần cho mỗi lần chiếm | MỎ ĐẶC BIỆT +3 |

Đặt mỏ: chọn ngẫu nhiên trong `resourceTiles` (ô địa hình loại 4), cách mỗi pháo đài ≥ 340 và cách mỏ khác ≥ 380 (tối đa 160 lần thử).

Chiếm mỏ (mỗi giây, `update()`): đếm quân còn sống của mỗi phe trong bán kính 58.
- Bên nhiều hơn → `controller`. Nếu khác chủ cũ: đổi `owner`, reset `controlTime`, `rewarded=false`.
- Hoà/không ai → `emptyTime++`, `controlTime=0`; `emptyTime ≥ 5` → `owner=-1` (trung lập). Trong 5 giây đó nhãn vẫn hiện chủ cũ nhưng mỏ **không** trả tiền (chỉ trả khi có `controller`).
- Mỗi giây có `controller`: cộng `income` cho chủ mỏ.

## Code liên quan
- [src/main.ts](../../src/main.ts): khối thu nhập trong `update()` (vòng `while(incomeTimer>=1)`).
- `fresh()` → `randomMineSpot()`, `stateBaseTooClose()`.
- `teamGold()`, `setTeamGold()`, `teamEnergy()`, `setTeamEnergy()`.
- Dữ liệu mỏ: `state.mines[] = {x, y, kind, income, owner(-1|0|1), emptyTime, controlTime, rewarded}`.
- Vẽ mỏ: trong `draw()`; mỏ chỉ hiện khi đã khám phá hoặc đang nhìn thấy.
- `state.guards` (quái canh mỏ) luôn rỗng — xem Giới hạn.

## Tương tác
- [farms.md](farms.md), [units.md](units.md), [fortress.md](fortress.md): nơi tiêu vàng/năng lượng.
- [fog-of-war.md](fog-of-war.md): mỏ chưa khám phá bị che.
- [ai-opponent.md](ai-opponent.md): quân AI rảnh sẽ đi chiếm mỏ không thuộc phe đỏ.

## Multiplayer
Chỉ host tính thu nhập; guest nhận tài nguyên qua snapshot.

## Kiểm thử thủ công
- [ ] Sau 10 giây không làm gì, vàng tăng ~80, năng lượng ~50.
- [ ] Đưa 1 lính tới mỏ thường → nhãn đổi "XANH", vàng tăng thêm 3/giây.
- [ ] Giữ mỏ đặc biệt 30 giây → log "+25 năng lượng" đúng một lần.
- [ ] Rút quân khỏi mỏ → sau 5 giây mỏ về "TRUNG LẬP".

## Giới hạn / việc tồn đọng
- `state.guards` và khối "Neutral monsters guarding the gold mines" trong `update()` là code chết: không nơi nào thêm quái canh mỏ.
- Không có giới hạn trần tài nguyên.
