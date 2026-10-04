-- Apply after 021. Preserves existing progress, placements and earned stock.
BEGIN;
UPDATE public.world_object_catalog SET required_level=1 WHERE item_id='treehouse';

CREATE OR REPLACE FUNCTION public.claim_world_catalog(p_couple_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_state world_states; v_reward RECORD; v_result JSONB;
  v_items JSONB := '[]'::JSONB; v_payload JSONB; v_owned INT;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND auth.uid() IN(user1_id,user2_id)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT * INTO v_state FROM world_states WHERE couple_id=p_couple_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'World not initialized'; END IF;
  FOR v_reward IN SELECT * FROM world_object_catalog
    WHERE required_level BETWEEN 1 AND v_state.level AND reward_kind='level'
      AND (required_level<21 OR v_state.forest_completed_at IS NOT NULL OR 'garden'=ANY(v_state.unlocked_biomes))
    ORDER BY required_level, CASE WHEN item_id='treehouse' THEN 0 ELSE 1 END, item_id
  LOOP
    v_payload := jsonb_build_array(jsonb_build_object('item_type',v_reward.item_type,
      'item_id',v_reward.item_id,'quantity',v_reward.reward_quantity));
    -- Legacy welcome packs and daily gifts already count as owning a starter.
    -- Record its claim even if copies were all placed; never refill on every visit.
    IF v_reward.required_level=1 THEN
      SELECT COALESCE((SELECT SUM(quantity) FROM world_inventory WHERE couple_id=p_couple_id
        AND world_object_id(item_id)=v_reward.item_id),0)
        + (SELECT COUNT(*) FROM world_placed_objects WHERE couple_id=p_couple_id
        AND world_object_id(item_id)=v_reward.item_id) INTO v_owned;
      IF v_owned>0 THEN v_payload := '[]'::JSONB; END IF;
    END IF;
    v_result := grant_world_xp(p_couple_id,'catalog_unlock','catalog:v4:item:' || v_reward.item_id,0,v_payload);
    IF NOT COALESCE((v_result->>'already_claimed')::BOOLEAN,false) THEN
      v_items := v_items || (v_result->'items_granted');
    END IF;
  END LOOP;
  RETURN jsonb_build_object('success',true,'claimed_any',jsonb_array_length(v_items)>0,
    'level',v_state.level,'xp_granted',0,'items_granted',v_items);
END;
$$;

-- Immutable, date-bound quizzes: both partners and all app versions see one payload.
CREATE TABLE IF NOT EXISTS public.daily_quizzes (
  quiz_date DATE PRIMARY KEY,
  payload JSONB NOT NULL CHECK(jsonb_typeof(payload->'questions')='array'
    AND jsonb_array_length(payload->'questions')=5)
);
CREATE TABLE IF NOT EXISTS public.quiz_question_registry (
  question_key TEXT PRIMARY KEY,
  quiz_date DATE NOT NULL REFERENCES daily_quizzes(quiz_date),
  slot INT NOT NULL CHECK(slot BETWEEN 1 AND 5),
  UNIQUE(quiz_date,slot)
);
ALTER TABLE public.daily_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_question_registry ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.daily_quizzes,public.quiz_question_registry FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.daily_quizzes TO authenticated;
DROP POLICY IF EXISTS daily_quizzes_read ON public.daily_quizzes;
CREATE POLICY daily_quizzes_read ON public.daily_quizzes FOR SELECT TO authenticated
  USING(quiz_date<=get_today_santiago());

CREATE OR REPLACE FUNCTION public.register_quiz_questions()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  INSERT INTO quiz_question_registry(question_key,quiz_date,slot)
  SELECT lower(regexp_replace(trim(q->>'question'),'\s+',' ','g')),NEW.quiz_date,n::INT
    FROM jsonb_array_elements(NEW.payload->'questions') WITH ORDINALITY AS t(q,n);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS register_quiz_questions ON public.daily_quizzes;
CREATE TRIGGER register_quiz_questions AFTER INSERT ON public.daily_quizzes
  FOR EACH ROW EXECUTE FUNCTION public.register_quiz_questions();

-- Only this RPC saves newly completed quizzes. Retry-safe, shared-world XP, no backfill.
CREATE OR REPLACE FUNCTION public.submit_daily_quiz(p_couple_id UUID,p_quiz_id TEXT,p_answers JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_today DATE := get_today_santiago(); v_payload JSONB; v_response quiz_responses;
  v_inserted BOOLEAN; v_reward JSONB; v_epoch TEXT;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM couples WHERE id=p_couple_id AND auth.uid() IN(user1_id,user2_id)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT payload INTO v_payload FROM daily_quizzes WHERE quiz_date=v_today;
  IF NOT FOUND OR p_quiz_id IS DISTINCT FROM v_payload->>'id' THEN
    RAISE EXCEPTION 'El cuestionario cambió o no está disponible. Recarga la página.';
  END IF;
  IF p_answers IS NULL OR jsonb_typeof(p_answers)<>'array' THEN RAISE EXCEPTION 'Responde las cinco preguntas'; END IF;
  IF jsonb_array_length(p_answers)<>5 OR EXISTS(
    SELECT 1 FROM jsonb_array_elements(p_answers) a WHERE a NOT IN('0'::JSONB,'1'::JSONB,'2'::JSONB,'3'::JSONB)
  ) THEN RAISE EXCEPTION 'Responde las cinco preguntas'; END IF;
  -- Lock before writing so both partners serialize XP and catalog rewards.
  PERFORM init_world(p_couple_id);
  SELECT COALESCE(onboarding_epoch::TEXT,'legacy') INTO v_epoch FROM world_states
    WHERE couple_id=p_couple_id FOR UPDATE;
  INSERT INTO quiz_responses(couple_id,quiz_date,user_id,answers)
    VALUES(p_couple_id,v_today,auth.uid(),p_answers)
    ON CONFLICT(couple_id,quiz_date,user_id) DO NOTHING RETURNING * INTO v_response;
  v_inserted := FOUND;
  IF v_inserted THEN
    v_reward := grant_world_xp(p_couple_id,'quiz_answer',
      'quiz:' || v_epoch || ':' || auth.uid()::TEXT || ':' || v_today::TEXT,20,'[]'::JSONB);
  ELSE
    SELECT * INTO v_response FROM quiz_responses
      WHERE couple_id=p_couple_id AND quiz_date=v_today AND user_id=auth.uid();
  END IF;
  RETURN jsonb_build_object('success',true,'response',to_jsonb(v_response),
    'xp_granted',COALESCE((v_reward->>'xp_granted')::INT,0),'already_answered',NOT v_inserted);
END;
$$;
REVOKE ALL ON FUNCTION public.register_quiz_questions() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.submit_daily_quiz(UUID,TEXT,JSONB) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_daily_quiz(UUID,TEXT,JSONB) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
