import { getAssetDef } from '../data/assets';
import { getObjectDef } from '../data/objects';

export default function ObjectPreview({ itemId }: { itemId: string }) {
  const def = getObjectDef(itemId);
  const asset = getAssetDef(def?.renderKey || 'default');
  return asset.sourceType === 'img' ? (
    <img
      className="world-object-preview"
      src={asset.thumbnail || asset.source}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
    />
  ) : (
    <span className="world-inventory__item-emoji" aria-hidden="true">
      {def?.emoji || '📦'}
    </span>
  );
}
