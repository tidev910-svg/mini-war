# Đối thủ AI

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-15

## Mô tả
Ở chế độ "Chơi với AI", phe đỏ (team 1) do máy điều khiển, mức độ vừa phải. AI dùng cùng tài nguyên và cùng luật mua quân với người chơi, có sương mù riêng và có "trí nhớ" về những gì nó đã thấy.

## Luật & thông số
**Mua quân** — mỗi 5 giây (`aiTimer`, bắt đầu ở 5 nên lượt đầu chạy ngay), chọn **một** nhánh theo thứ tự:
| Điều kiện | Hành động |
|---|---|
| Ít hơn 2 trinh sát (kể cả hàng chờ) và ≥ 40 vàng | Mua trinh sát với `order='explore'` |
| ≥ 250 vàng & ≥ 70 NL, xác suất 14% | Kỵ binh |
| ≥ 110 vàng & ≥ 25 NL, xác suất 42% | Lính giáo |
| ≥ 75 vàng & ≥ 15 NL, xác suất 60% | Cung thủ |
| ≥ 50 vàng | Lính |
Sau đó, nếu ≥ 100 vàng và chưa đủ 2 pháo, xác suất 25% gọi `buildTurret(1)`.

AI mua bằng cách trừ tiền rồi gọi `spawn()` trực tiếp (không qua `buy()`), nên không có log.

**Di chuyển khi không có mục tiêu** (mỗi quân đỏ):
- Đổi đích khi chưa có đích, đã tới gần (< 35), hoặc ngẫu nhiên 0.3% mỗi frame.
- Ưu tiên mỏ gần nhất chưa thuộc phe đỏ; nếu mỏ gần hơn 70 thì thử 48 ô ngẫu nhiên chưa khám phá; nếu vẫn không có thì chọn điểm ngẫu nhiên.
- Có mục tiêu thì luôn đuổi (không cần lệnh tấn công), nhưng vẫn tôn trọng khoá 120 giây.

**Tầm nhìn & trí nhớ**:
- Bản đồ khám phá riêng `state.enemyFogSeen`; bán kính: trinh sát 145, giáo 120, khác 105, căn cứ đỏ 160.
- `state.enemyMemory.base` lưu vị trí pháo đài xanh khi thấy; `state.enemyMemory.targets` lưu quân xanh đã thấy, xoá sau 90 giây.
- AI chọn mục tiêu chỉ trong vùng `aiCanSee()` (cùng `teamCanSee(1)`).

## Code liên quan
- [src/main.ts](../../src/main.ts): khối `if(mode==='ai'&&aiTimer>=5)` trong `update()`; nhánh `mode==='ai'&&u.team===1&&!target` trong vòng quân; khối "AI has its own independent vision map".
- `aiCanSee()`, `nearestEnemy()`, `spawn()`, `buildTurret()`.
- Dữ liệu: `state.enemyMemory`, `state.enemyFogSeen`, `state.aiExploreTarget` (khai báo nhưng chưa dùng).

## Tương tác
- [units.md](units.md), [economy.md](economy.md), [fortress.md](fortress.md), [fog-of-war.md](fog-of-war.md), [combat.md](combat.md).

## Multiplayer
Không áp dụng: mọi logic AI chỉ chạy khi `mode==='ai'`.

## Kiểm thử thủ công
- [ ] Đầu trận AI ra 2 trinh sát đi khám phá / chiếm mỏ.
- [ ] Sau vài phút AI có đủ loại quân và tự tấn công khi thấy quân/căn cứ xanh.
- [ ] AI không nhắm quân xanh đang trong sương mù của nó.

## Giới hạn / việc tồn đọng
- `enemyMemory` được ghi nhưng chưa được dùng để ra quyết định tấn công.
- `aiExploreTarget` chưa dùng.
- Bán kính tầm nhìn AI khác `unitVisionRadius()` (giáo 120 vs 150, cung 105 vs 130).
- AI không xây nông trại.
