# Bản đồ Ngũ Vực (5 miền đất)

> Trạng thái: Cần kiểm thử · Cập nhật lần cuối: 2026-10-31

## Mô tả
Bản đồ thứ hai, chọn ở sảnh chính (ô **Bản đồ**: Đại Lục / Ngũ Vực). Bản đồ chia thành **5 miền đất**, mỗi miền có một loài quái canh giữ; miền càng quý thì quái càng mạnh. Mỏ **rải ngẫu nhiên** qua các miền (từ 2026-10-31; trước đó mỗi miền chỉ có một loại mỏ, nên từng loại tài nguyên tập trung một chỗ): tổng vẫn 6 lúa, 4 gỗ, 4 đá, 6 vàng; hai vùng đối xứng luôn cùng loại; 4 cờ gần mỗi nhà có đủ 4 loại. Riêng Vực Vàng luôn là vàng giàu. Cột "Mỏ góp" dưới đây là số mỏ mỗi miền góp vào tổng đó, không phải loại mỏ nằm trong miền.

| Miền | Vị trí | Mỏ góp | Quái canh giữ |
|---|---|---|---|
| **Đồng Lúa** | Hai dải đất dọc mép trái và phải; mỗi phe có pháo đài trong dải của mình | Lúa | Bãi heo rừng |
| **Rừng Già** | Nửa trên, giữa hai dải Đồng Lúa | Gỗ | Tổ nhện |
| **Núi Đá** | Nửa dưới, giữa hai dải Đồng Lúa | Đá | Hang gấu đá |
| **Đồi Vàng** | Vành đai tròn quanh tâm bản đồ | Vàng | Hầm golem vàng |
| **Vực Vàng** | Đĩa tròn ở tâm, có hào nước bao quanh | **Vàng giàu** (mỏ sinh gấp đôi) | Hang Rồng Vàng |

- Bản đồ **đối xứng trái ↔ phải**: địa hình, cờ, mỏ, hang quái và hai pháo đài đều là ảnh gương của nhau, nên hai phe có quãng đường như nhau tới từng miền. Mỗi trận vẫn khác nhau: chỗ đặt cờ, hang quái, độ cao của hai pháo đài và việc phe xanh ở bên trái hay bên phải đều ngẫu nhiên.
- Các miền ngăn cách bằng **các dãy núi ngắn** (từ 2026-10-30; trước đó là hai dãy đá dài chỉ mở 3 và 6 đèo): mỗi dãy dày ở giữa, nhọn hai đầu, có hàng đỉnh núi tuyết, giữa các dãy là khe đất đi qua được. Dọc mép Đồng Lúa khoảng 8 dãy mỗi bên; quanh Đồi Vàng 10 dãy; hào nước quanh Vực Vàng có 4 lối đất. Bản đồ này không có sông, nên không có cầu.
- Mỗi miền có màu nền riêng và **cảnh vật riêng** (bảng dưới). Khi thu nhỏ bản đồ, tên miền hiện bằng chữ lớn, mờ, nhưng chỉ khi chỗ đặt tên đã được phe mình khám phá (từ 2026-10-30; trước đó tên hiện cả trên sương mù chưa khám phá, làm lộ bố cục bản đồ). Xóm quanh mỏ, tháp canh, chùa và mây dùng chung với bản đồ Đại Lục ([rendering.md](rendering.md), mục "Làng, tháp canh").
- Luật chiếm cờ, mỏ, công trình và chiến đấu giữ nguyên như bản đồ Đại Lục ([territory.md](territory.md)). Chỉ khác cách sinh bản đồ.

