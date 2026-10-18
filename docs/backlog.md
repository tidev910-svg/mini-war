# Việc tồn đọng (backlog)

> Cập nhật lần cuối: 2026-10-17 · Tổng hợp từ mục "Giới hạn / việc tồn đọng" của các file trong `features/`.

Danh sách việc cho các phiên làm việc sau, xếp theo mức ảnh hưởng. Khi làm xong một mục: xoá dòng ở đây **và** dòng tương ứng trong file tính năng (quy tắc 5 trong `CLAUDE.md`). Chi tiết kỹ thuật nằm trong file tính năng được dẫn.

## Đề xuất làm tiếp
1. **AI tổ chức tấn công** — AI chỉ đánh khi gặp địch; `enemyMemory` đã ghi nhưng chưa dùng. → [ai-opponent.md](features/ai-opponent.md)
2. **Playtest bản cân bằng v1** (17/10: thu nhập pháo đài 25/20/8/8, mỏ lúa 25, mỏ vàng 20, giá quân mới, hàng đợi huấn luyện) — chơi 5–10 trận ở nhiều vị trí nhà, đo số quân phút 5/10/15, thời điểm chiếm cờ đầu tiên, thời gian phản công sau khi mất đất; chốt thời lượng trận mong muốn (15/20/30 phút). Chưa có nút huỷ quân trong hàng đợi. → [economy.md](features/economy.md), [resource-system.md](features/resource-system.md)

## Lối chơi
- [ ] Quân không va chạm nhau; đường đi không né công trình. → [pathfinding.md](features/pathfinding.md)
- [ ] Chế độ AI: quân xanh nhắm được địch trong sương mù (không đối xứng). Cần quyết nút "Tấn công" làm gì khi chưa thấy địch. → [combat.md](features/combat.md), [fog-of-war.md](features/fog-of-war.md)
- [ ] AI chưa tổ chức tấn công; mở rộng chậm nếu trinh sát chết sớm; nhóm chiếm cờ và thợ xây bị rút khỏi đội hình. → [ai-opponent.md](features/ai-opponent.md)
- [ ] Vị trí vùng lãnh thổ không đối xứng giữa hai phe (đã có kiểm tra công bằng theo chi phí đi bộ, độ lệch ≤ 0,3). → [territory.md](features/territory.md)
- [ ] Tốc độ giảm tiến độ khi bỏ trống cờ (60 giây cho cả thanh) là số tạm. → [territory.md](features/territory.md)
- [ ] **Chưa quyết thiết kế:** mỏ cạn dần hay vô hạn; có điều kiện thắng theo vùng không; thưởng lãnh thổ +10% (hiện: không). → [territory.md](features/territory.md)
- [ ] Không huỷ được công trình đang xây; kéo được nông trại đang xây. → [buildings.md](features/buildings.md), [farms.md](features/farms.md)
- [ ] Thợ xây tiền đồn là "bất kỳ quân nào", chưa có loại quân thợ xây riêng. → [territory.md](features/territory.md)
- [ ] Không có giới hạn trần tài nguyên. → [economy.md](features/economy.md)

## Chơi với bạn bè (PvP)
- [ ] Log sự kiện chỉ hiện ở host (mua quân đã có kiểm tra trước ở guest; xây/nâng cấp bị từ chối thì guest chưa thấy lý do). → [multiplayer.md](features/multiplayer.md)
- [ ] Không có "chơi lại" trong cùng phòng; bên nào cũng bỏ được tạm dừng của bên kia. → [match-flow.md](features/match-flow.md)
- [ ] Snapshot gửi toàn bộ `state` mỗi 0,18 giây (không nén, không delta). → [multiplayer.md](features/multiplayer.md)
- [ ] Phòng không mật khẩu; chưa giới hạn tần suất lệnh. → [multiplayer.md](features/multiplayer.md)
- [ ] Fog của host và guest có thể lệch → host từ chối chỗ đặt guest thấy hợp lệ. → [fog-of-war.md](features/fog-of-war.md)
- [ ] **Chưa kiểm thử:** 2 mạng khác nhau, nhiều trình duyệt, điện thoại. → [multiplayer.md](features/multiplayer.md)

