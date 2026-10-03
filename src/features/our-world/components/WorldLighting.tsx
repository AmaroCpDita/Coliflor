import type { PlacedObject } from '../types';
import type { WorldCameraView } from '../engine/placement';
import { nightLightStrength } from '../engine/placement';
import { getPlacementDef } from '../data/objects';
import { getAssetDef } from '../data/assets';
import { spritePointToScreen } from '../engine/orientation';
import { projectGroundLight } from '../engine/lighting';

export default function WorldLighting({ objects, camera, lightIntensity }: { objects: PlacedObject[]; camera: WorldCameraView; lightIntensity: number }) {
  const strength = nightLightStrength(lightIntensity);
  if (strength <= 0) return null;
  let fireflyBudget = 12;
  return (
    <div className="world-lighting" aria-hidden="true" style={{ opacity: strength }}>
      {objects.map(object => {
        const asset = getAssetDef(getPlacementDef(object.item_id)?.renderKey || 'default');
        if (!asset.lights?.length && !asset.fireflies?.length) return null;
        const flies = (asset.fireflies || []).slice(0, Math.min(4, fireflyBudget));
        fireflyBudget -= flies.length;
        return (
          <div key={object.id}>
            {asset.lights?.map((light, index) => {
              const ground = projectGroundLight(object, asset, light, camera);
              return <div key={`ground-${index}`} className={`world-lighting__ground${light.color === 'cyan' ? ' world-lighting__ground--cyan' : ''}`} style={{ left: ground.x, top: ground.y, width: ground.width, height: ground.height, opacity: ground.intensity }} />;
            })}
            {asset.lights?.map((light, index) => (
              <div key={index} className={`world-lighting__bloom${light.color === 'cyan' ? ' world-lighting__bloom--cyan' : ''}`} style={{
                left: spritePointToScreen(object, asset, light, camera).x,
                top: spritePointToScreen(object, asset, light, camera).y,
                width: light.radius * 2 * object.scale * camera.scale,
                height: light.radius * 2 * object.scale * camera.scale,
              }}>
                <span className="world-lighting__core" style={{ width: light.core * object.scale * camera.scale, height: light.core * object.scale * camera.scale }} />
              </div>
            ))}
            {flies.map((fly, index) => (
              <span key={`fly-${index}`} className="world-firefly" style={{
                left: spritePointToScreen(object, asset, fly, camera).x,
                top: spritePointToScreen(object, asset, fly, camera).y,
                width: Math.max(2, 6 * object.scale * camera.scale),
                height: Math.max(2, 6 * object.scale * camera.scale),
                animationDelay: `${-index * 1.7}s`, animationDuration: `${5 + index * .8}s`,
              }} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
