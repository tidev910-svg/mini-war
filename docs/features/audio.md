# Âm thanh

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-18

## Mô tả
Game có hiệu ứng âm thanh cho giao diện, mệnh lệnh, trận đánh và các sự kiện lớn.
- **Nguồn:** file `.ogg` lấy từ các bộ CC0 của Kenney: RPG Audio, Interface Sounds, Impact Sounds, Music Jingles. Không cần ghi nguồn; vẫn có ghi trong `public/assets/audio/LICENSE.txt`.
- **Tiếng trận đánh có định vị:** chỉ nghe khi trận đánh nằm trong khung camera và phe mình đang nhìn thấy chỗ đó; nhỏ dần về mép màn hình và khi thu nhỏ bản đồ; lệch trái/phải theo vị trí trên màn hình.
- **Tuỳ chỉnh:** tab **Âm thanh** trong Cài đặt có âm lượng tổng, trận đánh, giao diện & sự kiện, và nút tắt tiếng. Phím **M** bật/tắt tiếng.
- Chưa có nhạc nền và tiếng môi trường.

## Luật & thông số
| Tình huống | Tên trong `SOUNDS` | File (trong `public/assets/audio/`) | Nguồn Kenney |
|---|---|---|---|
| Bấm nút thường | `ui.click` | `ui/click.ogg` | Interface `click_001` |
| Mở / đóng menu ☰, bảng Huấn luyện/Xây dựng | `ui.open`, `ui.close` | `ui/open.ogg`, `ui/close.ogg` | Interface `open_002`, `close_002` |
| Mở / đóng hộp thoại (Cài đặt, Hướng dẫn, Rời trận) | `ui.dialogOpen`, `ui.dialogClose` | `ui/dialog-open.ogg`, `ui/dialog-close.ogg` | RPG `bookOpen`, `bookClose` |
| Đổi tab Cài đặt; bật/tắt công tắc | `ui.tab`, `ui.toggle` | `ui/tab.ogg`, `ui/toggle.ogg` | RPG `bookFlip3`, Interface `switch_003` |
| Thiếu tài nguyên | `ui.error` | `ui/error.ogg` | Interface `error_004` |
| Chọn quân (số quân chọn tăng) | `order.select` | `order/select-1..3` | RPG `cloth2..4` |
| Ra lệnh đi | `order.move` | `order/move-1..3` | Impact `footstep_grass_001..003` |
| Ra lệnh tấn công (phím A / nút) | `order.attack` | `order/attack-1..3` | RPG `drawKnife1..3` |
| Đòn cận chiến trúng | `combat.clash` | `combat/clash-1..5` | Impact `impactMetal_medium_000..004` |
| Cung thủ bắn | `combat.bow` | `combat/bow-1..2` | RPG `knifeSlice`, `knifeSlice2` |
| Tên / đạn pháo trúng | `combat.arrowHit` | `combat/arrow-hit-1..3` | Impact `impactWood_light_000..002` |
| Pháo đài, tháp, tiền đồn bắn | `combat.cannon` | `combat/cannon-1..3` | Impact `impactPunch_heavy_000..002` |
| Quân ngã | `combat.fall` | `combat/fall-1..3` | Impact `impactSoft_heavy_000..002` |
| Đặt công trình | `build.place` | `combat/build-place.ogg` | Impact `impactPlank_medium_000` |
| Tiêu tài nguyên (kho giảm ≥ `COINS_MIN_SPEND` = 15 trong một frame) | `economy.coins` | `combat/coins-1..2` | RPG `handleCoins`, `handleCoins2` |
| Vào trận | `event.start` | `event/start.ogg` | Jingles `jingles_HIT15` |
| Pháo đài bị tấn công | `event.alarm` | `event/alarm.ogg` | Jingles `jingles_HIT11` |
| Mất vùng / chiếm vùng | `event.lost`, `event.capture` | `event/lost.ogg`, `event/capture.ogg` | Jingles `jingles_HIT03`, `jingles_PIZZI01` |
| Công trình xây xong; quân huấn luyện xong | `event.built`, `event.trained` | `event/built.ogg`, `event/trained.ogg` | Jingles `jingles_PIZZI00`, Interface `confirmation_002` |
| Thắng / thua | `event.victory`, `event.defeat` | `event/victory.ogg`, `event/defeat.ogg` | Jingles `jingles_PIZZI07`, `jingles_SAX07` |

Tổng cộng 45 file, khoảng 610 KB.

| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Âm lượng mặc định: tổng / trận đánh / giao diện & sự kiện | 80% / 80% / 70% | `DEFAULT_SETTINGS` (`masterVolume`, `sfxVolume`, `uiVolume`) |
| Số tiếng tối đa cùng lúc | 18 (bỏ tiếng định vị cũ nhất trước) | `AUDIO_MAX_VOICES` |
| Giới hạn cho từng tiếng | `maxVoices` (số bản cùng lúc), `minGap` (giây giữa hai lần), `pitch` (lệch tốc độ phát ngẫu nhiên) | `SOUNDS` |
| Vùng nghe tiếng trận đánh | Khung camera + 25% mỗi phía; mép nhỏ còn 35%; lệch trái/phải tối đa 0,7 | `AUDIO_VIEW_MARGIN`, `AUDIO_EDGE_GAIN`, `AUDIO_PAN` |
| Thu nhỏ bản đồ | Tiếng trận đánh × `zoom / DEFAULT_ZOOM`, tối thiểu 0,35 | `positional()` |
| Tiếng sự kiện yêu cầu trước khi sẵn sàng | Chờ tối đa 2 giây rồi phát | `PENDING_SECONDS` |

