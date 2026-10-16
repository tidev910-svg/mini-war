# Đối thủ AI

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-16

## Mô tả
Ở chế độ "Chơi với AI", phe đỏ (team 1) do máy điều khiển. AI dùng cùng luật với người chơi: 4 tài nguyên, nông trại, cột cờ chiếm vùng, nhà lính mở khoá quân, lúa nuôi quân. AI có sương mù riêng và chỉ xây/cắm cờ trên vùng nó đã khám phá.

## Luật & thông số
**Kinh tế — `runEnemyAI()` chạy mỗi 5 giây** (`aiTimer`, lượt đầu chạy ngay). Mỗi bước chỉ chi khi đủ tài nguyên; vị trí tìm bằng `findBuildSpot()`:
1. **Vùng gỗ nhà** đã thuộc AI từ đầu trận nên AI có gỗ ngay (không cần cắm cờ).
2. **Nông trại:** giữ ít nhất 2; xây thêm khi lúa ròng (tính cả nông trại đang xây) < 10/phút; tối đa 10, tối đa 2 cái đang xây cùng lúc; đặt cách pháo đài 3–10 ô.
3. **Dành dụm:** nếu đã giữ ≥ 2 vùng (tính cả vùng nhà), đã qua 45 giây, công trình quân sự kế tiếp (nhà lính bộ → nhà lính cung → chuồng ngựa) chưa có, và **mọi tài nguyên còn thiếu cho nó đều đang có thu nhập** → bật chế độ dành dụm (`saving`).
4. **Mở rộng:** khi không dành dụm, không có cờ đang xây, số cờ < 2 + ⌊giây/90⌋ và còn vùng trung lập mà AI đã thấy **điểm chiếm** (`freeRegions()`) → cắm cờ đúng điểm chiếm của vùng gần nhất, ưu tiên vùng có mỏ loại đang thiếu mà chưa có thu nhập, rồi vùng có mỏ gỗ.
   **Thợ xây:** mỗi cột cờ đang xây/đang nâng tiền đồn chưa có thợ thì được gán quân gần nhất không bị khoá xuất quân (`u.buildTarget`); quân đó đứng cạnh cờ tới khi xong (trừ khi gặp địch thì đánh).
5. **Công trình quân sự:** sau 45 giây, xây công trình kế tiếp theo thứ tự trên trong lãnh thổ nhà (4–12 ô).
6. **Nâng cấp & phòng thủ:** có nhà lính bộ và ≥ 120 đá → nâng nông trại; ≥ 180 đá và ≥ 260 gỗ → nâng cờ thành tiền đồn; dưới 2 tháp và đủ giá → 35% cơ hội xây tháp cạnh pháo đài hoặc cạnh một cột cờ.
7. **Tuyển quân** (`aiBuy(type)`): cần công trình mở khoá, đủ giá, lúa ròng sau khi thêm quân vẫn ≥ 0; khi dành dụm thì không tuyển quá 4 quân (trừ trinh sát); không mua quân tốn gỗ nếu kéo gỗ xuống dưới mức để dành (`woodReserve` = giá gỗ của công trình đang dành dụm, hoặc 100 khi đang chờ cắm cờ). Thứ tự: trinh sát (khi < 2), kỵ binh 14%, lính giáo 42%, cung thủ 60%, lính bộ, cuối cùng lính giáo.
8. Chưa đủ 2 pháo và đủ 100 đá → 25% cơ hội mở pháo thứ hai.

AI không qua `buy()`/`applyAction()` nên không có log.

