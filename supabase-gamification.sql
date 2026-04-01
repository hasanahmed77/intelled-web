-- ============================================================
-- Gamification System
-- XP / Levels / Badges / Weekly Challenges / Leaderboard
-- Run AFTER supabase-streak.sql
-- ============================================================

-- 1. Add XP and level columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS total_xp  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level     INT NOT NULL DEFAULT 1;

-- 2. Badges catalogue (static metadata lives in TypeScript; this is just the join table)
CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id   TEXT NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- 3. Weekly challenge progress (one row per user per week)
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start      DATE NOT NULL,              -- always a Monday
  challenge_index INT  NOT NULL,              -- 0-11 cycling
  progress        INT  NOT NULL DEFAULT 0,    -- current count toward goal
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  UNIQUE (user_id, week_start)
);

-- ============================================================
-- 4. Gamification trigger function
-- Fires AFTER streak trigger (alphabetically later trigger name)
-- ============================================================
CREATE OR REPLACE FUNCTION process_attempt_gamification()
RETURNS TRIGGER AS $$
DECLARE
  v_score         INT := COALESCE(NEW.score, 0);
  v_xp_earned     INT;
  v_total_xp      INT;
  v_new_level     INT;
  v_cur_streak    INT;
  v_today         DATE := CURRENT_DATE;
  v_week_start    DATE;
  v_challenge_idx INT;
  v_goal          INT;
  v_metric        TEXT;
  v_progress_val  INT;
  v_progress_now  INT;
  v_already_done  BOOLEAN;
  v_attempts_today INT;

  -- Level thresholds (index = level - 1)
  v_thresholds INT[] := ARRAY[0, 100, 250, 500, 900, 1400, 2000, 3000, 5000];
  v_i          INT;
