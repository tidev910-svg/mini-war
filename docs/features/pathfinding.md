# Vật cản & tìm đường

> Trạng thái: Đang có · Cập nhật lần cuối: 2026-10-18

## Mô tả
Sông, hồ và vùng đá là **vật cản**: quân không đi xuyên qua được. Muốn sang bờ bên kia phải đi qua một trong 4 **cầu gỗ** bắc qua sông (một cầu nằm trên đường chính). Rừng, đồng cỏ, ruộng đi bình thường; cây và đá trang trí không chặn.

Mọi lần di chuyển (lệnh đi của người chơi, đuổi theo mục tiêu, AI đi chiếm cờ, đi xây, đi khám phá) đều theo đường do thuật toán tìm đường tính. **Quân chỉ biết những gì phe mình đã khám phá**: đi vào vùng mù thì đi thẳng; khi tầm nhìn của quân lộ ra nước/đá chắn ngang đường, quân tìm đường khác (vòng qua, hoặc qua cầu nếu đã biết cầu). Khi ra lệnh đi, điểm nhấp có **vòng sáng nhấp nháy**; với quân mình **đang chọn và đang đi**, bản đồ vẽ **đường đi nét đứt có mũi tên** từ quân tới đích (cờ nhỏ màu phe ở cuối), ngắn dần khi quân đi. Mỗi lệnh đi cho một nhóm chỉ vẽ một đường.

## Luật & thông số
| Thông số | Giá trị | Nguồn trong code |
|---|---|---|
| Ô đi được | Đồng cỏ, rừng, ruộng (`terrainType` 0, 1, 4) + ô cầu; nước (2) và đá (3) chặn | `walkable`, `buildWalkable()` |
| Cầu | 4 cầu ở hàng 14%, 36%, 53,5% (đường chính), 80% chiều cao bản đồ, mỗi cầu cao `BRIDGE_WIDTH_TILES` = 3 ô, phủ hết đoạn nước của hàng | `BRIDGE_ROWS`, `bridges`, `bridgeTiles` |
| Cầu gặp bờ đá | Mặt cầu kéo qua tối đa `BRIDGE_MAX_RAMP_TILES` = 10 ô đá; vẫn chưa tới đất thì cầu dời sang hàng gần nhất (trong `BRIDGE_ROW_SEARCH_TILES` = 12 ô) mà cả 3 hàng đều chạm đất hai bờ | `buildWalkable()` |
| Lưới lập đường | Theo hiểu biết của phe: ô đi được thật **hoặc chưa khám phá** = mở; nước/đá đã khám phá = chặn (`planGrid(known)`, `known` = `state.fogSeen` cho xanh, `state.enemyFogSeen` cho đỏ; `knownMap(team)`). Không truyền `known` = địa hình thật (dùng khi sinh bản đồ, đo công bằng) | `planGrid()`, `knownMap()` |
| Phát hiện vật cản | Mỗi `PATH_CHECK_SECONDS` = 0,4 giây kiểm tra lại các đoạn đường còn lại trên bản đồ đã khám phá mới nhất; có đoạn bị chắn → tìm đường lại (`u.replans` đếm số lần) | `steerTo()`, `pathStillOpen()` |
| Chặn vật lý | Bước kế tiếp rơi vào ô nước/đá thật (kể cả khi kế hoạch tưởng là mở) → dừng, tìm đường lại ở frame sau. Quân không bao giờ đứng trên ô chặn | `steerTo()` |
| Lưới tìm đường | 256 × 256 ô, 8 hướng (chéo √2), **không cắt góc** qua ô chặn | `astar()` |
| Heuristic | Octile | `astar()` |
| Giới hạn | `PATH_MAX_NODES` = 40.000 nút; hết giới hạn hoặc không tới được → đi tới ô gần đích nhất đã xét | `astar()` |
| Làm mượt | Bỏ điểm trung gian khi đoạn thẳng vẫn đi được (`lineWalkable()` lấy mẫu mỗi ¼ ô, chặn cả khe chéo giữa hai ô chặn) | `smooth()` |
| Đích trên nước/đá | Đã khám phá: dời tới ô mở gần nhất (tìm xoắn ốc tới 24 ô). Chưa khám phá: giữ nguyên, đến khi thấy thì dời | `nearestWalkable()` |
| Đường thẳng thông | Không chạy A*, đi thẳng | `findPath()` |
| Lệnh đi cho nhóm | Một đường A* từ tâm nhóm tới đích; mỗi quân nhập vào đường chung ở điểm xa nhất nhìn thẳng được, rồi tới ô đội hình của mình (ô rơi vào nước/đá dời tới ô đi được gần nhất). Các quân cùng lệnh có chung `u.moveGroup` | `groupPaths()`, `assignGroupMove()` |
| Đuổi mục tiêu | Đường đi được tính lại khi mục tiêu đã dịch quá `PATH_GOAL_TOLERANCE` = 1,5 ô, nhưng tối đa mỗi `PATH_REPATH_SECONDS` = 1 giây (nếu vẫn nhìn thẳng thấy thì chỉ dời điểm cuối) | `steerTo()` |
| AI | Việc vặt (khám phá, đứng cờ, xây) có điểm đến không tới được → bỏ, chọn điểm khác ở frame sau | `update()` |

