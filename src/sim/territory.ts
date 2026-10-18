// @ts-nocheck
// Flag capture rules (docs/features/territory.md).
import { TILE_SIZE } from '../config/map';
import { addLog, localTeam, state } from '../core/game';
import { FLAG_CAPTURE_BASE_SECONDS, FLAG_CAPTURE_EXPONENT, FLAG_CAPTURE_MAX_UNITS, FLAG_CAPTURE_RADIUS_TILES, FLAG_DECAY_DELAY_SECONDS, FLAG_DECAY_SECONDS, FLAG_SCOUTS_CAPTURE, RESOURCE_NAMES } from '../config/balance';
import { revealRegion, teamCanSee } from './fog';
import { regionLabel } from '../map/regions';

// ---- Flag capture (territory.md). Runs on the host every simulation step. ----
export function captureSeconds(units){return FLAG_CAPTURE_BASE_SECONDS/Math.pow(Math.min(Math.max(1,units),FLAG_CAPTURE_MAX_UNITS),FLAG_CAPTURE_EXPONENT);}
export function flagCapturers(r,team){const rad=FLAG_CAPTURE_RADIUS_TILES*TILE_SIZE;let n=0;for(const u of state.units)if(u.team===team&&u.hp>0&&(FLAG_SCOUTS_CAPTURE||u.type!=='scout')&&Math.hypot(u.x-r.cp.x,u.y-r.cp.y)<=rad)n++;return n;}
export function regionOutpost(r){return state.buildings.find(b=>b.kind==='outpost'&&b.regionId===r.id&&b.team===r.owner)||null;}
// One side alone in range moves the flag. An enemy flag takes two stages: stage 1 lowers it to neutral, stage 2 captures it
// (r.stage2 remembers who lowered it, for the label). Both sides in range, or the owner's outpost still standing, pauses progress.
// The owner standing at its own flag erases the attacker's progress at the same speed. With nobody in range for
// FLAG_DECAY_DELAY_SECONDS the progress decays to 0; decay never changes the owner.
export function captureStage(r){return r.capTeam<0||r.cap<=0?0:r.owner>=0?1:r.stage2===r.capTeam?2:0;}
export function updateCaptures(dt){
 const me=localTeam();
 for(const r of state.regions){
  if(!r.cp)continue;
  const n=[flagCapturers(r,0),flagCapturers(r,1)],team=n[0]&&!n[1]?0:n[1]&&!n[0]?1:-1;
  const guarded=team>=0&&r.owner>=0&&team!==r.owner&&!!regionOutpost(r);
  const contested=(n[0]>0&&n[1]>0)||guarded;
  if(contested&&!r.contested&&(n[me]>0||r.owner===me))addLog(guarded?(r.owner===me?`Tiền đồn của bạn đang giữ cờ ${regionLabel(r)}: đối phương chưa chiếm được.`:`Cờ ${regionLabel(r)} có tiền đồn địch giữ: phải phá tiền đồn trước.`):`Cột cờ ${regionLabel(r)} đang bị tranh chấp: tiến độ chiếm tạm dừng.`);
  r.contested=contested;
  if(!n[0]&&!n[1]){
   r.idle=(r.idle||0)+dt;
   if(r.idle>=FLAG_DECAY_DELAY_SECONDS&&r.cap>0){r.cap=Math.max(0,r.cap-dt/FLAG_DECAY_SECONDS);if(r.cap===0){r.capTeam=-1;r.stage2=-1;}}
   continue;
  }
  r.idle=0;
  if(contested||team<0)continue;
  const step=dt/captureSeconds(n[team]);
  if(team===r.owner||(r.capTeam!==team&&r.cap>0)){
   if(r.cap>0){r.cap=Math.max(0,r.cap-step);if(r.cap===0){r.capTeam=-1;r.stage2=-1;}}
   continue;
  }
  if(r.capTeam!==team){r.capTeam=team;if(team===me)addLog(r.owner>=0?`Giai đoạn 1/2 · hạ cờ địch ở ${regionLabel(r)}: ${n[team]} quân, khoảng ${Math.round(captureSeconds(n[team]))} giây.`:`Đang chiếm cờ ${regionLabel(r)}: ${n[team]} quân, khoảng ${Math.round(captureSeconds(n[team]))} giây.`);}
  r.cap=Math.min(1,r.cap+step);if(r.cap<1)continue;
  r.cap=0;
  if(r.owner<0){
   r.owner=team;r.capTeam=-1;r.stage2=-1;revealRegion(team===0?state.fogSeen:state.enemyFogSeen,r.id);
   if(team===me)addLog(`Đã chiếm ${regionLabel(r)}: mỏ trong vùng bắt đầu sinh ${RESOURCE_NAMES[r.resource]}.`);
   else if(teamCanSee(me,r.cp.x,r.cp.y))addLog(`Đối phương đã chiếm ${regionLabel(r)}.`);
  }else{
   const lost=r.owner;r.owner=-1;r.stage2=team;
   if(lost===me)addLog(`Mất ${regionLabel(r)}: cờ đã bị hạ về trung lập.`,'danger');
   else if(team===me)addLog(`Giai đoạn 2/2 · đã hạ cờ địch ở ${regionLabel(r)}: vùng về trung lập, tiếp tục đứng để chiếm.`);
  }
 }
}
