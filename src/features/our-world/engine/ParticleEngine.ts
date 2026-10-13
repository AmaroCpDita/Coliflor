// ============================================================
// Nuestro Mundo — Canvas Particle Engine
// ============================================================
// High-performance particle system using Canvas2D.
// Handles fireflies, leaves, petals, dust, stars, snow, magic.
// Auto-pauses when tab is hidden. Respects particle limits.
// ============================================================

import type { ParticleConfig, ParticleType } from '../types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
  color: string;
  type: ParticleType;
  /** For glow rendering */
  glow: number;
  /** Pulse phase offset */
  pulseOffset: number;
  pulseSpeed: number;
  /** Wander angle (for fireflies) */
  wanderAngle: number;
  /** Wander change speed */
  wanderSpeed: number;
  /** Leaf rotation */
  rotation: number;
  rotationSpeed: number;
}

export interface ParticleEngineOptions {
  /** Max total particles across all configs */
  maxParticles: number;
  /** Device performance factor 0-1 (reduce on slow devices) */
  performanceFactor: number;
}

const DEFAULT_OPTIONS: ParticleEngineOptions = {
  maxParticles: 200,
  performanceFactor: 1,
};

export class ParticleEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private configs: ParticleConfig[] = [];
  private animFrameId: number = 0;
  private isRunning: boolean = false;
  private options: ParticleEngineOptions;
  private spawnTimers: Map<number, number> = new Map();
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private dpr: number = 1;
  private frameCount: number = 0;

  constructor(options?: Partial<ParticleEngineOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /** Attach to a canvas element */
  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.resize();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /** Detach and cleanup */
  destroy(): void {
    this.stop();
    this.particles = [];
    this.configs = [];
    this.spawnTimers.clear();
    this.canvas = null;
    this.ctx = null;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /** Update particle configs (called when biome/time changes) */
  setConfigs(configs: ParticleConfig[]): void {
    this.configs = configs;
    // Remove ambient effects from the previous phase (especially fireflies at dawn).
    const activeTypes = new Set(configs.map((config) => config.type));
    this.particles = this.particles.filter((particle) => activeTypes.has(particle.type));
    this.spawnTimers.clear();
  }

  /** Resize canvas to match container */
  resize(): void {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for perf
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx?.scale(this.dpr, this.dpr);
  }

  /** Start the animation loop */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  /** Stop the animation loop */
  stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = 0;
    }
  }

  /** Emit a burst of particles at a position (for interactions) */
  burst(x: number, y: number, type: ParticleType, count: number, colors: string[]): void {
    const effective = Math.floor(count * this.options.performanceFactor);
    for (let i = 0; i < effective; i++) {
      this.particles.push(this.createBurstParticle(x, y, type, colors));
    }
  }

  // --- Private Methods ---

  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  }

  private loop = (): void => {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    this.frameCount++;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Spawn new particles based on configs
    this.spawnParticles();

    // Update and render particles
    this.updateAndRender();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private spawnParticles(): void {
    const pf = this.options.performanceFactor;

    for (let ci = 0; ci < this.configs.length; ci++) {
      const config = this.configs[ci];
      const targetCount = Math.floor(config.count * pf);

      // Count active particles of this type from this config
      const activeCount = this.particles.filter((p) => p.type === config.type).length;

      if (activeCount < targetCount && this.particles.length < this.options.maxParticles) {
        // Spawn rate: every few frames
        const timer = this.spawnTimers.get(ci) || 0;
        if (this.frameCount - timer > (config.type === 'star' ? 5 : 3)) {
          this.particles.push(this.createParticle(config));
          this.spawnTimers.set(ci, this.frameCount);
        }
      }
    }
  }

  private createParticle(config: ParticleConfig): Particle {
    const [xMin, xMax, yMin, yMax] = config.area;
    const x = (this.canvasWidth * (xMin + Math.random() * (xMax - xMin))) / 100;
    const y = (this.canvasHeight * (yMin + Math.random() * (yMax - yMin))) / 100;
    const size = config.size[0] + Math.random() * (config.size[1] - config.size[0]);
    const speed = config.speed[0] + Math.random() * (config.speed[1] - config.speed[0]);
    const maxOpacity = config.opacity[0] + Math.random() * (config.opacity[1] - config.opacity[0]);
    const life = Math.floor(config.life[0] + Math.random() * (config.life[1] - config.life[0]));
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];

    let vx = 0;
    let vy = 0;
    switch (config.behavior) {
      case 'fall':
        vx = (Math.random() - 0.5) * speed * 0.5;
        vy = speed;
        break;
      case 'rise':
        vx = (Math.random() - 0.5) * speed * 0.3;
        vy = -speed;
        break;
      case 'drift':
        vx = speed * 0.5;
        vy = (Math.random() - 0.5) * speed * 0.3;
        break;
      case 'wander':
        vx = (Math.random() - 0.5) * speed;
        vy = (Math.random() - 0.5) * speed;
        break;
      case 'float':
      default:
        vx = (Math.random() - 0.5) * speed * 0.2;
        vy = (Math.random() - 0.5) * speed * 0.2;
        break;
    }

    return {
      x,
      y,
      vx,
      vy,
      size,
      opacity: 0,
      maxOpacity,
      life,
      maxLife: life,
      color,
      type: config.type,
      glow: config.glow,
      pulseOffset: Math.random() * Math.PI * 2,
      pulseSpeed: config.pulseSpeed,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderSpeed: 0.01 + Math.random() * 0.03,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
    };
  }

  private createBurstParticle(
    x: number,
    y: number,
    type: ParticleType,
    colors: string[],
  ): Particle {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random() * 2;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 4,
      opacity: 1,
      maxOpacity: 1,
      life: 40 + Math.floor(Math.random() * 40),
      maxLife: 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      type,
      glow: type === 'magic' || type === 'spark' ? 10 : 5,
      pulseOffset: 0,
      pulseSpeed: 0.05,
      wanderAngle: angle,
      wanderSpeed: 0.02,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    };
  }

  private updateAndRender(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update life
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Fade in/out
      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio > 0.8) {
        // Fade in (first 20%)
        p.opacity = p.maxOpacity * ((1 - lifeRatio) / 0.2);
      } else if (lifeRatio < 0.2) {
        // Fade out (last 20%)
        p.opacity = p.maxOpacity * (lifeRatio / 0.2);
      } else {
        p.opacity = p.maxOpacity;
      }

      // Pulse
      if (p.pulseSpeed > 0) {
        const pulse = Math.sin(p.pulseOffset + this.frameCount * p.pulseSpeed);
        p.opacity *= 0.6 + 0.4 * ((pulse + 1) / 2);
      }

      // Movement
      switch (p.type) {
        case 'firefly':
        case 'magic':
          // Smooth wandering using angle
          p.wanderAngle += (Math.random() - 0.5) * p.wanderSpeed * 10;
          p.vx += Math.cos(p.wanderAngle) * 0.02;
          p.vy += Math.sin(p.wanderAngle) * 0.02;
          // Damping
          p.vx *= 0.98;
          p.vy *= 0.98;
          // Slight upward drift for fireflies
          if (p.type === 'firefly') p.vy -= 0.005;
          break;
        case 'leaf':
        case 'petal':
          // Swaying fall
          p.vx += Math.sin(this.frameCount * 0.02 + p.pulseOffset) * 0.01;
          p.vy += 0.005; // gravity
          p.rotation += p.rotationSpeed;
          break;
        case 'snow':
          p.vx += Math.sin(this.frameCount * 0.01 + p.pulseOffset) * 0.005;
          p.vy += 0.002;
          break;
        case 'star':
          // Stars barely move, just twinkle
          break;
        case 'dust':
          p.vx += (Math.random() - 0.5) * 0.005;
          p.vy += (Math.random() - 0.5) * 0.005;
          p.vx *= 0.995;
          p.vy *= 0.995;
          break;
        default:
          break;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around / remove if out of bounds
      if (p.x < -20) p.x = this.canvasWidth + 10;
      if (p.x > this.canvasWidth + 20) p.x = -10;
      if (p.y < -20 && p.type !== 'star') p.y = this.canvasHeight + 10;
      if (p.y > this.canvasHeight + 20) {
        if (p.type === 'leaf' || p.type === 'petal' || p.type === 'snow') {
          this.particles.splice(i, 1);
          continue;
        }
        p.y = -10;
      }

      // Render
      this.renderParticle(ctx, p);
    }
  }

  private renderParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));

    if (p.glow > 0) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.glow * p.opacity;
    }

    switch (p.type) {
      case 'firefly':
      case 'magic':
      case 'spark': {
        // Radial gradient circle
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.4, p.color + '80');
        gradient.addColorStop(1, p.color + '00');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();
        // Bright center
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = p.opacity * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'star': {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'leaf': {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        // Simple leaf shape
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'petal': {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        // Petal shape
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.4, p.size * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'snow': {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'dust':
      case 'bubble':
      default: {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }
}
