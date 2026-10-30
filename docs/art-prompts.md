# Prompt tạo ảnh cho các chi tiết chưa có ảnh

> Cập nhật lần cuối: 2026-10-30

Danh sách prompt để tạo ảnh bằng công cụ AI (ChatGPT/DALL·E, Midjourney, Gemini, Stable Diffusion…) cho những thứ trong game **đang được vẽ bằng code**, chưa có ảnh vẽ thật như quân lính, pháo đài (`fortress-sprite.png`) hay nông trại (`farmstead-v2.png`). Mỗi mục ghi chỗ code đang vẽ nó để sau này thay một-đổi-một.

Phạm vi: quái và hang quái, công trình và mỏ, cảnh vật và địa hình. Chân dung quân, hoạt ảnh quân và biểu tượng giao diện **không** có trong danh sách này.

## Cách dùng
1. Ghép **khối phong cách chung** (bên dưới) vào trước prompt của từng mục. Riêng texture nền dùng khối phong cách texture.
2. Tạo ảnh ở cỡ **gấp 4 lần kích thước thế giới** ghi trong mục (ví dụ vật 60×80 thì tạo khung khoảng 240×320, hoặc khung vuông 1024 rồi cắt). Ảnh to hơn thì khi thu nhỏ trong game vẫn nét.
3. Tạo đủ **số biến thể** ghi trong mục. Đó là số kiểu code đang vẽ, để các vật giống nhau đứng cạnh nhau không lặp hình.
4. Lưu ảnh theo [assets.md](assets.md):
   - ảnh gốc AI tạo: `art/<nhóm>/<tên>/source/<tên>-<biến-thể>.png`;
   - ảnh game dùng (đã cắt, nền trong suốt): `public/assets/<nhóm>/<tên>/<tên>-<biến-thể>.png`;
   - `<nhóm>` dùng: `creeps`, `buildings`, `scenery`, `terrain`.
   Tên file viết thường, không dấu, nối bằng `-`.
5. Nếu công cụ không tạo được nền trong suốt: tạo trên nền **một màu phẳng** (thêm "on a plain flat magenta background") rồi tách nền.
6. Kiểm tra trước khi đưa vào game: vật nằm giữa khung, chân vật chạm đáy khung (điểm neo là giữa đáy, trừ texture và vật nằm phẳng), ánh sáng từ trên bên trái giống các ảnh đang có.

## Khối phong cách chung
Dán vào đầu mọi prompt vật thể:

```
Isometric 3/4 top-down view, painterly semi-realistic medieval fantasy RTS game asset, rich hand-painted detail,
soft warm light from the upper left, gentle contact shadow under the object, crisp clean silhouette, single object
centered, full object visible, transparent background, no text, no border, no ground plane, no other objects.
```

Lưu ý thêm khi cần:
- **Vật có chủ (phe xanh / phe đỏ):** tạo bản phe xanh (*"royal blue banners and trim with gold accents"*). Bản phe đỏ đổi màu sau (như `to_red()` trong `tools/build_spearman_sheet.py`) hoặc tạo lại với *"crimson red banners and trim with gold accents"*.
- **Kiểu Á Đông** (nhà tranh, chùa, tháp canh): thêm *"East Asian rural style"*. Ảnh tham chiếu phong cách nằm trong thư mục ảnh người dùng gửi (bản đồ chiến dịch vẽ tay).
- **Quái:** chúng là sinh vật nên cần **spritesheet**. Thêm *"character sprite sheet, 4 columns × N rows, same character in every cell, consistent scale and foot line, evenly spaced grid"* và ghi rõ các hàng (xem từng mục).

## Khối phong cách texture
Dán vào đầu mọi prompt texture nền:

```
Seamless tileable texture, top-down orthographic view, no perspective, even soft lighting, no cast shadows,
hand-painted RTS game terrain, square tile, edges wrap perfectly, no text, no border.
```

Texture tạo khung vuông 1024×1024. Trong game nó được lặp, nên phải thử ghép 2×2 xem có lộ đường nối không.