**Di chuyển khi không có mục tiêu** (mỗi quân đỏ):
- Đổi đích khi chưa có đích, đã tới gần (< 35), hoặc ngẫu nhiên 0.3% mỗi frame.
- Quân có `buildTarget` còn hiệu lực thì đi/đứng ở cột cờ đó.
- Ưu tiên mỏ gần nhất chưa thuộc phe đỏ (gồm cả mỏ trong vùng xanh — tới đó sẽ đánh cột cờ xanh); nếu mỏ gần hơn 70 thì thử 48 ô ngẫu nhiên chưa khám phá; nếu vẫn không có thì chọn điểm ngẫu nhiên.
- Có mục tiêu thì luôn đuổi (không cần lệnh tấn công), nhưng vẫn tôn trọng khoá 120 giây.

**Tầm nhìn & trí nhớ**:
- Bản đồ khám phá riêng `state.enemyFogSeen` (khu đất nhà khám phá sẵn); bán kính: trinh sát 145, giáo 120, khác 105, căn cứ đỏ 160, công trình theo `buildingVision()`.
- `state.enemyMemory.base` lưu vị trí pháo đài xanh khi thấy; `state.enemyMemory.targets` lưu quân xanh đã thấy, xoá sau 90 giây.
- AI chọn mục tiêu chỉ trong vùng `aiCanSee()` (cùng `teamCanSee(1)`).

**Kết quả chạy thử** (AI một mình, 2026-10-16, sau khi vùng nhà sở hữu sẵn): phút 2: vùng nhà + 1 vùng gỗ (đã chiếm xong), 2 nông trại, nhà lính bộ. Lần chạy trước (vùng nhà còn phải cắm cờ): phút 9 có 3 vùng, nhà lính bộ + nhà lính cung, 8 lính bộ. Gỗ là nút thắt (≈ 30 gỗ/phút mỗi vùng gỗ).

## Code liên quan
- [src/main.ts](../../src/main.ts): `runEnemyAI()` (gọi trong `update()` khi `mode==='ai'&&aiTimer>=5`), các hàm cục bộ `build()`, `freeRegions()`, `regionHas()`, `flagFirst()`, `aiBuy()`; nhánh `mode==='ai'&&u.team===1&&!target` trong vòng quân; khối "AI has its own independent vision map".
- Dùng lại: `findBuildSpot()`, `placeBuilding()`, `startUpgrade()`, `hasBuilding()`, `foodPerMinute()`, `upkeepPerMinute()`, `spawn()`, `buildTurret()`, `aiCanSee()`, `nearestEnemy()`.
- Dữ liệu: `state.enemyMemory`, `state.enemyFogSeen`, `state.aiExploreTarget` (khai báo nhưng chưa dùng).

## Tương tác
- [buildings.md](buildings.md), [territory.md](territory.md), [economy.md](economy.md), [units.md](units.md), [fortress.md](fortress.md), [fog-of-war.md](fog-of-war.md), [combat.md](combat.md).

## Multiplayer
Không áp dụng: mọi logic AI chỉ chạy khi `mode==='ai'`.

## Kiểm thử thủ công
- [ ] Đầu trận AI xây 2 nông trại, ra 2 trinh sát, cắm cờ vùng gỗ gần nhất đã khám phá.
- [ ] Sau ~5 phút AI có nhà lính bộ và lính bộ; sau đó nhà lính cung.
- [ ] AI không rơi vào thiếu tiếp tế.
- [ ] AI không nhắm quân xanh đang trong sương mù của nó.

## Giới hạn / việc tồn đọng
- AI phát triển chậm (gỗ là nút thắt) và chưa tổ chức tấn công có chủ đích; quân chỉ đánh khi gặp địch hoặc khi đi tới mỏ vùng xanh.
- AI chỉ cắm cờ ở vùng đã thấy điểm chiếm; nếu trinh sát chết sớm, AI mở rộng rất chậm. Thợ xây là quân chiến đấu bị rút khỏi đội hình.
- `enemyMemory` được ghi nhưng chưa được dùng để ra quyết định tấn công; `aiExploreTarget` chưa dùng.
- Bán kính tầm nhìn AI khác `unitVisionRadius()` (giáo 120 vs 150, cung 105 vs 130).
