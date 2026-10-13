// ============================================================
// Coliflor — Hero Page Turn (Album Slideshow Component)
// Changes image every 4s with a realistic 3D book/album page-turn effect
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroPageTurnProps {
  images: string[];
  defaultImage?: string;
  intervalMs?: number;
  children: React.ReactNode;
  onManageAlbum?: () => void;
  celebrationType?: string | null;
  isCelebrating?: boolean;
}

export default function HeroPageTurn({
  images,
  defaultImage = '/hero-bg.jpg',
  intervalMs = 4000,
  children,
  onManageAlbum,
  celebrationType,
  isCelebrating,
}: HeroPageTurnProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Placeholder: nextImage will be computed after activeImages are defined.
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Normalize image list
  const activeImages = images.length > 0 ? images : [defaultImage];
  const hasMultiple = activeImages.length > 1;
  const nextImage =
    activeImages[(currentIndex + direction + activeImages.length) % activeImages.length];
  // Auto-advance every 4 seconds
  useEffect(() => {
    if (!hasMultiple || isPaused) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % activeImages.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [hasMultiple, intervalMs, isPaused, activeImages.length]);

  // Keep index within bounds if images change
  useEffect(() => {
    if (currentIndex >= activeImages.length) {
      setCurrentIndex(0);
    }
  }, [activeImages.length, currentIndex]);

  const goToNext = useCallback(() => {
    if (!hasMultiple) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % activeImages.length);
  }, [hasMultiple, activeImages.length]);

  const goToPrev = useCallback(() => {
    if (!hasMultiple) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  }, [hasMultiple, activeImages.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartXRef.current;
      if (diff < -40) {
        goToNext();
      } else if (diff > 40) {
        goToPrev();
      }
      touchStartXRef.current = null;
    }
    // Resume auto-advance after 3s
    setTimeout(() => setIsPaused(false), 3000);
  };

  // 3D Page turn animation variants
  const pageVariants: Record<string, any> = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 120 : -120,
      opacity: 1,
      scale: 0.96,
      boxShadow: dir > 0 ? '-30px 0 45px rgba(0,0,0,0.8)' : '30px 0 45px rgba(0,0,0,0.8)',
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      boxShadow: '0 0 0 rgba(0,0,0,0)',
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -120 : 120,
      opacity: 1,
      scale: 0.96,
      boxShadow: dir > 0 ? '30px 0 45px rgba(0,0,0,0.8)' : '-30px 0 45px rgba(0,0,0,0.8)',
      transition: {
        duration: 0.8,
        ease: 'easeIn',
      },
    }),
  };

  const currentImage = activeImages[currentIndex] || defaultImage;

  return (
    <div
      className={`glass-card text-center animate-fade-in hero-page-turn-card ${
        isCelebrating ? 'hero-card--celebrating' : ''
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        padding: 'var(--space-2xl) var(--space-md)',
        borderRadius: '32px',
        boxShadow:
          celebrationType === 'aniversario'
            ? '0 0 40px rgba(255, 215, 0, 0.3), inset 0 0 20px rgba(255, 215, 0, 0.1)'
            : isCelebrating
              ? undefined
              : '0 12px 40px rgba(0,0,0,0.3)',
        border:
          celebrationType === 'aniversario'
            ? '2px solid rgba(255, 215, 0, 0.4)'
            : isCelebrating
              ? 'none'
              : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        perspective: '2000px',
      }}
    >
      {/* 3D Page Turn Background Layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          perspective: '1400px',
          overflow: 'hidden',
          backgroundColor: '#0d0e12',
        }}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url('${currentImage}')`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              transformOrigin: direction > 0 ? 'left center' : 'right center',
              backfaceVisibility: 'visible',
              WebkitBackfaceVisibility: 'visible',
            }}
          >
            {/* Backside showing next image during turn */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url('${nextImage}')`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
              }}
            />
            {/* Spine Shadow on Left (Book Spine Effect) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '35px',
                background:
                  'linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Darkening Gradient Overlay for guaranteed text readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(13, 14, 18, 0.35) 0%, rgba(13, 14, 18, 0.65) 55%, rgba(13, 14, 18, 0.92) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      </div>

      {/* Top Controls: Page Pill & Manage Album Icon */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '16px',
          right: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 3,
        }}
      >
        {hasMultiple ? (
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              letterSpacing: '0.5px',
            }}
          >
            <span>📖</span>
            <span>
              {currentIndex + 1} / {activeImages.length}
            </span>
          </div>
        ) : (
          <div />
        )}

        {onManageAlbum && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManageAlbum();
            }}
            title="Administrar álbum de fotos (máx. 20)"
            aria-label="Administrar fotos de inicio"
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'background 0.2s ease',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{images.length > 0 ? `${images.length}/20` : 'Agregar fotos'}</span>
          </button>
        )}
      </div>

      {/* Foreground Content (avatars, names, days counter, note) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {children}
      </div>

      {/* Bottom Page Indicators (Dots) */}
      {hasMultiple && (
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 3,
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          {activeImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              aria-label={`Ver foto ${idx + 1}`}
              style={{
                width: idx === currentIndex ? '16px' : '6px',
                height: '6px',
                borderRadius: '3px',
                border: 'none',
                padding: 0,
                background:
                  idx === currentIndex
                    ? 'var(--color-accent, #e5c573)'
                    : 'rgba(255, 255, 255, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}

      {/* Invisible side tap areas for manual next/prev navigation */}
      {hasMultiple && (
        <>
          <div
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            title="Foto anterior"
            style={{
              position: 'absolute',
              top: '40px',
              bottom: '40px',
              left: 0,
              width: '18%',
              zIndex: 3,
              cursor: 'pointer',
            }}
          />
          <div
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            title="Siguiente foto"
            style={{
              position: 'absolute',
              top: '40px',
              bottom: '40px',
              right: 0,
              width: '18%',
              zIndex: 3,
              cursor: 'pointer',
            }}
          />
        </>
      )}
    </div>
  );
}
