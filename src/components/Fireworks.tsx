// ============================================================
// Coliflor — Fireworks Canvas Component
// ============================================================
//
// A performant, GPU-friendly canvas that renders fireworks
// at 3 intensity levels. Uses requestAnimationFrame and
// auto-cleans up on unmount.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import type { CelebrationIntensity, CelebrationEffect, ParticleShape } from '../lib/celebrations';

interface FireworksProps {
  intensity: CelebrationIntensity;
  colors: string[];
  /** Set to true to also show confetti particles */
  confetti?: boolean;
  effect?: CelebrationEffect;
  particleShape?: ParticleShape | string; // Allow custom emojis like 'emoji:🎃'
  interactive?: boolean;
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
  shape?: string;
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

// --- Emoji Cache ---
const emojiCache: Record<string, HTMLCanvasElement> = {};
function getCachedEmoji(emoji: string): HTMLCanvasElement {
  if (emojiCache[emoji]) return emojiCache[emoji];
  const c = document.createElement('canvas');
  const size = 64; // Base high-res size
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.font = `${size * 0.8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2);
  }
  emojiCache[emoji] = c;
  return c;
}

export default function Fireworks({
  intensity,
  colors,
  confetti = false,
  effect = 'fireworks',
  particleShape = 'circle',
  interactive = false,
}: FireworksProps) {
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

    // Pick a random shape for a particle
    const getRandomShape = () => {
      if (particleShape?.startsWith('emoji:')) {
        const emojis = particleShape.split(':')[1].split(',');
        return `emoji:${emojis[Math.floor(Math.random() * emojis.length)]}`;
      }
      return particleShape || 'circle';
    };

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

    function launchRocket(clickX?: number, clickY?: number) {
      if (rockets.length >= cfg.maxRockets * (clickX ? 2 : 1)) return; // Allow extra on click

      const x = clickX ?? W * 0.15 + Math.random() * W * 0.7;
      const targetY = clickY ?? H * 0.1 + Math.random() * H * 0.3;
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
        const particleColor =
          Math.random() > 0.7 ? colors[Math.floor(Math.random() * colors.length)] : baseColor;

        const pShape = getRandomShape();

        particles.push({
          x: rocket.x,
          y: rocket.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: cfg.particleLife * (0.6 + Math.random() * 0.4),
          maxLife: cfg.particleLife,
          color: particleColor,
          size:
            1.5 +
            Math.random() * (pShape === 'circle' ? 1.5 : pShape?.startsWith('emoji:') ? 8 : 4), // larger size for shapes/emojis
          decay: 0.015 + Math.random() * 0.01,
          gravity: effect === 'floaters' ? -0.02 : 0.03, // floaters go up
          type: 'spark',
          rotation: pShape !== 'circle' ? Math.random() * 360 : undefined,
          rotationSpeed: pShape !== 'circle' ? (Math.random() - 0.5) * 4 : undefined,
          shape: pShape,
        });
      }
    }

    function spawnFirework(x: number, y: number) {
      const numParticles = 50 + Math.random() * 30;
      for (let i = 0; i < numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const pShape = getRandomShape();
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 150 + Math.random() * 150,
          maxLife: 300,
          color: color,
          size: 2 + Math.random() * (pShape === 'circle' ? 2 : 4.5),
          decay: 0.008 + Math.random() * 0.01,
          gravity: 0.02,
          type: 'spark',
          rotation: pShape !== 'circle' ? Math.random() * 360 : undefined,
          rotationSpeed: pShape !== 'circle' ? (Math.random() - 0.5) * 8 : undefined,
          shape: pShape,
        });
      }
    }

    function spawnFloater(clickX?: number, clickY?: number) {
      const x = clickX ?? Math.random() * W;
      const y = clickY ?? H + 10;
      const pShape = getRandomShape();
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 1.5 + 0.5), // going up
        life: 200 + Math.random() * 200,
        maxLife: 400,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: (pShape?.startsWith('emoji:') ? 16 : 6) + Math.random() * 10, // Much larger floaters
        decay: 0.005,
        gravity: -0.01,
        type: 'spark',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        shape: pShape,
      });
    }

    function spawnSnow(clickX?: number, clickY?: number) {
      const x = clickX ?? Math.random() * W;
      const y = clickY ?? -10;
      const pShape = getRandomShape();
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1,
        vy: Math.random() * 0.5 + 0.5,
        life: 300 + Math.random() * 200,
        maxLife: 500,
        color: colors[Math.floor(Math.random() * colors.length)],
        size:
          (pShape?.startsWith('emoji:') ? 8 : 2) +
          Math.random() * (pShape?.startsWith('emoji:') ? 10 : 3),
        decay: 0.002,
        gravity: 0.005,
        type: 'spark',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
        shape: pShape,
      });
    }

    // --- Interactions ---
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return; // Only allow click interactions if interactive is true

      // Ignore clicks on buttons or links
      if (
        (e.target as HTMLElement).tagName === 'BUTTON' ||
        (e.target as HTMLElement).tagName === 'A' ||
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('a')
      ) {
        return;
      }

      let x, y;
      if ('touches' in e) {
        if (e.touches.length === 0) return;
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else {
        x = (e as MouseEvent).clientX;
        y = (e as MouseEvent).clientY;
      }

      if (effect === 'fireworks') {
        launchRocket(x, y);
      } else if (effect === 'snowfall') {
        for (let i = 0; i < 8; i++) spawnSnow(x, y);
      } else {
        for (let i = 0; i < 8; i++) spawnSnow(x, y);
      }
    };

    function loop(timestamp: number) {
      ctx.clearRect(0, 0, W, H);

      // Launch fireworks on interval
      if (timestamp - lastLaunch > cfg.launchInterval) {
        lastLaunch = timestamp;
        if (effect === 'fireworks') {
          launchRocket();
          if (intensity === 'high' && Math.random() > 0.3) {
            launchRocket();
            if (Math.random() > 0.5) launchRocket();
          }
        }
      }

      // Continuously spawn floaters and snow (independent of launchInterval)
      // Lowered floater density to prevent screen clutter
      if (effect === 'floaters' && Math.random() > (intensity === 'high' ? 0.94 : 0.97)) {
        spawnFloater();
      }

      if (effect === 'snowfall') {
        const isEmoji = particleShape?.startsWith('emoji:');
        const threshold = isEmoji
          ? intensity === 'high'
            ? 0.94
            : 0.98 // emojis take up a lot of space, spawn them rarely
          : intensity === 'high'
            ? 0.4
            : 0.7; // regular snow is small, spawn it frequently

        if (Math.random() > threshold) {
          spawnSnow();
          // double spawn only for regular snow on high intensity
          if (intensity === 'high' && !isEmoji) spawnSnow();
        }
      }

      // Automatic spectacular fireworks for high intensity
      if (effect === 'fireworks' && intensity === 'high' && Math.random() > 0.98) {
        spawnFirework(Math.random() * W, Math.random() * (H / 2));
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

        if (p.life <= 0 || (p.vy > 0 && p.y > H + 20) || (p.vy < 0 && p.y < -20)) {
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
          // Draw spark / shape
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rotation) {
            ctx.rotate((p.rotation * Math.PI) / 180);
            if (p.rotationSpeed) p.rotation += p.rotationSpeed;
          }

          if (p.shape?.startsWith('emoji:')) {
            const emoji = p.shape.split(':')[1];
            const cachedCanvas = getCachedEmoji(emoji);
            ctx.globalAlpha = alpha;
            const renderSize = p.size * 2.5;
            ctx.drawImage(cachedCanvas, -renderSize / 2, -renderSize / 2, renderSize, renderSize);
            ctx.globalAlpha = 1;
          } else if (p.shape === 'heart' && p.type === 'spark') {
            ctx.beginPath();
            const w = p.size * 2;
            const h = p.size * 2;
            ctx.moveTo(0, h * 0.3);
            ctx.bezierCurveTo(0, 0, -w * 0.5, 0, -w * 0.5, h * 0.3);
            ctx.bezierCurveTo(-w * 0.5, h * 0.6, 0, h * 0.8, 0, h);
            ctx.bezierCurveTo(0, h * 0.8, w * 0.5, h * 0.6, w * 0.5, h * 0.3);
            ctx.bezierCurveTo(w * 0.5, 0, 0, 0, 0, h * 0.3);
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            ctx.fill();
          } else if (p.shape === 'star' && p.type === 'spark') {
            const spikes = 5;
            const outerRadius = p.size * 2;
            const innerRadius = p.size;
            ctx.beginPath();
            let rot = (Math.PI / 2) * 3;
            let x = 0;
            let y = 0;
            let step = Math.PI / spikes;
            ctx.moveTo(0, -outerRadius);
            for (let j = 0; j < spikes; j++) {
              x = Math.cos(rot) * outerRadius;
              y = Math.sin(rot) * outerRadius;
              ctx.lineTo(x, y);
              rot += step;
              x = Math.cos(rot) * innerRadius;
              y = Math.sin(rot) * innerRadius;
              ctx.lineTo(x, y);
              rot += step;
            }
            ctx.lineTo(0, -outerRadius);
            ctx.closePath();
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * alpha, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
            ctx.fill();

            // Glow effect for brighter particles
            if (alpha > 0.5) {
              ctx.beginPath();
              ctx.arc(0, 0, p.size * alpha * 2.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.15})`;
              ctx.fill();
            }
          }
          ctx.restore();
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

    // Cleanup click listener is handled via a hack (not strict React way, but fine for canvas overlay)
    const win = window as any;
    if (win._fireworksClick) {
      window.removeEventListener('mousedown', win._fireworksClick);
      window.removeEventListener('touchstart', win._fireworksClick);
    }
    win._fireworksClick = handleClick;
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('touchstart', handleClick);

    // Start animation
    animRef.current = requestAnimationFrame(loop);

    // Cleanup
    return () => {
      cancelAnimationFrame(animRef.current);
      if (win._fireworksClick === handleClick) {
        window.removeEventListener('mousedown', handleClick);
        window.removeEventListener('touchstart', handleClick);
        win._fireworksClick = null;
      }
    };
  }, [intensity, colors, confetti, effect, particleShape]);

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