---

## A. Quái & hang quái
Code hiện tại: quái vẽ trong `DRAW` ([src/render/creeps.ts](../src/render/creeps.ts)), hang vẽ trong `drawCampSite()`; số liệu trong `CREEP_TYPES` / `CAMP_TYPES` ([src/config/creeps.ts](../src/config/creeps.ts)).

**Spritesheet quái (dùng chung cho cả 7 loại):**
- 4 cột × 6 hàng: đi xuống, đi lên, đi ngang (phải; trái lật gương), đánh xuống, đánh ngang, chết (4 khung ngã).
- Ô vuông, chân cùng một đường.
- Quái là trung lập: không màu phe.

### A1. Sói — `wolf`
- Kích thước thế giới: thân dài khoảng 40, cao 28 (bán kính va chạm 9). Biến thể: 1 sheet.
- Ghi chú: sói đi theo bầy 5 con (ổ sói). Code hiện có tư thế cắn riêng (`wolfPoseAngles()`), hàng "đánh" nên có bước lao tới và ngoạm.
```
A lean grey timber wolf, shaggy fur with darker back, amber glowing eyes, bared fangs, alert hunting posture.
Character sprite sheet, 4 columns × 6 rows: walk down, walk up, walk right, bite attack down, bite attack right,
death collapse. Same wolf in every cell, consistent scale and foot line.
```

### A2. Cướp — `bandit`
- Kích thước: cao khoảng 46, bán kính 10. Biến thể: 1 sheet.
```
A rugged medieval bandit, brown hooded cloak over a patched leather jerkin, cloth mask over the lower face,
short curved sword, worn boots. Character sprite sheet, 4 columns × 6 rows: walk down, walk up, walk right,
sword slash down, sword slash right, death collapse. Same bandit in every cell.
```

### A3. Cướp cung — `banditArcher`
- Kích thước: cao khoảng 44, bán kính 9. Biến thể: 1 sheet. Bắn tên tầm xa.
```
A medieval bandit archer, dark olive hood and cloak, leather bracers, wooden short bow, quiver of arrows on the
back. Character sprite sheet, 4 columns × 6 rows: walk down, walk up, walk right, draw and shoot down,
draw and shoot right, death collapse. Same archer in every cell.
```

### A4. Quỷ đá — `troll`
- Kích thước: cao khoảng 80, bán kính 20. Biến thể: 1 sheet. Đánh lan bằng chùy đá.
```
A huge hunched stone troll, grey-green rocky skin with patches of moss, small glowing yellow eyes, heavy arms,
carrying a crude wooden club topped with a boulder. Character sprite sheet, 4 columns × 6 rows: lumbering walk
down, walk up, walk right, overhead ground-smash down, club swing right, death crumble. Same troll in every cell.
```

### A5. Golem vàng — `golem` (chỉ bản đồ Ngũ Vực)
- Kích thước: cao khoảng 80, bán kính 21. Biến thể: 1 sheet. Canh miền Đồi Vàng, đánh lan.
```
A squat ancient golem of weathered ochre stone studded with jutting gold crystals, glowing gold eyes, massive
rock fists, cracks of golden light in its joints. Character sprite sheet, 4 columns × 6 rows: heavy walk down,
walk up, walk right, double-fist slam down, punch right, death collapsing into rubble and gold shards.
```

### A6. Lính xương — `skeleton`
- Kích thước: cao khoảng 46, bán kính 10. Biến thể: 1 sheet. Đi cùng Vua Xương ở Lăng cổ.
```
An undead skeleton warrior, yellowed bones, faint violet glow in the eye sockets, rusted sword, scraps of old
armour and cloth. Character sprite sheet, 4 columns × 6 rows: walk down, walk up, walk right, sword slash down,
sword slash right, death falling apart into a pile of bones.
```

