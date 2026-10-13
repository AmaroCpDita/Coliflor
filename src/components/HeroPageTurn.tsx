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
  onManageAlbum?: () => void;
  celebrationType?: string | null;
  isCelebrating?: boolean;
}

interface PageTurn {
  from: HTMLImageElement;
  to: HTMLImageElement;
  toIndex: number;
  direction: number;
}

const TURN_DURATION = 1450;

export default function HeroPageTurn({
  images,
  defaultImage,
  intervalMs = 4000,
  children,
  onManageAlbum,
  celebrationType,
  isCelebrating,
}: HeroPageTurnProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [fallback, setFallback] = useState(false);
  const reducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const busyRef = useRef(false);
  const albumVersionRef = useRef(0);
  const loadedImagesRef = useRef(new Map<string, Promise<HTMLImageElement>>());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickUntilRef = useRef(0);
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
    const duration = reducedMotion ? 0 : renderer ? TURN_DURATION : 350;
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
    if (!hasMultiple || isPaused || isAutoplayPaused || isPreparing || turn || reducedMotion)
      return;
    const timer = setTimeout(() => void goToPage(1), intervalMs);
    return () => clearTimeout(timer);
  }, [
    hasMultiple,
    intervalMs,
    isPaused,
    isAutoplayPaused,
    isPreparing,
    turn,
    reducedMotion,
    goToPage,
  ]);

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
        suppressClickUntilRef.current = Date.now() + 500;
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
        {!currentImage && (
          <div className="hero-album-empty-art">
            <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="0.7">
              <path d="M20 32c18-5 30-1 40 5 10-6 22-10 40-5v57c-18-5-30-1-40 5-10-6-22-10-40-5zM60 37v57" />
              <path d="M43 50c-8-11-21 4 0 17 21-13 8-28 0-17M72 48h18M72 56h18M72 64h13" />
            </svg>
          </div>
        )}
      </div>

      <div className="hero-album-toolbar">
        <span className="hero-album-eyebrow">
          <span aria-hidden="true">✦</span> Nuestra historia
        </span>
        {onManageAlbum && (
          <button type="button" className="hero-album-manage" onClick={onManageAlbum}>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <circle cx="8" cy="8" r="1.5" />
              <path d="m3 17 5-5 4 4 4-5 5 6" />
            </svg>
            {currentImage ? 'Álbum' : 'Añadir fotos'}
          </button>
        )}
      </div>

      <div className="hero-album-content">{children}</div>

      <div className="hero-album-footer">
        <div className="hero-album-caption">
          <span>{currentImage ? 'Un recuerdo a la vez' : 'Su próximo recuerdo empieza aquí'}</span>
          {currentImage && (
            <span className="hero-album-counter">
              {String(safeIndex + 1).padStart(2, '0')} <i>/</i>{' '}
              {String(activeImages.length).padStart(2, '0')}
            </span>
          )}
        </div>

        {hasMultiple && (
          <div className="hero-album-controls">
            {[-1, 0, 1]
              .filter((direction) => direction !== 0 || !reducedMotion)
              .map((direction) => (
                <button
                  key={direction}
                  type="button"
                  className={`hero-album-navigation hero-album-navigation--${direction < 0 ? 'previous' : 'next'}`}
                  aria-label={
                    direction === 0
                      ? isAutoplayPaused
                        ? 'Reanudar álbum'
                        : 'Pausar álbum'
                      : direction < 0
                        ? 'Foto anterior'
                        : 'Siguiente foto'
                  }
                  aria-pressed={direction === 0 ? isAutoplayPaused : undefined}
                  aria-disabled={direction !== 0 ? Boolean(turn || isPreparing) : undefined}
                  title={
                    direction === 0
                      ? isAutoplayPaused
                        ? 'Reanudar álbum'
                        : 'Pausar álbum'
                      : direction < 0
                        ? 'Foto anterior'
                        : 'Siguiente foto'
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    if (direction === 0) {
                      setIsAutoplayPaused((value) => !value);
                      return;
                    }
                    if (Date.now() >= suppressClickUntilRef.current) void goToPage(direction);
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {direction === 0 ? (
                      isAutoplayPaused ? (
                        <path d="m9 5 11 7-11 7z" />
                      ) : (
                        <path d="M9 5v14M15 5v14" />
                      )
                    ) : (
                      <path d={direction < 0 ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'} />
                    )}
                  </svg>
                </button>
              ))}
          </div>
        )}
      </div>
      {hasMultiple && (
        <div className="hero-album-progress" aria-hidden="true">
          <span style={{ width: `${((safeIndex + 1) / activeImages.length) * 100}%` }} />
        </div>
      )}
    </div>
  );
}
