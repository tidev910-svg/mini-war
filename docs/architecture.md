# Kiến trúc code

> Cập nhật lần cuối: 2026-10-30

## Công nghệ & file
| File / thư mục | Vai trò |
|---|---|
| [index.html](../index.html) | Khung giao diện: sảnh chính và phòng (`#modeScreen`), canvas `#game` toàn màn hình và lớp HUD nổi (huy hiệu, tài nguyên, hàng đợi, minimap, nhật ký, nút lệnh, bảng trượt, hướng dẫn), overlay kết quả. |
| [src/](../src/) | Logic game, chia module theo tính năng (bảng bên dưới). Mọi file có `// @ts-nocheck`. |
| [src/style.css](../src/style.css) | Giao diện huy hiệu & cờ hiệu, bố cục HUD, sảnh chính, responsive. Nạp bằng `<link>` trong `index.html` (không `import` từ JS) để có CSS ngay lần vẽ đầu. |
| [vite.config.ts](../vite.config.ts) | `base` = `/mini-war/` khi build/preview (GitHub Pages), `/` khi dev; ảnh nạp qua `import.meta.env.BASE_URL` (`render/sprites.ts`). Plugin `mini-war-theme-tokens`: chèn design tokens từ `src/config/theme.ts` vào `<head>` thành `<style id="theme-tokens">`, cả lúc dev lẫn build. |
| [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) | Mỗi lần push lên `main`: `pnpm install` + `pnpm build`, đăng `dist/` lên GitHub Pages: https://tidev910-svg.github.io/mini-war/ |
| [public/assets/](../public/assets/) | Spritesheet quân, sprite pháo đài & nông trại (đường dẫn `/assets/...`). Ảnh nguồn ở [art/](../art/). |
| [tests/](../tests/) | Unit test (vitest + jsdom) chạy chính các module game: sinh bản đồ, chiếm cờ, tầm nhìn vùng, thu nhập, hàng đợi huấn luyện. `pnpm test`. |
| [scripts/smoke/](../scripts/smoke/) | Smoke test trên Chrome headless (cần `pnpm dev` đang chạy): `pnpm smoke` hoặc `pnpm smoke maps pvp`. Ảnh chụp ở `scripts/smoke/out/`. |
| [scripts/start-game.bat](../scripts/start-game.bat) | Mở nhanh trên Windows: chạy Vite ở cổng 5173 rồi mở trình duyệt. |
| [tools/](../tools/) | Script Python dựng spritesheet. |
| [package.json](../package.json) | Vite 6 + TypeScript 5 + vitest. `pnpm dev`, `pnpm build` (`tsc --noEmit && vite build`), `pnpm test`, `pnpm smoke`, `pnpm preview`. |

PeerJS **không** nằm trong `package.json`; nó được tải từ CDN lúc chạy bởi `ensurePeerJs()`.

