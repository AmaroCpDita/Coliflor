-- Run this COMPLETE file in Supabase SQL Editor.
-- Clears world progress/items ONLY for Amaro and Javiera, with a private backup.
-- Photos, streak, messages, goals outside the world and the Test world are preserved.
-- Replay is safe: the amaro-javiera-launch-v1 reset is performed only once.
BEGIN;
-- Apply this complete file after 015. Includes 016, 017 and 018 atomically.

-- Longer biome chapters, gradual catalog rewards and bounded decorative XP.
-- Apply after 015. Keeps earned objects, levels, progress fraction and open biomes.

CREATE OR REPLACE FUNCTION public.world_xp_to_next(p_level INT) RETURNS INT
LANGUAGE SQL IMMUTABLE SET search_path=public AS $$
  SELECT LEAST(220, FLOOR(100 * POWER(1.15, GREATEST(1,p_level) - 1))::INT);
$$;
ALTER TABLE public.world_states ADD COLUMN IF NOT EXISTS progression_version INT NOT NULL DEFAULT 1;

-- Only convert each existing world once. Never recalculate or reduce its level.
UPDATE public.world_states SET
  xp = LEAST(world_xp_to_next(level)-1, FLOOR(xp::NUMERIC / GREATEST(1,FLOOR(100 * POWER(1.15,level-1))) * world_xp_to_next(level))::INT),
  unlocked_biomes = ARRAY(SELECT DISTINCT biome FROM unnest(unlocked_biomes || ARRAY[current_biome,'forest'] ||
    CASE WHEN level >= 10 THEN ARRAY['garden'] ELSE ARRAY[]::TEXT[] END ||
    CASE WHEN level >= 15 THEN ARRAY['beach'] ELSE ARRAY[]::TEXT[] END ||
    CASE WHEN level >= 25 THEN ARRAY['magical'] ELSE ARRAY[]::TEXT[] END ||
    CASE WHEN level >= 30 THEN ARRAY['mountain'] ELSE ARRAY[]::TEXT[] END) biome),
  progression_version=2
WHERE progression_version < 2;
ALTER TABLE public.world_states ALTER COLUMN progression_version SET DEFAULT 2;

-- Historical grants and current possessions consume the new per-item unlock key.
-- Markers grant nothing and preserve stock, placements and historical claim rows.
INSERT INTO world_activity_log(couple_id,activity_type,activity_key,xp_granted,items_granted,granted_by)
SELECT s.couple_id,'catalog_unlock','catalog:v4:item:' || c.item_id,0,'[]'::JSONB,p.user1_id
FROM world_states s JOIN couples p ON p.id=s.couple_id CROSS JOIN world_object_catalog c
WHERE EXISTS (SELECT 1 FROM world_inventory i WHERE i.couple_id=s.couple_id AND world_object_id(i.item_id)=c.item_id)
   OR EXISTS (SELECT 1 FROM world_placed_objects o WHERE o.couple_id=s.couple_id AND world_object_id(o.item_id)=c.item_id)
   OR EXISTS (SELECT 1 FROM world_activity_log a CROSS JOIN LATERAL jsonb_array_elements(a.items_granted) e
      WHERE a.couple_id=s.couple_id AND world_object_id(e->>'item_id')=c.item_id)
ON CONFLICT(couple_id,activity_key) DO NOTHING;

INSERT INTO world_activity_log(couple_id,activity_type,activity_key,xp_granted,items_granted,granted_by)
SELECT DISTINCT o.couple_id,'placement','placement:first:' || o.item_id,0,'[]'::JSONB,p.user1_id
FROM world_placed_objects o JOIN couples p ON p.id=o.couple_id
ON CONFLICT(couple_id,activity_key) DO NOTHING;

INSERT INTO public.world_object_catalog(item_id,item_type,required_level,reward_quantity) VALUES
  ('oak_tree','tree',1,1),
  ('basic_flower','flower',1,3),
  ('wild_grass','plant',1,1),
  ('stone_small','rock',1,2),
  ('mushroom_red','plant',2,2),
  ('bush','plant',3,2),
  ('wooden_bench','decoration',4,1),
  ('fern','plant',5,2),
  ('pine_tree','tree',6,2),
  ('lantern','decoration',7,1),
  ('firefly_bush','plant',8,1),
  ('birch_tree','tree',9,1),
  ('glowing_mushrooms','plant',10,1),
  ('picnic_table','decoration',11,1),
  ('wishing_well','building',12,1),
  ('treehouse','building',13,1),
  ('willow_tree','tree',14,1),
  ('daisy','flower',15,3),
  ('tulip','flower',16,2),
  ('sunflower','flower',17,2),
  ('rose','flower',18,2),
  ('flower_bed','flower',19,1),
  ('fountain','building',20,1),
  ('garden_arch','decoration',21,1),
  ('pond_bridge','decoration',22,1),
  ('garden_swing','decoration',23,1),
  ('rare_orchid','flower',24,1)
ON CONFLICT(item_id) DO UPDATE SET required_level=EXCLUDED.required_level, reward_quantity=EXCLUDED.reward_quantity;

UPDATE world_streak_milestones SET xp_reward=LEAST(xp_reward,50);

