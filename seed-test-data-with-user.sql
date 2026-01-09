/*
  # Test Data Seed Script with Explicit User ID

  This version explicitly sets the user_id field, making it suitable for
  running from the SQL Editor without authentication context.

  IMPORTANT: Replace 'YOUR_USER_ID_HERE' with an actual user UUID from your
  auth.users table before running this script.

  To find your user ID:
  SELECT id FROM auth.users WHERE email = 'your-email@example.com';

  Or to use the first available user:
  SELECT id FROM auth.users LIMIT 1;
*/

-- Find and display available user IDs
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;

  IF user_count = 0 THEN
    RAISE EXCEPTION 'No users found in auth.users. Please create a user account first.';
  END IF;

  RAISE NOTICE '📊 Found % user(s) in auth.users', user_count;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  BEFORE RUNNING THE INSERT:';
  RAISE NOTICE '   1. Run: SELECT id, email FROM auth.users;';
  RAISE NOTICE '   2. Copy a user ID from the results';
  RAISE NOTICE '   3. Replace YOUR_USER_ID_HERE in this script with that ID';
  RAISE NOTICE '';
END $$;

-- Verify table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'variants') THEN
    RAISE EXCEPTION 'Table "variants" does not exist. Please run your migrations first.';
  END IF;
END $$;

-- Insert test variants with explicit user_id
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
  notes,
  week,
  user_id
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
    'Landing page test with new headline. Strong performance across all segments.',
    '2025-11-04',
    'YOUR_USER_ID_HERE'::uuid
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
    'Form optimization test. Close to target but needs refinement. Consider A/B testing different CTAs.',
    '2025-11-04',
    'YOUR_USER_ID_HERE'::uuid
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
    'Micro-app experiment. Low engagement and high bounce rate. Key learning: audience prefers simpler experiences.',
    '2025-11-04',
    'YOUR_USER_ID_HERE'::uuid
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
  RAISE NOTICE '👤 User ID: Explicitly set (check if you replaced YOUR_USER_ID_HERE)';
END $$;
