# Hang quái trung lập (đánh quái)

> Trạng thái: Cần kiểm thử · Cập nhật lần cuối: 2026-10-23

## Mô tả
Trên bản đồ có các **hang quái trung lập** không thuộc phe nào. Quái canh giữ phần thưởng. Hai phe phải chọn: dồn quân dọn hang để lấy tài nguyên và lợi thế, hay giữ quân để đánh nhau. Có ba bậc:
- **Bản 1:** ổ sói, trại cướp, hang quỷ đá. Dọn xong được tài nguyên ngay; một lúc sau hang có quái trở lại.
- **Bản 2:** AI biết dọn hang theo độ khó. (Đồn cướp canh cờ, chặn chiếm cờ khi còn quái, đã bỏ ngày 2026-10-23: đầu trận chưa đủ quân để dọn nên không chiếm được cờ đó.)
- **Bản 3:** Lăng cổ ở giữa bản đồ, mở lúc 8:00 và được báo cho cả hai phe. Hạ Vua Xương thì cả quân của phe đó được buff sát thương và tốc độ trong 90 giây.

Mọi số dưới đây là số **tạm** (2026-10-22, đã chỉnh cùng ngày theo mô phỏng: dọn đi dọn lại một hang thu ngang một mỏ, khoảng 30–49 điểm tài nguyên/phút; ổ sói, trại cướp, quỷ đá cần khoảng 4–6 quân; Lăng cổ khoảng 12 lính giáo hoặc 8 kỵ binh), chờ thử nghiệm và chốt (xem [decisions/can-xac-nhan.md](../decisions/can-xac-nhan.md), mục 9).

## Luật & thông số
**Quái** (`CREEP_TYPES`):

| Quái | Máu | Sát thương | Tầm | Tốc độ | Hồi chiêu | Tính khắc chế như |
|---|---:|---:|---:|---:|---:|---|
| Sói | 80 | 11 | 20 | 62 | 0,9 s | kỵ binh: lính giáo đánh ×2,2; sói cắn cung thủ ×1,5 |
| Cướp | 110 | 12 | 22 | 42 | 0,9 s | lính |
| Cướp cung | 60 | 11 | 110 (bắn tên) | 36 | 1,2 s | cung thủ |
| Quỷ đá | 800 | 34, đánh lan 40 | 34 | 30 | 1,6 s | lính giáo: cung thủ ×1,3, lính ×1,2; quỷ đánh kỵ binh ×2,2 |
| Lính xương | 120 | 13 | 22 | 40 | 1 s | lính |
| Vua Xương | 1500 | 40, đánh lan 50 | 40 | 32 | 1,5 s | — (×1 với mọi quân) |

Đánh lan trúng mọi quân trong bán kính quanh mục tiêu, mỗi quân nhận `CREEP_SPLASH_SHARE` = 35% sát thương. Hệ số khắc chế dùng chung bảng `COUNTER_MULTIPLIERS` của [combat.md](combat.md) theo `counterAs`, cả khi quái bị đánh lẫn khi quái đánh.

**Hang** (`CAMP_TYPES`):

| Hang | Quái | Thưởng | Quay lại sau | Đánh thức | Dây xích |
|---|---|---|---:|---:|---:|
| Ổ sói | 5 sói | 120 lúa | 240 s | 130 | 330 |
| Trại cướp | 3 cướp + 2 cướp cung | 100 gỗ + 60 vàng | 240 s | 150 | 360 |
| Hang quỷ đá | 1 quỷ đá | 120 đá + 60 vàng | 300 s | 130 | 300 |
| Lăng cổ | Vua Xương + 4 lính xương | 150 vàng + buff +15% sát thương, +10% tốc độ trong 90 s | 300 s | 180 | 420 |

