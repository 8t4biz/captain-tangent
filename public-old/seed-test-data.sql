/*
  # Test Data Seed Script for MVP Decision Dashboard

  ## Purpose
  This script seeds the database with three test variants in "Review" status
  to demonstrate the verdict calculation logic and decision workflow.

  ## Auto-Verdict Logic
  The app automatically calculates verdicts based on result vs target:
  - result >= target → Double-Down
  - result <= target * 0.5 → Kill
  - Otherwise → Iterate

  ## Test Data Overview
  1. Campaign A: 12% result vs 10% target → Double-Down (exceeds target)
  2. Campaign B: 8% result vs 10% target → Iterate (between 50%-100% of target)
  3. Campaign C: 3% result vs 10% target → Kill (below 50% of target)

  ## Week Field
  The week field is set to '2025-11-04' (Monday, November 4, 2025).

  To use the current week instead:
  1. Find your current Monday:
     SELECT date_trunc('week', CURRENT_DATE)::date;

  2. Replace all occurrences of '2025-11-04' in the VALUES section with
     the date from step 1

  Or use dynamic insertion (see Advanced section at bottom of this file)

  ## User ID Handling
  The table has user_id with default value auth.uid(), which means:
  - If you run this script while logged into the Supabase SQL Editor as an
    authenticated user, user_id will be automatically populated with your user ID
  - The seeded records will be visible only to you due to RLS policies

  If you get an error "null value in column user_id violates not-null constraint":
  1. You are running the script as postgres/service role without auth context
  2. Find an existing user UUID:
     SELECT id FROM auth.users LIMIT 1;

  3. Modify the INSERT to explicitly set user_id:
     Add this line after "notes" in the column list:
     , user_id

     And add this value at the end of each VALUES row:
     , 'your-uuid-here'

  ## Cleanup
  To remove test data later:
  DELETE FROM variants WHERE owner IN ('Alice', 'Bob', 'Charlie');
*/

-- Verify table exists (this will not create it, just check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'variants') THEN
    RAISE EXCEPTION 'Table "variants" does not exist. Please run your migrations first.';
  END IF;
END $$;

-- Insert test variants for Review status
INSERT INTO public.variants (
  mvp,
  name,
  status,
  metric,
  target,
  result,
  exposure_n,
  effort,
  channel,
  owner,
  due,
  next_action,
  notes
)
VALUES
  -- Campaign A: Should trigger "Double-Down" (result 12% >= target 10%)
  (
    'PRJ1000',
    'Campaign A',
    'Review',
    'Conversion',
    10,
    12,
    150,
    'S',
    'Twitter',
    'Alice',
    '2025-11-04',
    'Scale to all users',
    'Landing page test with new headline. Strong performance across all segments.'
  ),

  -- Campaign B: Should trigger "Iterate" (result 8% is between 5% and 10%)
  (
    'PRJ1000',
    'Campaign B',
    'Review',
    'Conversion',
    10,
    8,
    150,
    'M',
    'Email',
    'Bob',
    '2025-11-04',
    'Try new headline',
    'Form optimization test. Close to target but needs refinement. Consider A/B testing different CTAs.'
  ),

  -- Campaign C: Should trigger "Kill" (result 3% <= target * 0.5 = 5%)
  (
    'PRJ1000',
    'Campaign C',
    'Review',
    'Conversion',
    10,
    3,
    50,
    'L',
    'Paid',
    'Charlie',
    '2025-11-04',
    'Document learnings',
    'Micro-app experiment. Low engagement and high bounce rate. Key learning: audience prefers simpler experiences.'
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully seeded 3 test variants for Review status';
  RAISE NOTICE '   Campaign A: 12%% result → expect Double-Down verdict';
  RAISE NOTICE '   Campaign B: 8%% result → expect Iterate verdict';
  RAISE NOTICE '   Campaign C: 3%% result → expect Kill verdict';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Week field set to: 2025-11-04';
  RAISE NOTICE '   Update this date if needed (must be a Monday)';
  RAISE NOTICE '';
  RAISE NOTICE '👤 User ID: Auto-populated via auth.uid() default';
END $$;

-- ============================================================================
-- ADVANCED: Dynamic Week Insertion
-- ============================================================================
-- Uncomment this section if you want to use the current week automatically:
/*
INSERT INTO public.variants (mvp, name, status, metric, target, result, exposure_n, effort, channel, owner, due, next_action, notes, week)
SELECT
  'PRJ1000', 'Campaign A', 'Review', 'Conversion', 10, 12, 150, 'S', 'Twitter', 'Alice',
  current_week, 'Scale to all users',
  'Landing page test with new headline. Strong performance across all segments.',
  current_week
FROM (SELECT date_trunc('week', CURRENT_DATE)::date as current_week) w
UNION ALL
SELECT
  'PRJ1000', 'Campaign B', 'Review', 'Conversion', 10, 8, 150, 'M', 'Email', 'Bob',
  current_week, 'Try new headline',
  'Form optimization test. Close to target but needs refinement.',
  current_week
FROM (SELECT date_trunc('week', CURRENT_DATE)::date as current_week) w
UNION ALL
SELECT
  'PRJ1000', 'Campaign C', 'Review', 'Conversion', 10, 3, 50, 'L', 'Paid', 'Charlie',
  current_week, 'Document learnings',
  'Micro-app experiment. Low engagement and high bounce rate.',
  current_week
FROM (SELECT date_trunc('week', CURRENT_DATE)::date as current_week) w;
*/