CREATE OR REPLACE FUNCTION public.grant_world_xp(
  p_couple_id UUID, p_activity_type TEXT, p_activity_key TEXT,
  p_xp INT, p_items JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_state world_states;
  v_xp INT;
  v_level INT;
  v_needed INT;
  v_items JSONB;
  v_item JSONB;
  v_object_id UUID;
  v_item_id TEXT;
  v_spent INT;
  v_today DATE := get_today_santiago();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  -- Decorative actions cannot speed up progress by repeating placements or copies.
  IF p_activity_type IN ('placement', 'interaction') THEN
    BEGIN v_object_id := split_part(p_activity_key, ':', 2)::UUID;
    EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid object interaction'; END;
    SELECT item_id INTO v_item_id FROM world_placed_objects WHERE id = v_object_id AND couple_id = p_couple_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Object not found'; END IF;
    IF p_activity_type = 'placement' THEN p_activity_key := 'placement:first:' || v_item_id;
    ELSE p_activity_key := 'interaction:' || v_item_id || ':' || v_today; END IF;
    SELECT COALESCE(SUM(xp_granted),0) INTO v_spent FROM world_activity_log
      WHERE couple_id = p_couple_id AND activity_type = p_activity_type
        AND (created_at AT TIME ZONE 'America/Santiago')::DATE = v_today;
    p_xp := LEAST(5, GREATEST(0, p_xp), GREATEST(0, 15 - v_spent));
    p_items := '[]'::JSONB;
  END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id = p_couple_id AND activity_key = p_activity_key) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true, 'level', v_state.level, 'xp', v_state.xp);
  END IF;
  p_xp := LEAST(5000, GREATEST(0, COALESCE(p_xp, 0)));
  v_xp := v_state.xp + p_xp;
  v_level := v_state.level;
  WHILE v_level < 100 LOOP
    v_needed := public.world_xp_to_next(v_level);
    EXIT WHEN v_xp < v_needed;
    v_xp := v_xp - v_needed;
    v_level := v_level + 1;
  END LOOP;
  UPDATE world_states SET xp = v_xp, level = v_level,
    unlocked_biomes = ARRAY(SELECT DISTINCT biome FROM unnest(v_state.unlocked_biomes || ARRAY['forest'] ||
      CASE WHEN v_level >= 14 THEN ARRAY['garden'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 24 THEN ARRAY['beach'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 34 THEN ARRAY['magical'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 44 THEN ARRAY['mountain'] ELSE ARRAY[]::TEXT[] END) biome), updated_at = NOW() WHERE couple_id = p_couple_id;
  v_items := world_normalize_items(p_items);
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) LOOP
    IF (v_item->>'quantity')::INT <= 0 THEN RAISE EXCEPTION 'Invalid reward quantity'; END IF;
    INSERT INTO world_inventory (couple_id, item_type, item_id, quantity)
    VALUES (p_couple_id, v_item->>'item_type', v_item->>'item_id', (v_item->>'quantity')::INT)
    ON CONFLICT (couple_id, item_type, item_id) DO UPDATE SET quantity = world_inventory.quantity + EXCLUDED.quantity;
  END LOOP;
  INSERT INTO world_activity_log (couple_id, activity_type, activity_key, xp_granted, items_granted, granted_by)
  VALUES (p_couple_id, p_activity_type, p_activity_key, p_xp, v_items, auth.uid());
  RETURN jsonb_build_object('success', true, 'xp_granted', p_xp, 'level', v_level, 'xp', v_xp,
    'xp_to_next', public.world_xp_to_next(v_level),
    'leveled_up', v_level > v_state.level, 'old_level', v_state.level, 'items_granted', v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_world_catalog(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_level INT;
  v_reward RECORD;
  v_result JSONB;
  v_items JSONB := '[]'::jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT level INTO v_level FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  FOR v_reward IN
    SELECT item_id, jsonb_build_array(jsonb_build_object('item_type', item_type, 'item_id', item_id, 'quantity', reward_quantity)) AS items
    FROM world_object_catalog WHERE required_level BETWEEN 2 AND v_level ORDER BY required_level, item_id
  LOOP
    v_result := grant_world_xp(p_couple_id, 'catalog_unlock', 'catalog:v4:item:' || v_reward.item_id, 0, v_reward.items);
    IF NOT COALESCE((v_result->>'already_claimed')::BOOLEAN, false) THEN v_items := v_items || (v_result->'items_granted'); END IF;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'claimed_any', jsonb_array_length(v_items) > 0,
    'level', v_level, 'xp_granted', 0, 'items_granted', v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_world_daily(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_level INT;
  v_streak INT;
  v_xp INT := 25;
  v_today DATE := get_today_santiago();
  v_key TEXT := 'daily:couple:' || v_today::TEXT;
  v_object world_object_catalog;
  v_items JSONB;
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT level INTO v_level FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_type='daily'
    AND (created_at AT TIME ZONE 'America/Santiago')::DATE = v_today) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true);
  END IF;
  SELECT * INTO v_object FROM world_object_catalog WHERE required_level <= v_level ORDER BY random() LIMIT 1;
  v_items := jsonb_build_array(jsonb_build_object('item_type', v_object.item_type, 'item_id', v_object.item_id, 'quantity', 1));
  SELECT current_streak INTO v_streak FROM couples WHERE id = p_couple_id;
  IF v_streak >= 7 THEN
    v_xp := v_xp * 2;
    v_items := v_items || jsonb_build_array(jsonb_build_object('item_type', v_object.item_type, 'item_id', v_object.item_id, 'quantity', 1));
  ELSIF v_streak >= 3 THEN v_xp := FLOOR(v_xp * 1.5); END IF;
  v_result := grant_world_xp(p_couple_id, 'daily', v_key, v_xp, v_items);
  UPDATE world_states SET last_daily_date = v_today WHERE couple_id = p_couple_id;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_streak_milestones(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_streak INT;
  v_milestone RECORD;
  v_result JSONB;
  v_xp INT := 0;
  v_level INT;
  v_old_level INT;
  v_safe_items JSONB;
  v_items JSONB := '[]'::jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT level INTO v_old_level FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  SELECT max_streak INTO v_streak FROM couples WHERE id = p_couple_id;
  v_level := v_old_level;
  FOR v_milestone IN SELECT * FROM world_streak_milestones m WHERE day <= COALESCE(v_streak, 0)
    AND NOT EXISTS (SELECT 1 FROM world_claimed_milestones c WHERE c.couple_id = p_couple_id AND c.milestone_day = m.day) ORDER BY day
  LOOP
    SELECT COALESCE(jsonb_agg(CASE WHEN c.item_id IS NULL OR c.required_level <= v_level THEN entry
      ELSE jsonb_build_object('item_type','flower','item_id','basic_flower','quantity',COALESCE((entry->>'quantity')::INT,1)) END),'[]'::JSONB)
      INTO v_safe_items FROM jsonb_array_elements(v_milestone.items_reward) entry
      LEFT JOIN world_object_catalog c ON c.item_id=world_object_id(entry->>'item_id');
    v_result := grant_world_xp(p_couple_id, 'streak_milestone', 'streak_' || v_milestone.day, v_milestone.xp_reward, v_safe_items);
    INSERT INTO world_claimed_milestones (couple_id, milestone_day) VALUES (p_couple_id, v_milestone.day) ON CONFLICT DO NOTHING;
    IF NOT COALESCE((v_result->>'already_claimed')::BOOLEAN, false) THEN
      v_xp := v_xp + (v_result->>'xp_granted')::INT;
      v_items := v_items || (v_result->'items_granted');
    END IF;
    v_level := (v_result->>'level')::INT;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'claimed_any', v_xp > 0 OR jsonb_array_length(v_items) > 0,
    'xp_granted', v_xp, 'level', v_level, 'leveled_up', v_level > v_old_level, 'items_granted', v_items);
END;
$$;


-- Complete forest chapter: 56 distinct visiting days, shared goals, content and finale.
-- Requires 015 and 016. Does not remove earned objects, open biomes or levels.

ALTER TABLE world_states ADD COLUMN IF NOT EXISTS forest_completed_at TIMESTAMPTZ;
ALTER TABLE world_object_catalog ADD COLUMN IF NOT EXISTS reward_kind TEXT NOT NULL DEFAULT 'level';
ALTER TABLE world_object_catalog ADD COLUMN IF NOT EXISTS allowed_biomes TEXT[] NOT NULL DEFAULT ARRAY['forest','garden'];
-- Recover an interrupted earlier rollout that marked worlds before installing its RPCs.
DO $$ BEGIN
  IF to_regprocedure('public.get_forest_progress(uuid)') IS NULL THEN
    UPDATE world_states SET progression_version=2 WHERE progression_version=3;
  END IF;
END; $$;

-- Preserve availability from pacing v2 before moving the next chapters later.
UPDATE world_states SET unlocked_biomes=ARRAY(SELECT DISTINCT biome FROM unnest(unlocked_biomes || ARRAY[current_biome,'forest'] ||
  CASE WHEN level>=14 THEN ARRAY['garden'] ELSE ARRAY[]::TEXT[] END ||
  CASE WHEN level>=24 THEN ARRAY['beach'] ELSE ARRAY[]::TEXT[] END ||
  CASE WHEN level>=34 THEN ARRAY['magical'] ELSE ARRAY[]::TEXT[] END ||
  CASE WHEN level>=44 THEN ARRAY['mountain'] ELSE ARRAY[]::TEXT[] END) biome)
WHERE progression_version<3;

INSERT INTO world_object_catalog(item_id,item_type,required_level,reward_quantity) VALUES
  ('oak_tree','tree',1,1),
  ('pine_tree','tree',10,2),
  ('birch_tree','tree',13,1),
  ('willow_tree','tree',21,1),
  ('bush','plant',4,2),
  ('basic_flower','flower',1,3),
  ('wild_grass','plant',1,1),
  ('fern','plant',7,2),
  ('daisy','flower',22,3),
  ('tulip','flower',23,2),
  ('sunflower','flower',24,2),
  ('rose','flower',25,2),
  ('rare_orchid','flower',31,1),
  ('mushroom_red','plant',2,2),
  ('stone_small','rock',1,2),
  ('wooden_bench','decoration',5,1),
  ('lantern','decoration',8,1),
  ('garden_arch','decoration',28,1),
  ('fountain','building',27,1),
  ('treehouse','building',20,1),
  ('firefly_bush','plant',11,1),
  ('flower_bed','flower',26,1),
  ('glowing_mushrooms','plant',15,1),
  ('picnic_table','decoration',17,1),
  ('pond_bridge','decoration',29,1),
  ('wishing_well','building',19,1),
  ('garden_swing','decoration',30,1),
  ('stepping_stones','rock',3,3),
  ('wooden_fence','decoration',6,3),
  ('birdhouse','decoration',9,1),
  ('log_planter','plant',12,1),
  ('birdbath','decoration',14,1),
  ('forest_sign','decoration',16,1),
  ('campfire','decoration',18,1),
  ('forest_heart','special',21,1)
ON CONFLICT(item_id) DO UPDATE SET required_level=EXCLUDED.required_level,reward_quantity=EXCLUDED.reward_quantity;
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='oak_tree';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','mountain'],reward_kind='level' WHERE item_id='pine_tree';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='birch_tree';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden','magical'],reward_kind='level' WHERE item_id='willow_tree';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='bush';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='basic_flower';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden','mountain'],reward_kind='level' WHERE item_id='wild_grass';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest'],reward_kind='level' WHERE item_id='fern';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='daisy';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['garden'],reward_kind='level' WHERE item_id='tulip';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['garden'],reward_kind='level' WHERE item_id='sunflower';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['garden'],reward_kind='level' WHERE item_id='rose';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','magical'],reward_kind='level' WHERE item_id='rare_orchid';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest'],reward_kind='level' WHERE item_id='mushroom_red';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden','mountain','beach'],reward_kind='level' WHERE item_id='stone_small';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='wooden_bench';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden','magical'],reward_kind='level' WHERE item_id='lantern';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['garden'],reward_kind='level' WHERE item_id='garden_arch';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['garden'],reward_kind='level' WHERE item_id='fountain';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest'],reward_kind='level' WHERE item_id='treehouse';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden','magical'],reward_kind='level' WHERE item_id='firefly_bush';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='flower_bed';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','magical'],reward_kind='level' WHERE item_id='glowing_mushrooms';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='picnic_table';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='pond_bridge';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='wishing_well';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='garden_swing';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='stepping_stones';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='wooden_fence';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='birdhouse';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='log_planter';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='level' WHERE item_id='birdbath';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest'],reward_kind='level' WHERE item_id='forest_sign';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest'],reward_kind='level' WHERE item_id='campfire';
UPDATE world_object_catalog SET allowed_biomes=ARRAY['forest','garden'],reward_kind='forest_completion' WHERE item_id='forest_heart';