BEGIN
  -- ── XP ──────────────────────────────────────────────────────
  v_xp_earned := 10 + (v_score / 10);

  UPDATE profiles
     SET total_xp = total_xp + v_xp_earned
   WHERE id = NEW.user_id
  RETURNING total_xp INTO v_total_xp;

  -- ── Level ────────────────────────────────────────────────────
  v_new_level := 1;
  FOR v_i IN 1..9 LOOP
    IF v_total_xp >= v_thresholds[v_i] THEN
      v_new_level := v_i;
    END IF;
  END LOOP;

  UPDATE profiles SET level = v_new_level WHERE id = NEW.user_id;

  -- ── Current streak (already updated by streak trigger) ───────
  SELECT current_streak INTO v_cur_streak FROM profiles WHERE id = NEW.user_id;

  -- ── Badges ───────────────────────────────────────────────────
  -- first_step: first ever attempt
  IF (SELECT COUNT(*) FROM worksheet_attempts WHERE user_id = NEW.user_id) = 1 THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'first_step') ON CONFLICT DO NOTHING;
  END IF;

  -- on_a_roll: 5 attempts total
  IF (SELECT COUNT(*) FROM worksheet_attempts WHERE user_id = NEW.user_id) >= 5 THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'on_a_roll') ON CONFLICT DO NOTHING;
  END IF;

  -- century: 100 attempts total
  IF (SELECT COUNT(*) FROM worksheet_attempts WHERE user_id = NEW.user_id) >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'century') ON CONFLICT DO NOTHING;
  END IF;

  -- sharp_mind: score >= 80
  IF v_score >= 80 THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'sharp_mind') ON CONFLICT DO NOTHING;
  END IF;

  -- perfectionist: score = 100
  IF v_score = 100 THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'perfectionist') ON CONFLICT DO NOTHING;
  END IF;

  -- flawless: 3 scores of 100 total
  IF (SELECT COUNT(*) FROM worksheet_attempts WHERE user_id = NEW.user_id AND score = 100) >= 3 THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'flawless') ON CONFLICT DO NOTHING;
  END IF;

  -- streak badges
  IF v_cur_streak >= 3 THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'on_fire') ON CONFLICT DO NOTHING;
  END IF;
  IF v_cur_streak >= 7 THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'unstoppable') ON CONFLICT DO NOTHING;
  END IF;
  IF v_cur_streak >= 30 THEN
    INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'immortal') ON CONFLICT DO NOTHING;
  END IF;

  -- level badges
  IF v_new_level >= 2 THEN INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'lvl_scholar')    ON CONFLICT DO NOTHING; END IF;
  IF v_new_level >= 3 THEN INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'lvl_thinker')    ON CONFLICT DO NOTHING; END IF;
  IF v_new_level >= 4 THEN INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'lvl_achiever')   ON CONFLICT DO NOTHING; END IF;
  IF v_new_level >= 5 THEN INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'lvl_expert')     ON CONFLICT DO NOTHING; END IF;
  IF v_new_level >= 6 THEN INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'lvl_elite')      ON CONFLICT DO NOTHING; END IF;
  IF v_new_level >= 7 THEN INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'lvl_master')     ON CONFLICT DO NOTHING; END IF;
  IF v_new_level >= 8 THEN INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'lvl_legend')     ON CONFLICT DO NOTHING; END IF;
  IF v_new_level >= 9 THEN INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'lvl_supersaiyan') ON CONFLICT DO NOTHING; END IF;

  -- ── Weekly Challenge ─────────────────────────────────────────
  -- Week start = most recent Monday
  v_week_start    := v_today - ((EXTRACT(DOW FROM v_today)::INT + 6) % 7);
  -- Challenge index cycles 0-11 based on weeks since 2024-01-01 (a Monday)
  v_challenge_idx := ((v_week_start - DATE '2024-01-01') / 7) % 12;

  -- Ensure row exists
  INSERT INTO user_challenge_progress (user_id, week_start, challenge_index, progress)
    VALUES (NEW.user_id, v_week_start, v_challenge_idx, 0)
    ON CONFLICT (user_id, week_start) DO NOTHING;

  SELECT completed INTO v_already_done
    FROM user_challenge_progress
   WHERE user_id = NEW.user_id AND week_start = v_week_start;

  IF NOT v_already_done THEN
    -- Determine what to count for this challenge
    -- 0: submit 5 worksheets        goal=5  metric=attempts
    -- 1: 3 scores >= 80%            goal=3  metric=score80
    -- 2: 3-day streak               goal=3  metric=streak
    -- 3: submit 10 worksheets       goal=10 metric=attempts
    -- 4: score 100%                 goal=1  metric=score100
    -- 5: 5 scores >= 70%            goal=5  metric=score70
    -- 6: 3 worksheets in one day    goal=3  metric=today
    -- 7: 5 scores >= 90%            goal=5  metric=score90
    -- 8: submit 7 worksheets        goal=7  metric=attempts
    -- 9: 3 scores >= 85%            goal=3  metric=score85
    -- 10: 5-day streak              goal=5  metric=streak
    -- 11: two 100% scores           goal=2  metric=score100

    CASE v_challenge_idx
      WHEN 0 THEN
        v_goal := 5; v_metric := 'attempts';
      WHEN 1 THEN
        v_goal := 3; v_metric := 'score80';
      WHEN 2 THEN
        v_goal := 3; v_metric := 'streak';
      WHEN 3 THEN
        v_goal := 10; v_metric := 'attempts';
      WHEN 4 THEN
        v_goal := 1; v_metric := 'score100';
      WHEN 5 THEN
        v_goal := 5; v_metric := 'score70';
      WHEN 6 THEN
        v_goal := 3; v_metric := 'today';
      WHEN 7 THEN
        v_goal := 5; v_metric := 'score90';
      WHEN 8 THEN
        v_goal := 7; v_metric := 'attempts';
      WHEN 9 THEN
        v_goal := 3; v_metric := 'score85';
      WHEN 10 THEN
        v_goal := 5; v_metric := 'streak';
      WHEN 11 THEN
        v_goal := 2; v_metric := 'score100';
      ELSE
        v_goal := 5; v_metric := 'attempts';
    END CASE;

    -- Compute current progress value
    IF v_metric = 'attempts' THEN
      SELECT COUNT(*) INTO v_progress_val
        FROM worksheet_attempts
       WHERE user_id = NEW.user_id
         AND created_at >= v_week_start
         AND created_at <  v_week_start + INTERVAL '7 days';

    ELSIF v_metric = 'score80' THEN
      SELECT COUNT(*) INTO v_progress_val
        FROM worksheet_attempts
       WHERE user_id = NEW.user_id
         AND score >= 80
         AND created_at >= v_week_start
         AND created_at <  v_week_start + INTERVAL '7 days';

    ELSIF v_metric = 'score70' THEN
      SELECT COUNT(*) INTO v_progress_val
        FROM worksheet_attempts
       WHERE user_id = NEW.user_id
         AND score >= 70
         AND created_at >= v_week_start
         AND created_at <  v_week_start + INTERVAL '7 days';

    ELSIF v_metric = 'score85' THEN
      SELECT COUNT(*) INTO v_progress_val
        FROM worksheet_attempts
       WHERE user_id = NEW.user_id
         AND score >= 85
         AND created_at >= v_week_start
         AND created_at <  v_week_start + INTERVAL '7 days';

    ELSIF v_metric = 'score90' THEN
      SELECT COUNT(*) INTO v_progress_val
        FROM worksheet_attempts
       WHERE user_id = NEW.user_id
         AND score >= 90
         AND created_at >= v_week_start
         AND created_at <  v_week_start + INTERVAL '7 days';

    ELSIF v_metric = 'score100' THEN
      SELECT COUNT(*) INTO v_progress_val
        FROM worksheet_attempts
       WHERE user_id = NEW.user_id
         AND score = 100
         AND created_at >= v_week_start
         AND created_at <  v_week_start + INTERVAL '7 days';

    ELSIF v_metric = 'streak' THEN
      v_progress_val := v_cur_streak;

    ELSIF v_metric = 'today' THEN
      SELECT COUNT(*) INTO v_progress_val
        FROM worksheet_attempts
       WHERE user_id = NEW.user_id
         AND created_at::DATE = v_today;
    END IF;

    v_progress_now := LEAST(v_progress_val, v_goal);

    UPDATE user_challenge_progress
       SET progress     = v_progress_now,
           completed    = (v_progress_now >= v_goal),
           completed_at = CASE WHEN v_progress_now >= v_goal AND completed_at IS NULL THEN NOW() ELSE completed_at END
     WHERE user_id = NEW.user_id AND week_start = v_week_start;

    -- Badge for completing the weekly challenge
    IF v_progress_now >= v_goal THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (NEW.user_id, 'weekly_warrior') ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach trigger (fires after streak trigger alphabetically)
DROP TRIGGER IF EXISTS on_attempt_gamification ON worksheet_attempts;

CREATE TRIGGER on_attempt_gamification
  AFTER INSERT ON worksheet_attempts
  FOR EACH ROW
  EXECUTE FUNCTION process_attempt_gamification();

-- ============================================================
-- 6. Leaderboard function (SECURITY DEFINER — bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  rank          BIGINT,
  display_name  TEXT,
  attempt_count BIGINT,
  avg_score     NUMERIC,
  current_streak INT,
  level         INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY COUNT(a.id) DESC, ROUND(AVG(a.score), 1) DESC) AS rank,
    COALESCE(NULLIF(TRIM(p.full_name), ''), SPLIT_PART(u.email, '@', 1)) AS display_name,
    COUNT(a.id)                    AS attempt_count,
    ROUND(AVG(a.score), 1)         AS avg_score,
    p.current_streak,
    p.level
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN worksheet_attempts a ON a.user_id = p.id
  GROUP BY p.id, p.full_name, u.email, p.current_streak, p.level
  ORDER BY attempt_count DESC, avg_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant anonymous access to the function
GRANT EXECUTE ON FUNCTION get_leaderboard() TO anon, authenticated;