## Luật & thông số
| Thông số | Giá trị | Nguồn trong code |
|---|---|---|
| Số cờ mỗi miền (tổng 2 bên) | Đồng Lúa 6, Rừng Già 4, Núi Đá 4, Đồi Vàng 4, Vực Vàng 2 — tổng 20 | `REALMS[].seeds` × 2 |
| Hang quái (tổng) | 4 bãi heo rừng, 2 tổ nhện, 2 hang gấu đá, 2 hầm golem, 1 Hang Rồng Vàng ở giữa (ổ sói, trại cướp, hang quỷ đá, Lăng cổ chỉ có ở bản đồ Đại Lục) | `REALMS[].camp`, `.camps`, `.centerCamp` |
| Mỏ vàng giàu (Vực Vàng) | × `RICH_GOLD_MULTIPLIER` = 2 → 70 vàng/phút (**số tạm**) | `config/balance.ts`; `mine.rich`, `region.rich` |
| Hình học (tỉ lệ cạnh bản đồ) | Đồng Lúa rộng 0,2; Vực Vàng bán kính 0,11; Đồi Vàng tới bán kính 0,25; dãy đá dày 0,008; hào nước 0,012 | `REALM_LAYOUT` |
| Dãy núi ngắn | Dày nhất 2 × `ridge` = 0,022 cạnh bản đồ (~5–6 ô) ở giữa dãy, nhọn dần về hai đầu (`rangeTaper()`). Mép Đồng Lúa: dãy dài 7% chiều cao, khe 4,5%, một khe giữa ở hàng 50% (`plainsRidge`). Quanh Đồi Vàng: 10 dãy, mỗi dãy 22°, khe 14°, có khe ở 90° (nam) và 270° (bắc) (`ringRidge`). Hào Vực Vàng: lối đất ở góc 45°, 135°, 225°, 315°, mỗi lối 16° | `REALM_LAYOUT` |
| Pháo đài | x trong 7,5–11% bề ngang tính từ mép của phe; y 32–68%; pháo đài kia là ảnh gương; phe xanh ở trái hay phải là ngẫu nhiên | `REALM_BASE`, `fresh()` |
| Giữ vùng trong miền | Vùng lan sang ô của miền khác tốn thêm `REALM_CROSS_COST` = 400 mỗi ô | `buildRegionMap()` |

**Cảnh vật từng miền** (`REALM_DECOR_PASSES`, `placeRealmDecor()` trong [src/render/realm-decor.ts](../../src/render/realm-decor.ts); chỉ để nhìn, không chặn quân hay công trình, không đổi luật). Sprite vẽ bằng code lúc tải trang; vị trí tất định theo bản đồ như cây và đá ([rendering.md](rendering.md)), chừa trống quanh pháo đài, cờ, mỏ, hang quái.

| Miền | Vật (lượt: nơi mọc · step / chance / gap) | Số lượng (chạy thử) |
|---|---|---:|
| Đồng Lúa | ruộng lúa (vẽ chung với mọi ruộng: [rendering.md](rendering.md), mục "Vật cản"; bông lúa `wheat` trên ruộng bỏ ngày 2026-10-30 vì rối mắt), đống rơm `haystack` (cỏ, ruộng · 5 / 0,09 / 120), bù nhìn `scarecrow` (ruộng · 7 / 0,1 / 160), hoa dại `flowers` nằm phẳng (cỏ · 3 / 0,1 / 50) | ~44 rơm, ~200 hoa |
| Rừng Già | dương xỉ `fern` (2 / 0,1 / 30), nấm `mushrooms` (3 / 0,06 / 40), thân cây đổ `log` (6 / 0,08 / 100) | ~210 / ~48 / vài chục |
| Núi Đá | cây khô `deadTree` (5 / 0,06 / 110), ụ đá xếp `cairn` (5 / 0,06 / 80) | ~20 / ~21 |
| Đồi Vàng | cỏ vàng (`hillGrass`, sprite `wheat`; ruộng · 2 / 0,12 / 40), đá mạch vàng `goldOre` (3 / 0,12 / 90), xe goòng và cuốc `mineCart` (8 / 0,15 / 200) | ~240 / ~63 / 1–6 |
| Vực Vàng | tinh thể vàng phát sáng `crystal` (3 / 0,16 / 90), cột đá cổ đổ `pillar` (5 / 0,16 / 140), vòng ấn chú `rune` nằm phẳng (5 / 0,2 / 140) | ~28 / ~7 / ~3 |
| Dãy núi | đỉnh núi tuyết (`peak`, 4 kiểu vẽ tay chọn ngẫu nhiên theo vị trí, cỡ lệch nhẹ) dọc mỗi dãy, mỗi `REALM_PEAKS.spacing` = 210 một đỉnh, cao nhất ở giữa dãy (`scale` 0,5 → 0,85) | ~50 |
| Khe chính | cột mốc đá có đuốc `marker`: hai cột ở khe giữa mép Đồng Lúa mỗi bên, hai cột ở khe bắc và khe nam của Đồi Vàng | 8 |

Đo 2026-10-30 trên Chrome: `draw()` khoảng 2 ms mỗi khung ở Đồng Lúa / Đồi Vàng (bản đồ Đại Lục 1,2–1,7 ms).

**Quái riêng của từng miền** (2026-10-30, **số tạm**; trước đó bản đồ này dùng lại ổ sói, trại cướp, hang quỷ đá, Lăng cổ của bản đồ Đại Lục). Mỗi miền cần một kiểu quân khắc chế khác; quái mạnh dần theo giá trị miền. Hệ số khắc chế lấy theo `counterAs` từ bảng `COUNTER_MULTIPLIERS` ([combat.md](combat.md)):

