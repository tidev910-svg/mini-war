# Điều khiển, chọn quân & camera

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-17

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

**Phím** (phím mũi tên và +/- chỉ hoạt động khi canvas đang được focus — nhấp vào bản đồ trước)
| Phím | Kết quả |
|---|---|
| Mũi tên | Kéo camera 180/zoom (Shift: 360/zoom) |
| `+` / `=` | Phóng to (×1.15) |
| `-` / `_` | Thu nhỏ (÷1.15) |
| Space | Tạm dừng/tiếp tục |
| A | Lệnh tấn công cho quân đang chọn |
| Escape | Huỷ đặt công trình |
| T | Ẩn/hiện lớp lãnh thổ (không cần focus canvas; bỏ qua khi đang gõ trong ô nhập) |

**Đội hình** (action `move`): quân được xếp lưới vuông `ceil(√n)` cột, khoảng cách 34, tâm lưới là điểm nhấp và được đẩy vào trong nếu sát mép. Toạ độ kẹp trong `[25, W−25] × [45, H−30]`. Khi đang khoá xuất quân, quân có ô đích ngoài vùng căn cứ bị chuyển `hold`.

**Camera**: `zoom` trong `[MIN_ZOOM, MAX_ZOOM]`; mặc định `DEFAULT_ZOOM` = khung nhìn rộng 64 ô, tối đa zoom vào 32 ô. Đầu trận camera đặt ở pháo đài của mình (`centerCameraOnHome()`; guest PvP là pháo đài đỏ).

## Code liên quan
- [src/ui/input.ts](../../src/ui/input.ts): các `addEventListener` ở cấp module (`wheel`, hai `pointerdown`, hai `pointermove`, `stopPan()`, `endPointer()`, `click`, hai `keydown`).
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
- [ ] Phím mũi tên chỉ chạy sau khi nhấp vào canvas.

## Giới hạn / việc tồn đọng
- Biến `guiding` và nhánh sửa `u.dest` trong `pointermove` là code chết (không nơi nào đặt `guiding=true`).
- Ở host/AI, nhấp trái vùng trống sau khi chọn một quân gửi `move`; với nhóm chọn bằng khung thì phải dùng chuột phải.
