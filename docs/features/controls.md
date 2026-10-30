# Điều khiển, chọn quân & camera

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-30

## Mô tả
Điều khiển bằng chuột (cảm ứng: kéo bản đồ, chạm để chọn và ra lệnh) và phím. Người chơi chọn một hoặc nhiều quân, ra lệnh di chuyển theo đội hình hoặc tấn công; kéo/zoom bản đồ.

## Luật & thông số
**Chuột**
| Thao tác | Kết quả |
|---|---|
| Trái vào quân mình | Chọn riêng quân đó (quân gần con trỏ nhất nếu nhiều quân chồng nhau) |
| Shift + trái vào quân | Thêm/bỏ quân khỏi nhóm chọn |
| Kéo trái (bắt đầu ở đâu cũng được, kể cả trên một quân; trừ pháo đài/công trình) | Khung chọn nhiều quân: chỉ thành khung khi kéo quá `BOX_THRESHOLD` = 8 px (\|dx\|+\|dy\|, toạ độ canvas), ngắn hơn là nhấp. Quân có thân chạm khung là được chọn (`unitsInBox()`). Shift + kéo: thêm vào nhóm. Cú `click` trình duyệt bắn ra sau khi thả khung bị bỏ qua (`boxJustEnded`) |
| Trái vào vùng trống (không phải cờ, hang, công trình) | Bỏ chọn quân |
| Chạm (cảm ứng) vào bản đồ, không trúng quân mình, khi đang chọn quân | Lệnh như nhấp phải (`orderSelectedAt()`) |
| Trái vào pháo đài mình | Chọn pháo đài (bỏ chọn quân), hiện vòng tầm pháo |
| Trái giữ trên nông trại mình | Kéo nông trại ([farms.md](farms.md)) |
| Trái vào công trình mình (không phải nông trại thì chỉ chọn) | Chọn công trình: vòng nét đứt, log thông tin; nút nâng cấp dùng công trình đang chọn |
| Trái vào cột cờ (đã khám phá; không trúng quân mình) | Chọn cờ (`selectedFlag`, vùng nhấp `flagHit()`): hiện vòng phạm vi chiếm, log chủ cờ và thời gian chiếm; nút "Xây tiền đồn" dùng cờ này |
| Bấm nút xây rồi trái trên bản đồ | Đặt công trình ([buildings.md](buildings.md)); phải hoặc Escape để huỷ |
| Phải nhấp (không kéo) | `orderSelectedAt()`: ra lệnh `move` cho cả nhóm đang chọn; lên cờ của mình: đồn trú; lên hang quái còn quái: dọn hang (action `camp`, [neutral-camps.md](neutral-camps.md)). Nhóm vẫn được chọn sau lệnh |
| Giữ phải / giữa rồi kéo; kéo bằng cảm ứng | Di chuyển camera. Chỉ tính là kéo khi rê quá `PAN_THRESHOLD` = 6 px; trước đó camera đứng yên, nên nhấp phải hơi rung tay vẫn là lệnh. Camera đi từ điểm vượt ngưỡng, không giật |
| Lăn chuột | Zoom ×1.15 quanh con trỏ |
| Nhấp / kéo trên minimap | Đưa tâm camera tới điểm đó ([minimap.md](minimap.md)) |
| Bấm xuống bản đồ khi đang mở bảng Huấn luyện / Xây dựng | Đóng bảng ([hud-ui.md](hud-ui.md)) |

