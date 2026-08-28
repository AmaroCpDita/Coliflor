-- ============================================================
-- Coliflor — Database Migration v001
-- ============================================================
-- Run this SQL in the Supabase SQL Editor to set up all tables,
-- RLS policies, functions, and scheduled jobs.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  couple_id UUID,
  invite_code TEXT UNIQUE,
  avatar_emoji TEXT NOT NULL DEFAULT '😊',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Clean non-recursive RLS policies for profiles
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_partner" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_by_invite" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ============================================================
-- 2. COUPLES
-- ============================================================
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id),
  user2_id UUID NOT NULL REFERENCES profiles(id),
  relationship_start DATE NOT NULL DEFAULT CURRENT_DATE,
  current_streak INT NOT NULL DEFAULT 0,
  user1_note TEXT DEFAULT '¡Escribe aquí tu primera notita! Ámame mucho y dime cosas bonitas 💛',
  user2_note TEXT DEFAULT '¡Escribe aquí tu primera notita! Ámame mucho y dime cosas bonitas 💛',
  max_streak INT NOT NULL DEFAULT 0,
  recoveries_used INT NOT NULL DEFAULT 0,
  recoveries_reset_month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "couples_select" ON couples
  FOR SELECT TO authenticated
  USING (
    user1_id = auth.uid() OR user2_id = auth.uid()
  );

CREATE POLICY "couples_update" ON couples
  FOR UPDATE TO authenticated
  USING (
    user1_id = auth.uid() OR user2_id = auth.uid()
  );

CREATE POLICY "couples_insert" ON couples
  FOR INSERT TO authenticated
  WITH CHECK (
    user1_id = auth.uid() OR user2_id = auth.uid()
  );

-- ============================================================
-- 5. CALENDAR DAYS & EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  registered_by UUID NOT NULL REFERENCES profiles(id),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(couple_id, day)
);

ALTER TABLE calendar_days ENABLE ROW LEVEL SECURITY;

  );

-- ============================================================
-- 4. STREAK PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS streak_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  photo_date DATE NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(couple_id, user_id, photo_date)
);

ALTER TABLE streak_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streak_photos_access" ON streak_photos
  FOR ALL TO authenticated
  USING (
    couple_id IN (
      SELECT c.id FROM couples c
      WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
    )
  )
  WITH CHECK (
    couple_id IN (
      SELECT c.id FROM couples c
      WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
    )
  );

-- ============================================================
-- 5. STREAK RECOVERIES
-- ============================================================
CREATE TABLE IF NOT EXISTS streak_recoveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  recovered_date DATE NOT NULL,
  used_by UUID NOT NULL REFERENCES profiles(id),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(couple_id, recovered_date)
);

ALTER TABLE streak_recoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streak_recoveries_access" ON streak_recoveries
  FOR ALL TO authenticated
  USING (
    couple_id IN (
      SELECT c.id FROM couples c
      WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
    )
  )
  WITH CHECK (
    couple_id IN (
      SELECT c.id FROM couples c
      WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
    )
  );

-- ============================================================
-- 6. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_access" ON messages
  FOR ALL TO authenticated
  USING (
    couple_id IN (
      SELECT c.id FROM couples c
      WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
    )
  )
  WITH CHECK (
    couple_id IN (
      SELECT c.id FROM couples c
      WHERE c.user1_id = auth.uid() OR c.user2_id = auth.uid()
    )
  );

-- Index for efficient message loading
CREATE INDEX IF NOT EXISTS idx_messages_couple_created
  ON messages(couple_id, created_at DESC);

-- ============================================================
-- 7. PUSH SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_own" ON push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. INDEXES FOR RLS PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON profiles(couple_id);
CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON profiles(invite_code);
CREATE INDEX IF NOT EXISTS idx_calendar_days_couple_day ON calendar_days(couple_id, day);
CREATE INDEX IF NOT EXISTS idx_streak_photos_couple_date ON streak_photos(couple_id, photo_date);
CREATE INDEX IF NOT EXISTS idx_streak_recoveries_couple ON streak_recoveries(couple_id);
CREATE INDEX IF NOT EXISTS idx_couples_users ON couples(user1_id, user2_id);

-- ============================================================
-- 9. FUNCTIONS
-- ============================================================

-- Function: Generate invite code for current user and create couple immediately
DROP FUNCTION IF EXISTS public.generate_my_invite_code(text);
DROP FUNCTION IF EXISTS public.generate_my_invite_code(text, date);
DROP FUNCTION IF EXISTS public.generate_my_invite_code CASCADE;

