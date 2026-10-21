# Đối thủ AI

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-21

## Mô tả
Ở chế độ "Chơi với AI", phe đỏ (team 1) do máy điều khiển, với 3 độ khó **Dễ / Thường / Khó** chọn ở sảnh (dưới nút "Chơi với AI") hoặc Cài đặt → Điều khiển; đổi giữa trận có hiệu lực ngay. AI dùng cùng luật với người chơi: 4 tài nguyên, nông trại, đứng ở cờ để chiếm vùng, lúa nuôi quân; mọi loại quân tuyển tại pháo đài. AI có sương mù riêng; chỉ xây và chỉ nhắm cờ ở chỗ nó đã khám phá.

## Luật & thông số
**Kinh tế — `runEnemyAI()` chạy mỗi `tick` giây theo độ khó** (Dễ 7, Thường 5, Khó 4; `aiTimer`, lượt đầu chạy ngay). Mỗi bước chỉ chi khi đủ tài nguyên; vị trí tìm bằng `findBuildSpot()`:
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
6. **Tuyển quân** (`aiBuy(type)`): dùng cùng hàng đợi huấn luyện với người chơi (`queueTraining()`, cùng thời gian). Chỉ mua khi số quân trong hàng huấn luyện < `maxTraining` (Dễ 1, Thường 2, Khó 4), đủ giá, và lúa ròng sau khi thêm quân vẫn ≥ 0 — tính cả lúa nuôi của quân **đang huấn luyện và trong hàng chờ xuất quân** (`queuedUpkeep`), vì chúng đã trả tiền và sẽ ăn khi ra sân. Thứ tự thử: trinh sát (khi < 2), kỵ binh 14%, lính giáo 42%, cung thủ 60%, lính bộ, cuối cùng lính giáo.
7. Chưa đủ 2 pháo và đủ 150 đá → 25% cơ hội mở pháo thứ hai.
8. **Tấn công & phòng thủ** — `runAttackPlan()` (`ai/attack.ts`), cuối mỗi lượt AI. Kế hoạch lưu ở `state.aiPlan`, vai trò từng quân ở `u.aiRole`:
   - **build** → chờ tới giây `firstAttack` (và `nextWaveAt` sau đợt trước), chọn mục tiêu, chuyển **gather**.
   - **gather**: mọi quân chiến đấu rảnh (không trinh sát, không chiếm cờ, không làm thợ xây) nhận vai `rally`, đi tới điểm tập kết cách pháo đài đỏ tối đa 260 px (40% quãng đường) về phía mục tiêu. Đủ `waveSize + đợt·waveGrowth` quân trong bán kính 220 px thì xuất phát; quá `gatherSeconds` mà có ≥ 60% số đó cũng xuất phát.
   - **attack**: quân vai `wave` đi tới mục tiêu (cờ: đứng rải trong 2 ô quanh cờ để chiếm; công trình/pháo đài: gặp là đánh). Xong mục tiêu thì chọn mục tiêu kế tiếp gần đợt quân nhất. Mục tiêu "dò đường" được thay ngay khi biết mục tiêu thật. Còn ≤ `retreatAt` quân so với lúc đi → **regroup**: quân vai `retreat` về pháo đài (tới gần 200 px thì hết vai), đợt sau gom sau `regroup` giây.
   - **Chọn mục tiêu** (`pickTarget()`): công trình địch đã khám phá (tháp tính xa gấp 1,8), cờ do địch giữ đã khám phá (không tính vùng nhà), pháo đài địch nếu đã thấy (`enemyMemory.base`; ưu tiên từ đợt `fortressAfterWave`, trước đó tính xa gấp 2,5) — chọn chi phí nhỏ nhất. Không biết gì thì tới chỗ thấy quân địch gần đây nhất trong `enemyMemory.targets` (< 30 giây); không có thì **dò** điểm chưa khám phá: trong 96 điểm ngẫu nhiên, chọn điểm xa pháo đài đỏ nhưng gần đợt quân (điểm = cách nhà − 1,2 × cách đợt quân). AI **không biết trước vị trí nhà người chơi** (quyết định 4.1, 2026-10-20; trước đó có "tin đồn" lệch 150–350 px, đã bỏ). Mục tiêu dò đường xong khi nửa đợt quân tới trong 200 px.
   - **Phòng thủ:** ≥ 2 quân địch thấy trong 6 giây qua, cách pháo đài đỏ < `defendRadius` → quân rảnh và quân đang tập kết nhận vai `defend`, đi tới tâm nhóm địch; hết địch thì quay lại vai cũ. Đợt đang tấn công không bị gọi về.

   | Độ khó | `tick` | `maxTraining` | Đợt đầu | Quân đợt 1 / +mỗi đợt | Rút khi còn | Nghỉ giữa đợt | Nhắm pháo đài từ đợt | Bán kính phòng thủ |
   |---|---:|---:|---:|---:|---:|---:|---:|---:|
   | Dễ | 7 s | 1 | 420 s | 6 / +2 | 40% | 180 s | 3 | 520 |
   | Thường | 5 s | 2 | 270 s | 8 / +3 | 30% | 120 s | 2 | 620 |
   | Khó | 4 s | 4 | 180 s | 10 / +4 | 20% | 75 s | 1 | 720 |

   **Kinh tế và chiến thuật theo độ khó** (2026-10-21):

   | Độ khó | Nông trại (`farmsMax`, thêm 1 mỗi `farmEvery`) | `maxTraining` | Hàng đợi tối đa (`lanesMax`) | Chọn quân khắc chế (`smartMix`) | Tiếp viện (`reinforce`, giữ nhà `homeGuard`) | Ưu tiên phá nông trại (`harass`) |
   |---|---:|---:|---:|---|---|---|
   | Dễ | 2 (chỉ thêm khi thiếu lúa) | 1 | 4 | Không (thứ tự ngẫu nhiên cũ) | Không | Không |
   | Thường | 6, mỗi 110 s | 3 | 5 | Có | Có, giữ 3 | Không |
   | Khó | 9, mỗi 75 s | 6 | 6 | Có | Có, giữ 4 | Có (nông trại tính gần ×0,6) |

   - **Chọn quân khắc chế** (`pickUnit()` trong `ai/enemy.ts`): mỗi loại (lính, giáo, cung, kỵ) được trọng số = (điểm khắc chế)² × (dùng vàng / gỗ đang thừa) × (0,35 nếu loại đó đã chiếm > 45% đội quân). Điểm khắc chế tính trên các loại quân địch AI **đã thấy** trong 2 phút qua (`enemyMemory.targets[].type`), theo `COUNTER_MULTIPLIERS`. Mỗi lượt mua tối đa `maxTraining` quân, vẫn giữ lúa ròng ≥ 0.
   - **Mua thêm hàng đợi** (`buyQueueLane()`): khi các hàng đang bận gần hết và còn dư 60 mỗi loại tài nguyên so với giá, tới `lanesMax`.
   - **Tiếp viện:** quân mới ra trong lúc đang tấn công nhập vào đợt quân **theo nhóm ≥ 4** (`REINFORCE_GROUP`; đi lẻ từng quân thì chết dần ở tuyến phòng thủ), giữ lại `homeGuard` quân ở nhà.
   - **Trinh sát** dò điểm chưa khám phá bằng `exploreSpot()` (xa pháo đài đỏ, gần trinh sát): quét dần ra ngoài thay vì đi ngẫu nhiên. Không biết trước nhà người chơi.

   Nguồn: `AI_DIFFICULTY` trong `config/balance.ts`. Độ khó không cho AI thêm tài nguyên, tầm nhìn hay thông tin.

