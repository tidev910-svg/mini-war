// @ts-nocheck
// Selection info panel (docs/features/selection-info.md).
import { describe, it, expect, beforeAll } from 'vitest';
import { loadGame, quietMatch } from './helpers/game';

let g;
beforeAll(async () => { g = await loadGame(); });
const panel = () => { g.updateSelectionInfo(); const b = document.getElementById('selInfo'); return b.hidden ? '' : b.textContent; };
const clear = () => { for (const u of g.state.units) u.selected = false; g.setSelectedFortress(null); g.setSelectedBuilding(null); g.setSelectedFlag(null); };

describe('selection info panel', () => {
  it('describes one unit with its counters, and a group with totals', () => {
    quietMatch(g); clear();
    const sp = g.spawn(0, 'spearman'), cv = g.spawn(0, 'cavalry');
    expect(panel()).toBe('');
    sp.selected = true;
    expect(panel()).toContain('Lính giáo');
    expect(panel()).toContain('Lính kỵ binh ×2,2'); // strong against cavalry
    expect(panel()).toContain('Cung thủ ×1,3');     // weak to archers
    cv.selected = true;
    expect(panel()).toContain('2 quân');
    expect(panel()).toContain('375 / 375');
    expect(panel()).not.toContain('Mạnh với'); // mixed group: no counter rows
  });

  it('shows fortress guns and flag capture progress', () => {
    const state = quietMatch(g); clear();
    g.setSelectedFortress(state.bases[0]);
    expect(panel()).toContain('Pháo đài');
    expect(panel()).toContain('1 / 2');
    clear();
    const r = state.regions.find(q => q.cp && q.home == null);
    r.owner = -1; r.capTeam = 0; r.cap = .5; r.stage2 = -1;
    g.setSelectedFlag(r.id);
    expect(panel()).toContain('chiếm cờ 50%');
  });
});