- **Ngủ và thức:** hang ngủ cho tới khi một quân của bất kỳ phe nào vào trong bán kính "đánh thức" của một con quái, hoặc một con quái bị đánh. Khi đó **cả hang** thức và đánh quân ở gần hang: trong tầm đánh thức + `CREEP_CHASE_PAD` = 60 tính từ tâm hang (cung thủ: cả vòng "dây xích", vì có thể đang bắn vào hang). Quân chỉ đi ngang ở rìa thì không bị đuổi; hang ngủ lại 3 giây sau lần cuối có quân lại gần hoặc bị đánh.
- **Dây xích:** quái không bao giờ ra quá vòng dây xích. Không còn ai trong vòng thì quái đi về chỗ cũ và hồi `CREEP_REGEN` = 12% máu tối đa mỗi giây.
- **Phần thưởng:** con quái cuối cùng chết thì **phe gây nhiều sát thương nhất cho hang** nhận thưởng, không phải phe đánh đòn cuối. Sát thương của súng (pháo đài, tháp) không có trên đường quái đi nên thực tế chỉ quân tính.
- **Quay lại:** hết thời gian và không có quân nào trong vòng dây xích thì hang có đủ quái trở lại.
- **Lăng cổ:** niêm phong tới `opensAt` = 480 s (8:00). Khi mở, cả hai phe được báo và vị trí được đánh dấu "đã khám phá" cho cả hai.
- **Buff:** cộng vào mọi đòn của **quân** phe đó (không cộng cho súng) và vào tốc độ đi; nhiều buff thì cộng dồn. HUD hiện ô "+15% sát thương · Ns".

**Quân của người chơi đánh quái khi:**
- được lệnh dọn hang đó (chuột phải vào hang): đi tới, đánh mọi con quái của hang đang thấy, xong thì đứng giữ vị trí;
- hoặc một con quái của hang **đang thức** ở trong tầm đánh + `CREEP_ENGAGE_MARGIN` = 40 (tự vệ). Quân không tự đi vào hang đang ngủ, và lệnh Tấn công (A) không nhắm hang.

Địch trong tầm vẫn được ưu tiên; nhưng nếu địch ngoài tầm mà một con quái đang ở trong tầm thì quân đánh con quái.

**Vị trí trên bản đồ** (`CAMP_LAYOUT`, `placeCamps()`): theo **cặp**, mỗi cặp một hang gần mỗi pháo đài, quãng đường đi bộ đối xứng (lệch tối đa `CAMP_PAIR_TOLERANCE` = 6% khoảng cách hai pháo đài), nên không phe nào có hang dễ hơn.

| Loại | Số cặp | Khoảng cách tới pháo đài gần hơn (tỉ lệ khoảng cách hai pháo đài) |
|---|---:|---|
| Ổ sói | 2 | 16–30% |
| Trại cướp | 1 | 26–40% |
| Hang quỷ đá | 1 | 32–46% |
| Lăng cổ | 1 hang | ≥ 35% từ cả hai, chỗ cân nhất |

Hang cách pháo đài ≥ 20 ô, cờ ≥ 11 ô (quân đứng chiếm cờ nằm ngoài tầm đánh thức), mỏ ≥ 8 ô, hang khác ≥ 14 ô (`CAMP_SPACING`). Bản đồ không tìm được cặp đối xứng cho một loại thì bỏ loại đó, để giữ công bằng. Cây trang trí không mọc trong 150 quanh hang.

**AI** (`AI_DIFFICULTY.camps`, `AI_CAMP_SQUAD`):

| Độ khó | Dọn | Đội gửi đi |
|---|---|---|
| Dễ | không chủ động | — |
| Thường | ổ sói | sói 5 (+1) |
| Khó | mọi loại, cả Lăng cổ | sói 5, cướp 6, quỷ đá 8, lăng 12 (+1) |