AI không qua `buy()`/`applyAction()` nên không có log.

**Di chuyển khi không có mục tiêu** (mỗi quân đỏ; mọi lần đi theo đường vòng vật cản qua `steerTo()` — điểm đến không tới được thì bỏ, chọn điểm khác; xem [pathfinding.md](pathfinding.md)):
- Quân có `aiRole` đi tới chỗ `aiUnitGoal()` trả về (điểm riêng rải quanh đích, `u.aiSpot`); không bỏ đích khi chưa tới được.
- Đổi đích khi chưa có đích, đã tới gần (< 35), hoặc ngẫu nhiên 0.3% mỗi frame.
- Quân có `buildTarget` còn hiệu lực thì đi/đứng ở tiền đồn đó; quân có `captureTarget` thì đứng ở cờ đó.
- Ưu tiên mỏ gần nhất chưa thuộc phe đỏ (gồm cả mỏ trong vùng xanh); nếu mỏ gần hơn 70 thì thử 48 ô ngẫu nhiên chưa khám phá; nếu vẫn không có thì chọn điểm ngẫu nhiên.
- Có mục tiêu thì luôn đuổi (không cần lệnh tấn công), ngay từ đầu trận.

**Tầm nhìn & trí nhớ**:
- Bản đồ khám phá riêng `state.enemyFogSeen` (khu đất nhà khám phá sẵn); bán kính giống hệt người chơi (sương mù V3.1, `visionSources(1)`: trinh sát 500, lính / giáo 320, cung 360, kỵ 420, pháo đài và công trình 350, vùng đang giữ 450 quanh cờ) — xem [fog-of-war.md](fog-of-war.md).
- `state.enemyMemory.base` lưu vị trí pháo đài xanh khi thấy tâm pháo đài hoặc khi tầm nhìn một nguồn của AI chạm tường pháo đài (khoảng cách ≤ bán kính nhìn + nửa cạnh lớn của pháo đài); `state.enemyMemory.targets` lưu quân xanh đã thấy, xoá sau 90 giây.
- AI chọn mục tiêu chỉ trong vùng `aiCanSee()` (cùng `teamCanSee(1)`).

