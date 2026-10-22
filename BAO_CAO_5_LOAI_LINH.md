# Báo cáo 5 loại quân — Mini War RTS

**Phạm vi:** Đối chiếu mã nguồn hiện tại trong `D:/dự án/mini-war`. Đây là báo cáo đọc mã; không thay đổi mã nguồn, gameplay hoặc thông số.

## Nguồn chỉ số chung

Các chỉ số nền tảng được khai báo trong `src/config/balance.ts`, đối tượng `specs`. Tốc độ và tầm đánh dùng đơn vị thế giới của game; `cooldown` là số giây giữa hai lần đánh. Chi phí huấn luyện được trả khi xếp hàng (`buy` trong `src/sim/units.ts`), và thời gian huấn luyện lấy từ `specs[type].train`. Trường `r` là bán kính thân dùng cho va chạm/tìm đường, không phải kích thước sprite.

## Bảng chỉ số

| Thuộc tính | Trinh sát | Lính bộ | Lính giáo | Lính cung | Kỵ binh |
|---|---:|---:|---:|---:|---:|
| HP | 60 | 100 | 145 | 65 | 210 |
| Sát thương cơ bản mỗi đòn | 7 | 14 | 12 | 16 | 24 |
| Tầm đánh nền | 18 | 22 | 26 | 125 | 27 |
| Tốc độ đánh | 1 đòn / 1,1 giây (`cooldown: 1.1`) | 1 / 0,8 giây (`0.8`) | 1 / 0,82 giây (`0.82`) | 1 / 1,05 giây (`1.05`) | 1 / 0,9 giây (`0.9`) |
| Tốc độ di chuyển nền | 72 | 45 | 38 | 34 | 58 |
| Chi phí huấn luyện | 25 lương thực | 40 lương thực | 45 lương thực + 15 gỗ | 55 lương thực + 25 gỗ + 10 vàng | 80 lương thực + 35 vàng |
| Thời gian huấn luyện | 4 giây | 5 giây | 6 giây | 8 giây | 12 giây |
| Nuôi quân | 0,3 lương thực/phút | 0,8/phút | 0,8/phút | 1,2/phút | 2,5/phút |
| Bán kính thân `r` | 8 | 10 | 11 | 9 | 13 |

**Bằng chứng:** `src/config/balance.ts` → `specs.scout`, `specs.infantry`, `specs.spearman`, `specs.archer`, `specs.cavalry`. `src/sim/units.ts` → `buy`, `queueTraining`, `updateTraining`. `src/core/match.ts` → vòng cập nhật đơn vị dùng `s.speed`, `s.cooldown`, `s.damage`; `src/sim/combat.ts` → `attackRange` cộng thêm bán kính mục tiêu khi đánh đơn vị. Do đó, tầm thực tế với mục tiêu đơn vị là tầm nền cộng `specs[target.type].r`; với công trình/pháo đài dùng nhánh cấu trúc trong `attackRange`.

## Hình ảnh, vũ khí và animation

| Quân | Hình ảnh đang được tham chiếu và cách vẽ | Vũ khí thể hiện | Animation đã có |
|---|---|---|---|
| Trinh sát | `public/assets/units/scout/scout-sheet.png`; `scoutSpriteSheet`, `scoutClips`; vẽ trong `drawUnitBody` | Cấu hình gameplay không có trường vũ khí. Sprite dự phòng trong code vẽ ống nhòm/ba lô liên lạc, không vẽ vũ khí chiến đấu. | Đứng yên và đi bộ, 4 frame mỗi hàng, hai phe; `scoutClips` trong `src/render/sprites.ts`. |
| Lính bộ | `public/assets/units/infantry/infantry-sheet.png`; `infantrySpriteSheet`, `infantryClips`; vẽ trong `drawUnitBody` | Không có trường vũ khí gameplay. Nhánh sprite dự phòng trong `drawUnitBody` vẽ một vật thể dạng khiên và đường kiếm; đó là minh họa dự phòng, không phải dữ liệu chiến đấu riêng. | Đứng yên và đi bộ, 4 frame mỗi hàng, hai phe; `infantryClips`. |
| Lính giáo | `public/assets/units/spearman/spearman-sheet.png`; `spearmanSpriteSheet`; vẽ trong `drawUnitBody` theo bốn hướng (`down/left/up/right`) và phe | Trường vũ khí riêng: **chưa có**. Tên loại quân và sheet thể hiện đây là lính giáo, nhưng cấu hình chiến đấu không mô hình hóa vũ khí riêng. | Đứng yên và đi bộ, 4 frame; 16 hàng theo phe × hướng × trạng thái; `spearmanClips`, `SPEARMAN_DIRECTIONS`, `SPEARMAN_ROWS`. |
| Lính cung | `public/assets/units/archer/archer-sheet.png`; `archerSpriteSheet`, `archerClips`; khi bắn, `src/core/match.ts` tạo đạn bay tới mục tiêu | Có cung/tên trong hình minh họa dự phòng của `drawUnitBody`; code chiến đấu chỉ phân loại riêng cung thủ bằng `u.type === 'archer'` và tạo projectile, không có thuộc tính dữ liệu vũ khí. | Đứng yên và đi bộ, 4 frame mỗi hàng, hai phe; **animation bắn riêng: chưa có trong `archerClips`**. Cơ chế bắn đạn có, nhưng không đồng nghĩa có hoạt ảnh bắn. |
| Kỵ binh | `public/assets/units/cavalry/cavalry-sheet.png`; `cavalrySpriteSheet`, `cavalryClips`; vẽ trong `drawUnitBody` | Trường vũ khí gameplay: **chưa có**. Sprite dự phòng vẽ người cưỡi ngựa và một cây thương/giáo dài; đây chỉ là hình vẽ, không có xử lý vũ khí riêng. | Đứng yên 3 frame và đi bộ 4 frame mỗi hàng, hai phe; `cavalryClips`. |

