# MINI WAR — TÀI LIỆU DỰ ÁN GAME

**Phiên bản tài liệu:** 1.0  
**Ngày lập:** 12/10/2026  
**Nguồn đối chiếu:** `MiniWar_ThemKyBinh.html` — bản HTML độc lập đang dùng làm nền phát triển  
**Trạng thái:** Tài liệu mô tả hiện trạng mã nguồn; các tính năng mạng cần được kiểm thử thực tế trước khi xem là ổn định.

> **Quy ước đọc tài liệu**  
> “Đang có trong mã nguồn” nghĩa là có thể xác định từ file đang đối chiếu. “Cần kiểm thử” nghĩa là code có phần triển khai nhưng chưa có bằng chứng kiểm thử đầy đủ trên nhiều trình duyệt/thiết bị. “Đề xuất” là hướng phát triển, chưa phải tính năng đã hoàn thành.

## 1. Tóm tắt dự án

Mini War là game chiến thuật thời gian thực (RTS) chạy trực tiếp trong trình duyệt. Người chơi quản lý vàng và năng lượng, tạo quân, chiếm mỏ tài nguyên, xây công trình phòng thủ và tìm cách phá hủy căn cứ đối phương. Game có góc nhìn từ trên xuống, bản đồ lớn hơn vùng hiển thị, sương mù chiến tranh, chiến đấu tự động khi quân ở gần mục tiêu và điều khiển nhóm quân bằng chuột.

Bản hiện tại có hai lựa chọn trên màn hình đầu: **Chơi với AI** và **Solo với bạn bè**. Chế độ AI là trải nghiệm chơi một người. Chế độ bạn bè sử dụng PeerJS để tạo phòng bằng mã/link và trao đổi lệnh/trạng thái giữa chủ phòng và người tham gia; cần kiểm thử đầy đủ kết nối, đồng bộ, ngắt mạng và xử lý trận đấu trước khi coi đây là multiplayer ổn định.

### Mục tiêu thiết kế
- Dễ mở và chơi: một file HTML chứa giao diện, CSS, logic JavaScript và phần vẽ Canvas.
- Nhịp trận đấu dựa trên tích lũy tài nguyên, khám phá, chiếm mỏ, xây dựng và tiến công.
- Đội quân đa dạng, vai trò khác nhau; người chơi phải phối hợp thay vì chỉ dùng một loại quân.
- Sương mù giữ lại yếu tố trinh sát: địa hình từng khám phá vẫn được ghi nhớ, nhưng đơn vị/công trình địch phải ở vùng nhìn hiện tại mới được hiển thị theo logic vẽ.
- Các tính năng cần thêm hoặc sửa phải tránh làm hỏng những cơ chế đã có.

## 2. Thể loại, góc nhìn và cấu trúc trận đấu

| Thuộc tính | Mô tả hiện tại |
|---|---|
| Thể loại | RTS / chiến thuật thời gian thực |
| Góc nhìn | Từ trên xuống, 2D |
| Nền tảng | Trình duyệt desktop và màn hình nhỏ; giao diện co giãn theo kích thước màn hình |
| Công nghệ chính | HTML, CSS, JavaScript thuần, Canvas 2D |
| Đơn vị bản đồ | Tọa độ thế giới ảo được vẽ vào vùng Canvas |
| Canvas hiển thị cơ sở | 960 × 540 pixel; thế giới game khai báo rộng 10 lần và cao 6 lần kích thước Canvas (9600 × 3240 đơn vị thế giới) |
| Phe | Xanh (team 0) và đỏ (team 1) |
| Điều kiện thắng | Phá hủy căn cứ chính đối phương |
| Điều kiện thua | Căn cứ chính của phe mình bị phá hủy |
| Thời điểm mở rộng giao tranh | Sau 120 giây; trong giai đoạn đầu chỉ trinh sát được phép rời khu vực căn cứ |

Mỗi trận tạo vị trí căn cứ và vị trí mỏ ngẫu nhiên. Bản đồ không dùng một con đường trung tâm cố định; địa hình trang trí bằng cây, bụi cỏ và đá. Người chơi dùng zoom và kéo camera để quan sát chiến trường.

## 3. Vòng lặp gameplay chính

