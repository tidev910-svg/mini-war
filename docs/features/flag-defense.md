# Phòng thủ cột cờ (đồn trú, toàn quân phản công, tự rút về)

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-20 · Theo đặc tả "MINI WAR V3.1 — Cơ chế phòng thủ cột cờ"

## Mô tả
- **Đồn trú:** chọn quân rồi **nhấp chuột phải vào cờ của mình**. Quân đi tới cờ và vào trong. Sức chứa không giới hạn, mọi loại quân đều vào được.
  - Quân trong cờ **biến khỏi bản đồ**: đối phương không thấy, không nhắm được, không biết số lượng, loại hay máu.
  - Quân trong cờ không bắn ra ngoài, không làm cờ mạnh thêm, vẫn ăn lúa như bình thường.
  - Chủ cờ thấy "ĐỒN TRÚ N QUÂN" trên cờ. Chọn cờ thì bảng thông tin cho biết số quân theo từng loại và có nút **Cho toàn bộ quân ra**.
- **Cờ tự vệ:** cờ đang có chủ tự bắn **một** quân địch gần nhất trong tầm **180**, mỗi **2 giây** một phát, **10** sát thương. Cờ trung lập không bắn. Cờ không có máu và không bị phá.
- **Toàn quân phản công:** khi có quân địch vào trong 180 quanh cờ, **100% quân đồn trú** tự ra cùng lúc, đứng rải quanh cờ theo các vòng (cách nhau ≥ 22 px, trên ô đi được), rồi đánh bằng chỉ số và luật gốc. Chúng chỉ đuổi địch trong 320 quanh cờ. Chủ cờ nhận thông báo đỏ.
- **Tự rút về:** khi không còn địch trong 180 quanh cờ, đếm **3 giây**. Địch quay lại trong lúc đếm thì đếm lại từ đầu. Đủ 3 giây yên thì mọi quân xuất kích còn sống và còn thuộc lệnh phòng thủ đi về cờ và vào lại (trong 45 px quanh cờ).
- **Lệnh riêng được ưu tiên:** ra lệnh đi / dừng / tấn công / xếp đội hình / đồn trú / xoá cho một quân đang xuất kích thì quân đó thôi thuộc lệnh phòng thủ, không bị kéo về.
- **Chiếm cờ:** chừng nào còn quân trong cờ thì phe khác không tăng được tiến độ chiếm. Quân đồn trú phải chết hết hoặc rời cờ trước; sau đó chiếm cờ theo đúng luật cũ ([territory.md](territory.md)). Cờ về trung lập thì mọi quân còn dính với cờ đó (trong cờ hoặc đang xuất kích) trở thành quân thường.

## Luật & thông số
| Thông số | Giá trị | Nguồn trong code |
|---|---:|---|
| Súng cờ: sát thương / chu kỳ / tầm | 10 / 2 giây / 180, một mục tiêu mỗi phát (quân địch gần nhất), đạn bay 320/giây | `FLAG_GUN`, `updateFlagDefense()` |
| Vùng báo động (kích hoạt xuất kích, giữ đếm ngược) | 180 quanh cột cờ, mọi quân địch còn sống (kể cả trinh sát) | `FLAG_DEFENSE.radius` |
| Đếm ngược rút về | 3 giây liên tục không có địch trong vùng | `FLAG_DEFENSE.calmSeconds` |
| Phạm vi đuổi địch khi xuất kích | 320 quanh cột cờ | `FLAG_DEFENSE.leash`, `sortieMayChase()` |
| Khoảng cách vào cờ | 45 | `FLAG_DEFENSE.enterRadius` |
| Sức chứa | Không giới hạn | — |

