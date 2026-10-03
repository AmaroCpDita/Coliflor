import { WORLD_FRAME } from '../data/dioramas';
import { getAssetDef } from '../data/assets';
import { getPlacementDef } from '../data/objects';

export interface WorldPosition { x: number; y: number }
export const MIN_OBJECT_SCALE = 0.5;
export const MAX_OBJECT_SCALE = 1.5;
export function clampObjectScale(scale: number): number {
  return Math.round(Math.max(MIN_OBJECT_SCALE, Math.min(MAX_OBJECT_SCALE, scale)) * 100) / 100;
}
export interface WorldCameraView {
  width: number; height: number; scale: number; offsetX: number; offsetY: number;
}

export function clampWorldPosition(itemId: string, x: number, y: number, scale = 1, flipped = false): WorldPosition {
  const asset = getAssetDef(getPlacementDef(itemId)?.renderKey || 'default');
  const anchorX = flipped ? 1 - asset.anchorX : asset.anchorX;
  const left = Math.max(2, asset.width * scale * anchorX / WORLD_FRAME.width * 100);
  const right = Math.min(98, 100 - asset.width * scale * (1 - anchorX) / WORLD_FRAME.width * 100);
  const top = Math.min(62, 100 - asset.height * scale * asset.anchorY / WORLD_FRAME.height * 100);
  const bottom = Math.max(6, asset.height * scale * (1 - asset.anchorY) / WORLD_FRAME.height * 100);
  return { x: Math.max(left, Math.min(right, x)), y: Math.max(bottom, Math.min(top, y)) };
}

export function worldToScreen(position: WorldPosition, view: WorldCameraView): WorldPosition {
  const width = WORLD_FRAME.width * view.scale;
  const height = WORLD_FRAME.height * view.scale;
  return {
    x: (view.width - width) / 2 + view.offsetX + position.x / 100 * width,
    y: (view.height - height) / 2 + view.offsetY + (1 - position.y / 100) * height,
  };
}

export function screenDeltaToWorld(dx: number, dy: number, cameraScale: number): WorldPosition {
  return { x: dx / (WORLD_FRAME.width * cameraScale) * 100, y: -dy / (WORLD_FRAME.height * cameraScale) * 100 };
}

export function nightLightStrength(lightIntensity: number): number {
  return Math.max(0, Math.min(1, (0.65 - lightIntensity) / 0.5));
}
