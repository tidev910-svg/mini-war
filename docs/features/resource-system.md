# Hệ thống 4 tài nguyên & lãnh thổ

> Trạng thái: Đang có — đủ 6 giai đoạn · Cập nhật lần cuối: 2026-10-17

Nguồn: tài liệu thiết kế "Thiết kế hệ thống tài nguyên – game RTS 1vs1" (thảo luận ngày 15/10/2026). Khi triển khai, tính năng này sẽ **thay** phần kinh tế trong [economy.md](economy.md) và đổi giá trong [units.md](units.md), [farms.md](farms.md), [fortress.md](fortress.md). Mọi con số dưới đây là **thông số thử nghiệm**, chưa phải số chính thức.

## Mô tả
Thay 2 tài nguyên hiện tại (vàng, năng lượng) bằng 4 tài nguyên: **lúa, gỗ, đá, vàng**.
- Nông trại sinh **lúa**; lúa dùng để tuyển quân và **duy trì** quân theo thời gian. Quân càng đông càng tốn lúa.
- Mỏ **gỗ, đá, vàng** tự cộng tài nguyên khi đã chiếm, không cần dân khai thác.
- Người chơi xây **cột cờ** để chiếm vùng, nâng thành **tiền đồn** để giữ. Mất công trình kiểm soát thì vùng về trung lập.

Vòng lặp: gỗ → nông trại → lúa → tuyển & nuôi quân → chiếm mỏ/vùng → gỗ/đá/vàng → đá giữ đất, vàng nâng sức mạnh quân → tranh tiếp lãnh thổ.

Nhịp trận mục tiêu (không khoá cứng theo phút):
| Giai đoạn | Mục tiêu |
|---|---|
| 0–5 phút | Xây nông trại, tích lúa, trinh sát; khoảng 4–6 nông trại vào phút 5 |
| 5–10 phút | Tuyển lực lượng đầu tiên, xây cột cờ, chiếm mỏ |
| Sau 10 phút | Tranh mỏ, giữ lãnh thổ, chiến tranh tiêu hao |

## Luật & thông số
**Vai trò tài nguyên**
| Tài nguyên | Nguồn | Dùng cho |
|---|---|---|
| Lúa | Nông trại | Tuyển quân (một lần) + duy trì quân (liên tục) |
| Gỗ | Mỏ gỗ | Nông trại, cột cờ, nhà lính, công trình cơ bản |
| Đá | Mỏ đá | Tiền đồn, tháp, công trình phòng thủ |
| Vàng | Mỏ vàng | Quân cao cấp, nâng cấp sức mạnh |
Không cho đổi trực tiếp 1:1 giữa các tài nguyên.

**Sản lượng** (theo phút; code tính theo giây → chia 60)
| Nguồn | /phút | ≈ /giây |
|---|---:|---:|
| Nông trại cấp 1 / 2 / 3 | 20 / 30 / 45 lúa | 0,33 / 0,5 / 0,75 |
| Mỏ gỗ thường | 30 gỗ | 0,5 |
| Mỏ đá thường | 20 đá | 0,33 |
| Mỏ vàng thường | 15 vàng | 0,25 |
| Mỏ giàu | Đã bỏ (2026-10-18): mọi vùng cùng loại cùng sản lượng, xem [economy.md](economy.md) | |

**Chi phí công trình**
| Công trình | Gỗ | Đá | Vàng |
|---|---:|---:|---:|
| Nông trại | 100 | 0 | 0 |
| Nhà lính bộ | 150 | 50 | 0 |
| Nhà lính cung | 150 | 0 | 50 |
| Chuồng ngựa | 200 | 100 | 100 |
| Cột cờ chiếm đất | 100 | 0 | 0 |
| Nâng cấp tiền đồn | 200 | 100 | 0 |
| Tháp phòng thủ | 100 | 200 | 50 |

