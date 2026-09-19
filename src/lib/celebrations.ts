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
  | 'navidad'
  | 'san_valentin'
  | 'halloween'
  | 'cumpleanos_mio'
  | 'cumpleanos_pareja';

export type CelebrationEffect = 'fireworks' | 'floaters' | 'snowfall';
export type ParticleShape = 'circle' | 'heart' | 'star' | string;

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
  effect?: CelebrationEffect;
  particleShape?: ParticleShape;
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
  effect?: CelebrationEffect;
  particleShape?: ParticleShape;
}

export const CHILEAN_HOLIDAYS: HolidayDef[] = [
  {
    month: 1, day: 1,
    type: 'ano_nuevo',
    intensity: 'high',
    title: '¡Feliz Año Nuevo!',
    subtitle: '¡Con todo este nuevo año! 🥂',
    emoji: '🥂',
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF', '#FF69B4'],
    effect: 'fireworks',
    particleShape: 'star',
  },
  {
    month: 2, day: 14,
    type: 'san_valentin',
    intensity: 'medium',
    title: '¡Feliz San Valentín!',
    subtitle: 'El día del amor y la amistad 💕',
    emoji: '💝',
    colors: ['#FF69B4', '#FF1493', '#FF6B9D', '#FFB6C1', '#FFFFFF'],
    effect: 'snowfall',
    particleShape: 'heart',
  },
  {
    month: 9, day: 18,
    type: 'fiestas_patrias',
    intensity: 'high',
    title: '¡Felices Fiestas Patrias!',
    subtitle: '¡Viva Chile! 🇨🇱🎉',
    emoji: '🇨🇱',
    colors: ['#D52B1E', '#FFFFFF', '#0039A6', '#FFD700'],
    effect: 'fireworks',
    particleShape: 'circle',
  },
  {
    month: 10, day: 31,
    type: 'halloween',
    intensity: 'low',
    title: '¡Feliz Halloween!',
    subtitle: 'Noche de brujas 🎃👻',
    emoji: '🎃',
    colors: ['#FF6600', '#8B00FF', '#39FF14', '#FFD700'],
    effect: 'snowfall',
    particleShape: 'emoji:🎃,👻,🦇',
  },
  {
    month: 12, day: 24,
    type: 'navidad',
    intensity: 'medium',
    title: '¡Feliz Nochebuena!',
    subtitle: '¡Que disfrutes mucho esta noche! ✨',
    emoji: '🌟',
    colors: ['#FF0000', '#00FF00', '#FFD700', '#FFFFFF'],
    effect: 'snowfall',
    particleShape: 'emoji:❄️,🌟,🎁',
  },
  {
    month: 12, day: 25,
    type: 'navidad',
    intensity: 'high',
    title: '¡Feliz Navidad!',
    subtitle: '¡Que tengas unas felices fiestas! 🎄',
    emoji: '🎄',
    colors: ['#FF0000', '#00FF00', '#FFD700', '#FFFFFF', '#FF6B6B'],
    effect: 'snowfall',
    particleShape: 'emoji:🎄,❄️,⛄',
  },
  {
    month: 12, day: 31,
    type: 'ano_nuevo',
    intensity: 'high',
    title: '¡Feliz Fin de Año!',
    subtitle: 'Último día del año juntos 🥳',
    emoji: '🍾',
    colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF', '#FF69B4'],
    effect: 'fireworks',
    particleShape: 'star',
  },
];

// --- Default color palettes ---

const COLORS_CUMPLEMES = ['#e5c573', '#edd693', '#f3e29f', '#FFD700', '#FFFFFF'];
const COLORS_HITO = ['#e5c573', '#FF69B4', '#4ECDC4', '#FFD700', '#FFFFFF', '#FF6B6B'];
const COLORS_ANIVERSARIO = ['#FFD700', '#FF69B4', '#FF6B6B', '#FFFFFF', '#e5c573', '#f472b6', '#4ECDC4'];