### A7. Vua Xương — `boss` (Lăng cổ)
- Kích thước: cao khoảng 100, bán kính 24. Biến thể: 1 sheet. Trùm cuối, có hào quang tím.
```
An undead skeleton king, tall and imposing, tattered deep purple royal robe with violet trim, golden spiked crown
on a bare skull, violet glowing eyes, holding a long wooden staff topped with a glowing violet orb, faint purple
aura. Character sprite sheet, 4 columns × 6 rows: slow walk down, walk up, walk right, staff slam down with a
burst of violet energy, staff sweep right, death crumbling into dust and bones.
```

### A7b. Quái riêng của bản đồ Ngũ Vực (2026-10-30)
Cùng định dạng spritesheet 4 cột × 6 hàng như trên. Chỉ số ở [features/realms-map.md](features/realms-map.md).
- **Heo rừng** `boar` (thân dài ~40, cao ~32; đi theo bầy 4):
```
A wild boar with coarse dark-brown bristles, a ridge of stiff hair along the back, curved ivory tusks, small angry
eyes, charging posture. Character sprite sheet, 4 columns × 6 rows: trot down, trot up, trot right, tusk charge down,
tusk charge right, death collapse.
```
- **Nhện chúa** `spiderQueen` (thân ~50, phun độc tầm xa) và **Nhện con** `spiderling` (~20, đi theo bầy 4):
```
[queen] A giant forest spider queen, swollen black abdomen with glowing green markings, eight long jointed legs,
  cluster of red eyes, dripping venom fangs. Sprite sheet 4 × 6: crawl down, crawl up, crawl right, spit green venom
  down, spit venom right, death curling up.
[spiderling] A small black forest spider with red eyes and thin legs. Sprite sheet 4 × 6: scuttle down, up, right,
  bite down, bite right, death curling up.
```
- **Gấu đá** `rockBear` (cao ~52, đánh lan):
```
A huge mountain bear with grey-brown fur and plates of grey stone growing along its back like armour, heavy claws.
Sprite sheet 4 × 6: lumbering walk down, up, right, claw swipe down, claw swipe right, death collapse.
```
- **Rồng Vàng** `dragon` (cao ~110, phun lửa đánh lan; trùm Vực Vàng):
```
A golden dragon with gleaming amber scales, a pale gold belly, wide crimson wings, curved horns, a long spiked tail,
red eyes. Sprite sheet 4 × 6: stalk down, up, right, fire breath down, fire breath right, death collapse with wings
folding.
```
- **Hang** (khung ~180×100; trạng thái còn quái / đã dọn): Bãi heo rừng `boars` (vũng bùn giữa cỏ giẫm nát, bụi cây, khúc gỗ đổ, dấu chân), Tổ nhện `spiders` (mạng nhện lớn giăng giữa hai gốc cây khô, túi trứng), Hang gấu đá `bears` (hang đá nâu, vết vuốt, xương), Hang Rồng Vàng `dragon` (vòm đá lớn trên kho vàng; thêm trạng thái **niêm phong**: tảng đá có ấn vàng chặn cửa).
```
[boars] A muddy wallow in trampled grass, bushes, a fallen log, hoof prints.
[spiders] A huge spider web strung between two dead tree stumps, white egg sacs at the foot.
[bears] A brown rocky bear den, claw marks on the boulders, gnawed bones.
[dragon] A great rock arch over a glittering hoard of gold coins. [sealed: the entrance blocked by a huge boulder
  carved with a glowing gold rune].
```

### A8. Ổ sói — `wolves`
- Kích thước: khung khoảng 180×100 (nền hang bán kính khoảng 86×42). Biến thể: 2 trạng thái — **còn quái** và **đã dọn** (hoang vắng, xương nhiều hơn).
```
A wolf den: a low rocky mound with a dark arched cave mouth, scattered bones, paw prints in the dirt, sparse grass
tufts, a few loose boulders around the entrance.
```

### A9. Trại cướp — `bandits`
- Kích thước: khung khoảng 180×100. Biến thể: còn quái (lửa trại cháy) / đã dọn (tro tàn).
```
A small bandit camp: two patched canvas tents in brown and olive, a ring of sharpened wooden stakes,
a crackling campfire in the middle, crates and a stolen sack of loot.
```

