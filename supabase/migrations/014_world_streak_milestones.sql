-- ============================================================
-- Coliflor — 014_world_streak_milestones.sql
-- retroactive streak rewards for Our World
-- ============================================================

-- 1. Tables for Milestones
CREATE TABLE IF NOT EXISTS public.world_streak_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day INTEGER NOT NULL UNIQUE,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    items_reward JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.world_claimed_milestones (
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    milestone_day INTEGER NOT NULL REFERENCES public.world_streak_milestones(day) ON DELETE CASCADE,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (couple_id, milestone_day)
);

-- RLS
ALTER TABLE public.world_streak_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_claimed_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read streak milestones" ON public.world_streak_milestones;
CREATE POLICY "Anyone can read streak milestones"
  ON public.world_streak_milestones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Couples can read their own claimed milestones" ON public.world_claimed_milestones;
CREATE POLICY "Couples can read their own claimed milestones"
  ON public.world_claimed_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE id = world_claimed_milestones.couple_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );

-- 2. Initial Data Configuration
INSERT INTO public.world_streak_milestones (day, xp_reward, items_reward) VALUES
  (1,   20,  '[{"item_type":"seed","item_id":"basic_flower","quantity":3}]'::jsonb),
  (3,   40,  '[{"item_type":"seed","item_id":"daisy","quantity":2}]'::jsonb),
  (7,   60,  '[{"item_type":"seed","item_id":"oak_tree","quantity":1}, {"item_type":"decoration","item_id":"stone_small","quantity":1}]'::jsonb),
  (14,  100, '[{"item_type":"decoration","item_id":"lantern","quantity":1}]'::jsonb),
  (21,  120, '[{"item_type":"flower","item_id":"rare_orchid","quantity":1}]'::jsonb),
  (30,  150, '[{"item_type":"decoration","item_id":"fountain","quantity":1}]'::jsonb),
  (37,  150, '[{"item_type":"building","item_id":"treehouse","quantity":1}]'::jsonb),
  (50,  200, '[{"item_type":"seed","item_id":"birch_tree","quantity":2}]'::jsonb),
  (75,  250, '[{"item_type":"decoration","item_id":"stone_bench","quantity":1}]'::jsonb),
  (100, 350, '[{"item_type":"building","item_id":"garden_arch","quantity":1}]'::jsonb),
  (150, 500, '[{"item_type":"seed","item_id":"pine_tree","quantity":2}]'::jsonb),
  (200, 600, '[{"item_type":"decoration","item_id":"stone_bench","quantity":2}, {"item_type":"decoration","item_id":"lantern","quantity":2}]'::jsonb),
  (365, 1000, '[{"item_type":"special","item_id":"anniversary_statue","quantity":1}]'::jsonb)
ON CONFLICT (day) DO UPDATE
SET xp_reward = EXCLUDED.xp_reward, items_reward = EXCLUDED.items_reward;

