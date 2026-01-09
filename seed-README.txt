Database Seeding Scripts Overview
=================================

This project includes two seed scripts for populating test data:

1. seed-test-data.sql
   - Default recommended script
   - Uses auth.uid() default value for user_id
   - Best for running while logged into Supabase dashboard
   - Simpler and cleaner

2. seed-test-data-with-user.sql
   - Alternative script with explicit user_id
   - Requires manual user ID replacement
   - Best for automated/scripted seeding
   - Use when running as service role

Quick Start
-----------
1. Open SEEDING.md for full step-by-step instructions
2. Use seed-test-data.sql if you're logged into Supabase
3. Update the week field to current Monday (see SEEDING.md)
4. Run the script in SQL Editor

Test Data Created
-----------------
- Campaign A: 12% result → Double-Down verdict
- Campaign B: 8% result → Iterate verdict
- Campaign C: 3% result → Kill verdict

All campaigns are set to Review status and week 2025-11-04.

Cleanup
-------
DELETE FROM variants WHERE owner IN ('Alice', 'Bob', 'Charlie');