## Giao diện & đồ hoạ
- [ ] 14 nút, màn hình thấp vẫn có thể phải cuộn; công trình và nhãn nhỏ ở zoom mặc định. → [hud-ui.md](features/hud-ui.md), [buildings.md](features/buildings.md)
- [ ] Chỉ lính giáo có sprite 4 hướng; công trình (trừ nông trại) chưa có sprite. → [units.md](features/units.md), [buildings.md](features/buildings.md)
- [ ] Văn bản hướng dẫn (`#guideModal` trong `index.html`) viết cứng. → [hud-ui.md](features/hud-ui.md)
- [ ] Chưa có bảng thông tin cho quân/công trình/cờ đang chọn; minimap chưa có ping, chưa hiện mỏ. → [hud-ui.md](features/hud-ui.md), [minimap.md](features/minimap.md)
- [ ] Vùng nhấp chọn pháo đài không khớp kích thước logic; sương mù căn cứ xanh không cộng tầm nhìn pháo. → [fortress.md](features/fortress.md)
- [ ] Ở host/AI, nhóm chọn bằng khung phải dùng chuột phải để di chuyển. → [controls.md](features/controls.md)

## Dọn code & hiệu năng
- [ ] Bật kiểm tra kiểu TypeScript: bỏ `// @ts-nocheck` từng file (bắt đầu từ `src/config/`), thêm interface `GameState`, `Unit`, `Region`, `Building`. → [architecture.md](architecture.md)
- [ ] Gỡ các import ngược lớp còn lại (sim/net gọi `updateHUD()`, `sim/combat` gọi `finish()`…), để `sim/` chạy được không cần DOM. → [architecture.md](architecture.md)
- [ ] Code chết: `state.guards` (quái canh mỏ), biến `guiding`, `aiExploreTarget`. → [economy.md](features/economy.md), [controls.md](features/controls.md), [ai-opponent.md](features/ai-opponent.md)
- [ ] Bán kính tầm nhìn AI lệch `unitVisionRadius()` (giáo 120 vs 150, cung 105 vs 130). → [fog-of-war.md](features/fog-of-war.md)
- [ ] `nearestEnemy()` O(n²) mỗi frame. → [combat.md](features/combat.md)
- [ ] Kéo nông trại ở host/AI không qua `applyAction()`. → [farms.md](features/farms.md)

## Đã xong gần đây
**2026-10-18 (sảnh chính + nạp CSS):** sảnh huy hiệu (tiêu đề, menu dải cờ: Chơi với AI/Enter, Solo với bạn bè, Hướng dẫn, Toàn màn hình; cờ hai phe; sương trôi); hết chớp HTML trần khi tải: CSS là `<link>`, token chèn vào HTML qua `vite.config.ts`.

**2026-10-18 (giao diện huy hiệu & cờ hiệu):** design tokens một nơi (`config/theme.ts` → biến CSS, đổi phe chỉ đổi `--faction-*`); sương mù gần đen có vân; panel khiên + dải cờ phe + hàng icon quân; dải cờ tài nguyên với tooltip thu/chi, icon khác hình, nháy đỏ khi thiếu; menu ☰ gộp tạm dừng/hướng dẫn/ẩn giao diện/rời trận (có xác nhận); thông báo tự mờ 5 giây + lịch sử + viền đỏ khi bị tấn công; minimap góc huy hiệu, mỏ/cầu chỉ hiện khi đã khám phá, địch màu đỏ; 3 nút khiên có phím tắt và lý do khi bị khoá; nhãn pháo đài trên dải cờ, thanh máu 6 px xanh→đỏ, chữ bản đồ ≥ 12 px; đường biên lãnh thổ mềm; camera đầu trận đặt pháo đài giữa vùng không bị HUD che.

