# Việc tồn đọng (backlog)

> Cập nhật lần cuối: 2026-10-19 · Tổng hợp từ mục "Giới hạn / việc tồn đọng" của các file trong `features/`.

Danh sách việc cho các phiên làm việc sau, xếp theo mức ảnh hưởng. Khi làm xong một mục: xoá dòng ở đây **và** dòng tương ứng trong file tính năng (quy tắc 5 trong `CLAUDE.md`). Chi tiết kỹ thuật nằm trong file tính năng được dẫn.

## Đề xuất làm tiếp
1. **Chơi thử cân bằng V3.1 + Combat V3.1** — 10–20 trận giữa người chơi cùng trình độ, mục tiêu trận 15–20 phút; ghi thời lượng, số quân, tài nguyên dư, tỉ lệ thắng từng chiến thuật; chốt giá/thời gian mở hàng đợi (đang là giá tạm). → [economy.md](features/economy.md), [combat.md](features/combat.md), [units.md](features/units.md)

## Lối chơi
- [ ] Chế độ AI: quân xanh nhắm được địch trong sương mù (không đối xứng). Cần quyết nút "Tấn công" làm gì khi chưa thấy địch. → [combat.md](features/combat.md), [fog-of-war.md](features/fog-of-war.md)
- [ ] AI mở rộng chậm nếu trinh sát chết sớm; nhóm chiếm cờ và thợ xây bị rút khỏi đội hình. → [ai-opponent.md](features/ai-opponent.md)
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
- [ ] Âm thanh: thêm nhạc nền / tiếng môi trường; nghe duyệt lại các tiếng sự kiện (thua trận đang là saxophone). → [audio.md](features/audio.md)
- [ ] Văn bản hướng dẫn (`#guideModal` trong `index.html`) viết cứng. → [hud-ui.md](features/hud-ui.md)
- [ ] Minimap chưa có ping. → [minimap.md](features/minimap.md)
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
**2026-10-19 (quân không đi xuyên nhau, công trình chặn đường):** quân chồng nhau tự tách nhẹ; nông trại, tháp, tiền đồn, pháo đài chặn ô nên đường đi vòng qua; quân cận chiến đánh công trình từ sát mép, cung thủ giữ tầm cũ.

**2026-10-19 (bảng thông tin đang chọn):** góc phải dưới hiện máu, sát thương, khắc chế, lệnh của quân / nhóm quân; pháo, thu nhập của pháo đài; tiến độ xây, nâng cấp, súng của công trình; tiến độ chiếm, quân trong vòng, sản lượng của cờ.

**2026-10-19 (AI tấn công + độ khó):** AI gom quân ở điểm tập kết, đánh theo đợt vào công trình / cờ địch rồi pháo đài, rút khi mất nhiều quân, kéo quân về chặn địch gần nhà; 3 độ khó Dễ / Thường / Khó chọn ở sảnh hoặc Cài đặt.

**2026-10-19 (thống kê cuối trận):** hộp kết quả có bảng so sánh hai phe (tuyển/mất/hạ gục/sát thương/quân đông nhất, công trình, vùng, thu/tiêu từng tài nguyên), biểu đồ số vùng và quân số theo thời gian, nút sao chép số liệu JSON cho chơi thử.

**2026-10-19 (Unit Control V1.0):** phím 1–5 lọc loại lính trong nhóm đang chọn; thanh quân (bấm: chỉ loại đó, Shift + bấm: thêm/bỏ); nhóm quân lưu Ctrl + 1–9, gọi F1–F9 (Shift: thêm); tạm dừng chuyển sang F10, hướng dẫn sang phím ?.

**2026-10-19 (Combat V3.1, chỉ sát thương):** ST quân 7/14/12/16/24; súng pháo đài 18, pháo thứ hai 45, tháp 30, tiền đồn 12; khắc chế giáo→kỵ ×2,2, kỵ→cung ×1,5, cung→giáo ×1,3, lính→giáo ×1,2; hệ số đánh công trình 0,5/1,1/1,0/0,6/0,8 (không nhân chồng).