**Phím tắt kiểu Đế Chế (Age of Empires II)** — mọi phím xử lý trong `src/ui/hotkeys.ts`, bảng `HOTKEYS` (cũng hiện trong hộp thoại hướng dẫn, `#hotkeyTable`). Không cần focus canvas; bỏ qua khi đang gõ trong ô nhập hoặc khi màn chọn chế độ đang mở.
| Phím | Kết quả |
|---|---|
| 1 2 3 4 5 (hàng số hoặc bàn phím số) | **Lọc theo loại** trong nhóm đang chọn: 1 trinh sát, 2 lính, 3 lính giáo, 4 cung thủ, 5 kỵ binh (`SELECT_KEYS`, `filterSelectionByType()`). Không tìm quân ngoài nhóm; nhóm không có loại đó thì giữ nguyên và báo "Nhóm đang chọn không có …" |
| Ctrl + 1…9 | Lưu nhóm quân đang chọn vào số đó (Ctrl + số khi không chọn gì: xoá nhóm) |
| F1…F9 | Gọi nhóm đã lưu; bấm cùng phím hai lần trong `GROUP_DOUBLE_TAP_MS` = 400 ms: camera tới giữa nhóm. Chặn hành vi mặc định của trình duyệt (F1 trợ giúp, F3 tìm, F5 tải lại…) |
| Shift + F1…F9 | Thêm nhóm vào lựa chọn hiện tại |
| H | Chọn pháo đài, đưa camera về, mở bảng Huấn luyện |
| Q W E R T | Khi pháo đài đang chọn hoặc bảng Huấn luyện mở: trinh sát, lính, cung thủ, lính giáo, kỵ binh (`TRAIN_KEYS`, qua `requestBuy()`) |
| B | Mở/đóng bảng Xây dựng |
| F T O U P | Khi bảng Xây dựng mở: nông trại, tháp, tiền đồn, nâng cấp nông trại, pháo thứ hai (`BUILD_KEYS`, bấm nút tương ứng) |
| , (dấu phẩy) | Chọn lần lượt quân đang rảnh (không lệnh đi/tấn công, đứng yên) và đưa camera tới |
| Ctrl + A | Chọn tất cả quân của mình. Nhận theo mã phím vật lý (`e.code` = `KeyA`) nên chạy với mọi bố cục bàn phím / bộ gõ |
| Nhấp đúp vào quân | Chọn mọi quân cùng loại đang trên màn hình |
| A | Nhóm đang chọn tấn công (action `attack`): đuổi địch đang thấy; chưa thấy địch thì tiến tới mục tiêu địch đã phát hiện gần nhất, chưa phát hiện gì thì đứng chờ và báo cần trinh sát ([combat.md](combat.md)). Cả đội hình được chọn: giữ đội hình, đuổi mọi địch đang thấy rồi tập hợp lại |
| S | Nhóm đang chọn dừng lại (action `stop`: lệnh `hold`, xoá đích và đường đi; cả đội hình được chọn: đội hình đứng lại; chỉ một phần: phần đó tách khỏi đội hình) |
| G | Mở/đóng bảng Đội hình cho quân đang chọn (`toggleFormationMenu()`, [formations.md](formations.md)); Esc đóng bảng |
| Delete | Loại bỏ quân đang chọn, không hoàn tiền (action `delete`) |
| Space | Camera tới giữa nhóm đang chọn; không chọn gì thì tới pháo đài |
| Mũi tên / `+` `=` / `-` `_` | Kéo camera 180/zoom (Shift: 360/zoom) / phóng to ×1,15 / thu nhỏ ÷1,15 |
| T | Ẩn/hiện ranh giới vùng (khi T không đang là phím huấn luyện/xây) |
| F10 hoặc Pause | Tạm dừng / tiếp tục (trước 2026-10-19 là F3, trước 2026-10-18 là Space) |
| ? | Mở/đóng hướng dẫn (trước 2026-10-19 là F1) |
| Enter (ở sảnh) | Vào trận với AI. Esc ở sảnh đóng hộp hướng dẫn |
| M | Bật / tắt âm thanh ([audio.md](audio.md)) |
| Esc | Theo thứ tự: đóng menu ☰ → huỷ đặt công trình → đóng bảng đang mở (kể cả hộp xác nhận rời trận) → bỏ chọn tất cả. Khi hộp xác nhận đang mở, các phím khác bị bỏ qua |

Nhóm quân là dữ liệu cục bộ của trình duyệt (danh sách id, tự bỏ quân đã chết). Thẻ quân và thẻ công trình có nhãn phím nhỏ ở góc (`.hotkey`).

**Đội hình** (action `move`): quân được xếp lưới vuông `ceil(√n)` cột, khoảng cách 34, tâm lưới là điểm nhấp và được đẩy vào trong nếu sát mép. Ô rơi vào nước/đá dời tới ô đi được gần nhất; mỗi quân đi theo đường vòng qua vật cản (`assignGroupMove()`, [pathfinding.md](pathfinding.md)). Điểm nhấp có vòng sáng nhấp nháy (`showMoveMarker()`); quân mình đang chọn và đang đi hiện đường nét đứt có mũi tên tới đích (một đường cho mỗi nhóm). Toạ độ kẹp trong `[25, W−25] × [45, H−30]`. Khi đang khoá xuất quân, quân có ô đích ngoài vùng căn cứ bị chuyển `hold`.

