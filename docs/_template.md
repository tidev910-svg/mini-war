# <Tên tính năng>

> Trạng thái: Đang có | Cần kiểm thử | Đề xuất · Cập nhật lần cuối: YYYY-MM-DD

<!--
Cách dùng: copy file này thành docs/features/<ten-kebab-case>.md, điền mọi mục,
xoá mục không áp dụng (ghi "Không áp dụng" thay vì để trống), rồi thêm 1 dòng
vào bảng trong docs/README.md. Tham chiếu code bằng TÊN HÀM/BIẾN, không ghi số dòng.
-->

## Mô tả
Người chơi thấy gì, làm gì, tính năng giải quyết điều gì trong trận.

## Luật & thông số
| Thông số | Giá trị | Nguồn trong code |
|---|---:|---|
| Ví dụ: Giá | 80 vàng | `placeFarmAt()` |

## Code liên quan
- [src/main.ts](../../src/main.ts): `tenHam()` — vai trò ngắn gọn.
- Trường trong `state`: `state.xxx` — cấu trúc dữ liệu.
- Giao diện: phần tử `#id` trong [index.html](../../index.html), class trong [src/style.css](../../src/style.css).

## Tương tác
- [ten-tinh-nang-khac.md](ten-tinh-nang-khac.md): ảnh hưởng thế nào.

## Multiplayer
- Action guest gửi qua `requestAction()`: `'tenAction'` + payload.
- Host xử lý trong `applyAction()`; dữ liệu đi qua snapshot: ...

## Kiểm thử thủ công
- [ ] Chế độ AI: ...
- [ ] PvP (host và guest): ...

## Giới hạn / việc tồn đọng
- ...
