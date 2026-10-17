# Chọn chế độ & chơi với bạn bè (P2P)

> Trạng thái: Cần kiểm thử · Cập nhật lần cuối: 2026-10-17

## Mô tả
Màn hình đầu (`#modeScreen`) có 2 lựa chọn:
- **🤖 Chơi với AI**: `startAIMode()`, không cần mạng.
- **👥 Solo với bạn bè**: 1 đấu 1 qua PeerJS (WebRTC). Chủ phòng tạo phòng, nhận mã 6 ký tự và link mời `?room=CODE`; bạn nhập mã hoặc mở link để vào. Chủ phòng là phe xanh, khách là phe đỏ.

Không có tài khoản/đăng nhập; ai có mã phòng đều vào được.

## Luật & thông số
| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Mã phòng | 6 ký tự A–Z0–9 ngẫu nhiên; thử lại tối đa 5 lần nếu trùng ID | `createRoom()` |
| Peer ID | `'miniwarr' + mã viết thường` | `roomPeerId()` |
| Mã khách nhập | lọc còn A–Z0–9, 4–8 ký tự | `joinRoom()` |
| Chu kỳ snapshot | 0.18 giây + ngay sau mỗi action | `loop()`, `setupConnection()` |
| Thư viện | PeerJS 1.5.4 từ jsDelivr, tải khi cần | `ensurePeerJs()` |
| Số khách | 1; kết nối thứ hai bị đóng nếu đã có kết nối mở | `createRoom()` |

## Mô hình đồng bộ (authoritative host)
```
Guest                                   Host
 requestAction(a,p) ──{type:'action'}──► applyAction(1,a,p) → sendSnapshot()
 applySnapshot()   ◄──{type:'snapshot'}── mỗi 0.18s: serializeSnapshot()
 (không chạy update)                     update(dt) chạy mô phỏng đầy đủ
```
Thông điệp:
- `{type:'hello', room}` — guest gửi khi kết nối mở; host trả snapshot.
- `{type:'action', action, payload}` — xem danh sách action trong [architecture.md](../architecture.md).
- `{type:'snapshot', gameTime, paused, ended, state, resultTitle, resultText}` — `state` bỏ fog, `target:null`, `selected:false`.

Ngắt kết nối:
- Guest rời → host tự **tạm dừng**, phòng vẫn mở, guest có thể vào lại bằng mã cũ.
- Host rời (hoặc guest mất kết nối) → guest đóng peer, quay về bảng phòng, các nút được mở lại và ô mã phòng điền sẵn mã cũ; bấm "Tham gia phòng" để vào lại.

## Code liên quan
- [src/main.ts](../../src/main.ts): `startAIMode()`, `startHostGame()`, `startGuestFromSnapshot()`, `createRoom()`, `joinRoom()`, `setupConnection()`, `destroyPeer()`, `ensurePeerJs()`, `serializeSnapshot()`, `sendSnapshot()`, `applySnapshot()`, `requestAction()`, `applyAction()`, `localTeam()`, `isMultiplayer()`.
- UI lobby: `showFriendPanel()`, `showModeHome()`, `hideModeScreen()`, `showModeScreen()`, `setNetStatus()`, `setGameModeLabel()`; xử lý `?room=` ở cuối file.
- [index.html](../../index.html): `#modeAI`, `#modeFriends`, `#createRoom`, `#roomInput`, `#joinRoom`, `#roomCode`, `#copyRoomLink`, `#copyRoomCode`, `#netStatus`, `#modeBack`.
- Biến: `mode`, `netRole`, `peer`, `conn`, `roomCode`, `snapshotClock`, `connectionIntent` (gán nhưng chưa dùng).

## Tương tác
Mọi tính năng thay đổi `state` đều phải đi qua action để chạy được ở PvP. Fog và lựa chọn quân là cục bộ ([fog-of-war.md](fog-of-war.md), [controls.md](controls.md)).

## Kiểm thử thủ công
- [ ] Mở 2 tab (hoặc 2 máy) từ cùng URL `pnpm dev`; tab A tạo phòng, tab B nhập mã → trận bắt đầu, A xanh, B đỏ; camera của B đặt ở pháo đài đỏ.
- [ ] Mở link mời → ô mã tự điền.
- [ ] B mua quân, đặt nông trại/tháp, đưa quân chiếm cờ, chọn cờ rồi xây tiền đồn, nâng cấp, di chuyển, tấn công → A thấy đúng; HUD của B hiện lãnh thổ và mở khoá quân.
- Đã chạy thử 2026-10-17 (2 Chrome headless): cờ trùng vị trí ở hai bên; 5 quân đỏ ở cờ → guest thấy tiến độ 35% sau 8 giây, rồi vùng đổi chủ, HUD guest hiện 2 vùng; guest bấm "Xây tiền đồn" → host tạo tiền đồn; lần thứ hai bị từ chối. Không lỗi JavaScript.
- Đã chạy thử 2026-10-16 bằng 2 trình duyệt Chrome headless trên cùng máy, qua máy chủ PeerJS thật: tạo/vào phòng, guest xây cột cờ + nông trại + nhà lính, chiếm vùng, tuyển lính giáo và lính bộ; host và guest thấy cùng tiến độ và tài nguyên; không lỗi JavaScript. Chưa thử giữa 2 mạng khác nhau và ngắt/vào lại.
- [ ] Đóng tab B → A tạm dừng; B vào lại bằng mã cũ → trận tiếp tục.
- [ ] Đóng tab A → B về màn hình phòng, nút "Tham gia phòng" bấm được ngay.
- [ ] Hai cửa sổ khác kích thước: vị trí quân, mỏ, ranh giới vùng trùng nhau ở hai bên.
- Đã chạy thử 2026-10-16 (2 Chrome headless, cửa sổ 1400×1000 và 900×700): cùng `W = 9600`, cùng vị trí pháo đài và bản đồ vùng; guest tự ngắt → nút mở, mã điền sẵn, host tạm dừng → guest vào lại đúng phe đỏ, trận chạy tiếp.
- [ ] Thử giữa 2 mạng khác nhau (một số mạng chặn WebRTC; không có TURN server).

## Giới hạn / việc tồn đọng
- **Bảo mật lệnh:** host kiểm tra loại quân bằng `Object.hasOwn(specs, type)`; các action khác kẹp toạ độ/kiểm tra team. Chưa giới hạn tần suất lệnh.
- Log của host không tới guest; riêng việc mua quân thì guest tự kiểm tra trước (`requestBuy()`) nên vẫn thấy lý do bị từ chối. Các lệnh khác (xây, nâng cấp) bị từ chối thì guest không thấy lý do.
- Snapshot gửi toàn bộ `state` mỗi 0.18 giây (không nén, không delta), nay gồm cả `buildings`, `regions`, ~20 `mines` — tốn băng thông khi nhiều quân/công trình.
- Log sự kiện (xây xong, chiếm vùng, thiếu tiếp tế…) chỉ hiện ở host; guest chỉ thấy qua bản đồ/HUD.
- `regionMap` (bản đồ vùng 256×256) không gửi qua mạng; guest tự dựng lại từ hạt giống trong `state.regions` (`ensureRegionMap()`), nên host và guest phải cùng địa hình (`buildTerrain()` tất định).
- Phòng không có mật khẩu; peer ID đoán được từ mã phòng.
- Không có "chơi lại" trong cùng phòng.
- Chưa có bằng chứng kiểm thử trên nhiều trình duyệt/mạng.