**Kết quả chạy thử** (AI một mình, 2026-10-17, cờ có sẵn, mô phỏng nhanh, trước khi bỏ nhà lính): phút 2: 1–2 vùng ngoài vùng nhà; phút 4: 3; phút 6: 6; phút 8: 8–10 vùng, 2 nông trại, nhà lính bộ (đôi khi cả nhà lính cung), không thiếu tiếp tế. Trước đó (2026-10-16, AI tự xây cờ): phút 2: vùng nhà + 1 vùng gỗ (đã chiếm xong), 2 nông trại, nhà lính bộ. Lần chạy trước (vùng nhà còn phải cắm cờ): phút 9 có 3 vùng, nhà lính bộ + nhà lính cung, 8 lính bộ. Gỗ là nút thắt (≈ 30 gỗ/phút mỗi vùng gỗ).

## Code liên quan
- [src/ai/attack.ts](../../src/ai/attack.ts): `aiLevel()`, `newAIPlan()`, `runAttackPlan()`, `aiUnitGoal()`, các hàm cục bộ `pickTarget()`, `targetDone()`, `rallyPoint()`, `retreat()`, `spot()`; hằng số `AI_DIFFICULTY`, `settings.aiDifficulty`; bộ chọn `#aiDifficulty` ở sảnh (`ui/modeScreen.ts`).
- [src/ai/enemy.ts](../../src/ai/enemy.ts), [src/core/match.ts](../../src/core/match.ts), [src/config/balance.ts](../../src/config/balance.ts): `runEnemyAI()` (gọi trong `update()` khi `mode==='ai'&&aiTimer>=aiLevel().tick`), các hàm cục bộ `build()`, `regionHas()`, `squad()`, `aiBuy()`; `flagStandSpot()`; hằng số `AI_CAPTURE_SQUAD`, `AI_MAX_CAPTURE_TARGETS`, `AI_CAPTURE_TARGET_INTERVAL`; nhánh `mode==='ai'&&u.team===1&&!target` trong vòng quân; khối "AI has its own independent vision map".
- Dùng lại: `findBuildSpot()`, `placeBuilding()`, `startUpgrade()`, `startOutpost()`, `outpostRegions()`, `hasBuilding()`, `foodPerMinute()`, `upkeepPerMinute()`, `queueTraining()`, `trainQueueOf()`, `buildTurret()`, `aiCanSee()`, `nearestEnemy()`.
- Dữ liệu: `state.aiPlan` (`phase`, `target`, `rally`, `wave`, `launched`, `since`, `nextWaveAt`, `defend`), `u.aiRole` (`rally` / `wave` / `defend` / `retreat`), `u.aiSpot`, `state.enemyMemory`, `state.enemyFogSeen`, `state.aiExploreTarget` (khai báo nhưng chưa dùng).

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
- [ ] Mỗi độ khó: đợt đầu tới đúng khoảng thời gian trong bảng; quân đỏ tụ ở điểm tập kết rồi đi cùng nhau; thua nặng thì rút về.
- [ ] Đưa quân xanh tới gần pháo đài đỏ → quân đỏ rảnh kéo ra chặn.
- Unit test: `tests/ai.test.ts`. Đã chạy thử 2026-10-19 (người chơi chỉ có 4 quân giữ nhà, 15 phút): Dễ tập kết 425 s, xuất phát 474 s, phá pháo đài 761 s; Thường 273 s / 323 s, phá 485 s; Khó 182 s / 259 s, rút 535 s, phá 596 s (sau khi thêm tin đồn và công trình chặn đường). Không lỗi.
- Đã chạy thử 2026-10-20 (bỏ tin đồn, sương mù V3.1, người chơi chỉ có 4 quân giữ nhà, 15 phút, 2 lượt × 3 độ khó): phá pháo đài ở 5/6 trận (Dễ 643 / 712 s, Thường 608 s, Khó 690 / 696 s); 1 trận Thường không tìm thấy nhà người chơi trong 15 phút. Không lỗi.
- Bài thử cố định 2026-10-21 (người chơi giữ nhà bằng 8 giáo, 6 cung, 2 tháp, không làm gì thêm; 18 phút): trước khi sửa — Thường phá pháo đài ở 718 / 774 s, Khó ở 769 / 1076 s (Khó không nhanh hơn Dễ, có trận còn thừa 2.223 vàng, luôn 2 nông trại). Sau khi sửa (4 trận mỗi mức) — Khó thắng 4/4, trung bình 766 s (655–934 s), 4–7 nông trại; Thường 725–886 s (không khá hơn).
- Smoke `ai` (từ 2026-10-21): AI tự chơi 8 phút trên 3 bản đồ, phe xanh không có quân. Đạt khi AI phá được pháo đài trống, **hoặc** sau 8 phút giữ ≥ 2 vùng và có ≥ 5 quân (từ sương mù V3.1, AI nhìn xa hơn nên hay thấy và phá pháo đài trống trong 5–7 phút).