**Tuyển & duy trì quân**
| Quân | Lúa tuyển | Gỗ | Vàng | Lúa duy trì/phút |
|---|---:|---:|---:|---:|
| Trinh sát | 30 | 0 | 0 | 0,5 |
| Lính bộ | 40 | 0 | 10 | 1 |
| Lính giáo | 45 | 20 | 0 | 1 |
| Lính cung | 55 | 30 | 10 | 1,5 |
| Lính kỵ | 80 | 0 | 50 | 3 |

```text
Lúa ròng/phút = Σ sản lượng nông trại − Σ (số quân từng loại × duy trì của loại đó)
```
Ví dụ: 6 nông trại cấp 1 = 120; quân 2 trinh sát, 12 bộ, 8 giáo, 6 cung, 4 kỵ tốn 42 → ròng +78 lúa/phút.

**Thiếu tiếp tế**
1. Quân tiêu thụ lúa liên tục, kể cả khi đứng yên.
2. Kho lúa không đủ trả duy trì → cảnh báo "thiếu tiếp tế".
3. Ân hạn 30 giây.
4. Hết ân hạn: −15% tốc độ di chuyển, −10% tốc độ tấn công.
5. Gỡ hiệu ứng khi lúa ròng đủ trả duy trì (cần ngưỡng/độ trễ để tránh bật tắt liên tục).

**Lãnh thổ**
- Khoảng 20 vùng tự nhiên (ví dụ 7 vàng, 6 đá, 7 gỗ); vùng giàu đặt ở nơi dễ tranh chấp, có mỏ gần căn cứ cho đầu trận.
- Một mỏ chỉ sinh thu nhập **một lần**, không nhân đôi khi vừa thuộc vùng vừa được chiếm.
- Thưởng lãnh thổ (nếu có) áp lên sản lượng tự động.

## Quyết định đã chốt (2026-10-16)
| # | Vấn đề | Quyết định |
|---|---|---|
| 1 | Mỏ và cột cờ | **Phương án B**: xây xong cột cờ trong vùng → mọi mỏ trong vùng sinh tài nguyên cho phe đó; cột cờ/tiền đồn bị phá → vùng về trung lập, ngừng thu. Bỏ luật chiếm mỏ bằng số quân đứng gần. |
| 2 | Chống kẹt đầu trận | **Kho khởi đầu + vùng gỗ gần nhà**: 400 gỗ, 150 lúa, 50 đá, 50 vàng; mỗi phe có 1 vùng gỗ gần căn cứ dễ chiếm. |
| 3 | Lính bộ cần vàng, nhà lính bộ cần đá | Giữ giá thiết kế; kho khởi đầu (50 đá, 50 vàng) đủ xây nhà lính bộ đầu tiên và tuyển vài lính bộ. |
| 4 | Nhà lính | ~~Bắt buộc~~ **Đã bỏ cả 3 nhà lính** (2026-10-17, "Yêu cầu sửa game RTS 1vs1 — 17/10/2026"); mọi quân tuyển tại pháo đài. Trước đó: **bắt buộc, trừ trinh sát và lính giáo** (tuyển tại pháo đài). Nhà lính bộ → lính bộ; nhà lính cung → cung thủ; chuồng ngựa → kỵ binh. |
| 5 | Năng lượng | **Bỏ hẳn**. Bỏ luôn mỏ "đặc biệt" (thưởng năng lượng). |
| 6 | Tháp & pháo pháo đài | **Giữ 2 pháo tích hợp**; mở pháo thứ hai trả **100 đá** thay cho 100 vàng. Tháp phòng thủ là công trình riêng, chỉ đặt trong vùng của mình. |
| 7 | Khoá xuất quân 120 giây | ~~Giữ nguyên.~~ **Bỏ hẳn** (2026-10-17, tài liệu "Tổng kết yêu cầu sửa game" 16/10). |
| 8 | Thời gian xây | **Có**: nông trại 20s (đổi thành 5s rồi **3s** ngày 2026-10-17), cột cờ 15s, nâng tiền đồn 30s, nhà lính/chuồng ngựa 30s, tháp 25s. Công trình đang xây có máu và có thể bị phá. |
| 8b | Cấp nông trại | **Có**: cấp 2 = 80 gỗ + 40 đá (30 lúa/phút), cấp 3 = 120 gỗ + 80 đá (45 lúa/phút). |
| 9 | Duy trì khi đứng yên | **Có**, quân luôn tiêu lúa. |

