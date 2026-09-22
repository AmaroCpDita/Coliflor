-- ============================================================
-- Coliflor — Migration v007: Fix Recoveries
-- ============================================================
-- 1. Increase recovery limit from 5 to 10 (5 per persona)
-- 2. Fix monthly reset to use Santiago timezone
-- 3. Fix use_streak_recovery to use correct limit
-- ============================================================

-- Fix: use_streak_recovery with new limit of 10 and proper timezone
CREATE OR REPLACE FUNCTION use_streak_recovery(
  p_couple_id UUID,
  p_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := get_today_santiago();
  v_recoveries_used INT;
  v_reset_month DATE;
  v_current_month DATE := date_trunc('month', v_today)::DATE;
  v_max_recoveries INT := 10;
BEGIN
  -- Verify user belongs to this couple
  IF NOT EXISTS (
    SELECT 1 FROM couples
    WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Can only recover yesterday (not arbitrary past dates)
  IF p_date != v_today - INTERVAL '1 day' THEN
    RAISE EXCEPTION 'Can only recover yesterday';
  END IF;

  -- Check if already recovered
  IF EXISTS (
    SELECT 1 FROM streak_recoveries
    WHERE couple_id = p_couple_id AND recovered_date = p_date
  ) THEN
    RAISE EXCEPTION 'Day already recovered';
  END IF;

  -- Get recovery count, reset if new month
  SELECT recoveries_used, recoveries_reset_month
  INTO v_recoveries_used, v_reset_month
  FROM couples WHERE id = p_couple_id;

  IF v_reset_month < v_current_month THEN
    UPDATE couples
    SET recoveries_used = 0, recoveries_reset_month = v_current_month
    WHERE id = p_couple_id;
    v_recoveries_used := 0;
  END IF;

  IF v_recoveries_used >= v_max_recoveries THEN
    RAISE EXCEPTION 'No recoveries remaining this month';
  END IF;

  -- Record the recovery
  INSERT INTO streak_recoveries (couple_id, recovered_date, used_by)
  VALUES (p_couple_id, p_date, v_user_id);

  -- Increment recoveries used
  UPDATE couples
  SET recoveries_used = recoveries_used + 1
  WHERE id = p_couple_id;

  -- Recalculate streak (the recovered day now counts)
  -- Simply increment the current streak since we recovered yesterday
  UPDATE couples
  SET current_streak = current_streak + 1,
      max_streak = GREATEST(max_streak, current_streak + 1)
  WHERE id = p_couple_id;

  RETURN jsonb_build_object(
    'success', true,
    'recoveries_remaining', v_max_recoveries - v_recoveries_used - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix: reset_monthly_recoveries to use Santiago timezone
CREATE OR REPLACE FUNCTION reset_monthly_recoveries()
RETURNS void AS $$
DECLARE
  v_current_month DATE := date_trunc('month', get_today_santiago())::DATE;
BEGIN
  UPDATE couples
  SET recoveries_used = 0,
      recoveries_reset_month = v_current_month
  WHERE recoveries_reset_month < v_current_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset all couples' recoveries now (in case they were stuck)
-- This runs once as part of the migration
DO $$
DECLARE
  v_current_month DATE := date_trunc('month', (NOW() AT TIME ZONE 'America/Santiago')::DATE)::DATE;
BEGIN
  UPDATE couples
  SET recoveries_used = 0,
      recoveries_reset_month = v_current_month
  WHERE recoveries_reset_month < v_current_month;
END;
$$;
