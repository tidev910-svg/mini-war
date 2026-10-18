// @ts-nocheck
// Canvas, view size, camera and zoom, world ↔ screen transforms (docs/features/controls.md, rendering.md).
import { H, TILE_SIZE, W } from '../config/map';
import { localTeam, state } from './game';

export const canvas=document.getElementById('game');
export const gameApp=document.getElementById('gameApp');
export const toggleSideHud=document.getElementById('toggleSideHud');
export let VIEW_W=canvas.width,VIEW_H=canvas.height;
export let MAP_WORLD_W=W,MAP_WORLD_H=H,MIN_ZOOM=Math.min(VIEW_W/MAP_WORLD_W,VIEW_H/MAP_WORLD_H),DEFAULT_ZOOM=VIEW_W/(TILE_SIZE*64),MAX_ZOOM=VIEW_W/(TILE_SIZE*32);
export let camX=0,camY=0,zoom=DEFAULT_ZOOM;
export function setCamX(v){return camX=v;}
export function setCamY(v){return camY=v;}
export function setZoom(v){return zoom=v;}
export const MAX_CANVAS_PIXELS=2100000;
export function syncWorldMetrics(){
  const rect=canvas.getBoundingClientRect();
  const cssWidth=Math.max(540,Math.round(rect.width || canvas.clientWidth || canvas.width));
  const cssHeight=Math.max(320,Math.round(rect.height || canvas.clientHeight || canvas.height));
  // The canvas fills the screen, so cap its backing store at MAX_CANVAS_PIXELS (CSS scales it up) to keep draw() affordable.
  const dpr=Math.min(window.devicePixelRatio||1,Math.sqrt(MAX_CANVAS_PIXELS/(cssWidth*cssHeight)));
  canvas.width=Math.max(540,Math.round(cssWidth*dpr));
  canvas.height=Math.max(320,Math.round(cssHeight*dpr));
  VIEW_W=canvas.width;VIEW_H=canvas.height;
  MAP_WORLD_W=W;MAP_WORLD_H=H;MIN_ZOOM=Math.min(VIEW_W/MAP_WORLD_W,VIEW_H/MAP_WORLD_H);DEFAULT_ZOOM=VIEW_W/(TILE_SIZE*64);MAX_ZOOM=VIEW_W/(TILE_SIZE*32);
  zoom=Math.max(MIN_ZOOM,Math.min(zoom || DEFAULT_ZOOM,MAX_ZOOM));
  clampCamera();
}
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
// Centre the camera on a world point (hotkeys, minimap).
export function centerCameraAt(x,y){camX=x-VIEW_W/zoom/2;camY=y-VIEW_H/zoom/2;clampCamera();}
// Canvas pixels covered by the HUD at the top (player panel) and bottom (action shields), for framing the camera.
export function hudInsets(){
  const r=canvas.getBoundingClientRect();if(!r.height)return {top:0,bottom:0};
  const s=VIEW_H/r.height,top=document.querySelector('.commander')?.getBoundingClientRect(),dock=document.querySelector('.action-dock')?.getBoundingClientRect();
  return {top:top?.height?Math.max(0,top.bottom-r.top)*s:0,bottom:dock?.height?Math.max(0,r.bottom-dock.top)*s:0};
}
// Frame the local side's fortress (blue for AI mode and the host, red for the guest) in the middle of the part of the
// screen the HUD leaves free. HOME_FRAME_LIFT: the fortress art and its label sit above its anchor point.
const HOME_FRAME_LIFT=40;
export function centerCameraOnHome(){
  const base=state.bases[localTeam()]||state.bases[0],p=worldToScreenPlane(base.x,base.y),inset=hudInsets();
  camX=p.x-VIEW_W/zoom/2;camY=p.y-HOME_FRAME_LIFT-(inset.top+(VIEW_H-inset.top-inset.bottom)/2)/zoom;clampCamera();
}
