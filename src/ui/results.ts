// @ts-nocheck
// Result screen statistics (docs/features/match-stats.md): a side-by-side table of state.stats, two small line charts
// (regions held, army size) and a button that copies the raw numbers as JSON for balance playtests.
import { $, addLog, gameTime, localTeam, mode, state } from '../core/game';
import { RESOURCE_NAMES } from '../config/balance';
import { TEAM_COLORS } from '../config/theme';

const fmt = n => Math.round(n).toLocaleString('vi-VN');
const clock = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Line chart of one timeline series for both sides; colours come from the side classes in style.css.
function chart(title, key, timeline, me) {
  const W = 300, H = 90, pad = 6, tMax = Math.max(1, timeline[timeline.length - 1]?.t || 1);
  const vMax = Math.max(1, ...timeline.flatMap(p => p[key]));
  const pts = team => timeline.map(p => `${(pad + (W - 2 * pad) * p.t / tMax).toFixed(1)},${(H - pad - (H - 2 * pad) * p[key][team] / vMax).toFixed(1)}`).join(' ');
  const line = team => `<polyline class="stat-line team${team}${team === me ? ' mine' : ''}" points="${pts(team)}"/>`;
  return `<figure class="stat-chart"><figcaption>${title}<span>tối đa ${vMax}</span></figcaption>
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${title} theo thời gian">
      <line class="stat-axis" x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}"/>${line(1 - me)}${line(me)}</svg>
    <div class="stat-ticks"><span>00:00</span><span>${clock(tMax)}</span></div></figure>`;
}

export function showMatchStats() {
  const box = $('matchStats'), st = state?.stats; if (!box) return;
  if (!st) { box.innerHTML = ''; return; }
  const me = localTeam(), them = 1 - me, A = st.sides[me], B = st.sides[them];
  const regionsNow = t => state.regions.filter(r => r.owner === t).length;
  const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
  const rows = [
    ['Quân đã tuyển', A.trained, B.trained], ['Quân mất', A.lost, B.lost], ['Hạ gục', A.killed, B.killed],
    ['Sát thương gây ra', A.damage, B.damage], ['Hang quái đã dọn', A.camps || 0, B.camps || 0], ['Quân đông nhất', A.peakArmy, B.peakArmy],
    ['Công trình xây / bị phá', `${A.built} / ${A.buildingsLost}`, `${B.built} / ${B.buildingsLost}`],
    ['Vùng giữ cuối trận', regionsNow(me), regionsNow(them)],
    ...Object.keys(RESOURCE_NAMES).map(k => [`Thu ${RESOURCE_NAMES[k]} / tiêu`, `${fmt(A.gathered[k])} / ${fmt(A.spent[k])}`, `${fmt(B.gathered[k])} / ${fmt(B.spent[k])}`]),
    ['Tổng tài nguyên thu', sum(A.gathered), sum(B.gathered)],
  ];
  const cell = v => typeof v === 'number' ? fmt(v) : v;
  box.innerHTML = `<p class="stat-duration">Thời lượng trận <b>${clock(gameTime)}</b></p>
    <table class="stat-table"><thead><tr><th></th><th class="team${me}">${TEAM_COLORS[me].name} (bạn)</th><th class="team${them}">${TEAM_COLORS[them].name}</th></tr></thead>
    <tbody>${rows.map(([label, a, b]) => `<tr><th>${label}</th><td>${cell(a)}</td><td>${cell(b)}</td></tr>`).join('')}</tbody></table>
    <div class="stat-charts">${chart('Số vùng', 'regions', st.timeline, me)}${chart('Quân số', 'army', st.timeline, me)}</div>`;
}

// Raw numbers for playtest notes: duration, mode, per-side stats and the timeline.
$('copyStats')?.addEventListener('click', async () => {
  const data = JSON.stringify({ duration: Math.round(gameTime), mode, localTeam: localTeam(), sides: state?.stats?.sides, timeline: state?.stats?.timeline }, null, 1);
  try { await navigator.clipboard.writeText(data); addLog('Đã sao chép số liệu trận đấu.'); }
  catch { addLog('Trình duyệt không cho sao chép; số liệu đã in ra console.'); console.log(data); }
});
