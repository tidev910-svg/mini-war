// @ts-nocheck
// Map generation (docs/features/territory.md): exactly 20 flag regions, one mine each, every resource near each fortress.
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });

describe('generated maps', () => {
  it('always have 20 flag regions, 2 home regions and one matching mine per flag region', () => {
    for (let k = 0; k < 8; k++) {
      g.fresh();
      const flags = g.state.regions.filter(r => r.cp), homes = g.state.regions.filter(r => r.home !== null);
      expect(flags).toHaveLength(g.REGION_COUNT);
      expect(homes).toHaveLength(2);
      for (const r of flags) expect(g.state.mines.filter(m => m.regionId === r.id && m.resource === r.resource)).toHaveLength(1);
      expect(g.state.mines.filter(m => g.state.regions[m.regionId].home !== null)).toHaveLength(0);
    }
  });

  it('give each fortress all four resources among its four nearest flags (walking cost)', () => {
    for (let k = 0; k < 8; k++) {
      g.fresh();
      const flags = g.state.regions.filter(r => r.cp), walk = g.state.bases.map(g.walkDistances);
      const tile = v => Math.max(1, Math.min(g.MAP_TILES - 2, Math.floor(v / g.TILE_SIZE)));
      for (const team of [0, 1]) {
        const cost = r => walk[team][tile(r.cp.y) * g.MAP_TILES + tile(r.cp.x)];
        const nearest = flags.slice().sort((a, b) => cost(a) - cost(b)).slice(0, 4);
        expect(new Set(nearest.map(r => r.resource)).size).toBe(4);
      }
    }
  });

  it('put the mines somewhere new every match, spread over the whole map', () => {
    const ranMaps = [];
    for (let k = 0; k < 8; k++) {
      g.fresh();
      const third = v => Math.min(2, Math.floor(v / g.W * 3));
      const perBlock = new Array(9).fill(0);
      for (const m of g.state.mines) perBlock[third(m.y) * 3 + third(m.x)]++;
      expect(Math.max(...perBlock)).toBeLessThanOrEqual(6);
      ranMaps.push(g.state.mines);
    }
    let same = 0, total = 0;
    for (let k = 1; k < ranMaps.length; k++) for (const m of ranMaps[k]) {
      total++;
      if (ranMaps[k - 1].some(p => Math.hypot(p.x - m.x, p.y - m.y) < 6 * g.TILE_SIZE)) same++;
    }
    expect(same / total).toBeLessThan(.35);
  });

  it('place the fortresses apart, on clear ground, facing each other', () => {
    for (let k = 0; k < 8; k++) {
      g.fresh();
      const [b0, b1] = g.state.bases;
      expect(Math.hypot(b0.x - b1.x, b0.y - b1.y)).toBeGreaterThanOrEqual(g.W * g.BASE_MIN_SEPARATION);
      expect(b0.dir).toBe(Math.sign(b1.x - b0.x || 1));
      expect(b1.dir).toBe(-b0.dir);
      expect(g.state.bases.every(g.baseSiteClear)).toBe(true);
    }
  });
});

