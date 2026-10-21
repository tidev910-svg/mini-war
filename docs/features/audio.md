# Âm thanh

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-21

## Mô tả
Game có hiệu ứng âm thanh cho giao diện, mệnh lệnh, trận đánh và các sự kiện lớn, cùng nhạc nền và tiếng môi trường.
- **Nguồn:**
  - Giao diện, mệnh lệnh, trận đánh: file `.ogg` từ các bộ CC0 của Kenney (RPG Audio, Interface Sounds, Impact Sounds). Không cần ghi nguồn; vẫn ghi trong `public/assets/audio/LICENSE.txt`.
  - **Sự kiện, nhạc nền, tiếng môi trường: tạo bằng code** (Web Audio), không có file, thuộc dự án: trống trận, tù và, chuông, đàn gảy, gió, chim.
- **Tiếng trận đánh có định vị:** chỉ nghe khi trận đánh nằm trong khung camera và phe mình đang nhìn thấy chỗ đó; nhỏ dần về mép màn hình và khi thu nhỏ bản đồ; lệch trái/phải theo vị trí trên màn hình.
- **Tuỳ chỉnh:** tab **Âm thanh** trong Cài đặt có âm lượng tổng, trận đánh, giao diện & sự kiện, và nút tắt tiếng. Phím **M** bật/tắt tiếng.
- **Nhạc nền** (sảnh và trong trận): nền trầm theo vòng hợp âm Rê thứ – Si giáng – Đô – La thứ, đàn gảy ngẫu hứng trên Rê thứ. Trong trận có trống trận dồn dần theo **độ căng**: mỗi tiếng giao tranh người chơi nghe thấy làm tăng độ căng, độ căng nguội dần. Hết trận nhạc tắt dần để nghe nhạc thắng/thua.
- **Tiếng môi trường** (chỉ trong trận): gió thổi lúc mạnh lúc nhẹ; chim hót khi yên bình (độ căng < 0,4); nhỏ dần khi thu nhỏ bản đồ và khi giao tranh căng.

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
| Đòn cận chiến trúng của lính bộ (và quái canh mỏ) | `combat.clash` | `combat/clash-1..5` | Impact `impactMetal_medium_000..004` |
| Lính giáo đâm trúng | `combat.spear` | `synth:hitSpear#1..3` — tiếng vung, cán gỗ va, chút thép | Tự tạo |
| Kỵ binh chém trúng | `combat.cavalry` | `synth:hitCavalry#1..3` — vó ngựa, đòn nặng, tiếng kiếm ngân | Tự tạo |
| Trinh sát đánh trúng | `combat.scout` | `synth:hitScout#1..3` — vung dao nhẹ, đòn nhẹ | Tự tạo |
| Cột cờ tự bắn ([flag-defense.md](flag-defense.md)) | `combat.flag` | `synth:flagShot#1..2` — dây nỏ bật, mũi tên bay | Tự tạo |
| Cung thủ bắn | `combat.bow` | `combat/bow-1..2` | RPG `knifeSlice`, `knifeSlice2` |
| Tên / đạn pháo trúng | `combat.arrowHit` | `combat/arrow-hit-1..3` | Impact `impactWood_light_000..002` |
| Pháo đài, tháp, tiền đồn bắn | `combat.cannon` | `combat/cannon-1..3` | Impact `impactPunch_heavy_000..002` |
| Quân ngã | `combat.fall` | `combat/fall-1..3` | Impact `impactSoft_heavy_000..002` |
| Đặt công trình | `build.place` | `combat/build-place.ogg` | Impact `impactPlank_medium_000` |
| Tiêu tài nguyên (kho giảm ≥ `COINS_MIN_SPEND` = 15 trong một frame) | `economy.coins` | `combat/coins-1..2` | RPG `handleCoins`, `handleCoins2` |
| Vào trận | `event.start` | `synth:start` — 3 trống trận rồi tù và gọi Rê → La | Tự tạo |
| Pháo đài bị tấn công | `event.alarm` | `synth:alarm` — hai hồi tù và trầm (La2) trên hồi trống | Tự tạo |
| Mất vùng / chiếm vùng | `event.lost`, `event.capture` | `synth:lost` — kèn đi xuống La → Fa + trống; `synth:capture` — kèn lệnh đi lên Rê – Fa# – La | Tự tạo |
| Công trình xây xong; quân huấn luyện xong | `event.built`, `event.trained` | `synth:built` — hai nhát búa + chuông nhỏ; `synth:trained` — gõ trống + kèn ngắn | Tự tạo |
| Thắng / thua | `event.victory`, `event.defeat` | `synth:victory` — hồi trống, kèn lệnh ba tiếng, hợp âm Rê trưởng, chũm chọe, chuông; `synth:defeat` — ba hồi chuông trầm trên nền kèn u buồn (thay đoạn saxophone cũ) | Tự tạo |
| Xếp hoặc đổi đội hình ([formations.md](formations.md)) | `order.formation` | `synth:formation` — ba tiếng trống, tiếng cuối mạnh | Tự tạo |
| Quân vào cờ đồn trú | `event.garrison` | `synth:garrison` — cửa nặng đóng, tiếng chốt | Tự tạo |
| Quân đồn trú xuất kích | `event.sortie` | `synth:sortie` — hai trống + tù và gọi đi lên | Tự tạo |
| Nâng cấp xong (cấp nông trại, mở thêm hàng đợi) | `event.upgraded` | `synth:upgraded` — nhát búa + chuỗi đàn đi lên | Tự tạo |
| Kho lúa cạn (bắt đầu cảnh báo thiếu tiếp tế) | `event.starving` | `synth:starving` — hai tiếng chuông trầm, nhỏ | Tự tạo |
| Thấy quân địch gần pháo đài (< 700) hoặc trong vùng mình giữ, sau một lúc yên | `event.intruder` | `synth:intruder` — một hồi tù và ngắn (khác báo động pháo đài hai hồi dài); cách nhau ≥ 25 giây | Tự tạo |

