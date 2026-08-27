// ============================================================
// Coliflor — Type Definitions
// ============================================================

// --- Database Row Types ---

export interface Profile {
  id: string;
  display_name: string;
  couple_id: string | null;
  invite_code: string | null;
  avatar_emoji: string;
  created_at: string;
}

export interface Couple {
  id: string;
  user1_id: string;
  user2_id: string;
  relationship_start: string; // date string YYYY-MM-DD
  current_streak: number;
  max_streak: number;
  recoveries_used: number;
  recoveries_reset_month: string; // date string YYYY-MM-DD
  user1_note?: string;
  user2_note?: string;
  user1_partner_nickname?: string;
  user2_partner_nickname?: string;
  daily_note?: string;
  daily_note_updated_by?: string;
  created_at: string;
}

export interface CalendarDay {
  id: string;
  couple_id: string;
  day: string; // date string YYYY-MM-DD
  registered_by: string;
  registered_at: string;
}

export type EventCategory = 'nos_vimos' | 'cita' | 'aniversario' | 'viaje' | 'nota';

export interface CalendarEvent {
  id: string;
  couple_id: string;
  event_date: string; // date string YYYY-MM-DD
  category: EventCategory;
  title?: string;
  note?: string;
  created_by: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
}

export interface DailyQuiz {
  id: string;
  theme: string;
  subtitle: string;
  questions: QuizQuestion[];
}

export interface QuizResponse {
  id: string;
  couple_id: string;
  quiz_date: string;
  user_id: string;
  answers: number[];
  created_at: string;
}

export interface StreakPhoto {
  id: string;
  couple_id: string;
  user_id: string;
  photo_date: string; // date string YYYY-MM-DD
  storage_path: string;
  uploaded_at: string;
}

export interface StreakRecovery {
  id: string;
  couple_id: string;
  recovered_date: string; // date string YYYY-MM-DD
  used_by: string;
  used_at: string;
}

export interface Message {
  id: string;
  couple_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  subscription: object;
  platform: 'web' | 'android';
  created_at: string;
}

// --- App State Types ---

export interface AuthState {
  user: import('@supabase/supabase-js').User | null;
  profile: Profile | null;
  couple: Couple | null;
  partner: Profile | null;
  status: AppStatus;
  isMockMode: boolean;
}

export type AppStatus = 'loading' | 'unauthenticated' | 'no-couple' | 'ready';

// --- Component Props ---

export interface DayInfo {
  date: string;
  isToday: boolean;
  isCurrentMonth: boolean;
  isMarked: boolean;
  calendarDay?: CalendarDay;
}

export interface PhotoDayStatus {
  date: string;
  myPhoto: StreakPhoto | null;
  partnerPhoto: StreakPhoto | null;
  isComplete: boolean;
  isRecovered: boolean;
}

// --- Constants ---

export const MAX_RECOVERIES_PER_MONTH = 5;
export const TIMEZONE = 'America/Santiago';
