// @ts-nocheck
// Shared match state and small helpers used everywhere: state, mode/net role, pause/end flags, selection, resources, log (docs/architecture.md).
import { RESOURCE_NAMES } from '../config/balance';

export const $=id=>document.getElementById(id);
export let state;
export function setState(v){return state=v;}
export let accumulator=0,paused=false,ended=false,selected=null,gameTime=0;
export function setPaused(v){return paused=v;}
export function setEnded(v){return ended=v;}
export function setSelected(v){return selected=v;}
export function setGameTime(v){return gameTime=v;}
export let nextId=1,logTimer=0,draggingFarm=null;
// Ids for effects and bullets (display only: the soundscape plays each hit or shot once, also on the PvP guest).
export let fxSeq=0;
export function nextFxId(){return fxSeq=fxSeq+1;}
export function setNextId(v){return nextId=v;}
export function setDraggingFarm(v){return draggingFarm=v;}
export let placement=null,suppressNextCanvasClick=false,selectedFortress=null,selectedBuilding=null,selectedFlag=null;
export function setPlacement(v){return placement=v;}
export function setSuppressNextCanvasClick(v){return suppressNextCanvasClick=v;}
export function setSelectedFortress(v){return selectedFortress=v;}
export function setSelectedBuilding(v){return selectedBuilding=v;}
export function setSelectedFlag(v){return selectedFlag=v;}
export let mode='ai',gameStarted=false,peer=null,conn=null,netRole=null,roomCode='';
export function setMode(v){return mode=v;}
export function setGameStarted(v){return gameStarted=v;}
export function setPeer(v){return peer=v;}
export function setConn(v){return conn=v;}
export function setNetRole(v){return netRole=v;}
export function setRoomCode(v){return roomCode=v;}
export let localSelectedIds=new Set(),connectionIntent='';
export function setConnectionIntent(v){return connectionIntent=v;}
export function localTeam(){return mode==='pvp'&&netRole==='guest'?1:0;}
export function isMultiplayer(){return mode==='pvp';}
export function teamResources(team){return state.resources[team];}
export function canAfford(team,cost){const res=teamResources(team);return Object.entries(cost).every(([key,amount])=>res[key]>=amount);}
export function spend(team,cost){const res=teamResources(team);for(const [key,amount] of Object.entries(cost))res[key]-=amount;}
export function costText(cost){return Object.entries(cost).map(([key,amount])=>amount+' '+RESOURCE_NAMES[key]).join(' · ');}
export function formatAmount(value){return String(Math.round(value*10)/10).replace('.',',');}
export function missingText(team,cost){const res=teamResources(team);return Object.entries(cost).filter(([key,amount])=>res[key]<amount).map(([key,amount])=>Math.ceil(amount-res[key])+' '+RESOURCE_NAMES[key]).join(', ');}
export function normalizeUnitType(type){return type==='tank'?'spearman':type;}
// Battle log line. tone 'danger' marks alerts (under attack, losses): red in the history, red rim on the notice banner.
export function addLog(msg,tone=''){const el=document.createElement('div');el.textContent=msg;if(tone)el.className='tone-'+tone;$('feed').prepend(el);while($('feed').children.length>12)$('feed').lastChild.remove();}
// The local player tried something they cannot pay for: the HUD flashes the missing resources (ui/hud.ts listens).
export function notifyShortfall(team,cost){if(team!==localTeam()||!state)return;const res=teamResources(team),keys=Object.entries(cost).filter(([key,amount])=>res[key]<amount).map(([key])=>key);if(keys.length)document.dispatchEvent(new CustomEvent('resource-shortfall',{detail:keys}));}
export function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
