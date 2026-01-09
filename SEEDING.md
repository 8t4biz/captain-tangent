# Database Seeding Guide

This guide explains how to populate your MVP Decision Dashboard with test data for the Review workflow.

## Overview

The seed script creates three test variants in "Review" status, each demonstrating a different verdict outcome:

- **Campaign A**: 12% result vs 10% target → **Double-Down** (exceeds target)
- **Campaign B**: 8% result vs 10% target → **Iterate** (between 50%-100% of target)
- **Campaign C**: 3% result vs 10% target → **Kill** (below 50% of target)

## Prerequisites

- Access to your Supabase project dashboard
- The `variants` table must exist (run migrations first if needed)
- Admin/owner permissions on the Supabase project

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Navigate to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query** button (top right)

### 2. Load the Seed Script

1. Open the file `seed-test-data.sql` from your project root
2. Copy the entire contents
3. Paste into the SQL Editor query window

### 3. (Optional) Update the Week Field

The script uses a fixed date: `2025-11-04` (Monday, November 4, 2025)

**Option A: Update to Current Week (Recommended)**

1. Find the current week's Monday:
```sql
SELECT date_trunc('week', CURRENT_DATE)::date;
```

2. Replace all occurrences of `'2025-11-04'` in the seed script with the date returned

**Option B: Use Dynamic Insertion**

The seed script includes a commented-out section at the bottom that automatically uses the current week. To use it:
1. Comment out or delete the main INSERT statement (lines 54-119)
2. Uncomment the "ADVANCED: Dynamic Week Insertion" section at the bottom
3. Run the modified script

### 4. Run the Seed Script

1. Click **Run** button (or press Cmd/Ctrl + Enter)
2. Check the **Results** panel for success messages
3. You should see:
   ```
   ✅ Successfully seeded 3 test variants for Review status
      Campaign A: 12% result → expect Double-Down verdict
      Campaign B: 8% result → expect Iterate verdict
      Campaign C: 3% result → expect Kill verdict
   ```

### 5. Understand User ID Behavior

The `variants` table has a `user_id` column with default value `auth.uid()`.

**Normal Scenario (Running as Authenticated User):**
- The seed script will automatically use your logged-in user ID
- Seeded records will belong to you and be visible in your dashboard
- No additional configuration needed

**Troubleshooting: "null value in column user_id" Error**

This means you're running the script as the postgres service role without auth context.

**Solution:**
1. Find an existing user ID:
```sql
SELECT id, email FROM auth.users LIMIT 1;
```

2. Modify the seed script by adding `, user_id` to the column list and `, 'your-uuid'` to each VALUES entry

Or simply log into the Supabase dashboard as your user account and run the script normally.

## Verification

### Check in Supabase

Run this query to verify the data was inserted:

```sql
SELECT mvp, name, status, result, target, owner, week
FROM variants
WHERE owner IN ('Alice', 'Bob', 'Charlie')
ORDER BY result DESC;
```

You should see 3 rows with the test campaigns.

### Check in Your App

1. Open your MVP Decision Dashboard application
2. Navigate to the **Library** tab
3. You should see 3 variants with status "Review"
4. Navigate to the **Decisions** tab
5. If the week field matches the current week, you should see:
   - Campaign A in the **Double-Down** column
   - Campaign B in the **Iterate** column
   - Campaign C in the **Kill** column

### Week Filter Troubleshooting

The Decisions tab only shows variants where the `week` field matches the current week (Monday-Sunday).

If you don't see your test data:

1. Click **Show debug info** button in the Decisions tab
2. Check "Current week start (Monday)" date
3. Update your seeded data to match:

```sql
UPDATE variants
SET week = (SELECT date_trunc('week', CURRENT_DATE)::date)
WHERE owner IN ('Alice', 'Bob', 'Charlie');
```

## Testing the Workflow

Once seeded, you can test the decision workflow:

1. **Mark Decided**: Click on any campaign and use "Mark decided" button
2. **Edit Fields**: Update owner, due date, or next action inline
3. **Change Results**: Modify the result percentage to see verdict recalculation
4. **Duplicate**: Test the "Duplicate as iteration" feature

## Cleanup

To remove all test data:

```sql
DELETE FROM variants
WHERE owner IN ('Alice', 'Bob', 'Charlie');
```

Or to remove a specific campaign:

```sql
DELETE FROM variants
WHERE name = 'Campaign A' AND owner = 'Alice';
```

## Common Issues

### Error: "permission denied for table variants"

**Cause**: Row Level Security (RLS) policies are blocking insert/select.

**Solution**:
- Temporarily disable RLS: `ALTER TABLE variants DISABLE ROW LEVEL SECURITY;` (not recommended for production)
- Or update `user_id` as described in Step 5
- Or run the seed script as the postgres role (superuser)

### Error: "new row violates check constraint"

**Cause**: Your table has constraints that the seed data doesn't satisfy.

**Solution**: Check your table definition and adjust seed values accordingly:

```sql
\d variants
```

### Verdicts Not Calculating Correctly

**Cause**: The `verdict_manual` field might be set, overriding auto-calculation.

**Solution**: Clear manual verdicts:

```sql
UPDATE variants
SET verdict_manual = NULL
WHERE owner IN ('Alice', 'Bob', 'Charlie');
```

### Test Data Not Appearing in Decisions Tab

**Cause**: Week field doesn't match current week.

**Solution**: See "Week Filter Troubleshooting" section above.

## Advanced: Dynamic Seeding with Current Date

For fully automated seeding that always uses the current week:

```sql
INSERT INTO public.variants (mvp, name, status, metric, target, result, exposure_n, effort, channel, owner, due, next_action, notes)
SELECT
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
  current_week::text,
  'Scale to all users',
  'Landing page test with new headline.'
FROM (SELECT date_trunc('week', CURRENT_DATE)::date as current_week) AS week_data
UNION ALL
SELECT
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
  current_week::text,
  'Try new headline',
  'Form optimization test.'
FROM (SELECT date_trunc('week', CURRENT_DATE)::date as current_week) AS week_data
UNION ALL
SELECT
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
  current_week::text,
  'Document learnings',
  'Micro-app experiment.'
FROM (SELECT date_trunc('week', CURRENT_DATE)::date as current_week) AS week_data;
```

## Support

If you encounter issues not covered here:

1. Check the Supabase logs in Dashboard > Database > Logs
2. Verify your table schema matches the expected structure
3. Review RLS policies in Dashboard > Authentication > Policies
4. Check the browser console for frontend errors

---

**Quick Reference**: The seed script focuses exclusively on Review status variants because only these appear in the Decisions tab and trigger the verdict calculation logic (Double-Down / Iterate / Kill).