// --- Helpers: Date parsing in Santiago timezone ---

function parseDateLocal(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getTodayLocal(): Date {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
  const [year, month, day] = todayStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// --- Main Detection Function ---

/**
 * Detect if today is a celebration day.
 * Returns the highest-priority celebration, or null.
 *
 * Priority: Aniversario > Birthdays > Hito 100 > Chilean Holiday > Cumplemes
 */
export function getCelebration(
  relationshipStart: string,
  myBirthday?: string | null,
  partnerBirthday?: string | null
): Celebration | null {
  const start = parseDateLocal(relationshipStart);
  if (!start) return null;

  const today = getTodayLocal();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1;
  const startDay = start.getDate();

  // Basic diff
  let totalMonths = (year - startYear) * 12 + (month - startMonth);
  if (day < startDay) {
    totalMonths--;
  }
  totalMonths = Math.max(0, totalMonths);

  const timeDiff = today.getTime() - start.getTime();
  const daysTogether = Math.max(0, Math.floor(timeDiff / (1000 * 3600 * 24)));

  // Birthday checks
  const isMyBirthday = myBirthday ? (() => {
    const d = parseDateLocal(myBirthday);
    return d && d.getDate() === day && (d.getMonth() + 1) === month;
  })() : false;

  const isPartnerBirthday = partnerBirthday ? (() => {
    const d = parseDateLocal(partnerBirthday);
    return d && d.getDate() === day && (d.getMonth() + 1) === month;
  })() : false;

  // 1. ANIVERSARIO — Same month AND day as start, at least 1 year later
  if (month === startMonth && day === startDay && year > startYear) {
    const years = year - startYear;
    return {
      type: 'aniversario',
      intensity: 'high',
      title: years === 1
        ? '💛 ¡Feliz primer aniversario!'
        : `💛 ¡Feliz aniversario #${years}!`,
      subtitle: years === 1
        ? '¡Un año increíble de amor!'
        : `¡${years} años de amor juntos!`,
      emoji: '🎊',
      years,
      months: totalMonths,
      days: daysTogether,
      colors: COLORS_ANIVERSARIO,
      effect: 'fireworks',
      particleShape: 'heart',
    };
  }

  // 2. BIRTHDAYS
  if (isMyBirthday || isPartnerBirthday) {
    const isMine = isMyBirthday;
    return {
      type: isMine ? 'cumpleanos_mio' : 'cumpleanos_pareja',
      intensity: 'high',
      title: isMine ? '¡Feliz Cumpleaños a ti! 🎂' : '¡Feliz Cumpleaños mi amor! 🎂',
      subtitle: isMine ? 'Hoy celebramos tu vida 🥳' : 'Hoy celebramos un año más de tu persona favorita 🥳',
      emoji: '🎂',
      months: totalMonths,
      days: daysTogether,
      colors: ['#FF69B4', '#FFD700', '#4ECDC4', '#FFFFFF', '#FF6B6B'],
      effect: 'snowfall',
      particleShape: 'emoji:🎈,🎁,🎉',
    };
  }

  // 3. HITO 100 — Every 100 days together
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
      effect: 'fireworks',
      particleShape: 'star',
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
      effect: holiday.effect,
      particleShape: holiday.particleShape,
    };
  }

  // 4. CUMPLEMES — Same day-of-month as relationship start, different month
  if (day === startDay && !(month === startMonth && year === startYear)) {
    return {
      type: 'cumplemes',
      intensity: 'medium',
      title: `💛 ¡Feliz cumplemes!`,
      subtitle: '+ 1 mes de infinitos',
      emoji: '💌',
      months: totalMonths,
      days: daysTogether,
      colors: COLORS_CUMPLEMES,
      effect: 'snowfall',
      particleShape: 'emoji:💌,✨,💛',
    };
  }

  return null;
}
