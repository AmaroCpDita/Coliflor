import type { PlacedObject } from '../types';
import type { AssetDef } from '../data/assets';
import { worldToScreen } from './placement';
import type { WorldCameraView, WorldPosition } from './placement';

export function isObjectFlipped(object: Pick<PlacedObject, 'state'>): boolean {
  return object.state?.flipped === true;
}

/** Project sprite details using the same anchored mirror/rotation as the artwork. */
export function spritePointToScreen(object: PlacedObject, asset: AssetDef, point: WorldPosition, camera: WorldCameraView): WorldPosition {
  const anchor = worldToScreen({ x: object.position_x, y: object.position_y }, camera);
  const scale = (object.scale || 1) * camera.scale;
  const dx = (point.x - asset.anchorX) * asset.width * scale * (isObjectFlipped(object) ? -1 : 1);
  const dy = (point.y - asset.anchorY) * asset.height * scale;
  const angle = (object.rotation || 0) * Math.PI / 180;
  return { x: anchor.x + dx * Math.cos(angle) - dy * Math.sin(angle), y: anchor.y + dx * Math.sin(angle) + dy * Math.cos(angle) };
}
