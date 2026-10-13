// ============================================================
// Coliflor — PhotoFilmRoll Component (Rollo Fotográfico 35mm)
// Allows viewing, reordering, deleting, and staging up to 20 photos
// for the couple's hero rotating slideshow.
// ============================================================

import React, { useState, useRef, useEffect } from 'react';

export interface FilmRollItem {
  path: string;
  url: string;
}

interface StagedFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface PhotoFilmRollProps {
  items: FilmRollItem[];
  loading?: boolean;
  uploading?: boolean;
  uploadProgress?: string;
  error?: string;
  onClearError?: () => void;
  onAddPhotos: (files: File[]) => Promise<void>;
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

  // Staged files for preview before upload
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [showStagingModal, setShowStagingModal] = useState(false);

  // Inspector modal for viewing/editing a selected photo
  const [inspectIndex, setInspectIndex] = useState<number | null>(null);

  // Clean up object URLs when stagedFiles change or unmount
  useEffect(() => {
    return () => {
      stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [stagedFiles]);

  const availableSlots = Math.max(0, maxPhotos - items.length);

  // Trigger system file picker
  const handleOpenPicker = () => {
    if (availableSlots <= 0) return;
    if (onClearError) onClearError();
    fileInputRef.current?.click();
  };

  // Handle files selected from system picker
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    // Map files to staged items with preview URLs
    const newStaged: StagedFile[] = rawFiles.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${file.name}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setStagedFiles(newStaged);
    setShowStagingModal(true);
    if (onClearError) onClearError();

    // Reset input value so re-selecting same files triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Remove a single photo from staging
  const handleRemoveStaged = (id: string) => {
    setStagedFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  // Auto-trim staged files to available slots
  const handleAutoTrimStaged = () => {
    if (availableSlots <= 0) return;
    setStagedFiles((prev) => {
      const keep = prev.slice(0, availableSlots);
      const discarded = prev.slice(availableSlots);
      discarded.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      return keep;
    });
  };

  // Cancel staging modal
  const handleCloseStaging = () => {
    if (uploading) return;
    stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setStagedFiles([]);
    setShowStagingModal(false);
  };

  // Confirm upload of staged files
  const handleConfirmUpload = async () => {
    if (stagedFiles.length === 0 || stagedFiles.length > availableSlots || uploading) return;

    try {
      const filesToUpload = stagedFiles.map((s) => s.file);
      await onAddPhotos(filesToUpload);
      // Clean up and close modal on success
      stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setStagedFiles([]);
      setShowStagingModal(false);
    } catch {
      // Error is handled via props and displayed in modal/card
    }
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
      {/* Hidden system file picker (accept="image/*" ensures smooth native picker behavior without conflicting MIME filters) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        style={{ display: 'none' }}
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
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background:
              items.length >= maxPhotos ? 'rgba(239, 68, 68, 0.2)' : 'rgba(229, 197, 115, 0.15)',
            color: items.length >= maxPhotos ? '#fca5a5' : 'var(--color-accent, #e5c573)',
            border: `1px solid ${
              items.length >= maxPhotos ? 'rgba(239, 68, 68, 0.35)' : 'rgba(229, 197, 115, 0.3)'
            }`,
            letterSpacing: '0.5px',
          }}
        >
          {items.length} / {maxPhotos} fotogramas
        </span>
      </div>

      <p
        className="text-secondary"
        style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-md)' }}
      >
        Tus fotos giran automáticamente cada 4 segundos con animación 3D en la pantalla de inicio.
        Toca cualquier fotograma para ver opciones o cambiar el orden.
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
                Tu rollo fotográfico está listo. Puedes subir hasta 20 fotos para la portada.
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
                ➕ Cargar primeras fotos
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
              <span style={{ fontSize: '10px', fontWeight: 700, lineHeight: 1.2 }}>
                Fotograma #{items.length + 1}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  opacity: 0.7,
                  color: 'var(--color-text-secondary)',
                }}
              >
                ({availableSlots} disponibles)
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
              <span style={{ fontSize: '10px', fontWeight: 700 }}>Rollo Lleno</span>
              <span style={{ fontSize: '8px', opacity: 0.8 }}>20 / 20 fotos</span>
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
          disabled={uploading || items.length >= maxPhotos}
          style={{ fontWeight: 700 }}
        >
          {uploading
            ? uploadProgress || 'Subiendo fotos al rollo...'
            : items.length >= maxPhotos
              ? 'Límite de 20 fotogramas alcanzado'
              : items.length === 0
                ? '➕ Agregar fotos al rollo'
                : `➕ Agregar más fotos (${items.length}/${maxPhotos})`}
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
      {/* 1. STAGING & PREVIEW MODAL (Strict 20-photo validation)        */}
      {/* ============================================================ */}
      {showStagingModal && (
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
          onClick={handleCloseStaging}
        >
          <div
            style={{
              background: '#13141c',
              border: '1px solid rgba(229, 197, 115, 0.3)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 700,
                    margin: 0,
                    color: '#fff',
                  }}
                >
                  🎞️ Preparar fotos para el rollo
                </h3>
                <p
                  className="text-secondary"
                  style={{ fontSize: 'var(--font-size-xs)', margin: '2px 0 0' }}
                >
                  Revisa tu selección antes de subirlas al álbum
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseStaging}
                disabled={uploading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                  opacity: uploading ? 0.4 : 0.8,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Selection Status */}
            <div
              style={{
                padding: '16px 20px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* Exceeds limit warning */}
              {stagedFiles.length > availableSlots && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    fontSize: 'var(--font-size-xs)',
                    marginBottom: '14px',
                    lineHeight: 1.4,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                    ⚠️ Has seleccionado {stagedFiles.length} fotos.
                  </div>
                  Solo puedes tener hasta 20 fotos en el rollo (te quedan{' '}
                  <strong>{availableSlots}</strong> espacios disponibles).
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleAutoTrimStaged}
                      style={{
                        background: 'rgba(239, 68, 68, 0.25)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                      }}
                    >
                      ✂️ Conservar solo las primeras {availableSlots} fotos
                    </button>
                  </div>
                </div>
              )}

              {/* Valid selection pill */}
              {stagedFiles.length <= availableSlots && stagedFiles.length > 0 && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(229, 197, 115, 0.1)',
                    border: '1px solid rgba(229, 197, 115, 0.3)',
                    color: 'var(--color-accent, #e5c573)',
                    fontSize: 'var(--font-size-xs)',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    ✨ <strong>{stagedFiles.length} fotos</strong> listas para agregar
                  </span>
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>
                    Total: {items.length + stagedFiles.length} / 20
                  </span>
                </div>
              )}

              {/* Uploading progress indicator */}
              {uploading && (
                <div
                  style={{
                    padding: '16px',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(229, 197, 115, 0.3)',
                    textAlign: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    className="spinner"
                    style={{
                      width: '28px',
                      height: '28px',
                      margin: '0 auto 10px',
                      borderColor:
                        'var(--color-accent) transparent var(--color-accent) transparent',
                    }}
                  />
                  <div
                    style={{
                      color: 'var(--color-accent, #e5c573)',
                      fontWeight: 700,
                      fontSize: 'var(--font-size-sm)',
                      marginBottom: '4px',
                    }}
                  >
                    {uploadProgress || 'Procesando fotogramas...'}
                  </div>
                  <p
                    className="text-secondary"
                    style={{ fontSize: 'var(--font-size-xs)', margin: 0 }}
                  >
                    Optimizando imágenes para que carguen de inmediato sin lentitud.
                  </p>
                </div>
              )}

              {/* Thumbnail Grid of Selected Files */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                  gap: '8px',
                }}
              >
                {stagedFiles.map((staged, idx) => {
                  const isOverLimit = idx >= availableSlots;
                  return (
                    <div
                      key={staged.id}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        background: '#08080a',
                        border: isOverLimit
                          ? '2px solid rgba(239, 68, 68, 0.8)'
                          : '1px solid rgba(255, 255, 255, 0.15)',
                        opacity: isOverLimit ? 0.6 : 1,
                      }}
                    >
                      <img
                        src={staged.previewUrl}
                        alt={`Selección ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          left: '3px',
                          fontSize: '9px',
                          fontWeight: 700,
                          color: '#fff',
                          background: isOverLimit ? '#ef4444' : 'rgba(0,0,0,0.7)',
                          padding: '1px 4px',
                          borderRadius: '3px',
                        }}
                      >
                        #{idx + 1}
                      </span>
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStaged(staged.id)}
                          title="Quitar foto"
                          style={{
                            position: 'absolute',
                            top: '3px',
                            right: '3px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(239, 68, 68, 0.9)',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                gap: '10px',
              }}
            >
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleCloseStaging}
                disabled={uploading}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleConfirmUpload}
                disabled={
                  uploading || stagedFiles.length === 0 || stagedFiles.length > availableSlots
                }
                style={{
                  flex: 2,
                  fontWeight: 700,
                }}
              >
                {uploading
                  ? 'Subiendo...'
                  : stagedFiles.length > availableSlots
                    ? `Excede el límite (+${stagedFiles.length - availableSlots})`
                    : `✨ Subir ${stagedFiles.length} foto${stagedFiles.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. INSPECTOR & VIEWER MODAL (Edit, Reorder, Delete Photo)     */}
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
    </div>
  );
}
