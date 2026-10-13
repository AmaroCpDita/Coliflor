// ============================================================
// Coliflor — PhotoFilmRoll Component (Rollo Fotográfico 35mm)
// Ultra-reliable photo selection & upload for iOS & Android
// Supports batch uploads up to 20 photos without memory crashes.
// ============================================================

import React, { useState, useRef, useEffect } from 'react';

export interface FilmRollItem {
  path: string;
  url: string;
}

interface PhotoFilmRollProps {
  items: FilmRollItem[];
  loading?: boolean;
  uploading?: boolean;
  uploadProgress?: string;
  error?: string;
  onClearError?: () => void;
  onAddPhotos: (files: File[], replaceAll?: boolean) => Promise<void>;
  onDelete: (path: string) => Promise<void> | void;
  onReorder: (fromIndex: number, toIndex: number) => Promise<void> | void;
  onClearAll: () => Promise<void> | void;
  maxPhotos?: number;
}

export default function PhotoFilmRoll({
  items,
  loading = false,
  uploading = false,
  uploadProgress = '',
  error = '',
  onClearError,
  onAddPhotos,
  onDelete,
  onReorder,
  onClearAll,
  maxPhotos = 20,
}: PhotoFilmRollProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reelScrollRef = useRef<HTMLDivElement>(null);

  // Inspector modal for viewing/editing a selected photo
  const [inspectIndex, setInspectIndex] = useState<number | null>(null);

  // Replace vs Append dialog if user selects many photos and already has photos
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);

  // Floating upload card state
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const prevUploadingRef = useRef(uploading);

  useEffect(() => {
    if (prevUploadingRef.current && !uploading && !error) {
      setUploadSuccess(true);
      const timer = setTimeout(() => setUploadSuccess(false), 3500);
      return () => clearTimeout(timer);
    }
    prevUploadingRef.current = uploading;
  }, [uploading, error]);

  const availableSlots = Math.max(0, maxPhotos - items.length);

  // Trigger system file picker safely across iOS Safari & Android
  const handleOpenPicker = () => {
    if (onClearError) onClearError();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  // Handle files selected from system picker
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    if (onClearError) onClearError();

    // Auto-cap to maxPhotos (20) so selecting > 20 never breaks or blocks
    const cappedFiles = rawFiles.slice(0, maxPhotos);

    // If album already has photos and incoming photos exceed remaining slots,
    // give user the clear choice to Replace Album or Fill Remaining Slots
    if (items.length > 0 && cappedFiles.length > availableSlots) {
      setPendingFiles(cappedFiles);
      setShowReplaceDialog(true);
      return;
    }

    // Direct upload: if empty or fits remaining slots, start uploading immediately!
    const toUpload = cappedFiles.slice(0, availableSlots > 0 ? availableSlots : maxPhotos);
    try {
      await onAddPhotos(toUpload, false);
    } catch {
      // Error handled via props
    }
  };

  // Handle choice to replace all photos with new selection
  const handleConfirmReplace = async () => {
    setShowReplaceDialog(false);
    const toUpload = pendingFiles.slice(0, maxPhotos);
    setPendingFiles([]);
    try {
      await onAddPhotos(toUpload, true);
    } catch {
      // Error handled via props
    }
  };

  // Handle choice to append only what fits up to 20
  const handleConfirmAppend = async () => {
    setShowReplaceDialog(false);
    const toUpload = pendingFiles.slice(0, availableSlots);
    setPendingFiles([]);
    try {
      await onAddPhotos(toUpload, false);
    } catch {
      // Error handled via props
    }
  };

  const handleCancelChoice = () => {
    setShowReplaceDialog(false);
    setPendingFiles([]);
  };

  // Quick reorder helpers
  const handleMoveLeft = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index > 0) {
      onReorder(index, index - 1);
      if (inspectIndex !== null && inspectIndex === index) {
        setInspectIndex(index - 1);
      }
    }
  };

  const handleMoveRight = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (index < items.length - 1) {
      onReorder(index, index + 1);
      if (inspectIndex !== null && inspectIndex === index) {
        setInspectIndex(index + 1);
      }
    }
  };

  // Quick delete
  const handleDeleteItem = (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('¿Deseas eliminar este fotograma del rollo?')) {
      onDelete(path);
      if (inspectIndex !== null) setInspectIndex(null);
    }
  };

  // Sprocket hole strip renderer
  const renderSprockets = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        height: '14px',
        overflow: 'hidden',
        padding: '0 8px',
        opacity: 0.55,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: 48 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '8px',
            height: '10px',
            borderRadius: '2px',
            background: 'rgba(255, 255, 255, 0.25)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.9)',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      {/* System file picker placed safely with opacity: 0 (avoids iOS Safari display:none untrusted click blocking) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none',
        }}
        onChange={handleFilesSelected}
      />

      {/* Card Header & Counter */}
      <div
        className="row row--between"
        style={{ marginBottom: 'var(--space-xs)', alignItems: 'center' }}
      >
        <div className="row row--gap-sm" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '18px' }}>🎞️</span>
          <div>
            <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, margin: 0 }}>
              Rollo Fotográfico (Portada)
            </h3>
          </div>
        </div>
      </div>

      <p
        className="text-secondary"
        style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-md)' }}
      >
        Tus fotos pasan cada 4 segundos con animación de página en el inicio. Puedes seleccionar
        hasta 20 fotos de una sola vez o ir agregando poco a poco.
      </p>

      {/* Local Error Alert */}
      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: 'var(--font-size-xs)',
            marginBottom: 'var(--space-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <span>⚠️ {error}</span>
          {onClearError && (
            <button
              onClick={onClearError}
              style={{
                background: 'none',
                border: 'none',
                color: '#fca5a5',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px 6px',
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* --- 35mm FILM ROLL CONTAINER --- */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0d0e13 0%, #151620 50%, #0d0e13 100%)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(229, 197, 115, 0.22)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          marginBottom: 'var(--space-md)',
          position: 'relative',
        }}
      >
        {/* Top Sprocket Perforations & Film Info */}
        <div
          style={{
            background: '#090a0e',
            paddingTop: '6px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 12px 4px',
              fontSize: '9px',
              fontFamily: 'monospace',
              letterSpacing: '1.5px',
              color: 'var(--color-accent, #e5c573)',
              opacity: 0.85,
            }}
          >
            <span>◄ COLIFLOR COLOR 400</span>
            <span>35mm EXP 20</span>
            <span>ROLLO DE RECUERDOS ►</span>
          </div>
          {renderSprockets()}
        </div>

        {/* Middle Filmstrip Horizontal Reel */}
        <div
          ref={reelScrollRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 14px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(229, 197, 115, 0.4) transparent',
            minHeight: '160px',
          }}
        >
          {loading && (
            <div
              style={{
                width: '100%',
                padding: '30px 10px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              <div
                className="spinner"
                style={{
                  width: '24px',
                  height: '24px',
                  margin: '0 auto 8px',
                  borderColor: 'var(--color-accent) transparent var(--color-accent) transparent',
                }}
              />
              Cargando fotogramas del rollo...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div
              style={{
                width: '100%',
                padding: '24px 16px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-xs)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '28px' }}>🎞️</span>
              <p style={{ margin: 0, maxWidth: '280px', lineHeight: 1.4 }}>
                Tu rollo fotográfico está listo. Selecciona tus 20 fotos para la portada.
              </p>
              <button
                type="button"
                className="btn btn--sm"
                onClick={handleOpenPicker}
                style={{
                  marginTop: '4px',
                  background: 'var(--color-accent, #e5c573)',
                  color: '#000',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 16px',
                }}
              >
                ➕ Seleccionar fotos (hasta 20)
              </button>
            </div>
          )}

          {!loading &&
            items.map((item, index) => {
              const frameNumber = String(index + 1).padStart(2, '0');
              return (
                <div
                  key={item.path}
                  onClick={() => setInspectIndex(index)}
                  style={{
                    position: 'relative',
                    width: '105px',
                    height: '135px',
                    flexShrink: 0,
                    borderRadius: '6px',
                    background: '#040507',
                    border: '2px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.7)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.18s ease, border-color 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.borderColor = 'var(--color-accent, #e5c573)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                >
                  {/* Photo Image */}
                  <img
                    src={item.url}
                    alt={`Fotograma ${index + 1}`}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Frame Top Header */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      padding: '3px 5px',
                      background:
                        'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: 'var(--color-accent, #e5c573)',
                    }}
                  >
                    <span>F-{frameNumber}</span>
                    <span style={{ fontSize: '8px', opacity: 0.8 }}>35mm</span>
                  </div>

                  {/* Bottom Quick Controls Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '4px 3px',
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0) 100%)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    {/* Move Left */}
                    <button
                      type="button"
                      title="Mover a la izquierda"
                      disabled={index === 0}
                      onClick={(e) => handleMoveLeft(index, e)}
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: 'none',
                        color: index === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
                        borderRadius: '3px',
                        width: '20px',
                        height: '20px',
                        fontSize: '9px',
                        cursor: index === 0 ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      ◀
                    </button>

                    {/* Quick Delete */}
                    <button
                      type="button"
                      title="Eliminar fotograma"
                      onClick={(e) => handleDeleteItem(item.path, e)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.75)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '3px',
                        width: '20px',
                        height: '20px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      ✕
                    </button>

                    {/* Move Right */}
                    <button
                      type="button"
                      title="Mover a la derecha"
                      disabled={index === items.length - 1}
                      onClick={(e) => handleMoveRight(index, e)}
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: 'none',
                        color: index === items.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff',
                        borderRadius: '3px',
                        width: '20px',
                        height: '20px',
                        fontSize: '9px',
                        cursor: index === items.length - 1 ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                      }}
                    >
                      ▶
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Slot for adding next frame (if under maxPhotos) */}
          {!loading && items.length < maxPhotos && (
            <div
              onClick={handleOpenPicker}
              style={{
                position: 'relative',
                width: '105px',
                height: '135px',
                flexShrink: 0,
                borderRadius: '6px',
                background: 'rgba(229, 197, 115, 0.04)',
                border: '2px dashed rgba(229, 197, 115, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                color: 'var(--color-accent, #e5c573)',
                padding: '6px',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(229, 197, 115, 0.1)';
                e.currentTarget.style.borderColor = 'var(--color-accent, #e5c573)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(229, 197, 115, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(229, 197, 115, 0.45)';
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(229, 197, 115, 0.15)',
                  border: '1px solid var(--color-accent, #e5c573)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                +
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1.2 }}>Agregar</span>
              <span
                style={{
                  fontSize: '9px',
                  opacity: 0.7,
                  color: 'var(--color-text-secondary)',
                }}
              >
                ({availableSlots} libres)
              </span>
            </div>
          )}

          {/* Full roll indicator */}
          {!loading && items.length >= maxPhotos && (
            <div
              style={{
                width: '95px',
                height: '135px',
                flexShrink: 0,
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px',
                textAlign: 'center',
                color: '#fca5a5',
              }}
            >
              <span style={{ fontSize: '18px' }}>🔒</span>
              <span style={{ fontSize: '10px', fontWeight: 700 }}>Rollo Completo</span>
            </div>
          )}
        </div>

        {/* Bottom Sprocket Perforations & Frame Markings */}
        <div
          style={{
            background: '#090a0e',
            paddingBottom: '6px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {renderSprockets()}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 12px 0',
              fontSize: '9px',
              fontFamily: 'monospace',
              letterSpacing: '1.5px',
              color: 'var(--color-accent, #e5c573)',
              opacity: 0.85,
            }}
          >
            <span>▲ 01A</span>
            <span>▲ 05A</span>
            <span>▲ 10A</span>
            <span>▲ 15A</span>
            <span>▲ 20A</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Below the Film Roll */}
      <div className="stack stack--sm">
        <button
          type="button"
          className="btn btn--primary btn--full"
          onClick={handleOpenPicker}
          disabled={uploading}
          style={{ fontWeight: 700 }}
        >
          {uploading
            ? uploadProgress || 'Subiendo fotos al rollo...'
            : items.length === 0
              ? '➕ Subir fotos a la portada (hasta 20)'
              : items.length >= maxPhotos
                ? '🔄 Reemplazar fotos del rollo (20/20)'
                : '➕ Agregar más fotos'}
        </button>

        {items.length > 0 && (
          <button
            type="button"
            className="btn btn--ghost btn--full"
            onClick={onClearAll}
            disabled={uploading}
            style={{
              color: '#f87171',
              fontSize: 'var(--font-size-xs)',
              padding: '6px 12px',
            }}
          >
            🗑️ Vaciar rollo completo
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* 1. UPLOADING LIVE MODAL (Sequential, zero memory crashes)     */}
      {/* ============================================================ */}
      {uploading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            style={{
              background: '#13141c',
              border: '1px solid rgba(229, 197, 115, 0.35)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '380px',
              width: '100%',
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎞️</div>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                margin: '0 0 6px',
                color: '#fff',
              }}
            >
              Subiendo fotos al rollo
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                color: 'var(--color-accent, #e5c573)',
                margin: '0 0 16px',
              }}
            >
              {uploadProgress || 'Procesando imágenes...'}
            </p>
            <div
              className="spinner"
              style={{
                width: '32px',
                height: '32px',
                margin: '0 auto 16px',
                borderColor: 'var(--color-accent) transparent var(--color-accent) transparent',
              }}
            />
            <p className="text-secondary" style={{ fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
              Optimizando las fotos para que carguen al instante en iOS y Android sin lentitud. Por
              favor espera.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. REPLACE VS APPEND DIALOG (When user selects > free slots)  */}
      {/* ============================================================ */}
      {showReplaceDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={handleCancelChoice}
        >
          <div
            style={{
              background: '#13141c',
              border: '1px solid rgba(229, 197, 115, 0.35)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '420px',
              width: '100%',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}
            >
              <span style={{ fontSize: '24px' }}>🎞️</span>
              <h3
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 700,
                  margin: 0,
                  color: '#fff',
                }}
              >
                ¿Cómo deseas guardar tus fotos?
              </h3>
            </div>
            <p
              className="text-secondary"
              style={{ fontSize: 'var(--font-size-xs)', lineHeight: 1.4, marginBottom: '16px' }}
            >
              Seleccionaste <strong>{pendingFiles.length} fotos</strong> y actualmente tienes{' '}
              <strong>{items.length} fotos</strong> en el rollo (máximo 20 fotos en total).
            </p>

            <div className="stack stack--sm">
              <button
                type="button"
                className="btn btn--primary btn--full"
                onClick={handleConfirmReplace}
                style={{ fontWeight: 700, padding: '12px' }}
              >
                🔄 Reemplazar todo el rollo con estas {Math.min(maxPhotos, pendingFiles.length)}{' '}
                fotos
              </button>

              {availableSlots > 0 && (
                <button
                  type="button"
                  className="btn btn--secondary btn--full"
                  onClick={handleConfirmAppend}
                  style={{ fontSize: 'var(--font-size-xs)', padding: '10px' }}
                >
                  ➕ Agregar solo {availableSlots} fotos (hasta completar 20)
                </button>
              )}

              <button
                type="button"
                className="btn btn--ghost btn--full"
                onClick={handleCancelChoice}
                style={{ fontSize: 'var(--font-size-xs)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. INSPECTOR & VIEWER MODAL (Edit, Reorder, Delete Photo)     */}
      {/* ============================================================ */}
      {inspectIndex !== null && items[inspectIndex] && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => setInspectIndex(null)}
        >
          <div
            style={{
              background: '#13141c',
              border: '1px solid rgba(229, 197, 115, 0.35)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '440px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Inspector Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--color-accent, #e5c573)',
                    fontWeight: 700,
                  }}
                >
                  FOTOGRAMA #{String(inspectIndex + 1).padStart(2, '0')} DE {items.length}
                </span>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>
                  Detalles del Fotograma
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectIndex(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '22px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Photo View */}
            <div
              style={{
                position: 'relative',
                background: '#000',
                maxHeight: '380px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={items[inspectIndex].url}
                alt={`Fotograma ${inspectIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '380px',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>

            {/* Inspector Controls */}
            <div
              style={{
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={inspectIndex === 0}
                  onClick={() => handleMoveLeft(inspectIndex)}
                  style={{ flex: 1, fontSize: 'var(--font-size-xs)' }}
                >
                  ◀ Mover antes
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={inspectIndex === items.length - 1}
                  onClick={() => handleMoveRight(inspectIndex)}
                  style={{ flex: 1, fontSize: 'var(--font-size-xs)' }}
                >
                  Mover después ▶
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => handleDeleteItem(items[inspectIndex].path)}
                  style={{
                    flex: 1,
                    color: '#f87171',
                    fontSize: 'var(--font-size-xs)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  🗑️ Eliminar del rollo
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setInspectIndex(null)}
                  style={{ flex: 1 }}
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ============================================================ */}
      {/* 4. FLOATING UPLOAD CARD (Bottom-Right / Pared inferior derecha) */}
      {/* ============================================================ */}
      {(uploading || uploadSuccess) && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '20px',
            zIndex: 99999,
            background: 'rgba(18, 20, 28, 0.96)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: uploadSuccess
              ? '1px solid rgba(74, 222, 128, 0.5)'
              : '1px solid rgba(229, 197, 115, 0.5)',
            borderRadius: '16px',
            padding: '12px 18px',
            boxShadow: uploadSuccess
              ? '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(74, 222, 128, 0.25)'
              : '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(229, 197, 115, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '320px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {uploadSuccess ? (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(74, 222, 128, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: '#4ade80',
                flexShrink: 0,
              }}
            >
              ✓
            </div>
          ) : (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(229, 197, 115, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(229, 197, 115, 0.3)',
                  borderTopColor: 'var(--color-accent, #e5c573)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: uploadSuccess ? '#4ade80' : '#ffffff',
                marginBottom: '2px',
                letterSpacing: '0.2px',
              }}
            >
              {uploadSuccess ? '¡Fotos subidas!' : 'Subiendo foto...'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {uploadSuccess
                ? 'Tu rollo fotográfico se actualizó'
                : uploadProgress || 'Subiendo y guardando en tu rollo...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