1. **Khởi đầu:** mỗi phe có 150 vàng và 100 năng lượng; căn cứ có 1000 HP. Tháp phòng thủ khởi đầu được đặt cạnh căn cứ theo dữ liệu khởi tạo.
2. **Tạo quân:** mua trinh sát, lính thường, cung thủ, xe tăng hoặc kỵ binh theo chi phí.
3. **Trinh sát:** đưa quân đi mở vùng nhìn mới; mỏ chưa khám phá bị che bởi sương mù.
4. **Khai thác tài nguyên:** chiếm mỏ bằng ưu thế số quân trong vùng kiểm soát; xây nông trại để tăng thu nhập vàng.
5. **Phòng thủ và điều quân:** xây tối đa hai tháp canh mỗi phe, di chuyển công trình có thể kéo, và ra lệnh cho đội hình đi tới khu vực mục tiêu.
6. **Giao chiến:** quân tự đánh mục tiêu hợp lệ trong tầm; cung thủ bắn đạn bay, các loại quân còn lại gây sát thương cận chiến/đánh trực tiếp theo logic hiện tại.
7. **Kết thúc:** khi căn cứ chính bị phá hủy, game hiện màn hình kết quả.

## 4. Kinh tế và tài nguyên

### 4.1 Tài nguyên ban đầu và thu nhập nền

| Hạng mục | Giá trị trong mã nguồn |
|---|---:|
| Vàng ban đầu mỗi phe | 150 |
| Năng lượng ban đầu mỗi phe | 100 |
| Thu nhập vàng nền | +8 vàng/giây |
| Thu nhập năng lượng nền | +5 năng lượng/giây |
| Thu nhập mỗi nông trại còn sống | +2 vàng/giây |
| Thời gian chuẩn bị | 120 giây |

Thu nhập nền được áp dụng cho cả hai phe. Mỗi giây mô phỏng, game cộng vàng và năng lượng nền, cộng thêm vàng từ các nông trại còn sống và thu nhập mỏ mà phe đang kiểm soát.

### 4.2 Nông trại

| Thuộc tính | Giá trị |
|---|---|
| Chi phí | 80 vàng |
| Sản lượng | +2 vàng/giây |
| HP | 180 |
| Số lượng tối đa | Không giới hạn theo logic mua/xây |
| Thời gian hoàn vốn đơn giản | 40 giây, không tính thời gian bị phá hủy hoặc các yếu tố khác |

**Quy tắc đặt nông trại trong mã nguồn:**
- Nông trại có dấu chân hình chữ nhật khoảng 62 × 68 đơn vị thế giới.
- Không được chồng lên nông trại khác, căn cứ, tháp canh hoặc đơn vị còn sống.
- Toàn bộ vùng đặt (được kiểm tra bằng nhiều điểm lấy mẫu) phải thuộc khu vực đã khám phá bởi phe đó.
- Nút xây nông trại sẽ tự tìm vị trí trống gần căn cứ; nếu không tìm được vị trí hợp lệ, game báo cần mở sương mù/dọn chỗ trống và không trừ vàng.
- Có thể kéo nông trại của phe mình để di chuyển; vị trí di chuyển phải hợp lệ theo cùng quy tắc sương mù và va chạm.
- Nông trại có HP và có thể bị phe đối phương tấn công theo logic mục tiêu hiện tại.

### 4.3 Tháp canh

| Thuộc tính | Giá trị |
|---|---|
| Chi phí xây | 100 vàng |
| HP | 230 |
| Giới hạn | Tối đa 2 tháp đang còn sống mỗi phe |
| Tầm bắn được dùng trong AI giao tranh | 190 đơn vị thế giới |
| Khoảng cách xây tối đa tới căn cứ | 200 đơn vị thế giới |
| Sát thương mỗi phát | 17 |
| Chu kỳ bắn | Khoảng 1 giây khi có mục tiêu hợp lệ |

Tháp canh tự tìm và bắn đơn vị đối thủ đủ điều kiện nhìn thấy trong tầm. Tháp có thể được kéo để di chuyển, nhưng vị trí mới bị giới hạn trong phạm vi 200 đơn vị từ căn cứ và không được chồng lên căn cứ, quân, nông trại hay tháp khác. Logic phủ sương cần phân biệt **vùng nhìn hiện tại để phát hiện mục tiêu** với **khám phá lâu dài trên bản đồ**; phần vẽ vùng sương đang được quản lý riêng khỏi vùng hiển thị công trình.

### 4.4 Mỏ tài nguyên

