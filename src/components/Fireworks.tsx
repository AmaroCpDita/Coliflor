// ============================================================
// Coliflor — Fireworks Canvas Component
// ============================================================
//
// A performant, GPU-friendly canvas that renders fireworks
// at 3 intensity levels. Uses requestAnimationFrame and
// auto-cleans up on unmount.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import type { CelebrationIntensity } from '../lib/celebrations';

interface FireworksProps {
  intensity: CelebrationIntensity;
  colors: string[];
  /** Set to true to also show confetti particles */
  confetti?: boolean;
}

// --- Particle types ---

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  decay: number;
  gravity: number;
  type: 'spark' | 'confetti';
  rotation?: number;
  rotationSpeed?: number;
  width?: number;
  height?: number;
}

interface Rocket {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

// --- Config per intensity ---

const CONFIG = {
  low: {
    maxRockets: 2,
    launchInterval: 3500,
    particlesPerExplosion: 35,
    particleSpeed: 2.5,
    particleLife: 60,
    rocketSpeed: 4,
    confettiCount: 0,
  },
  medium: {
    maxRockets: 4,
    launchInterval: 2000,
    particlesPerExplosion: 55,
    particleSpeed: 3.5,
    particleLife: 70,
    rocketSpeed: 5,
    confettiCount: 30,
  },
  high: {
    maxRockets: 7,
    launchInterval: 900,
    particlesPerExplosion: 80,
    particleSpeed: 4.5,
    particleLife: 85,
    rocketSpeed: 6,
    confettiCount: 60,
  },
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 255, g: 215, b: 0 };
}

export default function Fireworks({ intensity, colors, confetti = false }: FireworksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctxOrNull = canvas.getContext('2d');
    if (!ctxOrNull) return;
    const ctx = ctxOrNull!;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const cfg = CONFIG[intensity];
    const particles: Particle[] = [];
    const rockets: Rocket[] = [];
    let lastLaunch = 0;

    // Initial confetti burst
    if (confetti && cfg.confettiCount > 0) {
      for (let i = 0; i < cfg.confettiCount; i++) {
        particles.push({
          x: Math.random() * W,
          y: -10 - Math.random() * H * 0.3,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 1.5 + 0.5,
          life: 300 + Math.random() * 200,
          maxLife: 500,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1,
          decay: 0.001,
          gravity: 0.01,
          type: 'confetti',
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8,
          width: 4 + Math.random() * 4,
          height: 3 + Math.random() * 2,
        });
      }
    }

    function launchRocket() {
      if (rockets.length >= cfg.maxRockets) return;

      const x = W * 0.15 + Math.random() * W * 0.7;
      const targetY = H * 0.1 + Math.random() * H * 0.3;
      const color = colors[Math.floor(Math.random() * colors.length)];

      rockets.push({
        x,
        y: H,
        vy: -(cfg.rocketSpeed + Math.random() * 2),
        targetY,
        color,
        trail: [],
      });
    }

    function explode(rocket: Rocket) {
      const count = cfg.particlesPerExplosion;
      const baseColor = rocket.color;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
        const speed = cfg.particleSpeed * (0.5 + Math.random() * 0.8);

        // Mix in some color variation
        const particleColor = Math.random() > 0.7
          ? colors[Math.floor(Math.random() * colors.length)]
          : baseColor;

        particles.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: cfg.particleLife * (0.6 + Math.random() * 0.4),
          maxLife: cfg.particleLife,
          color: particleColor,
          size: 1.5 + Math.random() * 1.5,
          decay: 0.015 + Math.random() * 0.01,
          gravity: 0.03,
          type: 'spark',
        });
      }
    }

    function loop(timestamp: number) {
      ctx.clearRect(0, 0, W, H);

      // Launch rockets on interval
      if (timestamp - lastLaunch > cfg.launchInterval) {
        launchRocket();
        lastLaunch = timestamp;

        // For high intensity, launch 2-3 at once
        if (intensity === 'high' && Math.random() > 0.3) {
          launchRocket();
          if (Math.random() > 0.5) launchRocket();
        }
      }

      // Update & draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        r.trail.push({ x: r.x, y: r.y, alpha: 1 });

        // Draw trail
        for (let t = r.trail.length - 1; t >= 0; t--) {
          r.trail[t].alpha -= 0.04;
          if (r.trail[t].alpha <= 0) {
            r.trail.splice(t, 1);
            continue;
          }
          const rgb = hexToRgb(r.color);
          ctx.beginPath();
          ctx.arc(r.trail[t].x, r.trail[t].y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${r.trail[t].alpha})`;
          ctx.fill();
        }

        // Draw rocket head
        const rgb = hexToRgb(r.color);
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(r.x, r.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`;
        ctx.fill();

        // Explode when reaching target
        if (r.y <= r.targetY) {
          explode(r);
          rockets.splice(i, 1);
        }
      }

      // Update & draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life -= 1;

        if (p.type === 'spark') {
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        if (p.life <= 0 || p.y > H + 20) {
          particles.splice(i, 1);
          continue;
        }

        const alpha = Math.max(0, p.life / p.maxLife);
        const rgb = hexToRgb(p.color);

        if (p.type === 'confetti') {
          // Draw confetti rectangle
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(((p.rotation || 0) * Math.PI) / 180);
          p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.8})`;
          ctx.fillRect(-(p.width || 4) / 2, -(p.height || 3) / 2, p.width || 4, p.height || 3);
          ctx.restore();
        } else {
          // Draw spark
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
          ctx.fill();

          // Glow effect for brighter particles
          if (alpha > 0.5) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.15})`;
            ctx.fill();
          }
        }
      }

      // Continuously spawn confetti for medium/high
      if (confetti && intensity !== 'low' && Math.random() > 0.92) {
        particles.push({
          x: Math.random() * W,
          y: -5,
          vx: (Math.random() - 0.5) * 1.5,
          vy: Math.random() * 1.2 + 0.3,
          life: 250 + Math.random() * 150,
          maxLife: 400,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1,
          decay: 0.002,
          gravity: 0.008,
          type: 'confetti',
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 6,
          width: 4 + Math.random() * 4,
          height: 3 + Math.random() * 2,
        });
      }

      animRef.current = requestAnimationFrame(loop);
    }

    // Start animation
    animRef.current = requestAnimationFrame(loop);
  }, [intensity, colors, confetti]);

  useEffect(() => {
    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      draw();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    />
  );
}
