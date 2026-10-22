// @ts-nocheck
// Neutral camps (docs/features/neutral-camps.md): mirrored placement, waking, leash, healing, clearing and rewards,
// respawn, guard camps blocking flags, the tomb and its buff, the AI's camp squads, and the snapshot.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
afterAll(() => { g.setSetting('aiDifficulty', 'normal'); g.setMode('test'); });
const step = (seconds, dt = 0.05) => { for (let k = 0; k < Math.round(seconds / dt); k++) g.update(dt); };
function quietSpot(state, away = 1300) {
  for (let y = 900; y < g.H - 900; y += 250) for (let x = 900; x < g.W - 900; x += 250) {
    if (state.bases.every(b => Math.hypot(b.x - x, b.y - y) > away) && state.regions.every(r => !r.cp || Math.hypot(r.cp.x - x, r.cp.y - y) > 900)
      && [[0, 0], [400, 0], [-400, 0], [0, 400], [0, -400]].every(([dx, dy]) => g.isWalkableAt(x + dx, y + dy))) return { x, y };
  }
  throw new Error('no quiet spot');
}
const put = (team, type, p) => { const u = g.spawn(team, type); u.x = p.x; u.y = p.y; u.order = 'hold'; return u; };
const camp = (state, kind, p, extra = {}) => { const c = { id: state.camps.length + 1, kind, x: p.x, y: p.y, regionId: null, state: 'alive', respawnAt: 0, damage: [0, 0], seen: [null, null], awake: 0, ...extra }; state.camps.push(c); g.initCamps(); return c; };
const monsters = c => g.state.creeps.filter(m => m.camp === c.id);
const feed = () => [...document.getElementById('feed').children].map(e => e.textContent).join('\n');

describe('placement', () => {
  it('puts camps in mirrored pairs at equal walking distances, away from the fortresses, plus one tomb', () => {
    for (let k = 0; k < 3; k++) {
      g.fresh();
      const s = g.state, walk = s.bases.map(b => g.walkDistances(b)), T = g.TILE_SIZE, N = g.MAP_TILES;
      const d = (p, team) => walk[team][Math.floor(p.y / T) * N + Math.floor(p.x / T)];
      let between = Infinity; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) between = Math.min(between, d({ x: s.bases[1].x + dx * T, y: s.bases[1].y + dy * T }, 0));
      expect(s.camps.filter(c => c.kind === 'tomb')).toHaveLength(1);
      expect(s.camps.filter(c => c.kind === 'wolves')).toHaveLength(4);
      for (const c of s.camps) {
        expect(s.bases.every(b => Math.hypot(b.x - c.x, b.y - c.y) > 20 * T)).toBe(true);
        if (c.kind === 'tomb') { expect(c.state).toBe('closed'); continue; }
        const tol = (c.kind === 'guard' ? .12 : .06) * between + 1;
        const twin = s.camps.find(o => o !== c && o.kind === c.kind && Math.abs(d(c, 0) - d(o, 1)) <= tol && Math.abs(d(c, 1) - d(o, 0)) <= tol);
        expect(twin, `${c.kind} ${c.id} has a mirrored twin`).toBeTruthy();
        if (c.kind === 'guard') expect(s.regions[c.regionId].cp).toMatchObject({ x: c.x, y: c.y });
      }
      // Every open camp starts full; the tomb's monsters only appear when it opens.
      for (const c of s.camps) expect(monsters(c).length > 0).toBe(c.state === 'alive');
    }
  });
});