Mỗi trận tạo ba mỏ: một mỏ thường, một mỏ giàu nằm gần trung tâm và một mỏ đặc biệt. Vị trí thay đổi ngẫu nhiên trong các giới hạn bản đồ, đồng thời thuật toán cố tránh căn cứ và giữ khoảng cách giữa các mỏ.

| Loại mỏ | Thu nhập vàng | Thưởng đặc biệt |
|---|---:|---|
| Mỏ thường | +3 vàng/giây | Không |
| Mỏ giàu | +5 vàng/giây | Không |
| Mỏ đặc biệt | +3 vàng/giây | +25 năng lượng sau 30 giây kiểm soát liên tục |

**Luật chiếm mỏ:**
- Các đơn vị sống trong bán kính 58 đơn vị quanh mỏ được đếm theo phe.
- Phe có số quân nhiều hơn kiểm soát mỏ và nhận thu nhập tương ứng.
- Nếu hai phe bằng quân hoặc không có quân, mỏ không phát sinh thu nhập trong khoảng thời gian đó; bộ đếm trống tăng lên.
- Nếu không có bên kiểm soát rõ ràng trong 5 giây, chủ sở hữu mỏ được đặt lại thành trung lập.
- Khi đổi chủ, bộ đếm kiểm soát liên tục và trạng thái thưởng của mỏ đặc biệt được đặt lại.
- Khi phe giữ mỏ đặc biệt đủ 30 giây liên tục, phe đó nhận +25 năng lượng một lần trong chu kỳ kiểm soát hiện tại.

**Khám phá mỏ và sương mù:** mỏ chỉ bị ẩn khi tọa độ của nó chưa từng được khám phá bởi phe người chơi hiện tại. Khi khu vực đã được khám phá, mỏ vẫn hiển thị trên địa hình đã được ghi nhớ, kể cả khi quân rời khỏi đó. Điều này không đồng nghĩa với việc quân địch cũng được hiển thị vĩnh viễn.

## 5. Danh sách đơn vị

Thông số dưới đây lấy từ đối tượng `specs` trong file nguồn. `Tầm đánh`, `tốc độ` và `cooldown` là đơn vị nội bộ của mô phỏng; không nên hiểu trực tiếp là pixel/giây hay giây thực tế nếu chưa kiểm thử thời gian mô phỏng.

| Đơn vị | HP | Sát thương | Tầm đánh | Tốc độ | Hồi đánh | Giá vàng | Năng lượng |
|---|---:|---:|---:|---:|---:|---:|---:|
| Trinh sát | 60 | 5 | 18 | 72 | 1,1 | 40 | 0 |
| Lính thường | 100 | 13 | 22 | 45 | 0,8 | 50 | 0 |
| Cung thủ | 65 | 10 | 125 | 34 | 1,05 | 75 | 15 |
| Xe tăng | 270 | 29 | 30 | 25 | 1,2 | 125 | 35 |
| Kỵ binh | 210 | 24 | 27 | 58 | 0,9 | 250 | 70 |

### 5.1 Vai trò chiến thuật dự kiến từ bộ thông số
- **Trinh sát:** rẻ, nhanh nhất; dùng mở sương mù, đi trước giai đoạn chuẩn bị và chiếm mỏ.
- **Lính thường:** bộ binh cơ bản, cân bằng chi phí và sức chiến đấu.
- **Cung thủ:** tầm đánh xa nhất trong danh sách; HP thấp và tốc độ chậm hơn lính thường.
- **Xe tăng:** HP và sát thương cao, nhưng tốc độ chậm; tốn cả vàng lẫn năng lượng.
- **Kỵ binh:** nhanh hơn lính thường và xe tăng, có HP/sát thương khá cao, nhưng chi phí cao nhất hiện tại.

### 5.2 Quy tắc huấn luyện
- Mỗi phe có tối đa 2 trinh sát còn sống cùng lúc.
- Trong 120 giây đầu, chỉ trinh sát được phép rời khu vực căn cứ; các loại quân khác bị giữ trong khu vực chuẩn bị.
- Mỗi lần mua quân phải đủ cả vàng và năng lượng theo thông số loại quân.
- Quân được tạo ở khu vực cạnh căn cứ theo đội hình nhiều hàng/cột và thuật toán tìm chỗ trống để hạn chế chồng lấp.

## 6. Căn cứ, chiến đấu và điều kiện kết thúc

