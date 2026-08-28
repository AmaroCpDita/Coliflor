import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LightboxProps {
  url: string | null;
  onClose: () => void;
}

export default function Lightbox({ url, onClose }: LightboxProps) {
  useEffect(() => {
    if (url) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [url]);

  if (!url) return null;

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        animation: 'fadeIn 0.2s forwards'
      }}
      onClick={onClose}
    >
      <img 
        src={url} 
        alt="Enlarged" 
        style={{
          maxWidth: '95%',
          maxHeight: '90%',
          objectFit: 'contain',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          transform: 'scale(0.95)',
          animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}
      />
      <button 
        className="btn btn--ghost" 
        style={{ position: 'absolute', top: '20px', right: '20px', color: '#fff', padding: '8px' }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <style>{`
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          to { transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}