| Quái | Máu | Sát thương | Tầm | Tốc độ | Hồi chiêu | Khắc chế như | Nghĩa là |
|---|---:|---:|---:|---:|---:|---|---|
| Heo rừng | 130 | 14 | 20 | 60 | 0,9 s | kỵ binh | lính giáo đánh ×2,2; heo húc cung thủ ×1,5 |
| Nhện chúa | 380 | 16, phun độc (bắn tầm xa) | 100 | 34 | 1,3 s | cung thủ | kỵ binh đánh ×1,5; nhện phun lính giáo ×1,3 |
| Nhện con | 60 | 9 | 18 | 66 | 0,8 s | lính | — |
| Gấu đá | 520 | 30, đánh lan 30 | 28 | 40 | 1,4 s | lính giáo | cung thủ ×1,3, lính ×1,2; gấu vồ kỵ binh ×2,2 |
| Golem vàng | 900 | 22, đánh lan 30 (giảm từ 30 / 36 ngày 2026-10-30: trước đó khó hơn cả Rồng Vàng) | 34 | 28 | 1,5 s | lính giáo | như gấu đá |
| Rồng Vàng | 2100 | 45, phun lửa đánh lan 60 | 70 | 34 | 1,6 s | — | không khắc chế; đánh lan rộng nên quân đứng dồn chịu nặng |

| Hang (`CAMP_TYPES`) | Miền | Quái | Thưởng | Quay lại sau | Đánh thức | Dây xích |
|---|---|---|---|---:|---:|---:|
| Bãi heo rừng `boars` | Đồng Lúa | 4 heo rừng | 130 lúa | 240 s | 130 | 330 |
| Tổ nhện `spiders` | Rừng Già | 1 nhện chúa + 4 nhện con | 120 gỗ + 40 vàng | 240 s | 150 | 360 |
| Hang gấu đá `bears` | Núi Đá | 2 gấu đá | 140 đá + 40 vàng | 300 s | 130 | 320 |
| Hầm golem vàng `golem` | Đồi Vàng | 2 golem vàng | 140 vàng | 300 s | 140 | 320 |
| Hang Rồng Vàng `dragon` | Vực Vàng | Rồng Vàng | 200 vàng + buff +15% sát thương, +10% tốc độ trong 90 s | 300 s | 190 | 440 |

Hang Rồng Vàng như Lăng cổ: niêm phong tới 8:00 (`opensAt` = 480), mở thì báo cả hai phe; phe gây nhiều sát thương nhất nhận buff; thông báo và ô buff trên HUD ghi tên hang và tên trùm (`bossName`, `buffSource()`).

Tổng máu quái mỗi hang tăng theo giá trị miền: heo rừng 520 < tổ nhện 620 < gấu đá 1.040 < golem 1.800 < Rồng Vàng 2.100 (test `places each realm's own monster camp…`).

Đánh thử 2026-10-30 (Chrome, mỗi trận 3 lần, quân đứng cách hang 420 rồi ra lệnh dọn):

| Hang | Quân | Kết quả |
|---|---|---|
| Bãi heo rừng | 6 lính giáo / 6 cung thủ | dọn ~10 s không mất ai / ~13 s mất 1 |
| Tổ nhện | 6 kỵ binh / 6 lính giáo | ~9 s không mất ai / ~17–24 s mất 1–2 |
| Hang gấu đá | 7 cung thủ / 7 kỵ binh | ~15 s mất 1 / ~12 s mất 0–2 |
| Hầm golem | 10 lính giáo / 10 cung thủ | ~24 s mất 2 / ~17 s mất 1 |
| Hang Rồng Vàng | 14 lính giáo / 14 lính / 10 kỵ binh | ~21 s mất 4 / ~18 s mất 10 / ~14 s mất 1 |

So với bản đồ Đại Lục: ổ sói (6 lính giáo) không mất ai; Lăng cổ với 12 lính giáo mất khoảng 6.

AI (`AI_CAMP_SQUAD`): heo rừng 5, nhện 6, gấu đá 7, golem 10, rồng 14 quân. Độ Thường dọn ổ sói và bãi heo rừng; độ Khó dọn mọi hang (`AI_DIFFICULTY.camps`).