### A10. Hang quỷ đá — `troll`
- Kích thước: khung khoảng 180×100. Biến thể: còn quái / đã dọn.
```
A troll cave: a pile of huge mossy boulders forming a dark cave entrance, gnawed bones, a broken cart wheel,
cracked earth in front.
```

### A11. Hầm golem vàng — `golem` (chỉ Ngũ Vực)
- Kích thước: khung khoảng 180×100. Biến thể: còn quái (tinh thể sáng) / đã dọn (tinh thể tắt, nứt).
```
An old quarry pit in golden hills: a broken rim of ochre rock around a dark hollow, large gold crystals jutting
from the stone and glowing softly, scattered gold-flecked rubble.
```

### A12. Lăng cổ — `tomb`
- Kích thước: khung khoảng 180×130. Biến thể: 3 trạng thái — **niêm phong** (cửa đá có ấn chú, trước 8:00), **mở** (cửa tối, hào quang tím), **đã dọn**.
```
An ancient stone tomb shrine: a stepped plinth, two carved pillars, a triangular stone pediment, a heavy stone door
in the middle. [sealed: the door closed and marked with a glowing violet rune circle] [open: the doorway dark
with violet light spilling out] [cleared: the doorway dark and quiet, cracks in the stone].
```

---

## B. Công trình & mỏ

### B1. Tháp phòng thủ — `tower`
- Code: `drawBuilding()` ([src/render/buildings.ts](../src/render/buildings.ts)); nền 44×48 (`halfW` 22, `halfH` 24), vẽ cao khoảng 90.
- Biến thể: phe xanh / phe đỏ × hoàn thành / đang xây (giàn giáo) / hỏng nặng.
```
A small square stone defensive tower with a wooden crenellated top, an arrow-slit window, a blue banner with gold
trim hanging from the parapet, a ballista visible on top. [under construction: wooden scaffolding, half-built
walls] [damaged: cracked stones, a burnt banner].
```

### B2. Tiền đồn — `outpost`
- Code: `drawBuilding()`; nền 52×48, đứng cạnh cột cờ đã chiếm, có súng.
- Biến thể: phe xanh / phe đỏ × hoàn thành / đang xây / hỏng.
```
A sturdy frontier outpost: a low palisade of sharpened logs around a stone-based wooden blockhouse, a small
watch platform with a mounted crossbow, a blue pennant with gold trim. [under construction] [damaged].
```

### B3. Mỏ tài nguyên — 4 loại + vàng giàu
- Code: trong `draw()` ([src/render/draw.ts](../src/render/draw.ts)), màu tinh thể theo `MINE_TYPES` ([src/config/balance.ts](../src/config/balance.ts)). Khung khoảng 70×50.
- Biến thể: 5 loại × (trung lập / có chủ). Bản có chủ thêm vòng sáng màu phe ở chân; vòng này có thể vẽ bằng code nên chỉ cần bản trung lập.
- Ghi chú: mỏ phải dễ nhận ra loại khi nhìn xa; không vẽ người.
```
[food] A small rice granary mine node: a mound of golden rice sacks and straw bales on a flat stone base, a few
  ripe rice sheaves.
[wood] A lumber node: a neat stack of cut logs and a tree stump with an axe, green leaves around.
[stone] A quarry node: a cluster of pale grey cut stone blocks and rubble, a pickaxe leaning on it.
[gold] A gold vein node: a dark rock outcrop with glittering gold veins and small gold nuggets.
[rich gold] A larger, richer gold vein node: a big rock outcrop bursting with gold crystals and nuggets,
  a soft golden glow.
```

### B4. Sân tập kết — `musterYard`
- Code: `musterYard()` ([src/map/bases.ts](../src/map/bases.ts)); bãi đất cạnh pháo đài nơi quân mới xuất hiện. Vật nằm phẳng, khung khoảng 120×90.
- Biến thể: 1 (không màu phe, hoặc thêm cờ nhỏ màu phe).
```
A flat oval training ground of packed earth, raked lines in the dirt, a wooden weapon rack and two straw training
dummies at the edge, seen from above.
```

