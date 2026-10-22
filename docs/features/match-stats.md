# Thống kê cuối trận

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-22

## Mô tả
Khi trận kết thúc, hộp kết quả (`#overlay`) hiện thêm bảng so sánh hai phe và hai biểu đồ theo thời gian, để người chơi thấy vì sao thắng/thua và để ghi số liệu khi chơi thử cân bằng. Nút "⧉ Sao chép số liệu" chép toàn bộ số liệu dạng JSON.

Bảng gồm: thời lượng trận; quân đã tuyển, quân mất, hạ gục, sát thương gây ra, quân đông nhất; công trình xây / bị phá; vùng giữ cuối trận; thu / tiêu từng tài nguyên; tổng tài nguyên thu. Cột trái luôn là phe của người xem ("(bạn)").

Biểu đồ: **Số vùng** (kể cả vùng nhà) và **Quân số** (quân còn sống) của hai phe; đường của mình đậm hơn.

## Luật & thông số
| Thông số | Giá trị | Nguồn trong code |
|---|---:|---|
| Khoảng lấy mẫu biểu đồ | 10 giây (thêm 1 mẫu đầu trận và 1 mẫu lúc kết thúc) | `STATS_SAMPLE_SECONDS` |
| Thu tài nguyên | thu nhập pháo đài + nông trại + mỏ/vùng, cộng mỗi giây | `recordGathered()` trong vòng thu nhập của `update()` |
| Tiêu tài nguyên | mọi khoản đi qua `spend()` (quân, công trình, nâng cấp, mở hàng đợi) | `spend()` |
| Quân đã tuyển | tính khi quân ra khỏi hàng đợi | `recordTrained()` trong `updateTraining()` |
| Sát thương | chỉ tính phần máu thực sự mất (đòn thừa không tính) | `recordDamage()` trong `hurt()` |
| Quân mất / hạ gục | chết trong giao tranh: bên chết +1 mất, bên đánh +1 hạ gục; xoá quân (Delete) chỉ tính mất | `recordUnitDeath()` |
| Công trình xây / bị phá | đặt công trình (kể cả chưa xây xong) / công trình bị phá | `recordBuilt()`, `recordBuildingLost()` |
| Hang quái đã dọn | phe nhận thưởng của hang +1; phần thưởng tính vào "đã thu"; sát thương vào quái không tính vào "Sát thương gây ra" ([neutral-camps.md](neutral-camps.md)) | `recordCamp()` trong `clearCamp()` (sim/creeps.ts) |

## Code liên quan
- [src/sim/stats.ts](../../src/sim/stats.ts): `newStats()`, các hàm `record*()`, `sampleStats()`, `updateStats()`.
- [src/ui/results.ts](../../src/ui/results.ts): `showMatchStats()` dựng bảng + biểu đồ SVG vào `#matchStats`; nút `#copyStats`.
- [src/core/match.ts](../../src/core/match.ts): `fresh()` tạo `state.stats`; `update()` gọi `updateStats()`; `finish()` lấy mẫu cuối rồi gọi `showMatchStats()`.
- Trường trong `state`: `state.stats = { sides: [{trained, lost, killed, damage, built, buildingsLost, peakArmy, gathered:{food,wood,stone,gold}, spent:{…}}, …], timeline: [{t, regions:[n0,n1], army:[n0,n1]}], clock }`.
- Giao diện: `#matchStats`, `.result-actions`, `#copyStats` trong [index.html](../../index.html); class `.stat-table`, `.stat-chart`, `.stat-line` trong [src/style.css](../../src/style.css).

## Tương tác
- [match-flow.md](match-flow.md): hiện cùng overlay thắng/thua.
- [economy.md](economy.md), [combat.md](combat.md), [units.md](units.md), [buildings.md](buildings.md): các điểm ghi số liệu nằm trong hàm của các tính năng này.

## Multiplayer
- Chỉ host (hoặc trận AI) ghi số liệu; `state.stats` đi theo snapshot.
- Guest: khi snapshot báo `ended`, `applySnapshot` gọi `showMatchStats()` một lần rồi mới hiện overlay; cột "(bạn)" theo `localTeam()`.

## Kiểm thử thủ công
- [ ] Chế độ AI: chơi tới khi thắng/thua → bảng đủ dòng, hai biểu đồ có đường; "Sao chép số liệu" dán ra JSON.
- [ ] PvP: guest thấy cột "QUÂN ĐỎ (bạn)" và số khớp với host (đảo cột).
- Unit test: `tests/stats.test.ts`.

## Giới hạn / việc tồn đọng
- Không lưu lịch sử các trận; chưa có biểu đồ tài nguyên theo thời gian.