### 6.1 Căn cứ chính
- Mỗi phe có một căn cứ, HP tối đa 1000.
- Căn cứ được đặt ngẫu nhiên ở hai phía đối diện theo trục ngang; vị trí dọc cũng thay đổi.
- Căn cứ của phe mình luôn được hiển thị; căn cứ địch tuân theo quy tắc vùng nhìn hiện tại trong phần vẽ.
- Phá hủy căn cứ chính đối thủ là điều kiện chiến thắng.

### 6.2 Chiến đấu
- Đơn vị tự tìm mục tiêu địch gần nhất hợp lệ theo logic tầm nhìn, đội và thứ tự ưu tiên hiện tại.
- Cung thủ tạo đạn bay về phía mục tiêu; các quân còn lại gây sát thương trực tiếp khi ở trong tầm.
- Tháp canh tự bắn mục tiêu trong tầm, với bộ đếm hồi bắn.
- Các đơn vị và công trình có HP; HP bar hiển thị tình trạng còn lại.
- Căn cứ, tháp, nông trại là những mục tiêu quan trọng. Logic chọn mục tiêu chi tiết có thể được tinh chỉnh khi cân bằng gameplay.

## 7. AI ở chế độ chơi một người

AI chỉ hoạt động khi `mode === 'ai'`. Logic hiện tại có những hành vi chính sau:
- Theo chu kỳ khoảng 5 giây, kiểm tra tài nguyên và quyết định sản xuất quân/tháp.
- Ưu tiên duy trì tối đa 2 trinh sát AI để khám phá và tranh chấp mỏ.
- Nếu đủ tài nguyên, có xác suất tạo kỵ binh, xe tăng hoặc cung thủ; nếu không chọn các loại đó thì có thể tạo lính thường.
- Có xác suất xây tháp, giới hạn hai tháp cho phe AI.
- Các đơn vị AI chưa có mục tiêu hợp lệ có thể hướng tới mỏ chưa thuộc quyền mình hoặc chọn khu vực chưa khám phá để thăm dò.
- AI có bản đồ sương mù riêng (`enemyFogSeen`) và lưu trí nhớ về vị trí đơn vị/căn cứ mà nó từng nhìn thấy. Mục tiêu ghi nhớ đơn vị có thời hạn dưới 90 giây theo logic hiện tại.
- Mục tiêu/nhận diện quân địch phụ thuộc vào vị trí ở vùng nhìn của AI, thay vì mặc định luôn biết mọi vị trí trên bản đồ.

**Mức độ thông minh:** đây là AI chiến thuật cơ bản, dựa trên luật và xác suất. Chưa có hệ thống lập kế hoạch dài hạn, học chiến thuật, phân đội phức tạp hay tùy chọn độ khó nhiều cấp.

## 8. Sương mù chiến tranh và tầm nhìn

- Bản đồ dùng một lưới khám phá 360 × 204 ô cho mỗi phe.
- Vùng nhìn của đơn vị được tính theo loại quân: trinh sát khoảng 145; xe tăng 150; cung thủ 130; các đơn vị khác khoảng 105 đơn vị thế giới trong phần khám phá/nhận diện tương ứng.
- Căn cứ tạo vùng nhìn quanh mình với bán kính khoảng 175 đơn vị.
- Hai bản đồ khám phá được tách riêng cho người chơi và AI.
- Địa hình từng khám phá vẫn được giữ lại (vùng đã khám phá có lớp tối nhẹ); vùng chưa khám phá bị phủ lớp sương tối.
- Mỏ vàng đã phát hiện tiếp tục hiện trong vùng địa hình đã khám phá.
- Đơn vị địch, tháp địch và căn cứ địch được vẽ có điều kiện theo vùng nhìn hiện tại, thay vì ghi nhớ chúng vô thời hạn.
- Trong tài liệu sản phẩm, “đã khám phá” và “đang nhìn thấy” phải là hai trạng thái khác nhau, không được gộp thành một.

## 9. Đội hình, chọn quân và điều khiển

### 9.1 Điều khiển bằng chuột
- Nhấp trái lên quân của mình: chọn đơn vị.
- Giữ Shift và nhấp lên quân: thêm/bỏ đơn vị khỏi nhóm chọn.
- Kéo chuột trái trên vùng trống: tạo khung chọn nhiều đơn vị.
- Nhấp chuột phải vào điểm đến (không kéo): ra lệnh di chuyển cho nhóm đang chọn.
- Giữ chuột phải và kéo: kéo camera/bản đồ; hành vi click chuột phải được phân biệt với thao tác kéo.
- Nhấp giữa chuột và kéo: kéo camera.
- Lăn con lăn chuột: phóng to/thu nhỏ; mức zoom được giới hạn để tránh quá xa/quá gần.
- Kéo tháp canh hoặc nông trại của mình: di chuyển công trình nếu điểm mới hợp lệ.

