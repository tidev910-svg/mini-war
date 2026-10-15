# Quy ước & nguyên tắc sửa đổi

> Cập nhật lần cuối: 2026-10-15

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
- Tài nguyên tách theo team: `state.gold/energy` (team 0), `state.enemyGold/enemyEnergy` (team 1). Luôn đọc/ghi qua `teamGold()`, `setTeamGold()`, `teamEnergy()`, `setTeamEnergy()`.
- Toạ độ thế giới: hình vuông `W × H` với `W = H = VIEW_W × 10`, chia lưới `MAP_TILES = 256` ô; `TILE_SIZE = W / 256`. Lưu ý `W` phụ thuộc kích thước canvas lúc khởi tạo (xem [architecture.md](architecture.md)).
- Loại quân cũ `'tank'` được đổi thành `'spearman'` bởi `normalizeUnitType()`.
- Chữ hiển thị cho người chơi viết bằng tiếng Việt.

## Thuật ngữ
| Thuật ngữ | Nghĩa |
|---|---|
| Pháo đài (fortress / base) | Căn cứ chính của mỗi phe, có pháo tích hợp. Mất pháo đài = thua. |
| Sân tập kết (muster yard) | Khu đất cạnh pháo đài nơi quân mới xuất hiện. |
| Thời gian khoá xuất quân | 120 giây đầu trận, chỉ trinh sát được rời vùng căn cứ. |
| Hàng chờ xuất quân | `state.pendingSpawns`: quân đã trả tiền nhưng sân tập kết đang kín. |
| Snapshot | Gói toàn bộ trạng thái trận host gửi cho guest. |
| Action | Lệnh guest gửi cho host (`{type:'action', action, payload}`). |
| Authoritative host | Host là nguồn trạng thái duy nhất; guest chỉ gửi lệnh và vẽ snapshot. |
