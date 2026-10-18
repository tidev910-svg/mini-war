# Mini War

Game RTS 1 đấu 1 chạy trên trình duyệt: Vite + TypeScript + Canvas 2D. Có chế độ chơi với AI và chơi P2P với bạn bè qua PeerJS. Logic chia module theo tính năng trong `src/` (`config/` hằng số, `core/`, `map/`, `sim/`, `ai/`, `net/`, `render/`, `ui/`; điểm vào `src/main.ts`; mọi file có `// @ts-nocheck`), giao diện ở `index.html`, theme ở `src/style.css`, sprite ở `public/assets/`. Bảng module: `docs/architecture.md`.

## Lệnh
- `pnpm install` — cài thư viện.
- `pnpm dev` — chạy server dev (http://localhost:5173).
- `pnpm build` — `tsc --noEmit && vite build`. Vì có `@ts-nocheck`, build qua **không** chứng minh logic đúng; phải chạy test.
- `pnpm test` — unit test (vitest + jsdom) trong `tests/`, chạy chính các module game.
- `pnpm smoke` — smoke test trên Chrome headless trong `scripts/smoke/` (cần `pnpm dev` đang chạy); chạy riêng nhóm: `pnpm smoke maps pvp`. Nhóm: boot, ui, hotkeys, maps, path, capture, vision, economy, training, ai, pvp.
- Sửa luật/cân bằng thì cập nhật test tương ứng (số trong test là số đã chốt).

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
- Code mới đặt đúng module (bảng trong `docs/architecture.md`): hằng số cân bằng vào `src/config/`, luật mô phỏng vào `src/sim/`, vẽ vào `src/render/`. Biến `let` dùng chung chỉ gán qua setter của module sở hữu (`setPaused()`, `setState()`…).
- Màu, cỡ chữ, khoảng cách giao diện chỉ khai báo trong `src/config/theme.ts` (design tokens → biến CSS `var(--…)`); không viết mã màu trong CSS/HTML. Màu của người chơi dùng `--faction-*`.
- Chữ hiển thị cho người chơi viết tiếng Việt.