### B5. Cầu gỗ
- Code: `drawBridges()` ([src/render/paths.ts](../src/render/paths.ts)). Cầu bắc ngang sông, rộng 3 ô (khoảng 110), dài tuỳ đoạn sông (khoảng 300–700).
- Cần dạng **lặp ngang**: 1 đoạn giữa lặp được + 2 đầu cầu.
```
A sturdy wooden plank bridge seen from above at a slight angle, weathered planks across, wooden railings on both
sides, rope lashings. Provide a seamless horizontally repeating middle section and two bridge-end pieces with
stone footings.
```

### B6. Xóm làng (cạnh mỗi mỏ)
- Code: [src/render/settlements.ts](../src/render/settlements.ts) (`SPRITES`, `SIZE`); thêm *"East Asian rural style"*.

| Mục | Khoá | Kích thước thế giới | Biến thể |
|---|---|---|---:|
| Nhà mái tranh | `hut` | 134×112 | 2 (một kiểu có chái phụ) |
| Đống gỗ | `logPile` | 100×68 | 1 |
| Đá khối (mỏ đá) | `stonePile` | 100×72 | 1 |
| Đống vàng | `goldHeap` | 98×70 | 1 |
| Ruộng lúa nhỏ (nằm phẳng) | `paddy` | 230×138 | 2 |
| Tháp canh gỗ | `watchtower` | 80×150 | 1 (mái màu phe trung lập xanh lam đậm) |
| Chùa ba tầng | `pagoda` | 160×250 | 1 |

```
[hut] A small thatched-roof village hut, timber walls, wooden door and shuttered window, golden straw roof with
  a ridge beam. [variant 2: with a small lean-to annex].
[logPile] A neat pile of cut logs between two wooden posts, round log ends visible, an axe on top.
[stonePile] A stack of cut grey stone blocks at a small quarry, a pickaxe leaning against it.
[goldHeap] A heap of gold ore and nuggets next to a small wooden crate.
[paddy] A small group of four rice paddy plots seen from above, green and golden plots inside earthen banks,
  flat, no perspective.
[watchtower] A tall wooden watchtower on four splayed legs with cross braces, a railed lookout platform and
  a small hipped roof.
[pagoda] A three-tier pagoda on a stone plinth, red timber walls, dark blue-grey tiled roofs with upturned eaves,
  a golden finial.
```

---

## C. Cảnh vật & địa hình

### C1. Cây và đá chung (cả hai bản đồ)
- Code: [src/render/terrain.ts](../src/render/terrain.ts) (`decorSprite()`; `makePineSprite()`, `makeBroadleafSprite()`, `makeBushSprite()`, `drawRockClusterSprite()`, `makeStoneSprite()`, `makeReedSprite()`, `makeLilySprite()`).

| Mục | Khoá | Kích thước thế giới | Biến thể |
|---|---|---|---:|
| Cây thông | `pine` | 74×105 | 5 (độ cao, độ rậm, sắc xanh khác nhau) |
| Cây lá rộng | `broadleaf` | 84×94 | 3 (một kiểu lá vàng mùa thu) |
| Bụi cây | `bush` | 46×31 | 2 (một kiểu có hoa) |
| Cụm đá lớn | `cluster` | 190×136 | 1–2 |
| Đá nhỏ | `stone` | 46×31 | 3 (1, 2, 3 hòn) |
| Cỏ lau ven nước | `reed` | 44×58 | 2 |
| Lá súng (nằm phẳng trên nước) | `lily` | 56×32 | 2 (một kiểu có hoa sen hồng) |

