// Browser smoke tests for Mini War. Needs the dev server running (pnpm dev), then: pnpm smoke [name…]
// Names: boot maps capture vision economy training ai pvp (default: all). Screenshots go to scripts/smoke/out/.
import { launch, startAI, checker, sleep } from './lib.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'out');
const only = process.argv.slice(2);
const want = name => !only.length || only.includes(name);
const results = [];

// Single-player checks share one browser.
const solo = ['boot', 'maps', 'capture', 'vision', 'economy', 'training', 'ai'].filter(want);
if (solo.length) {
  const c = await launch({ port: 9401, outDir: OUT });
  try {
    await startAI(c);

    if (want('boot')) {
      const t = checker('boot: trang tải, vào chế độ AI, vẽ được');
      const info = await c.game(`return {regions:state.regions.length,units:state.units.length,started:gameStarted,mode}`);
      t.ok(info.started && info.mode === 'ai', 'đã vào trận AI', info);
      await sleep(600); await c.shot(OUT, 'boot');
      t.ok(!c.errors.length, 'không lỗi JavaScript', c.errors);
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
      results.push(t.report({ 'ms/bản đồ': Math.round(r.ms) }));
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
      const t = checker('vision: giữ cờ thấy cả vùng, mất cờ thì mất tầm nhìn');
      const r = await c.game(`fresh();setMode('test');setGameStarted(true);const base=state.bases[0];
        const f=state.regions.filter(r=>r.cp).sort((a,b)=>Math.hypot(a.cp.x-base.x,a.cp.y-base.y)-Math.hypot(b.cp.x-base.x,b.cp.y-base.y))[0];
        let far=null,fd=0;for(let i=0;i<regionMap.length;i++)if(regionMap[i]===f.id){const x=(i%MAP_TILES+.5)*TILE_SIZE,y=((i-i%MAP_TILES)/MAP_TILES+.5)*TILE_SIZE,d=Math.hypot(x-f.cp.x,y-f.cp.y);if(d>fd){fd=d;far={x,y,i};}}
        const before=teamCanSee(0,far.x,far.y);f.owner=0;const held=teamCanSee(0,far.x,far.y),redHeld=teamCanSee(1,far.x,far.y);
        revealOwnedRegions(0,state.fogSeen);const explored=!!state.fogSeen[far.i];
        f.owner=1;const lost=teamCanSee(0,far.x,far.y),redNow=teamCanSee(1,far.x,far.y);
        return {fd:Math.round(fd/TILE_SIZE),before,held,redHeld,explored,lost,redNow,stillExplored:!!state.fogSeen[far.i]};`);
      t.ok(!r.before && r.held && !r.redHeld, 'trước khi giữ không thấy; giữ cờ thì thấy ô xa nhất, đối phương không thấy', r);
      t.ok(r.explored && !r.lost && r.redNow && r.stillExplored, 'đổi chủ → tầm nhìn sang phe mới, phe cũ vẫn nhớ địa hình', r);
      results.push(t.report({ 'ô xa nhất (ô)': r.fd }));
    }

    if (want('economy')) {
      const t = checker('economy: thu nhập pháo đài và mỏ');
      const r = await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];state.resources=[{food:0,wood:0,stone:0,gold:0},{food:0,wood:0,stone:0,gold:0}];
        const rates={};for(const m of state.mines)if(!m.rich)rates[m.resource]=Math.round(m.income*60);
        for(let i=0;i<120*20;i++)update(.05);
        return {res:state.resources.map(x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,Math.round(v*100)/100]))),rates,food:foodPerMinute(0)};`);
      const want0 = { food: 50, wood: 40, stone: 16, gold: 16 };
      t.ok(r.res.every(x => Object.entries(want0).every(([k, v]) => Math.abs(x[k] - v) < 0.05)), '120 giây không lãnh thổ → 50 lúa / 40 gỗ / 16 đá / 16 vàng mỗi phe', r.res);
      t.ok(r.rates.food === 25 && r.rates.wood === 30 && r.rates.stone === 20 && r.rates.gold === 20, 'mỏ thường 25 lúa / 30 gỗ / 20 đá / 20 vàng mỗi phút', r.rates);
      t.ok(r.food === 25, 'lúa/phút của pháo đài = 25', r.food);
      results.push(t.report());
    }

    if (want('training')) {
      const t = checker('training: hàng đợi huấn luyện');
      const r = await c.game(`fresh();setMode('test');setGameStarted(true);state.units=[];state.resources[0]={food:2000,wood:2000,stone:0,gold:2000};
        const n=()=>state.units.filter(u=>u.team===0).length;let tm=0;const step=s=>{for(let k=0;k<Math.round(s/.05);k++){update(.05);tm+=.05;}};
        const r0={...state.resources[0]};buy('infantry',0);const cost={food:r0.food-state.resources[0].food,gold:r0.gold-state.resources[0].gold};
        step(4.9);const at49=n();step(.1);const at50=n();
        buy('spearman',0);buy('archer',0);const times=[];let prev=n();for(let k=0;k<400;k++){update(.05);tm+=.05;if(n()>prev){times.push(Math.round((tm-5)*10)/10);prev=n();}}
        for(let i=0;i<6;i++)buy('infantry',0);const full=trainQueueOf(0).length,msg=buyProblem('infantry',0);
        state.trainQueue=[];state.units=state.units.filter(u=>u.type!=='scout');buy('scout',0);buy('scout',0);const scoutMsg=buyProblem('scout',0);
        return {cost,at49,at50,times,full,msg,scoutMsg};`);
      t.ok(r.cost.food === 45 && r.cost.gold === 0, 'lính giá 45 lúa, không vàng', r.cost);
      t.ok(r.at49 === 0 && r.at50 === 1, 'lính ra quân đúng giây 5', r);
      t.ok(r.times[0] === 6 && r.times[1] === 14, 'lính giáo + cung thủ ra ở giây 6 và 14', r.times);
      t.ok(r.full === 5 && /đầy/.test(r.msg), 'hàng đợi tối đa 5', r);
      t.ok(/tối đa 2 lính trinh sát/.test(r.scoutMsg), 'tối đa 2 trinh sát tính cả hàng đợi', r.scoutMsg);
      results.push(t.report());
    }

    if (want('ai')) {
      const t = checker('ai: AI tự chơi 8 phút trên 3 bản đồ');
      const runs = [];
      for (let k = 0; k < 3; k++) runs.push(await c.game(`fresh();setMode('ai');setGameStarted(true);for(let i=0;i<8*60*20;i++)update(.05);
        return {regions:state.regions.filter(r=>r.owner===1&&r.cp).length,units:state.units.filter(u=>u.team===1).length,farms:state.buildings.filter(b=>b.team===1&&b.kind==='farm').length};`));
      t.ok(runs.every(x => x.regions >= 2 && x.units >= 5), 'AI chiếm ≥ 2 vùng và có ≥ 5 quân', runs);
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
      await host.game(`state.resources[1]={food:500,wood:500,stone:0,gold:500};return 1`);
      await sleep(500);
      await guest.page("document.getElementById('infantry').click()");
      await sleep(1200);
      const q = await host.game(`return trainQueueOf(1).map(q=>q.type)`);
      const line = await guest.page("document.getElementById('trainQueue').textContent");
      t.ok(q[0] === 'infantry' && /huấn luyện/.test(line), 'khách mua lính → vào hàng đợi của chủ phòng, khách thấy dòng tiến độ', { q, line });
      await sleep(5500);
      const units = await guest.game(`return state.units.filter(u=>u.team===1).map(u=>u.type)`);
      t.ok(units.includes('infantry'), 'lính ra quân ở cả máy khách', units);
      // Guest captures a flag: its whole region becomes visible to the guest only.
      const target = await host.game(`const b=state.bases[1],r=state.regions.filter(r=>r.cp).sort((a,c)=>Math.hypot(a.cp.x-b.x,a.cp.y-b.y)-Math.hypot(c.cp.x-b.x,c.cp.y-b.y))[0];
        r.owner=1;r.cap=0;return r.id`);
      await sleep(1500);
      const vis = await guest.game(`refreshFog(state.enemyFogSeen);let n=0,v=0;for(let i=0;i<regionMap.length;i++)if(regionMap[i]===${target}){n++;if(fogVisible[i])v++;}return {n,v}`);
      t.ok(vis.n > 0 && vis.v === vis.n, 'vùng khách giữ hiện đủ tầm nhìn trên máy khách', vis);
      await guest.shot(OUT, 'pvp-guest');
    }
    t.ok(!host.errors.length && !guest.errors.length, 'không lỗi JavaScript', { host: host.errors, guest: guest.errors });
  } finally { host.close(); guest.close(); }
  results.push(t.report());
}

const failed = results.filter(x => !x).length;
console.log(failed ? `\n${failed} nhóm kiểm thử lỗi.` : '\nTất cả smoke test đạt.');
process.exit(failed ? 1 : 0);
