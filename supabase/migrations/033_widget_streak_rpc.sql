-- ============================================================
-- Coliflor — Migration v033: Public Read-Only RPC for iOS/Scriptable Widget (Multi-Day Recovery Check)
-- ============================================================
-- Returns non-sensitive streak status, checking the entire 7-day
-- recovery window for any missed days (1, 2 or more days).
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
  v_missed_days_count INT := 0;
  v_needs_recovery BOOLEAN := FALSE;
  v_relationship_start DATE;
BEGIN
  -- Obtener racha registrada y fecha de inicio de la pareja
  SELECT COALESCE(current_streak, 0), relationship_start
  INTO v_streak, v_relationship_start
  FROM couples
  WHERE id = p_couple_id;

  -- Cantidad de fotos únicas subidas hoy
  SELECT COUNT(DISTINCT user_id) INTO v_photos_today
  FROM streak_photos
  WHERE couple_id = p_couple_id AND photo_date = v_today;

  -- Contar cuántos días de los últimos 7 días (excluyendo hoy) quedaron incompletos y sin recuperar
  WITH last_7_days AS (
    SELECT (v_today - s.d)::DATE AS check_date
    FROM generate_series(1, 7) AS s(d)
    WHERE (v_relationship_start IS NULL OR (v_today - s.d)::DATE >= v_relationship_start)
  ),
  uncompleted_days AS (
    SELECT l.check_date
    FROM last_7_days l
    LEFT JOIN (
      SELECT photo_date, COUNT(DISTINCT user_id) AS photo_count
      FROM streak_photos
      WHERE couple_id = p_couple_id
      GROUP BY photo_date
    ) p ON p.photo_date = l.check_date
    WHERE COALESCE(p.photo_count, 0) < 2
      AND NOT EXISTS (
        SELECT 1 FROM streak_recoveries r
        WHERE r.couple_id = p_couple_id AND r.recovered_date = l.check_date
      )
  )
  SELECT COUNT(*) INTO v_missed_days_count FROM uncompleted_days;

  -- Si hay racha activa y hay días pendientes de recuperación (1, 2 o más)
  IF v_streak > 0 AND v_missed_days_count > 0 THEN
    v_needs_recovery := TRUE;
  END IF;

  RETURN jsonb_build_object(
    'current_streak', COALESCE(v_streak, 0),
    'completed_today', (v_photos_today >= 2),
    'photos_today', v_photos_today,
    'needs_recovery', v_needs_recovery,
    'missed_days_count', v_missed_days_count,
    'today', v_today::TEXT
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_widget_streak_status(UUID) TO anon, authenticated;