**Bằng chứng hình ảnh/animation:** `src/render/sprites.ts` → các hằng `*SpriteSheet`, `*Clips`, `SPEARMAN_DIRECTIONS`, `SPEARMAN_ROWS`; `src/render/units.ts` → `drawUnit`, `drawUnitBody`, `drawFallenUnit`. Các asset sheet được liệt kê trong `public/assets/units/`. Đơn vị dùng ảnh sprite sheet khi ảnh tải được; một số nhánh vẽ Canvas dự phòng trong `drawUnitBody` chỉ chạy khi không có sprite tương ứng.

## Hành vi AI và chọn mục tiêu

### Cơ chế chọn mục tiêu chung

- `src/sim/combat.ts` → `nearestEnemy(u)` duyệt đơn vị địch nhìn thấy được và chọn đơn vị gần nhất; sau đó xét pháo đài và công trình địch nhìn thấy. Pháo đài/công trình chỉ thay mục tiêu đơn vị gần nhất khi gần hơn theo ngưỡng ưu tiên được ghi trong hàm.
- `unitTargetValid(t,u)` loại mục tiêu đã chết hoặc cùng phe. `attackRange(u,target)` xác định khoảng đánh.
- `src/core/match.ts` → vòng cập nhật đơn vị gọi `nearestEnemy`, cho đánh khi ở trong tầm; cung thủ tạo đạn có `speed: 280`, `life: 2`, các loại còn lại gọi `hurt` trực tiếp. Đơn vị đuổi mục tiêu khi có lệnh `attack`, thuộc AI, hoặc được phép đuổi theo đội hình/xuất kích; vì vậy không phải đơn vị người chơi nào cũng tự truy đuổi chỉ vì phát hiện mục tiêu.
- Tầm nhìn giới hạn mục tiêu mới theo Fog of War: `nearestEnemy` dùng `teamCanSee`/`aiCanSee`. Hệ số khắc chế áp dụng qua `damageMultiplier` trong `src/sim/combat.ts`; bảng `COUNTER_MULTIPLIERS` ở `src/config/balance.ts` gồm giáo khắc kỵ binh ×2,2; kỵ binh khắc cung thủ ×1,5; cung thủ khắc giáo ×1,3; bộ binh khắc giáo ×1,2. Đây là hệ số sát thương, không phải nâng cấp.

### Hành vi theo loại quân

