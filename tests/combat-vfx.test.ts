// Combat presentation events are render-only: changing the display option must not change simulation results.
import { beforeAll, describe, expect, it } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';
import { cavalryAttackFrameRect, cavalryDirectionFromAngle, cavalryMotionFrameRect, spearmanAttackClip, spearmanAttackFrameRect } from '../src/render/sprites';

let g;
beforeAll(async () => { g = await loadGame(); });

function pair(attackerType) {
  const state = quietMatch(g);
  const attacker = { id: 7001, team: 0, type: attackerType, x: 5000, y: 5000, hp: g.specs[attackerType].hp, max: g.specs[attackerType].hp, attackTimer: 0, order: 'hold', moving: false, walk: 0 };
  const target = { id: 7002, team: 1, type: 'infantry', x: attacker.x + 25, y: attacker.y, hp: 1000, max: 1000, attackTimer: 4, order: 'hold', moving: false, walk: 0 };
  state.units = [attacker, target];
  return { state, attacker, target };
}

describe('Combat VFX isolation', () => {
  it('draws each Spearman attack direction from one square atlas cell for both teams', () => {
    const width = 4 * 256, height = spearmanAttackClip.rows * 256;
    for (let team = 0; team < 2; team++) for (let direction = 0; direction < 4; direction++) for (let frame = 0; frame < 4; frame++) {
      const rect = spearmanAttackFrameRect(width, height, frame, team, direction);
      expect(rect).toEqual({ sx: frame * 256, sy: (team * 4 + direction) * 256, sw: 256, sh: 256 });
    }
  });

  it('maps every Cavalry motion and attack frame to its own team and facing cell', () => {
    const motionWidth=1086,motionHeight=1448,attackWidth=872,attackHeight=1448;
    for(let team=0;team<2;team++)for(let direction=0;direction<4;direction++){
      for(let column=0;column<5;column++)expect(cavalryMotionFrameRect(motionWidth,motionHeight,team,direction,column)).toEqual({sx:column*217.2,sy:(team*4+direction)*181,sw:217.2,sh:181});
      for(let frame=0;frame<4;frame++)expect(cavalryAttackFrameRect(attackWidth,attackHeight,frame,team,direction)).toEqual({sx:frame*218,sy:(team*4+direction)*181,sw:218,sh:181});
    }
    expect([0,Math.PI/2,Math.PI,-Math.PI/2].map(cavalryDirectionFromAngle)).toEqual([3,0,1,2]);
  });

  it('emits one render event with the real melee hit and preserves damage', () => {
    for (const type of ['scout', 'infantry', 'spearman', 'archer', 'cavalry']) {
      const { state, attacker, target } = pair(type);
      g.update(.016);
      expect(state.visualEvents.filter(e => e.unitId === attacker.id && e.kind === 'attack')).toHaveLength(1);
      if (type === 'archer') expect(state.bullets.filter(b => b.unitId === attacker.id)).toHaveLength(1);
      else {
        expect(target.hp).toBe(1000 - g.specs[type].damage);
        expect(state.effects.some(e => e.targetUnitId === target.id)).toBe(true);
      }
    }
  });

  it('starts the Cavalry lance pose before the existing hit and applies damage once at the original hit tick', () => {
    const {state,attacker,target}=pair('cavalry');attacker.attackTimer=.27;
    g.update(.016);
    const windup=state.visualEvents.find(e=>e.unitId===attacker.id&&e.kind==='attackWindup'&&e.unitType==='cavalry');
    expect(windup).toMatchObject({targetUnitId:target.id,angle:0});
    expect(target.hp).toBe(1000);
    g.update(.20);
    g.update(.06);
    const hit=state.visualEvents.find(e=>e.unitId===attacker.id&&e.kind==='attack'&&e.unitType==='cavalry');
    expect(hit?.actionId).toBe(windup.actionId);
    expect(target.hp).toBe(1000-g.specs.cavalry.damage);
  });

  it('keeps exactly one existing gameplay arrow when archer pose events are emitted', () => {
    const { state, attacker } = pair('archer');
    g.update(.016);
    expect(state.bullets.filter(b => b.unitId === attacker.id)).toHaveLength(1);
    expect(state.bullets.find(b => b.unitId === attacker.id)).toMatchObject({ damage: g.specs.archer.damage, speed: 280 });
    expect(state.bullets.find(b => b.unitId === attacker.id).life).toBeCloseTo(2 - .016, 3);
    expect(state.visualEvents.filter(e => e.unitId === attacker.id)).toHaveLength(1);
  });

  it('starts Archer aim/draw before the shot and cancels safely when the target disappears', () => {
    const { state, attacker, target } = pair('archer');
    attacker.attackTimer = .35;
    g.setSetting('combatVfxEnabled', false);
    g.update(.016);
    const windup = state.visualEvents.find(e => e.unitId === attacker.id && e.kind === 'attackWindup');
    expect(windup).toMatchObject({ unitType: 'archer', targetUnitId: target.id });
    expect(state.bullets.filter(b => b.unitId === attacker.id)).toHaveLength(0);
    expect(target.hp).toBe(1000);
    g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('aim');
    target.hp = 0;
    g.update(.016);
    expect(state.visualEvents.some(e => e.unitId === attacker.id && e.kind === 'attackCancel' && e.actionId === windup.actionId)).toBe(true);
    expect(state.bullets.filter(b => b.unitId === attacker.id)).toHaveLength(0);
    g.setSetting('combatVfxEnabled', true);
  });

  it('plays the Archer pose sequence through aim, draw, release and recovery', async () => {
    const { state, attacker, target } = pair('archer');
    attacker.attackTimer = .35;
    g.update(.016);
    const windup = state.visualEvents.find(e => e.unitId === attacker.id && e.kind === 'attackWindup');
    const tick = ms => new Promise(resolve => setTimeout(resolve, ms));
    g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('aim');
    await tick(115); g.updateFx(() => true);
    await tick(16); g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('draw');
    state.visualEvents.push({ id: 99102, kind: 'attack', unitId: attacker.id, unitType: 'archer', team: 0, x: attacker.x, y: attacker.y, targetUnitId: target.id, actionId: windup.actionId, angle: 0, life: .20, max: .20 });
    g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('release');
    await tick(80); g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('recovery');
    await tick(110); g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('recovery');
    await tick(110); g.updateFx(() => true);
    g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker)?.action).toBeFalsy();
  });
  it('releases each directional projectile from its matching nocked-arrow tip anchor', () => {
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const { state, attacker, target } = pair('archer');
      attacker.attackTimer = 0;
      target.x = attacker.x + dx * 80;
      target.y = attacker.y + dy * 80;
      const angle = Math.atan2(target.y - attacker.y, target.x - attacker.x);
      const anchor = g.archerReleaseAnchor(attacker, angle);
      const travel = Math.hypot(target.x - anchor.x, target.y - anchor.y), vx = (target.x - anchor.x) / travel, vy = (target.y - anchor.y) / travel;
      g.update(.016);
      const bullet = state.bullets.find(b => b.unitId === attacker.id);
      expect(bullet).toBeTruthy();
      // The simulation advances the existing 280-unit/s projectile once in its firing tick.
      expect(bullet.x).toBeCloseTo(anchor.x + vx * 280 * .016, 2);
      expect(bullet.y).toBeCloseTo(anchor.y + vy * 280 * .016, 2);
      expect(bullet.speed).toBe(280);
      expect(bullet.damage).toBe(g.specs.archer.damage);
    }
  });

  it('lets multiple Archers release simultaneously and preserves the established shot cadence', () => {
    const state = quietMatch(g);
    const makeArcher = (id, y) => ({ id, team: 0, type: 'archer', x: 5000, y, hp: 65, max: 65, attackTimer: 0, order: 'hold', moving: false, walk: 0 });
    const a = makeArcher(7101, 4980), b = makeArcher(7102, 5020);
    const target = { id: 7103, team: 1, type: 'infantry', x: 5080, y: 5000, hp: 10000, max: 10000, attackTimer: 4, order: 'hold', moving: false, walk: 0 };
    state.units = [a, b, target];
    g.update(.016);
    expect(state.bullets.filter(q => q.attackerType === 'archer')).toHaveLength(2);
    const shots = new Set();
    for (const e of state.visualEvents) if (e.kind === 'attack' && e.unitType === 'archer') shots.add(e.unitId + ':' + e.id);
    for (let i = 0; i < 67; i++) {
      g.update(.016);
      for (const e of state.visualEvents) if (e.kind === 'attack' && e.unitType === 'archer') shots.add(e.unitId + ':' + e.id);
    }
    expect([...shots].filter(x => x.startsWith(a.id + ':'))).toHaveLength(2);
    expect([...shots].filter(x => x.startsWith(b.id + ':'))).toHaveLength(2);
    expect(state.bullets.filter(q => q.attackerType === 'archer')).toHaveLength(2);
  });

  it('starts infantry wind-up before the existing hit and applies damage only at the hit tick', () => {
    const { state, attacker, target } = pair('infantry');
    attacker.attackTimer = .21;
    const hp = target.hp;
    g.update(.016);
    expect(state.visualEvents.filter(e => e.unitId === attacker.id && e.kind === 'attackWindup')).toHaveLength(1);
    expect(state.visualEvents.some(e => e.unitId === attacker.id && e.kind === 'attack')).toBe(false);
    expect(target.hp).toBe(hp);
    for (let i = 0; i < 13; i++) g.update(.016);
    expect(state.visualEvents.filter(e => e.unitId === attacker.id && e.kind === 'attack')).toHaveLength(1);
    expect(target.hp).toBe(hp - g.specs.infantry.damage);
  });

  it('cancels an infantry wind-up safely if its target dies before the hit', () => {
    const { state, attacker, target } = pair('infantry');
    attacker.attackTimer = .21;
    g.update(.016);
    target.hp = 0;
    g.update(.016);
    expect(state.visualEvents.some(e => e.unitId === attacker.id && e.kind === 'attackCancel')).toBe(true);
    expect(state.visualEvents.some(e => e.unitId === attacker.id && e.kind === 'attack')).toBe(false);
  });

  it('advances the infantry render action from wind-up to impact on the hit event', () => {
    const { state, attacker } = pair('infantry');
    attacker.attackTimer = .21;
    g.update(.016);
    const windup = state.visualEvents.find(e => e.unitId === attacker.id && e.kind === 'attackWindup');
    g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('windup');
    state.visualEvents.push({ id: 99001, kind: 'attack', unitId: attacker.id, unitType: 'infantry', team: 0, x: attacker.x, y: attacker.y, actionId: windup.actionId, angle: 0, life: .20, max: .20 });
    g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('impact');
  });

  it('starts Spearman wind-up, cancels when its target disappears, and leaves damage for the real hit tick', () => {
    const { state, attacker, target } = pair('spearman');
    attacker.attackTimer = .23;
    const hp = target.hp;
    g.setSetting('combatVfxEnabled', false);
    g.update(.016);
    const windup = state.visualEvents.find(e => e.unitId === attacker.id && e.kind === 'attackWindup');
    expect(windup).toMatchObject({ unitType: 'spearman', targetUnitId: target.id });
    expect(target.hp).toBe(hp);
    g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('windup');
    target.hp = 0;
    g.update(.016);
    expect(state.visualEvents.some(e => e.unitId === attacker.id && e.kind === 'attackCancel' && e.actionId === windup.actionId)).toBe(true);
    expect(state.visualEvents.some(e => e.unitId === attacker.id && e.kind === 'attack')).toBe(false);
    g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker)?.action).toBeFalsy();
    g.setSetting('combatVfxEnabled', true);
  });

  it('shows the Spearman impact at the existing hit event and applies exactly one normal hit', () => {
    const { state, attacker, target } = pair('spearman');
    const hp = target.hp;
    g.update(.016);
    const hit = state.visualEvents.find(e => e.unitId === attacker.id && e.kind === 'attack');
    expect(hit).toMatchObject({ unitType: 'spearman', targetUnitId: target.id });
    expect(target.hp).toBe(hp - g.specs.spearman.damage);
    g.updateFx(() => true);
    expect(g.unitCombatVisual(attacker).action.phase).toBe('impact');
    expect(target.hp).toBe(hp - g.specs.spearman.damage);
  });

  it('keeps separate attack poses for several Spearmen striking at once', () => {
    const state = quietMatch(g);
    const a = { id: 7201, team: 0, type: 'spearman', x: 5000, y: 5000, hp: 145, max: 145, attackTimer: 0, order: 'hold', moving: false, walk: 0 };
    const b = { id: 7202, team: 0, type: 'spearman', x: 6000, y: 6000, hp: 145, max: 145, attackTimer: 0, order: 'hold', moving: false, walk: 0 };
    const ta = { id: 7203, team: 1, type: 'infantry', x: 5025, y: 5000, hp: 1000, max: 1000, attackTimer: 4, order: 'hold', moving: false, walk: 0 };
    const tb = { id: 7204, team: 1, type: 'infantry', x: 6025, y: 6000, hp: 1000, max: 1000, attackTimer: 4, order: 'hold', moving: false, walk: 0 };
    state.units = [a, b, ta, tb];
    g.setSetting('combatVfxEnabled', false);
    g.update(.016);
    expect(state.visualEvents.filter(e => e.kind === 'attack' && e.unitType === 'spearman').map(e => e.unitId).sort()).toEqual([a.id, b.id]);
    expect(ta.hp).toBe(1000 - g.specs.spearman.damage);
    expect(tb.hp).toBe(1000 - g.specs.spearman.damage);
    g.updateFx(() => true);
    expect(g.unitCombatVisual(a).action.phase).toBe('impact');
    expect(g.unitCombatVisual(b).action.phase).toBe('impact');
    g.setSetting('combatVfxEnabled', true);
  });
  it('maps Spearman thrust poses to all four authored directions', () => {
    expect(g.spearmanAttackDirection(-Math.PI / 2)).toBe('up');
    expect(g.spearmanAttackDirection(Math.PI / 2)).toBe('down');
    expect(g.spearmanAttackDirection(Math.PI)).toBe('left');
    expect(g.spearmanAttackDirection(0)).toBe('right');
  });
  it('does not change hit points when the render-only VFX option is toggled', () => {
    const results = [];
    for (const enabled of [false, true]) {
      g.setSetting('combatVfxEnabled', enabled);
      const { target } = pair('cavalry');
      g.update(.016);
      results.push(target.hp);
    }
    g.setSetting('combatVfxEnabled', true);
    expect(results).toEqual([1000 - g.specs.cavalry.damage, 1000 - g.specs.cavalry.damage]);
  });

  it('keeps renderer particle randomness separate from the simulation random source', () => {
    g.setSetting('combatVfxEnabled', true);
    const { state, attacker } = pair('cavalry');
    g.updateFx(() => true); // Prime the visual event cursor.
    state.effects.push({ id: 80001, team: 0, targetUnitId: attacker.id, x: attacker.x, y: attacker.y });
    const original = Math.random; let calls = 0;
    Math.random = () => { calls++; return .5; };
    try { g.updateFx(() => true); } finally { Math.random = original; }
    expect(calls).toBe(0);
  });
});
