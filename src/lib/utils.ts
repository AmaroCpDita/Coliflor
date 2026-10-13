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
export function getNowInTimezone(): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
} {
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

  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0');
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
export function getCalendarDays(
  year: number,
  month: number,
): Array<{ date: string; day: number; isCurrentMonth: boolean }> {
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
 * Helper to convert a data URL string to a Blob.
 * Used as a reliable fallback when canvas.toBlob() callback fails or hangs in mobile WebViews/Blink.
 */
function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(parts[1]);
  const length = binary.length;
  const buffer = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
}

/**
 * Safely extract a Blob from a canvas element with fallback to toDataURL.
 * Prevents mobile browser bugs where canvas.toBlob silently drops the callback.
 */
function canvasToBlobSafe(canvas: HTMLCanvasElement, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let settled = false;

    // Timeout safety net: if toBlob callback never executes (known Chromium/WebKit bug on mobile under memory pressure),
    // fallback to synchronous toDataURL.
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataURLToBlob(dataUrl));
      } catch (err) {
        reject(new Error('No se pudo procesar la imagen desde el canvas.'));
      }
    }, 2500);

    try {
      canvas.toBlob(
        (blob) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (blob) {
            resolve(blob);
          } else {
            try {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve(dataURLToBlob(dataUrl));
            } catch {
              reject(new Error('No se pudo comprimir la imagen.'));
            }
          }
        },
        'image/jpeg',
        quality,
      );
    } catch {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataURLToBlob(dataUrl));
      } catch {
        reject(new Error('No se pudo comprimir la imagen.'));
      }
    }
  });
}

/**
 * Compress an image file before upload.
 * Uses native off-thread hardware downscaling via createImageBitmap when available
 * to prevent Android/iOS mobile memory lockups from 50MP-108MP gallery photos.
 * Has strict timeouts, canvas.toBlob fallback, and graceful degradations.
 */
export async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.7,
  flipHorizontal = false,
): Promise<Blob> {
  const isHeic =
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif') ||
    file.type === 'image/heic' ||
    file.type === 'image/heif';

  // Strategy 1: Modern createImageBitmap with native off-thread hardware resize
  // This avoids allocating massive 50MP/108MP bitmaps in RAM on Android/iOS devices!
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      let bitmap: ImageBitmap | null = null;
      try {
        // Try native resize directly during decode
        bitmap = await createImageBitmap(file, {
          resizeWidth: maxWidth,
          resizeQuality: 'medium',
        });
      } catch {
        // Fallback: decode without options if options are unsupported
        bitmap = await createImageBitmap(file);
      }

      if (bitmap) {
        let { width, height } = bitmap;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          bitmap.close();
          throw new Error('No se pudo obtener el contexto del lienzo.');
        }

        if (flipHorizontal) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close(); // Immediately free hardware/GPU memory

        return await canvasToBlobSafe(canvas, quality);
      }
    } catch (bitmapError) {
      console.warn('createImageBitmap failed, falling back to standard Image:', bitmapError);
      // Fall through to Strategy 2
    }
  }

  // Strategy 2: Standard Image + Canvas with hard safety timeout and toBlob fallback
  return new Promise<Blob>((resolve, reject) => {
    let settled = false;
    const url = URL.createObjectURL(file);

    // Strict safety timeout (12 seconds) so it NEVER hangs indefinitely
    const timeoutTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);

      // If the original file is already a standard web format and <= 4MB, use it as fallback!
      if (
        file.size <= 4 * 1024 * 1024 &&
        (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')
      ) {
        console.warn('Compresión agotó el tiempo límite; usando archivo original.');
        resolve(file);
      } else if (isHeic) {
        reject(
          new Error(
            'El formato HEIC/HEIF de esta foto no pudo procesarse. Por favor tómala directamente con la cámara o súbela como JPG.',
          ),
        );
      } else {
        reject(
          new Error(
            'El procesamiento de la foto tardó demasiado. Por favor prueba con otra foto o tómala con la cámara.',
          ),
        );
      }
    }, 12000);

    const img = new Image();

    img.onload = async () => {
      if (settled) return;
      clearTimeout(timeoutTimer);
      settled = true;
      URL.revokeObjectURL(url);

      try {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('No se pudo crear el lienzo para la imagen');
        }

        if (flipHorizontal) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(img, 0, 0, width, height);
        const blob = await canvasToBlobSafe(canvas, quality);
        resolve(blob);
      } catch (err: any) {
        // Fallback to original file if small enough
        if (
          file.size <= 4 * 1024 * 1024 &&
          (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')
        ) {
          resolve(file);
        } else {
          reject(err);
        }
      }
    };

    img.onerror = () => {
      if (settled) return;
      clearTimeout(timeoutTimer);
      settled = true;
      URL.revokeObjectURL(url);

      if (isHeic) {
        reject(
          new Error(
            'Tu teléfono guardó la foto en formato HEIC/HEIF, el cual no es compatible con este navegador. Por favor sube una foto en formato JPG/PNG o tómala con la cámara.',
          ),
        );
      } else if (
        file.size <= 4 * 1024 * 1024 &&
        (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')
      ) {
        // Fallback to original file
        resolve(file);
      } else {
        reject(new Error('No se pudo cargar la imagen seleccionada. Intenta con otra foto.'));
      }
    };

    img.src = url;
  });
}

/**
 * Parse the hero_image_path field which can be:
 * - A JSON array string: '["path1", "path2"]'
 * - A legacy single path string: 'couple_id/hero_123.jpg'
 * - null or undefined
 */
export function parseHeroAlbumPaths(rawPath?: string | null): string[] {
  if (!rawPath || typeof rawPath !== 'string') return [];
  const trimmed = rawPath.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
          .slice(0, 20);
      }
    } catch {
      return [];
    }
  }

  // Legacy single path: if it doesn't start with [, it's an old single path
  return [trimmed];
}

/**
 * Serialize an array of paths into a JSON string (capped at max 20).
 */
export function serializeHeroAlbumPaths(paths: string[]): string {
  const clean = paths.filter((p) => typeof p === 'string' && p.trim().length > 0).slice(0, 20);
  return JSON.stringify(clean);
}