**Sinh bản đồ** (`fresh()` khi `settings.mapKind === 'realms'`):
1. `useMap('realms')` dựng địa hình (`fillRealmsTerrain()`): chỉ tính nửa trái rồi chép gương sang nửa phải; nền mỗi miền theo nhiễu mịn (Đồng Lúa: cỏ + ruộng + vài lùm cây + 2 ao; Rừng Già: rừng dày; Núi Đá: khối đá giữa thung cỏ; Đồi Vàng: ruộng vàng + đá rải rác; Vực Vàng: đất vàng), rồi thêm dãy đá, hào nước. Tất định (không dùng `Math.random`), nên khách PvP dựng lại được từ mã bản đồ.
2. Đặt hai pháo đài đối xứng (`REALM_BASE`).
3. `generateRegions(…, 'realms')`: với mỗi miền, lấy ngẫu nhiên `seeds` hạt giống trong miền ở nửa trái (Đồng Lúa: mỗi hạt giống một dải ngang, để cờ trải trên – giữa – dưới), rồi lấy ảnh gương sang nửa phải. `region.realm` là miền chứa hạt giống. Loại tài nguyên: cặp vùng Vực Vàng giữ vàng giàu; 9 cặp còn lại chia ngẫu nhiên phần `REALMS[].resource` × `seeds` của các miền, 4 cặp gần pháo đài nhất nhận mỗi cặp một loại. Nếu một vùng không đặt được cờ hoặc mỏ, cả lần sinh bị loại và `fresh()` thử lại.
4. `placeCamps(…, 'realms')` → `placeRealmCamps()`: hang của mỗi miền đặt trong miền đó theo cặp gương; Hang Rồng Vàng (`centerCamp`) ở chỗ trống gần trục giữa nhất trong Vực Vàng.
5. Kiểm tra đi bộ tới được mọi cờ, mỏ và độ công bằng như bản đồ Đại Lục.

Đo trên Chrome (2026-10-30): khoảng 80–130 ms mỗi bản đồ; 20/20 lần sinh đủ 20 cờ, 20 mỏ, 11 hang.

## Code liên quan
- [src/config/maps.ts](../../src/config/maps.ts): `MAPS`, `DEFAULT_MAP`, `REALMS`, `REALM_LAYOUT`, `REALM_BASE`, `REALM_CROSS_COST`.
- [src/map/realms.ts](../../src/map/realms.ts): `REALM_INDEX`, `realmAt()`, `fillRealmsTerrain()`.
- [src/render/realm-decor.ts](../../src/render/realm-decor.ts): sprite cảnh vật từng miền, `REALM_DECOR_PASSES`, `placeRealmDecor()`, `realmDecorSprite()`, `FLAT_REALM_DECOR`; gọi từ `buildWorldDecor()`, vẽ qua `decorSprite()` / `drawDecor()` và `groundDecor` ([src/render/terrain.ts](../../src/render/terrain.ts), `draw()`).
- [src/map/terrain.ts](../../src/map/terrain.ts): `buildTerrain(mapId)`, `useMap()`, `tileRealm`, `terrainMapId`, `terrainVersion`.
- [src/map/regions.ts](../../src/map/regions.ts): `generateRegions(blueBase, redBase, mapId)`, `buildRegionMap()` (chi phí qua miền), `regionLabel(r, withRealm)`.
- [src/map/camps.ts](../../src/map/camps.ts): `placeCamps(…, mapId)`, `placeRealmCamps()`.
- [src/map/paths.ts](../../src/map/paths.ts): `buildWalkable()` chỉ dựng cầu trên bản đồ Đại Lục.
- [src/core/match.ts](../../src/core/match.ts): `fresh()` đọc `settings.mapKind`, ghi `state.mapId`.
- [src/config/creeps.ts](../../src/config/creeps.ts): `CREEP_TYPES` (`boar`, `spiderQueen`, `spiderling`, `rockBear`, `golem`, `dragon`), `CAMP_TYPES` (`boars`, `spiders`, `bears`, `golem`, `dragon`; trường `bossName`), `AI_CAMP_SQUAD`. [src/config/balance.ts](../../src/config/balance.ts): `RICH_GOLD_MULTIPLIER`, `AI_DIFFICULTY.hard.camps`.
- Vẽ: [src/render/creeps.ts](../../src/render/creeps.ts) (`DRAW.boar` / `spiderling` / `spiderQueen` / `rockBear` / `golem` / `dragon`, `justStruck()`, `BAR_TOP`; các hang trong `drawCampSite()`; `buffSource()`), [src/render/terrain.ts](../../src/render/terrain.ts) (`drawRealmLabels()`), [src/config/visuals.ts](../../src/config/visuals.ts) (`REALM_GROUND`, `REALM_LABEL`, màu golem trong `CREEP_COLORS`); nhãn mỏ "MỎ VÀNG GIÀU" trong `draw()`.
- Sảnh: `#mapKind` trong [index.html](../../index.html), `showMapKind()` trong [src/ui/modeScreen.ts](../../src/ui/modeScreen.ts); cài đặt `settings.mapKind` ([settings.md](settings.md)). Nhãn chế độ trong trận ghi tên bản đồ (`setGameModeLabel()`).
- Trường trong `state`: `state.mapId`; `region.realm`, `region.rich`; `mine.rich`.

