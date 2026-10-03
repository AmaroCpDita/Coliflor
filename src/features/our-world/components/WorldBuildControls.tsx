import { useRef } from 'react';
import type { PointerEvent, KeyboardEvent } from 'react';
import type { PlacedObject } from '../types';
import { getPlacementDef } from '../data/objects';
import { isObjectFlipped } from '../engine/orientation';
import { clampWorldPosition, screenDeltaToWorld, worldToScreen } from '../engine/placement';
import type { WorldCameraView, WorldPosition } from '../engine/placement';

interface Props {
  object: PlacedObject;
  camera: WorldCameraView;
  isSaving: boolean;
  onPreview: (position: WorldPosition | null) => void;
  onMove: (position: WorldPosition) => void;
  onRemove: () => void;
  onFlip: () => void;
  onClose: () => void;
}

export default function WorldBuildControls({ object, camera, isSaving, onPreview, onMove, onRemove, onFlip, onClose }: Props) {
  const drag = useRef<{ pointerId: number; x: number; y: number; start: WorldPosition; latest: WorldPosition; moved: boolean } | null>(null);
  const name = getPlacementDef(object.item_id)?.name || object.item_id;
  const anchor = worldToScreen({ x: object.position_x, y: object.position_y }, camera);
  const screenX = Math.max(40, Math.min(camera.width - 40, anchor.x));
  const screenY = Math.max(180, Math.min(camera.height - 210, anchor.y + 24));

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isSaving || !event.isPrimary || event.button !== 0) return;
    const start = { x: object.position_x, y: object.position_y };
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, start, latest: start, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    if (Math.hypot(dx, dy) < 4 && !active.moved) return;
    active.moved = true;
    const delta = screenDeltaToWorld(dx, dy, camera.scale);
    active.latest = clampWorldPosition(object.item_id, active.start.x + delta.x, active.start.y + delta.y, object.scale, isObjectFlipped(object));
    onPreview(active.latest);
  };
  const finishDrag = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    event.stopPropagation();
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled) onPreview(null);
    else if (active.moved) onMove(active.latest);
  };
  const moveWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const steps: Record<string, WorldPosition> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: 1 }, ArrowDown: { x: 0, y: -1 } };
    const delta = steps[event.key];
    if (!delta || isSaving) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 3 : 1;
    const position = clampWorldPosition(object.item_id, object.position_x + delta.x * step, object.position_y + delta.y * step, object.scale, isObjectFlipped(object));
    onPreview(position);
    onMove(position);
  };

  return (
    <div className="world-build-controls" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
      <button type="button" className="world-build-controls__move" aria-label={`Mover ${name}`} title="Arrastra para mover; también puedes usar las flechas del teclado"
        style={{ left: screenX, top: screenY }} disabled={isSaving}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={e => finishDrag(e)} onPointerCancel={e => finishDrag(e, true)}
        onLostPointerCapture={() => { if (drag.current) { drag.current = null; onPreview(null); } }} onKeyDown={moveWithKeyboard}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path d="M24 3L16 11H21V21H11V16L3 24L11 32V27H21V37H16L24 45L32 37H27V27H37V32L45 24L37 16V21H27V11H32L24 3Z" fill="#fffce5" stroke="#36643d" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="world-build-controls__toolbar">
        <div className="world-build-controls__info">
          <strong>{name}</strong>
          <span role="status">{isSaving ? 'Guardando…' : `${Math.round(object.scale * 100)} % · 2 dedos: tamaño`}</span>
        </div>
        <button type="button" disabled={isSaving} aria-label={`Voltear ${name}`} aria-pressed={isObjectFlipped(object)} title="Cambiar lado" onClick={() => { if (!drag.current) onFlip(); }}>↔</button>
        <button type="button" className="world-build-controls__remove" disabled={isSaving} aria-label={`Eliminar ${name}`} title="Eliminar lo devuelve al inventario" onClick={onRemove}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" disabled={isSaving} aria-label="Listo" title="Terminar de editar" onClick={onClose}>✓</button>
      </div>
    </div>
  );
}