### 9.2 Phím tắt
- `A`: ra lệnh tấn công cho các đơn vị đang chọn.
- `Space`: tạm dừng/tiếp tục trận đấu.
- Các phím mũi tên: dịch chuyển camera.
- `+` / `=` và `-` / `_`: điều chỉnh zoom theo logic bàn phím hiện tại.

### 9.3 Dàn đội hình khi di chuyển
Khi chọn nhiều quân và ra lệnh tới một điểm, mã nguồn tạo slot đội hình dạng lưới gần vuông thay vì đặt tất cả vào cùng tọa độ. Khoảng cách mục tiêu giữa các slot là 34 đơn vị thế giới. Trước khi gán slot, tâm đội hình được điều chỉnh khi gần biên bản đồ để hạn chế các đơn vị bị dồn vào cùng một ranh giới. Đây là vị trí đích; đường di chuyển thực tế vẫn phụ thuộc vào va chạm/mục tiêu và quá trình cập nhật mô phỏng.

## 10. Giao diện và phong cách đồ họa

- Giao diện kiểu command-center màu xanh đậm; màu vàng biểu diễn vàng, xanh ngọc/lam biểu diễn năng lượng và xanh/đỏ biểu diễn hai phe.
- Đồ họa chiến trường được vẽ thủ công bằng Canvas 2D và các primitive (đường, hình, ellipse, path, text), không phụ thuộc sprite sheet bên ngoài.
- Phong cách hướng tới hoạt hình 2D hiện đại: nền cỏ sáng, cây/bụi/đá làm landmark, căn cứ nhiều lớp màu, quân có silhouette và bảng màu phe.
- Các hàm vẽ chính gồm `drawBase`, `drawUnit`, `drawTree`, `drawRock`, `drawTurret`, `drawFarm` và khối vẽ mỏ.
- HUD hiển thị vàng, năng lượng, thời gian, số lượng/loại quân; bảng điều khiển có nút mua quân, xây công trình, tấn công, tạm dừng.
- Nhật ký chiến trường (`feed`) hiển thị thông báo và hướng dẫn.
- CSS có breakpoint cho điện thoại và một bố cục dày hơn trên màn hình desktop đủ lớn.

## 11. Chế độ chơi với bạn bè — hiện trạng kỹ thuật

### 11.1 Luồng người dùng
1. Từ màn hình chọn chế độ, chủ phòng chọn **Solo với bạn bè** rồi tạo phòng.
2. Trình duyệt nạp thư viện PeerJS từ CDN.
3. Game sinh mã phòng ngẫu nhiên và tạo peer ID theo tiền tố `miniwarr` cộng mã phòng.
4. Game tạo link mời bằng cách thêm tham số `?room=...` vào URL hiện tại; chủ phòng có thể sao chép mã hoặc link.
5. Người tham gia nhập mã hoặc mở link rồi nhấn tham gia phòng.
6. Chủ phòng là phe xanh; khách là phe đỏ.
7. Khách gửi lệnh điều khiển lên chủ phòng; chủ phòng áp dụng lệnh và gửi snapshot trạng thái game. Chủ phòng gửi snapshot định kỳ khoảng mỗi 0,18 giây khi trận đang chạy.
8. Khi kết nối đóng, chủ phòng tạm dừng trận; khách trở về giao diện tham gia phòng để thử kết nối lại.

### 11.2 Mô hình đồng bộ trong code
- PeerJS được tải runtime từ `https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js`.
- Snapshot chứa thời gian trận, trạng thái pause/kết thúc và trạng thái mô phỏng; các mảng fog cục bộ không được serialize vào snapshot.
- Khách gửi action như mua quân, xây dựng, di chuyển, tấn công, tạm dừng hoặc di chuyển công trình.
- Chủ phòng áp dụng các action của khách lên phe đỏ và gửi snapshot mới.