- AI chỉ biết hang nó **đã thấy** (hoặc lăng đã mở), hang gần pháo đài AI nhất trước.
- Đội tập hợp trước ở một điểm ngoài tầm đánh thức (phía pháo đài AI), đủ 70% mới cùng vào, để không bị sói xử từng quân.
- AI lấy quân đang rảnh hoặc đang tập hợp cho đợt sau, chừa `homeGuard` quân ở nhà; không lấy khi đang phòng thủ hoặc đang trong đợt tấn công.
- Đội rút khi hang đã dọn hoặc còn dưới một nửa.
- Quân AI đang đi đường (đích xa hơn 60) đi tiếp qua hang, không dừng lại đánh; quân đứng yên thì đánh trả. Khi một hang (trừ Lăng cổ) bị đánh thức và trong 500 quanh nó có từ `AI_CAMP_SQUAD` + 2 quân AI, tất cả cùng dọn hang rồi đi tiếp (`fightWokenCamps()`). Mọi độ khó.
- AI không gửi đội chiếm cờ tới cờ nằm trong vòng của hang nó biết còn quái. Khi chọn chỗ đi lang thang (mỏ, chỗ chưa khám phá), AI tránh hang nó biết còn quái (`nearKnownCamp()`).

## Code liên quan
- [src/config/creeps.ts](../../src/config/creeps.ts): `CREEP_TYPES`, `CAMP_TYPES`, `CREEP_REGEN`, `CREEP_SPLASH_SHARE`, `CREEP_ENGAGE_MARGIN`, `CREEP_CHASE_PAD`, `AI_CAMP_SQUAD`, `CAMP_LAYOUT`, `CAMP_SPACING`, `CAMP_PAIR_TOLERANCE`.
- [src/map/camps.ts](../../src/map/camps.ts): `placeCamps()` — đặt hang theo cặp đối xứng (gọi trong `fresh()`).
- [src/sim/creeps.ts](../../src/sim/creeps.ts):
  - `initCamps()`, `updateCreeps()`: sinh quái, đánh thức, dây xích, hồi máu, dọn xong, quay lại, mở lăng, hết buff.
  - `creepTargetFor()`: quân đánh quái nào.
  - `noteCreepHit()`, `creepKilled()`: gọi từ `hurt()`.
  - `orderCampAttack()`, `forgetCamp()`: lệnh dọn hang.
  - `campKnownState()`, `nearKnownCamp()`, `buffFactor()`, `revealOpenedCamps()`, `campById()`.
- [src/ai/camps.ts](../../src/ai/camps.ts): `runCampPlan()`, gọi trong `runEnemyAI()` trước `runAttackPlan()`; vai trò `u.aiRole='camp'` trong `aiUnitGoal()`.
- [src/render/creeps.ts](../../src/render/creeps.ts):
  - Vẽ: `drawCampSite()`, `drawCreep()`, `drawCreepBar()`, `drawCreepFall()`, `drawBuffAuras()`.
  - Chuột: `campAt()`, `campInfo()`.
  - `updateCampNotices()`: thông báo và tiếng khi hang thức, được dọn, quay lại, lăng mở, hết buff.
- Trường trong `state`:
  - `state.camps`: `{id, kind, x, y, state: 'alive'|'cleared'|'closed', respawnAt, damage[2], seen[2], awake, winner, clearedAt, openedAt}`.
  - `state.creeps`: `{id, camp, creep, team: 2, x, y, homeX, homeY, hp, max, timer, target, facing, walk, moving, path}`.
  - `state.buffs`: `{team, until, damage, speed, camp}`.
  - Quân: `u.order='camp'`, `u.campTarget`.
- Giao diện: `#buffChip` trong huy hiệu chỉ huy ([index.html](../../index.html)), class `.buff-chip` ([src/style.css](../../src/style.css)); màu vẽ `CREEP_COLORS` ([src/config/visuals.ts](../../src/config/visuals.ts)).

## Tương tác
- [combat.md](combat.md):
  - `hurt()` nhận thêm `src` (tên hiệu ứng của đòn quái) và nhân `buffFactor()`.
  - Sát thương vào quái không tính vào "Sát thương gây ra".
  - `attackRange()` và `damageMultiplier()` hiểu quái.
