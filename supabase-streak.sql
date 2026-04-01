-- ============================================================
-- Streak System
-- Tracks daily practice streaks on the profiles table.
-- A streak increments when a user submits any worksheet attempt.
-- Missing a day resets the streak to 1.
-- ============================================================

-- 1. Add streak columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_streak  INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak  INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- 2. Trigger function — fires after every worksheet_attempts INSERT
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  today         DATE := CURRENT_DATE;
  last_activity DATE;
  cur_streak    INT;
  lon_streak    INT;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
    INTO last_activity, cur_streak, lon_streak
    FROM profiles
   WHERE id = NEW.user_id;

  -- Already practiced today — nothing to do
  IF last_activity = today THEN
    RETURN NEW;
  END IF;

  -- Practiced yesterday — extend the streak
  IF last_activity = today - INTERVAL '1 day' THEN
    cur_streak := cur_streak + 1;
  ELSE
    -- Missed one or more days (or first ever attempt) — reset
    cur_streak := 1;
  END IF;

  lon_streak := GREATEST(lon_streak, cur_streak);

  UPDATE profiles
     SET current_streak     = cur_streak,
         longest_streak     = lon_streak,
         last_activity_date = today
   WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to worksheet_attempts
DROP TRIGGER IF EXISTS on_attempt_created ON worksheet_attempts;

CREATE TRIGGER on_attempt_created
  AFTER INSERT ON worksheet_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();
