import { beforeAll, describe, expect, it } from 'vitest';
import { loadGame } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });

describe('fallen unit presentation', () => {
  it('does not draw a fallen body under a living teammate whose health bar could be mistaken for its own', () => {
    const fallen = { type: 'infantry', team: 1, x: 100, y: 100 };
    const livingAlly = { type: 'infantry', team: 1, hp: 100, x: 115, y: 100 };
    expect(g.showFallenBody(fallen, [livingAlly])).toBe(false);
    expect(g.showFallenBody(fallen, [{ ...livingAlly, x: 160 }])).toBe(true);
    expect(g.showFallenBody(fallen, [{ ...livingAlly, hp: 0 }])).toBe(true);
  });
});
