# Việc tồn đọng (backlog)

> Cập nhật lần cuối: 2026-10-17 · Tổng hợp từ mục "Giới hạn / việc tồn đọng" của các file trong `features/`.

Danh sách việc cho các phiên làm việc sau, xếp theo mức ảnh hưởng. Khi làm xong một mục: xoá dòng ở đây **và** dòng tương ứng trong file tính năng (quy tắc 5 trong `CLAUDE.md`). Chi tiết kỹ thuật nằm trong file tính năng được dẫn.

## Đề xuất làm tiếp
1. **Tìm đường cho quân (A\*)** — quân đang đi xuyên nước và đá. → [rendering.md](features/rendering.md), [controls.md](features/controls.md)
2. **AI tổ chức tấn công** — AI chỉ đánh khi gặp địch; `enemyMemory` đã ghi nhưng chưa dùng. → [ai-opponent.md](features/ai-opponent.md)
3. **Cân bằng nhịp game** — gỗ là nút thắt; chạy nhiều trận, đo thời điểm chiếm mỏ/giao tranh đầu tiên, chỉnh `STARTING_RESOURCES` và sản lượng mỏ. → [economy.md](features/economy.md), [resource-system.md](features/resource-system.md)

## Lối chơi
- [ ] Quân đi xuyên nước/đá (cần tìm đường). → [units.md](features/units.md)
- [ ] Chế độ AI: quân xanh nhắm được địch trong sương mù (không đối xứng). Cần quyết nút "Tấn công" làm gì khi chưa thấy địch. → [combat.md](features/combat.md), [fog-of-war.md](features/fog-of-war.md)
- [ ] AI chưa tổ chức tấn công; mở rộng chậm nếu trinh sát chết sớm; nhóm chiếm cờ và thợ xây bị rút khỏi đội hình. → [ai-opponent.md](features/ai-opponent.md)
- [ ] Vị trí vùng lãnh thổ không đối xứng giữa hai phe (đã có kiểm tra công bằng theo chi phí đi bộ, độ lệch ≤ 0,3; nhà vẫn ở hai dải trái/phải). → [territory.md](features/territory.md)
- [ ] **Chờ chốt (tài liệu 16/10, mục 8):** chiếm cờ địch thẳng hay về trung lập trước (đang: về trung lập); tiền đồn riêng hay nâng từ cờ (đang: riêng, giữ cờ); vùng lúa sinh lúa hay hỗ trợ nông trại (đang: mỏ lúa 30/phút); công thức chiếm 60/n^0,6, tối đa 10 quân, giữ tiến độ khi rời, trinh sát được tính. Đều là hằng số trong `main.ts`. → [territory.md](features/territory.md)
- [ ] **Chưa quyết thiết kế:** mỏ cạn dần hay vô hạn; có điều kiện thắng theo vùng không; thưởng lãnh thổ +10% (hiện: không). → [territory.md](features/territory.md)
- [ ] Không huỷ được công trình đang xây; quân từ nhà lính xuất hiện ở pháo đài; kéo được nông trại đang xây. → [buildings.md](features/buildings.md), [farms.md](features/farms.md)
- [ ] Thợ xây tiền đồn là "bất kỳ quân nào", chưa có loại quân thợ xây riêng. → [territory.md](features/territory.md)
- [ ] Không có giới hạn trần tài nguyên. → [economy.md](features/economy.md)

## Chơi với bạn bè (PvP)
- [ ] Log sự kiện chỉ hiện ở host. → [multiplayer.md](features/multiplayer.md)
- [ ] Không có "chơi lại" trong cùng phòng; bên nào cũng bỏ được tạm dừng của bên kia. → [match-flow.md](features/match-flow.md)
- [ ] Snapshot gửi toàn bộ `state` mỗi 0,18 giây (không nén, không delta). → [multiplayer.md](features/multiplayer.md)
- [ ] Phòng không mật khẩu; chưa giới hạn tần suất lệnh. → [multiplayer.md](features/multiplayer.md)
- [ ] Fog của host và guest có thể lệch → host từ chối chỗ đặt guest thấy hợp lệ. → [fog-of-war.md](features/fog-of-war.md)
- [ ] **Chưa kiểm thử:** 2 mạng khác nhau, nhiều trình duyệt, điện thoại. → [multiplayer.md](features/multiplayer.md)

## Giao diện & đồ hoạ
- [ ] 17 nút khiến bảng điều khiển phải cuộn; công trình và nhãn nhỏ ở zoom mặc định. → [hud-ui.md](features/hud-ui.md), [buildings.md](features/buildings.md)
- [ ] Chỉ lính giáo có sprite 4 hướng; công trình (trừ nông trại) chưa có sprite. → [units.md](features/units.md), [buildings.md](features/buildings.md)
- [ ] Văn bản hướng dẫn trong `index.html` viết cứng. → [hud-ui.md](features/hud-ui.md)
- [ ] Vùng nhấp chọn pháo đài không khớp kích thước logic; sương mù căn cứ xanh không cộng tầm nhìn pháo. → [fortress.md](features/fortress.md)
- [ ] Ở host/AI, nhóm chọn bằng khung phải dùng chuột phải để di chuyển. → [controls.md](features/controls.md)

## Dọn code & hiệu năng
- [ ] Code chết: `state.guards` (quái canh mỏ), biến `guiding`, `aiExploreTarget`. → [economy.md](features/economy.md), [controls.md](features/controls.md), [ai-opponent.md](features/ai-opponent.md)
- [ ] Bán kính tầm nhìn AI lệch `unitVisionRadius()` (giáo 120 vs 150, cung 105 vs 130). → [fog-of-war.md](features/fog-of-war.md)
- [ ] `nearestEnemy()` O(n²) mỗi frame. → [combat.md](features/combat.md)
- [ ] Kéo nông trại ở host/AI không qua `applyAction()`. → [farms.md](features/farms.md)

## Đã xong gần đây
**2026-10-17** (tài liệu "Tổng kết yêu cầu sửa game RTS 1vs1"): mỗi vùng một loại tài nguyên + vùng lúa, đủ 4 loại gần mỗi nhà, kiểm tra công bằng/tiếp cận khi sinh bản đồ, pháo đài không còn rơi vào đá; cột cờ có sẵn chiếm bằng số quân, tranh chấp, hạ cờ địch, tiền đồn giữ cờ; AI chiếm cờ bằng nhóm quân; viền lãnh thổ dày theo pixel; sương mù mép mềm; bỏ khoá 120 giây; nông trại 5 giây.

**2026-10-16**:
Hệ thống 4 tài nguyên, lúa duy trì, công trình, lãnh thổ (vùng bám địa hình, điểm chiếm, thợ xây, chiếm 10 giây, bật/tắt lớp), AI kinh tế; sửa lỗi: thế giới cố định 9600, guest vào lại phòng, quân kẹt hàng chờ, phím zoom, log trinh sát.
