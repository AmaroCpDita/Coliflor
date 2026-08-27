// ============================================================
// Coliflor — Clean Golden Relationship Calendar with Photos & Notes
// ============================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getCalendarDays, getMonthName, getTodayInTimezone, formatDate, getNowInTimezone } from '../lib/utils';
import type { CalendarEvent, EventCategory, StreakPhoto } from '../lib/types';

interface CategoryConfig {
  id: EventCategory;
  label: string;
  color: string;
}

interface DayPhotos {
  myPhotoUrl?: string;
  partnerPhotoUrl?: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'nos_vimos', label: 'Nos vimos', color: '#e5c573' },
  { id: 'cita', label: 'Cita / Salida', color: '#e07a7a' },
  { id: 'aniversario', label: 'Día especial', color: '#f472b6' },
  { id: 'viaje', label: 'Viaje / Escapada', color: '#38bdf8' },
  { id: 'nota', label: 'Nota / Recuerdo', color: '#34d399' },
];

const PLACEHOLDERS: Record<EventCategory, string> = {
  nos_vimos: 'ej: Tarde juntos en casa, regaloneo...',
  cita: 'ej: Fuimos por un café, cena romántica, cine...',
  aniversario: 'ej: Cumplimos meses, cena especial, regalos...',
  viaje: 'ej: Escapada a la playa, viaje de fin de semana...',
  nota: 'ej: Un detalle hermoso, cartita o recuerdo...',
};

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e5c573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function Calendar() {
  const { couple, profile, partner, isMockMode } = useAuth();
  const now = getNowInTimezone();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  
  // Events and photos maps for visible month
  const [eventsMap, setEventsMap] = useState<Map<string, CalendarEvent[]>>(new Map());
  const [photosMap, setPhotosMap] = useState<Map<string, DayPhotos>>(new Map());
  
  // Selected date modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayPhotos, setSelectedDayPhotos] = useState<DayPhotos | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state inside modal
  const [category, setCategory] = useState<EventCategory>('nos_vimos');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableMissing, setTableMissing] = useState(false);

  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const today = getTodayInTimezone();
  const calendarDays = getCalendarDays(year, month);
  const monthName = getMonthName(year, month);

  const partnerName = partner ? partner.display_name : 'Tu pareja';
  const myName = profile?.display_name || 'Tú';

  const fetchEventsAndPhotos = useCallback(async () => {
    if (!couple || !profile) return;

    if (isMockMode) {
      const mockEvts: CalendarEvent[] = [
        { id: 'e1', couple_id: 'mock', event_date: `${year}-${String(month).padStart(2, '0')}-03`, category: 'nos_vimos', title: 'Nos vimos', note: 'Regaloneo en casa', created_by: profile.id, created_at: `${year}-${String(month).padStart(2, '0')}-03T18:30:00Z` },
        { id: 'e2', couple_id: 'mock', event_date: `${year}-${String(month).padStart(2, '0')}-07`, category: 'cita', title: 'Noche de cine', note: 'Vimos la película nueva', created_by: 'partner', created_at: `${year}-${String(month).padStart(2, '0')}-07T20:15:00Z` },
        { id: 'e3', couple_id: 'mock', event_date: `${year}-${String(month).padStart(2, '0')}-12`, category: 'aniversario', title: 'Cumple mes', note: 'Cena romántica', created_by: profile.id, created_at: `${year}-${String(month).padStart(2, '0')}-12T19:00:00Z` },
        { id: 'e6', couple_id: 'mock', event_date: today, category: 'nos_vimos', title: 'Nos vimos hoy', note: 'Noche de películas', created_by: profile.id, created_at: new Date().toISOString() },
      ];

      const map = new Map<string, CalendarEvent[]>();
      mockEvts.forEach(evt => {
        const list = map.get(evt.event_date) || [];
        list.push(evt);
        map.set(evt.event_date, list);
      });
      setEventsMap(map);

      // Mock photos
      const pMap = new Map<string, DayPhotos>();
      pMap.set(today, {
        myPhotoUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
        partnerPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      });
      setPhotosMap(pMap);
      return;
    }

    setLoading(true);
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    try {
      const [{ data: eventsData, error: mErr }, { data: photosData }] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('*')
          .eq('couple_id', couple.id)
          .gte('event_date', firstDay)
          .lte('event_date', lastDay),
        supabase
          .from('streak_photos')
          .select('*')
          .eq('couple_id', couple.id)
          .gte('photo_date', firstDay)
          .lte('photo_date', lastDay),
      ]);

      if (mErr && mErr.message.includes('calendar_events')) {
        setTableMissing(true);
      } else {
        setTableMissing(false);
      }

      if (eventsData) {
        const map = new Map<string, CalendarEvent[]>();
        eventsData.forEach((evt: CalendarEvent) => {
          const list = map.get(evt.event_date) || [];
          list.push(evt);
          map.set(evt.event_date, list);
        });
        setEventsMap(map);
      }

      if (photosData) {
        const pMap = new Map<string, DayPhotos>();
        for (const p of photosData as StreakPhoto[]) {
          const existing = pMap.get(p.photo_date) || {};
          const { data } = await supabase.storage.from('photos').createSignedUrl(p.storage_path, 3600);
          if (p.user_id === profile.id) {
            existing.myPhotoUrl = data?.signedUrl || undefined;
          } else {
            existing.partnerPhotoUrl = data?.signedUrl || undefined;
          }
          pMap.set(p.photo_date, existing);
        }
        setPhotosMap(pMap);
      }
    } catch {
      setTableMissing(true);
    } finally {
      setLoading(false);
    }
  }, [couple?.id, profile?.id, year, month, isMockMode, today]);

  useEffect(() => {
    fetchEventsAndPhotos();
  }, [fetchEventsAndPhotos]);

  // Realtime updates
  useEffect(() => {
    if (!couple || isMockMode || tableMissing) return;

    const channel = supabase
      .channel('calendar-realtime-all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'calendar_events', filter: `couple_id=eq.${couple.id}` },
        () => fetchEventsAndPhotos()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'streak_photos', filter: `couple_id=eq.${couple.id}` },
        () => fetchEventsAndPhotos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, fetchEventsAndPhotos, isMockMode, tableMissing]);

  const handlePrevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedDayPhotos(photosMap.get(dateStr) || null);
    setTitle('');
    setNote('');
    setCategory('nos_vimos');
    setError('');
    
    const existingEvents = eventsMap.get(dateStr) || [];
    setShowAddForm(existingEvents.length === 0);
    setShowModal(true);

    if (existingEvents.length === 0) {
      setTimeout(() => noteInputRef.current?.focus(), 150);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !couple || !profile || saving) return;
    setSaving(true);
    setError('');

    const catConfig = CATEGORIES.find(c => c.id === category);
    const isFuture = selectedDate > today;
    const defaultTitle = category === 'nos_vimos'
      ? (isFuture ? 'Nos veremos' : 'Nos vimos')
      : catConfig?.label;
    const eventTitle = title.trim() || defaultTitle;
    const eventNote = note.trim() || undefined;

    if (isMockMode || tableMissing) {
      const newEvt: CalendarEvent = {
        id: 'evt-' + Date.now(),
        couple_id: couple.id || 'local',
        event_date: selectedDate,
        category,
        title: eventTitle,
        note: eventNote,
        created_by: profile.id,
        created_at: new Date().toISOString(),
      };

      setEventsMap(prev => {
        const map = new Map(prev);
        const list = map.get(selectedDate) || [];
        map.set(selectedDate, [...list, newEvt]);
        return map;
      });

      setTitle('');
      setNote('');
      setSaving(false);
      setShowAddForm(false);
      return;
    }

    try {
      const { error: insErr } = await supabase
        .from('calendar_events')
        .insert({
          couple_id: couple.id,
          event_date: selectedDate,
          category,
          title: eventTitle,
          note: eventNote || null,
          created_by: profile.id,
        });

      if (insErr) {
        if (insErr.message.includes('calendar_events')) {
          setTableMissing(true);
          const newEvt: CalendarEvent = {
            id: 'evt-' + Date.now(),
            couple_id: couple.id,
            event_date: selectedDate,
            category,
            title: eventTitle,
            note: eventNote,
            created_by: profile.id,
            created_at: new Date().toISOString(),
          };
          setEventsMap(prev => {
            const map = new Map(prev);
            const list = map.get(selectedDate) || [];
            map.set(selectedDate, [...list, newEvt]);
            return map;
          });
        } else {
          throw insErr;
        }
      }

      // Send push notification message to partner
      try {
        const myName = profile.display_name || 'Tú';
        const dateParts = selectedDate.split('-');
        const dayNum = parseInt(dateParts[2] || '1', 10);
        const monthNum = parseInt(dateParts[1] || '1', 10);
        const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const formattedDate = `${dayNum} ${monthNames[monthNum - 1] || ''}`;

        await supabase.from('messages').insert({
          couple_id: couple.id,
          sender_id: profile.id,
          content: `📅 ¡${myName} agregó un evento al calendario (${formattedDate}): "${eventTitle}"!`,
        });
      } catch {
        // Non-fatal fallback
      }

      setTitle('');
      setNote('');
      setShowAddForm(false);
      await fetchEventsAndPhotos();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el evento');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!couple || saving) return;
    setSaving(true);

    if (isMockMode || tableMissing) {
      setEventsMap(prev => {
        const map = new Map(prev);
        if (selectedDate) {
          const list = (map.get(selectedDate) || []).filter(e => e.id !== eventId);
          if (list.length > 0) map.set(selectedDate, list);
          else map.delete(selectedDate);
        }
        return map;
      });
      setSaving(false);
      return;
    }

    try {
      const { error: delErr } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (delErr) throw delErr;
      await fetchEventsAndPhotos();
    } catch (err: any) {
      console.error('Error deleting event:', err);
    } finally {
      setSaving(false);
    }
  };

  const getAuthorName = (userId: string) => {
    if (userId === profile?.id) return profile?.display_name || 'Tú';
    return partner?.display_name || 'Tu pareja';
  };

  const selectedDateEvents = selectedDate ? eventsMap.get(selectedDate) || [] : [];

  return (
    <div className="page">
      <div className="stack stack--lg">
        {/* Header */}
        <div>
          <h2>Calendario</h2>
          <p className="text-secondary" style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-sm)' }}>
            Nuestros días, fotos y momentos
          </p>
        </div>

        {/* Calendar Grid Card */}
        <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
          {/* Month Switcher Header */}
          <div className="calendar__header">
            <button className="calendar__nav-btn" onClick={handlePrevMonth}>‹</button>
            <span className="calendar__month">{monthName}</span>
            <button className="calendar__nav-btn" onClick={handleNextMonth}>›</button>
          </div>

          {/* Weekday Labels */}
          <div className="calendar__weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="calendar__weekday">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar__days">
            {calendarDays.map((dayObj, i) => {
              const dateStr = dayObj.date;
              const isToday = dateStr === today;
              const dayEvents = eventsMap.get(dateStr) || [];
              const dayPhotos = photosMap.get(dateStr);
              const hasPhotos = Boolean(dayPhotos?.myPhotoUrl || dayPhotos?.partnerPhotoUrl);
              
              // Get primary category for day background tinting
              const primaryCategory = dayEvents[0]?.category;
              const catConf = primaryCategory ? CATEGORIES.find(c => c.id === primaryCategory) : null;

              return (
                <button
                  key={i}
                  className={[
                    'calendar__day',
                    !dayObj.isCurrentMonth && 'calendar__day--other-month',
                    isToday && 'calendar__day--today',
                  ].filter(Boolean).join(' ')}
                  style={{
                    backgroundColor: catConf ? `${catConf.color}22` : undefined,
                    borderColor: isToday ? 'var(--color-accent)' : catConf ? `${catConf.color}66` : undefined,
                  }}
                  onClick={() => handleDayClick(dateStr)}
                  disabled={loading}
                >
                  <span style={{ fontWeight: catConf ? 700 : 500, color: catConf ? catConf.color : undefined }}>
                    {dayObj.day}
                  </span>

                  {/* Non-invasive indicator dots */}
                  <div style={{
                    position: 'absolute',
                    bottom: '3px',
                    display: 'flex',
                    gap: '2px',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {hasPhotos && (
                      <span
                        title="Foto guardada"
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-accent-light)',
                          boxShadow: '0 0 4px var(--color-accent-light)',
                        }}
                      />
                    )}
                    {dayEvents.length > 0 && dayEvents.slice(0, 2).map((evt, idx) => {
                      const eventCatConf = CATEGORIES.find(c => c.id === evt.category);
                      return (
                        <span
                          key={idx}
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: eventCatConf?.color || '#e5c573',
                          }}
                        />
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Simbología / Legend Card */}
        <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
          <div className="text-secondary" style={{
            fontSize: 'var(--font-size-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 700,
            marginBottom: 'var(--space-sm)',
          }}>
            Simbología
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-xs) var(--space-md)',
          }}>
            {CATEGORIES.map(cat => (
              <div key={cat.id} className="row row--gap-xs" style={{ padding: '4px 0' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: cat.color,
                  boxShadow: `0 0 6px ${cat.color}66`,
                }} />
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  {cat.label}
                </span>
              </div>
            ))}
            <div className="row row--gap-xs" style={{ padding: '4px 0' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-accent-light)',
                boxShadow: '0 0 6px var(--color-accent-light)',
              }} />
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Foto de racha guardada
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Day Click Modal (Shows Day Photos + Notes) */}
      {showModal && selectedDate && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="modal__handle" />
            <div className="stack stack--lg">
              <div className="text-center">
                <h3 style={{ textTransform: 'capitalize' }}>
                  {formatDate(selectedDate, 'long')}
                </h3>
              </div>

              {/* List of existing events/notes for this selected date */}
              {selectedDateEvents.length > 0 && (
                <div className="stack stack--sm">
                  {selectedDateEvents.map((evt) => {
                    const eventCatConf = CATEGORIES.find(c => c.id === evt.category);
                    return (
                      <div
                        key={evt.id}
                        className="glass-card"
                        style={{
                          padding: 'var(--space-md)',
                          borderLeft: `4px solid ${eventCatConf?.color || '#e5c573'}`,
                          background: 'var(--color-bg-secondary)',
                        }}
                      >
                        <div className="row row--between">
                          <div className="row row--gap-xs">
                            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: eventCatConf?.color }}>
                              {evt.title || eventCatConf?.label}
                            </span>
                          </div>
                          <button
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleDeleteEvent(evt.id)}
                            title="Eliminar evento"
                            disabled={saving}
                          >
                            <IconTrash />
                          </button>
                        </div>

                        {evt.note && (
                          <div style={{
                            margin: 'var(--space-sm) 0',
                            padding: 'var(--space-sm) var(--space-md)',
                            background: 'rgba(0,0,0,0.25)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                          }}>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                              "{evt.note}"
                            </p>
                          </div>
                        )}

                        <div className="row row--between text-secondary" style={{ fontSize: '11px', marginTop: 'var(--space-xs)', opacity: 0.8 }}>
                          <span>Registrado por <strong>{getAuthorName(evt.created_by)}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Photos of the Day Section (Placed below notes/events) */}
              {selectedDayPhotos && (selectedDayPhotos.myPhotoUrl || selectedDayPhotos.partnerPhotoUrl) ? (
                <div className="glass-card stack stack--sm" style={{ padding: 'var(--space-md)', background: 'var(--color-bg-secondary)' }}>
                  <div className="row row--gap-xs" style={{ marginBottom: 'var(--space-xs)' }}>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-xs)', color: 'var(--color-accent-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Fotografías de Racha del Día
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div>
                      <div className="text-secondary text-center" style={{ fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                        {myName}
                      </div>
                      {selectedDayPhotos.myPhotoUrl ? (
                        <div className="stack stack--xs">
                          <img src={selectedDayPhotos.myPhotoUrl} alt="Foto" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                          <a
                            href={selectedDayPhotos.myPhotoUrl}
                            download={`coliflor-${selectedDate}-${myName}.jpg`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn--secondary btn--sm btn--full"
                            style={{ fontSize: '10px', padding: '4px' }}
                          >
                            Guardar foto
                          </a>
                        </div>
                      ) : (
                        <div className="photo-card__placeholder" style={{ aspectRatio: '3/4', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', fontSize: '11px' }}>
                          Sin foto
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-secondary text-center" style={{ fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}>
                        {partnerName}
                      </div>
                      {selectedDayPhotos.partnerPhotoUrl ? (
                        <div className="stack stack--xs">
                          <img src={selectedDayPhotos.partnerPhotoUrl} alt="Foto" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                          <a
                            href={selectedDayPhotos.partnerPhotoUrl}
                            download={`coliflor-${selectedDate}-${partnerName}.jpg`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn--secondary btn--sm btn--full"
                            style={{ fontSize: '10px', padding: '4px' }}
                          >
                            Guardar foto
                          </a>
                        </div>
                      ) : (
                        <div className="photo-card__placeholder" style={{ aspectRatio: '3/4', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', fontSize: '11px' }}>
                          Sin foto
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Add Note Button if events already exist */}
              {selectedDateEvents.length > 0 && !showAddForm && (
                <button
                  className="btn btn--secondary btn--full"
                  onClick={() => {
                    setShowAddForm(true);
                    setTimeout(() => noteInputRef.current?.focus(), 150);
                  }}
                >
                  <IconPlus />
                  <span>Añadir otra notita a este día</span>
                </button>
              )}

              {/* Form to add a new event or note */}
              {(selectedDateEvents.length === 0 || showAddForm) && (
                <form onSubmit={handleAddEvent} className="stack stack--md" style={{
                  borderTop: selectedDateEvents.length > 0 ? '1px solid var(--color-border)' : 'none',
                  paddingTop: selectedDateEvents.length > 0 ? 'var(--space-md)' : 0,
                }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Añadir recuerdo o notita
                  </div>

                  {/* Category selector pills */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => {
                      const isFuture = selectedDate > today;
                      let label = cat.label;
                      if (cat.id === 'nos_vimos' && isFuture) {
                        label = 'Nos veremos';
                      }

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className="btn btn--sm"
                          onClick={() => setCategory(cat.id)}
                          style={{
                            background: category === cat.id ? `${cat.color}22` : 'var(--color-bg-secondary)',
                            borderColor: category === cat.id ? cat.color : 'var(--color-border)',
                            color: category === cat.id ? cat.color : 'var(--color-text-secondary)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: category === cat.id ? 700 : 500,
                          }}
                        >
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Note textarea with dynamic placeholder per category */}
                  <div className="input-group">
                    <label htmlFor="calendarNoteInput">Notita o detalle del día</label>
                    <textarea
                      id="calendarNoteInput"
                      ref={noteInputRef}
                      className="input"
                      rows={3}
                      placeholder={PLACEHOLDERS[category]}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      style={{ resize: 'none' }}
                    />
                  </div>

                  {error && (
                    <div className="toast toast--error" style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn--primary btn--full"
                    disabled={saving}
                  >
                    <IconPlus />
                    <span>{saving ? 'Guardando...' : 'Guardar recuerdo para siempre'}</span>
                  </button>
                </form>
              )}

              <button className="btn btn--secondary btn--full" onClick={() => setShowModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