## Module trong `src/`
| Thư mục | File | Nội dung | Tài liệu |
|---|---|---|---|
| — | `main.ts` | Điểm vào: import mọi module, rồi `fresh()` và chạy `loop()` | [match-flow.md](features/match-flow.md) |
| `config/` | `map.ts`, `maps.ts`, `balance.ts`, `theme.ts`, `visuals.ts`, `audio.ts`, `creeps.ts` | **Chỉ hằng số**: kích thước bản đồ & sinh vùng; danh sách bản đồ và 5 miền của bản đồ Ngũ Vực (`maps.ts`, [realms-map.md](features/realms-map.md)); bảng cân bằng (`specs`, `BUILDING_TYPES`, `MINE_TYPES`, thu nhập, chiếm cờ, AI); design tokens của giao diện (`THEME`, `TEAM_COLORS`, `MAP_UI`, nơi duy nhất chứa màu/cỡ chữ/khoảng cách); màu/kích thước viền, cờ, sương mù (lấy màu phe và sương mù từ `theme.ts`) | [economy.md](features/economy.md), [units.md](features/units.md), [territory.md](features/territory.md) |
| `core/` | `game.ts` | Trạng thái dùng chung: `state`, `mode`, `netRole`, `paused`, `ended`, lựa chọn, `nextId`; tiện ích `localTeam()`, `canAfford()`, `spend()`, `addLog()`, `$()` | — |
| | `view.ts` | Canvas, khung nhìn, camera/zoom, đổi toạ độ | [controls.md](features/controls.md) |
| | `match.ts` | `fresh()`, `update(dt)`, `finish()`, `loop()`; bộ đếm `aiTimer`, `incomeTimer`… | [match-flow.md](features/match-flow.md) |
| | `actions.ts` | `requestAction()` / `applyAction()` | [multiplayer.md](features/multiplayer.md) |
| | `settings.ts` | Tuỳ chọn của người chơi (`settings`, `setSetting()`, `onSettingChange()`), lưu trong `localStorage`, không gửi qua mạng | [settings.md](features/settings.md) |
| `map/` | `terrain.ts`, `realms.ts`, `regions.ts`, `bases.ts`, `paths.ts`, `camps.ts` | Địa hình theo bản đồ (`buildTerrain(mapId)`, `useMap()`), `walkDistances()`; miền đất và địa hình Ngũ Vực (`realms.ts`); bản đồ vùng và `generateRegions()`; vị trí hang quái theo cặp đối xứng (`placeCamps()`); hình học pháo đài (`baseDir()`, `musterYard()`); ô đi được, cầu, A* (`findPath()`, `groupPaths()`) | [territory.md](features/territory.md), [fortress.md](features/fortress.md) |
| `sim/` | `economy.ts`, `units.ts`, `movement.ts`, `fog.ts`, `buildings.ts`, `territory.ts`, `combat.ts`, `stats.ts`, `formation.ts`, `garrison.ts`, `knowledge.ts`, `creeps.ts` | Luật mô phỏng: lúa & tiếp tế; mua quân, hàng đợi huấn luyện, xuất quân; đi theo đường (`steerTo()`); sương mù & tầm nhìn; công trình; chiếm cờ; chọn mục tiêu & sát thương; số liệu trận đấu (`stats.ts`); đội hình quân (`formation.ts`); đồn trú và phòng thủ cột cờ (`garrison.ts`); điều mỗi phe biết về địch cho lệnh tấn công (`knowledge.ts`); hang quái trung lập, quái, buff Lăng cổ (`creeps.ts`) | file tính năng cùng tên |
| `ai/` | `enemy.ts`, `attack.ts`, `camps.ts` | `runEnemyAI()` (kinh tế, chiếm cờ, tuyển quân); `runAttackPlan()` / `aiUnitGoal()` (tập kết, đợt tấn công, rút, phòng thủ; độ khó `aiLevel()`); `runCampPlan()` (đội dọn hang quái) | [ai-opponent.md](features/ai-opponent.md) |
| `net/` | `peer.ts`, `snapshot.ts` | Phòng PeerJS; gửi/nhận snapshot | [multiplayer.md](features/multiplayer.md) |
| `audio/` | `sound.ts`, `instruments.ts`, `synth.ts`, `music.ts` | Nhạc cụ tổng hợp; tiếng sự kiện dựng bằng code lúc tải (`synth.ts`); nhạc nền và tiếng môi trường tạo trực tiếp (`music.ts`); phát âm thanh (Web Audio: bus `ui` / `sfx` / `event` / `music` / `ambience`, định vị theo camera), `updateSoundscape()` biến thay đổi trạng thái trận thành tiếng | [audio.md](features/audio.md) |
| `render/` | `draw.ts`, `sprites.ts`, `terrain.ts`, `realm-decor.ts`, `settlements.ts`, `obstacles.ts`, `units.ts`, `buildings.ts`, `flags.ts`, `territory.ts`, `fog.ts`, `minimap.ts`, `intel.ts`, `fx.ts`, `paths.ts`, `creeps.ts` | Vẽ: `draw()` gọi các lớp theo thứ tự (gồm cầu, đường đi của quân đang chọn), cuối cùng là minimap | [rendering.md](features/rendering.md), [minimap.md](features/minimap.md) |
| `ui/` | `theme.ts`, `hud.ts`, `panels.ts`, `selection.ts`, `hotkeys.ts`, `input.ts`, `modeScreen.ts`, `settings.ts`, `results.ts`, `info.ts`, `formation.ts` | Ghi token lên `:root` thành biến CSS, `setFactionTheme()`; hộp Cài đặt (`SETTINGS_SCHEMA`); lọc lựa chọn theo loại và thanh quân (`selection.ts`); mở/đóng có hiệu ứng (`showAnimated()` / `hideAnimated()`); HUD nổi trên bản đồ; bảng Huấn luyện/Xây dựng, hướng dẫn, xác nhận rời trận, menu, tooltip, thông báo, chân dung quân; phím tắt kiểu Đế Chế (`hotkeys.ts`); chuột/phím/nút; màn hình chọn chế độ; bảng thống kê cuối trận (`results.ts`); bảng thông tin đang chọn (`info.ts`); bảng Đội hình (`formation.ts`) | [hud-ui.md](features/hud-ui.md), [controls.md](features/controls.md) |

Quy ước giữa các module (chi tiết ở [conventions.md](conventions.md)):
- **Biến dùng chung**: mỗi biến `let` có một module sở hữu. Module khác đọc trực tiếp (ES module luôn thấy giá trị mới nhất), nhưng muốn gán thì gọi setter của module sở hữu, vd. `setPaused(true)`, `setState(packet.state)`, `setZoom(z)`, `setNextId(nextId+1)`.
- **Hướng phụ thuộc mong muốn**: `config` ← `core/game`, `core/view` ← `map`, `sim` ← `ai`, `net`, `core/actions`, `core/match` ← `render`, `ui` ← `main.ts`. Ngoại lệ còn lại (có từ code gốc): `sim/*`, `net/*`, `core/actions` gọi `updateHUD()` (ui/hud); `net/peer` gọi màn hình chọn chế độ; `sim/combat` gọi `finish()`; `sim/units` gọi `requestAction()`; `core/match` gọi `draw()`, `buildWorldDecor()`, `endPlacement()`; `core/view` gọi `baseDir()`.
- **Code chạy lúc nạp module** chỉ để gán sự kiện, tạo canvas/sprite và dựng địa hình. Trận đầu tiên do `main.ts` khởi động sau khi mọi module đã nạp xong.

