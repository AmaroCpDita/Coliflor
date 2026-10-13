// ============================================================
// Coliflor — Login / Register Page (Framed Logo Badge)
// ============================================================

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          setError('Ingresa tu nombre');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName.trim());
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const msg = err?.message || 'Error de autenticación';
      if (msg.includes('Invalid login credentials')) {
        setError('Correo o contraseña incorrectos');
      } else if (msg.includes('User already registered')) {
        setError('Este correo ya está registrado');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--centered">
      <div className="stack stack--xl" style={{ width: '100%', maxWidth: '360px' }}>
        {/* Logo Badge Framed */}
        <div
          className="animate-fade-in"
          style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}
        >
          <div className="logo-badge">
            <img src="/logo.png" alt="Coliflor Logo" className="logo-badge__img" />
          </div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', letterSpacing: '-0.02em' }}>
            <span className="text-gradient">Coliflor</span>
          </h1>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="glass-card stack stack--md">
          {mode === 'register' && (
            <div className="input-group">
              <label htmlFor="displayName">Tu nombre</label>
              <input
                id="displayName"
                type="text"
                className="input"
                placeholder="Ej: Usuario 1 / Usuario 2"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div
              className="toast toast--error"
              style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={loading}>
            {loading ? (
              <div
                className="spinner"
                style={{ width: '20px', height: '20px', borderWidth: '2px' }}
              />
            ) : mode === 'login' ? (
              'Entrar'
            ) : (
              'Crear cuenta'
            )}
          </button>
        </form>

        {/* Toggle */}
        <div className="divider--text">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
        </div>

        <button
          className="btn btn--secondary btn--full"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </div>
    </div>
  );
}