Còn để ngỏ (chốt khi chạy thử): máu từng công trình, bán kính/vị trí vùng, sản lượng mỏ giàu, thưởng lãnh thổ (mặc định: không có). Ngưỡng gỡ thiếu tiếp tế đã chốt khi làm giai đoạn 2: lúa ròng ≥ 0.

**Thay đổi 2026-10-17** (tài liệu "Tổng kết yêu cầu sửa game RTS 1vs1", 16/10/2026; chi tiết và các quyết định tạm ở [territory.md](territory.md)):
- Mỗi vùng có đúng một loại tài nguyên và thêm **vùng lúa** (mỏ lúa). Gần mỗi nhà có đủ 4 loại vùng; bỏ mỏ phụ.
- Cột cờ **có sẵn** ở mỗi vùng, chiếm bằng số quân đứng trong vòng cờ; không còn xây cột cờ (thay quyết định #1: chủ vùng do chiếm cờ, không do công trình).
- Tiền đồn là công trình riêng đặt cạnh cờ đã chiếm; còn tiền đồn thì đối phương không chiếm được cờ.
- Bỏ khoá 120 giây (#7); nông trại xây 5 giây (#8); viền lãnh thổ dày hơn; sương mù có mép mềm.

## Kế hoạch triển khai
Mỗi giai đoạn để game chơi được, chạy thử ở cả chế độ AI và PvP, và cập nhật tài liệu trước khi sang giai đoạn sau.
1. ✅ **Tài nguyên & nông trại** (xong 2026-10-16, chi tiết ở [economy.md](economy.md)): đổi sang 4 tài nguyên (bỏ năng lượng, bỏ thu nhập nền), kho khởi đầu, nông trại trả gỗ và sinh lúa, giá quân mới, HUD 4 tài nguyên. Mỏ: 2 mỏ gỗ gần nhà + mỏ vàng giàu ở giữa + 1 mỏ đá + 1 mỏ gỗ ngẫu nhiên, vẫn chiếm bằng số quân. Pháo thứ hai trả 100 đá. AI tối thiểu: tự xây nông trại.
   - 2026-10-17: đề xuất cân bằng v1 **thêm lại thu nhập nền** ở pháo đài (25 lúa, 20 gỗ, 8 đá, 8 vàng/phút), bỏ mỏ vùng nhà, mỏ lúa 25 và mỏ vàng 20/phút, giá quân mới, hàng đợi huấn luyện. Số hiện hành xem [economy.md](economy.md) và [units.md](units.md); các bảng bên dưới là thiết kế cũ.
2. ✅ **Duy trì lúa & thiếu tiếp tế** (xong 2026-10-16, chi tiết ở [economy.md](economy.md)): trừ lúa theo giây, cảnh báo, ân hạn 30s, hệ số −15% di chuyển / −10% tốc độ đánh, HUD sản xuất/tiêu thụ/ròng.
3. ✅ **Hệ thống công trình chung** (xong 2026-10-16, [buildings.md](buildings.md)): đặt (dùng lại cách đặt nông trại), thời gian xây, máu, bị phá; chuyển nông trại sang hệ thống này, thêm nâng cấp nông trại.
4. ✅ **Vùng lãnh thổ & cột cờ/tiền đồn** (xong 2026-10-16, [territory.md](territory.md)): sinh vùng từ `forestRegions`/`rockRegions`/`resources`, mỏ thuộc vùng, cột cờ chiếm vùng, tiền đồn, vẽ ranh giới vùng.
5. ✅ **Nhà lính, chuồng ngựa, tháp phòng thủ** (xong 2026-10-16, [buildings.md](buildings.md)): khoá tuyển quân theo nhà lính; tháp bắn như pháo pháo đài; pháo thứ hai trả đá.
6. ✅ **AI** (xong 2026-10-16, [ai-opponent.md](ai-opponent.md)): xây nông trại, cột cờ, nhà lính; quản lý lúa; ưu tiên tranh vùng.

## Code liên quan
Đã triển khai đủ. Code nằm ở: [economy.md](economy.md) (tài nguyên, lúa duy trì, thiếu tiếp tế), [buildings.md](buildings.md) (công trình, nâng cấp, nhà lính, tháp), [territory.md](territory.md) (vùng, cột cờ, mỏ), [ai-opponent.md](ai-opponent.md) (`runEnemyAI()`), [hud-ui.md](hud-ui.md) (HUD).

Khác với thiết kế khi triển khai: khu đất nhà 14 ô được khám phá sẵn và tính là lãnh thổ (không có thì gần như không có chỗ xây cạnh pháo đài); công trình không được đè sân tập kết; vùng không đặt được mỏ bị bỏ.

## Tương tác
- [economy.md](economy.md): bị thay thế gần như toàn bộ.
- [units.md](units.md): giá quân, thêm chi phí duy trì; AI mua quân.
- [farms.md](farms.md): giá theo gỗ, sinh lúa, cấp nông trại.
- [fortress.md](fortress.md): giá nâng cấp pháo, quan hệ với tháp mới.
- [combat.md](combat.md): hệ số phạt khi thiếu tiếp tế.
- [ai-opponent.md](ai-opponent.md): AI phải xây nông trại, cột cờ, quản lý lúa.
- [fog-of-war.md](fog-of-war.md): đặt cột cờ/công trình trên vùng đã khám phá.
- [hud-ui.md](hud-ui.md): hiển thị như ví dụ dưới.
- [multiplayer.md](multiplayer.md): action mới (xây công trình, nâng cấp), dữ liệu mới trong snapshot.

HUD đề xuất (số minh hoạ):
```text
Lúa: 850    +120/phút    −95/phút    Ròng: +25/phút
Gỗ: 420     +60/phút
Đá: 180     +20/phút
Vàng: 210   +15/phút
Mỏ đang sở hữu: 5    Mỏ bị tranh chấp: 1
Trạng thái tiếp tế: Bình thường
```

## Multiplayer
Chưa thiết kế chi tiết. Nguyên tắc: mọi lệnh xây/nâng cấp/chiếm đi qua `requestAction()` → `applyAction()`; host tính sản lượng, duy trì và thiếu tiếp tế; guest nhận qua snapshot.

## Kiểm thử thủ công
Chạy nhiều trận thử (AI và PvP) và đo:
- [ ] Thời điểm chiếm mỏ đầu tiên, giao tranh đầu tiên, độ dài trận.
- [ ] Số nông trại ở phút 5 (mục tiêu 4–6).
- [ ] Có bị kẹt đầu trận khi chưa chiếm mỏ không.
- [ ] Tần suất và thời lượng thiếu tiếp tế; hiệu ứng có bật tắt liên tục không.
- [ ] Tỷ lệ thắng; người dẫn trước có "lăn cầu tuyết" không thể cản không.

## Giới hạn / việc tồn đọng
**Rủi ro cân bằng** (từ thiết kế)
| Rủi ro | Hướng xử lý |
|---|---|
| Dẫn trước chiếm nhiều mỏ, không thể cản | Cho cướp/phá công trình kiểm soát; mỏ giàu ở nơi dễ tranh chấp |
| Tích quân quá đông | Duy trì lúa theo từng loại quân |
| Kỵ binh áp đảo | Giá vàng và lúa cao; lính giáo khắc chế |
| Chỉ xây nông trại là thắng | Xây, giữ đất, quân mạnh vẫn cần gỗ, đá, vàng |
| Tiền đồn quá mạnh | Giới hạn vị trí/công suất; cân nhắc đơn vị công thành |
| Không hiểu vì sao hết lúa | HUD hiện sản xuất, tiêu thụ, lúa ròng/phút |
| Mất mỏ đầu trận, bế tắc | Nguồn thu tối thiểu gần căn cứ hoặc tài nguyên khởi đầu hợp lý |
