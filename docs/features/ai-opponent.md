# Đối thủ AI

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-18

## Mô tả
Ở chế độ "Chơi với AI", phe đỏ (team 1) do máy điều khiển. AI dùng cùng luật với người chơi: 4 tài nguyên, nông trại, đứng ở cờ để chiếm vùng, lúa nuôi quân; mọi loại quân tuyển tại pháo đài. AI có sương mù riêng; chỉ xây và chỉ nhắm cờ ở chỗ nó đã khám phá.

## Luật & thông số
**Kinh tế — `runEnemyAI()` chạy mỗi 5 giây** (`aiTimer`, lượt đầu chạy ngay). Mỗi bước chỉ chi khi đủ tài nguyên; vị trí tìm bằng `findBuildSpot()`:
1. **Vùng gỗ nhà** đã thuộc AI từ đầu trận nên AI có gỗ ngay.
2. **Nông trại:** giữ ít nhất 2; xây thêm khi lúa ròng (tính cả nông trại đang xây) < 10/phút; tối đa 10, tối đa 2 cái đang xây cùng lúc; đặt cách pháo đài 3–10 ô.
3. **Loại tài nguyên đang thiếu** (`wanted`): các loại trong `REGION_TYPES` mà AI chưa có mỏ nào. (Chế độ dành dụm cho nhà lính đã bỏ cùng nhà lính.)
4. **Chiếm cờ:**
   - **Cờ nhắm tới:** cờ không thuộc AI mà AI đã khám phá. Thứ tự ưu tiên: cờ trung lập trước, rồi vùng có loại tài nguyên đang thiếu mà chưa có thu nhập, rồi cờ gần pháo đài nhất.
   - **Số cờ cùng lúc:** 1 + ⌊giây/120⌋, tối đa 4 (`AI_CAPTURE_TARGET_INTERVAL`, `AI_MAX_CAPTURE_TARGETS`).
   - **Nhóm quân:** mỗi cờ được `AI_CAPTURE_SQUAD` = 2 quân, gấp đôi nếu là cờ của địch hoặc đang tranh chấp. Chọn quân chiến đấu rảnh gần nhất; không bao giờ chọn trinh sát (trinh sát không chiếm được cờ).
   - **Mỗi lượt** chỉ mở thêm một cờ mới.
   - **Quân được gán** (`u.captureTarget`) đứng rải trong nửa bán kính vòng cờ (`flagStandSpot()`), tới khi vùng thuộc AI và không còn tiến độ dở của địch (gặp địch thì vẫn đánh).
   - **Thợ xây:** mỗi tiền đồn đang xây chưa có thợ thì được gán quân rảnh gần nhất (`u.buildTarget`).
5. **Nâng cấp & phòng thủ:** sau 45 giây và ≥ 120 đá → nâng nông trại; ≥ 180 đá, ≥ 260 gỗ và còn vùng chưa có tiền đồn → `startOutpost()`; dưới 2 tháp và đủ giá → 35% cơ hội xây tháp cạnh pháo đài hoặc cạnh cờ của một vùng mình giữ.
6. **Tuyển quân** (`aiBuy(type)`): dùng cùng hàng đợi huấn luyện với người chơi (`queueTraining()`, cùng thời gian). Chỉ mua khi đang có < 2 quân trong hàng huấn luyện, đủ giá, và lúa ròng sau khi thêm quân vẫn ≥ 0 — tính cả lúa nuôi của quân **đang huấn luyện và trong hàng chờ xuất quân** (`queuedUpkeep`), vì chúng đã trả tiền và sẽ ăn khi ra sân. Thứ tự thử: trinh sát (khi < 2), kỵ binh 14%, lính giáo 42%, cung thủ 60%, lính bộ, cuối cùng lính giáo.
7. Chưa đủ 2 pháo và đủ 100 đá → 25% cơ hội mở pháo thứ hai.

AI không qua `buy()`/`applyAction()` nên không có log.

**Di chuyển khi không có mục tiêu** (mỗi quân đỏ; mọi lần đi theo đường vòng vật cản qua `steerTo()` — điểm đến không tới được thì bỏ, chọn điểm khác; xem [pathfinding.md](pathfinding.md)):
- Đổi đích khi chưa có đích, đã tới gần (< 35), hoặc ngẫu nhiên 0.3% mỗi frame.
- Quân có `buildTarget` còn hiệu lực thì đi/đứng ở tiền đồn đó; quân có `captureTarget` thì đứng ở cờ đó.
- Ưu tiên mỏ gần nhất chưa thuộc phe đỏ (gồm cả mỏ trong vùng xanh); nếu mỏ gần hơn 70 thì thử 48 ô ngẫu nhiên chưa khám phá; nếu vẫn không có thì chọn điểm ngẫu nhiên.
- Có mục tiêu thì luôn đuổi (không cần lệnh tấn công), ngay từ đầu trận.

