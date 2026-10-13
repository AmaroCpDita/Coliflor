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
  defaultImage,
  intervalMs = 4000,
  children,
  onManageAlbum,
  celebrationType,
  isCelebrating,
}: HeroPageTurnProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Normalize image list
  const activeImages = images.length > 0 ? images : defaultImage ? [defaultImage] : [];
  const hasMultiple = activeImages.length > 1;
  const currentImage = activeImages.length > 0 ? activeImages[currentIndex] : null;
  const nextImage =
    activeImages.length > 0
      ? activeImages[(currentIndex + direction + activeImages.length) % activeImages.length]
      : null;

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
    if (activeImages.length > 0 && currentIndex >= activeImages.length) {
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
        padding: 'var(--space-xl) var(--space-md)',
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
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        perspective: '2000px',
        minHeight: '380px',
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
          backgroundImage: currentImage
            ? undefined
            : 'radial-gradient(ellipse at 50% 20%, rgba(229, 197, 115, 0.12) 0%, rgba(13, 14, 18, 0.95) 75%)',
        }}
      >
        {currentImage && (
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
              {nextImage && (
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
              )}
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
        )}

        {/* Soft atmospheric gradient: Keeps images bright and clear while guaranteeing text contrast */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.05) 35%, rgba(10, 11, 15, 0.65) 100%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      </div>

      {/* Top Controls: Manage Album Icon Button (No counters) */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          right: '16px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          zIndex: 3,
        }}
      >
        {onManageAlbum && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManageAlbum();
            }}
            title="Administrar álbum de fotos"
            aria-label="Administrar fotos de portada"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s ease, transform 0.15s ease',
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
            <span>Fotos</span>
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
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        {children}
      </div>

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
              width: '20%',
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
              width: '20%',
              zIndex: 3,
              cursor: 'pointer',
            }}
          />
        </>
      )}
    </div>
  );
}