- [fog-of-war.md](fog-of-war.md):
  - Hang hiện như lần cuối phe mình thấy (`camp.seen`, `campKnownState()`); quái chỉ hiện khi đang thấy.
  - Quái không cho tầm nhìn.
  - Lăng đã mở thì được đánh dấu đã khám phá cho cả hai phe.
- [ai-opponent.md](ai-opponent.md): `runCampPlan()`, AI tránh hang khi đi lang thang.
- [controls.md](controls.md): chuột phải vào hang để dọn; chuột trái (không chọn quân) để xem thông tin.
- [pathfinding.md](pathfinding.md): quái đi bằng `steerTo()`, lập đường trên toàn bản đồ (`knownMap(2)` = `null`).
- [minimap.md](minimap.md): hình thoi cam (đã dọn: xám), Lăng to hơn.
- [audio.md](audio.md): `creep.howl`, `creep.roar`, `creep.horn`, `creep.bite`, `creep.smash`, `event.campCleared`, `event.tombOpen`.
- [rendering.md](rendering.md): hiệu ứng đòn quái (quỷ đá, Vua Xương đập đất), xác quái ngã (`creepFall`).
- [match-stats.md](match-stats.md): dòng "Hang quái đã dọn".
- [economy.md](economy.md): phần thưởng cộng thẳng vào kho, tính vào "đã thu".

## Multiplayer
- Action guest gửi qua `requestAction()`: `'camp'` + `{ids, campId}`.
- Host xử lý trong `applyAction()`:
  - `detachUnits()` rồi `orderCampAttack()`.
  - Lệnh khác (`move`, `stop`, `attack`, `formation`, `garrison`) gọi `forgetCamp()`.
- Toàn bộ mô phỏng quái chạy ở chủ phòng; `state.camps`, `state.creeps`, `state.buffs` đi qua snapshot.
- Khách gọi `revealOpenedCamps()` trên bản đồ đã khám phá của mình sau mỗi snapshot.
- Thông báo và tiếng (`updateCampNotices()`) so sánh trạng thái giữa các frame, nên khách nhận giống chủ phòng.

## Kiểm thử thủ công
- [ ] Chế độ AI: thấy ổ sói, trại cướp, hang quỷ đá, lăng cổ (niêm phong) khi khám phá tới.
- [ ] Đi ngang gần hang đang ngủ (ngoài 170) không bị đánh; vào gần thì cả hang lao ra, chạy ra ngoài dây xích thì quái quay về hồi máu.
- [ ] Chọn quân, chuột phải vào hang: quân đi tới, dọn sạch, nhận thưởng, thông báo xanh và tiếng kèn.
- [ ] Chuột trái vào hang (không chọn quân): nhật ký ghi quái, phần thưởng, cách dọn.
- [ ] 8:00: thông báo Lăng cổ đã mở, minimap có dấu lăng; hạ Vua Xương: ô buff trên HUD, vòng tím dưới chân quân, quân đi nhanh hơn.
- [ ] Mức Khó: AI gửi đội đi dọn hang.
- [ ] PvP (host và guest): khách thấy quái, ra lệnh dọn hang, nhận thưởng và buff; thông báo hiện ở cả hai máy.

## Giới hạn / việc tồn đọng
- AI yếu đi khi có hang (mô phỏng 5 trận/mức, người chơi chỉ thủ nhà bằng 8 lính giáo, 6 cung, 2 tháp, 18 phút): Khó thắng 2/5 (không có hang 4/5), Thường 3/5 (4/5). Phần lớn trận AI mất 6–11 quân vì quái, vài trận 46–60.
- Mọi số (máu, sát thương, thưởng, thời gian, vị trí) là số tạm, chưa chốt.
- Quái không tách nhau ra như quân (`separateUnits()` chỉ chạy cho quân), nên trong lúc đánh có thể đứng chồng.
- Quái đi đường thẳng tới mục tiêu trong vòng dây xích qua `steerTo()`; không tránh nhau.
- Quân đang trong đội hình nhận lệnh dọn hang sẽ rời đội hình.
- Quái vẽ bằng code, chưa có spritesheet.