### 11.3 Giới hạn và mức độ xác minh
**Tính năng đã có trong mã nguồn không đồng nghĩa đã kiểm thử được mọi điều kiện Internet.** Trước khi phát hành multiplayer ổn định, cần kiểm tra tối thiểu:
- Hai người trên hai thiết bị và hai mạng khác nhau.
- PeerJS signaling/CDN không bị chặn; thiết lập WebRTC qua router/NAT; nếu cần, cấu hình STUN/TURN phù hợp.
- Kết nối chậm, mất gói, reload trang, chủ phòng đóng tab, khách thoát phòng và tái kết nối.
- Đồng bộ pause, kết thúc trận, ID quân, lệnh di chuyển, kéo nông trại/tháp, fog riêng từng phe và trạng thái chọn quân.
- Ngăn hai khách vào cùng một phòng và xử lý mã phòng hết hiệu lực.
- Tránh để khách tự mô phỏng trạng thái authoritative khác với chủ phòng; cần đánh giá việc khách hiện vẫn chạy vòng lặp cập nhật cục bộ song song với nhận snapshot.
- Kiểm tra xác thực action ở chủ phòng (đơn vị có thuộc team gửi lệnh hay không, giá tài nguyên, phạm vi đặt công trình, trạng thái pause/kết thúc).

Hiện chưa có cơ sở để khẳng định kết nối multiplayer hoạt động ổn định trên tất cả mạng. Phần này nên được xem là **bản thử nghiệm cần QA**, không phải máy chủ game chuyên nghiệp. Lưu trữ file trên HTTPS là cần thiết cho trải nghiệm chia sẻ link, nhưng bản thân hosting tĩnh không thay thế dịch vụ signaling hoặc relay mạng.

## 12. Cấu trúc code và các thành phần quan trọng

Toàn bộ dự án hiện nằm trong một file HTML lớn:

| Thành phần | Trách nhiệm |
|---|---|
| HTML giao diện | HUD, canvas, nút tạo quân/xây dựng, nhật ký, overlay kết quả và màn hình chọn chế độ |
| CSS | Theme, bố cục, responsive, modal chọn mode/lobby |
| `specs` | Dữ liệu chỉ số và chi phí của từng loại quân |
| `fresh()` | Khởi tạo trận: căn cứ, mỏ, tài nguyên, tháp ban đầu và trạng thái mô phỏng |
| `spawn()` / `buy()` | Tạo quân và trừ tài nguyên; xử lý vị trí xuất hiện, trinh sát tối đa hai con và giới hạn chuẩn bị |
| `buildFarm()` / `farmPlacementValid()` | Tạo nông trại, kiểm tra sương mù, va chạm với đơn vị/công trình và ranh giới bản đồ |
| `buildTurret()` | Xây tháp, chi phí, giới hạn số lượng và khoảng cách tới căn cứ |
| `applyAction()` / `requestAction()` | Thực thi hoặc gửi lệnh trong AI và multiplayer |
| `update()` | Thu nhập tài nguyên, AI, di chuyển, chiến đấu, đạn, tháp, sương mù và cập nhật HUD |
| `nearestEnemy()` / `hurt()` | Chọn mục tiêu và xử lý sát thương/HP |
| `draw()` và `draw*()` | Vẽ bản đồ, sương mù, mỏ, căn cứ, quân, công trình, đạn, hiệu ứng và lựa chọn |
| `createRoom()` / `joinRoom()` / `setupConnection()` | Tạo phòng, tham gia phòng, nhận lệnh và snapshot PeerJS |
| `serializeSnapshot()` / `applySnapshot()` | Chuẩn bị và áp dụng trạng thái mạng |
| `loop()` | Vòng lặp animation/update của trình duyệt; với chủ phòng, gửi snapshot theo chu kỳ |

### Trạng thái cốt lõi
- `state`: tài nguyên của hai phe, quân, đạn, hiệu ứng, tháp, nông trại, căn cứ, mỏ và các bản đồ sương mù/trí nhớ AI.
- `gameTime`: thời gian trận dùng cho giai đoạn chuẩn bị và mở khóa tấn công.
- `mode`: `ai` hoặc `pvp`.
- `netRole`: vai trò `host` hoặc `guest` trong chế độ phòng.
- `paused`, `ended`: trạng thái tạm dừng và kết thúc.
- `camX`, `camY`, `zoom`: camera chiến trường.
- `localSelectedIds`, `selected`: lựa chọn đơn vị ở giao diện cục bộ.

## 13. Cài đặt và chạy dự án

### Chạy tại máy
1. Lưu file với tên `index.html` trong một thư mục riêng.
2. Mở file bằng trình duyệt hiện đại như Chrome hoặc Edge để chơi chế độ AI.
3. Khi cần kiểm thử qua server cục bộ, mở terminal tại thư mục dự án và chạy:

