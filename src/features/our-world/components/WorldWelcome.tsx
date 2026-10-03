import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  checking: boolean;
  failed: boolean;
  onRetry: () => void;
  onEnter: () => Promise<boolean>;
}

export default function WorldWelcome({ checking, failed, onRetry, onEnter }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    buttonRef.current?.focus();
    return () => previous?.focus();
  }, []);
  const enter = async () => {
    setSaving(true); setSaveError(false);
    try { if (!await onEnter()) setSaveError(true); }
    catch { setSaveError(true); }
    finally { setSaving(false); }
  };
  return createPortal(
    <div className="world-welcome" onKeyDown={event => {
      if (event.key === 'Tab') { event.preventDefault(); buttonRef.current?.focus(); }
    }}>
      <section className="world-welcome__card" role="dialog" aria-modal="true" aria-labelledby="world-welcome-title" aria-describedby="world-welcome-intro">
        <svg className="world-welcome__mark" width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
          <path d="M21 34V19m0 7C9 27 7 18 8 11c10 0 14 5 13 15Zm0-6C20 9 27 5 35 6c1 9-4 15-14 14Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="world-welcome__eyebrow">NUESTRO MUNDO</span>
        <h1 id="world-welcome-title">Este bosque empieza vacío.</h1>
        <p id="world-welcome-intro">Irán desbloqueando objetos con las recompensas y podrán colocarlos donde les guste.</p>
        <ol className="world-welcome__steps">
          <li><strong>Reclamen la recompensa diaria</strong><p>El regalo de arriba trae los primeros objetos. Si ambos suben su foto del día, ganan el doble de XP.</p></li>
          <li><strong>Acomódenlo a su manera</strong><p>Con el martillo pueden mover o quitar objetos. Usen dos dedos para cambiar su tamaño.</p></li>
          <li><strong>Exploren de a poco</strong><p>Al completar el bosque se abre el siguiente bioma.</p></li>
        </ol>
        {(failed || saveError) && <p className="world-welcome__error" role="alert">No pudimos guardar la bienvenida. Inténtenlo de nuevo.</p>}
        <button ref={buttonRef} className="world-welcome__enter" disabled={checking || saving} onClick={failed ? onRetry : enter}>
          {checking ? 'Preparando el bosque…' : saving ? 'Entrando…' : failed ? 'Reintentar' : 'Entrar al bosque'}
        </button>
      </section>
    </div>, document.body,
  );
}