- **Trinh sát:** phe AI tự giao mục tiêu khám phá vùng chưa thấy qua `exploreSpot` (`src/ai/attack.ts`); trong `src/core/match.ts`, trinh sát của AI dùng ứng viên khám phá thay vì điểm mục tiêu AI thông thường. Trinh sát không được đưa vào nhóm chiếm cờ (`src/ai/enemy.ts`, bộ lọc `u.type !== 'scout'`; `FLAG_SCOUTS_CAPTURE=false` trong `src/config/balance.ts`). AI cố duy trì tối đa hai trinh sát qua nhánh `aiScouts`/`aiBuy('scout')` trong `runEnemyAI`.
- **Lính bộ:** không có vai trò AI độc quyền. AI kinh tế có thể huấn luyện lính bộ; chế độ `smartMix` cân nhắc quân địch đã thấy và tỷ lệ thành phần quân trong `pickUnit`. Quân không trinh sát có thể được dùng đi chiếm cờ, tập hợp thành đợt tấn công, tiếp viện hoặc phòng thủ (`src/ai/enemy.ts`, `src/ai/attack.ts`).
- **Lính giáo:** hành vi vai trò giống lính chiến đấu khác; `pickUnit` có thể chọn giáo theo khắc chế và tài nguyên. Hệ số giáo đánh kỵ binh ×2,2 trong `COUNTER_MULTIPLIERS`. AI cũng có nhánh huấn luyện giáo trong chế độ lựa chọn ngẫu nhiên cũ (`runEnemyAI`).
- **Lính cung:** hành vi AI/đội hình như quân chiến đấu khác; khác biệt chiến đấu là đòn đánh tạo projectile bay theo mục tiêu. `pickUnit` có thể chọn cung dựa trên quân địch đã thấy, vàng/gỗ còn dư và tỷ lệ cung trong đội. Hệ số cung đánh giáo ×1,3.
- **Kỵ binh:** hành vi AI/đội hình như quân chiến đấu khác; `pickUnit` cân nhắc khắc chế, tài nguyên và tỷ lệ thành phần quân. Hệ số kỵ binh đánh cung thủ ×1,5.

**Bằng chứng AI:** `src/ai/enemy.ts` → `runEnemyAI`, `pickUnit`; `src/ai/attack.ts` → `pickTarget`, `runAttackPlan`, `aiUnitGoal`, `exploreSpot`; `src/core/match.ts` → vòng mô phỏng đơn vị và lệnh đuổi mục tiêu.

## Nâng cấp hiện có

**Nâng cấp chỉ số/đơn vị cho cả năm loại: chưa có.** Trong `src/config/balance.ts`, `specs` khai báo các chỉ số cố định theo loại, không khai báo cấp quân hay nghiên cứu tăng HP/sát thương/tầm/tốc độ. Trong `src/sim/buildings.ts`, `upgradeCost`, `upgradeTarget`, `startUpgrade` giới hạn nâng cấp hiện hành vào nông trại; `FARM_LEVELS` và `FARM_UPGRADE_SECONDS` quy định sản lượng nông trại. `QUEUE_LANE_UPGRADES` cùng `buyQueueLane`/`updateQueueLanes` trong `src/sim/units.ts` chỉ mở thêm hàng huấn luyện song song, không sửa thuộc tính quân. AI lựa chọn quân khắc chế trong `pickUnit` cũng là chọn loại quân khi huấn luyện, không phải nâng cấp.

## Danh sách file bằng chứng chính

- `src/config/balance.ts` — `specs`, `UNIT_VISION`, `COUNTER_MULTIPLIERS`, `STRUCTURE_DAMAGE_MULTIPLIERS`, `QUEUE_LANE_UPGRADES`, `FARM_LEVELS`.
- `src/sim/units.ts` — `spawn`, `buy`, `queueTraining`, `updateTraining`, `buyQueueLane`, `updateQueueLanes`.
- `src/sim/combat.ts` — `nearestEnemy`, `attackRange`, `unitTargetValid`, `damageMultiplier`, `hurt`.
- `src/core/match.ts` — vòng cập nhật unit/AI/combat, projectile cung thủ và quy tắc đuổi mục tiêu.
- `src/ai/enemy.ts` — `runEnemyAI`, `pickUnit`.
- `src/ai/attack.ts` — `pickTarget`, `runAttackPlan`, `aiUnitGoal`, `exploreSpot`.
- `src/render/sprites.ts` — asset và animation clip của năm loại quân.
- `src/render/units.ts` — `unitTargetHeight`, `drawUnit`, `drawUnitBody`, `drawFallenUnit`, thanh máu và vòng chọn.
- `src/sim/buildings.ts` — `upgradeCost`, `upgradeTarget`, `startUpgrade` (xác nhận phạm vi nâng cấp công trình hiện có).
- `public/assets/units/{scout,infantry,spearman,archer,cavalry}/*-sheet.png` — ảnh sprite được tham chiếu trong `src/render/sprites.ts`.

> Ghi chú: “chưa có” nghĩa là không tìm thấy dữ liệu/chế độ tương ứng trong cấu hình hoặc luồng code đã dẫn ở trên; không suy diễn từ tên hoặc hình vẽ của asset.
