import type { InventoryItem } from '../types';
import { getObjectDef } from './objects';

/** Fold old seed records into adult objects without altering saved stock. */
export function getInventoryObjects(items: InventoryItem[]): InventoryItem[] {
  const grouped = new Map<string, InventoryItem>();
  for (const item of items) {
    if (item.quantity <= 0) continue;
    const def = getObjectDef(item.item_id);
    const itemId = def?.id || item.item_id;
    const itemType = def?.type || item.item_type;
    const key = `${itemType}:${itemId}`;
    const existing = grouped.get(key);
    if (existing) existing.quantity += item.quantity;
    else grouped.set(key, { ...item, id: key, item_id: itemId, item_type: itemType });
  }
  return [...grouped.values()];
}

/** Place one real inventory record, including records saved before the migration. */
export function findInventorySource(
  items: InventoryItem[],
  itemId: string,
): InventoryItem | undefined {
  const canonicalId = getObjectDef(itemId)?.id || itemId;
  return items.find(
    (item) => item.quantity > 0 && (getObjectDef(item.item_id)?.id || item.item_id) === canonicalId,
  );
}
