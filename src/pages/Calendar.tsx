import PageTransition from '../components/PageTransition';
// ============================================================
// Coliflor — Clean Golden Relationship Calendar with Photos & Notes
// ============================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  getCalendarDays,
  getMonthName,
  getTodayInTimezone,
  formatDate,
  getNowInTimezone,
} from '../lib/utils';
import type { CalendarEvent, EventCategory, StreakPhoto } from '../lib/types';
import Lightbox from '../components/Lightbox';
import { CHILEAN_HOLIDAYS } from '../lib/celebrations';

interface CategoryConfig {
  id: EventCategory;
  label: string;
  color: string;
  points: number;
}

interface DayPhotos {
  myPhotoUrl?: string;
  partnerPhotoUrl?: string;
  hasPhoto?: boolean;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'nos_vimos', label: 'Nos vimos', color: '#F59E0B', points: 70 }, // Vibrant Amber
  { id: 'cita', label: 'Cita / Salida', color: '#EF4444', points: 100 }, // Vibrant Red
  { id: 'aniversario', label: 'Día especial', color: '#8B5CF6', points: 150 }, // Vibrant Purple
  { id: 'viaje', label: 'Viaje / Escapada', color: '#3B82F6', points: 150 }, // Vibrant Blue
  { id: 'nota', label: 'Nota / Recuerdo', color: '#10B981', points: 0 }, // Vibrant Green
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
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f87171"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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
  const [eventsMap, setEventsMap] = useState<Map<string, CalendarEvent[]>>(() => new Map());
  const [photosMap, setPhotosMap] = useState<Map<string, DayPhotos>>(() => new Map());

  // Selected date modal state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [lightboxData, setLightboxData] = useState<{ url: string; name: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [swipeDir, setSwipeDir] = useState<'next' | 'prev' | null>(null);

  // Form state inside modal
  const [category, setCategory] = useState<EventCategory>('nos_vimos');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tableMissing, setTableMissing] = useState(false);

  // Edit state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editCategory, setEditCategory] = useState<EventCategory>('nos_vimos');

  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const fetchIdRef = useRef(0);
  const calendarScopeRef = useRef('');
  const today = getTodayInTimezone();
  const calendarDays = getCalendarDays(year, month);
  const monthName = getMonthName(year, month);
  const selectedDayPhotos = selectedDate ? photosMap.get(selectedDate) || null : null;

  useEffect(() => {
    // Remove the former unscoped cache, which included expiring private photo URLs.
    try {
      localStorage.removeItem('calendar_cache_events');
      localStorage.removeItem('calendar_cache_photos');
    } catch {
      // The calendar still works when browser storage is unavailable.
    }
  }, []);

  const partnerName = partner ? partner.display_name : 'Tu pareja';
  const myName = profile?.display_name || 'Tú';

  const fetchEventsAndPhotos = useCallback(async () => {
    if (!couple || !profile) return;
    const fetchId = ++fetchIdRef.current;
    const scope = `${couple.id}:${year}:${month}:${profile.id}`;
    if (calendarScopeRef.current !== scope) {
      calendarScopeRef.current = scope;
      setEventsMap(new Map());
      setPhotosMap(new Map());
    }

    if (isMockMode) {
      const mockEvts: CalendarEvent[] = [
        {
          id: 'e1',
          couple_id: 'mock',
          event_date: `${year}-${String(month).padStart(2, '0')}-03`,
          category: 'nos_vimos',
          title: 'Nos vimos',
          note: 'Regaloneo en casa',
          created_by: profile.id,
          created_at: `${year}-${String(month).padStart(2, '0')}-03T18:30:00Z`,
        },
        {
          id: 'e2',
          couple_id: 'mock',
          event_date: `${year}-${String(month).padStart(2, '0')}-07`,
          category: 'cita',
          title: 'Noche de cine',
          note: 'Vimos la película nueva',
          created_by: 'partner',
          created_at: `${year}-${String(month).padStart(2, '0')}-07T20:15:00Z`,
        },
        {
          id: 'e3',
          couple_id: 'mock',
          event_date: `${year}-${String(month).padStart(2, '0')}-12`,
          category: 'aniversario',
          title: 'Cumple mes',
          note: 'Cena romántica',
          created_by: profile.id,
          created_at: `${year}-${String(month).padStart(2, '0')}-12T19:00:00Z`,
        },
        {
          id: 'e6',
          couple_id: 'mock',
          event_date: today,
          category: 'nos_vimos',
          title: 'Nos vimos hoy',
          note: 'Noche de películas',
          created_by: profile.id,
          created_at: new Date().toISOString(),
        },
      ];

      const map = new Map<string, CalendarEvent[]>();
      mockEvts.forEach((evt) => {
        const list = map.get(evt.event_date) || [];
        list.push(evt);
        map.set(evt.event_date, list);
      });
      setEventsMap(map);

      // Mock photos
      const pMap = new Map<string, DayPhotos>();
      pMap.set(today, {
        myPhotoUrl:
          'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80',
        partnerPhotoUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      });
      setPhotosMap(pMap);
      return;
    }

    setLoading(true);
    // Use the actual visible date range from the calendar grid (includes overflow days)
    const visibleDays = getCalendarDays(year, month);
    const firstDay = visibleDays[0].date;
    const lastDay = visibleDays[visibleDays.length - 1].date;

    try {
      const [{ data: eventsData, error: mErr }, { data: photosData, error: photosError }] =
        await Promise.all([
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
      if (fetchId !== fetchIdRef.current) return;
      if (photosError) throw photosError;

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

        // 1. Inmediatamente marcar que hay fotos para mostrar la racha al instante
        for (const p of photosData as StreakPhoto[]) {
          const existing = pMap.get(p.photo_date) || {};
          existing.hasPhoto = true;
          pMap.set(p.photo_date, existing);
        }

        setPhotosMap(new Map(pMap));

        // 2. Cargar las URLs de las fotos en paralelo (asíncrono) para no bloquear la interfaz
        await Promise.all(
          (photosData as StreakPhoto[]).map(async (p) => {
            const existing = pMap.get(p.photo_date)!;
            try {
              const isRecovery = p.storage_path.includes('_recovery');
              let urlToUse: string | undefined = undefined;

              if (isRecovery) {
                urlToUse = 'recovery';
              } else {
                const { data } = await supabase.storage
                  .from('photos')
                  .createSignedUrl(p.storage_path, 3600);
                urlToUse = data?.signedUrl || undefined;
              }

              if (p.user_id === profile.id) {
                existing.myPhotoUrl = urlToUse;
              } else {
                existing.partnerPhotoUrl = urlToUse;
              }
            } catch (e) {
              console.error('Error fetching photo url', e);
            }
          }),
        );

        if (fetchId === fetchIdRef.current) setPhotosMap(new Map(pMap));
      }
    } catch {
      if (fetchId === fetchIdRef.current) setError('No se pudo cargar el calendario.');
    } finally {
      if (fetchId === fetchIdRef.current) setLoading(false);
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
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
          filter: `couple_id=eq.${couple.id}`,
        },
        () => fetchEventsAndPhotos(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'streak_photos',
          filter: `couple_id=eq.${couple.id}`,
        },
        () => fetchEventsAndPhotos(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [couple?.id, fetchEventsAndPhotos, isMockMode, tableMissing]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setTitle('');
    setNote('');
    setCategory('nos_vimos');
    setError('');
    setShowAddForm(false);
    setShowModal(true);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !couple || !profile || saving) return;
    setSaving(true);
    setError('');

    const catConfig = CATEGORIES.find((c) => c.id === category);
    const isFuture = selectedDate > today;
    const defaultTitle =
      category === 'nos_vimos' ? (isFuture ? 'Nos veremos' : 'Nos vimos') : catConfig?.label;
    const eventTitle = title.trim() || defaultTitle;
    const eventNote = note.trim() || undefined;

    if (isMockMode) {
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

      setEventsMap((prev) => {
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
      const { error: insErr } = await supabase.from('calendar_events').insert({
        couple_id: couple.id,
        event_date: selectedDate,
        category,
        title: eventTitle,
        note: eventNote || null,
        created_by: profile.id,
      });

      if (insErr) {
        console.warn('Calendar event insert warning:', insErr);
      }

      // Send push notification message to partner
      try {
        const myName = profile.display_name || 'Tú';
        const dateParts = selectedDate.split('-');
        const dayNum = parseInt(dateParts[2] || '1', 10);
        const monthNum = parseInt(dateParts[1] || '1', 10);
        const monthNames = [
          'ene',
          'feb',
          'mar',
          'abr',
          'may',
          'jun',
          'jul',
          'ago',
          'sep',
          'oct',
          'nov',
          'dic',
        ];
        const formattedDate = `${dayNum} ${monthNames[monthNum - 1] || ''}`;

        await supabase.from('messages').insert({
          couple_id: couple.id,
          sender_id: profile.id,
          content: `📅 ¡${myName} agregó un evento al calendario (${formattedDate}): "${eventTitle}"!`,
        });
      } catch (notifErr) {
        console.warn('Calendar notification send warning:', notifErr);
      }

      setTitle('');
      setNote('');
      setShowAddForm(false);
      await fetchEventsAndPhotos();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar evento');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!couple || saving) return;

    if (!window.confirm('¿Estás seguro de que deseas eliminar este recuerdo?')) {
      return;
    }

    setSaving(true);

    if (isMockMode || tableMissing) {
      setEventsMap((prev) => {
        const map = new Map(prev);
        if (selectedDate) {
          const list = (map.get(selectedDate) || []).filter((e) => e.id !== eventId);
          if (list.length > 0) map.set(selectedDate, list);
          else map.delete(selectedDate);
        }
        return map;
      });
      setSaving(false);
      return;
    }

    try {
      const { error: delErr } = await supabase.from('calendar_events').delete().eq('id', eventId);

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

  const startEditEvent = (evt: CalendarEvent) => {
    setEditingEventId(evt.id);
    setEditTitle(evt.title || '');
    setEditNote(evt.note || '');
    setEditCategory(evt.category);
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setEditTitle('');
    setEditNote('');
  };

  const handleUpdateEvent = async (eventId: string) => {
    if (!couple || saving) return;
    setSaving(true);
    setError('');

    const catConfig = CATEGORIES.find((c) => c.id === editCategory);
    const updatedTitle = editTitle.trim() || catConfig?.label || '';
    const updatedNote = editNote.trim() || null;

    if (isMockMode || tableMissing) {
      setEventsMap((prev) => {
        const map = new Map(prev);
        if (selectedDate) {
          const list = (map.get(selectedDate) || []).map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  title: updatedTitle,
                  note: updatedNote || undefined,
                  category: editCategory,
                }
              : e,
          );
          map.set(selectedDate, list);
        }
        return map;
      });
      cancelEdit();
      setSaving(false);
      return;
    }

    try {
      const { error: updErr } = await supabase
        .from('calendar_events')
        .update({
          title: updatedTitle,
          note: updatedNote,
          category: editCategory,
        })
        .eq('id', eventId);

      if (updErr) throw updErr;
      cancelEdit();
      await fetchEventsAndPhotos();
    } catch (err: any) {
      setError(err?.message || 'Error al actualizar evento');
    } finally {
      setSaving(false);
    }
  };

  const handleModalTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleModalTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !selectedDate) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    if (Math.abs(deltaX) > 50) {
      const isPrev = deltaX > 0;
      setSwipeDir(isPrev ? 'prev' : 'next');
      const [y, m, d] = selectedDate.split('-').map(Number);
      const curr = new Date(y, m - 1, d);
      curr.setDate(curr.getDate() + (isPrev ? -1 : 1));
      const nextDateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}-${String(curr.getDate()).padStart(2, '0')}`;
      handleDayClick(nextDateStr);
    }
    setTouchStartX(null);
  };

  const selectedDateEvents = selectedDate ? eventsMap.get(selectedDate) || [] : [];

  return (
    <PageTransition className="page">
      <div className="stack stack--lg">
        {/* Header */}
        <div>
          <h2>Calendario</h2>
          <p
            className="text-secondary"
            style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-sm)' }}
          >
            Nuestros días, fotos y momentos
          </p>
        </div>

        {/* Calendar Grid Card */}
        <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
          {/* Month Switcher Header */}
          <div className="calendar__header">
            <button className="calendar__nav-btn" onClick={handlePrevMonth}>
              ‹
            </button>
            <span className="calendar__month">{monthName}</span>
            <button className="calendar__nav-btn" onClick={handleNextMonth}>
              ›
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="calendar__weekdays">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
              <div key={d} className="calendar__weekday">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar__days">
            {calendarDays.map((dayObj, i) => {
              const dateStr = dayObj.date;
              const isToday = dateStr === today;
              const dayEvents = eventsMap.get(dateStr) || [];
              const dayPhotos = photosMap.get(dateStr);
              const hasPhotos = Boolean(
                dayPhotos?.hasPhoto || dayPhotos?.myPhotoUrl || dayPhotos?.partnerPhotoUrl,
              );

              // Get primary category for day background tinting
              const primaryCategory = dayEvents[0]?.category;
              const catConf = primaryCategory
                ? CATEGORIES.find((c) => c.id === primaryCategory)
                : null;

              // Check if it's a general holiday
              const [yStr, mStr, dStr] = dateStr.split('-');
              const dayMonth = parseInt(mStr, 10);
              const dayDay = parseInt(dStr, 10);
              const holiday = CHILEAN_HOLIDAYS.find(
                (h) => h.month === dayMonth && h.day === dayDay,
              );

              const isAnniversaryMonth =
                couple?.relationship_start &&
                parseInt(couple.relationship_start.split('-')[1], 10) === dayMonth;
              const isAnniversaryDay =
                couple?.relationship_start &&
                parseInt(couple.relationship_start.split('-')[2], 10) === dayDay;
              const isAnniversary = isAnniversaryMonth && isAnniversaryDay;

              const isMyBirthdayMonth =
                profile?.birthday && parseInt(profile.birthday.split('-')[1], 10) === dayMonth;
              const isMyBirthdayDay =
                profile?.birthday && parseInt(profile.birthday.split('-')[2], 10) === dayDay;
              const isMyBirthday = isMyBirthdayMonth && isMyBirthdayDay;

              const isPartnerBirthdayMonth =
                partner?.birthday && parseInt(partner.birthday.split('-')[1], 10) === dayMonth;
              const isPartnerBirthdayDay =
                partner?.birthday && parseInt(partner.birthday.split('-')[2], 10) === dayDay;
              const isPartnerBirthday = isPartnerBirthdayMonth && isPartnerBirthdayDay;

              let specialEmoji = holiday?.emoji;
              if (isAnniversary) specialEmoji = '💍';
              else if (isMyBirthday || isPartnerBirthday) specialEmoji = '🎂';

              return (
                <button
                  key={i}
                  className={[
                    'calendar__day',
                    !dayObj.isCurrentMonth && 'calendar__day--other-month',
                    isToday && 'calendar__day--today',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{
                    backgroundColor: catConf ? `${catConf.color}22` : undefined,
                    borderColor: isToday
                      ? 'var(--color-accent)'
                      : catConf
                        ? `${catConf.color}66`
                        : undefined,
                    animation: `fadeIn 0.4s ease-out forwards`,
                    animationDelay: `${i * 0.015}s`,
                    opacity: 0,
                  }}
                  onClick={() => handleDayClick(dateStr)}
                  disabled={loading}
                >
                  <span
                    style={{
                      fontWeight: catConf ? 700 : 500,
                      color: catConf ? catConf.color : undefined,
                    }}
                  >
                    {dayObj.day}
                  </span>

                  {/* Holiday Emoji Indicator */}
                  {specialEmoji && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        fontSize: '14px',
                        lineHeight: '1',
                        opacity: 0.95,
                        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.4))',
                      }}
                    >
                      {specialEmoji}
                    </span>
                  )}

                  {/* Top indicator dots (Notes/Events) */}
                  {dayEvents.length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        display: 'flex',
                        gap: '2px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                      }}
                    >
                      {Array.from(new Set(dayEvents.map((e) => e.category)))
                        .slice(0, 3)
                        .map((category, idx) => {
                          const eventCatConf = CATEGORIES.find((c) => c.id === category);
                          return (
                            <span
                              key={idx}
                              style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                backgroundColor: eventCatConf?.color || '#c9956c',
                              }}
                            />
                          );
                        })}
                    </div>
                  )}

                  {/* Bottom-right corner indicator (Streak photo) */}
                  {hasPhotos && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 0,
                        height: 0,
                        borderBottom: '8px solid var(--color-accent-light)',
                        borderLeft: '8px solid transparent',
                        opacity: 0.5,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Simbología / Legend Card */}
        <div className="glass-card" style={{ padding: 'var(--space-md)' }}>
          <div
            className="text-secondary"
            style={{
              fontSize: 'var(--font-size-xs)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 700,
              marginBottom: 'var(--space-sm)',
            }}
          >
            Simbología
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-xs) var(--space-md)',
            }}
          >
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="row row--gap-xs" style={{ padding: '4px 0' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: cat.color,
                    boxShadow: `0 0 6px ${cat.color}66`,
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                    marginTop: 5,
                  }}
                />
                <div className="calendar-legend__text">
                  <span>{cat.label}</span>
                  <small>{cat.points}pts.</small>
                </div>
              </div>
            ))}
            <div className="row row--gap-xs" style={{ padding: '4px 0' }}>
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderBottom: '6px solid var(--color-accent-light)',
                  borderLeft: '6px solid transparent',
                  opacity: 0.5,
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                  marginTop: 5,
                }}
              />
              <div className="calendar-legend__text">
                <span>Racha</span>
                <small>15pts.</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Day Click Modal (Shows Day Photos + Notes) */}
      {showModal && selectedDate && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setShowModal(false);
            setSwipeDir(null);
          }}
        >
          <div
            className="modal animate-scale-in"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleModalTouchStart}
            onTouchEnd={handleModalTouchEnd}
            style={{
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div className="modal__handle" />

            {/* Sticky header with close button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0 var(--space-md) 0',
                borderBottom: '1px solid var(--color-border)',
                marginBottom: 'var(--space-md)',
                flexShrink: 0,
              }}
            >
              <div>
                <h3
                  style={{
                    textTransform: 'capitalize',
                    margin: 0,
                    fontSize: 'var(--font-size-base)',
                  }}
                >
                  {formatDate(selectedDate, 'long')}
                </h3>
                {(() => {
                  const [yStr, mStr, dStr] = selectedDate.split('-');
                  const sm = parseInt(mStr, 10);
                  const sd = parseInt(dStr, 10);
                  const isAnn =
                    couple?.relationship_start &&
                    parseInt(couple.relationship_start.split('-')[1], 10) === sm &&
                    parseInt(couple.relationship_start.split('-')[2], 10) === sd;
                  const isMyB =
                    profile?.birthday &&
                    parseInt(profile.birthday.split('-')[1], 10) === sm &&
                    parseInt(profile.birthday.split('-')[2], 10) === sd;
                  const isPB =
                    partner?.birthday &&
                    parseInt(partner.birthday.split('-')[1], 10) === sm &&
                    parseInt(partner.birthday.split('-')[2], 10) === sd;
                  const h = CHILEAN_HOLIDAYS.find((h) => h.month === sm && h.day === sd);

                  if (isAnn)
                    return (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-accent)',
                          fontWeight: 700,
                          marginTop: '2px',
                        }}
                      >
                        💍 Nuestro Aniversario
                      </div>
                    );
                  if (isMyB)
                    return (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-accent)',
                          fontWeight: 700,
                          marginTop: '2px',
                        }}
                      >
                        🎂 Tu Cumpleaños
                      </div>
                    );
                  if (isPB)
                    return (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-accent)',
                          fontWeight: 700,
                          marginTop: '2px',
                        }}
                      >
                        🎂 Cumpleaños de {partnerName}
                      </div>
                    );
                  if (h)
                    return (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--color-text-secondary)',
                          fontWeight: 600,
                          marginTop: '2px',
                        }}
                      >
                        {h.emoji} {h.title}
                      </div>
                    );
                  return null;
                })()}
              </div>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0',
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-full)',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  flexShrink: 0,
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Scrollable content area */}
            <div
              key={selectedDate}
              className={swipeDir ? `animate-slide-${swipeDir}` : 'animate-fade-in'}
              style={{
                overflowY: 'auto',
                flex: 1,
                paddingBottom: 'var(--space-md)',
                overflowX: 'hidden',
              }}
            >
              <div className="stack stack--lg">
                {/* List of existing events/notes for this selected date */}
                {selectedDateEvents.length > 0 && (
                  <div className="stack stack--sm">
                    {selectedDateEvents.map((evt) => {
                      const eventCatConf = CATEGORIES.find((c) => c.id === evt.category);
                      const isEditing = editingEventId === evt.id;

                      if (isEditing) {
                        // Inline edit form
                        const editCatConf = CATEGORIES.find((c) => c.id === editCategory);
                        return (
                          <div
                            key={evt.id}
                            className="glass-card"
                            style={{
                              padding: 'var(--space-md)',
                              borderLeft: `4px solid ${editCatConf?.color || '#c9956c'}`,
                              background: 'var(--color-bg-secondary)',
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 'var(--font-size-xs)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 'var(--space-sm)',
                              }}
                            >
                              Editar recuerdo
                            </div>

                            {/* Category pills */}
                            <div
                              style={{
                                display: 'flex',
                                gap: '6px',
                                flexWrap: 'wrap',
                                marginBottom: 'var(--space-sm)',
                              }}
                            >
                              {CATEGORIES.map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  className="btn btn--sm"
                                  onClick={() => setEditCategory(cat.id)}
                                  style={{
                                    background:
                                      editCategory === cat.id
                                        ? `${cat.color}22`
                                        : 'var(--color-bg-secondary)',
                                    borderColor:
                                      editCategory === cat.id ? cat.color : 'var(--color-border)',
                                    color:
                                      editCategory === cat.id
                                        ? cat.color
                                        : 'var(--color-text-secondary)',
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: editCategory === cat.id ? 700 : 500,
                                  }}
                                >
                                  {cat.label}
                                </button>
                              ))}
                            </div>

                            {/* Note textarea */}
                            <div
                              className="input-group"
                              style={{ marginBottom: 'var(--space-sm)' }}
                            >
                              <label
                                htmlFor={`editNote-${evt.id}`}
                                style={{ fontSize: 'var(--font-size-xs)' }}
                              >
                                Notita
                              </label>
                              <textarea
                                id={`editNote-${evt.id}`}
                                className="input"
                                rows={2}
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder={PLACEHOLDERS[editCategory]}
                                style={{ resize: 'none' }}
                              />
                            </div>

                            <div className="row row--gap-sm">
                              <button
                                type="button"
                                className="btn btn--primary btn--sm"
                                onClick={() => handleUpdateEvent(evt.id)}
                                disabled={saving}
                                style={{ flex: 1 }}
                              >
                                {saving ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                onClick={cancelEdit}
                                style={{ flexShrink: 0 }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // Normal display
                      return (
                        <div
                          key={evt.id}
                          className="glass-card"
                          style={{
                            padding: 'var(--space-md)',
                            borderLeft: `4px solid ${eventCatConf?.color || '#c9956c'}`,
                            background: 'var(--color-bg-secondary)',
                          }}
                        >
                          <div className="row row--between">
                            <div className="row row--gap-xs">
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: 'var(--font-size-sm)',
                                  color: eventCatConf?.color,
                                }}
                              >
                                {evt.title || eventCatConf?.label}
                              </span>
                            </div>
                            <div className="row row--gap-xs">
                              <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => startEditEvent(evt)}
                                title="Editar evento"
                                disabled={saving}
                                style={{ color: 'var(--color-text-secondary)' }}
                              >
                                <IconEdit />
                              </button>
                              <button
                                className="btn btn--ghost btn--sm"
                                onClick={() => handleDeleteEvent(evt.id)}
                                title="Eliminar evento"
                                disabled={saving}
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </div>

                          {evt.note && (
                            <div
                              style={{
                                margin: 'var(--space-sm) 0',
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'rgba(0,0,0,0.25)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 'var(--font-size-sm)',
                                  color: 'var(--color-text-primary)',
                                  fontStyle: 'italic',
                                  lineHeight: 1.4,
                                }}
                              >
                                "{evt.note}"
                              </p>
                            </div>
                          )}

                          <div
                            className="row row--between text-secondary"
                            style={{ fontSize: '11px', marginTop: 'var(--space-xs)', opacity: 0.8 }}
                          >
                            <span>
                              Registrado por <strong>{getAuthorName(evt.created_by)}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Photos of the Day Section */}
                {selectedDayPhotos &&
                (selectedDayPhotos.myPhotoUrl || selectedDayPhotos.partnerPhotoUrl) ? (
                  <div
                    className="glass-card stack stack--sm"
                    style={{ padding: 'var(--space-md)', background: 'var(--color-bg-secondary)' }}
                  >
                    <div className="row row--gap-xs" style={{ marginBottom: 'var(--space-xs)' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-accent-light)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Fotografías de Racha del Día
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 'var(--space-md)',
                      }}
                    >
                      <div>
                        <div
                          className="text-secondary text-center"
                          style={{ fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}
                        >
                          {myName}
                        </div>
                        <div
                          className="photo-card"
                          style={{ padding: '4px 4px 24px 4px', transform: 'rotate(-2deg)' }}
                        >
                          {selectedDayPhotos.myPhotoUrl === 'recovery' ? (
                            <div
                              className="photo-card__placeholder"
                              style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--color-info)',
                                zIndex: 2,
                              }}
                            >
                              <span style={{ fontSize: '20px' }}>🛡️</span>
                              <span
                                style={{
                                  fontWeight: 700,
                                  padding: '0 4px',
                                  textAlign: 'center',
                                  fontSize: '10px',
                                  marginTop: '4px',
                                }}
                              >
                                Racha recuperada
                              </span>
                            </div>
                          ) : selectedDayPhotos.myPhotoUrl ? (
                            <>
                              <img
                                src={selectedDayPhotos.myPhotoUrl}
                                alt="Foto"
                                className="photo-card__image"
                                onClick={() =>
                                  setLightboxData({
                                    url: selectedDayPhotos.myPhotoUrl!,
                                    name: `coliflor-${selectedDate}-${myName}.jpg`,
                                  })
                                }
                                style={{ cursor: 'pointer', borderRadius: '4px' }}
                              />
                            </>
                          ) : (
                            <div className="photo-card__placeholder" style={{ zIndex: 2 }}>
                              <span style={{ opacity: 0.5, fontSize: '10px' }}>Sin foto</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          className="text-secondary text-center"
                          style={{ fontSize: '11px', marginBottom: '4px', fontWeight: 600 }}
                        >
                          {partnerName}
                        </div>
                        <div
                          className="photo-card"
                          style={{ padding: '4px 4px 24px 4px', transform: 'rotate(2deg)' }}
                        >
                          {selectedDayPhotos.partnerPhotoUrl === 'recovery' ? (
                            <div
                              className="photo-card__placeholder"
                              style={{
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--color-info)',
                                zIndex: 2,
                              }}
                            >
                              <span style={{ fontSize: '20px' }}>🛡️</span>
                              <span
                                style={{
                                  fontWeight: 700,
                                  padding: '0 4px',
                                  textAlign: 'center',
                                  fontSize: '10px',
                                  marginTop: '4px',
                                }}
                              >
                                Racha recuperada
                              </span>
                            </div>
                          ) : selectedDayPhotos.partnerPhotoUrl ? (
                            <>
                              <img
                                src={selectedDayPhotos.partnerPhotoUrl}
                                alt="Foto"
                                className="photo-card__image"
                                onClick={() =>
                                  setLightboxData({
                                    url: selectedDayPhotos.partnerPhotoUrl!,
                                    name: `coliflor-${selectedDate}-${partnerName}.jpg`,
                                  })
                                }
                                style={{ cursor: 'pointer', borderRadius: '4px' }}
                              />
                            </>
                          ) : (
                            <div className="photo-card__placeholder" style={{ zIndex: 2 }}>
                              <span style={{ opacity: 0.5, fontSize: '10px' }}>Sin foto</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Empty state when no events and no photos */}
                {selectedDateEvents.length === 0 &&
                  !showAddForm &&
                  !(
                    selectedDayPhotos &&
                    (selectedDayPhotos.myPhotoUrl || selectedDayPhotos.partnerPhotoUrl)
                  ) && (
                    <div
                      className="text-center text-secondary"
                      style={{ padding: 'var(--space-lg) 0', fontSize: 'var(--font-size-sm)' }}
                    >
                      No hay recuerdos para este día aún.
                    </div>
                  )}

                {/* Add Note/Memory Button — always visible, user must explicitly tap */}
                {!showAddForm && (
                  <button
                    className="btn btn--secondary btn--full"
                    onClick={() => {
                      setShowAddForm(true);
                      setTimeout(() => noteInputRef.current?.focus(), 150);
                    }}
                  >
                    <IconPlus />
                    <span>
                      {selectedDateEvents.length > 0
                        ? 'Añadir otra notita a este día'
                        : 'Añadir recuerdo o notita'}
                    </span>
                  </button>
                )}

                {/* Form to add a new event or note — only visible after explicit tap */}
                {showAddForm && (
                  <form
                    onSubmit={handleAddEvent}
                    className="stack stack--md"
                    style={{
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: 'var(--space-md)',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 'var(--font-size-xs)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Añadir recuerdo o notita
                    </div>

                    {/* Category selector pills */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {CATEGORIES.map((cat) => {
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
                              background:
                                category === cat.id
                                  ? `${cat.color}22`
                                  : 'var(--color-bg-secondary)',
                              borderColor: category === cat.id ? cat.color : 'var(--color-border)',
                              color:
                                category === cat.id ? cat.color : 'var(--color-text-secondary)',
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
                      <div
                        className="toast toast--error"
                        style={{ position: 'relative', top: 0, left: 0, transform: 'none' }}
                      >
                        {error}
                      </div>
                    )}

                    <div className="row row--gap-sm">
                      <button
                        type="submit"
                        className="btn btn--primary btn--full"
                        disabled={saving}
                      >
                        <IconPlus />
                        <span>{saving ? 'Guardando...' : 'Guardar recuerdo'}</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => {
                          setShowAddForm(false);
                          setNote('');
                          setTitle('');
                          setError('');
                        }}
                        style={{ flexShrink: 0 }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Lightbox
        url={lightboxData?.url || null}
        downloadName={lightboxData?.name}
        onClose={() => setLightboxData(null)}
      />
    </PageTransition>
  );
}
