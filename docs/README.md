# Tài liệu Mini War

Tài liệu mô tả **hiện trạng** các cơ chế game, chia theo tính năng, để người và Claude Code đọc đúng phần cần thiết trước khi sửa code. Code trong `src/` (bảng module ở [architecture.md](architecture.md)) là nguồn đúng cuối cùng; nếu thấy lệch thì sửa tài liệu.

> Tải và chạy dự án: [guides/HUONG-DAN-CHAY-DU-AN.md](guides/HUONG-DAN-CHAY-DU-AN.md).
> Việc tồn đọng cho các phiên sau: [backlog.md](backlog.md).
> Mới dùng thư mục này? Đọc [guides/HUONG-DAN-SU-DUNG.md](guides/HUONG-DAN-SU-DUNG.md).

## Đọc gì trước
1. [architecture.md](architecture.md): các file, trạng thái toàn cục, vòng lặp, luồng lệnh, toạ độ.
2. [conventions.md](conventions.md): nguyên tắc sửa đổi, quy ước team, thuật ngữ.
   - [assets.md](assets.md): thư mục ảnh nhân vật và quy ước đặt tên file.
3. File tính năng liên quan trong bảng dưới.

## Danh sách tính năng
| Tính năng | File | Hàm / dữ liệu chính | Trạng thái |
|---|---|---|---|
| Luồng trận, chọn vị trí nhà, thắng/thua | [features/match-flow.md](features/match-flow.md) | `fresh()`, `update()`, `finish()`, `baseSiteClear()` | Đang có |
| Kinh tế: 4 tài nguyên, lúa duy trì | [features/economy.md](features/economy.md) | `state.resources`, `canAfford()`, `spend()`, `updateSupply()` | Đang có |
| Công trình: nông trại, tiền đồn, tháp | [features/buildings.md](features/buildings.md) | `BUILDING_TYPES`, `placeBuilding()`, `updateBuildings()` | Đang có |
| Vùng lãnh thổ, cột cờ có sẵn, chiếm cờ | [features/territory.md](features/territory.md) | `generateRegions()`, `updateCaptures()`, `drawFlag()`, `state.regions` | Đang có |
| Quân lính & xuất quân | [features/units.md](features/units.md) | `specs`, `buy()`, `spawn()`, `state.pendingSpawns` | Đang có |
| Pháo đài & pháo tích hợp | [features/fortress.md](features/fortress.md) | `buildTurret()`, `fortressGunPosition()`, `state.bases` | Đang có |
| Nông trại | [features/farms.md](features/farms.md) | `BUILDING_TYPES.farm`, `FARM_LEVELS`, kéo nông trại | Đang có |
| Chiến đấu | [features/combat.md](features/combat.md) | `nearestEnemy()`, `hurt()`, `state.bullets` | Đang có |
| Đối thủ AI | [features/ai-opponent.md](features/ai-opponent.md) | `runEnemyAI()`, `state.enemyMemory` | Đang có |
| Sương mù & tầm nhìn | [features/fog-of-war.md](features/fog-of-war.md) | `teamCanSee()`, `state.fogSeen`, `revealTeamVision()` | Đang có |
| Điều khiển, chọn quân, camera | [features/controls.md](features/controls.md) | sự kiện chuột/phím, `applyAction('move')` | Đang có |
| Chọn chế độ & chơi P2P | [features/multiplayer.md](features/multiplayer.md) | `createRoom()`, `joinRoom()`, snapshot | Cần kiểm thử |
| Bản đồ, địa hình, đồ hoạ | [features/rendering.md](features/rendering.md) | `buildTerrain()`, `draw()`, spritesheet | Đang có |
| HUD & giao diện | [features/hud-ui.md](features/hud-ui.md) | `config/theme.ts`, `updateHUD()`, `openPanel()`, `index.html` | Đang có |
| Bản đồ thu nhỏ | [features/minimap.md](features/minimap.md) | `drawMinimap()`, `minimapToWorld()` | Đang có |
| Vật cản & tìm đường | [features/pathfinding.md](features/pathfinding.md) | `findPath()`, `steerTo()`, `drawUnitPaths()` | Đang có |
| Hệ thống 4 tài nguyên & lãnh thổ | [features/resource-system.md](features/resource-system.md) | thiết kế gốc, quyết định, kế hoạch | Đang có |

## Cách cập nhật tài liệu
- **Thêm tính năng mới:** copy [_template.md](_template.md) thành `features/<ten-kebab-case>.md`, điền đủ các mục, thêm một dòng vào bảng trên.
- **Sửa hoặc cân bằng tính năng đã có:** sửa trực tiếp file của tính năng đó (thông số, hàm, checklist, ngày cập nhật). Không tạo file mới, không viết changelog riêng.
- **Thay đổi ảnh hưởng nhiều tính năng:** sửa mọi file liên quan và mục "Tương tác".
- **Đổi tên hoặc xoá hàm:** tìm tên hàm trong `docs/` và cập nhật mọi chỗ nhắc tới.
- Tham chiếu code bằng tên hàm/biến, không dùng số dòng.

## Lưu trữ
[archive/](archive/) chứa tài liệu tổng hợp cũ (12/10/2026) và bản HTML gốc. Chúng **đã lỗi thời** (còn nói về "tháp canh", "xe tăng", một file HTML duy nhất); chỉ dùng để tham khảo lịch sử.
