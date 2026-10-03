-- ============================================================
-- Coliflor — Migration 013: Nuestro Mundo
-- ============================================================
-- World system tables, RLS, and server-authoritative RPCs
-- ============================================================

-- 1. WORLD STATE (one per couple)
CREATE TABLE IF NOT EXISTS world_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  level INT NOT NULL DEFAULT 1,
  xp INT NOT NULL DEFAULT 0,
  energy INT NOT NULL DEFAULT 100,
  max_energy INT NOT NULL DEFAULT 100,
  current_biome TEXT NOT NULL DEFAULT 'forest',
  unlocked_biomes TEXT[] NOT NULL DEFAULT ARRAY['forest'],
  last_daily_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(couple_id)
);

ALTER TABLE world_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "world_states_select" ON world_states
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

CREATE POLICY "world_states_insert" ON world_states
  FOR INSERT TO authenticated
  WITH CHECK (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

-- Update restricted: only server RPCs should update level/xp
CREATE POLICY "world_states_update" ON world_states
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

-- 2. INVENTORY
CREATE TABLE IF NOT EXISTS world_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(couple_id, item_type, item_id)
);

ALTER TABLE world_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "world_inventory_select" ON world_inventory
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

CREATE POLICY "world_inventory_insert" ON world_inventory
  FOR INSERT TO authenticated
  WITH CHECK (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

CREATE POLICY "world_inventory_update" ON world_inventory
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

CREATE POLICY "world_inventory_delete" ON world_inventory
  FOR DELETE TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

-- 3. PLACED OBJECTS
CREATE TABLE IF NOT EXISTS world_placed_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  biome_id TEXT NOT NULL DEFAULT 'forest',
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  position_x DOUBLE PRECISION NOT NULL DEFAULT 50,
  position_y DOUBLE PRECISION NOT NULL DEFAULT 50,
  scale DOUBLE PRECISION NOT NULL DEFAULT 1,
  rotation DOUBLE PRECISION NOT NULL DEFAULT 0,
  state JSONB DEFAULT '{}'::JSONB,
  placed_by UUID NOT NULL REFERENCES profiles(id),
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE world_placed_objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "world_placed_select" ON world_placed_objects
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

CREATE POLICY "world_placed_insert" ON world_placed_objects
  FOR INSERT TO authenticated
  WITH CHECK (
    placed_by = auth.uid() AND
    couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
  );

CREATE POLICY "world_placed_update" ON world_placed_objects
  FOR UPDATE TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

CREATE POLICY "world_placed_delete" ON world_placed_objects
  FOR DELETE TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

-- 4. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS world_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_by UUID NOT NULL REFERENCES profiles(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(couple_id, achievement_id)
);

ALTER TABLE world_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "world_achievements_select" ON world_achievements
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

CREATE POLICY "world_achievements_insert" ON world_achievements
  FOR INSERT TO authenticated
  WITH CHECK (
    unlocked_by = auth.uid() AND
    couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid())
  );

-- 5. ACTIVITY LOG (idempotent rewards)
CREATE TABLE IF NOT EXISTS world_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_key TEXT NOT NULL,
  xp_granted INT NOT NULL DEFAULT 0,
  items_granted JSONB DEFAULT '[]'::JSONB,
  granted_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(couple_id, activity_key)
);

ALTER TABLE world_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "world_activity_log_select" ON world_activity_log
  FOR SELECT TO authenticated
  USING (couple_id IN (SELECT id FROM couples WHERE user1_id = auth.uid() OR user2_id = auth.uid()));

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_world_states_couple ON world_states(couple_id);
CREATE INDEX IF NOT EXISTS idx_world_inventory_couple ON world_inventory(couple_id);
CREATE INDEX IF NOT EXISTS idx_world_placed_couple_biome ON world_placed_objects(couple_id, biome_id);
CREATE INDEX IF NOT EXISTS idx_world_achievements_couple ON world_achievements(couple_id);
CREATE INDEX IF NOT EXISTS idx_world_activity_key ON world_activity_log(couple_id, activity_key);

-- 7. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE world_states;
ALTER PUBLICATION supabase_realtime ADD TABLE world_placed_objects;
ALTER PUBLICATION supabase_realtime ADD TABLE world_inventory;

