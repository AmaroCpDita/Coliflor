-- Migration 028 protects future recoveries, but it cannot repair a value that
-- migration 027 already saved as 31. Restore only this couple's known record,
-- and only while all 30 retained dates still prove an active streak.
DO $$
DECLARE
  v_couple_id UUID := '7b8edae0-65da-44b7-a9b9-8073ecdd607e';
  v_today DATE := public.get_today_santiago();
  v_last DATE;
  v_day DATE;
  v_current INT;
  v_record INT;
BEGIN
  SELECT current_streak, max_streak INTO v_current, v_record
  FROM public.couples
  WHERE id = v_couple_id
  FOR UPDATE;

  IF NOT FOUND OR v_current <> 31 OR v_record < 52 THEN
    RETURN;
  END IF;

  v_last := v_today;
  IF NOT EXISTS (
    SELECT 1 FROM public.streak_recoveries
    WHERE couple_id = v_couple_id AND recovered_date = v_last
  ) AND (
    SELECT count(DISTINCT user_id) FROM public.streak_photos
    WHERE couple_id = v_couple_id AND photo_date = v_last
  ) < 2 THEN
    v_last := v_today - 1;
  END IF;

  v_day := v_last;
  WHILE v_day >= v_last - 29 LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.streak_recoveries
      WHERE couple_id = v_couple_id AND recovered_date = v_day
    ) AND (
      SELECT count(DISTINCT user_id) FROM public.streak_photos
      WHERE couple_id = v_couple_id AND photo_date = v_day
    ) < 2 THEN
      -- A real gap means the old record cannot be assumed to be current.
      RETURN;
    END IF;
    v_day := v_day - 1;
  END LOOP;

  UPDATE public.couples
  SET current_streak = v_record
  WHERE id = v_couple_id AND current_streak = 31;
END;
$$;
