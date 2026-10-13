import type { Message } from './types';
import { TIMEZONE } from './types';

const KINDS = [
  { prefix: '💌', label: 'Notita de amor', icon: '💌', category: 'love', route: '/' },
  { prefix: '📅', label: 'Calendario', icon: '📅', category: 'calendar', route: '/calendar' },
  { prefix: '📸', label: 'Nueva foto', icon: '📸', category: 'photo', route: '/streak' },
  { prefix: '🔥', label: 'Racha diaria', icon: '🔥', category: 'streak', route: '/streak' },
  { prefix: '🩹', label: 'Curita de amor', icon: '🩹', category: 'care', route: '/streak' },
  { prefix: '📊', label: 'Quiz de pareja', icon: '📊', category: 'quiz', route: '/quiz' },
];

export function isActivityNotification(content: string) {
  return KINDS.some((kind) => content.startsWith(kind.prefix));
}

export function parseNotification(content: string) {
  const kind = KINDS.find((item) => content.startsWith(item.prefix));
  return kind
    ? { ...kind, text: content.slice(kind.prefix.length).trim() }
    : { label: 'Novedad', icon: '✨', category: 'other', route: '/messages', text: content };
}

function localDay(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(date);
}

export function groupNotificationsByDate(logs: Message[], now = new Date()) {
  const groups: Record<string, Message[]> = { Hoy: [], Ayer: [], Anteriores: [] };
  const today = localDay(now);
  // Use a calendar day in Santiago, rather than slicing a UTC timestamp. Noon
  // avoids daylight-saving boundary issues when finding the previous day.
  const yesterdayDate = new Date(`${today}T12:00:00Z`);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = localDay(yesterdayDate);
  for (const log of [...logs].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))) {
    const date = new Date(log.created_at);
    const day = Number.isNaN(date.getTime()) ? '' : localDay(date);
    groups[day === today ? 'Hoy' : day === yesterday ? 'Ayer' : 'Anteriores'].push(log);
  }
  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

export function formatNotificationTime(value: string, now = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recientemente';
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (localDay(date) === localDay(now)) {
    return date.toLocaleTimeString('es-CL', {
      timeZone: TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString('es-CL', { timeZone: TIMEZONE, day: 'numeric', month: 'short' });
}