```bash
python -m http.server 8000
```

4. Mở `http://localhost:8000` trong trình duyệt.

Chế độ AI không cần backend. Chế độ chơi với bạn bè cần Internet để tải PeerJS và cần signaling/network traversal phù hợp. Để gửi link cho người khác, cần triển khai `index.html` lên hosting HTTPS; GitHub Pages có thể lưu file HTML tĩnh nhưng không tự cung cấp relay WebRTC/TURN.

### Quy trình làm việc với Antigravity
- Mở thư mục dự án, không chỉ mở một file riêng lẻ.
- Yêu cầu AI đọc toàn bộ `index.html` trước khi sửa.
- Mỗi thay đổi nên kèm mô tả file/dòng logic đã tác động, kiểm tra cú pháp JavaScript và test bằng trình duyệt.
- Tạo bản sao lưu trước khi thay đổi cấu trúc game hoặc giao thức multiplayer.
- Không coi cú pháp hợp lệ là bằng chứng gameplay hoặc multiplayer hoạt động chính xác.

## 14. Danh sách kiểm thử đề xuất

| ID | Kiểm thử | Kết quả mong đợi |
|---|---|---|
| T01 | Khởi động chế độ AI | Trận mới tạo căn cứ, HUD, quân/tài nguyên đúng và vòng lặp chạy |
| T02 | Mua mỗi loại quân | Đủ tài nguyên thì trừ đúng vàng/năng lượng, quân xuất hiện gần căn cứ |
| T03 | Trinh sát | Không được vượt quá 2 trinh sát cùng phe; trinh sát được đi ra ngoài trong 120 giây đầu |
| T04 | Giai đoạn 120 giây | Quân không phải trinh sát bị giới hạn trong vùng chuẩn bị; sau 120 giây lệnh tấn công/move được mở khóa |
| T05 | Dàn đội hình | Ra lệnh một nhóm đến điểm; đích các đơn vị rải đều, không cùng một tọa độ |
| T06 | Kinh tế nền | Vàng tăng +8/giây, năng lượng +5/giây theo mô phỏng |
| T07 | Nông trại | Mất 80 vàng khi xây hợp lệ; +2 vàng/giây; không chồng lên vật thể; chỉ đặt trong vùng đã khám phá |
| T08 | Tháp | Chi phí 100 vàng, tối đa 2; không đặt ngoài phạm vi căn cứ; tháp tự bắn mục tiêu hợp lệ |
| T09 | Mỏ thường/giàu/đặc biệt | Thu nhập đúng +3/+5/+3; mỏ đặc biệt thưởng +25 năng lượng sau đủ 30 giây liên tục |
| T10 | Tranh chấp mỏ | Phe đông quân hơn nhận quyền; hòa/trống thì ngừng thu nhập; sau 5 giây không có ưu thế, mỏ về trung lập |
| T11 | Sương mù | Mỏ đã khám phá vẫn hiện; quân/công trình địch không bị lộ chỉ vì đã khám phá địa hình |
| T12 | Kết thúc trận | Phá hủy căn cứ địch hiện thắng; mất căn cứ mình hiện thua |
| T13 | Hai người tạo/tham gia phòng | Chủ xanh, khách đỏ; cùng nhận trạng thái trận và thao tác được đồng bộ |
| T14 | Mất kết nối | Trạng thái được báo rõ; không để một phía tiếp tục âm thầm với trận lệch trạng thái |
| T15 | Responsive/camera | Canvas, HUD, nút điều khiển vẫn dùng được ở desktop và viewport nhỏ |

## 15. Những việc nên ưu tiên tiếp theo

### P0 — Độ đúng của multiplayer
- Kiểm thử thực tế trên hai thiết bị/mạng khác nhau.
- Xác định duy nhất mô hình mô phỏng authoritative (khuyến nghị: host là nguồn trạng thái; guest chỉ gửi lệnh và render snapshot).
- Bổ sung xử lý khách rời phòng, host reload, tạo trận mới/revanche, lỗi gửi snapshot, trạng thái kết nối và hết hạn phòng.
- Tăng cường xác thực lệnh phía host và kiểm tra điều kiện tài nguyên/đơn vị cho từng action.
- Đánh giá cách lưu, tính và hiển thị fog riêng cho từng phe qua snapshot.