## Giới hạn / việc tồn đọng
- Kinh tế & hàng đợi V2 (2026-10-18): AI dùng cùng 4 hàng đợi song song nhưng vẫn tự giới hạn 2 quân trong hàng đợi và chưa biết mua thêm hàng đợi (không đổi hành vi AI theo yêu cầu V2).
- Đợt tấn công gom mọi quân rảnh; đợt đang đi không quay về cứu nhà.
- Lúa và gỗ là nút thắt: AI vẫn để thừa nhiều vàng và đá (không có chợ đổi tài nguyên); hàng đợi thứ 5–6 hiếm khi mua được vì thiếu gỗ. Mức Thường chưa mạnh hơn rõ rệt so với trước 2026-10-21.
- AI tự dò tìm nhà người chơi nên có trận tìm chậm (hơn 10 phút) trên bản đồ lớn.
- Độ khó chỉ đổi nhịp độ (tiền và tầm nhìn như nhau); "Dễ" vẫn tích quân nhiều nếu người chơi không gây áp lực.
- AI chỉ nhắm cờ ở chỗ đã khám phá; nếu trinh sát chết sớm, AI mở rộng chậm. Nhóm chiếm cờ và thợ xây là quân chiến đấu bị rút khỏi đội hình. AI không tự xoá tiến độ dở của địch ở cờ mình nếu không có quân đứng đó.
- `aiExploreTarget` chưa dùng.