Tổng cộng 45 file, khoảng 610 KB.

| Thông số | Giá trị | Nguồn |
|---|---:|---|
| Âm lượng mặc định: tổng / trận đánh / giao diện & sự kiện / nhạc nền / môi trường | 80% / 80% / 70% / 50% / 50% | `DEFAULT_SETTINGS` (`masterVolume`, `sfxVolume`, `uiVolume`, `musicVolume`, `ambienceVolume`) |
| Nhịp nhạc | 92 BPM, bước nốt móc đơn, xếp lịch trước 0,3 giây | `MUSIC_BPM`, `MUSIC_LOOKAHEAD` |
| Vòng hợp âm | Dm – B♭ – C – Am, mỗi hợp âm 2 ô nhịp | `CHORDS` (`audio/music.ts`) |
| Độ căng trận đánh | Mỗi tiếng nghe thấy cộng: đòn trúng 0,035, quân ngã 0,07, đạn pháo 0,03, pháo đài bị tấn công 0,4 (tối đa 1); nguội theo e^(−t/9 s); nhạc bám theo bản làm mượt (≈ 2,5 giây) | `MUSIC_HEAT`, `MUSIC_HEAT_SECONDS`, `addBattleHeat()` |
| Trống theo độ căng | > 0,12: phách 1 · > 0,35: thêm phách 4, 5, 7 · > 0,65: móc đơn liên tục + tiếng lắc · > 0,75: kèn nhấn mỗi 2 ô nhịp | `playStep()` |
| Môi trường | Chim mỗi 3–10 giây khi độ căng < 0,4; âm lượng × max(0,35, zoom / mặc định) × (1 − 0,5 × độ căng) | `updateMusic()` |
| Số tiếng tối đa cùng lúc | 18 (bỏ tiếng định vị cũ nhất trước) | `AUDIO_MAX_VOICES` |
| Giới hạn cho từng tiếng | `maxVoices` (số bản cùng lúc), `minGap` (giây giữa hai lần), `pitch` (lệch tốc độ phát ngẫu nhiên) | `SOUNDS` |
| Vùng nghe tiếng trận đánh | Khung camera + 25% mỗi phía; mép nhỏ còn 35%; lệch trái/phải tối đa 0,7 | `AUDIO_VIEW_MARGIN`, `AUDIO_EDGE_GAIN`, `AUDIO_PAN` |
| Thu nhỏ bản đồ | Tiếng trận đánh × `zoom / DEFAULT_ZOOM`, tối thiểu 0,35 | `positional()` |
| Tiếng sự kiện yêu cầu trước khi sẵn sàng | Chờ tối đa 2 giây rồi phát | `PENDING_SECONDS` |

