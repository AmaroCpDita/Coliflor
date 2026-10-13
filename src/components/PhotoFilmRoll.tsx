import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './PhotoFilmRoll.css';

export interface FilmRollItem {
  path: string;
  url: string;
}

interface PhotoFilmRollProps {
  items: FilmRollItem[];
  loading?: boolean;
  saving?: boolean;
  uploading?: boolean;
  uploadProgress?: string;
  error?: string;
  onClearError?: () => void;
  onRetry?: () => void;
  onAddPhotos: (files: File[], replaceAll?: boolean) => Promise<void>;
  onDelete: (path: string) => Promise<void> | void;
  onReorder: (fromIndex: number, toIndex: number) => Promise<void> | void;
  onClearAll: () => Promise<void> | void;
  maxPhotos?: number;
}

function Arrow({ right = false }: { right?: boolean }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={right ? 'm9 5 7 7-7 7' : 'm15 5-7 7 7 7'} />
    </svg>
  );
}

function FilmDialog({
  title,
  children,
  onClose,
  onArrow,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onArrow?: (direction: number) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef({ onClose, onArrow });
  actionsRef.current = { onClose, onArrow };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        actionsRef.current.onClose();
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        if (actionsRef.current.onArrow) {
          event.preventDefault();
          actionsRef.current.onArrow(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }
      if (event.key !== 'Tab') return;
      const controls =
        panelRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      if (!controls?.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(
    <div className="film-dialog-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="film-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="film-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="film-dialog-header">
          <h3 id="film-dialog-title">{title}</h3>
          <button
            ref={closeRef}
            type="button"
            className="film-icon-button"
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function PhotoFilmRoll({
  items,
  loading = false,
  saving = false,
  uploading = false,
  uploadProgress = '',
  error = '',
  onClearError,
  onRetry,
  onAddPhotos,
  onDelete,
  onReorder,
  onClearAll,
  maxPhotos = 20,
}: PhotoFilmRollProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const reelRef = useRef<HTMLOListElement>(null);
  const actionRef = useRef(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'preview' | 'replace' | 'delete' | 'clear' | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [failedUrls, setFailedUrls] = useState(new Set<string>());
  const busy = loading || saving || uploading || localBusy;
  const availableSlots = Math.max(0, maxPhotos - items.length);
  const selectedIndex = items.findIndex((item) => item.path === selectedPath);
  const selected = items[selectedIndex];
  const displayedError = error || localError;

  useEffect(
    () => () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    },
    [],
  );
  useEffect(() => {
    if ((dialog === 'preview' || dialog === 'delete') && !selected) {
      setDialog(null);
      setSelectedPath(null);
    }
    if (!selectedPath || !reelRef.current) return;
    const frame = [
      ...reelRef.current.querySelectorAll<HTMLButtonElement>('[data-photo-path]'),
    ].find((element) => element.dataset.photoPath === selectedPath);
    if (frame)
      reelRef.current.scrollTo({
        left: frame.offsetLeft - reelRef.current.clientWidth / 2 + frame.offsetWidth / 2,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
  }, [items, selectedPath, dialog, selected]);

  const clearError = () => {
    setLocalError('');
    onClearError?.();
  };
  const closeDialog = () => {
    setDialog(null);
    setPendingFiles([]);
  };
  const run = async (action: () => Promise<void> | void, message: string) => {
    if (busy || actionRef.current) return false;
    actionRef.current = true;
    setLocalBusy(true);
    clearError();
    setSuccess('');
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    try {
      await action();
      setSuccess(message);
      successTimerRef.current = setTimeout(() => setSuccess(''), 2500);
      return true;
    } catch (cause) {
      setLocalError(
        cause instanceof Error
          ? cause.message
          : 'No pudimos guardar el cambio. Inténtalo de nuevo.',
      );
      return false;
    } finally {
      actionRef.current = false;
      setLocalBusy(false);
    }
  };
  const openPicker = () => {
    if (busy || actionRef.current) return;
    clearError();
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };
  const selectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const raw = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    if (busy || !raw.length) return;
    const files = raw
      .filter(
        (file) =>
          file.type.startsWith('image/') ||
          /\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(file.name),
      )
      .slice(0, maxPhotos);
    if (!files.length) {
      setLocalError('Selecciona archivos de imagen.');
      return;
    }
    if (items.length && files.length > availableSlots) {
      setPendingFiles(files);
      setDialog('replace');
      return;
    }
    await run(() => onAddPhotos(files, false), 'Fotos guardadas');
  };
  const uploadPending = async (replace: boolean) => {
    const files = pendingFiles.slice(0, replace ? maxPhotos : availableSlots);
    if (!files.length) return;
    closeDialog();
    await run(() => onAddPhotos(files, replace), 'Fotos guardadas');
  };
  const browse = (direction: number) => {
    if (!items.length) return;
    setSelectedPath(items[(selectedIndex + direction + items.length) % items.length].path);
  };
  const move = (direction: number) =>
    run(() => onReorder(selectedIndex, selectedIndex + direction), 'Orden guardado');
  const photo = (item: FilmRollItem, label: string, lazy = false) =>
    item.url && !failedUrls.has(item.url) ? (
      <img
        src={item.url}
        alt={label}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onError={() => setFailedUrls((previous) => new Set(previous).add(item.url))}
      />
    ) : (
      <span className="film-photo-unavailable" role="img" aria-label="Foto no disponible">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="m3 17 5-5 4 4 4-5 5 6" />
        </svg>
      </span>
    );

  return (
    <section className="film-roll" aria-label="Rollo fotográfico" aria-busy={busy || undefined}>
      <input
        ref={inputRef}
        className="film-file-input"
        type="file"
        multiple
        accept="image/*,.heic,.heif"
        aria-label="Seleccionar fotos"
        tabIndex={-1}
        disabled={busy}
        onChange={selectFiles}
      />
      <header className="film-roll-header">
        <h3>
          <span aria-hidden="true">🎞️</span> Rollo fotográfico
        </h3>
        <div>
          <span className="film-roll-count">
            {items.length}
            <i>/</i>
            {maxPhotos}
          </span>
          {onRetry && (
            <button
              type="button"
              className="film-refresh"
              onClick={() => {
                clearError();
                setFailedUrls(new Set());
                onRetry();
              }}
              disabled={busy}
              aria-label="Actualizar rollo"
              title="Actualizar rollo"
            >
              ↻
            </button>
          )}
        </div>
      </header>
      <div className="film-strip">
        <div className="film-strip-edge" aria-hidden="true">
          <span>COLIFLOR</span>
          <span>35mm</span>
        </div>
        <ol ref={reelRef} className="film-frames" aria-label="Fotos en orden de aparición">
          {loading && !items.length ? (
            <li className="film-loading" role="status">
              <span className="spinner" />
              Cargando
            </li>
          ) : !items.length ? (
            <li className="film-empty">
              <span aria-hidden="true">♡</span>
              <button type="button" onClick={openPicker} disabled={busy}>
                Añadir fotos
              </button>
            </li>
          ) : (
            items.map((item, index) => (
              <li key={item.path}>
                <button
                  type="button"
                  className={`film-frame${selectedPath === item.path ? ' film-frame--selected' : ''}`}
                  data-photo-path={item.path}
                  onClick={() => {
                    setSelectedPath(item.path);
                    setDialog('preview');
                  }}
                  aria-label={`Ver foto ${index + 1}`}
                >
                  {photo(item, `Foto ${index + 1}`, true)}
                  <span className="film-frame-number">{String(index + 1).padStart(2, '0')}</span>
                </button>
              </li>
            ))
          )}
          {items.length > 0 && items.length < maxPhotos && (
            <li>
              <button
                type="button"
                className="film-frame film-frame--add"
                onClick={openPicker}
                disabled={busy}
                aria-label="Agregar fotos"
              >
                <span aria-hidden="true">+</span>
              </button>
            </li>
          )}
        </ol>
        <div className="film-strip-edge film-strip-edge--bottom" aria-hidden="true" />
      </div>
      <div className="film-roll-actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={openPicker}
          disabled={busy}
        >
          {uploading
            ? 'Subiendo…'
            : items.length >= maxPhotos
              ? 'Reemplazar fotos'
              : 'Agregar fotos'}
        </button>
        {items.length > 0 && (
          <button
            type="button"
            className="film-clear"
            disabled={busy}
            onClick={() => setDialog('clear')}
          >
            Vaciar
          </button>
        )}
      </div>
      {(uploading || saving || localBusy) && (
        <div className="film-operation" role="status">
          <span className="spinner" />
          <span>{uploading ? uploadProgress || 'Preparando fotos' : 'Guardando…'}</span>
        </div>
      )}
      {displayedError && (
        <div className="film-error" role="alert">
          <span>{displayedError}</span>
          <button
            type="button"
            className="film-icon-button"
            onClick={clearError}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}
      {success && !displayedError && !busy && (
        <div className="film-success" role="status">
          <span aria-hidden="true">✓</span> {success}
        </div>
      )}

      {dialog === 'preview' && selected && (
        <FilmDialog
          title={`Foto ${selectedIndex + 1} de ${items.length}`}
          onClose={closeDialog}
          onArrow={browse}
        >
          <div className="film-preview">
            {photo(selected, `Foto ${selectedIndex + 1}`)}
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  className="film-preview-arrow"
                  aria-label="Foto anterior"
                  onClick={() => browse(-1)}
                >
                  <Arrow />
                </button>
                <button
                  type="button"
                  className="film-preview-arrow film-preview-arrow--next"
                  aria-label="Siguiente foto"
                  onClick={() => browse(1)}
                >
                  <Arrow right />
                </button>
              </>
            )}
          </div>
          <div className="film-preview-tools">
            <button
              type="button"
              disabled={busy || selectedIndex === 0}
              onClick={() => void move(-1)}
            >
              <Arrow /> Mover antes
            </button>
            <button
              type="button"
              disabled={busy || selectedIndex === items.length - 1}
              onClick={() => void move(1)}
            >
              Mover después <Arrow right />
            </button>
            <button
              type="button"
              className="film-delete"
              disabled={busy}
              aria-label="Eliminar foto"
              title="Eliminar foto"
              onClick={() => setDialog('delete')}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />
              </svg>
            </button>
          </div>
          {displayedError && (
            <p className="film-dialog-error" role="alert">
              {displayedError}
            </p>
          )}
        </FilmDialog>
      )}
      {dialog === 'replace' && (
        <FilmDialog title="¿Cómo guardar estas fotos?" onClose={closeDialog}>
          <div className="film-confirm">
            <p>
              Seleccionaste {pendingFiles.length} fotos. Quedan {availableSlots} espacios.
            </p>
            <div className="film-confirm-actions">
              {availableSlots > 0 && (
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={busy}
                  onClick={() => void uploadPending(false)}
                >
                  Agregar {Math.min(pendingFiles.length, availableSlots)} fotos
                </button>
              )}
              <button
                type="button"
                className="btn btn--secondary"
                disabled={busy}
                onClick={() => void uploadPending(true)}
              >
                Reemplazar el rollo
              </button>
              <button type="button" className="btn btn--ghost" onClick={closeDialog}>
                Cancelar
              </button>
            </div>
          </div>
        </FilmDialog>
      )}
      {(dialog === 'delete' || dialog === 'clear') && (
        <FilmDialog
          title={dialog === 'delete' ? '¿Eliminar esta foto?' : '¿Vaciar el rollo?'}
          onClose={closeDialog}
        >
          <div className="film-confirm">
            <p>
              {dialog === 'delete'
                ? 'Se quitará de la portada.'
                : 'Se eliminarán las fotos de la portada.'}
            </p>
            <div className="film-confirm-actions">
              <button
                type="button"
                className="btn film-confirm-danger"
                disabled={busy}
                onClick={async () => {
                  const action =
                    dialog === 'delete'
                      ? selected
                        ? () => onDelete(selected.path)
                        : null
                      : () => onClearAll();
                  if (!action) return;
                  const cleared = await run(
                    action,
                    dialog === 'delete' ? 'Foto eliminada' : 'Rollo vacío',
                  );
                  if (cleared) closeDialog();
                }}
              >
                {busy ? 'Guardando…' : dialog === 'delete' ? 'Eliminar foto' : 'Vaciar rollo'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => (dialog === 'delete' ? setDialog('preview') : closeDialog())}
              >
                Cancelar
              </button>
            </div>
            {displayedError && (
              <p className="film-dialog-error" role="alert">
                {displayedError}
              </p>
            )}
          </div>
        </FilmDialog>
      )}
    </section>
  );
}
