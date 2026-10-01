-- Harden RLS Policies based on Security Audit

-- 1. Profiles: Only allow users to see their own profile or their partner's profile
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    id IN (
      SELECT user1_id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
      UNION
      SELECT user2_id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- 2. Messages: Ensure sender_id strictly matches auth.uid()
DROP POLICY IF EXISTS "messages_access" ON messages;

CREATE POLICY "messages_select" ON messages
  FOR SELECT TO authenticated
  USING (
    couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "messages_delete" ON messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid());

-- 3. Streak Photos: Ensure user_id strictly matches auth.uid()
DROP POLICY IF EXISTS "streak_photos_access" ON streak_photos;

CREATE POLICY "streak_photos_select" ON streak_photos
  FOR SELECT TO authenticated
  USING (
    couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
  );

CREATE POLICY "streak_photos_insert" ON streak_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
  );