### P1 — Gameplay và cân bằng
- Xác minh va chạm, mục tiêu và thứ tự ưu tiên mục tiêu cho từng loại quân.
- Cân bằng kinh tế nền, mỏ, nông trại và giá kỵ binh bằng nhiều trận thử.
- Kiểm thử đội hình lớn và hành vi ở mép bản đồ.
- Làm rõ cơ chế phá hủy/có thể kéo tháp và nông trại, cũng như giới hạn vùng đặt.

### P2 — UX và vận hành
- Thêm nút copy mã/link với thông báo thành công rõ ràng trên trình duyệt không hỗ trợ clipboard.
- Thêm màn hình hướng dẫn ngắn trong game, trạng thái kết nối dễ nhìn và báo lỗi kết nối thân thiện.
- Cân nhắc tách code thành `index.html`, `style.css`, `game.js`, `netcode.js` sau khi ổn định; hiện trạng vẫn là một file để dễ gửi và chạy.
- Thêm phiên bản/build ID để biết chính xác bản nào đang được chơi.

## 16. Nguyên tắc khi sửa đổi dự án

1. Giữ chế độ AI hoạt động khi thay đổi multiplayer.
2. Không tự ý đổi giá, HP, sát thương, tốc độ, cooldown hoặc luật mỏ nếu yêu cầu không nói đến cân bằng.
3. Thay đổi phần vẽ không nên làm đổi chỉ số logic, va chạm hoặc vùng nhìn.
4. Với sương mù, luôn tách `đã khám phá` và `đang nhìn thấy`.
5. Với công trình, kiểm tra vị trí ở nơi thực thi authoritative, không chỉ ở client.
6. Với lệnh đội hình, gán vị trí đích riêng từng quân; không để tất cả quân nhận cùng tọa độ.
7. Mỗi tính năng phải được kiểm thử trong chế độ AI và multiplayer nếu nó áp dụng cho cả hai.
8. Ghi rõ phần nào đã được chạy thử thực tế, phần nào chỉ mới qua kiểm tra cú pháp.

## 17. Prompt khởi đầu cho AI lập trình

Có thể dán nội dung sau vào Antigravity khi mở thư mục MiniWar:

> Hãy đọc tài liệu `MiniWar_Game_Document.md` và toàn bộ file HTML của Mini War trước khi thay đổi code. Tài liệu mô tả gameplay và thông số hiện tại; hãy xem mã nguồn là nguồn xác nhận cuối cùng nếu phát hiện điểm không khớp và báo lại sự khác biệt thay vì tự suy đoán. Giữ nguyên gameplay, chi phí, chỉ số quân, kinh tế, mỏ, nông trại, tháp, fog và đội hình trừ khi nhiệm vụ yêu cầu rõ thay đổi. Trước khi sửa hãy tóm tắt các hàm sẽ tác động, tạo bản sao lưu, thực hiện thay đổi tối thiểu, kiểm tra cú pháp và lập danh sách bước test thủ công. Không khẳng định multiplayer đã ổn định nếu chưa thử giữa hai trình duyệt trên hai mạng khác nhau.

## Phụ lục A — Các thuật ngữ trong dự án

- **Phe xanh / team 0:** chủ thể điều khiển ban đầu trong AI và là chủ phòng ở multiplayer.
- **Phe đỏ / team 1:** AI trong chế độ một người; người tham gia phòng ở multiplayer.
- **Mở sương mù / khám phá:** ghi nhớ khu vực bản đồ trong bản đồ fog của phe.
- **Vùng nhìn hiện tại:** khu vực mà đơn vị/căn cứ/tầm nhìn hợp lệ đang quan sát vào lúc đó.
- **Snapshot:** gói trạng thái trận được chủ phòng gửi cho người tham gia.
- **Authoritative host:** mô hình trong đó chủ phòng chịu trách nhiệm xác minh lệnh và trạng thái mô phỏng chính thức.
- **RTS:** Real-Time Strategy — game chiến thuật thời gian thực.

## Phụ lục B — Lưu ý về độ chính xác

Tài liệu này được tổng hợp từ mã nguồn HTML được chọn làm bản hiện tại và các mô tả/nhu cầu đã nêu trong quá trình phát triển. Mục thông số lấy từ code đang có; mô tả vai trò chiến thuật là diễn giải dựa trên thông số; mục đề xuất/QA là kế hoạch cho các bước sau. Tài liệu không khẳng định mọi tương tác đã được kiểm thử trực tiếp trong trình duyệt và không thay thế cho một đợt QA multiplayer đầy đủ.