## Code liên quan
- [src/config/audio.ts](../../src/config/audio.ts): `SOUNDS`, `AUDIO_*`, `COINS_MIN_SPEND`, `MUSIC_BPM`, `MUSIC_LOOKAHEAD`, `MUSIC_HEAT_SECONDS`, `MUSIC_HEAT`. Đổi tiếng file thì chép file mới vào `public/assets/audio/` và sửa bảng này; tiếng tự tạo ghi `synth('<công thức>')`.
- [src/audio/instruments.ts](../../src/audio/instruments.ts): nhạc cụ tổng hợp dùng chung `drum()`, `horn()`, `bell()`, `pluck()`, `knock()`, `cymbal()`, `whoosh()`, `clang()`, `twang()`, `makeReverb()`, `noise()`, `midi()`.
- [src/audio/synth.ts](../../src/audio/synth.ts): `SYNTH_RECIPES` (start, alarm, lost, capture, built, trained, victory, defeat, hitSpear, hitCavalry, hitScout, flagShot, formation, garrison, sortie, upgraded, starving, intruder), `renderSynth(name)` dựng một công thức thành AudioBuffer (tên `công-thức#n` là bản thứ n, lệch cao độ theo `VARIANT_PITCH` để tiếng đánh nhau không lặp y hệt) bằng `OfflineAudioContext` lúc tải trang.
- [src/audio/music.ts](../../src/audio/music.ts): `updateMusic(graph)` (gọi đầu `updateSoundscape()` mỗi frame), `addBattleHeat(v)`, `musicStatus()`; bên trong `setup()`, `playStep()`, `bird()`.
- [src/audio/sound.ts](../../src/audio/sound.ts):
  - `playSound(name, pos?)`: chuỗi Web Audio source → gain → stereo pan → bus (`ui`, `sfx`, `event`) → master. Thêm bus `music`, `ambience` cho `audio/music.ts`; `audioGraph()` trả `{ac, buses}`.
  - `ensureAudio()`: tạo AudioContext, tải/giải mã mọi file và dựng mọi tiếng `synth:` khi mở trang. Lần bấm chuột/phím đầu tiên bật context.
  - Tiếng giao tranh phát được thì cộng độ căng nhạc (`addBattleHeat()`); `ui/hud.ts` cộng thêm khi pháo đài bị tấn công.
  - `updateSoundscape()`: gọi cuối mỗi `draw()`, so trạng thái trận giữa các frame:
    - hiệu ứng trúng đòn/ngã và đạn mới (theo `id`), chỉ chỗ phe mình nhìn thấy;
    - tiếng trúng đòn theo loại quân ra đòn (`HIT_SOUND`); đạn của cờ;
    - cờ đổi chủ; công trình của mình mới đặt hoặc vừa xây xong; quân mới (kể cả trong cờ); số quân chọn tăng; kho giảm đột ngột;
    - đội hình mới / đổi kiểu; quân trong cờ tăng; số quân xuất kích tăng; cấp nông trại hoặc số hàng đợi tăng; kho lúa chuyển sang cảnh báo; quân địch đầu tiên lọt vào lãnh thổ (`INTRUDER_RANGE` = 700 quanh pháo đài, hoặc trong vùng mình giữ);
    - vào trận, kết thúc trận.
  - `soundStats`, `audioStatus()` dùng cho kiểm thử.
