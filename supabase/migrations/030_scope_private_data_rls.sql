-- Keep couple data private even when a client omits its couple_id filter.
-- PostgreSQL combines permissive policies with OR, so old broad policies
-- must be removed rather than supplemented with narrower ones.
BEGIN;

DROP POLICY IF EXISTS "calendar_events_select" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_select_policy" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_insert" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_insert_policy" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_update" ON public.calendar_events;

CREATE POLICY "calendar_events_select" ON public.calendar_events
  FOR SELECT TO authenticated
  USING (couple_id IN (
    SELECT id FROM public.couples
    WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
  ));

CREATE POLICY "calendar_events_insert" ON public.calendar_events
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
  );

-- The calendar UI allows either partner to edit an event in their couple.
CREATE POLICY "calendar_events_update" ON public.calendar_events
  FOR UPDATE TO authenticated
  USING (couple_id IN (
    SELECT id FROM public.couples
    WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
  ))
  WITH CHECK (couple_id IN (
    SELECT id FROM public.couples
    WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "quiz_responses_select_policy" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_responses_insert_policy" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_responses_update_policy" ON public.quiz_responses;

CREATE POLICY "quiz_responses_select_policy" ON public.quiz_responses
  FOR SELECT TO authenticated
  USING (couple_id IN (
    SELECT id FROM public.couples
    WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
  ));

CREATE POLICY "quiz_responses_insert_policy" ON public.quiz_responses
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "quiz_responses_update_policy" ON public.quiz_responses
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND couple_id IN (
      SELECT id FROM public.couples
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
  );

-- Legacy permissive policies override the scoped photo policies.
DROP POLICY IF EXISTS "streak_photos_select_policy" ON public.streak_photos;
DROP POLICY IF EXISTS "streak_photos_insert_policy" ON public.streak_photos;
DROP POLICY IF EXISTS "streak_photos_update_policy" ON public.streak_photos;

-- Recoveries are created only by the validated SECURITY DEFINER RPC.
DROP POLICY IF EXISTS "streak_recoveries_access" ON public.streak_recoveries;
DROP POLICY IF EXISTS "streak_recoveries_select" ON public.streak_recoveries;
CREATE POLICY "streak_recoveries_select" ON public.streak_recoveries
  FOR SELECT TO authenticated
  USING (couple_id IN (
    SELECT id FROM public.couples
    WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
  ));

COMMIT;
NOTIFY pgrst, 'reload schema';