-- Previously earned garden-only rewards must remain usable after the rollout.
-- This exception applies only to worlds created under the earlier progression.
UPDATE world_states s SET unlocked_biomes=ARRAY(SELECT DISTINCT biome FROM unnest(s.unlocked_biomes || ARRAY['garden']) biome)
WHERE s.progression_version<3
  AND NOT('garden'=ANY(s.unlocked_biomes))
  AND (EXISTS(SELECT 1 FROM world_inventory i JOIN world_object_catalog c ON c.item_id=world_object_id(i.item_id)
      WHERE i.couple_id=s.couple_id AND i.quantity>0 AND c.allowed_biomes=ARRAY['garden'])
    OR EXISTS(SELECT 1 FROM world_placed_objects o JOIN world_object_catalog c ON c.item_id=world_object_id(o.item_id)
      WHERE o.couple_id=s.couple_id AND c.allowed_biomes=ARRAY['garden']));

CREATE TABLE IF NOT EXISTS world_forest_visits (
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  visitor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT get_today_santiago(),
  PRIMARY KEY(couple_id,visitor_id,visit_date)
);
ALTER TABLE world_forest_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS forest_visits_read ON world_forest_visits;
CREATE POLICY forest_visits_read ON world_forest_visits FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM couples c WHERE c.id=couple_id AND (c.user1_id=auth.uid() OR c.user2_id=auth.uid()))
);
GRANT SELECT ON world_forest_visits TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON world_forest_visits FROM anon,authenticated;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') AND
    NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='world_forest_visits') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.world_forest_visits';
  END IF;
