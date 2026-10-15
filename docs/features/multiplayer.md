# Chọn chế độ & chơi với bạn bè (P2P)

> Trạng thái: Cần kiểm thử · Cập nhật lần cuối: 2026-10-15

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
- Host rời → guest quay về bảng phòng với thông báo mất kết nối.

## Code liên quan
- [src/main.ts](../../src/main.ts): `startAIMode()`, `startHostGame()`, `startGuestFromSnapshot()`, `createRoom()`, `joinRoom()`, `setupConnection()`, `destroyPeer()`, `ensurePeerJs()`, `serializeSnapshot()`, `sendSnapshot()`, `applySnapshot()`, `requestAction()`, `applyAction()`, `localTeam()`, `isMultiplayer()`.
- UI lobby: `showFriendPanel()`, `showModeHome()`, `hideModeScreen()`, `showModeScreen()`, `setNetStatus()`, `setGameModeLabel()`; xử lý `?room=` ở cuối file.
- [index.html](../../index.html): `#modeAI`, `#modeFriends`, `#createRoom`, `#roomInput`, `#joinRoom`, `#roomCode`, `#copyRoomLink`, `#copyRoomCode`, `#netStatus`, `#modeBack`.
- Biến: `mode`, `netRole`, `peer`, `conn`, `roomCode`, `snapshotClock`, `connectionIntent` (gán nhưng chưa dùng).

## Tương tác
Mọi tính năng thay đổi `state` đều phải đi qua action để chạy được ở PvP. Fog và lựa chọn quân là cục bộ ([fog-of-war.md](fog-of-war.md), [controls.md](controls.md)).

## Kiểm thử thủ công
- [ ] Mở 2 tab (hoặc 2 máy) từ cùng URL `pnpm dev`; tab A tạo phòng, tab B nhập mã → trận bắt đầu, A xanh, B đỏ.
- [ ] Mở link mời → ô mã tự điền.
- [ ] B mua quân, đặt nông trại, di chuyển, tấn công, nâng cấp pháo → A thấy đúng.
- [ ] Đóng tab B → A tạm dừng; B vào lại bằng mã cũ → trận tiếp tục.
- [ ] Đóng tab A → B về màn hình phòng.
- [ ] Thử giữa 2 mạng khác nhau (một số mạng chặn WebRTC; không có TURN server).

## Giới hạn / việc tồn đọng
- **Lỗi:** khi guest mất kết nối, nút "Tạo phòng mới" / "Tham gia phòng" vẫn bị `disabled` (chỉ `#modeBack` và các nhánh lỗi mới mở lại) → phải bấm "Quay lại" mới vào lại được.
- **Bảo mật lệnh:** host tin payload của guest; `buy()` kiểm tra `!specs[type]` nên `'constructor'` lọt qua → nên dùng `Object.hasOwn()`. Các action khác đã kẹp toạ độ/kiểm tra team.
- Snapshot gửi toàn bộ `state` mỗi 0.18 giây (không nén, không delta) — tốn băng thông khi nhiều quân.
- Phòng không có mật khẩu; peer ID đoán được từ mã phòng.
- Không có "chơi lại" trong cùng phòng.
- Chưa có bằng chứng kiểm thử trên nhiều trình duyệt/mạng.
