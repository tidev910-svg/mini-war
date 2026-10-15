# Kiến trúc code

> Cập nhật lần cuối: 2026-10-15

## Công nghệ & file
| File | Vai trò |
|---|---|
| [index.html](../index.html) | Khung giao diện: màn hình chọn chế độ/phòng (`#modeScreen`), HUD, canvas `#game`, nút điều khiển, nhật ký, overlay kết quả. |
| [src/main.ts](../src/main.ts) | **Toàn bộ** logic game trong một IIFE (~1250 dòng, `// @ts-nocheck`): mô phỏng, AI, vẽ, input, mạng. |
| [src/style.css](../src/style.css) | Theme "Storybook", bố cục, responsive, lobby. |
| [public/assets/](../public/assets/) | Spritesheet quân, sprite pháo đài & nông trại (đường dẫn `/assets/...`). |
| [package.json](../package.json) | Vite 6 + TypeScript 5. `pnpm dev`, `pnpm build` (`tsc --noEmit && vite build`), `pnpm preview`. |
| [start-game.bat](../start-game.bat) | Mở nhanh trên Windows: chạy Vite ở cổng 5173 rồi mở trình duyệt. |

PeerJS **không** nằm trong `package.json`; nó được tải từ CDN lúc chạy bởi `ensurePeerJs()`.

## Thứ tự các phần trong `src/main.ts`
1. Kích thước thế giới, camera, `syncWorldMetrics()`.
2. Địa hình: `buildTerrain()` → `terrainType` (Uint8Array 256×256) và `resourceTiles`.
3. Biến trạng thái toàn cục, bảng `specs`, nạp sprite.
4. Tiện ích team/tài nguyên, lobby & mạng (`createRoom()`, `joinRoom()`, `setupConnection()`, snapshot).
5. `requestAction()` / `applyAction()`: cửa vào duy nhất cho lệnh người chơi.
6. Tầm nhìn, pháo đài, `fresh()` (tạo trận mới).
7. Xuất quân, mua quân, nông trại, nâng cấp pháo đài, lệnh tấn công.
8. HUD (`updateHUD()`), chọn mục tiêu & sát thương (`nearestEnemy()`, `hurt()`), `finish()`.
9. `update(dt)`: một bước mô phỏng.
10. Các hàm vẽ `draw*()` và `draw()`.
11. `loop()`, gán sự kiện nút / chuột / bàn phím, rồi `fresh(); gameStarted=false; requestAnimationFrame(loop)`.

## Trạng thái toàn cục chính
- `state`: dữ liệu trận, tạo bởi `fresh()`:
  `gold, energy, enemyGold, enemyEnergy, units[], bullets[], effects[], farms[], guards[], bases[2], mines[3], fogSeen, enemyFogSeen, enemyMemory, aiExploreTarget, pendingSpawns[]`.
- Ngoài `state`: `gameTime`, `paused`, `ended`, `gameStarted`, `mode` (`'ai'|'pvp'`), `netRole` (`'host'|'guest'|null`), `nextId`, các bộ đếm `aiTimer`, `incomeTimer`, `pendingSpawnRetryTimer`.
- Trạng thái UI cục bộ (không đồng bộ): `camX, camY, zoom`, `selected`, `localSelectedIds`, `selectedFortress`, `farmPlacement`, `draggingFarm`, `dragSelect`.

## Vòng lặp
```
loop(ts) ─ dt = min(Δt, 0.05s)
  ├─ update(dt)      chỉ chạy khi gameStarted && !paused && !ended && không phải guest
  ├─ host PvP: mỗi 0.18s sendSnapshot()
  └─ draw()          luôn chạy (cả guest)
```
`update(dt)` theo thứ tự: đồng hồ & mở khoá xuất quân → hàng chờ xuất quân (mỗi 0.35s) → thu nhập & mỏ (mỗi 1s) → AI mua quân (mỗi 5s, chỉ chế độ AI) → di chuyển & đánh của từng quân → đạn → pháo pháo đài → quái canh mỏ → sương mù & trí nhớ AI → hiệu ứng → `updateHUD()`.

## Luồng lệnh
```
Nút / chuột / phím ─► requestAction(action, payload)
   ├─ guest PvP: conn.send({type:'action',...}) ─► host: applyAction(1, ...)
   └─ còn lại:   applyAction(localTeam(), ...)
```
Action hợp lệ: `buy`, `farm`, `placeFarm`, `turret`, `attack`, `move`, `pause`, `moveFarm`. Ngoại lệ: kéo nông trại ở host/AI và chọn quân sửa trực tiếp `state` ở phía client (xem [controls.md](features/controls.md)).

## Camera & toạ độ
- `worldToScreenPlane()` / `screenPlaneToWorld()` hiện là hàm đồng nhất (góc nhìn từ trên xuống, chưa phải isometric thật); giữ lại làm điểm mở rộng.
- `viewOffsets()`, `worldToCanvas()`, `canvasPos()` đổi giữa toạ độ thế giới và canvas; `clampCamera()` giữ camera trong bản đồ.
- `syncWorldMetrics()` chạy khi resize và tính lại `W`, `H`, `TILE_SIZE` theo kích thước canvas. **Cảnh báo:** đổi kích thước cửa sổ giữa trận làm đổi `W/H` trong khi `state` vẫn giữ toạ độ cũ.
