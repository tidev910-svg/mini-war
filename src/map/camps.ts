// @ts-nocheck
// Where the neutral camps stand (docs/features/neutral-camps.md). Called once by fresh() after the regions and mines are
// placed. Camps come in pairs, one nearer each fortress at mirrored walking distances (CAMP_LAYOUT), so neither side has
// the easier camps; the tomb stands about halfway between.
import { MAP_TILES, MIN_LAND_PATCH_TILES, TILE_SIZE } from '../config/map';
import { CAMP_LAYOUT, CAMP_PAIR_TOLERANCE, CAMP_SPACING, CAMP_TYPES } from '../config/creeps';
import { landPatchSizes, terrainType, walkDistances } from './terrain';

const shuffle = list => { for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } return list; };

export function placeCamps(blueBase, redBase, regions, mines) {
  const T = TILE_SIZE, N = MAP_TILES, bases = [blueBase, redBase], walk = bases.map(walkDistances), patch = landPatchSizes();
  const tileAt = (x, y) => Math.max(0, Math.min(N - 1, Math.floor(y / T))) * N + Math.max(0, Math.min(N - 1, Math.floor(x / T)));
  // Walking distance between the fortresses: the nearest reachable tile around the red fortress (it stands on its own tiles).
  let between = Infinity;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) between = Math.min(between, walk[0][tileAt(redBase.x + dx * T, redBase.y + dy * T)]);
  if (!Number.isFinite(between) || between <= 0) return [];
  const camps = [], far = (p, list, tiles) => list.every(q => Math.hypot(p.x - q.x, p.y - q.y) > tiles * T);
  const add = (kind, p) => camps.push({ id: camps.length + 1, kind, x: p.x, y: p.y, state: 'alive', respawnAt: 0, damage: [0, 0], seen: [null, null], awake: 0 });
  // Candidate spots every 3 tiles: open 3×3 ground on a large land patch, away from fortresses, flags and mines.
  const flags = regions.filter(r => r.cp).map(r => r.cp), spots = [];
  for (let gy = 3; gy < N - 3; gy += 3) for (let gx = 3; gx < N - 3; gx += 3) {
    let open = patch[gy * N + gx] >= MIN_LAND_PATCH_TILES;
    for (let dy = -1; dy <= 1 && open; dy++) for (let dx = -1; dx <= 1; dx++) { const t = terrainType[(gy + dy) * N + gx + dx]; if (t === 2 || t === 3) { open = false; break; } }
    if (!open) continue;
    const p = { x: (gx + .5) * T, y: (gy + .5) * T }, i = gy * N + gx;
    if (!far(p, bases, CAMP_SPACING.base) || !far(p, flags, CAMP_SPACING.flag) || !far(p, mines, CAMP_SPACING.mine)) continue;
    const d = [walk[0][i], walk[1][i]];
    if (d.every(Number.isFinite)) spots.push({ ...p, d });
  }
  const tol = CAMP_PAIR_TOLERANCE * between, share = s => Math.min(s.d[0], s.d[1]) / between;
  // Two points mirror each other when each is as far from one fortress as the other is from the other fortress.
  const mirrored = (a, b) => Math.abs(a.d[0] - b.d[1]) <= tol && Math.abs(a.d[1] - b.d[0]) <= tol;
  for (const { kind, pairs, band } of CAMP_LAYOUT) {
    if (kind === 'tomb') {
      // Single camp: of the open spots at least 35% of the way from both fortresses, one of the most even ones.
      const even = spots.filter(s => share(s) >= .35 && far(s, camps, CAMP_SPACING.camp)).sort((a, b) => Math.abs(a.d[0] - a.d[1]) - Math.abs(b.d[0] - b.d[1]));
      const pick = even.slice(0, 8)[Math.floor(Math.random() * Math.min(8, even.length))];
      if (pick) add(kind, pick);
      continue;
    }
    const inBand = spots.filter(s => share(s) >= band[0] && share(s) <= band[1]);
    for (let n = 0; n < pairs; n++) {
      const near = shuffle(inBand.filter(s => s.d[0] < s.d[1] && far(s, camps, CAMP_SPACING.camp)));
      let done = false;
      for (const a of near.slice(0, 120)) {
        const b = inBand.find(s => s.d[1] < s.d[0] && mirrored(a, s) && far(s, camps, CAMP_SPACING.camp) && Math.hypot(a.x - s.x, a.y - s.y) > CAMP_SPACING.camp * T);
        if (b) { add(kind, a); add(kind, b); done = true; break; }
      }
      if (!done) break;
    }
  }
  for (const c of camps) if (CAMP_TYPES[c.kind].opensAt) c.state = 'closed';
  return camps;
}
