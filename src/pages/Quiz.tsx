// ============================================================
// Coliflor — Daily Couple Quiz & Harmony Match (/quiz)
// Clean, spacious vector design with Theme Welcome Intro Card
// ============================================================

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getTodayInTimezone, formatDate } from '../lib/utils';
import { getDailyQuiz } from '../lib/quizBank';
import type { QuizResponse } from '../lib/types';
import LoadingScreen from '../components/LoadingScreen';

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e5c573" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconGoldHeart({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const diffMs = Math.max(0, midnight.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export default function Quiz() {
  const { couple, profile, partner, isMockMode } = useAuth();
  const today = getTodayInTimezone();
  const dailyQuiz = getDailyQuiz(today);

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0..4
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [myResponse, setMyResponse] = useState<QuizResponse | null>(null);
  const [partnerResponse, setPartnerResponse] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nudgeSent, setNudgeSent] = useState(false);

  // Countdown timer to midnight
  const [countdownStr, setCountdownStr] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownStr(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const myName = profile?.display_name || 'Tú';
  const partnerName = partner ? partner.display_name : 'Tu pareja';

  // Fetch responses for today
  const fetchTodayQuiz = useCallback(async () => {
    if (!couple || !profile) return;

    if (isMockMode) {
      setMyResponse({
        id: 'mr1',
        couple_id: 'mock',
        quiz_date: today,
        user_id: profile.id,
        answers: [0, 1, 0, 2, 0],
        created_at: new Date().toISOString(),
      });
      setPartnerResponse({
        id: 'pr1',
        couple_id: 'mock',
        quiz_date: today,
        user_id: 'mock-partner',
        answers: [0, 1, 2, 2, 0],
        created_at: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('couple_id', couple.id)
        .eq('quiz_date', today);

      if (!error && data) {
        const mine = data.find((r: QuizResponse) => r.user_id === profile.id);
        const theirs = data.find((r: QuizResponse) => r.user_id !== profile.id);
        setMyResponse(mine || null);
        setPartnerResponse(theirs || null);
      }
    } catch (err) {
      console.error('Error fetching quiz responses:', err);
    } finally {
      setLoading(false);
    }
  }, [couple?.id, profile?.id, today, isMockMode]);

  useEffect(() => {
    fetchTodayQuiz();
  }, [fetchTodayQuiz]);

  // Realtime subscription to receive partner's response instantly
  useEffect(() => {
    if (!couple || isMockMode) return;

    const channel = supabase
      .channel('quiz-responses-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_responses',
          filter: `couple_id=eq.${couple.id}`,
        },
        () => {
          fetchTodayQuiz();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, fetchTodayQuiz, isMockMode]);

  const handleSelectOption = (optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentStep] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (selectedAnswers.length < 5 || selectedAnswers.some(a => a === undefined) || !couple || !profile || submitting) {
      return;
    }
    setSubmitting(true);

    if (isMockMode) {
      const resp: QuizResponse = {
        id: 'mr-' + Date.now(),
        couple_id: 'mock',
        quiz_date: today,
        user_id: profile.id,
        answers: selectedAnswers,
        created_at: new Date().toISOString(),
      };
      setMyResponse(resp);
      setSubmitting(false);
      return;
    }

    try {
      const { error: quizErr } = await supabase
        .from('quiz_responses')
        .upsert({
          couple_id: couple.id,
          quiz_date: today,
          user_id: profile.id,
          answers: selectedAnswers,
        }, { onConflict: 'couple_id,quiz_date,user_id' });

      if (quizErr) {
        console.warn('Quiz upsert warning:', quizErr);
        const resp: QuizResponse = {
          id: 'mr-' + Date.now(),
          couple_id: couple.id,
          quiz_date: today,
          user_id: profile.id,
          answers: selectedAnswers,
          created_at: new Date().toISOString(),
        };
        setMyResponse(resp);
      } else {
        const pushText = partnerResponse
          ? `📊 ¡${myName} respondió! Tus resultados de sintonía están listos para comparar.`
          : `📊 ${myName} ya respondió el cuestionario de hoy, ¡faltas tú!`;

        try {
          await supabase.from('messages').insert({
            couple_id: couple.id,
            sender_id: profile.id,
            content: pushText,
          });
        } catch {
          // Ignore non-fatal notification warning
        }

        await fetchTodayQuiz();
      }
    } catch (err: any) {
      console.error('Unexpected error saving quiz:', err);
      const resp: QuizResponse = {
        id: 'mr-' + Date.now(),
        couple_id: couple.id,
        quiz_date: today,
        user_id: profile.id,
        answers: selectedAnswers,
        created_at: new Date().toISOString(),
      };
      setMyResponse(resp);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNudge = async () => {
    if (!couple || !profile || nudgeSent) return;
    setNudgeSent(true);

    try {
      await supabase.from('messages').insert({
        couple_id: couple.id,
        sender_id: profile.id,
        content: `📊 ¡${partnerName}! ${myName} te está esperando para ver su sintonía del día en el cuestionario.`,
      });
    } catch (err) {
      console.error('Error sending nudge:', err);
    }
  };

  // Calculate harmony compatibility score
  let harmonyScore = 0;
  let matchesCount = 0;
  if (myResponse && partnerResponse) {
    for (let i = 0; i < 5; i++) {
      if (myResponse.answers[i] === partnerResponse.answers[i]) {
        matchesCount++;
      }
    }
    harmonyScore = Math.round((matchesCount / 5) * 100);
  }

  if (loading) {
    return <LoadingScreen message="Cargando cuestionario del día..." />;
  }

  const currentQ = dailyQuiz.questions[currentStep];
  const isOptionSelected = selectedAnswers[currentStep] !== undefined;

  return (
    <div className="page" style={{ paddingBottom: '90px' }}>
      <div className="stack stack--lg">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>Cuestionario del Día</h2>
          <p className="text-secondary" style={{ marginTop: '8px', fontSize: 'var(--font-size-sm)', textTransform: 'capitalize', fontWeight: 500 }}>
            {formatDate(today, 'long')}
          </p>
        </div>

        {/* STATE 1: User hasn't answered yet */}
        {!myResponse && (
          <>
            {/* Theme Welcome Intro Card */}
            {!quizStarted ? (
              <div 
                className="glass-card text-center stack stack--md animate-fade-in" 
                style={{ 
                  padding: 'var(--space-2xl) var(--space-xl)',
                  background: 'linear-gradient(180deg, rgba(229, 197, 115, 0.05) 0%, rgba(22, 23, 32, 0.6) 100%)',
                  border: '1px solid rgba(229, 197, 115, 0.15)',
                  boxShadow: '0 10px 30px -10px rgba(229, 197, 115, 0.1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Glow behind heart */}
                <div style={{
                  position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
                  width: '100px', height: '100px', background: 'rgba(229, 197, 115, 0.15)',
                  filter: 'blur(30px)', borderRadius: '50%', pointerEvents: 'none'
                }}></div>

                <div className="row row--center" style={{ marginBottom: '12px', color: 'var(--color-accent)' }}>
                  <IconGoldHeart size={42} />
                </div>

                <h3 style={{ 
                  fontSize: '1.75rem', 
                  color: 'var(--color-accent-light)',
                  lineHeight: 1.2,
                  marginBottom: '8px'
                }}>
                  {dailyQuiz.theme}
                </h3>
                
                <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.6, padding: '0 10px' }}>
                  {dailyQuiz.subtitle}. Responde 5 preguntas breves para medir su sintonía de hoy con <strong>{partnerName}</strong>.
                </p>

                <div className="row row--center row--gap-xs" style={{ 
                  margin: '24px 0', 
                  fontSize: '12px', 
                  color: 'var(--color-text-tertiary)', 
                  fontWeight: 600,
                  background: 'rgba(0,0,0,0.2)',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex'
                }}>
                  <IconClock />
                  <span>Expira a medianoche (en {countdownStr})</span>
                </div>

                <button
                  className="btn row row--center row--gap-sm"
                  onClick={() => setQuizStarted(true)}
                  style={{ 
                    marginTop: '8px',
                    width: '100%',
                    padding: '16px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    background: 'var(--gradient-accent)',
                    color: '#111',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 20px rgba(229, 197, 115, 0.25)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <IconPlay />
                  <span>Comenzar Quiz</span>
                </button>
              </div>
            ) : (
              /* Step 1B: Interactive Step-by-Step Questions */
              <div key={currentStep} className="animate-slide-next">
                <div className="glass-card stack stack--lg" style={{ 
                  padding: 'var(--space-xl) var(--space-lg)',
                  position: 'relative',
                  background: 'linear-gradient(180deg, rgba(22, 23, 32, 0.85) 0%, rgba(22, 23, 32, 0.4) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  overflow: 'hidden'
                }}>
                  {/* Glowing orb background effect */}
                  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(229,197,115,0.1)', filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }} />

                  {/* Progress Header */}
                  <div className="row row--between row--center">
                    <div className="row row--gap-sm row--center">
                      {currentStep > 0 && (
                        <button onClick={handlePrevStep} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', padding: '4px', cursor: 'pointer', zIndex: 2 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                      )}
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--color-accent-light)' }}>
                        PREGUNTA {currentStep + 1}/5
                      </span>
                    </div>
                    <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 800, color: 'var(--color-text-tertiary)' }}>
                      {Math.round(((currentStep + 1) / 5) * 100)}%
                    </span>
                  </div>

                  {/* Progress bar line */}
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '-12px' }}>
                    <div style={{ height: '100%', width: `${((currentStep + 1) / 5) * 100}%`, background: 'var(--gradient-accent)', borderRadius: '2px', transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>

                  {/* Question Text */}
                  <h3 style={{ fontSize: '1.25rem', lineHeight: 1.4, margin: '8px 0', fontWeight: 700, zIndex: 2, position: 'relative' }}>
                    {currentQ.question}
                  </h3>

                  {/* Options Grid */}
                  <div className="stack stack--md" style={{ zIndex: 2, position: 'relative' }}>
                    {currentQ.options.map((optText, optIdx) => {
                      const isSelected = selectedAnswers[currentStep] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            handleSelectOption(optIdx);
                            // Auto advance after short delay
                            if (currentStep < 4) {
                              setTimeout(() => handleNextStep(), 400);
                            }
                          }}
                          style={{
                            position: 'relative',
                            textAlign: 'left',
                            padding: '16px 20px',
                            background: isSelected ? 'var(--gradient-accent-soft)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 'var(--radius-lg)',
                            color: isSelected ? 'var(--color-accent-light)' : 'var(--color-text-primary)',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.95rem',
                            lineHeight: 1.4,
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 20px rgba(229,197,115,0.15)' : 'none',
                            transform: isSelected ? 'scale(1.02)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            overflow: 'hidden',
                            outline: 'none'
                          }}
                        >
                          {isSelected && (
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--gradient-accent)' }} />
                          )}
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%',
                            background: isSelected ? 'var(--gradient-accent)' : 'rgba(255,255,255,0.05)',
                            color: isSelected ? '#111' : 'var(--color-text-secondary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', fontWeight: 800, flexShrink: 0
                          }}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span style={{ flex: 1 }}>{optText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit Button (Only on last step) */}
                  {currentStep === 4 && (
                    <button
                      className="btn btn--primary btn--lg"
                      onClick={handleSubmitQuiz}
                      disabled={!isOptionSelected || submitting}
                      style={{ marginTop: '16px', width: '100%', boxShadow: '0 8px 25px rgba(229,197,115,0.25)', zIndex: 2, position: 'relative' }}
                    >
                      {submitting ? 'Guardando...' : '¡Terminar y Enviar!'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* STATE 2: User answered, Partner HAS NOT answered yet */}
        {myResponse && !partnerResponse && (
          <div className="glass-card glass-card--accent text-center stack stack--md animate-fade-in" style={{ padding: 'var(--space-xl) var(--space-lg)' }}>
            <div className="row row--center">
              <IconGoldHeart size={32} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)' }}>¡Tus respuestas están listas!</h3>
            <p className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
              Completaste el cuestionario de hoy. Apenas <strong>{partnerName}</strong> responda, podrán ver su % de sintonía.
            </p>

            <button
              className="btn btn--secondary btn--full"
              onClick={handleSendNudge}
              disabled={nudgeSent}
            >
              <IconBell />
              <span>{nudgeSent ? '¡Notificación enviada!' : `Recordarle a ${partnerName}`}</span>
            </button>
          </div>
        )}

        {/* STATE 3: BOTH answered -> Harmony Compatibility Match & Side-by-side Comparison */}
        {myResponse && partnerResponse && (
          <div className="stack stack--lg animate-fade-in" style={{ paddingBottom: '32px' }}>
            {/* Harmony Percentage Hero Card */}
            <div className="glass-card text-center" style={{ 
              padding: 'var(--space-xl) var(--space-md)',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(22, 23, 32, 0.8) 0%, rgba(22, 23, 32, 0.4) 100%)',
              border: '1px solid rgba(229,197,115,0.2)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(229,197,115,0.05)'
            }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(229,197,115,0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
              
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(229,197,115,0.1)', padding: '4px 12px', borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(229,197,115,0.2)', color: 'var(--color-accent)',
                fontSize: '10px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px'
              }}>
                <IconGoldHeart size={12} />
                Sintonía del Día
              </div>

              <div style={{ margin: '8px 0' }}>
                <span style={{ 
                  fontSize: '3.5rem', 
                  fontWeight: 900, 
                  background: 'var(--gradient-accent)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 0 15px rgba(229,197,115,0.3))'
                }}>
                  {harmonyScore}%
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-primary)', marginTop: '12px', padding: '0 8px', lineHeight: 1.4 }}>
                {matchesCount === 5 && '¡100% de sintonía total! Piensan exactamente igual hoy. ✨'}
                {matchesCount >= 3 && matchesCount < 5 && `Coincidieron en ${matchesCount} de las 5 preguntas. ¡Excelente complicidad! 💛`}
                {matchesCount < 3 && `Coincidieron en ${matchesCount} preguntas. ¡Ideal para conversar y conocerse más! 🗣️`}
              </p>
            </div>

            {/* Side-by-Side Comparison Feed */}
            <div className="stack stack--md">
              <div className="row row--center" style={{ marginBottom: '4px' }}>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))' }} />
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, color: 'var(--color-text-secondary)', padding: '0 12px' }}>
                  Comparación Lado a Lado
                </span>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(270deg, transparent, rgba(255,255,255,0.1))' }} />
              </div>

              {dailyQuiz.questions.map((q, idx) => {
                const myAnsIdx = myResponse.answers[idx];
                const partnerAnsIdx = partnerResponse.answers[idx];
                const isMatch = myAnsIdx === partnerAnsIdx;

                return (
                  <div
                    key={q.id}
                    className="glass-card stack stack--sm"
                    style={{
                      padding: 'var(--space-md)',
                      borderColor: isMatch ? 'var(--color-border-accent)' : 'var(--color-border)',
                      background: isMatch ? 'var(--gradient-accent-soft)' : 'var(--color-bg-card)',
                      boxShadow: isMatch ? '0 4px 20px rgba(229,197,115,0.1)' : 'none',
                    }}
                  >
                    <div className="row row--between" style={{ marginBottom: '2px' }}>
                      <span className="text-secondary" style={{ fontSize: '10px', fontWeight: 600 }}>
                        Pregunta {idx + 1}
                      </span>
                      {isMatch && (
                        <span className="row row--gap-xs" style={{ fontSize: '11px', color: 'var(--color-accent-light)', fontWeight: 700 }}>
                          <IconCheck />
                          <span>¡Coinciden!</span>
                        </span>
                      )}
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3, marginBottom: '8px' }}>
                      {q.question}
                    </div>

                    {/* Answers side-by-side */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{
                        padding: '8px',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div className="text-secondary" style={{ fontSize: '9px', fontWeight: 700, marginBottom: '2px' }}>{myName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: 1.25 }}>
                          {q.options[myAnsIdx]}
                        </div>
                      </div>

                      <div style={{
                        padding: '8px',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div className="text-secondary" style={{ fontSize: '9px', fontWeight: 700, marginBottom: '2px' }}>{partnerName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: 1.25 }}>
                          {q.options[partnerAnsIdx]}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
