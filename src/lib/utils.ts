// ============================================================
// Coliflor — Utility Functions
// ============================================================

import { TIMEZONE } from './types';

/**
 * Get the current date in Santiago timezone as YYYY-MM-DD string.
 * This is used for display purposes only — all streak logic uses server time.
 */
export function getTodayInTimezone(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/**
 * Get current date/time parts in Santiago timezone.
 */
export function getNowInTimezone(): { year: number; month: number; day: number; hours: number; minutes: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hours: get('hour'),
    minutes: get('minute'),
  };
}

/**
 * Calculate days between a start date and today.
 */
export function daysSince(startDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const todayStr = getTodayInTimezone();
  const today = new Date(todayStr + 'T00:00:00');
  const diff = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string, style: 'short' | 'long' | 'medium' = 'short'): string {
  const date = new Date(dateStr + 'T12:00:00');
  if (style === 'long') {
    return date.toLocaleDateString('es-CL', {
      timeZone: TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  if (style === 'medium') {
    return date.toLocaleDateString('es-CL', {
      timeZone: TIMEZONE,
      day: 'numeric',
      month: 'short',
    });
  }
  return date.toLocaleDateString('es-CL', {
    timeZone: TIMEZONE,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a timestamp for display (time only).
 */
export function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('es-CL', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Generate a random 8-character invite code in format XXXX-XXXX.
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Get the month name in Spanish.
 */
export function getMonthName(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
}

/**
 * Get all days in a month for calendar grid.
 */
export function getCalendarDays(year: number, month: number): Array<{ date: string; day: number; isCurrentMonth: boolean }> {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  // Day of week the month starts on (0 = Sunday)
  let startDow = firstDay.getDay();
  // Make Monday = 0
  startDow = startDow === 0 ? 6 : startDow - 1;

  const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const m = month - 1 <= 0 ? 12 : month - 1;
    const y = month - 1 <= 0 ? year - 1 : year;
    days.push({
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
      isCurrentMonth: false,
    });
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
      isCurrentMonth: true,
    });
  }

  // Next month padding (fill to 42 = 6 rows)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month + 1 > 12 ? 1 : month + 1;
    const y = month + 1 > 12 ? year + 1 : year;
    days.push({
      date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
      isCurrentMonth: false,
    });
  }

  return days;
}

/**
 * Compress an image file before upload.
 * Returns a Blob of max 1200px wide, JPEG quality 0.7.
 */
export function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not compress image'));
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    
    img.src = url;
  });
}