**2026-10-19 (cân bằng V3.1, bản thử nghiệm):** khởi đầu 200/250/75/75; nhà chính 40/30/10/10; lãnh thổ 45/45/35/35; nông trại 35/50/70 (120 gỗ, nâng cấp 100+40 / 160+80); quân rẻ hơn và nuôi ít lúa hơn; tháp 120/120/30 xây 30 giây; tiền đồn 150/80 xây 35 giây; pháo thứ hai 150 đá.

**2026-10-18 (sửa lỗi kẹt mép bản đồ):** đường đi không còn dùng vòng ô ngoài cùng, điểm đường đi kẹp vào `MOVE_BOUNDS`; `pnpm smoke path` hết lỗi ngẫu nhiên; thêm unit test.

**2026-10-18 (kinh tế & hàng đợi V2):** nhà chính 80/50/15/20, lãnh thổ 100/100/40/70, nông trại 60 lúa/phút; 4 hàng đợi huấn luyện song song + 4 chỗ chờ, mua thêm từ hàng đợi thứ 5 (giá tạm trong `QUEUE_LANE_UPGRADES`), không giới hạn quân số.

**2026-10-18 (âm thanh):** 45 hiệu ứng CC0 của Kenney cho giao diện, mệnh lệnh, trận đánh (định vị theo camera, chỉ chỗ nhìn thấy) và sự kiện; tab Âm thanh (âm lượng tổng / trận đánh / giao diện, tắt tiếng), phím M; máy khách PvP nghe theo snapshot.

**2026-10-18 (cài đặt + hiệu ứng mở menu):** hộp Cài đặt 3 tab (chất lượng hình, giảm chuyển động, thanh máu, nhãn, đường đi, ranh giới, cỡ giao diện, tốc độ cuộn, thời gian thông báo), tự lưu `localStorage`; menu ☰ bung kiểu dải cờ, hộp thoại mở kiểu cuộn giấy da với vệt sáng đồng, bảng có hiệu ứng đóng, sảnh xuất hiện lần lượt.

**2026-10-18 (quay về ảnh vẽ tay):** bỏ quân vẽ bằng code (`render/unitArt.ts`), dùng lại spritesheet; lính giáo vẫn 4 hướng (hướng chéo → trái/phải); quân chết vẫn có sprite ngã rồi mờ.

**2026-10-18 (8 hướng + đánh nhau):** quân dựng bằng con rối 3-D chiếu theo góc quay: 8 hướng (5 góc dựng + 3 lật), đi 6 khung, tấn công 4 khung (lấy đà / ra đòn / theo đà / thu về) riêng cho kiếm, dao, giáo, cung, thương; trúng đòn chớp đỏ; chết thì ngã rồi mờ; hướng 8 cung có độ trễ.

**2026-10-18 (quân vẽ bằng code, 4 hướng):** cả 5 loại quân vẽ lại bằng vector (`render/unitArt.ts`): nhìn thẳng / quay lưng / nghiêng (trái = lật), đứng yên, đi 4 khung, động tác tấn công; màu phe từ theme; khung lưu đệm; chân dung thẻ Huấn luyện dùng hình mới; hướng có độ trễ chống lật.

**2026-10-18 (tông màu "sắt & máu"):** thay nền xanh navy bằng da thuộc nâu sẫm / than lò rèn, viền đồng thau, chữ giấy da, nhấn đỏ máu; sảnh có quầng lửa than; màu hai phe giữ xanh/đỏ.

**2026-10-18 (tối ưu FPS):** đốm địa hình dựng một lần, chỉ vẽ trong camera, gom theo màu, có ảnh dựng sẵn khi thu nhỏ (`draw()` 9,5 → ≈ 1 ms ở zoom mặc định, 84 → ≈ 0,8 ms khi thu nhỏ hết); lọc quân/công trình/cờ ngoài camera; HUD 10 lần/giây và chỉ ghi DOM khi đổi; sương mù chỉ làm mờ lại khi thay đổi, mép mềm tính bằng cửa sổ trượt.

**2026-10-18 (đối chiếu "Cơ chế sinh tài nguyên lãnh thổ"):** code khớp tài liệu; bỏ mỏ giàu (× 1,5) để mọi vùng cùng loại sinh 25/30/20/20 mỗi phút; ô lúa hiện gộp − tiêu hao = ròng; nông trại giữ nguyên (nâng cấp + thưởng 25%).

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
