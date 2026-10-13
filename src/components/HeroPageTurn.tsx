// Coliflor — photographic album with a flexible, curled paper transition.
import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';
import { createPageCurl } from './heroPageCurl';
import './HeroPageTurn.css';

interface HeroPageTurnProps {
  images: string[];
  defaultImage?: string;
  intervalMs?: number;
  children: React.ReactNode;
  celebrationType?: string | null;
  isCelebrating?: boolean;
}

interface PageTurn {
  from: HTMLImageElement;
  to: HTMLImageElement;
  toIndex: number;
  direction: number;
}

const TURN_DURATION = 800;

export default function HeroPageTurn({
  images,
  defaultImage,
  intervalMs = 4000,
  children,
  celebrationType,
  isCelebrating,
}: HeroPageTurnProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fallback, setFallback] = useState(false);
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busyRef = useRef(false);
  const albumVersionRef = useRef(0);
  const loadedImagesRef = useRef(new Map<string, Promise<HTMLImageElement>>());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeImages = useMemo(
    () => (images.length > 0 ? images : defaultImage ? [defaultImage] : []),
    [images, defaultImage],
  );
  const albumKey = JSON.stringify(activeImages);
  const hasMultiple = activeImages.length > 1;
  const safeIndex = currentIndex < activeImages.length ? currentIndex : 0;
  const currentImage = activeImages[safeIndex] || null;

  const loadImage = useCallback((url: string) => {
    const cached = loadedImagesRef.current.get(url);
    if (cached) return cached;
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => {
        // Some image hosts disallow canvas access but can still display photos.
        const plainImage = new Image();
        plainImage.onload = () => resolve(plainImage);
        plainImage.onerror = reject;
        plainImage.src = url;
      };
      image.src = url;
    });
    loadedImagesRef.current.set(url, promise);
    void promise.catch(() => {
      if (loadedImagesRef.current.get(url) === promise) loadedImagesRef.current.delete(url);
    });
    return promise;
  }, []);

  useEffect(() => {
    albumVersionRef.current += 1;
    busyRef.current = false;
    setCurrentIndex(0);
    setTurn(null);
    setIsPreparing(false);
    for (const url of loadedImagesRef.current.keys()) {
      if (!activeImages.includes(url)) loadedImagesRef.current.delete(url);
    }
    return () => {
      albumVersionRef.current += 1;
    };
  }, [albumKey]);

  // Warm adjacent pages without downloading the whole album at once.
  useEffect(() => {
    if (!currentImage) return;
    const neighbors = [safeIndex, (safeIndex + 1) % activeImages.length];
    if (hasMultiple) neighbors.push((safeIndex - 1 + activeImages.length) % activeImages.length);
    const nearbyUrls = new Set(neighbors.map((index) => activeImages[index]));
    for (const url of loadedImagesRef.current.keys()) {
      if (!nearbyUrls.has(url)) loadedImagesRef.current.delete(url);
    }
    for (const index of new Set(neighbors)) void loadImage(activeImages[index]).catch(() => {});
  }, [albumKey, safeIndex, currentImage, hasMultiple, loadImage]);

  const goToPage = useCallback(
    async (direction: number) => {
      if (!hasMultiple || !currentImage || busyRef.current) return;
      const toIndex = (safeIndex + direction + activeImages.length) % activeImages.length;
      if (reducedMotion) {
        setCurrentIndex(toIndex);
        return;
      }
      busyRef.current = true;
      setIsPreparing(true);
      const version = albumVersionRef.current;
      try {
        const [from, to] = await Promise.all([
          loadImage(currentImage),
          loadImage(activeImages[toIndex]),
        ]);
        if (version !== albumVersionRef.current) return;
        setFallback(false);
        setTurn({ from, to, toIndex, direction });
      } catch {
        if (version === albumVersionRef.current) busyRef.current = false;
      } finally {
        if (version === albumVersionRef.current) setIsPreparing(false);
      }
    },
    [activeImages, currentImage, hasMultiple, loadImage, reducedMotion, safeIndex],
  );

  useLayoutEffect(() => {
    if (!turn || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const renderer = reducedMotion
      ? null
      : createPageCurl(canvasRef.current, turn.from, turn.to, turn.direction);
    setFallback(!renderer);
    const handleContextLost = () => setFallback(true);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    let frame = 0;
    let start: number | null = null;
    const duration = reducedMotion ? 0 : renderer ? TURN_DURATION : 240;
    const animate = (now: number) => {
      if (start === null) start = now;
      const elapsed = duration ? Math.min(1, (now - start) / duration) : 1;
      const progress = elapsed * elapsed * (3 - 2 * elapsed);
      renderer?.draw(progress);
      if (elapsed < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setCurrentIndex(turn.toIndex);
        setTurn(null);
        busyRef.current = false;
      }
    };
    renderer?.draw(0);
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      renderer?.dispose();
    };
  }, [turn, reducedMotion]);

  useEffect(() => {
    if (!hasMultiple || isPaused || isPreparing || turn || reducedMotion) return;
    const timer = setTimeout(() => void goToPage(1), intervalMs);
    return () => clearTimeout(timer);
  }, [hasMultiple, intervalMs, isPaused, isPreparing, turn, reducedMotion, goToPage]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    },
    [],
  );

  const pause = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setIsPaused(true);
  };
  const resumeAfterTouch = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setIsPaused(false), 3000);
  };
  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartRef.current;
    const end = event.changedTouches[0];
    if (start && end) {
      const x = end.clientX - start.x;
      const y = end.clientY - start.y;
      if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y)) {
        void goToPage(x < 0 ? 1 : -1);
      }
    }
    touchStartRef.current = null;
    resumeAfterTouch();
  };

  return (
    <div
      className={`glass-card text-center animate-fade-in hero-page-turn-card ${!currentImage ? 'hero-page-turn-card--empty' : ''} ${
        isCelebrating ? 'hero-card--celebrating' : ''
      }`}
      tabIndex={hasMultiple ? 0 : undefined}
      aria-label={hasMultiple ? 'Álbum de fotos de la portada' : undefined}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          void goToPage(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
      onMouseEnter={pause}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={pause}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onTouchStart={(event) => {
        touchStartRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        pause();
      }}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null;
        resumeAfterTouch();
      }}
      style={{
        boxShadow:
          celebrationType === 'aniversario'
            ? '0 0 40px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)'
            : undefined,
        border: celebrationType === 'aniversario' ? '2px solid rgba(255, 215, 0, 0.4)' : undefined,
      }}
    >
      <div className="hero-album-background" aria-hidden="true">
        {currentImage && (
          <img
            className="hero-album-photo"
            src={fallback && turn ? turn.to.src : currentImage}
            alt=""
          />
        )}
        {turn && fallback && (
          <img className="hero-album-photo hero-album-fallback" src={turn.from.src} alt="" />
        )}
        <canvas
          ref={canvasRef}
          className="hero-album-curl"
          style={{ visibility: turn && !fallback ? 'visible' : 'hidden' }}
        />
        <div className="hero-album-atmosphere" />
      </div>

      <div className="hero-album-content">{children}</div>
    </div>
  );
}
