import { useState } from 'react';
import { FOREST_GOALS, forestCompletionPercent } from '../data/forest';
import type { ForestProgress } from '../data/forest';
import type { WorldActionResult } from '../types';
import WorldModalPortal from './WorldModalPortal';
import ObjectPreview from './ObjectPreview';

export default function ForestJournal({ isOpen, onClose, progress, onClaim, onComplete, onRetry, onExplore, unavailable = false, loading = false }: {
  isOpen: boolean; onClose: () => void; progress: ForestProgress | null;
  onClaim: (id: string) => Promise<WorldActionResult>; onComplete: () => Promise<WorldActionResult>; onRetry: () => void; unavailable?: boolean;
  onExplore?: () => Promise<WorldActionResult>;
  loading?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!isOpen) return null;
  const act = async (id: string, action: () => Promise<WorldActionResult>) => {
    if (busy) return;
    setBusy(id); setError(null);
    try { const result = await action(); if (!result.success) setError(result.error || 'No se pudo guardar. Inténtalo de nuevo.'); }
    catch { setError('No se pudo guardar. Inténtalo de nuevo.'); }
    finally { setBusy(null); }
  };
  return <WorldModalPortal><div className="world-inventory-backdrop" onClick={onClose}>
    <section className="world-inventory forest-journal" role="dialog" aria-modal="true" aria-label="Diario del bosque" onClick={event => event.stopPropagation()}>
      <div className="world-inventory__header"><h3>🌲 Nuestro bosque</h3><button className="world-inventory__close" aria-label="Cerrar diario" onClick={onClose}>✕</button></div>
      <div className="world-inventory__content">
        {!progress ? <div className="world-inventory__empty"><p role="status">{loading ? 'Abriendo su diario…' : unavailable ? 'El diario está pendiente de activación. Tus objetos y tu progreso siguen guardados.' : 'No pudimos cargar el diario del bosque.'}</p>{!unavailable && !loading && <button className="forest-journal__action" onClick={onRetry}>Reintentar</button>}</div> : <>
          <p className="forest-journal__intro">Hagan crecer este lugar con sus encuentros y su racha. Completen las metas a su ritmo.</p>
          <div className="forest-journal__summary"><strong>{progress.completed ? 'Bosque completado 💚' : `${forestCompletionPercent(progress)}% de su bosque`}</strong><progress max={100} value={forestCompletionPercent(progress)} aria-label="Progreso del bosque" /></div>
          <div className="forest-journal__milestones">{progress.target_days > 0 && <div><strong>{Math.min(progress.visits, progress.target_days)} / {progress.target_days}</strong><span>Días visitando el bosque</span></div>}<div><strong>{Math.min(progress.level, progress.target_level)} / {progress.target_level}</strong><span>Nivel del mundo</span></div></div>
          <div className="forest-journal__goals">{FOREST_GOALS.map(def => {
            const goal = progress.goals.find(item => item.id === def.id);
            if (!goal) return null;
            const ready = goal.current >= goal.target;
            return <article className={`forest-journal__goal ${goal.claimed ? 'forest-journal__goal--done' : ''}`} key={def.id}>
              <h4>{def.title} {goal.claimed && '✓'}</h4><p>{def.description}</p>
              {def.id === 'shared_care' && <small>Primera persona: {Math.min(progress.member_visits[0], goal.target / 2)}/{goal.target / 2} · Segunda persona: {Math.min(progress.member_visits[1], goal.target / 2)}/{goal.target / 2}</small>}
              <div className="forest-journal__goal-footer"><span>{goal.claimed ? goal.target : Math.min(goal.current, goal.target)} / {goal.target} · {def.reward}</span><button disabled={!ready || goal.claimed || !!busy} onClick={() => act(def.id, () => onClaim(def.id))}>{goal.claimed ? 'Reclamada' : busy === def.id ? 'Guardando…' : ready ? 'Reclamar' : 'En progreso'}</button></div>
            </article>;
          })}</div>
          <div className="forest-journal__finish"><ObjectPreview itemId="forest_heart" /><div><h4>Corazón del bosque</h4><p>Su recuerdo especial al completar las metas{progress.target_days > 0 ? `, los ${progress.target_days} días de visita` : ''} y el nivel {progress.target_level}. Después podrán explorar el jardín y volver aquí cuando quieran.</p></div></div>
          <button className="forest-journal__action" disabled={!progress.can_complete || progress.completed || !!busy} onClick={() => act('finish', onComplete)}>{progress.completed ? 'Este bosque ya es parte de su historia 💚' : busy === 'finish' ? 'Guardando…' : 'Completar el bosque y abrir el jardín'}</button>
          {progress.completed && onExplore && <button className="forest-journal__action" style={{ marginTop: 10 }} disabled={!!busy} onClick={() => act('explore', onExplore)}>{busy === 'explore' ? 'Abriendo…' : 'Explorar el jardín'}</button>}
          {error && <p role="alert" className="world-inventory__notice">{error}</p>}
        </>}
      </div>
    </section>
  </div></WorldModalPortal>;
}