Đo thử (Chrome headless, 2026-10-18): 30 quân cùng hành quân qua vùng mù → `update()` ~2,6 ms mỗi bước (gồm kiểm tra lại đường và tìm đường lại); `findPath()` trên địa hình đã biết hết trung bình 6–8 ms, chậm nhất ~50 ms (đường dài vòng cầu); lệnh đi 20 quân 4,7 ms; `flowField()` toàn bản đồ ~45 ms (giữ lại cho kiểm thử, không dùng cho lệnh đi).

**Sinh bản đồ** (`fresh()`): ngoài kiểm tra công bằng, lần sinh bị loại nếu từ sân tập kết xanh **không đi bộ tới được** sân tập kết đỏ, mọi cột cờ và mọi mỏ (`reachableFrom()`). `walkDistances()` (dùng xếp vùng gần nhà và đo công bằng) giờ là quãng đường đi bộ thật (chỉ qua ô đi được, có cầu).

**Hiển thị** (`src/render/paths.ts`):
- `drawUnitPaths()` vẽ **trên lớp sương mù** (ngay sau `drawFog()` và lượt viền 'over') để đường hành quân vào vùng mù vẫn thấy; chỉ là đường của quân mình nên không lộ gì của địch. Kiểu vẽ: viền tối 5 px + nét đứt vàng nhạt 2,5 px chạy chậm, mũi tên mỗi 3 ô, elip và cờ nhỏ màu phe ở điểm cuối. Độ dày theo pixel màn hình.
- Chỉ quân của `localTeam()`, đang được chọn, còn `u.path` và đang có lệnh `move` (hoặc đang di chuyển). Mỗi nhóm lệnh chỉ quân còn xa đích nhất vẽ.
- `showMoveMarker(x, y)` (gọi khi nhấp phải hoặc nhấp chọn điểm đến): hai vòng elip nở ra, mờ dần trong `MOVE_MARKER_SECONDS` = 1,2 giây.
- `drawBridges()`: mặt cầu gỗ, ván, lan can và cột; minimap vẽ cầu thành vạch nâu.

## Code liên quan
- [src/map/paths.ts](../../src/map/paths.ts): `planGrid()`, `pathStillOpen()`, `buildWalkable()`, `walkable`, `bridgeTiles`, `bridges`, `isWalkableAt()`, `nearestWalkable()`, `lineWalkable()`, `findPath()`, `groupPaths()`, `flowField()`, `pathFromField()`, `reachableFrom()`, `tileOf()`, `tileCenter()`; hằng số `PATH_MAX_NODES`, `BRIDGE_MAX_RAMP_TILES`, `BRIDGE_ROW_SEARCH_TILES`.
- [src/config/map.ts](../../src/config/map.ts): `BRIDGE_ROWS`, `BRIDGE_WIDTH_TILES`.
- [src/sim/movement.ts](../../src/sim/movement.ts): `steerTo()`, `assignGroupMove()`, `clearPath()`, `knownMap()`; `PATH_GOAL_TOLERANCE`, `PATH_REPATH_SECONDS`, `PATH_CHECK_SECONDS`.
- [src/core/match.ts](../../src/core/match.ts): ba chỗ di chuyển trong `update()` (AI, đuổi mục tiêu, lệnh `move`) gọi `steerTo()`; kiểm tra đi bộ tới được trong `fresh()`.
- [src/core/actions.ts](../../src/core/actions.ts): `applyAction('move')` xếp ô đội hình rồi `assignGroupMove()`.
- [src/map/terrain.ts](../../src/map/terrain.ts): `walkDistances()`.
- [src/render/paths.ts](../../src/render/paths.ts): `drawUnitPaths()`, `showMoveMarker()`, `drawBridges()`, `MOVE_MARKER_SECONDS`.
- Dữ liệu quân: `u.path` (mảng điểm thế giới còn phải đi), `u.goal`, `u.repath`, `u.pathCheck`, `u.replans`, `u.moveGroup`.

