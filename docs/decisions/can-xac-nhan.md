# Các điểm cần xác nhận

> Lập ngày 2026-10-20, cập nhật 2026-10-20 sau [quyết định chính thức](quyet-dinh-v3-1-2026-10-20.md) (đã chốt 1.2, 1.4, 2.2, 2.4, 2.5, 4.1, 5.1, 6.3 nên đã gỡ khỏi đây). Mỗi mục ghi **cách game đang chạy hiện tại**. Trả lời "giữ" hoặc ghi cách muốn đổi vào cột "Quyết định". Chốt xong mục nào thì cập nhật file tính năng tương ứng, chuyển sang bản ghi quyết định và xoá mục đó ở đây.

## 1. Phòng thủ cột cờ ([flag-defense.md](../features/flag-defense.md))

| # | Câu hỏi | Hiện tại | Quyết định |
|---|---|---|---|
| 1.1 | "Cờ bị tấn công" nghĩa là gì? Quyết định 2026-10-20 viết "khi địch **thực sự tấn công**", có thể hiểu là chỉ khi địch đánh nhau hoặc đang chiếm cờ | Có quân địch (kể cả trinh sát đi ngang) vào trong tầm 180 quanh cờ thì quân đồn trú xuất kích | |
| 1.3 | Sát thương lên cờ có chuyển cho quân đồn trú? | Đặc tả nhắc "cơ chế đã chốt trước đó", nhưng game chưa có (cờ không có máu). Quân ra ngay khi địch tới nên không bị đánh lúc ở trong | |
| 1.5 | Có cần cho từng quân hoặc từng loại rời cờ? | Chỉ có nút "Cho toàn bộ quân ra" | |

## 2. Sương mù V3.1 ([fog-of-war.md](../features/fog-of-war.md))

| # | Câu hỏi | Hiện tại | Quyết định |
|---|---|---|---|
| 2.1 | Pháo đài có tính là "công trình phe mình"? | Có: nhìn 350 (trước là 175) | |
| 2.3 | Chiếm cờ có mở cả vùng như trước? | Không: chỉ khám phá trong 450 quanh cờ | |

## 3. Hàng đợi huấn luyện ([economy.md](../features/economy.md))

| # | Câu hỏi | Hiện tại | Quyết định |
|---|---|---|---|
| 3.1 | Đặc tả đội hình và quyết định 2026-10-20 đều ghi "**6 hàng đợi huấn luyện**", yêu cầu "giữ nguyên". Game chưa bao giờ có đúng 6 | 4 hàng song song từ đầu, mua thêm hàng thứ 5, 6, 7, 8… (`TRAIN_LANES_START`, `QUEUE_LANE_UPGRADES`, theo V2). Có phải đổi thành 6 không, và 6 là số hàng song song hay tổng số chỗ? | |

## 4. AI ([ai-opponent.md](../features/ai-opponent.md))

| # | Câu hỏi | Hiện tại | Quyết định |
|---|---|---|---|
| 4.2 | Độ khó có cho AI thêm tài nguyên? | Không: chỉ đổi nhịp độ. "Dễ" vẫn gom được nhiều quân nếu không bị gây áp lực | |

## 6. Cân bằng: các số đang tạm ([economy.md](../features/economy.md), [buildings.md](../features/buildings.md))

| # | Câu hỏi | Hiện tại | Quyết định |
|---|---|---|---|
| 6.1 | Giá mở hàng đợi thứ 5 trở lên (`QUEUE_LANE_UPGRADES`) | Giá tạm theo đề xuất V2 | |
| 6.2 | 35 giây của tiền đồn: thời gian **xây**, hay thời gian **chiếm đất bằng tiền đồn**? | Đang dùng làm **thời gian xây** (35 giây, cần quân đứng cạnh). Đối chiếu: con số 35 không có trong V2. Nó đến từ tài liệu cân bằng V3.1 (`can_bang_game_v3_1.md`), bảng giá công trình, dòng "Tiền đồn — 150 gỗ, 80 đá — *Chiếm đất 35 giây*" (dòng ngay trên là "Tháp phòng thủ — *Xây 30 giây*"). Trước V3.1, tiền đồn **xây 40 giây** (chốt 17/10, [quyet-dinh-muc-8.txt](quyet-dinh-muc-8.txt)); V2 không đổi tiền đồn. Chưa sửa gì | |

## 7. Âm thanh ([audio.md](../features/audio.md))

| # | Trạng thái | Việc còn lại |
|---|---|---|
| 7.1 | **Giữ tạm để thử nghiệm** (2026-10-20), chưa duyệt chất lượng | Nghe trực tiếp nhạc nền, 8 tiếng sự kiện và 17 tiếng tự tạo thêm ngày 2026-10-21 (đánh nhau theo loại quân, cờ bắn, đội hình, đồn trú, xuất kích, nâng cấp, cạn lúa, địch xâm nhập — [audio.md](../features/audio.md)), quyết định giữ hay sửa trước bản phát hành |

## 8. Thiết kế còn bỏ ngỏ ([backlog.md](../backlog.md))

| # | Câu hỏi | Hiện tại | Quyết định |
|---|---|---|---|
| 8.1 | Mỏ cạn dần hay vô hạn? | Vô hạn | |
| 8.2 | Có điều kiện thắng theo số vùng? | Không, chỉ thắng khi phá pháo đài | |
| 8.3 | Có thưởng lãnh thổ +10%? | Không | |

## 9. Hang quái trung lập ([neutral-camps.md](../features/neutral-camps.md))

Người phát triển yêu cầu làm bản 1–3 ngày 2026-10-22 mà chưa chọn các phương án; game đang chạy theo cột "Hiện tại".

| # | Câu hỏi | Hiện tại | Quyết định |
|---|---|---|---|
| 9.1 | Phần thưởng kiểu nào? | Hai: tài nguyên tức thì (mọi hang), buff (Lăng cổ). Mở khoá cờ (đồn canh cờ) đã bỏ ngày 2026-10-23 theo người phát triển. Không có lính đánh thuê | |
| 9.2 | Hang cố định theo bản đồ hay ngẫu nhiên? | Sinh ngẫu nhiên mỗi trận, theo cặp đối xứng quãng đường đi bộ | |
| 9.3 | Thưởng cho ai? | Phe gây nhiều sát thương nhất cho hang | |
| 9.4 | Hồi sinh? | Có: 180–300 s tuỳ hang, không khi có quân trong dây xích | |
| 9.5 | Số liệu quái, thưởng, giờ mở lăng, buff | Số tạm trong `config/creeps.ts` | |
