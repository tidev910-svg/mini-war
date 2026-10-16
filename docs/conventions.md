# Quy ước & nguyên tắc sửa đổi

> Cập nhật lần cuối: 2026-10-16

## Nguyên tắc khi sửa code
1. Giữ chế độ **Chơi với AI** chạy được khi sửa multiplayer, và ngược lại.
2. Không tự đổi giá, HP, sát thương, tốc độ, cooldown, tầm, thu nhập hay luật mỏ nếu yêu cầu không nói tới cân bằng.
3. Thay đổi phần vẽ không được làm đổi chỉ số logic, va chạm hay vùng nhìn.
4. Sương mù: luôn tách **đã khám phá** (`state.fogSeen` / `state.enemyFogSeen`) với **đang nhìn thấy** (`teamCanSee()`).
5. Mọi thay đổi trạng thái trận do người chơi gây ra phải đi qua `requestAction()` → `applyAction()` để host là nơi quyết định trong PvP. Kiểm tra hợp lệ (vị trí, tài nguyên) đặt ở hàm được `applyAction()` gọi, không chỉ ở phía UI.
6. Lệnh đội hình phải gán đích riêng cho từng quân, không để cả nhóm cùng một toạ độ.
7. Tính năng áp dụng cho cả hai chế độ phải được thử ở cả AI lẫn PvP (2 tab trình duyệt).
8. Khi báo cáo, ghi rõ phần nào đã chạy thử thật, phần nào mới qua `pnpm build` (typecheck).
9. `src/main.ts` có `// @ts-nocheck`: `tsc` **không** bắt lỗi kiểu trong file này, nên build qua chưa có nghĩa là logic đúng.

## Quy ước dữ liệu
- **Team 0 = phe xanh**: người chơi ở chế độ AI, chủ phòng (host) ở PvP. Căn cứ bên trái bản đồ.
- **Team 1 = phe đỏ**: máy ở chế độ AI, khách (guest) ở PvP. Căn cứ bên phải.
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
| Thời gian khoá xuất quân | 120 giây đầu trận, chỉ trinh sát được rời vùng căn cứ. |
| Hàng chờ xuất quân | `state.pendingSpawns`: quân đã trả tiền nhưng sân tập kết đang kín. |
| Snapshot | Gói toàn bộ trạng thái trận host gửi cho guest. |
| Vùng (region) | Phần bản đồ có ranh giới tự nhiên, 1–2 mỏ và một điểm chiếm; chiếm bằng cột cờ. Vùng chứa pháo đài là vùng nhà. |
| Lãnh thổ | 14 ô quanh pháo đài + các vùng mình sở hữu; nơi được xây nhà lính và tháp. |
| Tiền đồn | Cột cờ đã nâng cấp: máu cao hơn, có súng. |
| Action | Lệnh guest gửi cho host (`{type:'action', action, payload}`). |
| Authoritative host | Host là nguồn trạng thái duy nhất; guest chỉ gửi lệnh và vẽ snapshot. |
