-- ============================================================
-- Coliflor — Migration v033: Public Read-Only RPC for iOS/Scriptable Widget
-- ============================================================
-- Returns ONLY non-sensitive streak status (current_streak, completed_today,
-- photos_today, today) so the iOS Scriptable widget can update automatically
-- without requiring expiring user JWT tokens.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_widget_streak_status(
  p_couple_id UUID DEFAULT '7b8edae0-65da-44b7-a9b9-8073ecdd607e'::UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := get_today_santiago();
  v_streak INT := 0;
  v_photos_today INT := 0;
BEGIN
  SELECT COALESCE(current_streak, 0) INTO v_streak
  FROM couples
  WHERE id = p_couple_id;

  SELECT COUNT(DISTINCT user_id) INTO v_photos_today
  FROM streak_photos
  WHERE couple_id = p_couple_id AND photo_date = v_today;

  RETURN jsonb_build_object(
    'current_streak', COALESCE(v_streak, 0),
    'completed_today', (v_photos_today >= 2),
    'photos_today', v_photos_today,
    'today', v_today::TEXT
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_widget_streak_status(UUID) TO anon, authenticated;
