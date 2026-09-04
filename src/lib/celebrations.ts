// ============================================================
// Coliflor — Celebration Detection Engine
// ============================================================

import { TIMEZONE } from './types';

export type CelebrationIntensity = 'low' | 'medium' | 'high';

export type CelebrationType =
  | 'cumplemes'
  | 'hito100'
  | 'aniversario'
  | 'fiestas_patrias'
  | 'navidad'
  | 'ano_nuevo'
  | 'san_valentin'
  | 'halloween'
  | 'glorias_navales';

export interface Celebration {
  type: CelebrationType;
  intensity: CelebrationIntensity;
  title: string;
  subtitle: string;
  emoji: string;
  /** Number of months together (for cumplemes) */
  months?: number;
  /** Number of days together (for hito100) */
  days?: number;
  /** Number of years together (for aniversario) */
  years?: number;
  /** Firework color palette override */
  colors: string[];
}

// --- Chilean Holidays ---

interface HolidayDef {
  month: number; // 1-indexed
  day: number;
  type: CelebrationType;
  intensity: CelebrationIntensity;
  title: string;
  subtitle: string;
  emoji: string;
  colors: string[];
}

const CHILEAN_HOLIDAYS: HolidayDef[] = [
  {
    month: 1, day: 1,
    type: 'ano_nuevo',
    intensity: 'high',
    title: '¡Feliz Año Nuevo!',
    subtitle: 'Un nuevo año de amor juntos 🥂',
    emoji: '🎆',
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF', '#FF69B4'],
  },
  {
    month: 2, day: 14,
    type: 'san_valentin',
    intensity: 'medium',
    title: '¡Feliz San Valentín!',
    subtitle: 'El día del amor y la amistad 💕',
    emoji: '💝',
    colors: ['#FF69B4', '#FF1493', '#FF6B9D', '#FFB6C1', '#FFFFFF'],
  },
  {
    month: 5, day: 21,
    type: 'glorias_navales',
    intensity: 'low',
    title: '¡Feliz Día de las Glorias Navales!',
    subtitle: '21 de mayo 🇨🇱',
    emoji: '⚓',
    colors: ['#0039A6', '#FFFFFF', '#D52B1E', '#FFD700'],
  },
  {
    month: 9, day: 18,
    type: 'fiestas_patrias',
    intensity: 'high',
    title: '¡Felices Fiestas Patrias!',
    subtitle: '¡Viva Chile! 🇨🇱🎉',
    emoji: '🇨🇱',
    colors: ['#D52B1E', '#FFFFFF', '#0039A6', '#FFD700'],
  },
  {
    month: 9, day: 19,
    type: 'fiestas_patrias',
    intensity: 'medium',
    title: '¡Día de las Glorias del Ejército!',
    subtitle: 'Siguen las fiestas 🇨🇱🥳',
    emoji: '🎖️',
    colors: ['#D52B1E', '#FFFFFF', '#0039A6', '#FFD700'],
  },
  {
    month: 10, day: 31,
    type: 'halloween',
    intensity: 'low',
    title: '¡Feliz Halloween!',
    subtitle: 'Noche de brujas 🎃👻',
    emoji: '🎃',
    colors: ['#FF6600', '#8B00FF', '#39FF14', '#FFD700'],
  },
  {
    month: 12, day: 24,
    type: 'navidad',
    intensity: 'medium',
    title: '¡Feliz Nochebuena!',
    subtitle: 'Una noche mágica juntos ✨',
    emoji: '🌟',
    colors: ['#FF0000', '#00FF00', '#FFD700', '#FFFFFF'],
  },
  {
    month: 12, day: 25,
    type: 'navidad',
    intensity: 'high',
    title: '¡Feliz Navidad!',
    subtitle: 'El mejor regalo es tenerte a ti 🎄',
    emoji: '🎄',
    colors: ['#FF0000', '#00FF00', '#FFD700', '#FFFFFF', '#FF6B6B'],
  },
  {
    month: 12, day: 31,
    type: 'ano_nuevo',
    intensity: 'high',
    title: '¡Feliz Fin de Año!',
    subtitle: 'Último día del año juntos 🥳',
    emoji: '🍾',
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF', '#FF69B4'],
  },
];

