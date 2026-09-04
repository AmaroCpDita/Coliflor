-- ============================================================
-- Coliflor — Migration v003: Recovery Photo Upload
-- ============================================================
-- Allows uploading a photo for a past (recovered) date.
-- Only the user who missed the photo can upload.
-- ============================================================

CREATE OR REPLACE FUNCTION register_recovery_photo(
  p_couple_id UUID,
  p_storage_path TEXT,
  p_photo_date DATE
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := get_today_santiago();
  v_photo_id UUID;
BEGIN
  -- Verify user belongs to this couple
  IF NOT EXISTS (
    SELECT 1 FROM couples
    WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Only allow uploading for recovered dates (yesterday or already recovered days)
  IF p_photo_date >= v_today THEN
    RAISE EXCEPTION 'Cannot upload recovery photo for today or future dates';
  END IF;

  -- Check user hasn't already uploaded for this date
  IF EXISTS (
    SELECT 1 FROM streak_photos
    WHERE couple_id = p_couple_id AND user_id = v_user_id AND photo_date = p_photo_date
  ) THEN
    RAISE EXCEPTION 'Already uploaded photo for this date';
  END IF;

  -- Verify the date has been recovered
  IF NOT EXISTS (
    SELECT 1 FROM streak_recoveries
    WHERE couple_id = p_couple_id AND recovered_date = p_photo_date
  ) THEN
    RAISE EXCEPTION 'This date has not been recovered. Use a recovery first.';
  END IF;

  -- Insert photo record
  INSERT INTO streak_photos (couple_id, user_id, photo_date, storage_path)
  VALUES (p_couple_id, v_user_id, p_photo_date, p_storage_path)
  RETURNING id INTO v_photo_id;

  RETURN jsonb_build_object(
    'photo_id', v_photo_id,
    'photo_date', p_photo_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
