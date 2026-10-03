import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InventoryItem, PlacedObject } from '../types';
import { ALL_OBJECTS, getObjectDef } from '../data/objects';
import { getInventoryObjects } from '../data/catalog';
import { getBiomeDef } from '../data/biomes';
import ObjectPreview from './ObjectPreview';
import WorldModalPortal from './WorldModalPortal';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  selectedItemId?: string;
  level?: number;
  placedObjects?: PlacedObject[];
  rewardsError?: boolean;
  catalogUnavailable?: boolean;
  onRetryRewards?: () => void;
  biomeId?: string;
  forestCompleted?: boolean;
  forestChapterRequired?: boolean;
  unlockedBiomes?: string[];
  onSelectItemInBiome?: (item: InventoryItem, biomeId: string) => void;
  isSaving?: boolean;
  selectionError?: string | null;
}

export default function Inventory({ isOpen, onClose, items, onSelectItem, selectedItemId, level = 1, placedObjects = [], rewardsError, catalogUnavailable, onRetryRewards, biomeId = 'forest', forestCompleted = false, forestChapterRequired = false, unlockedBiomes = [], onSelectItemInBiome, isSaving = false, selectionError }: InventoryProps) {
  const [tab, setTab] = useState<'inventory' | 'collection'>('inventory');
  const stock = useMemo(() => getInventoryObjects(items), [items]);
  const grouped = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {};
    for (const item of stock) (groups[item.item_type] ||= []).push(item);
    return groups;
  }, [stock]);
  const owned = new Set([...stock.map(item => item.item_id), ...placedObjects.map(item => getObjectDef(item.item_id)?.id || item.item_id)]);
  const placementAction = (item: InventoryItem) => {
    const def = getObjectDef(item.item_id);
    const compatible = !def?.biomes || def.biomes.includes(biomeId);
    const destination = !compatible ? def?.biomes?.find(id => unlockedBiomes.includes(id)) : undefined;
    const canSelect = !!def?.placeable && (compatible || (!!destination && !!onSelectItemInBiome));
    return { compatible, destination, canSelect, select() {
      if (isSaving || !canSelect) return;
      if (compatible) onSelectItem(item);
      else if (destination) onSelectItemInBiome?.(item, destination);
    } };
  };
  const categoryLabels: Record<string, string> = {
    plant: '🌿 Plantas', tree: '🌳 Árboles', flower: '🌸 Flores',
    decoration: '🏮 Decoraciones', rock: '🪨 Piedras', building: '🏡 Construcciones',
    special: '✨ Especiales', material: '📦 Materiales',
  };
  return (
    <WorldModalPortal><AnimatePresence>
      {isOpen && (
        <motion.div className="world-inventory-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div className="world-inventory" role="dialog" aria-modal="true" aria-label="Inventario del mundo" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} onClick={e => e.stopPropagation()}>
            <div className="world-inventory__header">
              <h3>🎒 Inventario</h3>
              <button className="world-inventory__close" onClick={onClose} aria-label="Cerrar inventario">✕</button>
            </div>
            <div className="world-inventory__tabs" role="tablist" aria-label="Objetos del mundo">
              <button role="tab" aria-selected={tab === 'inventory'} onClick={() => setTab('inventory')}>Mis objetos</button>
              <button role="tab" aria-selected={tab === 'collection'} onClick={() => setTab('collection')}>Colección</button>
            </div>
            {catalogUnavailable
              ? <div className="world-inventory__notice" role="status">Las nuevas recompensas todavía no están disponibles.</div>
              : rewardsError && <div className="world-inventory__notice" role="status">No pudimos cargar las nuevas recompensas. <button onClick={onRetryRewards}>Reintentar</button></div>}
            <div className="world-inventory__content" role="tabpanel">
              {selectionError && <p className="world-inventory__notice" role="alert">{selectionError}</p>}
              {isSaving && <p className="world-inventory__notice" role="status">Abriendo el bioma…</p>}
              {tab === 'inventory' && stock.some(item => {
                const def = getObjectDef(item.item_id);
                return def?.biomes && !def.biomes.includes(biomeId);
              }) && <p className="world-inventory__hint">Estás en {getBiomeDef(biomeId)?.name || biomeId}. Los objetos de otros biomas siguen siendo tuyos: podrás colocarlos al visitar su bioma.</p>}
              {tab === 'collection' ? (
                <>
                  <p className="world-inventory__hint">Cada nivel trae algo nuevo. Disponible significa que puedes obtenerlo; para colocarlo necesitas una copia en Mis objetos. El regalo diario da copias extra.</p>
                  <div className="world-inventory__grid">
                    {[...ALL_OBJECTS].sort((a, b) => a.requiredLevel - b.requiredLevel).map(def => {
                      const chapterBlocked = forestChapterRequired && def.requiredLevel >= 21;
                      const unlocked = (def.unlockCondition ? forestCompleted : !chapterBlocked && level >= def.requiredLevel) || owned.has(def.id);
                      const item = stock.find(item => item.item_id === def.id);
                      const action = item ? placementAction(item) : null;
                      return <button type="button" key={def.id} className={`world-inventory__item world-collection__item ${unlocked ? '' : 'world-collection__item--locked'}`} title={def.description} disabled={isSaving || !action?.canSelect} onClick={() => action?.select()}>
                        <ObjectPreview itemId={def.id} />
                        <span className="world-inventory__item-name">{def.name}</span>
                        <span className="world-collection__status">{unlocked ? (owned.has(def.id) ? '✓ Obtenido' : catalogUnavailable && def.requiredLevel > 1 ? 'Por recibir' : 'Disponible para obtener') : def.unlockCondition || (chapterBlocked && level >= def.requiredLevel) ? '💚 Completa el bosque' : `🔒 Nivel ${def.requiredLevel}`}</span>
                        {item && <span className="world-collection__status">{action?.compatible ? `Colocar · ×${item.quantity}` : action?.destination ? `Ir a ${getBiomeDef(action.destination)?.name} y colocar` : `Para ${def.biomes?.map(id => getBiomeDef(id)?.name || id).join(' / ')}`}</span>}
                        {!item && unlocked && <span className="world-collection__status">{owned.has(def.id) ? 'Ya colocado' : 'Sin copias disponibles'}</span>}
                      </button>;
                    })}
                  </div>
                </>
              ) : stock.length === 0 ? (
                <div className="world-inventory__empty"><p>Tu inventario está vacío</p><p>Reclama recompensas o sube de nivel para obtener objetos.</p></div>
              ) : Object.entries(grouped).map(([category, categoryItems]) => (
                <div key={category} className="world-inventory__category">
                  <h4 className="world-inventory__category-title">{categoryLabels[category] || 'Otros objetos'}</h4>
                  <div className="world-inventory__grid">
                    {categoryItems.map(item => {
                      const def = getObjectDef(item.item_id);
                      const action = placementAction(item);
                      const { compatible } = action;
                      const destination = def?.biomes?.map(id => getBiomeDef(id)?.name || id).join(' / ');
                      return <button key={item.id} className={`world-inventory__item ${selectedItemId === item.item_id ? 'world-inventory__item--selected' : ''}`} onClick={action.select} disabled={isSaving || !action.canSelect} title={!compatible ? `Puedes colocarlo en ${destination}` : def?.placeable ? `Colocar ${def.name}` : 'Objeto de recompensa'}>
                        <ObjectPreview itemId={item.item_id} />
                        <span className="world-inventory__item-qty">×{item.quantity}</span>
                        <span className="world-inventory__item-name">{def?.name || item.item_id}</span>
                        {!compatible && <span className="world-collection__status">{action.destination ? `Ir a ${getBiomeDef(action.destination)?.name} y colocar` : `Para ${destination} · bioma bloqueado`}</span>}
                        {compatible && !def?.placeable && <span className="world-collection__status">Recurso</span>}
                      </button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence></WorldModalPortal>
  );
}