// --- Default color palettes ---

const COLORS_CUMPLEMES = ['#e5c573', '#edd693', '#f3e29f', '#FFD700', '#FFFFFF'];
const COLORS_HITO = ['#e5c573', '#FF69B4', '#4ECDC4', '#FFD700', '#FFFFFF', '#FF6B6B'];
const COLORS_ANIVERSARIO = ['#FFD700', '#FF69B4', '#FF6B6B', '#FFFFFF', '#e5c573', '#f472b6', '#4ECDC4'];

// --- Helper: get today parts in Santiago timezone ---

function getTodayParts(): { year: number; month: number; day: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);

  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
  return { year: get('year'), month: get('month'), day: get('day') };
}

// --- Helper: calculate months between dates ---

function monthsBetween(startDate: string, todayYear: number, todayMonth: number, todayDay: number, startDay: number): number {
  const [startYear, startMonth] = startDate.split('-').map(Number);
  let months = (todayYear - startYear) * 12 + (todayMonth - startMonth);
  // Only count if today >= the day of month of the start (or close to it)
  if (todayDay < startDay) months--;
  return Math.max(0, months);
}

// --- Main Detection Function ---

/**
 * Detect if today is a celebration day.
 * Returns the highest-priority celebration, or null.
 *
 * Priority: Aniversario > Hito 100 > Chilean Holiday > Cumplemes
 */
export function getCelebration(relationshipStart: string): Celebration | null {
  const { year, month, day } = getTodayParts();
  const [startYear, startMonth, startDay] = relationshipStart.split('-').map(Number);

  // Calculate days together
  const startDate = new Date(relationshipStart + 'T00:00:00');
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  const todayDate = new Date(todayStr + 'T00:00:00');
  const daysTogether = Math.max(0, Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

  const totalMonths = monthsBetween(relationshipStart, year, month, day, startDay);

  // 1. ANIVERSARIO — Same month AND day as start, at least 1 year later
  if (month === startMonth && day === startDay && year > startYear) {
    const years = year - startYear;
    return {
      type: 'aniversario',
      intensity: 'high',
      title: years === 1
        ? '🎊 ¡Feliz primer aniversario!'
        : `🎊 ¡Feliz aniversario #${years}!`,
      subtitle: years === 1
        ? '¡Un año increíble de amor!'
        : `¡${years} años de amor juntos!`,
      emoji: '🎊',
      years,
      months: totalMonths,
      days: daysTogether,
      colors: COLORS_ANIVERSARIO,
    };
  }

  // 2. HITO 100 — Every 100 days together
  if (daysTogether > 0 && daysTogether % 100 === 0) {
    return {
      type: 'hito100',
      intensity: 'medium',
      title: `🎉 ¡Otros ${daysTogether} días juntos!`,
      subtitle: `¡${daysTogether} días de amor y complicidad!`,
      emoji: '🎉',
      days: daysTogether,
      months: totalMonths,
      colors: COLORS_HITO,
    };
  }

  // 3. CHILEAN HOLIDAYS — Check if today matches any
  const holiday = CHILEAN_HOLIDAYS.find(h => h.month === month && h.day === day);
  if (holiday) {
    return {
      type: holiday.type,
      intensity: holiday.intensity,
      title: holiday.title,
      subtitle: holiday.subtitle,
      emoji: holiday.emoji,
      days: daysTogether,
      months: totalMonths,
      colors: holiday.colors,
    };
  }

  // 4. CUMPLEMES — Same day-of-month as relationship start, different month
  if (day === startDay && !(month === startMonth && year === startYear)) {
    return {
      type: 'cumplemes',
      intensity: 'low',
      title: `🥂 ¡Feliz cumplemes!`,
      subtitle: totalMonths === 1
        ? '¡1 mes juntos!'
        : `¡${totalMonths} meses juntos!`,
      emoji: '🥂',
      months: totalMonths,
      days: daysTogether,
      colors: COLORS_CUMPLEMES,
    };
  }

  return null;
}
