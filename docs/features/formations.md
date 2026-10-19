# Đội hình quân đội

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-19 · Theo đặc tả "MINI WAR V3.1 — Hệ thống đội hình quân đội"

## Mô tả
Chọn một nhóm quân (kéo chuột, Ctrl + A, nhóm F1–F9…), bấm **Đội hình** trên thanh quân (hoặc phím **G**) → bảng có 3 đội hình kèm sơ đồ nhỏ, 2 cách di chuyển và nút hủy:

| Đội hình | Bố trí |
|---|---|
| **Phòng thủ** | Lính giáo hàng đầu, rồi lính bộ (tuyến trước); cung thủ phía sau; kỵ binh hai cánh, ngang tuyến trước. Giữ cầu, giữ cờ |
| **Mũi nhọn** | Lính bộ xếp hình mũi tên (hàng k có 2k+1 chỗ); lính giáo dọc hai cạnh ngoài của mũi; cung thủ theo sau; kỵ binh hai bên. Không có lính bộ thì lính giáo làm mũi |
| **Bao vây hai cánh** | Lính bộ rồi lính giáo giữ trung tâm; cung thủ sau trung tâm; kỵ binh chia hai cánh cách trung tâm 4 ô, lệch lên trước để đánh vòng |

- **Trinh sát không tham gia**: lệnh đội hình bỏ qua trinh sát (giữ nguyên vị trí và lệnh); bảng ghi "N trinh sát không tham gia". Lệnh đi chung cho cả nhóm vẫn đưa trinh sát đi như cũ, nhưng chúng không thuộc đội hình và không tính vào tốc độ hành quân.
- Thiếu loại quân nào thì bỏ qua loại đó; không giới hạn số quân; không tạo thêm quân.
- **Giữ đội hình** (mặc định): đội hình hành quân bằng tốc độ của quân chậm nhất trong đội hình; quân nhanh hơn chỉ đi tới chỗ của mình rồi đi theo — tốc độ gốc không đổi. Đội hình xoay theo hướng đi.
- **Di chuyển tự do**: mỗi quân đi bằng tốc độ gốc thẳng tới chỗ của mình trong đội hình tại điểm đến; tới nơi thì lại theo đội hình.
- **Hủy đội hình**: quân đứng tại chỗ, trở về lệnh thường.
- Chọn đội hình khác cho cùng nhóm: giữ vị trí, hướng và cách di chuyển, chỉ xếp lại chỗ.

## Luật & thông số
| Thông số | Giá trị | Nguồn trong code |
|---|---:|---|
| Khoảng cách giữa các chỗ | 30 px | `FORMATION_SPACING` |
| Bề rộng tuyến trước | round(1,4 × √số quân), trong 3–14 chỗ | `FORMATION_WIDTH_FACTOR`, `FORMATION_MIN_WIDTH`, `FORMATION_MAX_WIDTH` |
| Tốc độ hành quân (Giữ đội hình) | min tốc độ gốc các quân trong đội hình × hệ số thiếu lúa (như mọi quân) | `updateFormations()` |
| Chờ quân chậm | < 50% quân trong 80 px quanh chỗ của mình → điểm neo đứng chờ, tối đa 4 giây mỗi lần; ≥ 80% thì đặt lại thời gian chờ | `FORMATION_CATCHUP`, `FORMATION_WAIT_MAX` |
| Xoay theo hướng đi | tối đa 1,6 rad/giây | `FORMATION_TURN_RATE` |
| Lối hẹp (cầu, khe) | ≥ 20% chỗ rơi vào nước/đá/công trình (theo bản đồ đã khám phá) → đi hàng dọc 2 quân theo vệt đường của điểm neo, quân tuyến trước đi đầu; ≤ 5% liên tục 1,2 giây → dàn lại | `FORMATION_COLUMN_ENTER`, `FORMATION_COLUMN_EXIT`, `FORMATION_COLUMN_SECONDS` |
| Chỗ đứng bị chặn | dời tới ô đi được gần nhất (tối đa 4 ô); không ép đứng đúng chỗ | `formationTarget()` |
| Giao tranh | quân được rời chỗ đánh địch cách chỗ của mình ≤ 180 px (sau lệnh Tấn công: mọi địch đang thấy); địch trong tầm thì đứng đánh; hết địch thì tự về chỗ | `FORMATION_LEASH`, `formationMayChase()` |

**Lệnh với đội hình** (`applyAction()`):
- **Đi** (chuột phải), **Dừng** (S), **Tấn công** (A): áp dụng cho cả đội hình khi **mọi** quân còn sống của đội hình đều đang được chọn.
- Chỉ chọn **một phần** đội hình rồi ra lệnh: các quân đó **tách khỏi đội hình** (về tốc độ gốc, lệnh thường); phần còn lại giữ lệnh cũ.
- Dừng: điểm neo dời về giữa các quân, đứng lại. Tấn công: quân đuổi mọi địch đang thấy rồi tự tập hợp lại. Delete: quân bị xoá rời đội hình.
- Quân chết tự rời đội hình; chỗ của các quân còn lại được xếp lại ở lệnh tiếp theo.

