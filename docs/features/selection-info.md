# Bảng thông tin đang chọn

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-20

## Mô tả
Bảng nhỏ ở góc phải dưới (trên 3 nút khiên) cho biết thứ đang chọn là gì và đang làm gì, thay cho việc đọc nhật ký khi nhấp. Chỉ hiện khi có lựa chọn, mỗi lúc một thứ, cùng thứ tự ưu tiên với nhấp chuột: quân → pháo đài → công trình → cờ.

| Đang chọn | Nội dung |
|---|---|
| 1 quân | Tên, phe, thanh máu; sát thương mỗi lần đánh và thời gian hồi (ghi chú khi thiếu lúa); tầm đánh, tốc độ, lúa nuôi; **Mạnh với** / **Yếu trước** (hệ số khắc chế); hệ số đánh công trình; lệnh hiện tại |
| Nhóm quân | Số quân và các loại, tổng máu, sát thương/giây ước tính (Σ sát thương / hồi chiêu, nhân hệ số thiếu lúa), tổng lúa nuôi; nhóm cùng loại thì có thêm dòng khắc chế; số quân theo từng lệnh |
| Pháo đài | Máu, số pháo đang có và sát thương mỗi pháo, thu nhập mỗi phút, số hàng huấn luyện |
| Công trình | Máu; tiến độ xây (tiền đồn: có/không có quân đứng gần để xây); tiến độ nâng cấp; nông trại: cấp và lúa/phút (thưởng vùng lúa); tháp/tiền đồn: súng |
| Cờ | Loại vùng, phe giữ; cờ có chủ: dòng **Tự vệ** (10 sát thương / 2 giây, tầm 180); cờ của mình: **Đồn trú** (số quân theo loại), **Đang xuất kích**, nút **Cho toàn bộ quân ra** (action `garrisonExit`; [flag-defense.md](flag-defense.md)); tiến độ hạ cờ (1/2) / chiếm cờ (2/2) và phe đang chiếm; tranh chấp hoặc tiền đồn giữ cờ; tài nguyên mỗi phút cho phe giữ; số quân mình (và quân địch **đang nhìn thấy**) trong vòng cờ, thời gian ước tính mỗi giai đoạn; có tiền đồn không |

Dòng **Đội hình** (khi có): loại đội hình · cách di chuyển · đang hành quân / hàng dọc qua lối hẹp ([formations.md](formations.md)).

Lệnh hiển thị: Xuất kích bảo vệ cờ (`sortie`), Đang về đồn trú (`garrisonTarget`), Theo đội hình (`formation`), Đứng giữ vị trí (`hold`), Đang di chuyển (`move`), Tấn công (`attack`), Đi tự do (`explore`), Đang chiếm cờ (`captureTarget`), Đang xây tiền đồn (`buildTarget`).

## Luật & thông số
Không áp dụng: chỉ đọc số từ `specs`, `COUNTER_MULTIPLIERS`, `STRUCTURE_DAMAGE_MULTIPLIERS`, `BUILDING_TYPES`, `FARM_LEVELS`, `FORTRESS_GUN_DAMAGE`, `FORTRESS_INCOME_PER_MINUTE`, mỏ của vùng (`state.mines[].income`).

## Code liên quan
- [src/ui/info.ts](../../src/ui/info.ts): `updateSelectionInfo()` (gọi trong `updateHUD()`, chỉ ghi DOM khi nội dung đổi), `counterLines(type)`, các hàm cục bộ `unitsHtml()`, `fortressHtml()`, `buildingHtml()`, `flagHtml()`.
- Dữ liệu chọn: `selectedOwnUnits()` (`ui/selection.ts`), `selectedFortress`, `selectedBuilding` (tra lại theo `id` để khách PvP không giữ bản cũ sau snapshot), `selectedFlag`.
- Giao diện: `#selInfo` trong [index.html](../../index.html); class `.sel-info`, `.info-bar`, `.info-note` trong [src/style.css](../../src/style.css).

## Tương tác
- [controls.md](controls.md): nhấp chọn quân / pháo đài / công trình / cờ.
- [combat.md](combat.md), [units.md](units.md), [buildings.md](buildings.md), [fortress.md](fortress.md), [territory.md](territory.md): nguồn các con số.
- [fog-of-war.md](fog-of-war.md): quân địch trong vòng cờ chỉ đếm khi đang nhìn thấy (`teamCanSee()`).

## Multiplayer
Chỉ đọc `state` cục bộ, không gửi action. Khách đọc từ snapshot; phe "bạn" theo `localTeam()`.

## Kiểm thử thủ công
- [ ] Chọn 1 quân, nhóm hỗn hợp, nhóm cùng loại: nội dung đúng bảng trên; máu giảm khi bị đánh.
- [ ] Đặt nông trại / tiền đồn: thanh tiến độ chạy; tiền đồn báo thiếu thợ khi không có quân đứng gần.
- [ ] Chọn cờ khi đang chiếm: tiến độ và số quân đúng; quân địch trong sương mù không bị lộ.
- [ ] PvP khách: bảng cập nhật theo snapshot.
- Unit test: `tests/info.test.ts`.

## Giới hạn / việc tồn đọng
- Không chọn được quân / công trình địch nên chưa xem được thông tin của chúng.
- Nút duy nhất là "Cho toàn bộ quân ra" của cờ mình; chưa có nút nâng cấp, huỷ…