-- 3. RPC to claim pending milestones
CREATE OR REPLACE FUNCTION claim_streak_milestones(p_couple_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_streak INT;
  v_milestone RECORD;
  v_total_xp INT := 0;
  v_items JSONB := '[]'::jsonb;
  v_result JSONB;
  v_found_any BOOLEAN := false;
  v_item RECORD;
BEGIN
  -- Auth check
  IF NOT EXISTS (
    SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get current streak (highest achieved would be better, but we only have streak_days. Coliflor streak_days is current.)
  -- If we want this to be retroactive but NOT depend on *current* streak, we should use highest historical.
  -- But since we don't have highest historical natively, we will use the current streak.
  SELECT max_streak INTO v_current_streak FROM couples WHERE id = p_couple_id;
  IF v_current_streak IS NULL OR v_current_streak < 1 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_streak');
  END IF;

  -- Find eligible milestones
  FOR v_milestone IN (
    SELECT * FROM world_streak_milestones
    WHERE day <= v_current_streak
    AND day NOT IN (
      SELECT milestone_day FROM world_claimed_milestones WHERE couple_id = p_couple_id
    )
    ORDER BY day ASC
  ) LOOP
    v_found_any := true;

    -- Accumulate XP
    v_total_xp := v_total_xp + v_milestone.xp_reward;

    -- Append Items (a simple jsonb array concat)
    v_items := v_items || v_milestone.items_reward;

    -- Mark as claimed
    INSERT INTO world_claimed_milestones (couple_id, milestone_day) VALUES (p_couple_id, v_milestone.day);
  END LOOP;

  IF NOT v_found_any THEN
    RETURN jsonb_build_object('success', true, 'claimed_any', false);
  END IF;

  -- Call the existing secure grant_world_xp to apply the XP and aggregated items
  -- We bypass the 500 cap by modifying grant_world_xp? Wait, grant_world_xp has a hardcoded 500 XP cap.
  -- Let's check grant_world_xp cap. It says: IF p_xp > 500 THEN p_xp := 500; END IF;
  -- Since we might aggregate > 500 XP, we need to apply it directly or modify the cap.
  -- To be safe, we'll apply it directly here OR call grant_world_xp multiple times per milestone.
  -- Calling it multiple times per milestone is better and preserves logs per milestone!

  v_total_xp := 0;
  v_items := '[]'::jsonb;

  FOR v_milestone IN (
    SELECT * FROM world_claimed_milestones wcm
    JOIN world_streak_milestones wsm ON wcm.milestone_day = wsm.day
    WHERE wcm.couple_id = p_couple_id AND wcm.claimed_at >= NOW() - INTERVAL '1 second'
  ) LOOP
    -- grant_world_xp will handle capping at 500 per milestone (none of ours > 500 except 365, let's fix 365 to 500 to avoid cap, or bypass)
    -- Actually, we can bypass grant_world_xp entirely and do the aggregation, then update state.

    v_result := grant_world_xp(
      p_couple_id,
      'streak_milestone',
      'streak_' || v_milestone.day::text,
      v_milestone.xp_reward,
      v_milestone.items_reward
    );

    v_total_xp := v_total_xp + v_milestone.xp_reward;
    v_items := v_items || v_milestone.items_reward;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'claimed_any', true,
    'xp_granted', v_total_xp,
    'level', (v_result->>'level')::INT,
    'leveled_up', (v_result->>'leveled_up')::BOOLEAN,
    'items_granted', v_items
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update grant_world_xp to support up to 5000 XP (required for large milestones)
CREATE OR REPLACE FUNCTION grant_world_xp(
  p_couple_id UUID,
  p_activity_type TEXT,
  p_activity_key TEXT,
  p_xp INT,
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_state world_states;
  v_new_xp INT;
  v_new_level INT;
  v_xp_for_next INT;
  v_leveled_up BOOLEAN := false;
  v_old_level INT;
BEGIN
  -- Auth check
  IF NOT EXISTS (
    SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Idempotency
  IF EXISTS (
    SELECT 1 FROM world_activity_log WHERE couple_id = p_couple_id AND activity_key = p_activity_key
  ) THEN
    SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id;
    RETURN jsonb_build_object('already_claimed', true, 'level', v_state.level, 'xp', v_state.xp);
  END IF;

  -- Cap XP (max 5000 per activity, min 0)
  IF p_xp > 5000 THEN p_xp := 5000; END IF;
  IF p_xp < 0 THEN p_xp := 0; END IF;

  -- Get current state
  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id;
  IF v_state IS NULL THEN
    RAISE EXCEPTION 'World not initialized';
  END IF;

  v_new_xp := v_state.xp + p_xp;
  v_new_level := v_state.level;
  v_old_level := v_state.level;

  -- Level up: xp_to_next(level) = floor(100 * 1.15^(level-1))
  LOOP
    v_xp_for_next := FLOOR(100 * POWER(1.15, v_new_level - 1))::INT;
    EXIT WHEN v_new_xp < v_xp_for_next;
    v_new_xp := v_new_xp - v_xp_for_next;
    v_new_level := v_new_level + 1;
    v_leveled_up := true;
    EXIT WHEN v_new_level >= 100;
  END LOOP;

  IF v_new_level > 100 THEN
    v_new_level := 100;
    v_new_xp := 0;
  END IF;

  -- Update state
  UPDATE world_states
  SET xp = v_new_xp, level = v_new_level, updated_at = NOW()
  WHERE couple_id = p_couple_id;

  -- Grant inventory items
  IF p_items IS NOT NULL AND jsonb_array_length(p_items) > 0 THEN
    FOR i IN 0..jsonb_array_length(p_items) - 1 LOOP
      INSERT INTO world_inventory (couple_id, item_type, item_id, quantity)
      VALUES (
        p_couple_id,
        p_items->i->>'item_type',
        p_items->i->>'item_id',
        COALESCE((p_items->i->>'quantity')::INT, 1)
      )
      ON CONFLICT (couple_id, item_type, item_id)
      DO UPDATE SET quantity = world_inventory.quantity + COALESCE((p_items->i->>'quantity')::INT, 1);
    END LOOP;
  END IF;

  -- Log
  INSERT INTO world_activity_log (couple_id, activity_type, activity_key, xp_granted, items_granted, granted_by)
  VALUES (p_couple_id, p_activity_type, p_activity_key, p_xp, COALESCE(p_items, '[]'::JSONB), v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'xp_granted', p_xp,
    'level', v_new_level,
    'xp', v_new_xp,
    'xp_to_next', FLOOR(100 * POWER(1.15, v_new_level - 1))::INT,
    'leveled_up', v_leveled_up,
    'old_level', v_old_level,
    'items_granted', p_items
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
