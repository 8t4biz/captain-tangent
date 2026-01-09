# Database Seeding Implementation Summary

## What Was Created

This implementation provides a complete database seeding solution for the MVP Decision Dashboard, focused on testing the Review workflow and verdict calculation logic.

### Files Created

1. **seed-test-data.sql** (170 lines)
   - Primary seed script using auth.uid() default
   - Creates 3 test variants in Review status
   - Includes validation checks and success messages
   - Contains advanced dynamic date insertion option

2. **seed-test-data-with-user.sql** (131 lines)
   - Alternative script with explicit user_id
   - For use when auth context is unavailable
   - Requires manual user ID replacement

3. **SEEDING.md** (261 lines)
   - Complete step-by-step documentation
   - Troubleshooting guide for common issues
   - Verification procedures
   - Week field update instructions

4. **seed-README.txt** (34 lines)
   - Quick reference guide
   - Overview of available scripts
   - Basic usage instructions

## Test Data Design

### Three Campaign Variants

All campaigns target **10% conversion** and are set to **Review status** for **week 2025-11-04**:

| Campaign | Result | Exposure | Effort | Channel | Owner | Expected Verdict |
|----------|--------|----------|--------|---------|-------|------------------|
| A        | 12%    | 150      | S      | Twitter | Alice | **Double-Down** (exceeds target) |
| B        | 8%     | 150      | M      | Email   | Bob   | **Iterate** (50-100% of target) |
| C        | 3%     | 50       | L      | Paid    | Charlie | **Kill** (< 50% of target) |

### Verdict Calculation Logic

The test data demonstrates the auto-verdict algorithm from `src/lib/utils.ts`:

```
result >= target        → Double-Down
result <= target * 0.5  → Kill
Otherwise               → Iterate
```

## Key Features

### 1. Flexible Date Handling

**Fixed Date Approach:**
- Uses `2025-11-04` by default for reproducibility
- Easy to update via find-and-replace

**Dynamic Date Option:**
- Commented-out section at bottom of main script
- Automatically uses current week Monday
- Uncomment to enable

### 2. User ID Management

**Automatic (Recommended):**
- Script relies on `auth.uid()` default value
- Works when logged into Supabase dashboard
- Cleanest approach

**Manual (Alternative):**
- Use `seed-test-data-with-user.sql`
- Replace `YOUR_USER_ID_HERE` with actual UUID
- For scripted/automated seeding

### 3. Validation & Safety

- Table existence check before insertion
- User count verification with helpful messages
- Success notifications with expected verdicts
- Clear error messages for troubleshooting

## Usage Workflow

### Quick Start (5 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `seed-test-data.sql`
3. Update week field to current Monday (optional)
4. Run script
5. Verify in application's Decisions tab

### Verification Steps

**In Supabase:**
```sql
SELECT mvp, name, status, result, target, owner, week
FROM variants
WHERE owner IN ('Alice', 'Bob', 'Charlie')
ORDER BY result DESC;
```

**In Application:**
- Open Library tab → see 3 Review variants
- Open Decisions tab → see campaigns grouped by verdict
  - Campaign A in Double-Down column
  - Campaign B in Iterate column
  - Campaign C in Kill column

### Cleanup

```sql
DELETE FROM variants
WHERE owner IN ('Alice', 'Bob', 'Charlie');
```

## Technical Decisions

### Why Review Status Only?

- Only Review variants appear in Decisions tab
- Only Review triggers verdict calculation/display
- Keeps test data focused and relevant
- Other statuses can be added in separate workflow tests

### Why Fixed Week Date?

- Reproducible test results
- Easier to share and document
- Simple find-and-replace to update
- Dynamic option available for automation

### Why Three Campaigns?

- Demonstrates all three verdict outcomes
- Minimal but complete test coverage
- Easy to understand and manage
- Sufficient for workflow validation

## Integration Points

### Database Schema
- Compatible with current `variants` table structure
- Uses proper constraints (status, effort, channel enums)
- Respects RLS policies via user_id

### Frontend Application
- Variants fetched via `useVariants()` hook
- Verdict calculated by `verdictOf()` function
- Filtered in Decisions tab by `isSameCalendarWeek()`

### Verdict Logic
- Matches `autoVerdict()` implementation in `src/lib/utils.ts`
- Result vs target comparison
- No manual verdict override (tests auto-calculation)

## Troubleshooting Reference

### Common Issues

**"null value in column user_id"**
- Running as service role without auth
- Solution: Use `seed-test-data-with-user.sql` or log in first

**"permission denied for table variants"**
- RLS policies blocking access
- Solution: Run as authenticated user or update user_id

**Variants not in Decisions tab**
- Week field doesn't match current week
- Solution: Update week field or use "Show all review items" toggle

**Wrong verdict displayed**
- Manual verdict might be set
- Solution: `UPDATE variants SET verdict_manual = NULL WHERE ...`

## Next Steps

### Extending Test Data

To add more test scenarios:

1. **Different Metrics**: Add variants with CTR, Signup, Revenue metrics
2. **Different Statuses**: Create separate seed script for Inbox/Running/Decided workflow
3. **Edge Cases**: Add variants with null results, extreme values, etc.
4. **Multiple MVPs**: Add variants with different MVP codes for filtering tests
5. **Decision Rules**: Add variants with custom decision_rule JSON for advanced logic

### Automation Ideas

1. Create npm script: `"seed:dev": "supabase db reset && supabase db push"`
2. Add to CI/CD pipeline for E2E tests
3. Generate seed data programmatically based on templates
4. Add faker.js for realistic names and notes

## Files Reference

```
project/
├── seed-test-data.sql                 ← Primary seed script
├── seed-test-data-with-user.sql       ← Alternative with explicit user_id
├── SEEDING.md                         ← Full documentation
└── seed-README.txt                    ← Quick reference
```

## Success Criteria

✅ Seed script creates exactly 3 variants
✅ All variants have Review status
✅ Results trigger correct verdicts (12% → Double-Down, 8% → Iterate, 3% → Kill)
✅ Variants appear in Library tab
✅ Variants appear in Decisions tab (when week matches)
✅ Campaigns can be edited, duplicated, marked decided
✅ Cleanup script removes all test data

---

**Implementation Date**: November 5, 2025
**Database**: Supabase PostgreSQL
**Application**: MVP Decision Dashboard (React + TypeScript + Vite)