**2026-10-18 (phím tắt kiểu Đế Chế):** nhóm quân Ctrl+số / số, H chọn pháo đài + Q W E R T huấn luyện, B + F T O U P xây, dấu phẩy chọn quân rảnh, Ctrl+A, nhấp đúp chọn cùng loại, S dừng, Delete loại bỏ, Space tới nhóm đang chọn, F3 tạm dừng, F1 hướng dẫn; nhãn phím trên thẻ.

**2026-10-18:** bỏ ranh giới trên sông/hồ và giữa hai vùng trung lập (chỉ vẽ viền vùng có chủ); tầm nhìn trinh sát 145 → 260.

**2026-10-18 (tìm đường theo vùng đã khám phá):** vùng mù coi là đi được nên quân đi thẳng; tầm nhìn lộ vật cản trên đường thì tìm đường khác; đường đi vẽ trên sương mù.

**2026-10-18 (vật cản & tìm đường):** nước và đá chặn đường, 4 cầu gỗ qua sông; A* 8 hướng + làm mượt, đường chung cho nhóm; quân, AI, đuổi mục tiêu đều đi vòng; hiển thị đường đi nét đứt có mũi tên và vòng sáng ở điểm ra lệnh; sinh bản đồ kiểm tra đi bộ tới được mọi cờ, mỏ, nhà địch.

**2026-10-18 (cảnh quan):** thêm 7 hồ có bãi cát; khoảng 2.900 vật trang trí (rừng dày thông + cây lá rộng, bụi cây, cụm đá, đá nhỏ, cỏ lau, lá súng) với ảnh lớp khi thu nhỏ; khách PvP dựng lại cây đá theo bản đồ của chủ phòng; smoke test import đúng module mà trang đang dùng.

**2026-10-18 (giao diện kiểu Rise of Kingdoms):** bản đồ toàn màn hình, HUD nổi (huy hiệu chỉ huy, thanh tài nguyên, hàng đợi gồm cả công trình, nhật ký một dòng, nút lệnh tròn), bảng Huấn luyện/Xây dựng có chân dung quân, hướng dẫn dạng hộp thoại, minimap nhấp để di chuyển camera, phím H/B; viết lại `style.css`; sửa lỗi công trình đang xây không tăng máu.

**2026-10-17 (cấu trúc dự án):** tách `src/main.ts` (159 KB) thành ~30 module theo tính năng; dọn thư mục gốc (`docs/guides/`, `docs/decisions/`, `scripts/`, ảnh lạc vào `art/`); thêm `pnpm test` (unit test) và `pnpm smoke` (8 nhóm kiểm thử trình duyệt, gồm PvP).

**2026-10-17 (yêu cầu 17/10):** nông trại mở khoá sau 3 giây; bỏ nhà lính bộ, nhà lính cung, chuồng ngựa ; sau đó chốt: mọi loại quân tuyển tại pháo đài.

**2026-10-17 (chốt mục 8):** cờ địch 2 giai đoạn có hiển thị; tiền đồn riêng; vùng lúa 15/phút + nông trại trong vùng +25%; rời cờ 5 giây thì tiến độ giảm về 0; trinh sát không chiếm cờ.

**2026-10-17** (tài liệu "Tổng kết yêu cầu sửa game RTS 1vs1"): mỗi vùng một loại tài nguyên + vùng lúa, đủ 4 loại gần mỗi nhà, kiểm tra công bằng/tiếp cận khi sinh bản đồ, pháo đài không còn rơi vào đá; cột cờ có sẵn chiếm bằng số quân, tranh chấp, hạ cờ địch, tiền đồn giữ cờ; AI chiếm cờ bằng nhóm quân; viền lãnh thổ dày theo pixel; sương mù mép mềm; bỏ khoá 120 giây; nông trại 5 giây.

**2026-10-16**:
Hệ thống 4 tài nguyên, lúa duy trì, công trình, lãnh thổ (vùng bám địa hình, điểm chiếm, thợ xây, chiếm 10 giây, bật/tắt lớp), AI kinh tế; sửa lỗi: thế giới cố định 9600, guest vào lại phòng, quân kẹt hàng chờ, phím zoom, log trinh sát.
