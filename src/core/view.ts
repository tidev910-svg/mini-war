// @ts-nocheck
// Canvas, view size, camera and zoom, world ↔ screen transforms (docs/features/controls.md, rendering.md).
import { H, TILE_SIZE, W } from '../config/map';
import { localTeam, state } from './game';
import { baseDir } from '../map/bases';

export const canvas=document.getElementById('game');
export const gameApp=document.getElementById('gameApp');
export const toggleSideHud=document.getElementById('toggleSideHud');
export const portraitMode=window.matchMedia('(max-width: 720px) and (orientation: portrait)').matches;
export let VIEW_W=canvas.width,VIEW_H=canvas.height;
export let MAP_WORLD_W=W,MAP_WORLD_H=H,MIN_ZOOM=Math.min(VIEW_W/MAP_WORLD_W,VIEW_H/MAP_WORLD_H),DEFAULT_ZOOM=VIEW_W/(TILE_SIZE*64),MAX_ZOOM=VIEW_W/(TILE_SIZE*32);
export let camX=0,camY=0,zoom=DEFAULT_ZOOM;
export function setCamX(v){return camX=v;}
export function setCamY(v){return camY=v;}
export function setZoom(v){return zoom=v;}
export function syncWorldMetrics(){
  const rect=canvas.getBoundingClientRect();
  const cssWidth=Math.max(540,Math.round(rect.width || canvas.clientWidth || canvas.width));
  const cssHeight=Math.max(320,Math.round(rect.height || canvas.clientHeight || canvas.height));
  const dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(540,Math.round(cssWidth*dpr));
  canvas.height=Math.max(320,Math.round(cssHeight*dpr));
  VIEW_W=canvas.width;VIEW_H=canvas.height;
  MAP_WORLD_W=W;MAP_WORLD_H=H;MIN_ZOOM=Math.min(VIEW_W/MAP_WORLD_W,VIEW_H/MAP_WORLD_H);DEFAULT_ZOOM=VIEW_W/(TILE_SIZE*64);MAX_ZOOM=VIEW_W/(TILE_SIZE*32);
  zoom=Math.max(MIN_ZOOM,Math.min(zoom || DEFAULT_ZOOM,MAX_ZOOM));
  clampCamera();
}
if(portraitMode){canvas.width=540;canvas.height=960;}else if(window.innerWidth>=900){canvas.width=960;canvas.height=960;}
syncWorldMetrics();
export const ctx=canvas.getContext('2d');
export let renderView={scale:zoom,offsetX:0,offsetY:0};
export function setRenderView(v){return renderView=v;}
export function worldToScreenPlane(x,y){return {x,y};}
export function screenPlaneToWorld(x,y){return {x,y};}
export function viewOffsets(scale=zoom){return {x:MAP_WORLD_W*scale<VIEW_W?(VIEW_W-MAP_WORLD_W*scale)/2:-camX*scale,y:MAP_WORLD_H*scale<VIEW_H?(VIEW_H-MAP_WORLD_H*scale)/2:-camY*scale};}
export function worldToCanvas(x,y){const p=worldToScreenPlane(x,y),o=viewOffsets();return {x:o.x+p.x*zoom,y:o.y+p.y*zoom};}
export function drawUprightAt(x,y,drawFn){const p=worldToScreenPlane(x,y);ctx.save();ctx.setTransform(renderView.scale,0,0,renderView.scale,renderView.offsetX+(p.x-x)*renderView.scale,renderView.offsetY+(p.y-y)*renderView.scale);drawFn();ctx.restore();}
export function clampCamera(){camX=Math.max(0,Math.min(Math.max(0,MAP_WORLD_W-VIEW_W/zoom),camX));camY=Math.max(0,Math.min(Math.max(0,MAP_WORLD_H-VIEW_H/zoom),camY));}
// Frame the local side's fortress (blue for AI mode and the host, red for the guest).
export function centerCameraOnHome(){const base=state.bases[localTeam()]||state.bases[0],p=worldToScreenPlane(base.x,base.y);camX=p.x-VIEW_W/zoom*(baseDir(base)>0?.30:.70);camY=p.y-VIEW_H/zoom*.58;clampCamera();}
