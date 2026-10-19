# Điều khiển, chọn quân & camera

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-19

## Mô tả
Điều khiển bằng chuột (có hỗ trợ cảm ứng để kéo bản đồ) và phím. Người chơi chọn một hoặc nhiều quân, ra lệnh di chuyển theo đội hình hoặc tấn công; kéo/zoom bản đồ.

## Luật & thông số
**Chuột**
| Thao tác | Kết quả |
|---|---|
| Trái vào quân mình | Chọn riêng quân đó |
| Shift + trái vào quân | Thêm/bỏ quân khỏi nhóm chọn |
| Kéo trái trên vùng trống | Khung chọn nhiều quân (phải kéo > 8 px) |
| Trái vào vùng trống khi đang chọn **một** quân bằng nhấp | Ra lệnh `move` cho quân đó |
| Trái vào pháo đài mình | Chọn pháo đài (bỏ chọn quân), hiện vòng tầm pháo |
| Trái giữ trên nông trại mình | Kéo nông trại ([farms.md](farms.md)) |
| Trái vào công trình mình (không phải nông trại thì chỉ chọn) | Chọn công trình: vòng nét đứt, log thông tin; nút nâng cấp dùng công trình đang chọn |
| Trái vào cột cờ (đã khám phá; khi **không** đang chọn một quân bằng nhấp) | Chọn cờ (`selectedFlag`, vùng nhấp `flagHit()`): hiện vòng phạm vi chiếm, log chủ cờ và thời gian chiếm; nút "Xây tiền đồn" dùng cờ này |
| Bấm nút xây rồi trái trên bản đồ | Đặt công trình ([buildings.md](buildings.md)); phải hoặc Escape để huỷ |
| Phải nhấp (không kéo) | Ra lệnh `move` cho cả nhóm đang chọn |
| Giữ phải / giữa rồi kéo; kéo bằng cảm ứng | Di chuyển camera (ngưỡng 4 px mới tính là kéo) |
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
| Ctrl + A | Chọn tất cả quân của mình |
| Nhấp đúp vào quân | Chọn mọi quân cùng loại đang trên màn hình |
| A | Nhóm đang chọn tấn công (action `attack`) |
| S | Nhóm đang chọn dừng lại (action `stop`: lệnh `hold`, xoá đích và đường đi) |
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
- Đang gõ trong ô nhập liệu thì phím không có tác dụng (`typing()`).

## Code liên quan
- [src/ui/selection.ts](../../src/ui/selection.ts): `SELECT_KEYS`, `selectUnits()`, `selectedOwnUnits()`, `filterSelectionByType()`, `selectTypeFromPool()`, `updateSelectionBar()` (gọi từ `updateHUD()` và sau mỗi lần lọc / gọi nhóm). [src/ui/hotkeys.ts](../../src/ui/hotkeys.ts): `saveGroup()`, `recallGroup()`.
- [src/ui/input.ts](../../src/ui/input.ts): các `addEventListener` ở cấp module (`wheel`, hai `pointerdown`, hai `pointermove`, `stopPan()`, `endPointer()`, `click`, hai `keydown`; minimap: `centerCameraOnMinimap()`).
- [src/ui/hotkeys.ts](../../src/ui/hotkeys.ts): `HOTKEYS`, `TRAIN_KEYS`, `BUILD_KEYS`, `selectUnits()`, nhóm quân, nhấp đúp chọn cùng loại, một trình xử lý `keydown` cho mọi phím.
- [src/ui/panels.ts](../../src/ui/panels.ts): đóng bảng khi bấm xuống canvas.
- `applyAction()` nhánh `'move'` (đội hình), `commandAttack()`.
- `canvasPoint()`, `canvasPos()`, `worldToCanvas()`, `viewOffsets()`, `clampCamera()`, `unitHitRadius()`.
- Trạng thái UI: `selected`, `localSelectedIds`, `selectedFortress`, `selectedBuilding`, `placement`, `dragSelect`, `selectingBox`, `panning`.
- Vẽ: `drawUnitSelection()`, khung chọn trong `draw()`.

## Tương tác
- [territory.md](territory.md): nhấp chọn cờ, phạm vi chiếm.
- [combat.md](combat.md): lệnh `attack`.
- [buildings.md](buildings.md): chế độ đặt công trình chặn các thao tác khác.

## Multiplayer
- `move {ids, x, y}` và `attack {ids}` gửi cho host; host chỉ áp dụng cho quân có `team` đúng phe guest.
- Việc chọn quân là cục bộ: `localSelectedIds` được dùng để khôi phục `u.selected` sau mỗi `applySnapshot()` (snapshot luôn gửi `selected:false`).

## Kiểm thử thủ công
- [ ] Kéo khung chọn 5 quân → log "5 lính được chọn"; nhấp phải → quân dàn đội hình, không chồng lên nhau.
- [ ] Shift + nhấp thêm/bỏ quân.
- [ ] Zoom bằng con lăn giữ đúng điểm dưới con trỏ; kéo camera bằng chuột phải.
- [ ] Khoanh nhiều loại quân, bấm 5 chỉ còn kỵ binh (quân bị bỏ chọn giữ lệnh), bấm 1 khi không có trinh sát thì giữ nguyên và có thông báo; thanh quân: bấm biểu tượng chỉ chọn loại đó, Shift + bấm thêm/bỏ. Ctrl+1 lưu nhóm, Esc bỏ chọn, F1 gọi lại, bấm F1 hai lần camera tới nhóm; F5 không tải lại trang; H rồi Q/T huấn luyện; B rồi F đặt nông trại; S dừng; Delete loại bỏ; dấu phẩy chọn quân rảnh; F3 tạm dừng; F1 hướng dẫn.
- Đã chạy thử 2026-10-18: `pnpm smoke hotkeys` đạt toàn bộ các phím trên.

## Giới hạn / việc tồn đọng
- Biến `guiding` và nhánh sửa `u.dest` trong `pointermove` là code chết (không nơi nào đặt `guiding=true`).
- Ở host/AI, nhấp trái vùng trống sau khi chọn một quân gửi `move`; với nhóm chọn bằng khung thì phải dùng chuột phải.
