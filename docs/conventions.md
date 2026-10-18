# Quy ước & nguyên tắc sửa đổi

> Cập nhật lần cuối: 2026-10-18

## Nguyên tắc khi sửa code
1. Giữ chế độ **Chơi với AI** chạy được khi sửa multiplayer, và ngược lại.
2. Không tự đổi giá, HP, sát thương, tốc độ, cooldown, tầm, thu nhập hay luật mỏ nếu yêu cầu không nói tới cân bằng.
3. Thay đổi phần vẽ không được làm đổi chỉ số logic, va chạm hay vùng nhìn.
4. Sương mù: luôn tách **đã khám phá** (`state.fogSeen` / `state.enemyFogSeen`) với **đang nhìn thấy** (`teamCanSee()`).
5. Mọi thay đổi trạng thái trận do người chơi gây ra phải đi qua `requestAction()` → `applyAction()` để host là nơi quyết định trong PvP. Kiểm tra hợp lệ (vị trí, tài nguyên) đặt ở hàm được `applyAction()` gọi, không chỉ ở phía UI.
6. Lệnh đội hình phải gán đích riêng cho từng quân, không để cả nhóm cùng một toạ độ.
7. Tính năng áp dụng cho cả hai chế độ phải được thử ở cả AI lẫn PvP (2 tab trình duyệt).
8. Khi báo cáo, ghi rõ phần nào đã chạy thử thật, phần nào mới qua `pnpm build` (typecheck).
9. Mọi file trong `src/` có `// @ts-nocheck`: `tsc` **không** bắt lỗi kiểu, nên build qua chưa có nghĩa là logic đúng. Chạy `pnpm test` và `pnpm smoke`.

## Quy ước module (`src/`)
10. Đặt code theo bảng module trong [architecture.md](architecture.md): hằng số/bảng cân bằng → `config/` (chỉ dữ liệu, không logic); luật mô phỏng → `sim/`; vẽ → `render/`; DOM/HUD/sự kiện → `ui/`; mạng → `net/`.
11. Mỗi biến `let` dùng chung có **một module sở hữu**. Module khác đọc trực tiếp qua `import`; muốn gán thì gọi setter của module sở hữu (`setPaused(v)`, `setState(v)`, `setZoom(v)`, `setNextId(nextId+1)`…). Thêm biến dùng chung mới thì viết setter `export function setX(v){return x=v;}` ngay dưới khai báo.
12. Không chạy logic trận lúc nạp module; code cấp module chỉ tạo canvas/sprite, dựng địa hình và gán sự kiện. Trận đầu do `main.ts` khởi động.
13. Hạn chế import ngược hướng `config` ← `core` ← `map`/`sim` ← `ai`/`net` ← `render`/`ui`; các ngoại lệ hiện có liệt kê ở [architecture.md](architecture.md).
14. Sửa luật hoặc số cân bằng đã chốt → sửa test tương ứng trong `tests/` và `scripts/smoke/run.mjs`.
15. Màu, cỡ chữ, khoảng cách của giao diện chỉ khai báo trong `src/config/theme.ts` (`THEME`, `TEAM_COLORS`, `MAP_UI`). CSS dùng `var(--tên-token)`, không viết mã màu trong `style.css`, `index.html` hay `style="…"`. Code vẽ lớp phủ trên bản đồ (nhãn, thanh máu, đường biên, minimap) lấy màu từ `config/theme.ts`. Đồ của người chơi dùng `--faction-*` (theo `localTeam()`), không viết cứng xanh/đỏ. Chữ trên giao diện và bản đồ tối thiểu 12 px; nút chỉ có icon phải có `data-tip`.

## Quy ước dữ liệu
- **Team 0 = phe xanh**: người chơi ở chế độ AI, chủ phòng (host) ở PvP.
- **Team 1 = phe đỏ**: máy ở chế độ AI, khách (guest) ở PvP.
- Vị trí hai căn cứ ngẫu nhiên mỗi trận (không cố định trái/phải); hướng "phía trước" của căn cứ là `baseDir(base)`, đừng suy từ số team.
- `localTeam()` trả về team của trình duyệt hiện tại; dùng nó cho mọi thứ "của mình" trên UI.
- Tài nguyên: `state.resources[team] = {food, wood, stone, gold}`. Giá viết dạng object chỉ gồm khoá cần (ví dụ `{food:45, wood:20}`). Kiểm tra/trừ qua `canAfford()`, `spend()`; hiển thị bằng `costText()`, `missingText()`. Không viết số giá cứng trong log hay HTML.
- Toạ độ thế giới: hình vuông cố định `W = H = WORLD_SIZE = 9600`, chia lưới `MAP_TILES = 256` ô; `TILE_SIZE = 37,5`. Không suy `W` từ kích thước canvas — mọi trình duyệt phải có cùng toạ độ.
- Loại quân cũ `'tank'` được đổi thành `'spearman'` bởi `normalizeUnitType()`.
- Quân phân loại bằng `type` (khoá trong `specs`); công trình bằng `kind` (khoá trong `BUILDING_TYPES`). Đừng thêm `type` cho công trình: `hurt()` và tính tầm đánh dựa vào sự khác nhau này.
- Mọi công trình nằm trong `state.buildings`, tra theo `id` (không theo chỉ số mảng).
- Chữ hiển thị cho người chơi viết bằng tiếng Việt.

## Thuật ngữ
| Thuật ngữ | Nghĩa |
|---|---|
| Pháo đài (fortress / base) | Căn cứ chính của mỗi phe, có pháo tích hợp. Mất pháo đài = thua. |
| Sân tập kết (muster yard) | Khu đất cạnh pháo đài nơi quân mới xuất hiện. |
| Hàng đợi huấn luyện | `state.trainQueue`: quân đã trả tiền, đang huấn luyện lần lượt tại pháo đài. |
| Hàng chờ xuất quân | `state.pendingSpawns`: quân đã huấn luyện xong nhưng sân tập kết đang kín. |
| Snapshot | Gói toàn bộ trạng thái trận host gửi cho guest. |
| Vùng (region) | Phần bản đồ có ranh giới tự nhiên, đúng một loại tài nguyên và một mỏ, một cột cờ có sẵn; chiếm bằng cách đứng quân trong vòng cờ. Vùng chứa pháo đài là vùng nhà (không có cờ). |
| Lãnh thổ | 14 ô quanh pháo đài + các vùng mình sở hữu; nơi được xây tháp. |
| Cột cờ (flag) | Cờ có sẵn ở gần tâm mỗi vùng thường (`region.cp`); không phải công trình, không bị phá. |
| Tiền đồn | Công trình phòng thủ xây cạnh cờ của vùng mình (`kind: 'outpost'`): có súng, và còn đứng thì đối phương không chiếm được cờ đó. |
| Action | Lệnh guest gửi cho host (`{type:'action', action, payload}`). |
| Authoritative host | Host là nguồn trạng thái duy nhất; guest chỉ gửi lệnh và vẽ snapshot. |