CREATE OR REPLACE FUNCTION generate_my_invite_code(
  p_code TEXT,
  p_relationship_start DATE DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_couple_id UUID;
  v_start_date DATE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has a couple
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = v_user_id;

  IF v_couple_id IS NULL THEN
    v_start_date := COALESCE(p_relationship_start, CURRENT_DATE);

    INSERT INTO public.couples (user1_id, user2_id, relationship_start)
    VALUES (v_user_id, v_user_id, v_start_date)
    RETURNING id INTO v_couple_id;

    UPDATE public.profiles
    SET couple_id = v_couple_id, invite_code = p_code
    WHERE id = v_user_id;
  ELSE
    UPDATE public.profiles
    SET invite_code = p_code
    WHERE id = v_user_id;
  END IF;

  RETURN p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Create/link couple (called when second user enters code)
DROP FUNCTION IF EXISTS public.create_couple(text);
DROP FUNCTION IF EXISTS public.create_couple(text, date);
DROP FUNCTION IF EXISTS public.create_couple CASCADE;

CREATE OR REPLACE FUNCTION public.create_couple(
  p_invite_code TEXT,
  p_relationship_start DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_creator_id UUID;
  v_joiner_id UUID := auth.uid();
  v_couple_id UUID;
  v_clean_code TEXT := UPPER(TRIM(p_invite_code));
BEGIN
  IF v_joiner_id IS NULL THEN
    RAISE EXCEPTION 'No estás autenticado';
  END IF;

  -- Find creator by invite code
  SELECT id, couple_id INTO v_creator_id, v_couple_id
  FROM public.profiles
  WHERE UPPER(TRIM(invite_code)) = v_clean_code;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Código inválido o caducado';
  END IF;

  IF v_creator_id = v_joiner_id THEN
    RAISE EXCEPTION 'No puedes ingresar tu propio código';
  END IF;

  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples
    SET user2_id = v_joiner_id
    WHERE id = v_couple_id;
  ELSE
    INSERT INTO public.couples (user1_id, user2_id, relationship_start)
    VALUES (v_creator_id, v_joiner_id, COALESCE(p_relationship_start, CURRENT_DATE))
    RETURNING id INTO v_couple_id;
  END IF;

  UPDATE public.profiles SET couple_id = v_couple_id WHERE id = v_creator_id;
  UPDATE public.profiles SET couple_id = v_couple_id, invite_code = NULL WHERE id = v_joiner_id;
  UPDATE public.profiles SET invite_code = NULL WHERE id = v_creator_id;

  RETURN v_couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Get today's date in Santiago timezone
CREATE OR REPLACE FUNCTION get_today_santiago()
RETURNS DATE AS $$
BEGIN
  RETURN (NOW() AT TIME ZONE 'America/Santiago')::DATE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Create a couple (called when second user joins)
CREATE OR REPLACE FUNCTION create_couple(
  p_invite_code TEXT,
  p_relationship_start DATE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_creator_id UUID;
  v_joiner_id UUID := auth.uid();
  v_couple_id UUID;
  v_start_date DATE;
BEGIN
  -- Find the creator by invite code
  SELECT id INTO v_creator_id
  FROM profiles
  WHERE invite_code = p_invite_code AND couple_id IS NULL;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code or user already in a couple';
  END IF;

  IF v_creator_id = v_joiner_id THEN
    RAISE EXCEPTION 'Cannot join your own couple';
  END IF;

  -- Check joiner is not already in a couple
  IF (SELECT couple_id FROM profiles WHERE id = v_joiner_id) IS NOT NULL THEN
    RAISE EXCEPTION 'You are already in a couple';
  END IF;

  v_start_date := COALESCE(p_relationship_start, CURRENT_DATE);

  -- Create the couple
  INSERT INTO couples (user1_id, user2_id, relationship_start)
  VALUES (v_creator_id, v_joiner_id, v_start_date)
  RETURNING id INTO v_couple_id;

  -- Update both profiles
  UPDATE profiles SET couple_id = v_couple_id, invite_code = NULL WHERE id = v_creator_id;
  UPDATE profiles SET couple_id = v_couple_id, invite_code = NULL WHERE id = v_joiner_id;

  RETURN v_couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Upload photo and check streak
-- Called after a photo is uploaded to storage
CREATE OR REPLACE FUNCTION register_streak_photo(
  p_couple_id UUID,
  p_storage_path TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := get_today_santiago();
  v_partner_has_photo BOOLEAN;
  v_yesterday_complete BOOLEAN;
  v_yesterday_recovered BOOLEAN;
  v_current_streak INT;
  v_max_streak INT;
  v_photo_id UUID;
BEGIN
  -- Verify user belongs to this couple
  IF NOT EXISTS (
    SELECT 1 FROM couples
    WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check if already uploaded today
  IF EXISTS (
    SELECT 1 FROM streak_photos
    WHERE couple_id = p_couple_id AND user_id = v_user_id AND photo_date = v_today
  ) THEN
    RAISE EXCEPTION 'Already uploaded photo today';
  END IF;

  -- Insert photo record
  INSERT INTO streak_photos (couple_id, user_id, photo_date, storage_path)
  VALUES (p_couple_id, v_user_id, v_today, p_storage_path)
  RETURNING id INTO v_photo_id;

  -- Check if partner also has a photo today
  SELECT EXISTS (
    SELECT 1 FROM streak_photos
    WHERE couple_id = p_couple_id AND user_id != v_user_id AND photo_date = v_today
  ) INTO v_partner_has_photo;

  -- If both have photos, update streak
  IF v_partner_has_photo THEN
    -- Check if yesterday was complete (photo or recovery)
    SELECT EXISTS (
      SELECT 1 FROM streak_photos sp1
      JOIN streak_photos sp2 ON sp1.couple_id = sp2.couple_id AND sp1.photo_date = sp2.photo_date
      WHERE sp1.couple_id = p_couple_id
        AND sp1.photo_date = v_today - INTERVAL '1 day'
        AND sp1.user_id != sp2.user_id
    ) INTO v_yesterday_complete;

    SELECT EXISTS (
      SELECT 1 FROM streak_recoveries
      WHERE couple_id = p_couple_id AND recovered_date = v_today - INTERVAL '1 day'
    ) INTO v_yesterday_recovered;

    SELECT current_streak, max_streak INTO v_current_streak, v_max_streak
    FROM couples WHERE id = p_couple_id;

    IF v_yesterday_complete OR v_yesterday_recovered OR v_current_streak = 0 THEN
      v_current_streak := v_current_streak + 1;
    ELSE
      -- Streak broken, restart at 1
      v_current_streak := 1;
    END IF;

    IF v_current_streak > v_max_streak THEN
      v_max_streak := v_current_streak;
    END IF;

    UPDATE couples
    SET current_streak = v_current_streak, max_streak = v_max_streak
    WHERE id = p_couple_id;
  END IF;

  RETURN jsonb_build_object(
    'photo_id', v_photo_id,
    'day_complete', v_partner_has_photo,
    'current_streak', (SELECT current_streak FROM couples WHERE id = p_couple_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Use a streak recovery
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

  IF v_recoveries_used >= 5 THEN
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
    'recoveries_remaining', 5 - v_recoveries_used - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark "today we met" in calendar
CREATE OR REPLACE FUNCTION mark_calendar_today(
  p_couple_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := get_today_santiago();
  v_day_id UUID;
BEGIN
  -- Verify user belongs to this couple
  IF NOT EXISTS (
    SELECT 1 FROM couples
    WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Insert or ignore if already marked
  INSERT INTO calendar_days (couple_id, day, registered_by)
  VALUES (p_couple_id, v_today, v_user_id)
  ON CONFLICT (couple_id, day) DO NOTHING
  RETURNING id INTO v_day_id;

  -- If already existed, get the existing id
  IF v_day_id IS NULL THEN
    SELECT id INTO v_day_id
    FROM calendar_days
    WHERE couple_id = p_couple_id AND day = v_today;
  END IF;

  RETURN v_day_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. AUTOMATIC PROFILE CREATION ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Usuario')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 11. DAILY CLEANUP: Delete ephemeral photos older than today
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_old_photos()
RETURNS void AS $$
DECLARE
  v_today DATE := get_today_santiago();
  v_photo RECORD;
BEGIN
  -- Delete storage objects and records for photos older than today
  FOR v_photo IN
    SELECT id, storage_path FROM streak_photos
    WHERE photo_date < v_today
  LOOP
    -- Note: Storage deletion must be done via API/Edge Function
    -- Here we just clean the database records
    DELETE FROM streak_photos WHERE id = v_photo.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 12. MONTHLY RECOVERY RESET
-- ============================================================
CREATE OR REPLACE FUNCTION reset_monthly_recoveries()
RETURNS void AS $$
BEGIN
  UPDATE couples
  SET recoveries_used = 0,
      recoveries_reset_month = date_trunc('month', CURRENT_DATE)::DATE
  WHERE recoveries_reset_month < date_trunc('month', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 13. ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_days;
ALTER PUBLICATION supabase_realtime ADD TABLE streak_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE couples;

-- ============================================================
-- 6. QUIZ RESPONSES TABLE & POLICIES
-- ============================================================

CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  quiz_date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(couple_id, quiz_date, user_id)
);

ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_responses_select_policy" ON quiz_responses;
DROP POLICY IF EXISTS "quiz_responses_insert_policy" ON quiz_responses;

CREATE POLICY "quiz_responses_select_policy" ON quiz_responses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "quiz_responses_insert_policy" ON quiz_responses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 14. STORAGE BUCKET
-- ============================================================
-- Run this in the Supabase Dashboard > Storage > Create bucket:
-- Bucket name: "photos"
-- Public: false (private)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Then add these storage policies:
-- 
-- Policy: "Users can upload photos for their couple"
-- INSERT: bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[2]
--
-- Policy: "Users can view photos of their couple"  
-- SELECT: bucket_id = 'photos' AND (storage.foldername(name))[1] IN (
--   SELECT id::text FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
-- )
--
-- Policy: "Service role can delete expired photos"
-- DELETE: bucket_id = 'photos' (service_role only)

-- ============================================================
-- NOTE: pg_cron setup
-- ============================================================
-- After running this migration, set up these cron jobs via SQL Editor:
--
-- Daily photo cleanup at 00:05 Santiago time (04:05 UTC in winter, 03:05 UTC in summer):
-- SELECT cron.schedule('cleanup-photos', '5 4 * * *', 'SELECT cleanup_old_photos()');
--
-- Monthly recovery reset on 1st of each month:
-- SELECT cron.schedule('reset-recoveries', '0 4 1 * *', 'SELECT reset_monthly_recoveries()');