-- ============================================================
-- RPC: Initialize world for a couple (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION init_world(p_couple_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_state world_states;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Create world state if not exists
  INSERT INTO world_states (couple_id)
  VALUES (p_couple_id)
  ON CONFLICT (couple_id) DO NOTHING;

  -- Give starter items if inventory is empty
  IF NOT EXISTS (SELECT 1 FROM world_inventory WHERE couple_id = p_couple_id) THEN
    INSERT INTO world_inventory (couple_id, item_type, item_id, quantity) VALUES
      (p_couple_id, 'seed', 'oak_seed', 3),
      (p_couple_id, 'seed', 'basic_flower', 5),
      (p_couple_id, 'decoration', 'stone_small', 4),
      (p_couple_id, 'decoration', 'mushroom_red', 2);
  END IF;

  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id;

  RETURN jsonb_build_object(
    'id', v_state.id,
    'level', v_state.level,
    'xp', v_state.xp,
    'energy', v_state.energy,
    'max_energy', v_state.max_energy,
    'current_biome', v_state.current_biome,
    'unlocked_biomes', v_state.unlocked_biomes,
    'last_daily_date', v_state.last_daily_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- RPC: Server-authoritative XP grant (idempotent)
-- ============================================================
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

  -- Cap XP (max 500 per activity, min 0)
  IF p_xp > 500 THEN p_xp := 500; END IF;
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

-- ============================================================
-- RPC: Claim daily reward (server-authoritative)
-- ============================================================
CREATE OR REPLACE FUNCTION claim_world_daily(p_couple_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := get_today_santiago();
  v_activity_key TEXT;
  v_xp INT := 25;
  v_items JSONB;
  v_streak INT;
  v_seeds TEXT[] := ARRAY['basic_flower','wild_grass','fern','oak_seed','pine_seed','birch_seed','daisy','tulip','sunflower'];
  v_random_seed TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Unique key per user per day
  v_activity_key := 'daily:' || v_user_id::TEXT || ':' || v_today::TEXT;

  -- Random seed reward
  v_random_seed := v_seeds[1 + floor(random() * array_length(v_seeds, 1))::int];
  v_items := jsonb_build_array(
    jsonb_build_object('item_type', 'seed', 'item_id', v_random_seed, 'quantity', 1)
  );

  -- Streak bonus
  SELECT current_streak INTO v_streak FROM couples WHERE id = p_couple_id;
  IF v_streak >= 7 THEN
    v_xp := v_xp * 2;
    v_items := v_items || jsonb_build_array(
      jsonb_build_object('item_type', 'seed', 'item_id', 'rare_orchid', 'quantity', 1)
    );
  ELSIF v_streak >= 3 THEN
    v_xp := FLOOR(v_xp * 1.5);
  END IF;

  RETURN grant_world_xp(p_couple_id, 'daily', v_activity_key, v_xp, v_items);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- RPC: Place an object in the world
-- ============================================================
CREATE OR REPLACE FUNCTION place_world_object(
  p_couple_id UUID,
  p_biome_id TEXT,
  p_item_type TEXT,
  p_item_id TEXT,
  p_x DOUBLE PRECISION,
  p_y DOUBLE PRECISION,
  p_scale DOUBLE PRECISION DEFAULT 1,
  p_rotation DOUBLE PRECISION DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_qty INT;
  v_obj_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check inventory
  SELECT quantity INTO v_qty FROM world_inventory
  WHERE couple_id = p_couple_id AND item_type = p_item_type AND item_id = p_item_id;

  IF v_qty IS NULL OR v_qty < 1 THEN
    RAISE EXCEPTION 'Item not in inventory';
  END IF;

  -- Decrement inventory
  UPDATE world_inventory SET quantity = quantity - 1
  WHERE couple_id = p_couple_id AND item_type = p_item_type AND item_id = p_item_id;

  -- Remove empty items
  DELETE FROM world_inventory
  WHERE couple_id = p_couple_id AND item_type = p_item_type AND item_id = p_item_id AND quantity <= 0;

  -- Place object
  INSERT INTO world_placed_objects (couple_id, biome_id, item_type, item_id, position_x, position_y, scale, rotation, placed_by)
  VALUES (p_couple_id, p_biome_id, p_item_type, p_item_id, p_x, p_y, p_scale, p_rotation, v_user_id)
  RETURNING id INTO v_obj_id;

  -- Grant placement XP (10 XP, idempotent per object)
  PERFORM grant_world_xp(p_couple_id, 'placement', 'place:' || v_obj_id::TEXT, 10, '[]'::JSONB);

  RETURN jsonb_build_object('success', true, 'object_id', v_obj_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- RPC: Remove placed object (return to inventory)
-- ============================================================
CREATE OR REPLACE FUNCTION remove_world_object(p_object_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_obj world_placed_objects;
BEGIN
  SELECT * INTO v_obj FROM world_placed_objects WHERE id = p_object_id;
  IF v_obj IS NULL THEN
    RAISE EXCEPTION 'Object not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM couples WHERE id = v_obj.couple_id AND (user1_id = v_user_id OR user2_id = v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Return to inventory
  INSERT INTO world_inventory (couple_id, item_type, item_id, quantity)
  VALUES (v_obj.couple_id, v_obj.item_type, v_obj.item_id, 1)
  ON CONFLICT (couple_id, item_type, item_id)
  DO UPDATE SET quantity = world_inventory.quantity + 1;

  -- Remove from world
  DELETE FROM world_placed_objects WHERE id = p_object_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