## Code liên quan
- [src/sim/formation.ts](../../src/sim/formation.ts): `formationLayout()`, `slotWorld()`, `createFormation()`, `setFormationMode()`, `cancelFormations()`, `detachUnits()`, `orderFormationMove()`, `stopFormations()`, `attackFormations()`, `formationTarget()`, `formationMayChase()`, `updateFormations()`, `formationOf()`.
- [src/config/formation.ts](../../src/config/formation.ts): `FORMATION_KINDS`, `FORMATION_MODES` và các hằng số trên.
- [src/core/actions.ts](../../src/core/actions.ts): action `formation` `{ids, kind}`, `formationMode` `{ids, mode}`, `formationCancel` `{ids}`; `move`, `stop`, `attack`, `delete` đi qua lớp đội hình trước.
- [src/core/match.ts](../../src/core/match.ts): `update()` gọi `updateFormations()`; trong vòng quân, quân có `u.formation` và lệnh `'formation'` đi tới `formationTarget()` khi không giao tranh; đuổi địch theo `formationMayChase()`; tới nơi sau lệnh đi tự do thì về lệnh `'formation'`.
- [src/ui/formation.ts](../../src/ui/formation.ts): `toggleFormationMenu()`, `updateFormationMenu()`, `formationMenuOpen()`; sơ đồ vẽ từ `formationLayout()` với quân mẫu. Nút `.formation-btn` trên thanh quân (`updateSelectionBar()`), phím G và Esc (`ui/hotkeys.ts`).
- [src/render/paths.ts](../../src/render/paths.ts): `drawUnitPaths()` vẽ một đường đi từ điểm neo khi đội hình đang hành quân và một vòng mờ ở chỗ của mỗi quân.
- [src/ui/info.ts](../../src/ui/info.ts): dòng "Đội hình" (loại · cách di chuyển · đang hành quân / hàng dọc).
- Dữ liệu: `state.formations[] = {id, team, kind, mode, ids, slots: {unitId: {f, r}}, x, y, angle, path, moving, wait, column, colTimer, colOrder, trail, aggressive}`; trên quân: `u.formation`, lệnh `u.order = 'formation'`.
- Giao diện: `#formationMenu`, `#formationKinds`, `#formationModes`, `#formationCancel`, `#formationCount` trong [index.html](../../index.html); class `.formation-*`, `.fd-*` trong [src/style.css](../../src/style.css).

## Tương tác
- [controls.md](controls.md): chọn quân, lệnh đi / dừng / tấn công, thanh lọc quân (vẫn dùng bình thường để chọn riêng từng loại).
- [pathfinding.md](pathfinding.md): điểm neo và từng quân đi bằng `findPath()` / `steerTo()`; tách quân nhẹ vẫn chạy.
- [combat.md](combat.md): quy tắc đánh không đổi, chỉ thêm giới hạn đuổi theo của quân trong đội hình.
- [selection-info.md](selection-info.md), [hud-ui.md](hud-ui.md): dòng "Đội hình", nút và bảng.
- [ai-opponent.md](ai-opponent.md): AI không dùng đội hình.

## Multiplayer
- Khách gửi `formation`, `formationMode`, `formationCancel` qua `requestAction()`; chủ phòng xếp và cho đi; `state.formations` và `u.formation` tới khách qua snapshot. Smoke `pvp` kiểm tra khách xếp đội hình.

## Kiểm thử thủ công
- [ ] Chọn 40 quân chiến đấu + 10 trinh sát → bảng ghi "40 quân chiến đấu · 10 trinh sát không tham gia"; trinh sát đứng yên.
- [ ] Mỗi đội hình: đúng vị trí từng loại; thiếu loại vẫn xếp được.
- [ ] Giữ đội hình: kỵ binh không chạy trước; đội xoay theo hướng đi. Di chuyển tự do: kỵ binh tới trước.
- [ ] Qua cầu: thành hàng dọc rồi dàn lại bên kia, không kẹt.
- [ ] Gặp địch: quân rời chỗ đánh rồi tự về chỗ. Ra lệnh riêng cho vài quân: chúng tách ra, phần còn lại giữ đội hình.
- [ ] PvP: khách xếp đội hình, đi, hủy.
- Unit test: `tests/formation.test.ts`.

## Giới hạn / việc tồn đọng
- Khi đội hình xoay, quân ở cánh phải đi quãng dài hơn để giữ chỗ.
- Quân chậm nhất đi đúng tốc độ điểm neo nên thường chậm hơn chỗ của mình 20–45 px khi bị tách quân đẩy.
- Bắt đầu đội hình ngay cạnh pháo đài thì nhiều chỗ rơi vào pháo đài → đi hàng dọc tới khi ra chỗ thoáng.
- Không có phím tắt riêng cho từng đội hình (chỉ G mở bảng); chưa xem trước đội hình trên bản đồ trước khi ra lệnh.
