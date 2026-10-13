// ============================================================
// Nuestro Mundo — World Object Component
// ============================================================
// Renders a single world object with animations and interactions.
// ============================================================

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { getPlacementDef } from '../data/objects';
import { getAssetDef } from '../data/assets';
import { isObjectFlipped } from '../engine/orientation';
import { getRenderer, FallbackRenderer } from './Renderers';
import type { PlacedObject, ParticleType } from '../types';

interface WorldObjectProps {
  placedObject: PlacedObject;
  onInteract?: (obj: PlacedObject, screenX: number, screenY: number) => void;
  buildMode?: boolean;
  selected?: boolean;
  onSelect?: (obj: PlacedObject) => void;
  lightIntensity?: number;
}

function WorldObject({
  placedObject,
  onInteract,
  buildMode,
  selected,
  onSelect,
  lightIntensity = 1,
}: WorldObjectProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const objDef = useMemo(() => getPlacementDef(placedObject.item_id), [placedObject.item_id]);
  const assetDef = useMemo(() => getAssetDef(objDef?.renderKey || 'default'), [objDef]);

  const Renderer = useMemo(() => {
    if (assetDef.sourceType === 'svg') return getRenderer(assetDef.source) || FallbackRenderer;
    return FallbackRenderer;
  }, [assetDef]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Randomized animation
  const animStyle = useMemo(() => {
    if (!objDef?.animation || objDef.animation.type === 'none') return {};
    const [minDur, maxDur] = objDef.animation.duration;
    const duration = minDur + (objDef.animation.randomize ? Math.random() * (maxDur - minDur) : 0);
    const delay = objDef.animation.randomize ? Math.random() * duration : 0;
    const intensity = objDef.animation.intensity;

    switch (objDef.animation.type) {
      case 'sway':
        return {
          animation: `worldSway ${duration}s ease-in-out ${delay}s infinite`,
          '--sway-deg': `${intensity * 3}deg`,
          '--sway-skew': `${intensity * 1.5}deg`,
          transformOrigin: 'bottom center',
        } as React.CSSProperties;
      case 'bob':
        return {
          animation: `worldBob ${duration}s ease-in-out ${delay}s infinite`,
          '--bob-px': `${intensity * 4}px`,
          transformOrigin: 'bottom center',
        } as React.CSSProperties;
      case 'pulse':
        return {
          animation: `worldPulse ${duration}s ease-in-out ${delay}s infinite`,
          '--pulse-scale': `${1 + intensity * 0.1}`,
          transformOrigin: 'center center',
        } as React.CSSProperties;
      case 'grow':
        return {
          animation: `worldGrow ${duration}s ease-out forwards`,
          transformOrigin: 'bottom center',
        } as React.CSSProperties;
      default:
        return {};
    }
  }, [objDef]);

  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (buildMode) {
        if (onSelect) onSelect(placedObject);
        return;
      }

      if (!onInteract || !objDef?.interaction) return;

      // Get screen position for particle burst
      const rect = containerRef.current?.getBoundingClientRect();
      const screenX = rect ? rect.left + rect.width / 2 : 0;
      const screenY = rect ? rect.top + rect.height / 2 : 0;

      setIsInteracting(true);
      onInteract(placedObject, screenX, screenY);

      setTimeout(() => setIsInteracting(false), 150); // "tuc-tuc" rápido
    },
    [placedObject, onInteract, buildMode, onSelect, objDef],
  );

  if (!objDef) return null;

  const width = assetDef.width * (placedObject.scale || 1);
  const height = assetDef.height * (placedObject.scale || 1);
  const zIndex = Math.floor((100 - placedObject.position_y) * 10) + (assetDef.zOffset || 0);

  // Atmospheric Depth & Color Grading
  const depthFactor = Math.max(0, placedObject.position_y - 20) / 80;
  const atmosContrast = 1 - depthFactor * 0.06;
  const atmosSaturate = 1 - depthFactor * 0.08;
  const baseFilter = `contrast(${atmosContrast}) saturate(${atmosSaturate}) brightness(${isInteracting && objDef.interaction?.effect === 'glow' ? 1.8 : buildMode ? 1.12 : 0.65 + lightIntensity * 0.35})`;

  return (
    <div
      ref={containerRef}
      className={`world-object ${selected ? 'world-object--selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${placedObject.position_x}%`,
        bottom: `${placedObject.position_y}%`,
        transform: `translate(-${assetDef.anchorX * 100}%, ${(1 - assetDef.anchorY) * 100}%)`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex,
        pointerEvents: 'none',
      }}
    >
      {selected && (
        <div
          className="world-object__footprint"
          style={{
            left: `${assetDef.anchorX * 100}%`,
            top: `${assetDef.anchorY * 100}%`,
            width: `${Math.max(80, width * 0.7)}px`,
            height: `${Math.max(35, width * 0.23)}px`,
          }}
        />
      )}
      {/* 0. Shadow & Ambient Occlusion (Anclado al suelo real, NO rebota ni oscila) */}
      <div
        style={{
          position: 'absolute',
          left: `${assetDef.anchorX * 100}%`,
          top: `${assetDef.anchorY * 100}%`,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {/* Contact Shadow */}
        {assetDef.shadow && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${assetDef.shadow.rx * 2 * (placedObject.scale || 1)}px`,
              height: `${assetDef.shadow.ry * 2 * (placedObject.scale || 1)}px`,
              transform: `translate(-50%, -50%) translateY(${assetDef.shadow.offsetY || 0}px)`,
              backgroundColor: assetDef.shadow.color || 'rgba(0,0,0,0.3)',
              borderRadius: '50%',
              filter: 'blur(3px)',
            }}
          />
        )}

        {/* Ambient Occlusion (Raíces / Base) */}
        {['tree', 'building', 'rock'].includes(objDef.type) && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${width * 0.35}px`,
              height: `${height * 0.05}px`,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(ellipse at center, rgba(0,20,0,0.6) 0%, rgba(0,0,0,0) 70%)',
            }}
          />
        )}
      </div>

      {/* 1. Hitbox: estático en el fondo, atrapa clicks del centro/base */}
      <div
        onClick={handleClick}
        onPointerDown={(e) => {
          if (buildMode) e.stopPropagation();
        }}
        style={{
          position: 'absolute',
          left: '20%',
          bottom: '0',
          width: '60%',
          height: '75%',
          pointerEvents: 'auto',
          cursor: objDef.interaction || buildMode ? 'pointer' : 'default',
          zIndex: 2,
        }}
      />

      {/* 2. Interaction Wrapper: maneja el rebote elástico (scale) y el destello, sin romper animaciones CSS */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: `${assetDef.anchorX * 100}% ${assetDef.anchorY * 100}%`,
          transform: `scale(${isInteracting ? 0.96 : 1}) rotate(${placedObject.rotation || 0}deg)`,
          filter: `${baseFilter} ${selected ? 'drop-shadow(0 0 3px #fffce5) drop-shadow(0 0 14px rgba(255,220,130,.95))' : buildMode ? 'drop-shadow(0 0 2px rgba(255,250,210,.9)) drop-shadow(0 0 9px rgba(255,220,130,.7))' : ''}`,
          transition: 'filter 0.3s ease, transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)', // Rebote rápido
        }}
      >
        <div
          className="world-object__orientation"
          style={{
            width: '100%',
            height: '100%',
            transform: `scaleX(${isObjectFlipped(placedObject) ? -1 : 1})`,
            transformOrigin: `${assetDef.anchorX * 100}% ${assetDef.anchorY * 100}%`,
          }}
        >
          {/* 3. Anim Wrapper: aplica el bamboleo (sway/bob) desde our-world.css */}
          <div style={{ width: '100%', height: '100%', ...animStyle }}>
            {assetDef.sourceType === 'svg' ? (
              <Renderer
                width="100%"
                height="100%"
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            ) : (
              <img
                src={assetDef.source}
                decoding="async"
                alt={objDef.name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 4. Foliage Front Decal (Pasto procedimental que rompe la línea base y oculta el PNG) */}
      {assetDef.sourceType === 'svg' &&
        ['tree', 'building', 'rock', 'decoration'].includes(objDef.type) && (
          <svg
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              left: `${assetDef.anchorX * 100 - 40}%`, // 80% ancho centrado en anchor
              bottom: `calc(${(1 - assetDef.anchorY) * 100}% - 2px)`,
              width: '80%',
              height: `${Math.max(12, height * 0.06)}px`,
              pointerEvents: 'none',
              zIndex: 3,
              opacity: 0.85,
              filter: baseFilter, // Comparte grading
            }}
          >
            <path
              d="M10,20 Q12,8 15,18 Q18,2 20,18 Q23,10 25,20 M30,20 Q32,8 35,18 Q38,2 40,18 Q43,10 45,20 M50,20 Q52,8 55,18 Q58,2 60,18 Q63,10 65,20 M70,20 Q72,8 75,18 Q78,2 80,18 Q83,10 85,20"
              stroke="#22c55e"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M5,20 Q8,10 10,20 M25,20 Q28,12 30,20 M45,20 Q48,12 50,20 M65,20 Q68,12 70,20 M85,20 Q88,12 90,20"
              stroke="#16a34a"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M15,20 Q18,5 20,20 M35,20 Q38,5 40,20 M55,20 Q58,5 60,20 M75,20 Q78,5 80,20"
              stroke="#4ade80"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
        )}
    </div>
  );
}

export default React.memo(WorldObject);