Bước cuộn của phím mũi tên nhân với cài đặt **Tốc độ cuộn bản đồ** (`settings.scrollSpeed` = 0,6 / 1 / 1,6; [settings.md](settings.md)).

**Camera**: `zoom` trong `[MIN_ZOOM, MAX_ZOOM]`; mặc định `DEFAULT_ZOOM` = khung nhìn rộng 64 ô, tối đa zoom vào 32 ô. Đầu trận camera đặt pháo đài của mình vào giữa phần màn hình không bị HUD che (`centerCameraOnHome()`, `hudInsets()`; guest PvP là pháo đài đỏ).

**Unit Control V1.0** (19/10/2026; chỉ đổi cách chọn quân và phím tắt):
- **Ba cách chọn theo loại:**
  - Phím 1–5 lọc nhóm đang chọn.
  - Nhấp đúp vào quân: chọn mọi quân cùng loại của mình đang trên màn hình.
  - **Thanh quân** (`#unitBar`, giữa phía dưới, trên dải thông báo; `updateSelectionBar()`): mỗi loại có trong nhóm một ô gồm biểu tượng, số đang chọn (`n/tổng` khi chỉ chọn một phần) và phím 1–5. Bấm ô: chỉ chọn loại đó; Shift + bấm: thêm hoặc bỏ loại đó (`selectTypeFromPool()`).
- **Nhóm gốc:** thanh nhớ lựa chọn "thật" gần nhất (khoanh, nhấp, nhấp đúp, Ctrl+A, gọi nhóm). Lọc chỉ thu hẹp lựa chọn trong nhóm gốc nên Shift + bấm thêm lại được loại đã lọc bỏ. Mọi thay đổi lựa chọn khác tạo nhóm gốc mới.
- Lựa chọn chỉ nằm trên máy này, không gửi action: quân bị bỏ chọn **giữ nguyên lệnh**. Lệnh mới (nhấp phải, A, S…) chỉ áp cho quân đang chọn.
- Đang gõ trong ô nhập chữ thì phím không có tác dụng (`typing()`: `textarea`, `contenteditable`, `input` kiểu chữ/số). Thanh trượt, ô tích, nút đang được focus (vd. thanh âm lượng trong Cài đặt) **không** chặn phím tắt (trước 2026-10-30 chúng chặn mọi phím, kể cả Ctrl+A).

## Code liên quan
- [src/ui/selection.ts](../../src/ui/selection.ts): `SELECT_KEYS`, `selectUnits()`, `selectedOwnUnits()`, `filterSelectionByType()`, `selectTypeFromPool()`, `updateSelectionBar()` (gọi từ `updateHUD()` và sau mỗi lần lọc / gọi nhóm). [src/ui/hotkeys.ts](../../src/ui/hotkeys.ts): `saveGroup()`, `recallGroup()`.
- [src/ui/input.ts](../../src/ui/input.ts): các `addEventListener` ở cấp module (`wheel`, hai `pointerdown`, hai `pointermove`, `stopPan()`, `endPointer()`, `click`; minimap: `centerCameraOnMinimap()`); `orderSelectedAt()`, `unitsInBox()`, `PAN_THRESHOLD`, `BOX_THRESHOLD`.
- [src/ui/hotkeys.ts](../../src/ui/hotkeys.ts): `HOTKEYS`, `TRAIN_KEYS`, `BUILD_KEYS`, `selectUnits()`, nhóm quân, nhấp đúp chọn cùng loại, một trình xử lý `keydown` cho mọi phím.
- [src/ui/panels.ts](../../src/ui/panels.ts): đóng bảng khi bấm xuống canvas.
- `applyAction()` nhánh `'move'` (đội hình), `commandAttack()`.
- `canvasPoint()`, `canvasPos()`, `worldToCanvas()`, `viewOffsets()`, `clampCamera()`, `unitHitRadius()`.
- Trạng thái UI: `selected`, `localSelectedIds`, `selectedFortress`, `selectedBuilding`, `placement`, `dragSelect` (chỉ có khi đã vượt ngưỡng kéo), `selectingBox`, `boxJustEnded`, `panning`, `justPanned`.
- Vẽ: `drawUnitSelection()`, khung chọn trong `draw()`.

