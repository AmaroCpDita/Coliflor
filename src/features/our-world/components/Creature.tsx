// ============================================================
// Nuestro Mundo — Creature Component
// ============================================================
// Animated creature with state machine behaviors.
// ============================================================

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { CreatureDef, CreatureState as CState, TimeOfDay } from '../types';
import { getAssetDef } from '../data/assets';
import { getRenderer, FallbackRenderer } from './Renderers';

interface CreatureProps {
  def: CreatureDef;
  timeOfDay: TimeOfDay;
  areaWidth: number; // Container width for bounds
  lightIntensity: number;
  onInteract?: (creature: CreatureDef, x: number, y: number) => void;
  habitat?: { x: [number, number]; y: [number, number] };
}

export default function Creature({
  def,
  timeOfDay,
  areaWidth,
  lightIntensity,
  onInteract,
  habitat,
}: CreatureProps) {
  const minX = habitat?.x[0] ?? 5;
  const maxX = habitat?.x[1] ?? 90;
  const minY = habitat?.y[0] ?? 5;
  const maxY = habitat?.y[1] ?? 30;
  const [state, setState] = useState<CState>('appearing');
  const [x, setX] = useState(() => minX + Math.random() * (maxX - minX));
  const [y, setY] = useState(() => minY + Math.random() * (maxY - minY));
  const [facingRight, setFacingRight] = useState(Math.random() > 0.5);
  const [opacity, setOpacity] = useState(0);
  const timerRef = useRef<number>(0);
  const moveTimerRef = useRef<number>(0);
  const lookTimerRef = useRef<number>(0);
  const runawayTimerRef = useRef<number>(0);
  const clickTimerRef = useRef<number>(0);
  const reappearTimerRef = useRef<number>(0);
  const runBehaviorRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  const assetDef = useMemo(() => getAssetDef(def.renderKey || 'default'), [def]);
  const Renderer = useMemo(() => {
    if (assetDef.sourceType === 'svg') return getRenderer(assetDef.source) || FallbackRenderer;
    return FallbackRenderer;
  }, [assetDef]);

  // Choose next behavior based on weights
  const chooseNextState = useCallback((): CState => {
    const weights = def.behaviors;
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (const [s, w] of Object.entries(weights)) {
      r -= w;
      if (r <= 0) return s as CState;
    }
    return 'idle';
  }, [def.behaviors]);

  // Behavior loop
  useEffect(() => {
    mountedRef.current = true;

    // Check if creature should be active
    if (!def.activeTime.includes(timeOfDay)) {
      setState('disappearing');
      setOpacity(0);
      return;
    }

    // Appear
    setState('appearing');
    setOpacity(1);

    const runBehavior = () => {
      if (!mountedRef.current) return;
      window.clearInterval(moveTimerRef.current);
      window.clearTimeout(lookTimerRef.current);

      const next = chooseNextState();
      setState(next);

      let duration = 2000 + Math.random() * 4000;

      if (next === 'walking' || next === 'running') {
        const speed = next === 'running' ? def.speed * 2 : def.speed;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const depthDirection = Math.random() > 0.5 ? 1 : -1;
        setFacingRight(direction > 0);

        const moveInterval = 50;
        const steps = Math.floor(duration / moveInterval);
        let step = 0;

        moveTimerRef.current = window.setInterval(() => {
          if (!mountedRef.current) {
            window.clearInterval(moveTimerRef.current);
            return;
          }
          step++;
          setX((prev) => {
            const newX = prev + direction * speed * 0.1;
            return Math.max(minX, Math.min(maxX, newX));
          });
          setY((prev) => Math.max(minY, Math.min(maxY, prev + depthDirection * speed * 0.025)));
          if (step >= steps) window.clearInterval(moveTimerRef.current);
        }, moveInterval);
      }

      if (next === 'sleeping') {
        duration = 5000 + Math.random() * 5000;
      }

      if (next === 'looking') {
        lookTimerRef.current = window.setTimeout(() => {
          if (mountedRef.current) setFacingRight((prev) => !prev);
        }, duration * 0.5);
      }

      if (next === 'hiding' || next === 'disappearing') {
        setOpacity(0);
        duration = 3000;
      }

      timerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        if (next === 'hiding' || next === 'disappearing') {
          // Reappear at new position
          setX(minX + Math.random() * (maxX - minX));
          setY(minY + Math.random() * (maxY - minY));
          setOpacity(1);
          setState('appearing');
          timerRef.current = window.setTimeout(runBehavior, 1500);
        } else {
          runBehavior();
        }
      }, duration);
    };
    runBehaviorRef.current = runBehavior;

    const initialDelay = setTimeout(
      () => {
        if (mountedRef.current) runBehavior();
      },
      1000 + Math.random() * 3000,
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(initialDelay);
      if (timerRef.current) clearTimeout(timerRef.current);
      window.clearInterval(moveTimerRef.current);
      window.clearTimeout(lookTimerRef.current);
      window.clearInterval(runawayTimerRef.current);
      window.clearTimeout(clickTimerRef.current);
      window.clearTimeout(reappearTimerRef.current);
      runBehaviorRef.current = null;
    };
  }, [def, timeOfDay, chooseNextState, minX, maxX, minY, maxY]);

  const handleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      if (onInteract) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        onInteract(def, rect.left + rect.width / 2, rect.top);
      }
      // Creature runs away
      window.clearTimeout(timerRef.current);
      window.clearInterval(moveTimerRef.current);
      window.clearTimeout(lookTimerRef.current);
      window.clearInterval(runawayTimerRef.current);
      window.clearTimeout(clickTimerRef.current);
      window.clearTimeout(reappearTimerRef.current);
      setState('running');
      const dir = Math.random() > 0.5 ? 1 : -1;
      setFacingRight(dir > 0);
      runawayTimerRef.current = window.setInterval(() => {
        setX((prev) => {
          const newX = prev + dir * 0.8;
          if (newX < -5 || newX > 105) {
            window.clearInterval(runawayTimerRef.current);
            return prev;
          }
          return Math.max(minX, Math.min(maxX, newX));
        });
      }, 30);
      clickTimerRef.current = window.setTimeout(() => {
        window.clearInterval(runawayTimerRef.current);
        setOpacity(0);
        reappearTimerRef.current = window.setTimeout(() => {
          setX(minX + Math.random() * (maxX - minX));
          setY(minY + Math.random() * (maxY - minY));
          setOpacity(1);
          setState('idle');
          timerRef.current = window.setTimeout(() => runBehaviorRef.current?.(), 1200);
        }, 3000);
      }, 1500);
    },
    [def, onInteract, minX, maxX, minY, maxY],
  );

  // Animation class based on state
  const stateClass = `creature--${state}`;
  const sleepingOpacity = state === 'sleeping' ? 0.6 : 1;

  const width = assetDef.width;
  const height = assetDef.height;
  const zIndex = Math.floor((100 - y) * 10) + (assetDef.zOffset || 0);

  return (
    <div
      className="world-creature"
      style={{
        position: 'absolute',
        left: `${x}%`,
        bottom: `${y}%`,
        transform: `translate(-${assetDef.anchorX * 100}%, ${(1 - assetDef.anchorY) * 100}%) scaleX(${facingRight ? 1 : -1})`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: opacity * sleepingOpacity,
        transition: 'left 0.5s ease, bottom 0.5s ease, opacity 1s ease',
        zIndex,
        cursor: 'pointer',
        filter: `brightness(${0.65 + lightIntensity * 0.35})`,
      }}
      onClick={handleClick}
    >
      <div className={stateClass} style={{ width: '100%', height: '100%' }}>
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
            alt={def.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
      </div>
      {state === 'sleeping' && (
        <div
          className="creature__zzz"
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-5px',
            fontSize: '10px',
            opacity: 0.7,
            animation: 'worldBob 2s ease-in-out infinite',
          }}
        >
          💤
        </div>
      )}
    </div>
  );
}