**Tầm nhìn & trí nhớ**:
- Bản đồ khám phá riêng `state.enemyFogSeen` (khu đất nhà khám phá sẵn); bán kính: trinh sát 260 (`SCOUT_VISION`), giáo 120, khác 105, căn cứ đỏ 160, công trình theo `buildingVision()`.
- `state.enemyMemory.base` lưu vị trí pháo đài xanh khi thấy; `state.enemyMemory.targets` lưu quân xanh đã thấy, xoá sau 90 giây.
- AI chọn mục tiêu chỉ trong vùng `aiCanSee()` (cùng `teamCanSee(1)`).

**Kết quả chạy thử** (AI một mình, 2026-10-17, cờ có sẵn, mô phỏng nhanh, trước khi bỏ nhà lính): phút 2: 1–2 vùng ngoài vùng nhà; phút 4: 3; phút 6: 6; phút 8: 8–10 vùng, 2 nông trại, nhà lính bộ (đôi khi cả nhà lính cung), không thiếu tiếp tế. Trước đó (2026-10-16, AI tự xây cờ): phút 2: vùng nhà + 1 vùng gỗ (đã chiếm xong), 2 nông trại, nhà lính bộ. Lần chạy trước (vùng nhà còn phải cắm cờ): phút 9 có 3 vùng, nhà lính bộ + nhà lính cung, 8 lính bộ. Gỗ là nút thắt (≈ 30 gỗ/phút mỗi vùng gỗ).

## Code liên quan
- [src/ai/enemy.ts](../../src/ai/enemy.ts), [src/core/match.ts](../../src/core/match.ts), [src/config/balance.ts](../../src/config/balance.ts): `runEnemyAI()` (gọi trong `update()` khi `mode==='ai'&&aiTimer>=5`), các hàm cục bộ `build()`, `regionHas()`, `squad()`, `aiBuy()`; `flagStandSpot()`; hằng số `AI_CAPTURE_SQUAD`, `AI_MAX_CAPTURE_TARGETS`, `AI_CAPTURE_TARGET_INTERVAL`; nhánh `mode==='ai'&&u.team===1&&!target` trong vòng quân; khối "AI has its own independent vision map".
- Dùng lại: `findBuildSpot()`, `placeBuilding()`, `startUpgrade()`, `startOutpost()`, `outpostRegions()`, `hasBuilding()`, `foodPerMinute()`, `upkeepPerMinute()`, `queueTraining()`, `trainQueueOf()`, `buildTurret()`, `aiCanSee()`, `nearestEnemy()`.
- Dữ liệu: `state.enemyMemory`, `state.enemyFogSeen`, `state.aiExploreTarget` (khai báo nhưng chưa dùng).

## Tương tác
- [buildings.md](buildings.md), [territory.md](territory.md), [economy.md](economy.md), [units.md](units.md), [fortress.md](fortress.md), [fog-of-war.md](fog-of-war.md), [combat.md](combat.md).

## Multiplayer
Không áp dụng: mọi logic AI chỉ chạy khi `mode==='ai'`.

## Kiểm thử thủ công
- [ ] Đầu trận AI xây 2 nông trại, ra 2 trinh sát, cử 2 quân tới cờ gần nhất đã khám phá và chiếm được.
- [ ] AI không xây nhà lính; vẫn tuyển đủ các loại quân.
- Đã chạy thử 2026-10-17 (sau khi mở tuyển tại pháo đài): 8 phút AI một mình → 9 vùng, 2 trinh sát, 9 lính bộ, 1 cung thủ, lúa ròng +66/phút.
- Đã chạy thử 2026-10-17 (yêu cầu 17/10): AI một mình ~6 phút: 6 vùng, 2 nông trại, 2 trinh sát + 8 lính giáo, không thiếu tiếp tế, không lỗi.
- Đã chạy thử 2026-10-17 (sau thu nhập pháo đài + hàng đợi huấn luyện): 3 bản đồ ngẫu nhiên × 10 phút, AI giữ 9–12 vùng, 19–20 quân, 2 nông trại, hàng đợi 0–1, không lỗi.
- [ ] AI không rơi vào thiếu tiếp tế, kể cả khi sân tập kết kín và quân dồn vào hàng chờ.
- Đã chạy thử 2026-10-17: 3 nông trại (biên lúa 60/phút), hàng chờ 60 lính giáo → 5 lượt AI không mua thêm; xoá hàng chờ → mua lại 5 quân.
- [ ] AI không nhắm quân xanh đang trong sương mù của nó.

## Giới hạn / việc tồn đọng
- AI phát triển chậm (gỗ là nút thắt) và chưa tổ chức tấn công có chủ đích; quân chỉ đánh khi gặp địch hoặc khi đi tới mỏ vùng xanh.
- AI chỉ nhắm cờ ở chỗ đã khám phá; nếu trinh sát chết sớm, AI mở rộng chậm. Nhóm chiếm cờ và thợ xây là quân chiến đấu bị rút khỏi đội hình. AI không tự xoá tiến độ dở của địch ở cờ mình nếu không có quân đứng đó.
- `enemyMemory` được ghi nhưng chưa được dùng để ra quyết định tấn công; `aiExploreTarget` chưa dùng.
- Bán kính tầm nhìn AI khác `unitVisionRadius()` (giáo 120 vs 150, cung 105 vs 130).