## Code liên quan
- [src/sim/garrison.ts](../../src/sim/garrison.ts): `orderGarrison()`, `enterGarrison()`, `releaseGarrison()`, `orderGarrisonExit()`, `releaseFromFlag()`, `sortieMayChase()`, `sortieGoal()`, `updateFlagDefense()`, `garrisonOf()`, `sortieOf()`; cục bộ `ringSpots()` (chỗ đứng quanh cờ).
- [src/config/balance.ts](../../src/config/balance.ts): `FLAG_GUN`, `FLAG_DEFENSE`.
- [src/core/actions.ts](../../src/core/actions.ts): action `garrison` `{ids, regionId}`, `garrisonExit` `{regionId}`; các lệnh `move`, `stop`, `attack`, `formation`, `delete`, `garrison` gọi `releaseFromFlag()` trước.
- [src/core/match.ts](../../src/core/match.ts): `update()` gọi `updateFlagDefense()`; trong vòng quân: quân `'sortie'` đuổi địch theo `sortieMayChase()`, rảnh thì đi theo `sortieGoal()` và vào cờ; quân có `u.garrisonTarget` vào cờ khi tới nơi. Đạn bắn vào quân vừa vào cờ thì bị huỷ.
- [src/sim/territory.ts](../../src/sim/territory.ts): `updateCaptures()` không cho phe khác tăng tiến độ khi cờ còn quân đồn trú.
- [src/sim/economy.ts](../../src/sim/economy.ts): `upkeepPerMinute()` tính cả `state.garrisons`. Quân số trên HUD, `sampleStats()`, âm thanh "quân mới" cũng tính cả quân trong cờ.
- [src/ui/input.ts](../../src/ui/input.ts): chuột phải lên cờ của mình → `garrison`. [src/ui/info.ts](../../src/ui/info.ts): dòng Tự vệ, Đồn trú, Đang xuất kích; nút `[data-garrison-exit]`. [src/render/flags.ts](../../src/render/flags.ts): nhãn "ĐỒN TRÚ N QUÂN" (chỉ chủ cờ).
- Dữ liệu: `state.garrisons[]` (quân trong cờ, có `u.garrison = regionId`, lệnh `'garrison'`, không nằm trong `state.units`); trên quân ngoài sân: `u.garrisonTarget` (đang đi vào), `u.sortie` (đang xuất kích, lệnh `'sortie'`); trên vùng: `r.defense = {alarm, calm, returning, cool}`.

## Tương tác
- [audio.md](audio.md): tiếng `event.garrison` (vào cờ), `event.sortie` (xuất kích), `combat.flag` (cờ bắn).
- [territory.md](territory.md): chặn chiếm cờ khi có đồn trú; cờ về trung lập thì thả quân.
- [combat.md](combat.md): súng cờ là nguồn sát thương mới (`attackerType: 'flag'`, hệ số ×1); quân xuất kích đánh bằng luật cũ.
- [fog-of-war.md](fog-of-war.md): quân trong cờ không phải nguồn nhìn (cờ đã cho 450); đối phương không thấy chúng.
- [formations.md](formations.md): quân vào cờ rời đội hình; xếp đội hình cho quân đang xuất kích là lệnh riêng.
- [economy.md](economy.md): quân trong cờ vẫn ăn lúa. [controls.md](controls.md): chuột phải lên cờ của mình.
- [ai-opponent.md](ai-opponent.md): AI không đồn trú; cờ của AI vẫn tự bắn; đợt tấn công của AI vào cờ của bạn sẽ gặp quân xuất kích.

## Multiplayer
- Khách gửi `garrison` / `garrisonExit` qua `requestAction()`; chủ phòng xử lý; `state.garrisons` và `r.defense` tới khách qua snapshot. Smoke `pvp` kiểm tra khách đưa quân vào cờ.
- Quân đồn trú bị ẩn **khi vẽ và khi chơi** (không có trong `state.units`). Như mọi thông tin bị sương che, dữ liệu vẫn nằm trong snapshot gửi cho cả hai máy.

## Kiểm thử thủ công
- [ ] Chuột phải lên cờ của mình với một nhóm quân → quân đi tới, biến mất; cờ ghi "ĐỒN TRÚ N QUÂN"; lúa nuôi không đổi.
- [ ] Cờ địch / trung lập: chuột phải chỉ là lệnh đi.
- [ ] Địch tới gần cờ → cả đồn trú ra cùng lúc, không chồng nhau; đánh xong 3 giây thì về và biến mất lại.
- [ ] Trong lúc đếm 3 giây, địch quay lại → quân ở lại đánh tiếp.
- [ ] Ra lệnh đi cho một quân đang xuất kích → quân đó không quay về.
- [ ] Địch đứng ở cờ khi đồn trú còn trong → không chiếm được; "Cho toàn bộ quân ra" thả quân ra.
- [ ] PvP: khách đồn trú; chủ phòng không thấy số quân trong cờ đỏ.
- Unit test: `tests/garrison.test.ts`. Đã chạy thử 2026-10-20: ảnh chụp cờ có 10 quân đồn trú và cảnh 10 quân xuất kích khi 4 lính đỏ tới gần; toàn bộ smoke đạt.

## Giới hạn / việc tồn đọng
- Không chọn được từng quân trong cờ; chỉ có "Cho toàn bộ quân ra".
- Đặc tả nhắc "sát thương hướng vào cờ được chuyển cho quân đồn trú theo cơ chế đã chốt trước đó", nhưng game chưa có cơ chế sát thương lên cờ (cờ không có máu). Trong thực tế, quân đồn trú luôn xuất kích ngay khi địch tới gần nên không bị đánh khi đang ở trong.
- Vùng báo động tính mọi quân địch, kể cả trinh sát đi ngang.
