// ============================================================
// Nuestro Mundo — World Canvas (Particle Layer)
// ============================================================
// Renders all particles using Canvas2D. Manages lifecycle.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { ParticleEngine } from '../engine/ParticleEngine';
import type { ParticleConfig, ParticleType } from '../types';

interface WorldCanvasProps {
  configs: ParticleConfig[];
  performanceFactor?: number;
  onBurstRef?: React.MutableRefObject<
    ((x: number, y: number, type: ParticleType, count: number, colors: string[]) => void) | null
  >;
}

export default function WorldCanvas({
  configs,
  performanceFactor = 1,
  onBurstRef,
}: WorldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new ParticleEngine({
      maxParticles: Math.floor(200 * performanceFactor),
      performanceFactor,
    });
    engine.attach(canvasRef.current);
    engine.setConfigs(configs);
    engine.start();
    engineRef.current = engine;

    // Expose burst function
    if (onBurstRef) {
      onBurstRef.current = (x, y, type, count, colors) => engine.burst(x, y, type, count, colors);
    }

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      engine.destroy();
      engineRef.current = null;
      window.removeEventListener('resize', handleResize);
      if (onBurstRef) onBurstRef.current = null;
    };
  }, [performanceFactor]);

  // Update configs when they change (biome/time)
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setConfigs(configs);
    }
  }, [configs]);

  return (
    <canvas
      ref={canvasRef}
      className="world-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 20, // Above the camera and ambient light, below HUD and dialogs.
      }}
    />
  );
}