## Tương tác
- [territory.md](territory.md): cách chia vùng, đặt cờ và mỏ dùng chung; chỉ khác hạt giống và cách gán tài nguyên.
- [neutral-camps.md](neutral-camps.md): thêm hầm golem vàng; vị trí hang theo miền thay cho `CAMP_LAYOUT`.
- [economy.md](economy.md): mỏ vàng giàu.
- [pathfinding.md](pathfinding.md): không có cầu; đi qua miền bằng các khe giữa những dãy núi ngắn.
- [rendering.md](rendering.md): địa hình dựng lại khi đổi bản đồ; các lớp đệm (minimap, đốm nền) theo `terrainVersion`.
- [ai-opponent.md](ai-opponent.md): AI chơi như trên bản đồ Đại Lục (đã chạy thử 8 phút độ Khó: chiếm cờ, dọn trại cướp, thắng).

## Multiplayer
- Chủ phòng chọn bản đồ ở sảnh trước khi tạo phòng; `fresh()` của chủ phòng ghi `state.mapId`. Lựa chọn bản đồ của khách không có tác dụng.
- Khách: `applySnapshot()` gọi `useMap(state.mapId)` trước khi dựng bản đồ vùng, nên địa hình, miền và đường đi giống chủ phòng; `startGuestFromSnapshot()` dựng lại vật trang trí sau đó.
- Không có action mới.

## Kiểm thử thủ công
- [ ] Sảnh: chọn Ngũ Vực → Chơi với AI → nhãn chế độ ghi "Ngũ Vực"; bản đồ có 5 miền, thu nhỏ thấy tên miền.
- [ ] Chiếm cờ Vực Vàng → mỏ ghi "MỎ VÀNG GIÀU +70".
- [ ] Đi qua từng miền: Đồng Lúa có rơm, bù nhìn, lúa, hoa; Rừng Già có dương xỉ, nấm, cây đổ; Núi Đá có cây khô, ụ đá; Đồi Vàng có cỏ vàng, đá mạch vàng, xe goòng; Vực Vàng có tinh thể, cột đổ, vòng ấn chú; mỗi đèo có cột mốc đuốc. Thu nhỏ hết cỡ: cảnh vật vẫn hiện (lớp vẽ sẵn).
- [ ] Dọn hầm golem vàng (khoảng 10 lính giáo) → +140 vàng.
- [ ] Mỗi miền: bãi heo rừng (lính giáo), tổ nhện (kỵ binh), hang gấu đá (cung thủ) dọn được, mang sai quân thì mất quân hơn.
- [ ] 8:00: "Hang Rồng Vàng đã mở! Hạ Rồng Vàng để…"; dọn được thì ô buff trên HUD ghi "Sức mạnh Hang Rồng Vàng".
- [ ] Chọn lại Đại Lục → trận mới có sông và 4 cầu như cũ.
- [ ] PvP: chủ phòng chọn Ngũ Vực, khách để Đại Lục → khách thấy đúng bản đồ Ngũ Vực, quân đi qua các khe núi giống chủ phòng.
- Đã chạy 2026-10-31 sau khi rải mỏ ngẫu nhiên: `pnpm test` (122 test), `pnpm smoke maps ai pvp`, đều đạt.
- Đã chạy 2026-10-30: `pnpm test` (5 test trong `tests/map.test.ts`: đối xứng, tài nguyên đúng miền, công bằng, vàng giàu, hang đúng miền, đổi lại Đại Lục); `pnpm smoke maps` (10 bản đồ Ngũ Vực trên Chrome); AI Khó tự chơi 8 phút không lỗi.

## Giới hạn / việc tồn đọng
- Số liệu các quái và hang của miền (heo rừng, nhện, gấu đá, golem, Rồng Vàng) và hệ số vàng giàu là **số tạm**, cần chơi thử để chốt (cùng mục 9 trong [decisions/can-xac-nhan.md](../decisions/can-xac-nhan.md)).
- Chưa thử PvP thật giữa hai máy trên bản đồ này.
- Chỉ có một bố cục cố định (5 miền ở cùng chỗ mỗi trận); chưa có biến thể xoay/đảo miền.