END; $$;

-- Daily-world claims are evidence of previous visits, credited once during rollout.
INSERT INTO world_forest_visits(couple_id,visitor_id,visit_date)
SELECT a.couple_id,a.granted_by,(a.created_at AT TIME ZONE 'America/Santiago')::DATE
FROM world_activity_log a JOIN world_states l ON l.couple_id=a.couple_id
JOIN couples c ON c.id=a.couple_id
WHERE l.progression_version<3 AND a.activity_type='daily' AND a.granted_by IN(c.user1_id,c.user2_id) AND a.created_at<=NOW()
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_forest_progress(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_state world_states; v_couple couples;
  v_days INT; v_one INT; v_two INT; v_first INT; v_living INT; v_cozy INT; v_collection INT; v_claimed INT;
BEGIN
  SELECT * INTO v_couple FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid());
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  SELECT COUNT(DISTINCT visit_date),COUNT(*) FILTER(WHERE visitor_id=v_couple.user1_id),COUNT(*) FILTER(WHERE visitor_id=v_couple.user2_id)
    INTO v_days,v_one,v_two FROM world_forest_visits WHERE couple_id=p_couple_id;
  SELECT LEAST(3,COUNT(DISTINCT item_id)),LEAST(3,COUNT(*) FILTER(WHERE item_type='tree'))+LEAST(4,COUNT(*) FILTER(WHERE item_type='plant')),
    LEAST(1,COUNT(*) FILTER(WHERE item_id='wooden_bench'))+
    LEAST(1,COUNT(*) FILTER(WHERE item_id IN ('lantern','campfire','glowing_mushrooms','wishing_well','treehouse')))+
    LEAST(1,COUNT(*) FILTER(WHERE item_id IN ('birdhouse','birdbath','log_planter')))
    INTO v_first,v_living,v_cozy FROM world_placed_objects WHERE couple_id=p_couple_id AND biome_id='forest';
  SELECT COUNT(*) INTO v_claimed FROM world_activity_log WHERE couple_id=p_couple_id
    AND activity_key IN ('forest:goal:first_corner','forest:goal:living_forest','forest:goal:cozy_corner','forest:goal:shared_care','forest:goal:forest_collection');
  SELECT COUNT(*) INTO v_collection FROM world_object_catalog c WHERE c.reward_kind='level' AND c.required_level<21 AND (
    EXISTS(SELECT 1 FROM world_inventory i WHERE i.couple_id=p_couple_id AND i.item_id=c.item_id AND i.quantity>0) OR
    EXISTS(SELECT 1 FROM world_placed_objects o WHERE o.couple_id=p_couple_id AND o.item_id=c.item_id) OR
    EXISTS(SELECT 1 FROM world_activity_log a CROSS JOIN LATERAL jsonb_array_elements(a.items_granted) item WHERE a.couple_id=p_couple_id AND world_object_id(item->>'item_id')=c.item_id));
  RETURN jsonb_build_object('visits',v_days,'member_visits',jsonb_build_array(v_one,v_two),'level',v_state.level,'target_level',21,'target_days',56,
    'completed',v_state.forest_completed_at IS NOT NULL,
    'can_complete',v_state.forest_completed_at IS NULL AND v_days>=56 AND v_state.level>=21 AND v_claimed=5,
    'goals',jsonb_build_array(
      jsonb_build_object('id','first_corner','current',v_first,'target',3,'claimed',EXISTS(SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_key='forest:goal:first_corner')),
      jsonb_build_object('id','living_forest','current',v_living,'target',7,'claimed',EXISTS(SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_key='forest:goal:living_forest')),
      jsonb_build_object('id','cozy_corner','current',v_cozy,'target',3,'claimed',EXISTS(SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_key='forest:goal:cozy_corner')),
      jsonb_build_object('id','shared_care','current',LEAST(7,v_one)+LEAST(7,v_two),'target',14,'claimed',EXISTS(SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_key='forest:goal:shared_care')),
      jsonb_build_object('id','forest_collection','current',v_collection,'target',23,'claimed',EXISTS(SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_key='forest:goal:forest_collection'))
    ));
END;
$$;