describe('monsters', () => {
  it('sleep until a unit comes close, then the whole camp fights it', () => {
    const state = quietMatch(g), p = quietSpot(state), c = camp(state, 'wolves', p);
    const far = put(0, 'infantry', { x: p.x + 260, y: p.y });
    step(1);
    expect(c.awake).toBe(0); expect(far.hp).toBe(far.max);
    far.x = p.x + 120; step(.2);
    expect(c.awake).toBeGreaterThan(0);
    expect(monsters(c).every(m => m.target === far.id)).toBe(true);
  });

  it('never follow past the leash, then walk home and heal', () => {
    const state = quietMatch(g), p = quietSpot(state), c = camp(state, 'troll', p), troll = monsters(c)[0];
    const archer = put(0, 'archer', { x: p.x + 290, y: p.y });
    g.hurt(troll, 100, 0, 'archer'); // a shot from range wakes it
    let farthest = 0;
    for (let i = 0; i < 100; i++) { g.update(.05); farthest = Math.max(farthest, Math.hypot(troll.x - p.x, troll.y - p.y)); archer.x = p.x + 290; archer.y = p.y; }
    expect(farthest).toBeLessThanOrEqual(g.CAMP_TYPES.troll.leash + .5);
    archer.x = p.x + 2000; step(8);
    expect(Math.hypot(troll.x - troll.homeX, troll.y - troll.homeY)).toBeLessThan(10);
    expect(troll.hp).toBe(troll.max);
  });

  it('units on hold next to a sleeping camp leave it alone; the attack order does not march into camps', () => {
    const state = quietMatch(g), p = quietSpot(state), c = camp(state, 'wolves', p);
    const u = put(0, 'cavalry', { x: p.x + 250, y: p.y });
    g.applyAction(0, 'attack', { ids: [u.id] }); step(3);
    expect(Math.hypot(u.x - p.x - 250, u.y - p.y)).toBeLessThan(25);
    expect(monsters(c).every(m => m.hp === m.max)).toBe(true);
  });
});

describe('clearing', () => {
  it('a camp order walks the units there and clears it; the reward goes to the side that did most damage', () => {
    const state = quietMatch(g), p = quietSpot(state), c = camp(state, 'wolves', p);
    const units = [0, 1, 2, 3, 4, 5].map(i => put(0, 'spearman', { x: p.x - 600, y: p.y - 60 + i * 24 }));
    const food = state.resources[0].food, redFood = state.resources[1].food;
    g.applyAction(0, 'camp', { ids: units.map(u => u.id), campId: c.id });
    expect(units.every(u => u.order === 'camp')).toBe(true);
    step(60);
    expect(c.state).toBe('cleared');
    expect(c.winner).toBe(0);
    expect(state.resources[0].food - food).toBeGreaterThanOrEqual(g.CAMP_TYPES.wolves.reward.food);
    expect(state.resources[1].food - redFood).toBeLessThan(100); // only its fortress income (40/min)
    expect(units.filter(u => u.hp > 0).every(u => u.order === 'hold' && u.campTarget == null)).toBe(true);
    expect(state.stats.sides[0].camps).toBe(1);
  });

  it('most damage wins, not the last hit', () => {
    const state = quietMatch(g), p = quietSpot(state), c = camp(state, 'wolves', p), list = monsters(c), last = list.pop();
    for (const m of list) g.hurt(m, 999, 1, 'infantry');
    g.hurt(last, 999, 0, 'infantry');
    const gold = state.resources[1].food; g.update(.05);
    expect(c.winner).toBe(1);
    expect(state.resources[1].food - gold).toBeGreaterThanOrEqual(g.CAMP_TYPES.wolves.reward.food);
  });

  it('fills again after the respawn time, but not while a unit stands within its leash', () => {
    const state = quietMatch(g), p = quietSpot(state), c = camp(state, 'wolves', p);
    for (const m of monsters(c)) g.hurt(m, 999, 0, 'infantry');
    g.update(.05); expect(c.state).toBe('cleared');
    const watcher = put(0, 'scout', { x: p.x + 100, y: p.y });
    g.setGameTime(c.respawnAt + 1); g.update(.05);
    expect(c.state).toBe('cleared');
    watcher.x = p.x + 3000; g.update(.05);
    expect(c.state).toBe('alive'); expect(monsters(c)).toHaveLength(g.CAMP_TYPES.wolves.creeps.wolf);
  });
});

