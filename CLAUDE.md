# Mini War

Game RTS 1 đấu 1 chạy trên trình duyệt: Vite + TypeScript + Canvas 2D. Có chế độ chơi với AI và chơi P2P với bạn bè qua PeerJS. Toàn bộ logic nằm trong `src/main.ts` (có `// @ts-nocheck`), giao diện ở `index.html`, theme ở `src/style.css`, sprite ở `public/assets/`.

## Lệnh
- `pnpm install` — cài thư viện.
- `pnpm dev` — chạy server dev (http://localhost:5173).
- `pnpm build` — `tsc --noEmit && vite build`. Vì có `@ts-nocheck`, build qua **không** chứng minh logic trong `main.ts` đúng; phải chạy thử trong trình duyệt.
- Không có test tự động.

## Tài liệu cơ chế game — đọc trước khi sửa
- Bắt đầu từ `docs/README.md` (mục lục), rồi `docs/architecture.md`, `docs/conventions.md` và file tính năng liên quan trong `docs/features/`.
- Code là nguồn đúng cuối cùng. Nếu tài liệu lệch với code, sửa tài liệu cho khớp và báo lại cho người dùng.
- `docs/archive/` đã lỗi thời, không dùng làm căn cứ.
- Việc tồn đọng cho phiên sau: `docs/backlog.md`. Hỏi người dùng muốn làm mục nào; làm xong thì xoá dòng ở đó và trong file tính năng.
- Ảnh: game dùng `public/assets/units/<quân>/<quân>-sheet.png`; ảnh nguồn ở `art/units/<quân>/`. Đặt tên và xếp file theo `docs/assets.md`.

## Quy tắc cập nhật tài liệu (bắt buộc, làm trong cùng lần sửa code)
1. **Tính năng mới** → copy `docs/_template.md` thành `docs/features/<ten-kebab-case>.md`, điền đủ các mục, thêm một dòng vào bảng trong `docs/README.md`.
2. **Sửa, cân bằng hoặc mở rộng tính năng đã có** → sửa trực tiếp file tính năng đó (thông số, hàm liên quan, multiplayer, checklist kiểm thử, giới hạn, ngày "Cập nhật lần cuối"). Không tạo file mới cho bản cập nhật.
3. Thay đổi đụng nhiều tính năng → cập nhật mọi file liên quan.
4. Đổi tên/xoá hàm → tìm trong `docs/` và sửa mọi chỗ nhắc tới.
5. Sửa xong một lỗi được ghi trong mục "Giới hạn / việc tồn đọng" → xoá dòng đó.
6. Tham chiếu code bằng tên hàm/biến, không ghi số dòng.

## Nguyên tắc sửa code (chi tiết ở `docs/conventions.md`)
- Không đổi chỉ số cân bằng (giá, HP, sát thương, tốc độ, thu nhập…) nếu không được yêu cầu.
- Mọi thay đổi trạng thái do người chơi gây ra phải đi qua `requestAction()` → `applyAction()` để chạy đúng ở PvP (host là nơi quyết định).
- Giữ cả chế độ AI và PvP chạy được.
- Sương mù: tách "đã khám phá" (`state.fogSeen` / `state.enemyFogSeen`) với "đang nhìn thấy" (`teamCanSee()`).
- Chữ hiển thị cho người chơi viết tiếng Việt.