```
[pine] A single tall evergreen pine tree, layered dark green boughs, brown trunk.
[broadleaf] A single round-crowned deciduous tree, lush green leaf clusters, brown trunk.
  [variant: autumn golden-yellow leaves].
[bush] A low leafy green shrub. [variant: dotted with small pink and white flowers].
[cluster] A cluster of large grey granite boulders with scree at the foot.
[stone] [1 / 2 / 3] small grey boulders.
[reed] A clump of tall reeds and cattails growing at a waterline.
[lily] Floating lily pads seen from directly above, flat. [variant: with one pink water lily flower].
```

### C2. Núi
- Code: [src/render/obstacles.ts](../src/render/obstacles.ts) (`paintPeak()`, `PEAK_LAYOUTS`; kích thước `peakWorld` × `peakScale` trong [src/config/visuals.ts](../src/config/visuals.ts)).
- Cụm đỉnh núi `peak`: khung **230×180** ×1,3 (khoảng 300×235). Cần 4 biến thể với hình dạng khác nhau: 2–3 đỉnh, đỉnh sau nhạt hơn.
- Chân núi phải hòa với màu đá cao nguyên `#928a79`, không có mặt đất cỏ.
```
A small massif of 2–3 snow-capped rocky mountain peaks, warm sunlit faces on the left and cool violet shadowed
faces on the right, jagged ridgelines, gullies with snow running down, the peaks behind paler and bluer, a skirt of
grey scree at the foot blending into grey rock.
```

### C3. Cảnh vật 5 miền (chỉ bản đồ Ngũ Vực)
- Code: [src/render/realm-decor.ts](../src/render/realm-decor.ts) (`SPRITES`, `SIZE`).

| Miền | Mục | Khoá | Kích thước | Biến thể |
|---|---|---|---|---:|
| Đồng Lúa | Đống rơm | `haystack` | 78×62 | 2 |
| Đồng Lúa | Bù nhìn | `scarecrow` | 40×66 | 1 |
| Đồng Lúa | Khóm hoa dại (nằm phẳng) | `flowers` | 64×32 | 2 |
| Đồi Vàng (cỏ vàng) | Bông lúa / cỏ vàng | `wheat` | 36×40 | 2 |
| Rừng Già | Dương xỉ | `fern` | 50×36 | 2 |
| Rừng Già | Cụm nấm | `mushrooms` | 36×30 | 2 (nâu / đỏ chấm trắng) |
| Rừng Già | Thân cây đổ | `log` | 84×35 | 2 |
| Núi Đá | Cây khô | `deadTree` | 68×94 | 2 |
| Núi Đá | Ụ đá xếp | `cairn` | 36×46 | 2 |
| Đồi Vàng | Đá mạch vàng | `goldOre` | 86×62 | 2 |
| Đồi Vàng | Xe goòng và cuốc | `mineCart` | 84×58 | 1 |
| Vực Vàng | Cụm tinh thể vàng | `crystal` | 64×80 | 2 |
| Vực Vàng | Cột đá cổ đổ nát | `pillar` | 52×96 | 2 (gãy thấp / còn cao) |
| Vực Vàng | Vòng ấn chú (nằm phẳng) | `rune` | 118×66 | 2 (vàng / tím) |
| Đèo | Cột mốc có đuốc | `marker` | 32×68 | 1 |

```
[haystack] A dome-shaped haystack of golden straw tied with a rope band.
[scarecrow] A field scarecrow on a wooden pole, straw hat, patched red shirt, straw poking from the sleeves.
[flowers] A small patch of wildflowers seen from directly above, flat. [variants: pink and white / violet and red].
[wheat] A small tuft of golden grain stalks with heavy heads.
[fern] A spreading forest fern with arching fronds.
[mushrooms] A cluster of three forest mushrooms. [variants: brown caps / red caps with white spots].
[log] A fallen mossy tree trunk lying on the ground, cut end showing rings.
[deadTree] A bare dead tree with grey twisted branches.
[cairn] A stacked stone cairn of 4–5 rounded stones.
[goldOre] A grey boulder with bright gold veins and nuggets.
[mineCart] An abandoned wooden mine cart full of gold ore on a short stub of rails, a pickaxe beside it.
[crystal] A cluster of glowing golden crystals jutting from the ground, soft golden glow.
[pillar] A broken ancient stone column with ivy. [variants: snapped low with a fallen chunk / tall and cracked].
[rune] A faint glowing rune circle etched into the ground, seen from above, flat.
  [variants: golden glow / violet glow].
[marker] A stone waymarker pillar topped with a burning iron brazier.
```