- Gọi trực tiếp: `openPanel()`, `toggleMenu()`, `closeMenu()`, tiếng bấm chung (`ui/panels.ts`); thiếu tài nguyên và pháo đài bị tấn công (`ui/hud.ts`); nút và phím tấn công (`ui/input.ts`, `ui/hotkeys.ts`); lệnh đi (`showMoveMarker()` trong `render/paths.ts`); tab và công tắc Cài đặt (`ui/settings.ts`).
- Trường chỉ để hiển thị: `id` (`nextFxId()` trong `core/game.ts`) trên `state.effects` và `state.bullets`; `src` (loại quân ra đòn, `'gun'` cho súng, `'guard'`) trên hiệu ứng trúng đòn.
- Cài đặt: `muted`, `masterVolume`, `sfxVolume`, `uiVolume`, `musicVolume`, `ambienceVolume` ([settings.md](settings.md)); thanh trượt `.volume` trong [src/style.css](../../src/style.css).

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
- [ ] Chiếm cờ, mất cờ, pháo đài bị tấn công, thắng/thua có tiếng trống / tù và / chuông tự tạo.
- [ ] Sảnh có nhạc nhẹ; vào trận có gió, chim; giao tranh trong khung nhìn thì trống dồn lên, hết đánh thì lắng lại; hết trận nhạc tắt dần.
- [ ] Thanh trượt Nhạc nền / Tiếng môi trường có tác dụng ngay; M tắt cả nhạc.
- Đã chạy thử 2026-10-19 (Chrome headless): 45 tiếng sẵn sàng (37 file + 8 tự tạo); 8 công thức đỉnh 0,10–0,88 (không méo), đuôi tắt hẳn; thu 40 giây nhạc trong trận: yên bình ≈ −32 dB RMS, giao tranh ≈ −27 dB, rồi lắng xuống; không lỗi JavaScript.
- [ ] Giáo, kỵ binh, trinh sát, lính bộ đánh nhau nghe khác nhau; cờ bắn nghe tiếng nỏ.
- [ ] Xếp đội hình có trống; đưa quân vào cờ có tiếng cửa; quân đồn trú xuất kích có tù và; nâng nông trại / mở hàng đợi có chuỗi đàn; cạn lúa có chuông trầm; địch lọt vào lãnh thổ có một hồi tù và ngắn.
- Đã chạy thử 2026-10-21 (Chrome headless): 62/62 tiếng sẵn sàng (37 file + 25 tự tạo); dựng một trận thử có đủ các tình huống trên → mọi tiếng mới đều phát (`soundStats`); đỉnh 0,20–0,75, không méo; không lỗi JavaScript.
- [ ] Phím M tắt/bật; thanh trượt âm lượng có tác dụng ngay, thả tay nghe thử.
- [ ] PvP: máy khách nghe trận đánh của mình.
- Đã chạy thử 2026-10-18 (Chrome headless, có bấm chuột thật):
  - Tải và giải mã đủ 45 file; trống vào trận.
  - Menu, hộp thoại, tab, lỗi thiếu tài nguyên, đồng xu, quân xong, 7 tiếng kiếm trong 4 giây giao tranh, chiếm cờ, đặt công trình đều phát.
  - Camera sang chỗ khác thì không còn tiếng kiếm; M tắt tiếng.
  - `pnpm smoke` nhóm `boot` kiểm tra tải đủ file âm thanh.

## Giới hạn / việc tồn đọng
- Tiếng tự tạo và nhạc chưa được người nghe duyệt kỹ; chỉnh bằng tham số trong `SYNTH_RECIPES` / `audio/music.ts`.
- Nhạc là đàn gảy ngẫu hứng trên một vòng hợp âm, không có đoạn nhạc soạn sẵn; nghe lâu có thể đơn điệu.
- Tiếng file Kenney (giao diện, trận đánh) chọn theo tên và độ dài, chưa nghe duyệt kỹ.
- Lính bộ dùng tiếng kiếm của Kenney, cung thủ dùng tiếng tên; giáo, kỵ binh, trinh sát dùng tiếng tự tạo nên chất âm hai nhóm có thể hơi khác nhau.
- Tiếng đánh nhau chỉ phân theo loại quân **ra đòn**, chưa theo loại bị đánh.
