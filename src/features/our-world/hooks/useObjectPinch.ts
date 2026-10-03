import { useEffect, useRef } from 'react';
import type { PointerEvent, MouseEvent } from 'react';
import type { PlacedObject } from '../types';
import { clampObjectScale, clampWorldPosition, screenDeltaToWorld } from '../engine/placement';
import type { WorldPosition } from '../engine/placement';
import { isObjectFlipped } from '../engine/orientation';

/** Two touches anywhere around the selected object; preview locally, save once on release. */
export function useObjectPinch(object: PlacedObject | null, enabled: boolean,
  onPreview: (object: PlacedObject | null) => void,
  onCommit: (scale: number, original: PlacedObject) => void,
  cameraScale = 1, onMove?: (position: WorldPosition) => void) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ object: PlacedObject; distance: number; scale: number } | null>(null);
  const suppressUntil = useRef(0);
  const draining = useRef(false);
  const drag = useRef<{ object: PlacedObject; pointerId: number; x: number; y: number; latest: WorldPosition; moved: boolean } | null>(null);
  useEffect(() => {
    pointers.current.clear();
    gesture.current = null;
    draining.current = false;
    drag.current = null;
  }, [object?.id]);

  const distance = () => {
    const [a, b] = [...pointers.current.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const excluded = (target: EventTarget) => (target as HTMLElement).closest('button, input, .world-build-controls, .world-inventory-backdrop, .world-map-backdrop, .world-reward-backdrop');

  return {
    onPointerDownCapture(event: PointerEvent<HTMLDivElement>) {
      if (!enabled || !object || event.pointerType !== 'touch' || excluded(event.target)) return;
      if (gesture.current) { event.stopPropagation(); return; }
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size === 1 && onMove && (event.target as HTMLElement).closest('.world-object--selected')) {
        drag.current = { object, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
          latest: { x: object.position_x, y: object.position_y }, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (pointers.current.size !== 2 || draining.current) return;
      const startDistance = distance();
      if (startDistance < 10) return;
      if (drag.current?.moved) onPreview(null);
      drag.current = null;
      gesture.current = { object, distance: startDistance, scale: object.scale };
      suppressUntil.current = Date.now() + 500;
      for (const id of pointers.current.keys()) event.currentTarget.setPointerCapture(id);
      event.stopPropagation();
    },
    onPointerMoveCapture(event: PointerEvent<HTMLDivElement>) {
      if (!pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const active = gesture.current;
      if (!active) {
        const moving = drag.current;
        if (!moving || moving.pointerId !== event.pointerId || draining.current) return;
        const dx = event.clientX - moving.x, dy = event.clientY - moving.y;
        if (Math.hypot(dx, dy) < 5 && !moving.moved) return;
        event.stopPropagation();
        moving.moved = true;
        const delta = screenDeltaToWorld(dx, dy, cameraScale);
        moving.latest = clampWorldPosition(moving.object.item_id, moving.object.position_x + delta.x, moving.object.position_y + delta.y, moving.object.scale, isObjectFlipped(moving.object));
        onPreview({ ...moving.object, position_x: moving.latest.x, position_y: moving.latest.y });
        suppressUntil.current = Date.now() + 500;
        return;
      }
      event.stopPropagation();
      active.scale = clampObjectScale(active.object.scale * distance() / active.distance);
      const position = clampWorldPosition(active.object.item_id, active.object.position_x, active.object.position_y, active.scale, isObjectFlipped(active.object));
      onPreview({ ...active.object, scale: active.scale, position_x: position.x, position_y: position.y });
      suppressUntil.current = Date.now() + 500;
    },
    onPointerUpCapture(event: PointerEvent<HTMLDivElement>) {
      if (!pointers.current.has(event.pointerId)) return;
      pointers.current.delete(event.pointerId);
      const active = gesture.current;
      const moving = drag.current;
      if (!active && moving?.pointerId === event.pointerId) {
        event.stopPropagation();
        drag.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        suppressUntil.current = Date.now() + 500;
        if (moving.moved) onMove?.(moving.latest);
        return;
      }
      if (!active && !draining.current) return;
      event.stopPropagation();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      gesture.current = null;
      draining.current = pointers.current.size > 0;
      suppressUntil.current = Date.now() + 500;
      if (active) onCommit(active.scale, active.object);
    },
    onPointerCancelCapture(event: PointerEvent<HTMLDivElement>) {
      if (!pointers.current.has(event.pointerId)) return;
      const active = gesture.current;
      const moving = drag.current;
      for (const id of pointers.current.keys()) {
        if (event.currentTarget.hasPointerCapture(id)) event.currentTarget.releasePointerCapture(id);
      }
      pointers.current.clear();
      gesture.current = null;
      draining.current = false;
      drag.current = null;
      if (active || moving) {
        event.stopPropagation();
        suppressUntil.current = Date.now() + 500;
        onPreview(null);
      }
    },
    onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (Date.now() < suppressUntil.current && !excluded(event.target)) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}
