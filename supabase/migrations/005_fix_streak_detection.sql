-- ============================================================
-- Coliflor — Migration v005: Fix Streak Detection
-- ============================================================
-- Problem: cleanup_old_photos() was deleting ALL streak_photos 
-- records older than today, destroying the evidence of who 
-- uploaded photos. This caused:
-- 1. False "streak broken" detection the next day
-- 2. Recovery offered to the wrong user
--
-- Fix: Stop deleting recent streak_photos records. Only clean 
-- up records older than 30 days (they're lightweight metadata).
-- Storage files should be cleaned separately via Edge Function.
-- ============================================================

-- Replace cleanup_old_photos to preserve recent records
CREATE OR REPLACE FUNCTION cleanup_old_photos()
RETURNS void AS $$
DECLARE
  v_today DATE := get_today_santiago();
  v_cutoff DATE := v_today - INTERVAL '30 days';
BEGIN
  -- Only delete records older than 30 days
  -- Recent records (last 30 days) are kept for streak detection
  -- Note: Actual storage file deletion should be done via 
  -- Supabase Edge Function or API, not here
  DELETE FROM streak_photos WHERE photo_date < v_cutoff;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
