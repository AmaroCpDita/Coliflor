import type { AssetDef } from '../data/assets';
import type { PlacedObject } from '../types';
import type { WorldCameraView } from './placement';
import { spritePointToScreen } from './orientation';

export function projectGroundLight(object: PlacedObject, asset: AssetDef, light: NonNullable<AssetDef['lights']>[number], camera: WorldCameraView) {
  const spill = light.ground || { radius: light.radius * .8, depth: light.radius * .45, intensity: .25 };
  const position = spritePointToScreen(object, asset, { x: light.x, y: asset.anchorY + (spill.offsetY || 0) / asset.height }, camera);
  const scale = (object.scale || 1) * camera.scale;
  return { ...position, width: spill.radius * 2 * scale, height: spill.depth * 2 * scale, intensity: spill.intensity };
}
