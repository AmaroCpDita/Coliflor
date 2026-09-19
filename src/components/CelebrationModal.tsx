import { useState } from 'react';
import type { Celebration } from '../lib/celebrations';

interface CelebrationModalProps {
  celebration: Celebration;
  partnerName: string;
}

export default function CelebrationModal({ celebration, partnerName }: CelebrationModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;
  
  const validTypes = ['aniversario', 'san_valentin'];
  if (!validTypes.includes(celebration.type)) return null;

  let bgGradient = 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 105, 180, 0.15) 100%), var(--color-bg-primary)';
  let borderColor = 'rgba(255, 215, 0, 0.5)';
  let shadow = '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.2)';
  let buttonGradient = 'linear-gradient(135deg, #FFD700 0%, #FF69B4 100%)';
  let title = '';
  let body = null;
  let emojiShadow = 'rgba(255,215,0,0.5)';

  if (celebration.type === 'aniversario') {
    title = '¡Feliz aniversario!';
    body = (
      <>
        Ya ha pasado {celebration.years === 1 ? '1 año' : `${celebration.years} años`} desde que empezó nuestra historia.<br/><br/>
        <span style={{ fontSize: '16px' }}>¡Toca la pantalla en cualquier lugar para lanzar fuegos artificiales! ✨</span>
      </>
    );
  } else if (celebration.type === 'san_valentin') {
    bgGradient = 'linear-gradient(135deg, rgba(255, 105, 180, 0.1) 0%, rgba(255, 20, 147, 0.15) 100%), var(--color-bg-primary)';
    borderColor = 'rgba(255, 105, 180, 0.5)';
    shadow = '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(255, 105, 180, 0.2)';
    buttonGradient = 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)';
    emojiShadow = 'rgba(255,105,180,0.5)';
    title = '¡Feliz Día del Amor!';
    body = (
      <>
        Hoy celebramos el amor y la hermosa conexión que tienes con {partnerName}.<br/><br/>
        <span style={{ fontSize: '16px' }}>¡Toca la pantalla para soltar corazones! 💖</span>
      </>
    );
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 1000 }}>
      <div 
        className="modal animate-scale-in" 
        style={{ 
          background: bgGradient,
          border: `2px solid ${borderColor}`,
          boxShadow: shadow,
          padding: '40px 24px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '72px', marginBottom: '16px', filter: `drop-shadow(0 4px 12px ${emojiShadow})` }}>
          {celebration.emoji}
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', lineHeight: 1.2 }}>
          {title}
        </h2>
        <p style={{ fontSize: '18px', color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: 1.5 }}>
          {body}
        </p>
        <button 
          className="btn btn--primary btn--lg btn--full" 
          onClick={() => setIsOpen(false)}
          style={{
            background: buttonGradient,
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
          }}
        >
          ¡A celebrar! 🥂
        </button>
      </div>
    </div>
  );
}