CREATE OR REPLACE FUNCTION public.record_forest_visit(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF EXISTS(SELECT 1 FROM world_states WHERE couple_id=p_couple_id AND current_biome='forest') THEN
    INSERT INTO world_forest_visits(couple_id,visitor_id) VALUES(p_couple_id,auth.uid()) ON CONFLICT DO NOTHING;
  END IF;
  RETURN get_forest_progress(p_couple_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_forest_goal(p_couple_id UUID,p_goal_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_goal JSONB; v_items JSONB;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  PERFORM 1 FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  SELECT goal INTO v_goal FROM jsonb_array_elements(get_forest_progress(p_couple_id)->'goals') goal WHERE goal->>'id'=p_goal_id;
  IF v_goal IS NULL THEN RAISE EXCEPTION 'Meta desconocida'; END IF;
  IF COALESCE((v_goal->>'claimed')::BOOLEAN,false) THEN RETURN jsonb_build_object('success',true,'already_claimed',true); END IF;
  IF (v_goal->>'current')::INT<(v_goal->>'target')::INT THEN RAISE EXCEPTION 'La meta todavía está en progreso'; END IF;
  v_items := CASE WHEN p_goal_id IN ('living_forest','shared_care') THEN '[{"item_type":"tree","item_id":"oak_tree","quantity":1}]'::JSONB
    ELSE '[{"item_type":"flower","item_id":"basic_flower","quantity":2}]'::JSONB END;
  RETURN grant_world_xp(p_couple_id,'forest_goal','forest:goal:' || p_goal_id,0,v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_forest(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_progress JSONB; v_reward JSONB;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  PERFORM 1 FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  v_progress := get_forest_progress(p_couple_id);
  IF (v_progress->>'completed')::BOOLEAN THEN RETURN jsonb_build_object('success',true,'already_claimed',true); END IF;
  IF NOT (v_progress->>'can_complete')::BOOLEAN THEN RAISE EXCEPTION 'Completen las metas, los 56 días de visita y el nivel 21'; END IF;
  v_reward := grant_world_xp(p_couple_id,'forest_completion','forest:completed',0,'[{"item_type":"special","item_id":"forest_heart","quantity":1}]');
  UPDATE world_states SET forest_completed_at=NOW(),unlocked_biomes=ARRAY(SELECT DISTINCT biome FROM unnest(unlocked_biomes || ARRAY['garden']) biome)
    WHERE couple_id=p_couple_id;
  RETURN v_reward || jsonb_build_object('completed_biome','forest');
END;
$$;

CREATE OR REPLACE FUNCTION public.switch_world_biome(p_couple_id UUID,p_biome_id TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_state world_states; v_required INT;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  v_required:=CASE p_biome_id WHEN 'forest' THEN 1 WHEN 'garden' THEN 21 WHEN 'beach' THEN 31 WHEN 'magical' THEN 41 WHEN 'mountain' THEN 51 END;
  IF v_required IS NULL THEN RAISE EXCEPTION 'Bioma desconocido'; END IF;
  IF NOT p_biome_id=ANY(v_state.unlocked_biomes) AND NOT(v_state.forest_completed_at IS NOT NULL AND v_state.level>=v_required) THEN
    RAISE EXCEPTION 'Este bioma todavía está bloqueado';
  END IF;
  UPDATE world_states SET current_biome=p_biome_id,unlocked_biomes=ARRAY(SELECT DISTINCT biome FROM unnest(unlocked_biomes || ARRAY[p_biome_id]) biome) WHERE couple_id=p_couple_id;
  RETURN jsonb_build_object('success',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_world_xp(
  p_couple_id UUID, p_activity_type TEXT, p_activity_key TEXT,
  p_xp INT, p_items JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_state world_states;
  v_xp INT;
  v_level INT;
  v_needed INT;
  v_items JSONB;
  v_item JSONB;
  v_object_id UUID;
  v_item_id TEXT;
  v_spent INT;
  v_today DATE := get_today_santiago();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  -- Decorative actions cannot speed up progress by repeating placements or copies.
  IF p_activity_type IN ('placement', 'interaction') THEN
    BEGIN v_object_id := split_part(p_activity_key, ':', 2)::UUID;
    EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid object interaction'; END;
    SELECT item_id INTO v_item_id FROM world_placed_objects WHERE id = v_object_id AND couple_id = p_couple_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Object not found'; END IF;
    IF p_activity_type = 'placement' THEN p_activity_key := 'placement:first:' || v_item_id;
    ELSE p_activity_key := 'interaction:' || v_item_id || ':' || v_today; END IF;
    SELECT COALESCE(SUM(xp_granted),0) INTO v_spent FROM world_activity_log
      WHERE couple_id = p_couple_id AND activity_type = p_activity_type
        AND (created_at AT TIME ZONE 'America/Santiago')::DATE = v_today;
    p_xp := LEAST(5, GREATEST(0, p_xp), GREATEST(0, 15 - v_spent));
    p_items := '[]'::JSONB;
  END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id = p_couple_id AND activity_key = p_activity_key) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true, 'level', v_state.level, 'xp', v_state.xp);
  END IF;
  p_xp := LEAST(5000, GREATEST(0, COALESCE(p_xp, 0)));
  v_xp := v_state.xp + p_xp;
  v_level := v_state.level;
  WHILE v_level < 100 LOOP
    v_needed := public.world_xp_to_next(v_level);
    EXIT WHEN v_xp < v_needed;
    v_xp := v_xp - v_needed;
    v_level := v_level + 1;
  END LOOP;
  UPDATE world_states SET xp = v_xp, level = v_level,
    unlocked_biomes = ARRAY(SELECT DISTINCT biome FROM unnest(v_state.unlocked_biomes || ARRAY['forest'] ||
      CASE WHEN v_level >= 21 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['garden'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 31 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['beach'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 41 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['magical'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 51 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['mountain'] ELSE ARRAY[]::TEXT[] END) biome), updated_at = NOW() WHERE couple_id = p_couple_id;
  v_items := world_normalize_items(p_items);
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) LOOP
    IF (v_item->>'quantity')::INT <= 0 THEN RAISE EXCEPTION 'Invalid reward quantity'; END IF;
    INSERT INTO world_inventory (couple_id, item_type, item_id, quantity)
    VALUES (p_couple_id, v_item->>'item_type', v_item->>'item_id', (v_item->>'quantity')::INT)
    ON CONFLICT (couple_id, item_type, item_id) DO UPDATE SET quantity = world_inventory.quantity + EXCLUDED.quantity;
  END LOOP;
  INSERT INTO world_activity_log (couple_id, activity_type, activity_key, xp_granted, items_granted, granted_by)
  VALUES (p_couple_id, p_activity_type, p_activity_key, p_xp, v_items, auth.uid());
  RETURN jsonb_build_object('success', true, 'xp_granted', p_xp, 'level', v_level, 'xp', v_xp,
    'xp_to_next', public.world_xp_to_next(v_level),
    'leveled_up', v_level > v_state.level, 'old_level', v_state.level, 'items_granted', v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_world_catalog(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_level INT;
  v_completed BOOLEAN;
  v_reward RECORD;
  v_result JSONB;
  v_items JSONB := '[]'::jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT level,(forest_completed_at IS NOT NULL OR 'garden'=ANY(unlocked_biomes)) INTO v_level,v_completed FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  FOR v_reward IN
    SELECT item_id, jsonb_build_array(jsonb_build_object('item_type', item_type, 'item_id', item_id, 'quantity', reward_quantity)) AS items
    FROM world_object_catalog WHERE required_level BETWEEN 2 AND v_level AND reward_kind='level' AND (required_level<21 OR v_completed) ORDER BY required_level, item_id
  LOOP
    v_result := grant_world_xp(p_couple_id, 'catalog_unlock', 'catalog:v4:item:' || v_reward.item_id, 0, v_reward.items);
    IF NOT COALESCE((v_result->>'already_claimed')::BOOLEAN, false) THEN v_items := v_items || (v_result->'items_granted'); END IF;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'claimed_any', jsonb_array_length(v_items) > 0,
    'level', v_level, 'xp_granted', 0, 'items_granted', v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_world_daily(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_level INT;
  v_completed BOOLEAN;
  v_streak INT;
  v_xp INT := 25;
  v_today DATE := get_today_santiago();
  v_key TEXT := 'daily:couple:' || v_today::TEXT;
  v_object world_object_catalog;
  v_items JSONB;
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT level,(forest_completed_at IS NOT NULL OR 'garden'=ANY(unlocked_biomes)) INTO v_level,v_completed FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_type='daily'
    AND (created_at AT TIME ZONE 'America/Santiago')::DATE = v_today) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true);
  END IF;
  SELECT * INTO v_object FROM world_object_catalog WHERE required_level <= v_level AND reward_kind='level' AND (required_level<21 OR v_completed) ORDER BY random() LIMIT 1;
  v_items := jsonb_build_array(jsonb_build_object('item_type', v_object.item_type, 'item_id', v_object.item_id, 'quantity', 1));
  SELECT current_streak INTO v_streak FROM couples WHERE id = p_couple_id;
  IF v_streak >= 7 THEN
    v_xp := v_xp * 2;
    v_items := v_items || jsonb_build_array(jsonb_build_object('item_type', v_object.item_type, 'item_id', v_object.item_id, 'quantity', 1));
  ELSIF v_streak >= 3 THEN v_xp := FLOOR(v_xp * 1.5); END IF;
  v_result := grant_world_xp(p_couple_id, 'daily', v_key, v_xp, v_items);
  UPDATE world_states SET last_daily_date = v_today WHERE couple_id = p_couple_id;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_streak_milestones(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_streak INT;
  v_completed BOOLEAN;
  v_milestone RECORD;
  v_result JSONB;
  v_xp INT := 0;
  v_level INT;
  v_old_level INT;
  v_safe_items JSONB;
  v_items JSONB := '[]'::jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT level,(forest_completed_at IS NOT NULL OR 'garden'=ANY(unlocked_biomes)) INTO v_old_level,v_completed FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  SELECT max_streak INTO v_streak FROM couples WHERE id = p_couple_id;
  v_level := v_old_level;
  FOR v_milestone IN SELECT * FROM world_streak_milestones m WHERE day <= COALESCE(v_streak, 0)
    AND NOT EXISTS (SELECT 1 FROM world_claimed_milestones c WHERE c.couple_id = p_couple_id AND c.milestone_day = m.day) ORDER BY day
  LOOP
    SELECT COALESCE(jsonb_agg(CASE WHEN c.item_id IS NULL OR c.required_level <= v_level AND (c.required_level<21 OR v_completed) THEN entry
      ELSE jsonb_build_object('item_type','flower','item_id','basic_flower','quantity',COALESCE((entry->>'quantity')::INT,1)) END),'[]'::JSONB)
      INTO v_safe_items FROM jsonb_array_elements(v_milestone.items_reward) entry
      LEFT JOIN world_object_catalog c ON c.item_id=world_object_id(entry->>'item_id');
    v_result := grant_world_xp(p_couple_id, 'streak_milestone', 'streak_' || v_milestone.day, v_milestone.xp_reward, v_safe_items);
    INSERT INTO world_claimed_milestones (couple_id, milestone_day) VALUES (p_couple_id, v_milestone.day) ON CONFLICT DO NOTHING;
    IF NOT COALESCE((v_result->>'already_claimed')::BOOLEAN, false) THEN
      v_xp := v_xp + (v_result->>'xp_granted')::INT;
      v_items := v_items || (v_result->'items_granted');
    END IF;
    v_level := (v_result->>'level')::INT;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'claimed_any', v_xp > 0 OR jsonb_array_length(v_items) > 0,
    'xp_granted', v_xp, 'level', v_level, 'leveled_up', v_level > v_old_level, 'items_granted', v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.place_world_object(
  p_couple_id UUID, p_biome_id TEXT, p_item_type TEXT, p_item_id TEXT,
  p_x DOUBLE PRECISION, p_y DOUBLE PRECISION,
  p_scale DOUBLE PRECISION DEFAULT 1, p_rotation DOUBLE PRECISION DEFAULT 0
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id UUID;
  v_catalog world_object_catalog;
  v_inventory_id UUID;
  v_state world_states;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  SELECT * INTO v_catalog FROM world_object_catalog WHERE item_id = world_object_id(p_item_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown world object'; END IF;
  IF NOT p_biome_id=ANY(v_state.unlocked_biomes) THEN RAISE EXCEPTION 'Este bioma todavía está bloqueado'; END IF;
  IF NOT p_biome_id=ANY(v_catalog.allowed_biomes) THEN RAISE EXCEPTION 'Este objeto pertenece a otro bioma'; END IF;
  UPDATE world_inventory SET quantity = quantity - 1
  WHERE couple_id = p_couple_id AND item_type = v_catalog.item_type AND item_id = v_catalog.item_id AND quantity > 0
  RETURNING id INTO v_inventory_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not in inventory'; END IF;
  DELETE FROM world_inventory WHERE id = v_inventory_id AND quantity = 0;
  INSERT INTO world_placed_objects (couple_id, biome_id, item_type, item_id, position_x, position_y, scale, rotation, placed_by)
  VALUES (p_couple_id, p_biome_id, v_catalog.item_type, v_catalog.item_id, p_x, p_y, p_scale, p_rotation, auth.uid()) RETURNING id INTO v_id;
  PERFORM grant_world_xp(p_couple_id, 'placement', 'place:' || v_id::TEXT, 10, '[]'::jsonb);
  RETURN jsonb_build_object('success', true, 'object_id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.get_forest_progress(UUID),public.record_forest_visit(UUID),public.claim_forest_goal(UUID,TEXT),public.complete_forest(UUID),public.switch_world_biome(UUID,TEXT) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_forest_progress(UUID),public.record_forest_visit(UUID),public.claim_forest_goal(UUID,TEXT),public.complete_forest(UUID),public.switch_world_biome(UUID,TEXT) TO authenticated;
-- Mark conversion only after legacy rewards and visiting dates have been preserved.
-- No temporary tables or session-dependent state are needed for this rollout.
UPDATE world_states SET progression_version=3 WHERE progression_version<3;
ALTER TABLE world_states ALTER COLUMN progression_version SET DEFAULT 3;

-- Daily XP uses today's shared activity, never the length of an old streak.
-- Apply after 017, or run supabase/forest-rollout.sql for 016–018 together.

CREATE OR REPLACE FUNCTION public.world_daily_xp_multiplier(p_couple_id UUID)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_couple couples;
BEGIN
  SELECT * INTO v_couple FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid());
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN CASE WHEN EXISTS(SELECT 1 FROM streak_photos WHERE couple_id=p_couple_id AND user_id=v_couple.user1_id AND photo_date=get_today_santiago())
    AND EXISTS(SELECT 1 FROM streak_photos WHERE couple_id=p_couple_id AND user_id=v_couple.user2_id AND photo_date=get_today_santiago()) THEN 2 ELSE 1 END;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_world_xp(
  p_couple_id UUID, p_activity_type TEXT, p_activity_key TEXT,
  p_xp INT, p_items JSONB DEFAULT '[]'::JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_state world_states;
  v_xp INT;
  v_level INT;
  v_needed INT;
  v_items JSONB;
  v_item JSONB;
  v_object_id UUID;
  v_item_id TEXT;
  v_spent INT;
  v_today DATE := get_today_santiago();
  v_multiplier INT;
  v_budget INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  v_multiplier := public.world_daily_xp_multiplier(p_couple_id);
  -- Decorative actions cannot speed up progress by repeating placements or copies.
  IF p_activity_type IN ('placement', 'interaction') THEN
    BEGIN v_object_id := split_part(p_activity_key, ':', 2)::UUID;
    EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Invalid object interaction'; END;
    SELECT item_id INTO v_item_id FROM world_placed_objects WHERE id = v_object_id AND couple_id = p_couple_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Object not found'; END IF;
    IF p_activity_type = 'placement' THEN p_activity_key := 'placement:first:' || v_item_id;
    ELSE p_activity_key := 'interaction:' || v_item_id || ':' || v_today; END IF;
    SELECT COALESCE(SUM(xp_granted),0) INTO v_spent FROM world_activity_log
      WHERE couple_id = p_couple_id AND activity_type = p_activity_type
        AND (created_at AT TIME ZONE 'America/Santiago')::DATE = v_today;
    v_budget := CASE p_activity_type WHEN 'interaction' THEN 10 ELSE 15 END * v_multiplier;
    p_xp := LEAST(5 * v_multiplier, GREATEST(0, v_budget - v_spent));
    p_items := '[]'::JSONB;
  END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id = p_couple_id AND activity_key = p_activity_key) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true, 'level', v_state.level, 'xp', v_state.xp);
  END IF;
  p_xp := LEAST(5000, GREATEST(0, COALESCE(p_xp, 0)));
  v_xp := v_state.xp + p_xp;
  v_level := v_state.level;
  WHILE v_level < 100 LOOP
    v_needed := public.world_xp_to_next(v_level);
    EXIT WHEN v_xp < v_needed;
    v_xp := v_xp - v_needed;
    v_level := v_level + 1;
  END LOOP;
  UPDATE world_states SET xp = v_xp, level = v_level,
    unlocked_biomes = ARRAY(SELECT DISTINCT biome FROM unnest(v_state.unlocked_biomes || ARRAY['forest'] ||
      CASE WHEN v_level >= 21 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['garden'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 31 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['beach'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 41 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['magical'] ELSE ARRAY[]::TEXT[] END ||
      CASE WHEN v_level >= 51 AND v_state.forest_completed_at IS NOT NULL THEN ARRAY['mountain'] ELSE ARRAY[]::TEXT[] END) biome), updated_at = NOW() WHERE couple_id = p_couple_id;
  v_items := world_normalize_items(p_items);
  FOR v_item IN SELECT value FROM jsonb_array_elements(v_items) LOOP
    IF (v_item->>'quantity')::INT <= 0 THEN RAISE EXCEPTION 'Invalid reward quantity'; END IF;
    INSERT INTO world_inventory (couple_id, item_type, item_id, quantity)
    VALUES (p_couple_id, v_item->>'item_type', v_item->>'item_id', (v_item->>'quantity')::INT)
    ON CONFLICT (couple_id, item_type, item_id) DO UPDATE SET quantity = world_inventory.quantity + EXCLUDED.quantity;
  END LOOP;
  INSERT INTO world_activity_log (couple_id, activity_type, activity_key, xp_granted, items_granted, granted_by)
  VALUES (p_couple_id, p_activity_type, p_activity_key, p_xp, v_items, auth.uid());
  RETURN jsonb_build_object('success', true, 'xp_granted', p_xp, 'level', v_level, 'xp', v_xp,
    'xp_to_next', public.world_xp_to_next(v_level),
    'leveled_up', v_level > v_state.level, 'old_level', v_state.level, 'items_granted', v_items);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_world_daily(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_level INT;
  v_completed BOOLEAN;
  v_xp INT := 15;
  v_today DATE := get_today_santiago();
  v_key TEXT := 'daily:couple:' || v_today::TEXT;
  v_object world_object_catalog;
  v_items JSONB;
  v_result JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM couples WHERE id = p_couple_id AND (user1_id = auth.uid() OR user2_id = auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT level,(forest_completed_at IS NOT NULL OR 'garden'=ANY(unlocked_biomes)) INTO v_level,v_completed FROM world_states WHERE couple_id = p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  IF EXISTS (SELECT 1 FROM world_activity_log WHERE couple_id=p_couple_id AND activity_type='daily'
    AND (created_at AT TIME ZONE 'America/Santiago')::DATE = v_today) THEN
    RETURN jsonb_build_object('success', true, 'already_claimed', true);
  END IF;
  SELECT * INTO v_object FROM world_object_catalog WHERE required_level <= v_level AND reward_kind='level' AND (required_level<21 OR v_completed) ORDER BY random() LIMIT 1;
  v_items := jsonb_build_array(jsonb_build_object('item_type', v_object.item_type, 'item_id', v_object.item_id, 'quantity', 1));
  v_xp := v_xp * public.world_daily_xp_multiplier(p_couple_id);
  v_result := grant_world_xp(p_couple_id, 'daily', v_key, v_xp, v_items);
  UPDATE world_states SET last_daily_date = v_today WHERE couple_id = p_couple_id;
  RETURN v_result;
END;
$$;

-- Kept as a harmless compatibility endpoint for older clients.
CREATE OR REPLACE FUNCTION public.claim_streak_milestones(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_state world_states;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  RETURN jsonb_build_object('success',true,'claimed_any',false,'xp_granted',0,'level',v_state.level,'xp',v_state.xp,'items_granted','[]'::JSONB);
END;
$$;
UPDATE world_streak_milestones SET xp_reward=0;

-- The client chooses an object, never an XP amount or arbitrary reward items.
CREATE OR REPLACE FUNCTION public.interact_world_object(p_couple_id UUID,p_object_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF NOT EXISTS(SELECT 1 FROM world_placed_objects o JOIN world_states s ON s.couple_id=o.couple_id
    WHERE o.id=p_object_id AND o.couple_id=p_couple_id AND o.biome_id=s.current_biome) THEN RAISE EXCEPTION 'Object not found in current biome'; END IF;
  RETURN grant_world_xp(p_couple_id,'interaction','interact:' || p_object_id,5,'[]'::JSONB);
END;
$$;
REVOKE ALL ON FUNCTION public.grant_world_xp(UUID,TEXT,TEXT,INT,JSONB) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.world_daily_xp_multiplier(UUID),public.interact_world_object(UUID,UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.world_daily_xp_multiplier(UUID),public.interact_world_object(UUID,UUID) TO authenticated;
UPDATE world_states SET progression_version=4 WHERE progression_version<4;
ALTER TABLE world_states ALTER COLUMN progression_version SET DEFAULT 4;
NOTIFY pgrst, 'reload schema';


-- Per-member first-entry card and an admin-only, scoped launch reset.

ALTER TABLE public.world_states ADD COLUMN IF NOT EXISTS onboarding_epoch UUID;
-- Existing worlds keep NULL; only new worlds and explicit resets get a welcome.
ALTER TABLE public.world_states ALTER COLUMN onboarding_epoch SET DEFAULT gen_random_uuid();
CREATE TABLE IF NOT EXISTS public.world_welcome_seen (
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  epoch UUID NOT NULL,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(couple_id,user_id,epoch)
);
ALTER TABLE public.world_welcome_seen ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.world_welcome_seen FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.get_world_welcome(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_epoch UUID;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT onboarding_epoch INTO v_epoch FROM world_states WHERE couple_id=p_couple_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  RETURN jsonb_build_object('epoch',v_epoch,'pending',v_epoch IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM world_welcome_seen WHERE couple_id=p_couple_id AND user_id=auth.uid() AND epoch=v_epoch));
END;
$$;
CREATE OR REPLACE FUNCTION public.acknowledge_world_welcome(p_couple_id UUID,p_epoch UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_epoch UUID;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT onboarding_epoch INTO v_epoch FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  IF v_epoch IS NULL OR p_epoch IS DISTINCT FROM v_epoch THEN RAISE EXCEPTION 'El mundo se reinició. Vuelve a abrirlo.'; END IF;
  INSERT INTO world_welcome_seen(couple_id,user_id,epoch) VALUES(p_couple_id,auth.uid(),v_epoch) ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('success',true,'epoch',v_epoch,'pending',false);
END;
$$;

CREATE OR REPLACE FUNCTION public.init_world(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_state world_states;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND (user1_id=auth.uid() OR user2_id=auth.uid())) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO world_states(couple_id) VALUES(p_couple_id) ON CONFLICT(couple_id) DO NOTHING;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id;
  RETURN to_jsonb(v_state);
END;
$$;

CREATE TABLE IF NOT EXISTS public.world_fresh_start_backups (
  reset_key TEXT PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  before_data JSONB NOT NULL,
  reset_epoch UUID NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.world_fresh_start_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.world_fresh_start_backups FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.admin_reset_world_for_launch(p_couple_id UUID,p_reset_key TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_state world_states; v_epoch UUID := gen_random_uuid(); v_before JSONB;
BEGIN
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No se encontró el mundo indicado'; END IF;
  IF EXISTS(SELECT 1 FROM world_fresh_start_backups WHERE reset_key=p_reset_key AND couple_id<>p_couple_id) THEN RAISE EXCEPTION 'Ese reinicio pertenece a otro mundo'; END IF;
  IF EXISTS(SELECT 1 FROM world_fresh_start_backups WHERE reset_key=p_reset_key) THEN
    RETURN jsonb_build_object('success',true,'already_reset',true,'level',v_state.level,'xp',v_state.xp);
  END IF;
  v_before := jsonb_build_object('state',to_jsonb(v_state),
    'inventory',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_inventory t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'placed_objects',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_placed_objects t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'activity',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_activity_log t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'achievements',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_achievements t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'milestones',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_claimed_milestones t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'visits',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_forest_visits t WHERE couple_id=p_couple_id),'[]'::JSONB),
    'welcome',COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM world_welcome_seen t WHERE couple_id=p_couple_id),'[]'::JSONB));
  INSERT INTO world_fresh_start_backups(reset_key,couple_id,before_data,reset_epoch) VALUES(p_reset_key,p_couple_id,v_before,v_epoch);
  DELETE FROM world_placed_objects WHERE couple_id=p_couple_id;
  DELETE FROM world_inventory WHERE couple_id=p_couple_id;
  DELETE FROM world_activity_log WHERE couple_id=p_couple_id;
  DELETE FROM world_achievements WHERE couple_id=p_couple_id;
  DELETE FROM world_claimed_milestones WHERE couple_id=p_couple_id;
  DELETE FROM world_forest_visits WHERE couple_id=p_couple_id;
  DELETE FROM world_welcome_seen WHERE couple_id=p_couple_id;
  UPDATE world_states SET level=1,xp=0,energy=100,max_energy=100,current_biome='forest',
    unlocked_biomes=ARRAY['forest']::TEXT[],last_daily_date=NULL,forest_completed_at=NULL,
    progression_version=4,onboarding_epoch=v_epoch,created_at=NOW(),updated_at=NOW()
    WHERE couple_id=p_couple_id;
  RETURN jsonb_build_object('success',true,'level',1,'xp',0,'inventory_count',0,'placed_count',0,'epoch',v_epoch);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_reset_world_for_launch(UUID,TEXT) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.get_world_welcome(UUID),public.acknowledge_world_welcome(UUID,UUID) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_world_welcome(UUID),public.acknowledge_world_welcome(UUID,UUID) TO authenticated;
NOTIFY pgrst, 'reload schema';

SELECT public.admin_reset_world_for_launch('7b8edae0-65da-44b7-a9b9-8073ecdd607e'::UUID,'amaro-javiera-launch-v1') AS result;
COMMIT;