## Code liên quan
- [src/config/audio.ts](../../src/config/audio.ts): `SOUNDS`, `AUDIO_*`, `COINS_MIN_SPEND`. Đổi tiếng thì chép file mới vào `public/assets/audio/` và sửa bảng này.
- [src/audio/sound.ts](../../src/audio/sound.ts):
  - `playSound(name, pos?)`: chuỗi Web Audio source → gain → stereo pan → bus (`ui`, `sfx`, `event`) → master.
  - `ensureAudio()`: tạo AudioContext và tải/giải mã mọi file khi mở trang. Lần bấm chuột/phím đầu tiên bật context.
  - `updateSoundscape()`: gọi cuối mỗi `draw()`, so trạng thái trận giữa các frame:
    - hiệu ứng trúng đòn/ngã và đạn mới (theo `id`), chỉ chỗ phe mình nhìn thấy;
    - cờ đổi chủ; công trình của mình mới đặt hoặc vừa xây xong; quân mới; số quân chọn tăng; kho giảm đột ngột;
    - vào trận, kết thúc trận.
  - `soundStats`, `audioStatus()` dùng cho kiểm thử.
- Gọi trực tiếp: `openPanel()`, `toggleMenu()`, `closeMenu()`, tiếng bấm chung (`ui/panels.ts`); thiếu tài nguyên và pháo đài bị tấn công (`ui/hud.ts`); nút và phím tấn công (`ui/input.ts`, `ui/hotkeys.ts`); lệnh đi (`showMoveMarker()` trong `render/paths.ts`); tab và công tắc Cài đặt (`ui/settings.ts`).
- Trường chỉ để hiển thị: `id` (`nextFxId()` trong `core/game.ts`) trên `state.effects` và `state.bullets`; `src` (loại quân ra đòn, `'gun'` cho súng, `'guard'`) trên hiệu ứng trúng đòn.
- Cài đặt: `muted`, `masterVolume`, `sfxVolume`, `uiVolume` ([settings.md](settings.md)); thanh trượt `.volume` trong [src/style.css](../../src/style.css).

## Tương tác
- [settings.md](settings.md): tab Âm thanh, phím M.
- [combat.md](combat.md): hiệu ứng trúng đòn / quân ngã mang `id`, `src`.
- [fog-of-war.md](fog-of-war.md): không nghe trận đánh trong sương mù (`teamCanSee()`).
- [hud-ui.md](hud-ui.md): menu, hộp thoại, bảng.

## Multiplayer
Không gửi âm thanh qua mạng. `updateSoundscape()` chỉ đọc `state`, nên máy khách nghe theo snapshot: mỗi hiệu ứng và đạn có `id` nên chỉ phát một lần dù snapshot tạo lại đối tượng. Âm lượng và tắt tiếng là cài đặt riêng của từng máy.

## Kiểm thử thủ công
- [ ] Vào trận có tiếng trống; mở menu, hộp thoại, đổi tab có tiếng.
- [ ] Giao tranh trong khung nhìn nghe tiếng kiếm, cung, ngã; cuộn camera đi chỗ khác thì im.
- [ ] Mua quân nghe tiếng đồng xu; thiếu tiền nghe tiếng lỗi; quân ra sân có tiếng xác nhận.
- [ ] Chiếm cờ, mất cờ, pháo đài bị tấn công, thắng/thua có đoạn nhạc ngắn.
- [ ] Phím M tắt/bật; thanh trượt âm lượng có tác dụng ngay, thả tay nghe thử.
- [ ] PvP: máy khách nghe trận đánh của mình.
- Đã chạy thử 2026-10-18 (Chrome headless, có bấm chuột thật):
  - Tải và giải mã đủ 45 file; trống vào trận.
  - Menu, hộp thoại, tab, lỗi thiếu tài nguyên, đồng xu, quân xong, 7 tiếng kiếm trong 4 giây giao tranh, chiếm cờ, đặt công trình đều phát.
  - Camera sang chỗ khác thì không còn tiếng kiếm; M tắt tiếng.
  - `pnpm smoke` nhóm `boot` kiểm tra tải đủ file âm thanh.

## Giới hạn / việc tồn đọng
- Chưa có nhạc nền và tiếng môi trường (gió, chim); các bộ Kenney đã dùng không có nhạc trung cổ dài.
- Các file được chọn theo tên và độ dài, chưa được nghe duyệt kỹ (nhất là `event.defeat` là đoạn saxophone); đổi bằng cách sửa `SOUNDS`.
- Chưa có tiếng riêng cho từng loại quân (kỵ binh, giáo đều dùng tiếng kim loại).
