// Browser smoke tests for Mini War. Needs the dev server running (pnpm dev), then: pnpm smoke [name…]
// Names: boot ui hotkeys maps path capture vision camps economy training ai pvp (default: all). Screenshots go to scripts/smoke/out/.
import { URL, launch, startAI, checker, sleep } from './lib.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');
const only = process.argv.slice(2);
const want = name => !only.length || only.includes(name);
const results = [];

// Single-player checks share one browser.
const solo = ['boot', 'ui', 'hotkeys', 'maps', 'path', 'capture', 'vision', 'camps', 'economy', 'training', 'ai'].filter(want);
if (solo.length) {
  const c = await launch({ port: 9401, outDir: OUT });
  try {
    await startAI(c);

    if (want('boot')) {
      const t = checker('boot: trang tải, vào chế độ AI, vẽ được');
      const info = await c.game(`return {regions:state.regions.length,units:state.units.length,started:gameStarted,mode}`);
      t.ok(info.started && info.mode === 'ai', 'đã vào trận AI', info);
      await sleep(600); await c.shot(OUT, 'boot');
      // No unstyled flash: the stylesheet is a <link> before the game script and the theme tokens are inlined in the HTML.
      const html = await (await fetch(URL)).text();
      t.ok(html.includes('id="theme-tokens"') && html.indexOf('/src/style.css') < html.indexOf('/src/main.ts'), 'CSS và token màu có sẵn trong HTML trước khi chạy JS');
      // Lobby: guide opens above it, Esc closes, Enter starts an AI match.
      await c.game(`leaveMatch();return 1`);
      await c.page("document.getElementById('lobbyGuide').click()");
      const guideOnTop = await c.page("(()=>{const r=document.querySelector('#guideModal .modal-panel').getBoundingClientRect();return !!document.elementFromPoint(r.left+r.width/2,r.top+20)?.closest('#guideModal')})()");
      t.ok(guideOnTop, 'sảnh: nút Hướng dẫn mở hộp hướng dẫn nằm trên sảnh');
      await c.page("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
      t.ok(await c.page("document.getElementById('guideModal').hidden"), 'sảnh: Esc đóng hướng dẫn');
      await c.page("document.activeElement?.blur();document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter'}))");
      t.ok(await c.game(`return gameStarted&&mode==='ai'`) && await c.page("document.getElementById('modeScreen').classList.contains('hidden')"), 'sảnh: Enter vào trận với AI');
      // Sound files (public/assets/audio) all fetched and decoded.
      const audio = await c.game(`const files=new Set(Object.values(SOUNDS).flatMap(s=>s.files));return {...audioStatus(),expected:files.size}`);
      t.ok(audio.loaded === audio.expected && !audio.failed.length, 'tải và giải mã đủ file âm thanh', audio);
      t.ok(!c.errors.length, 'không lỗi JavaScript', c.errors);
      results.push(t.report());
    }

    if (want('ui')) {
      const t = checker('ui: HUD kiểu kingdom, bảng huấn luyện/xây dựng, minimap');
      const ids = ['food', 'wood', 'stone', 'gold', 'foodRate', 'territory', 'territoryIncome', 'time', 'phaseHint', 'unitCount', 'unitBreakdown', 'trainQueue', 'feed',
        'scout', 'infantry', 'archer', 'spearman', 'cavalry', 'attack', 'farm', 'upgradeFarm', 'upgradeOutpost', 'buildTower', 'turret', 'pause', 'toggleTerritory',
        'fullscreen', 'toggleSideHud', 'openTrain', 'openBuild', 'openGuide', 'minimap', 'overlay', 'overlayRestart', 'menuBtn', 'gameMenu', 'leaveMatch', 'confirmModal', 'tooltip', 'openSettings', 'lobbySettings', 'settingsModal'];
      const missing = await c.page(`${JSON.stringify(ids)}.filter(id=>!document.getElementById(id))`);
      t.ok(!missing.length, 'mọi id mà code dùng đều có', missing);
      await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];state.resources[0]={food:500,wood:500,stone:300,gold:300};return 1`);
      const hidden = id => c.page(`document.getElementById('${id}').hidden`);
      await c.page("document.getElementById('openTrain').click()");
      t.ok(!(await hidden('trainDrawer')) && await hidden('buildDrawer'), 'nút Huấn luyện mở bảng huấn luyện');
      await c.page("document.getElementById('infantry').click()");
      const q = await c.game(`updateHUD();return {queue:trainQueueOf(0).map(q=>q.type),items:document.querySelectorAll('#trainQueue .q-item').length}`);
      t.ok(q.queue[0] === 'infantry' && q.items === 1, 'bấm thẻ Lính → vào hàng đợi, bảng hàng đợi có 1 dòng', q);
      const portraits = await c.page(`[...document.querySelectorAll('canvas.portrait')].filter(el=>{const d=el.getContext('2d').getImageData(0,0,el.width,el.height).data;for(let i=3;i<d.length;i+=4)if(d[i])return true;return false;}).length`);
      t.ok(portraits === 5, 'đủ 5 ảnh chân dung quân', portraits);
      await c.page("document.dispatchEvent(new KeyboardEvent('keydown',{key:'b'}))");
      t.ok(await hidden('trainDrawer') && !(await hidden('buildDrawer')), 'phím B chuyển sang bảng xây dựng');
      await c.page("document.getElementById('farm').click()");
      const placing = await c.game(`return {kind:placement?.kind,drawer:document.getElementById('buildDrawer').hidden}`);
      t.ok(placing.kind === 'farm' && placing.drawer, 'chọn Nông trại → đóng bảng, vào chế độ đặt', placing);
      await c.page("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
      t.ok(await c.game(`return placement===null`), 'Esc huỷ đặt công trình');
      await c.page("document.dispatchEvent(new KeyboardEvent('keydown',{key:'h'}))");
      await c.page("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
      t.ok(await hidden('trainDrawer'), 'phím H mở, Esc đóng bảng');
      const cam = await c.game(`const r=minimapCanvas.getBoundingClientRect(),ev=(t,fx,fy)=>minimapCanvas.dispatchEvent(new PointerEvent(t,{clientX:r.left+r.width*fx,clientY:r.top+r.height*fy,button:0,pointerId:7,bubbles:true}));
        ev('pointerdown',.5,.5);const a={x:camX+VIEW_W/zoom/2,y:camY+VIEW_H/zoom/2};ev('pointermove',.25,.75);const b={x:camX+VIEW_W/zoom/2,y:camY+VIEW_H/zoom/2};ev('pointerup',.25,.75);return {a,b,W};`);
      t.ok(Math.abs(cam.a.x - cam.W / 2) < 60 && Math.abs(cam.a.y - cam.W / 2) < 60, 'nhấp giữa minimap → camera về giữa bản đồ', cam.a);
      t.ok(Math.abs(cam.b.x - cam.W / 4) < 400 && Math.abs(cam.b.y - cam.W * 0.75) < 400, 'kéo minimap → camera đi theo', cam.b);
      await c.page("document.getElementById('chatToggle').click()");
      t.ok(await c.page("document.getElementById('chatStrip').classList.contains('open')"), 'bấm 📜 mở rộng nhật ký');
      await c.page("document.getElementById('chatToggle').click()");
      // Heraldic HUD: tooltips, menu, shortfall flash, notice fade, leave confirmation, minimum text size, no overlaps.
      t.ok(await c.page("getComputedStyle(document.documentElement).getPropertyValue('--faction-primary').trim()==='#2F5DB8'"), 'token màu phe được ghi lên :root');
      const tipFor = sel => c.page(`(()=>{const el=document.querySelector('${sel}');el.dispatchEvent(new PointerEvent('pointerover',{bubbles:true,pointerType:'mouse'}));const t=document.getElementById('tooltip');return t.hidden?null:t.textContent})()`);
      t.ok(/ranh giới/i.test(await tipFor('#toggleTerritory') || ''), 'nút chỉ có icon có tooltip');
      t.ok(/Tiêu hao quân đội/.test(await tipFor('#resFood') || ''), 'tooltip lúa có chi tiết thu/chi');
      t.ok(/^\+[\d,]+ −[\d,]+ = [+-][\d,]+\/phút$/.test(await c.page("document.getElementById('foodRate').textContent")), 'ô lúa hiện thu nhập gộp, tiêu hao và ròng');
      const noTip = await c.page("[...document.querySelectorAll('.hud-layer button')].filter(b=>!b.textContent.trim()&&!b.closest('[data-tip]')).map(b=>b.id||b.className)");
      t.ok(!noTip.length, 'mọi nút chỉ có icon đều có tooltip', noTip);
      await c.page("document.getElementById('menuBtn').click()");
      t.ok(!(await hidden('gameMenu')), 'nút ☰ mở menu');
      await c.page("document.getElementById('pause').click()");
      t.ok(await c.game('return paused') && await hidden('gameMenu'), 'Tạm dừng trong menu, menu tự đóng');
      t.ok(/tạm dừng/.test(await tipFor('.dock-slot') || ''), 'nút bị khoá nêu lý do trong tooltip');
      await c.page("document.getElementById('pause').click()");
      await c.game(`state.resources[0].food=0;requestBuy('infantry');return 1`);
      t.ok(await c.page("document.getElementById('resFood').classList.contains('short')"), 'thiếu lúa → ô lúa nháy đỏ');
      await c.game(`state.resources[0]={food:500,wood:500,stone:300,gold:300};addLog('Thử cảnh báo','danger');return 1`);
      t.ok(await c.page("document.getElementById('chatStrip').classList.contains('alert')"), 'thông báo nguy hiểm có viền đỏ');
      await c.page("document.getElementById('leaveMatch').click()");
      t.ok(!(await hidden('confirmModal')) && await c.game('return gameStarted'), 'Rời trận hỏi xác nhận trước');
      await c.page("document.getElementById('confirmNo').click()");
      t.ok(await hidden('confirmModal') && await c.game('return gameStarted'), 'bấm Ở lại → trận tiếp tục');
      const small = await c.page(`[...document.querySelectorAll('.hud-layer *')].filter(e=>e.offsetParent&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<12).map(e=>e.id||e.className)`);
      t.ok(!small.length, 'không chữ nào trên HUD nhỏ hơn 12px', small);
      const overlaps = await c.page(`(()=>{const r=['.commander','.resource-bar','.side-rail','.minimap-frame','.chat-strip','.action-dock'].map(s=>[s,document.querySelector(s).getBoundingClientRect()]),out=[];for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){const a=r[i][1],b=r[j][1];if(a.width&&b.width&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)out.push(r[i][0]+'×'+r[j][0]);}return out})()`);
      t.ok(!overlaps.length, 'các khối HUD không đè lên nhau', overlaps);
      // Settings: open from the menu, change quality (canvas shrinks) and the territory switch (synced with T), reset.
      await c.page("localStorage.removeItem('miniwar.settings')");await c.game(`resetSettings();return 1`);
      await c.page("document.getElementById('menuBtn').click()"); await c.page("document.getElementById('openSettings').click()");
      t.ok(!(await hidden('settingsModal')) && await hidden('gameMenu'), 'menu → Cài đặt: hộp mở, menu đóng');
      const px0 = await c.game('return VIEW_W*VIEW_H');
      await c.page("document.querySelector('[data-key=quality] button').click()");
      const qs = await c.game('return {px:VIEW_W*VIEW_H,quality:settings.quality}');
      t.ok(qs.quality === 'low' && qs.px < px0 && await c.page("JSON.parse(localStorage.getItem('miniwar.settings')).quality==='low'"), 'chất lượng Thấp: canvas nhỏ hơn và được lưu', { px0, qs });
      await c.page("document.querySelectorAll('.settings-tab')[1].click()"); await c.page("document.querySelector('[data-key=territory] .switch').click()");
      t.ok(!(await c.game('return showTerritory')), 'công tắc Ranh giới vùng tắt lớp lãnh thổ');
      await c.page("document.getElementById('settingsReset').click()");
      t.ok(await c.game("return settings.quality==='medium'&&showTerritory===true"), 'Khôi phục mặc định');
      await c.page("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))");
      t.ok(await hidden('settingsModal'), 'Esc đóng Cài đặt');
      const perf = await c.game(`const t0=performance.now();for(let i=0;i<30;i++)draw();return {ms:+((performance.now()-t0)/30).toFixed(1),canvas:[VIEW_W,VIEW_H]}`);
      results.push(t.report({ 'draw() mỗi frame (ms)': perf.ms, canvas: perf.canvas }));
    }

    if (want('hotkeys')) {
      const t = checker('hotkeys: phím tắt kiểu Đế Chế + Unit Control V1.0');
      const key = (k, o = {}) => c.page(`document.dispatchEvent(new KeyboardEvent('keydown',${JSON.stringify({ key: k, code: o.code || '', ctrlKey: !!o.ctrl, shiftKey: !!o.shift, bubbles: true })}))`);
      await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];state.resources[0]={food:2000,wood:2000,stone:500,gold:2000};
        for(let i=0;i<6;i++)spawn(0,i<3?'infantry':'archer');for(const t of ['cavalry','cavalry','spearman'])spawn(0,t);for(const u of state.units)u.selected=false;localSelectedIds.clear();return 1`);
      const sel = () => c.game(`return state.units.filter(u=>u.selected).map(u=>u.type)`);
      await key('a', { ctrl: true });
      t.ok((await sel()).length === 9, 'Ctrl+A chọn tất cả quân');
      // Unit Control V1.0: keys 1–5 filter the selection by type; units dropped keep their orders.
      await c.game(`const b=state.bases[0];for(const u of state.units)if(u.type==='infantry'){u.order='move';u.dest={x:b.x,y:b.y+400};}updateSelectionBar();return 1`);
      t.ok(await c.page("!document.getElementById('unitBar').hidden&&document.querySelectorAll('#unitBar .unit-chip').length===4"), 'thanh quân hiện 4 loại trong nhóm');
      await key('5', { code: 'Digit5' });
      let s5 = await sel();
      t.ok(s5.length === 2 && s5.every(x => x === 'cavalry'), 'phím 5: chỉ giữ kỵ binh', s5);
      t.ok(await c.game(`return state.units.filter(u=>u.type==='infantry').every(u=>u.order==='move'&&!u.selected)`), 'lính bị bỏ chọn vẫn giữ lệnh đi');
      await key('1', { code: 'Digit1' });
      t.ok((await sel()).join() === s5.join() && /không có trinh sát/.test(await c.page("document.getElementById('feed').firstElementChild.textContent")), 'phím 1 khi nhóm không có trinh sát: giữ nguyên, có thông báo');
      await c.page("document.querySelector('#unitBar .unit-chip[data-type=archer]').dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey:true}))");
      const sh = (await sel()).sort().join();
      t.ok(sh === 'archer,archer,archer,cavalry,cavalry', 'Shift + bấm biểu tượng cung thủ: thêm cung thủ từ nhóm đã khoanh', sh);
      await c.page("document.querySelector('#unitBar .unit-chip[data-type=spearman]').click()");
      t.ok((await sel()).join() === 'spearman', 'bấm biểu tượng lính giáo: chỉ chọn lính giáo trong nhóm đã khoanh');
      await c.game(`for(const u of state.units)u.selected=u.type==='archer';localSelectedIds.clear();for(const u of state.units)if(u.selected)localSelectedIds.add(u.id);return 1`);
      await key('2', { code: 'Digit2', ctrl: true });
      await key('Escape');
      t.ok((await sel()).length === 0, 'Esc bỏ chọn');
      await key('F2');
      const g2 = await sel();
      t.ok(g2.length === 3 && g2.every(x => x === 'archer'), 'Ctrl+2 lưu nhóm, F2 gọi lại nhóm', g2);
      // Both taps inside one evaluation: separate CDP round trips can exceed the 400 ms double-tap window on a busy machine.
      await c.game(`const tap=()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'F2',bubbles:true}));tap();setCamX(0);setCamY(0);tap();return 1`);
      // Expected camera = centred on the group, clamped to the map (a group near the edge cannot be centred).
      const cam = await c.game(`const a=state.units.filter(u=>u.selected),cx=a.reduce((s,u)=>s+u.x,0)/a.length,cy=a.reduce((s,u)=>s+u.y,0)/a.length;
        const ex=Math.max(0,Math.min(Math.max(0,MAP_WORLD_W-VIEW_W/zoom),cx-VIEW_W/zoom/2)),ey=Math.max(0,Math.min(Math.max(0,MAP_WORLD_H-VIEW_H/zoom),cy-VIEW_H/zoom/2));
        return Math.abs(camX-ex)<2&&Math.abs(camY-ey)<2&&(ex>0||ey>0)`);
      t.ok(cam, 'bấm F2 hai lần liền: camera tới nhóm');
      await key('s');
      t.ok(await c.game(`return state.units.filter(u=>u.selected).every(u=>u.order==='hold'&&!u.path)`), 'S: nhóm dừng lại');
      await key('h');
      const h = await c.game(`return {fortress:!!selectedFortress,drawer:!document.getElementById('trainDrawer').hidden}`);
      t.ok(h.fortress && h.drawer, 'H: chọn pháo đài, mở bảng huấn luyện', h);
      await key('q'); await key('t');
      const q = await c.game(`return trainQueueOf(0).map(q=>q.type)`);
      t.ok(q[0] === 'scout' && q[1] === 'cavalry', 'Q, T khi pháo đài đang chọn: trinh sát, kỵ binh vào hàng đợi', q);
      await key('Escape'); await key('b'); await key('f');
      t.ok(await c.game(`return placement?.kind==='farm'`), 'B rồi F: vào chế độ đặt nông trại');
      await key('Escape'); await key('Escape'); // cancel placement, then clear the fortress selection
      const shown = await c.game(`return showTerritory`); await key('t');
      t.ok(await c.game(`return showTerritory`) !== shown, 'T (không trong bảng): ẩn/hiện ranh giới'); await key('t');
      await c.game(`for(const u of state.units)u.selected=false;localSelectedIds.clear();state.units[0].order='move';state.units[0].moving=true;return 1`);
      await key(',');
      const idle = await c.game(`const s=state.units.filter(u=>u.selected);return s.length===1&&s[0].order!=='move'`);
      t.ok(idle, 'dấu phẩy: chọn một quân đang rảnh');
      const before = await c.game(`return state.units.length`); await key('Delete');
      t.ok(await c.game(`return state.units.length`) === before - 1, 'Delete: loại bỏ quân đang chọn');
      const p0 = await c.game(`return paused`); await key('F10');
      t.ok(await c.game(`return paused`) !== p0, 'F10: tạm dừng'); await key('F10');
      await key('?');
      t.ok(!(await c.page("document.getElementById('guideModal').hidden")) && (await c.page("document.querySelectorAll('#hotkeyTable tr').length")) > 10, '?: mở hướng dẫn có bảng phím tắt');
      await key('Escape');
      // Real mouse input (CDP), so the browser also fires the `click` that follows each pointerup.
      const pts = await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];for(let i=0;i<3;i++)spawn(0,'infantry');
        const b=state.bases[0],gx=b.x+b.dir*520,gy=b.y;state.units.forEach((u,i)=>{u.x=gx+i*40;u.y=gy;u.order='hold';u.path=null;});
        centerCameraAt(gx+40,gy);selectUnits([]);const r=canvas.getBoundingClientRect(),sc=(x,y)=>{const p=worldToCanvas(x,y);return {x:r.left+p.x*r.width/VIEW_W,y:r.top+p.y*r.height/VIEW_H};};
        return {units:state.units.map(u=>sc(u.x,u.y)),corner:sc(gx-90,gy-90),ground:sc(gx+40,gy+260)}`);
      const mouse = async (type, p, o = {}) => c.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: o.button || 'left', buttons: type === 'mouseReleased' ? 0 : (o.button === 'right' ? 2 : 1), clickCount: 1, modifiers: o.shift ? 8 : 0 });
      const drag = async (a, b, o) => { await mouse('mousePressed', a, o); for (let i = 1; i <= 5; i++) await mouse('mouseMoved', { x: a.x + (b.x - a.x) * i / 5, y: a.y + (b.y - a.y) * i / 5 }, o); await mouse('mouseReleased', b, o); await sleep(60); };
      const nSel = () => c.game(`return state.units.filter(u=>u.selected).length`);
      await drag(pts.corner, pts.units[2]);
      t.ok(await nSel() === 3, 'kéo khung kết thúc ngay trên một quân: vẫn chọn cả 3 (cú nhấp sau khi kéo bị bỏ qua)');
      await drag(pts.units[0], pts.units[0], { shift: true });
      t.ok(await nSel() === 2, 'Shift + nhấp vào quân đang chọn: bỏ quân đó khỏi nhóm');
      await drag(pts.ground, pts.ground);
      t.ok(await nSel() === 0, 'nhấp vùng trống: bỏ chọn');
      await drag(pts.units[0], { x: pts.units[2].x + 30, y: pts.units[2].y + 30 });
      t.ok(await nSel() === 3, 'kéo khung bắt đầu trên một quân: vẫn khoanh được');
      const cam0 = await c.game(`return [camX,camY]`);
      await drag(pts.ground, { x: pts.ground.x + 3, y: pts.ground.y + 2 }, { button: 'right' });
      const rc = await c.game(`return {moving:state.units.every(u=>u.order==='move'),cam:[camX,camY]}`);
      t.ok(rc.moving && rc.cam.join() === cam0.join(), 'nhấp phải hơi rung tay: vẫn là lệnh đi, camera không nhích', rc);
      await c.game(`selectUnits([]);const s=document.createElement('input');s.type='range';s.id='smokeRange';document.body.append(s);s.focus();return 1`);
      await key('a', { ctrl: true, code: 'KeyA' });
      t.ok(await nSel() === 3, 'Ctrl+A khi thanh trượt (âm lượng) đang được focus');
      await c.game(`selectUnits([]);document.getElementById('smokeRange').remove();return 1`);
      await key('ф', { ctrl: true, code: 'KeyA' });
      t.ok(await nSel() === 3, 'Ctrl+A với bố cục bàn phím khác (theo mã phím KeyA)');
      results.push(t.report());
    }

    if (want('maps')) {
      const t = checker('maps: 40 bản đồ ngẫu nhiên');
      const r = await c.game(`const out=[];const t0=performance.now();
        for(let k=0;k<40;k++){fresh();const R=state.regions,flags=R.filter(r=>r.cp),homes=R.filter(r=>r.home!==null);
          const walk=state.bases.map(walkDistances),tf=v=>Math.max(1,Math.min(MAP_TILES-2,Math.floor(v/TILE_SIZE))),cost=(r,t)=>walk[t][tf(r.cp.y)*MAP_TILES+tf(r.cp.x)];
          const near=[0,1].map(t=>new Set(flags.slice().sort((a,b)=>cost(a,t)-cost(b,t)).slice(0,4).map(r=>r.resource)).size);
          const [b0,b1]=state.bases,patch=landPatchSizes();
          out.push({flags:flags.length,homes:homes.length,homeMines:state.mines.filter(m=>R[m.regionId].home!==null).length,
            mines:flags.every(r=>state.mines.filter(m=>m.regionId===r.id&&m.resource===r.resource).length===1),near,
            inRegion:flags.every(r=>regionAt(r.cp.x,r.cp.y)===r),onLand:flags.every(r=>patch[tf(r.cp.y)*MAP_TILES+tf(r.cp.x)]>=MIN_LAND_PATCH_TILES),
            sep:Math.hypot(b0.x-b1.x,b0.y-b1.y),dir:Math.sign(b1.x-b0.x||1)===b0.dir&&b1.dir===-b0.dir,clear:state.bases.every(baseSiteClear),bx:b0.x});}
        return {ms:(performance.now()-t0)/40,out,W};`);
      const m = r.out;
      t.ok(m.every(x => x.flags === 20 && x.homes === 2), 'luôn 20 cờ + 2 vùng nhà', [...new Set(m.map(x => x.flags))]);
      t.ok(m.every(x => x.homeMines === 0 && x.mines), 'mỗi vùng cờ đúng 1 mỏ đúng loại, vùng nhà không mỏ');
      t.ok(m.every(x => x.near[0] === 4 && x.near[1] === 4), '4 vùng gần mỗi nhà đủ 4 loại');
      t.ok(m.every(x => x.inRegion && x.onLand), 'cờ nằm trong vùng, trên khối đất lớn');
      t.ok(m.every(x => x.sep >= r.W * 0.55 && x.dir && x.clear), 'hai nhà cách ≥ 55% bản đồ, quay về nhau, đứng trên đất');
      t.ok(m.some(x => x.bx > r.W / 2) && m.some(x => x.bx < r.W / 2), 'nhà xanh xuất hiện ở cả hai nửa bản đồ');
      // "Ngũ Vực" (realms-map.md): 10 maps in the real browser, every flag and every camp kind placed, fortresses mirrored.
      const rv = await c.game(`setSetting('mapKind','realms');const out=[],t0=performance.now();
        for(let k=0;k<10;k++){fresh();out.push({flags:state.regions.filter(r=>r.cp).length,kinds:new Set(state.camps.map(c=>c.kind)).size,
          mirror:Math.abs(state.bases[0].x+state.bases[1].x-W)<1&&state.bases[0].y===state.bases[1].y,deal:['food','wood','stone','gold'].map(t=>state.regions.filter(r=>r.cp&&r.resource===t).length).join()==='6,4,4,6'&&state.regions.filter(r=>r.rich).every(r=>REALMS[r.realm].rich)});}
        const ms=(performance.now()-t0)/10;setSetting('mapKind','classic');fresh();return {ms,out}`);
      t.ok(rv.out.every(x => x.flags === 20 && x.kinds === 5 && x.mirror && x.deal), 'Ngũ Vực: 20 cờ, đủ tổng mỏ từng loại, vàng giàu ở Vực Vàng, đủ 5 loại hang, hai nhà đối xứng', rv.out);
      results.push(t.report({ 'ms/bản đồ': Math.round(r.ms), 'ms/bản đồ Ngũ Vực': Math.round(rv.ms) }));
    }

    if (want('path')) {
      const t = checker('path: vật cản, đi thẳng trong vùng mù, gặp vật cản thì tìm đường qua cầu');
      const r = await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];
        let leak=0;for(let i=0;i<walkable.length;i++){const k=terrainType[i];if((k===2||k===3)&&walkable[i]&&!bridgeTiles[i])leak++;}
        const base=state.bases[0],ids=[];for(let i=0;i<6;i++){const u=spawn(0,'infantry');if(u){u.selected=true;ids.push(u.id);}}
        const f=base.y/H,rx=(.34+.31*f+.055*Math.sin(f*10))*W,goal=nearestWalkable(rx+(base.x<rx?1:-1)*900,base.y);
        const straight=lineWalkable(base.x,base.y,goal.x,goal.y);
        const t0=performance.now();applyAction(0,'move',{ids,x:goal.x,y:goal.y});const orderMs=performance.now()-t0;
        // Routes are planned on what blue has explored: every leg must be open on that map (unexplored counts as open).
        const legs=state.units.every(u=>pathStillOpen(u.x,u.y,u.path,state.fogSeen));const firstLegs=state.units.map(u=>u.path.length);
        const groups=new Set(state.units.map(u=>u.moveGroup)).size;
        let bad=0,steps=0;draw();
        while(state.units.some(u=>u.order==='move')&&steps<20*300){update(.05);steps++;if(steps%10===0)for(const u of state.units)if(!isWalkableAt(u.x,u.y))bad++;}
        return {leak,bridges:bridges.length,straight,orderMs:+orderMs.toFixed(1),legs,groups,bad,firstLegs,replans:state.units.reduce((n,u)=>n+(u.replans||0),0),seconds:+(steps*.05).toFixed(1),arrived:state.units.every(u=>u.order==='hold'&&Math.hypot(u.x-goal.x,u.y-goal.y)<TILE_SIZE*4)};`);
      t.ok(r.leak === 0 && r.bridges === 4, 'nước và đá chặn hết, có 4 cầu', r);
      t.ok(!r.straight && r.legs && r.groups === 1, 'đích bên kia sông (vùng mù): đường lập theo bản đồ đã khám phá, một nhóm', r);
      t.ok(r.replans > 0, 'gặp sông trong vùng mù thì tìm đường khác', r.replans);
      t.ok(r.bad === 0 && r.arrived, 'quân tới đích, không lần nào đứng trên nước/đá', r);
      results.push(t.report({ 'lệnh đi 6 quân (ms)': r.orderMs, 'thời gian đi (s)': r.seconds }));
    }

    if (want('capture')) {
      const t = checker('capture: thời gian chiếm cờ, trinh sát, tranh chấp');
      const r = await c.game(`setMode('test');setGameStarted(true);
        const run=(n,type='spearman',enemy=0)=>{fresh();setMode('test');const base=state.bases[0];const f=state.regions.filter(r=>r.cp).sort((a,b)=>Math.hypot(a.cp.x-base.x,a.cp.y-base.y)-Math.hypot(b.cp.x-base.x,b.cp.y-base.y))[0];
          state.units=[];const put=(team,type)=>{const u=spawn(team,type,0,0,false)||spawn(team,type);u.x=f.cp.x+(Math.random()-.5)*40;u.y=f.cp.y+(Math.random()-.5)*40;};
          for(let i=0;i<n;i++)put(0,type);for(let i=0;i<enemy;i++)put(1,'spearman');
          let t=0;while(f.owner!==0&&t<90){updateCaptures(.05);t+=.05;}return {t:+t.toFixed(1),owner:f.owner,cap:+f.cap.toFixed(2),contested:f.contested};};
        return {one:run(1),five:run(5),ten:run(10),scouts:run(2,'scout'),contest:run(5,'spearman',2)};`);
      t.ok(Math.abs(r.one.t - 60) < 0.2, '1 quân ≈ 60 giây', r.one);
      t.ok(Math.abs(r.five.t - 22.9) < 0.3, '5 quân ≈ 22,9 giây', r.five);
      t.ok(Math.abs(r.ten.t - 15.1) < 0.3, '10 quân ≈ 15,1 giây', r.ten);
      t.ok(r.scouts.owner !== 0 && r.scouts.cap === 0, 'trinh sát không chiếm được', r.scouts);
      t.ok(r.contest.owner !== 0 && r.contest.contested, 'hai phe cùng đứng → tranh chấp, không chiếm', r.contest);
      results.push(t.report());
    }

    if (want('vision')) {
      const t = checker('vision: sương mù V3.1 — bán kính, giữ cờ thấy 450, vùng mờ nhớ lần cuối');
      const r = await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];const base=state.bases[0];
        const f=state.regions.filter(r=>r.cp).sort((a,b)=>Math.hypot(a.cp.x-base.x,a.cp.y-base.y)-Math.hypot(b.cp.x-base.x,b.cp.y-base.y))[0];
        // A direction from the flag that stays on the map and away from both fortresses for 480 px.
        const ok=p=>p.x>40&&p.y>40&&p.x<W-40&&p.y<H-40&&state.bases.every(b=>Math.hypot(b.x-p.x,b.y-p.y)>BUILDING_VISION+20);
        const dir=[...Array(16)].map((_,k)=>({ux:Math.cos(k*Math.PI/8),uy:Math.sin(k*Math.PI/8)})).find(({ux,uy})=>ok({x:f.cp.x+ux*430,y:f.cp.y+uy*430})&&ok({x:f.cp.x+ux*480,y:f.cp.y+uy*480}));const {ux,uy}=dir;
        const near={x:f.cp.x+ux*430,y:f.cp.y+uy*430},out={x:f.cp.x+ux*480,y:f.cp.y+uy*480};
        const tile=p=>Math.floor(p.y/TILE_SIZE)*MAP_TILES+Math.floor(p.x/TILE_SIZE);
        const before=teamCanSee(0,near.x,near.y);f.owner=0;const held=teamCanSee(0,near.x,near.y),beyond=teamCanSee(0,out.x,out.y),redHeld=teamCanSee(1,near.x,near.y);
        update(.05);updateIntel();const explored=!!state.fogSeen[tile(near)];
        f.owner=1;const lost=teamCanSee(0,near.x,near.y),redNow=teamCanSee(1,near.x,near.y);update(.05);
        const radii=Object.entries(UNIT_VISION).map(([type,r])=>{state.units=[];const u=spawn(0,type);u.x=W/2;u.y=H/2;return teamCanSee(0,W/2+r-3,H/2)&&!teamCanSee(0,W/2+r+3,H/2);});
        updateIntel();const shownOwner=knownFlag(f).owner;
        return {before,held,beyond,redHeld,explored,lost,redNow,stillExplored:!!state.fogSeen[tile(near)],radii,shownOwner,real:f.owner};`);
      t.ok(!r.before && r.held && !r.beyond && !r.redHeld, 'giữ cờ thấy trong 450 quanh cờ, ngoài 450 không thấy, đối phương không thấy', r);
      t.ok(r.explored && !r.lost && r.redNow && r.stillExplored, 'đổi chủ → tầm nhìn sang phe mới, phe cũ vẫn nhớ địa hình', r);
      t.ok(r.radii.every(Boolean), 'bán kính 5 loại quân đúng bảng V3.1', r.radii);
      t.ok(r.shownOwner === 1 && r.real === 1, 'cờ của mình bị chiếm ngoài tầm nhìn: phe mình vẫn biết đã mất', r);
      results.push(t.report());
    }

    if (want('camps')) {
      const t = checker('camps: hang quái trung lập — sinh theo cặp, dọn hang, lăng cổ và buff');
      const r = await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];
        const kinds={};for(const k of state.camps)kinds[k.kind]=(kinds[k.kind]||0)+1;
        const home=state.bases[0],den=state.camps.filter(k=>k.kind==='wolves').sort((a,b)=>Math.hypot(a.x-home.x,a.y-home.y)-Math.hypot(b.x-home.x,b.y-home.y))[0];
        const ids=[];for(let i=0;i<6;i++){const u=spawn(0,'spearman');u.x=den.x-420;u.y=den.y-60+i*24;ids.push(u.id);}
        requestAction('camp',{ids,campId:den.id});const ordered=state.units.filter(u=>u.order==='camp').length;
        setZoom(1);centerCameraAt(den.x,den.y);let saw=false;for(let i=0;i<70*20&&den.state==='alive';i++){update(.05);if(i%40===0){draw();saw=saw||den.awake>0;}}
        const known=campKnownState(den,0),food=state.stats.sides[0].camps;
        const tomb=state.camps.find(k=>k.kind==='tomb');setGameTime(CAMP_TYPES.tomb.opensAt-.2);update(.5);
        const boss=state.creeps.some(m=>m.camp===tomb.id&&m.creep==='boss');
        const s=spawn(0,'scout');s.x=tomb.x-260;s.y=tomb.y;update(.05);centerCameraAt(tomb.x,tomb.y);
        return {kinds,ordered,cleared:den.state,winner:den.winner,known,camps:food,saw,boss,tombOpen:tomb.state,explored:isTeamAreaExplored(0,tomb.x,tomb.y)};`);
      await sleep(500); await c.shot(OUT, 'camps-tomb');
      t.ok(r.kinds.wolves === 4 && r.kinds.bandits === 2 && r.kinds.troll === 2 && r.kinds.tomb === 1, 'bản đồ có 4 ổ sói, 2 trại cướp, 2 hang quỷ đá, 1 lăng cổ', r.kinds);
      t.ok(r.ordered === 6 && r.saw && r.cleared === 'cleared' && r.winner === 0 && r.camps === 1 && r.known === 'cleared', 'lệnh dọn hang: 6 lính giáo tới, đánh thức và dọn sạch ổ sói, phe xanh nhận thưởng', r);
      t.ok(r.boss && r.tombOpen === 'alive' && r.explored, 'lăng cổ mở đúng giờ, có Vua Xương, cả hai phe biết vị trí', r);
      t.ok(!c.errors.length, 'không lỗi JavaScript', c.errors);
      results.push(t.report());
    }

    if (want('economy')) {
      const t = checker('economy: thu nhập pháo đài và mỏ (V3.1)');
      const r = await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];state.resources=[{food:0,wood:0,stone:0,gold:0},{food:0,wood:0,stone:0,gold:0}];
        const rates={};for(const m of state.mines)(rates[m.resource]??=new Set()).add(Math.round(m.income*60));for(const k in rates)rates[k]=[...rates[k]].join('/');
        for(let i=0;i<120*20;i++)update(.05);
        return {res:state.resources.map(x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,Math.round(v*100)/100]))),rates,food:foodPerMinute(0)};`);
      const want0 = { food: 80, wood: 60, stone: 20, gold: 20 };
      t.ok(r.res.every(x => Object.entries(want0).every(([k, v]) => Math.abs(x[k] - v) < 0.05)), '120 giây không lãnh thổ → 80 lúa / 60 gỗ / 20 đá / 20 vàng mỗi phe (40/30/10/10 mỗi phút)', r.res);
      t.ok(r.rates.food === '45' && r.rates.wood === '45' && r.rates.stone === '35' && r.rates.gold === '35', 'mọi vùng cùng loại sinh đúng 45 lúa / 45 gỗ / 35 đá / 35 vàng mỗi phút', r.rates);
      t.ok(r.food === 40, 'lúa/phút của pháo đài = 40', r.food);
      results.push(t.report());
    }

    if (want('training')) {
      const t = checker('training: 4 hàng đợi song song, mua thêm hàng đợi (V2)');
      const r = await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];state.resources[0]={food:2000,wood:2000,stone:0,gold:2000};
        const n=()=>state.units.filter(u=>u.team===0).length;let tm=0;const step=s=>{for(let k=0;k<Math.round(s/.05);k++){update(.05);tm+=.05;}};
        const r0={...state.resources[0]};buy('infantry',0);const cost={food:r0.food-state.resources[0].food,gold:r0.gold-state.resources[0].gold};
        step(4.9);const at49=n();step(.1);const at50=n();
        buy('spearman',0);buy('archer',0);const times=[];let prev=n();for(let k=0;k<400;k++){update(.05);tm+=.05;if(n()>prev){times.push(Math.round((tm-5)*10)/10);prev=n();}}
        for(let i=0;i<9;i++)buy('infantry',0);const full=trainQueueOf(0).length,msg=buyProblem('infantry',0);
        state.trainQueue=[];state.units=state.units.filter(u=>u.type!=='scout');buy('scout',0);buy('scout',0);const scoutMsg=buyProblem('scout',0);
        state.trainQueue=[];state.resources[0]={food:0,wood:100,stone:100,gold:0};const poor=buyQueueLane(0),poorRes={...state.resources[0]};
        state.resources[0]={food:0,wood:500,stone:500,gold:0};const ok=buyQueueLane(0),paid={...state.resources[0]};step(14.9);const lanesBefore=lanesOf(0);step(.2);
        return {cost,at49,at50,times,full,msg,scoutMsg,poor,poorRes,ok,paid,lanesBefore,lanesAfter:lanesOf(0)};`);
      t.ok(r.cost.food === 55 && r.cost.gold === 0, 'lính giá 55 lúa, không vàng', r.cost);
      t.ok(r.at49 === 0 && r.at50 === 1, 'lính ra quân đúng giây 5', r);
      t.ok(r.times[0] === 6 && r.times[1] === 8, 'lính giáo + cung thủ luyện song song, ra ở giây 6 và 8', r.times);
      t.ok(r.full === 8 && /đầy/.test(r.msg), '4 hàng đợi + 4 chỗ chờ = tối đa 8', r);
      t.ok(!r.poor && r.poorRes.wood === 100 && r.poorRes.stone === 100, 'thiếu tài nguyên: không mở hàng đợi 5, không trừ', r);
      t.ok(r.ok && Math.round(r.paid.wood) >= 299 && Math.round(r.paid.wood) <= 301 && Math.round(r.paid.stone) === 400 && r.lanesBefore === 4 && r.lanesAfter === 5, 'đủ tài nguyên: trừ 200 gỗ 100 đá một lần, mở hàng đợi 5 sau 15 giây', r);
      t.ok(/tối đa 2 lính trinh sát/.test(r.scoutMsg), 'tối đa 2 trinh sát tính cả hàng đợi', r.scoutMsg);
      results.push(t.report());
    }

    if (want('ai')) {
      const t = checker('ai: AI tự chơi 8 phút trên 3 bản đồ');
      const runs = [];
      // The blue side has no army here, so the AI may well raze its fortress before 8 minutes (it sees farther since the fog
      // of war V3.1). Either outcome shows the AI making progress: it won, or after 8 minutes it holds ≥ 2 regions and ≥ 5 units.
      for (let k = 0; k < 3; k++) runs.push(await c.game(`fresh();setMode('ai');setGameStarted(true);for(let i=0;i<8*60*20&&!ended;i++)update(.05);
        return {won:ended&&state.bases[0].hp<=0,minutes:+(gameTime/60).toFixed(1),regions:state.regions.filter(r=>r.owner===1&&r.cp).length,units:state.units.filter(u=>u.team===1).length,farms:state.buildings.filter(b=>b.team===1&&b.kind==='farm').length};`));
      t.ok(runs.every(x => x.won || (x.regions >= 2 && x.units >= 5)), 'AI phá được pháo đài trống, hoặc sau 8 phút giữ ≥ 2 vùng và có ≥ 5 quân', runs);
      results.push(t.report({ runs }));
    }

    const t = checker('solo: không lỗi JavaScript');
    t.ok(!c.errors.length, 'console sạch', c.errors);
    results.push(t.report());
  } finally { c.close(); }
}