## Trạng thái toàn cục chính
- `state`: dữ liệu trận, tạo bởi `fresh()`:
  `mapId` (`'classic'|'realms'`, [realms-map.md](features/realms-map.md)), `resources[2] ({food, wood, stone, gold} theo team), supply[2], units[], bullets[], effects[], buildings[], regions[], camps[], creeps[], buffs[], bases[2], mines[], fogSeen, enemyFogSeen, enemyMemory, aiExploreTarget, pendingSpawns[], trainQueue[]`.
- Ngoài `state` (trong `core/game.ts`): `gameTime`, `paused`, `ended`, `gameStarted`, `mode` (`'ai'|'pvp'`), `netRole` (`'host'|'guest'|null`), `nextId`. Bộ đếm `aiTimer`, `incomeTimer`, `pendingSpawnRetryTimer`, `last`, `snapshotClock` nằm trong `core/match.ts`.
- Dữ liệu dẫn xuất (không trong `state`, không gửi qua mạng): `regionMap`, `regionEdges` (`map/regions.ts`), `regionTintCanvas` (`render/territory.ts`), `fogMask`/`fogVisible` (`render/fog.ts`) — dựng từ `state.regions` bằng `buildRegionMap()`/`ensureRegionMap()`; `showTerritory` (`ui/hud.ts`).
- Trạng thái UI cục bộ (không đồng bộ): `camX, camY, zoom` (`core/view.ts`), `selected`, `localSelectedIds`, `selectedFortress`, `selectedBuilding`, `placement`, `draggingFarm`, `dragSelect`.

## Vòng lặp
```
loop(ts) ─ dt = min(Δt, 0.05s)
  ├─ update(dt)      chỉ chạy khi gameStarted && !paused && !ended && không phải guest
  ├─ host PvP: mỗi 0.18s sendSnapshot()
  ├─ guest PvP: smoothGuestUnits(dt) cho quân trượt mượt giữa hai snapshot
  └─ draw()          luôn chạy (cả guest)
```
`update(dt)` (`core/match.ts`) theo thứ tự: đồng hồ → hàng đợi huấn luyện (`updateTraining()`) → hàng chờ xuất quân (mỗi 0.35s) → mỗi 1s: thu nhập pháo đài, lúa từ nông trại, tài nguyên từ mỏ theo chủ vùng, lúa duy trì/thiếu tiếp tế (`updateSupply()`) → AI (`runEnemyAI()`, mỗi 5s, chỉ chế độ AI) → chiếm cờ (`updateCaptures()`) rồi công trình: xây, nâng cấp, súng tháp/tiền đồn (`updateBuildings()`) → hang quái (`updateCreeps()`) → di chuyển & đánh của từng quân → đạn → pháo pháo đài → sương mù & trí nhớ AI → hiệu ứng → `updateHUD()`.

## Luồng lệnh
```
Nút / chuột / phím ─► requestAction(action, payload)
   ├─ guest PvP: conn.send({type:'action',...}) ─► host: applyAction(1, ...)
   └─ còn lại:   applyAction(localTeam(), ...)
```
Action hợp lệ: `buy {unit}`, `build {kind, x, y}`, `upgrade {kind: 'farm', id}`, `outpost {regionId}`, `moveFarm {id, x, y}`, `turret`, `buyLane` (mở thêm hàng đợi huấn luyện), `attack {ids}`, `stop {ids}`, `delete {ids}`, `move {ids, x, y}`, `pause {paused}`. Ngoại lệ: kéo nông trại ở host/AI và chọn quân/công trình sửa trực tiếp ở phía client (xem [controls.md](features/controls.md)).

## Camera & toạ độ
- `worldToScreenPlane()` / `screenPlaneToWorld()` hiện là hàm đồng nhất (góc nhìn từ trên xuống, chưa phải isometric thật); giữ lại làm điểm mở rộng.
- `viewOffsets()`, `worldToCanvas()`, `canvasPos()` đổi giữa toạ độ thế giới và canvas; `clampCamera()` giữ camera trong bản đồ.
- Thế giới cố định `WORLD_SIZE` = 9600 × 9600 (`TILE_SIZE` = 37,5), không phụ thuộc kích thước canvas. `syncWorldMetrics()` chạy khi resize và chỉ tính lại khung nhìn (`VIEW_W`, `VIEW_H`) và giới hạn zoom; host và guest khác cỡ màn hình vẫn dùng chung toạ độ.