## Tương tác
- [units.md](units.md), [controls.md](controls.md): lệnh đi và đội hình.
- [combat.md](combat.md): đuổi mục tiêu theo đường đi.
- [ai-opponent.md](ai-opponent.md): AI di chuyển theo đường đi.
- [territory.md](territory.md): `walkDistances()` và kiểm tra đi tới được khi sinh bản đồ.
- [rendering.md](rendering.md): cầu, lớp đường đi; [minimap.md](minimap.md): cầu trên minimap.
- [fog-of-war.md](fog-of-war.md): bản đồ đã khám phá của mỗi phe là hiểu biết để lập đường.

## Multiplayer
Host tính đường (trong `applyAction('move')` và `update()`), cho phe khách thì theo `state.enemyFogSeen` mà host giữ (có thể lệch nhẹ với sương mù trên máy khách); `u.path`, `u.goal`, `u.moveGroup` nằm trong mỗi quân nên đi qua snapshot, khách vẽ đường đi của quân mình đang chọn từ dữ liệu đó. Lưới `walkable` dựng tất định từ địa hình ở mỗi máy (không gửi qua mạng).

## Kiểm thử thủ công
- [ ] Đầu trận (chưa khám phá), chọn quân, nhấp phải sang bờ bên kia sông → đường nét đứt thẳng tới đích (vẽ trên sương mù); quân đi thẳng, tới gần sông thì đường đổi, đi dọc bờ / qua cầu khi đã thấy cầu, không lội qua sông.
- [ ] Vùng đã khám phá hết (ví dụ đi lại lần hai) → đường vòng qua cầu ngay từ đầu.
- [ ] Nhấp phải vào giữa hồ / vùng đá → quân đi tới bờ gần nhất.
- [ ] Chọn nhiều quân → chỉ một đường cho cả nhóm, các quân tới ô đội hình riêng.
- [ ] Lệnh Tấn công: quân đuổi địch vòng qua vật cản.
- [ ] AI: quân đỏ đi chiếm cờ bên kia sông qua cầu.
- [ ] PvP: khách chọn quân, ra lệnh đi → thấy đường đi.
- Đã chạy thử 2026-10-18 (lập đường theo vùng đã khám phá): `pnpm test` thêm 2 test — chưa khám phá thì đường qua sông là một đoạn thẳng, khám phá hết thì vòng qua cầu; một quân trong vùng mù đi thẳng, tìm đường lại khi thấy sông, vẫn tới đích, 0 lần đứng trên ô chặn. `pnpm smoke path`: 6 quân qua sông trong vùng mù, có tìm đường lại, tới đích, 0 lần trên ô chặn. Ảnh: đường thẳng xuyên sương mù lúc ra lệnh, đổi hướng khi thấy vật cản.
- Đã chạy thử 2026-10-18 (bản đầu, biết hết bản đồ): `pnpm test` (8 test vật cản/tìm đường: không ô nước/đá nào đi được trừ cầu, mỗi cầu chạm đất hai đầu, bỏ cầu thì hai bờ không nối, đường qua cầu mọi đoạn đi được, đích trên nước dời vào bờ, 6 quân qua sông không lần nào đứng trên ô chặn); `pnpm smoke path` (6 quân tới đích bên kia sông sau ~88 s, 0 lần đứng trên ô chặn, một nhóm đường); AI 2 × 8 phút: >9.000 mẫu vị trí, 0 trên ô chặn; 20 quân hành quân tới nhà địch hết, 0 trên ô chặn; PvP: khách ra lệnh đi nhận đường trong snapshot.

## Giới hạn / việc tồn đọng
- Hiếm gặp (1 trong khoảng 6 lần chạy `pnpm smoke path` ngày 2026-10-18): trên một số bản đồ ngẫu nhiên, nhóm quân thử không tới đích sau 300 giây (đi thẳng không được, tìm lại đường 139 lần). Chưa tái hiện được bản đồ đó để tìm nguyên nhân.
- Quân không va chạm nhau (đi chồng lên nhau trên cầu).
- Đường đi không né công trình, pháo đài; công trình không chặn đường.
- Đường dài vòng cầu có thể mất ~50 ms một lần A* (lúc đuổi mục tiêu sau vật cản, tối đa 1 lần/giây mỗi quân).
- Vị trí cầu cố định theo địa hình (không ngẫu nhiên mỗi trận).
- Đi vào vùng mù có thể phải đi dọc bờ sông/hồ khá xa trước khi thấy cầu (đúng ý thiết kế, nhưng tốn thời gian hơn bản biết hết bản đồ).
- Mỗi lần kiểm tra lại đường dựng lại lưới lập đường 65.536 ô (~0,1 ms); quân rất đông có thể tốn vài ms mỗi bước.