describe('guard camps', () => {
  it('keep their flag from being captured until cleared', () => {
    const state = quietMatch(g), r = state.regions.find(x => x.cp && x.owner < 0);
    const c = camp(state, 'guard', r.cp, { regionId: r.id });
    const units = [0, 1, 2].map(i => put(0, 'cavalry', { x: r.cp.x + i * 20, y: r.cp.y + 20 }));
    for (const u of units) { u.max = u.hp = 1e6; }
    g.update(.05); g.update(.05);
    expect(g.campGuarding(r.id)).toBe(true);
    expect(r.cap).toBe(0);
    expect(feed()).toContain('đồn cướp canh giữ');
    for (const m of monsters(c)) g.hurt(m, 9999, 0, 'cavalry');
    g.update(.05); expect(g.campGuarding(r.id)).toBe(false);
    step(3); expect(r.cap).toBeGreaterThan(0);
  });
});

describe('the tomb', () => {
  it('opens at its time; beating it gives the side +damage and +speed for its buff time', () => {
    const state = quietMatch(g), p = quietSpot(state), c = camp(state, 'tomb', p, { state: 'closed' });
    expect(monsters(c)).toHaveLength(0);
    const def = g.CAMP_TYPES.tomb;
    g.setGameTime(def.opensAt - .5); g.update(1);
    expect(c.state).toBe('alive'); expect(monsters(c).some(m => m.creep === 'boss')).toBe(true);
    expect(g.isTeamAreaExplored(0, p.x, p.y) && g.isTeamAreaExplored(1, p.x, p.y)).toBe(true); // announced to both sides
    for (const m of monsters(c)) g.hurt(m, 1e5, 0, 'cavalry');
    g.update(.05);
    expect(g.buffFactor(0, 'damage')).toBeCloseTo(1 + def.buff.damage);
    expect(g.buffFactor(0, 'speed')).toBeCloseTo(1 + def.buff.speed);
    expect(g.buffFactor(1, 'damage')).toBe(1);
    const q = quietSpot(state), foe = put(1, 'infantry', { x: q.x + 2000, y: q.y });
    g.hurt(foe, 10, 0, 'infantry');
    expect(foe.max - foe.hp).toBeCloseTo(10 * (1 + def.buff.damage));
    g.setGameTime(g.gameTime + def.buff.seconds + 1); g.update(.05);
    expect(g.buffFactor(0, 'damage')).toBe(1);
  });
});

describe('AI', () => {
  const setup = level => {
    const state = quietMatch(g); g.setMode('ai'); g.setSetting('aiDifficulty', level);
    const p = quietSpot(state), c = camp(state, 'wolves', p); c.seen[1] = 'alive';
    const home = state.bases[1];
    const army = Array.from({ length: 10 }, (_, i) => put(1, 'infantry', { x: home.x + 150 + (i % 5) * 25, y: home.y + 120 + Math.floor(i / 5) * 25 }));
    return { state, c, army };
  };
  it('a hard AI sends a squad to a camp it has seen, and calls it back when cleared', () => {
    const { state, c, army } = setup('hard');
    g.runCampPlan();
    const squad = army.filter(u => u.aiRole === 'camp');
    expect(squad.length).toBe(g.AI_CAMP_SQUAD.wolves + 1);
    expect(state.aiPlan.camp).toBe(c.id);
    for (const m of monsters(c)) g.hurt(m, 999, 1, 'infantry');
    g.update(.05); g.runCampPlan();
    expect(army.some(u => u.aiRole === 'camp')).toBe(false);
    expect(state.aiPlan.camp).toBe(null);
    g.setMode('test');
  });
  it('an easy AI leaves camps alone, and no AI knows a camp it has not seen', () => {
    let { army, c } = setup('easy');
    g.runCampPlan(); expect(army.some(u => u.aiRole === 'camp')).toBe(false);
    ({ army, c } = setup('hard')); c.seen[1] = null;
    g.runCampPlan(); expect(army.some(u => u.aiRole === 'camp')).toBe(false);
    g.setMode('test');
  });
});

it('camps, monsters and buffs travel in the snapshot', () => {
  const state = quietMatch(g), p = quietSpot(state); camp(state, 'bandits', p);
  const snap = g.serializeSnapshot().state;
  expect(snap.camps).toHaveLength(1);
  expect(snap.creeps).toHaveLength(5);
  expect(JSON.parse(JSON.stringify(snap)).creeps[0]).toMatchObject({ creep: 'bandit', team: 2 });
});