## Tương tác
- [neutral-camps.md](neutral-camps.md): chuột phải lên hang (`campAt()`) ra lệnh `camp`; nhấp trái lên hang (không chọn quân) ghi `campInfo()` vào nhật ký.
- [territory.md](territory.md): nhấp chọn cờ, phạm vi chiếm.
- [combat.md](combat.md): lệnh `attack`.
- [buildings.md](buildings.md): chế độ đặt công trình chặn các thao tác khác.

## Multiplayer
- `move {ids, x, y}` và `attack {ids}` gửi cho host; host chỉ áp dụng cho quân có `team` đúng phe guest.
- Việc chọn quân là cục bộ: `localSelectedIds` được dùng để khôi phục `u.selected` sau mỗi `applySnapshot()` (snapshot luôn gửi `selected:false`).
- Khách thấy quân trượt mượt giữa hai snapshot (`smoothGuestUnits()`, [multiplayer.md](multiplayer.md)); chọn quân và khung chọn dùng vị trí đang vẽ.

## Kiểm thử thủ công
- [ ] Kéo khung chọn 5 quân → log "5 lính được chọn"; nhấp phải → quân dàn đội hình, không chồng lên nhau.
- [ ] Shift + nhấp thêm/bỏ quân.
- [ ] Chuột phải lên cờ của mình với quân đang chọn → đồn trú ([flag-defense.md](flag-defense.md)); lên hang quái → đi dọn hang; lên chỗ khác → lệnh đi.
- [ ] Nhấp trái lên hang quái khi chưa chọn quân → nhật ký ghi quái, phần thưởng, cách dọn.
- [ ] Zoom bằng con lăn giữ đúng điểm dưới con trỏ; kéo camera bằng chuột phải.
- [ ] Khoanh nhiều loại quân, bấm 5 chỉ còn kỵ binh (quân bị bỏ chọn giữ lệnh), bấm 1 khi không có trinh sát thì giữ nguyên và có thông báo; thanh quân: bấm biểu tượng chỉ chọn loại đó, Shift + bấm thêm/bỏ. Ctrl+1 lưu nhóm, Esc bỏ chọn, F1 gọi lại, bấm F1 hai lần camera tới nhóm; F5 không tải lại trang; H rồi Q/T huấn luyện; B rồi F đặt nông trại; S dừng; Delete loại bỏ; dấu phẩy chọn quân rảnh; F3 tạm dừng; F1 hướng dẫn.
- Đã chạy thử 2026-10-18: `pnpm smoke hotkeys` đạt toàn bộ các phím trên.
- Đã chạy thử 2026-10-30: `pnpm smoke hotkeys` dùng chuột thật (CDP): kéo khung kết thúc trên một quân vẫn chọn đủ; Shift + nhấp bỏ quân; nhấp vùng trống bỏ chọn; kéo khung bắt đầu trên quân; nhấp phải rung 3 px vẫn là lệnh, camera không nhích; Ctrl+A khi thanh trượt đang focus và với bố cục bàn phím khác. Cả 7 bài trượt trên code trước bản sửa.

## Giới hạn / việc tồn đọng
- Chưa có hàng đợi lệnh (Shift + nhấp phải nối điểm đến).
- Cảm ứng: chưa có khung chọn (kéo một ngón là kéo bản đồ); chọn nhiều quân bằng chạm từng quân với Shift không làm được, dùng thanh quân / nhóm.

**Sửa lỗi 2026-10-30 (chọn quân thỉnh thoảng không được):**
- Thả khung chọn ngay trên một quân / cờ / pháo đài: cú `click` theo sau chọn lại thứ dưới con trỏ, xoá cả nhóm vừa khoanh.
- Shift + nhấp: `pointerdown` thêm quân rồi `click` lại chọn riêng quân đó.
- Bắt đầu kéo trên một quân thì không khoanh được.
- Ctrl+A (và mọi phím tắt) không ăn khi thanh âm lượng hoặc ô `select` đang được focus; Ctrl+A không ăn với bố cục bàn phím khác.
- Nhấp phải rê quá 4 px thành kéo bản đồ và mất lệnh; camera nhích ngay từ pixel đầu.