### C4. Mây viền bản đồ
- Code: `drawMapClouds()` ([src/render/settlements.ts](../src/render/settlements.ts)). Chỉ hiện khi thu nhỏ hết cỡ; khung 256×128, vẽ phóng 2–6 lần.
- Biến thể: 3 cụm mây khác nhau.
```
A soft fluffy white cumulus cloud bank, painterly, seen from above at a slight angle, soft edges fading to
transparent.
```

### C5. Texture nền (dùng khối phong cách texture)
- Code: nền vẽ trong `paintTerrain()` ([src/map/terrain.ts](../src/map/terrain.ts)), màu theo `REALM_GROUND`; đá / nước / ruộng vẽ trong `paint()` ([src/render/obstacles.ts](../src/render/obstacles.ts)).
- Một ô đất trong game là 37,5 đơn vị. Texture 1024 nên phủ khoảng 8×8 ô (300×300 đơn vị).

| Mục | Dùng ở | Ghi chú |
|---|---|---|
| Cỏ đồng bằng | Đại Lục, Đồng Lúa | xanh tươi, vài đốm cỏ sáng |
| Cỏ rừng | Rừng Già | xanh đậm, lá rụng, rêu |
| Cỏ núi | Núi Đá | xanh xám, sỏi |
| Cỏ vàng | Đồi Vàng | xanh vàng, cỏ khô |
| Đất vàng | Vực Vàng | vàng đất, vệt vàng óng |
| Mặt đá cao nguyên | mọi vùng đá | xám nâu, vân phân lớp, vết nứt; kèm **dải vách đá** (lặp ngang, cao khoảng 16) cho mép phía nam |
| Mặt nước | sông, hồ, hào | xanh lam, gợn sóng nhẹ; kèm **dải bãi cát + bọt** (lặp ngang) cho bờ |
| Ruộng lúa | mọi ruộng | ô ruộng xanh to nhỏ không đều, ít ô vàng và ô ngập nước, bờ đất |

```
[grass] Lush green meadow grass with small lighter tufts and tiny wildflowers.
[forest floor] Dark green forest floor grass with fallen leaves and patches of moss.
[mountain grass] Grey-green alpine grass with scattered small pebbles.
[golden grass] Yellow-green dry grass of golden hills.
[golden earth] Warm ochre earth with faint glittering gold streaks.
[rock plateau] Flat grey-brown rock surface with layered strata bands and hairline cracks.
[rock cliff strip] A horizontally repeating strip of a short grey rock cliff face, shadowed, seen from slightly
  above.
[water] Calm blue water surface with soft ripples and small light glints.
[shore strip] A horizontally repeating strip of shoreline: sandy beach blending into a thin white foam line.
[rice paddies] Rice paddy fields seen from directly above: irregular rectangular plots of young green rice
  separated by thin earthen banks, a few ripe golden plots and a few flooded plots reflecting the sky.
```

---

## Đối chiếu với code
Những thứ **đã có ảnh**, không cần prompt: 5 loại quân (spritesheet), chân dung lính bộ và cung thủ, pháo đài (`fortress-sprite.png`), nông trại (`farmstead-v2.png`), bệ cột cờ (`territory-flag-tower-platform.png`), nỏ trên cột cờ (`territory-flag-ballista.png`).

Khi đưa một ảnh mới vào game:
1. Nạp ảnh trong [src/render/sprites.ts](../src/render/sprites.ts).
2. Đổi hàm đang vẽ bằng code (ghi trong từng mục) sang `drawImage`, giữ đúng kích thước thế giới.
3. Cập nhật bảng sprite trong [features/rendering.md](features/rendering.md), rồi xoá mục đó khỏi file này.