if (want('pvp')) {
  const t = checker('pvp: hai trình duyệt, chủ phòng + khách');
  const host = await launch({ port: 9402, outDir: OUT });
  const guest = await launch({ port: 9403, outDir: OUT, size: '1000,760' });
  try {
    await sleep(3000);
    await host.page("document.getElementById('modeFriends').click();document.getElementById('createRoom').click()");
    let code = '';
    for (let i = 0; i < 60 && !/^[A-Z0-9]{6}$/.test(code); i++) { await sleep(500); code = await host.page("document.getElementById('roomCode').textContent"); }
    await guest.page(`document.getElementById('modeFriends').click();document.getElementById('roomInput').value='${code}';document.getElementById('joinRoom').click()`);
    let joined = false; for (let i = 0; i < 60 && !joined; i++) { await sleep(500); joined = await guest.page("document.getElementById('modeScreen').classList.contains('hidden')"); }
    t.ok(joined, 'khách vào được phòng', code);
    if (joined) {
      await sleep(1500);
      const same = [await host.game(`return state.bases.map(b=>[Math.round(b.x),Math.round(b.y),b.dir]).concat([state.regions.filter(r=>r.cp).length])`),
        await guest.game(`return state.bases.map(b=>[Math.round(b.x),Math.round(b.y),b.dir]).concat([state.regions.filter(r=>r.cp).length])`)];
      t.ok(JSON.stringify(same[0]) === JSON.stringify(same[1]), 'hai bên cùng vị trí nhà, hướng và 20 cờ', same);
      const decor = [await host.game(`return [treeDecor.length,rockDecor.length,shoreDecor.length,waterDecor.length,Math.round(treeDecor[5]?.x||0)]`),
        await guest.game(`return [treeDecor.length,rockDecor.length,shoreDecor.length,waterDecor.length,Math.round(treeDecor[5]?.x||0)]`)];
      t.ok(JSON.stringify(decor[0]) === JSON.stringify(decor[1]), 'cây, đá, cỏ lau, lá súng ở khách trùng với chủ phòng', decor);
      await host.game(`state.resources[1]={food:500,wood:500,stone:0,gold:500};return 1`);
      await sleep(500);
      await guest.page("document.getElementById('infantry').click()");
      await sleep(1200);
      const q = await host.game(`return trainQueueOf(1).map(q=>q.type)`);
      const line = await guest.page("[...document.querySelectorAll('#trainQueue .q-item')].map(el=>el.textContent)");
      t.ok(q[0] === 'infantry' && /Lính/.test(line[0] || ''), 'khách mua lính → vào hàng đợi của chủ phòng, khách thấy thẻ tiến độ', { q, line });
      const badge = await guest.page("[document.getElementById('sideName').textContent,document.getElementById('crest').classList.contains('red')]");
      t.ok(badge[0] === 'QUÂN ĐỎ' && badge[1], 'khách thấy huy hiệu QUÂN ĐỎ', badge);
      // Guest buys the next training lane: the host validates, charges red once and starts the upgrade.
      await host.game(`state.resources[1]={food:500,wood:500,stone:500,gold:500};return 1`); await sleep(400);
      await guest.page("document.getElementById('buyLane').click()"); await sleep(900);
      const lane = await host.game(`return {up:laneUpgradeOf(1),res:{...state.resources[1]}}`);
      t.ok(lane.up && lane.up.lane === 5 && Math.round(lane.res.wood) <= 302 && Math.round(lane.res.stone) <= 401, 'khách mở hàng đợi 5 → chủ phòng trừ tài nguyên phe đỏ một lần', lane);
      const faction = await guest.page("getComputedStyle(document.documentElement).getPropertyValue('--faction-primary').trim()");
      t.ok(faction === '#B03030', 'giao diện khách đổi sang màu phe đỏ (--faction-primary)', faction);
      await guest.shot(OUT, 'pvp-guest');
      await sleep(5500);
      const units = await guest.game(`return state.units.filter(u=>u.team===1).map(u=>u.type)`);
      t.ok(units.includes('infantry'), 'lính ra quân ở cả máy khách', units);
      // Guest move order: the host computes the path, the guest receives it in the snapshot to draw it.
      await guest.game(`const ids=state.units.filter(u=>u.team===1).map(u=>u.id);const b=state.bases[1];requestAction('move',{ids,x:b.x-b.dir*900,y:b.y+300});return ids.length`);
      await sleep(1200);
      const gp = await guest.game(`return state.units.filter(u=>u.team===1).map(u=>({order:u.order,path:u.path?.length||0}))`);
      t.ok(gp.length && gp.every(u => u.order === 'move' && u.path > 0), 'khách ra lệnh đi → nhận đường đi trong snapshot', gp);
      // Guest formation (formations.md): the host arranges the guest's fighters; the guest sees it in the snapshot.
      await guest.game(`const ids=state.units.filter(u=>u.team===1).map(u=>u.id);requestAction('formation',{ids,kind:'defense'});return ids.length`);
      await sleep(900);
      const gf = await guest.game(`const f=(state.formations||[]).find(f=>f.team===1);return f?{kind:f.kind,n:f.ids.length,fighters:state.units.filter(u=>u.team===1&&u.type!=='scout').length}:null`);
      t.ok(gf && gf.kind === 'defense' && gf.n === gf.fighters, 'khách xếp đội hình → chủ phòng xếp, khách thấy qua snapshot', gf);
      // Guest captures a flag: the guest sees TERRITORY_VISION around it (fog of war V3.1).
      const target = await host.game(`const b=state.bases[1],r=state.regions.filter(r=>r.cp).sort((a,c)=>Math.hypot(a.cp.x-b.x,a.cp.y-b.y)-Math.hypot(c.cp.x-b.x,c.cp.y-b.y))[0];
        r.owner=1;r.cap=0;return r.id`);
      await sleep(1500);
      const vis = await guest.game(`refreshFog(state.enemyFogSeen);const r=state.regions[${target}];let n=0,v=0;for(let i=0;i<MAP_TILES*MAP_TILES;i++){const x=(i%MAP_TILES+.5)*TILE_SIZE,y=(Math.floor(i/MAP_TILES)+.5)*TILE_SIZE;if(Math.hypot(x-r.cp.x,y-r.cp.y)<=TERRITORY_VISION-TILE_SIZE){n++;if(fogVisible[i])v++;}}return {n,v}`);
      t.ok(vis.n > 0 && vis.v === vis.n, 'cờ khách giữ cho khách tầm nhìn 450 quanh cờ', vis);
      // Guest garrisons its units in that flag (flag-defense.md): the host takes them off the field into state.garrisons.
      await host.game(`const r=state.regions[${target}];state.units.filter(u=>u.team===1).forEach((u,i)=>{u.x=r.cp.x+60+i*8;u.y=r.cp.y+30;u.order='hold';u.dest=null;u.path=null;});return 1`);
      await sleep(400);
      await guest.game(`const ids=state.units.filter(u=>u.team===1).map(u=>u.id);requestAction('garrison',{ids,regionId:${target}});return ids.length`);
      await sleep(4000);
      const gar = await host.game(`return {inside:(state.garrisons||[]).filter(u=>u.team===1&&u.garrison===${target}).length,onField:state.units.filter(u=>u.team===1).length}`);
      const garGuest = await guest.game(`return (state.garrisons||[]).filter(u=>u.team===1).length`);
      t.ok(gar.inside > 0 && gar.onField === 0 && garGuest === gar.inside, 'khách đưa quân vào đồn trú → chủ phòng cất quân vào cờ, khách thấy qua snapshot', { gar, garGuest });
      await guest.shot(OUT, 'pvp-guest');
    }
    t.ok(!host.errors.length && !guest.errors.length, 'không lỗi JavaScript', { host: host.errors, guest: guest.errors });
  } finally { host.close(); guest.close(); }
  results.push(t.report());
}

const failed = results.filter(x => !x).length;
console.log(failed ? `\n${failed} nhóm kiểm thử lỗi.` : '\nTất cả smoke test đạt.');
process.exit(failed ? 1 : 0);