// "Ngũ Vực" (docs/features/realms-map.md): five realms, each with its own monster camp, resources dealt out at random.
describe('Ngũ Vực map', () => {
  const tileAt = p => Math.floor(p.y / g.TILE_SIZE) * g.MAP_TILES + Math.floor(p.x / g.TILE_SIZE);
  const realmOf = p => g.tileRealm[tileAt(p)];
  const realmIdx = id => g.REALMS.findIndex(r => r.id === id);
  const play = id => { g.setSetting('mapKind', id); g.fresh(); };

  it('mirrors the ground left ↔ right and has no river bridges', () => {
    play('realms');
    const N = g.MAP_TILES; let diff = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N / 2; x++) if (g.terrainType[y * N + x] !== g.terrainType[y * N + N - 1 - x] || g.tileRealm[y * N + x] !== g.tileRealm[y * N + N - 1 - x]) diff++;
    expect(diff).toBe(0);
    expect(g.bridges).toHaveLength(0);
    expect(new Set(g.tileRealm).size).toBe(5);
  });

  it('deals the resources out over the realms: same totals, same type on both sides, all four near each fortress', () => {
    const seenIn = g.REALMS.map(() => new Set());
    for (let k = 0; k < 8; k++) {
      play('realms');
      const flags = g.state.regions.filter(r => r.cp), count = t => flags.filter(r => r.resource === t).length;
      expect([count('food'), count('wood'), count('stone'), count('gold')]).toEqual([6, 4, 4, 6]);
      for (const r of flags) {
        seenIn[r.realm].add(r.resource);
        const twin = flags.find(o => o.sgx === g.MAP_TILES - 1 - r.sgx && o.sgy === r.sgy);
        expect(twin.resource).toBe(r.resource);
      }
      const walk = g.state.bases.map(g.walkDistances);
      for (const team of [0, 1]) {
        const nearest = flags.slice().sort((a, b) => walk[team][tileAt(a.cp)] - walk[team][tileAt(b.cp)]).slice(0, 4);
        expect(new Set(nearest.map(r => r.resource)).size).toBe(4);
      }
    }
    for (const id of ['plains', 'forest', 'mountain', 'hills']) expect(seenIn[realmIdx(id)].size).toBeGreaterThan(1);
    expect([...seenIn[realmIdx('abyss')]]).toEqual(['gold']);
  });

  it('keeps every flag region in its realm, with mirrored fortresses and fair walking distances', () => {
    for (let k = 0; k < 6; k++) {
      play('realms');
      expect(g.state.mapId).toBe('realms');
      const flags = g.state.regions.filter(r => r.cp), [b0, b1] = g.state.bases;
      expect(flags).toHaveLength(g.REGION_COUNT);
      expect(Math.abs(b0.x + b1.x - g.W)).toBeLessThan(1);
      expect(b0.y).toBe(b1.y);
      expect([b0, b1].every(b => realmOf(b) === realmIdx('plains'))).toBe(true);
      for (const r of flags) expect(realmOf(r.cp)).toBe(r.realm);
      g.REALMS.forEach((realm, i) => expect(flags.filter(r => r.realm === i)).toHaveLength(realm.seeds * 2));
      // Both sides walk about as far to each resource (same check as the classic map).
      const walk = g.state.bases.map(g.walkDistances), cost = (r, t) => walk[t][tileAt(r.cp)];
      for (const type of g.REGION_TYPES) {
        const d = [0, 1].map(t => Math.min(...flags.filter(r => r.resource === type).map(r => cost(r, t))));
        expect(d.every(Number.isFinite)).toBe(true);
        expect(Math.abs(d[0] - d[1]) / Math.max(...d)).toBeLessThan(.15);
      }
    }
  });

  it('pays double gold at the abyss mines only', () => {
    play('realms');
    const rich = g.state.mines.filter(m => m.rich), abyss = realmIdx('abyss');
    expect(rich).toHaveLength(2);
    for (const m of rich) { expect(g.state.regions[m.regionId].realm).toBe(abyss); expect(m.income).toBeCloseTo(g.MINE_TYPES.gold.perSecond * g.RICH_GOLD_MULTIPLIER); }
    for (const m of g.state.mines.filter(m => !m.rich)) expect(m.income).toBeCloseTo(g.MINE_TYPES[m.resource].perSecond);
  });

  it("places each realm's own monster camp inside that realm, in mirrored pairs, the dragon's lair at the centre", () => {
    for (let k = 0; k < 4; k++) {
      play('realms');
      const camps = g.state.camps;
      for (const c of camps) expect(g.REALMS[realmOf(c)].camp).toBe(c.kind);
      const center = g.REALMS.find(r => r.centerCamp).camp;
      expect(camps.filter(c => c.kind === center)).toHaveLength(1);
      for (const kind of g.REALMS.filter(r => !r.centerCamp).map(r => r.camp)) {
        const list = camps.filter(c => c.kind === kind);
        expect(list.length).toBeGreaterThan(0);
        expect(list.length % 2).toBe(0);
        for (const c of list) expect(list.some(o => Math.abs(o.x + c.x - g.W) < 1 && o.y === c.y)).toBe(true);
      }
      // The monster grows with the worth of the ground: total camp hit points rise realm by realm.
      const hp = kind => Object.entries(g.CAMP_TYPES[kind].creeps).reduce((s, [t, n]) => s + g.CREEP_TYPES[t].hp * n, 0);
      const order = g.REALMS.map(r => hp(r.camp));
      expect(order.slice().sort((a, b) => a - b)).toEqual(order);
    }
  });

  it('has its own monsters in every realm, none of the classic camps, and every camp monster defined', () => {
    play('realms');
    const kinds = new Set(g.state.camps.map(c => c.kind));
    expect([...kinds].sort()).toEqual(['bears', 'boars', 'dragon', 'golem', 'spiders']);
    for (const def of Object.values(g.CAMP_TYPES)) for (const t of Object.keys(def.creeps)) expect(g.CREEP_TYPES[t]).toBeTruthy();
    // The dragon's lair, like the tomb, opens later and names the boss whose death gives the buff.
    expect(g.CAMP_TYPES.dragon.opensAt).toBe(g.CAMP_TYPES.tomb.opensAt);
    expect(g.CAMP_TYPES.dragon.bossName).toBeTruthy();
    expect(g.state.camps.find(c => c.kind === 'dragon').state).toBe('closed');
  });

  it('switches back to the classic map with the same ground as before', () => {
    play('classic');
    const before = g.terrainType.slice();
    play('realms'); play('classic');
    expect(g.state.mapId).toBe('classic');
    expect(g.terrainType.every((t, i) => t === before[i])).toBe(true);
    expect(g.bridges).toHaveLength(4);
    expect(g.tileRealm.every(v => v === -1)).toBe(true);
  });
});
