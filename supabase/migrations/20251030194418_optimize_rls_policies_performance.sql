/*
  # Optimize RLS Policies for Performance

  ## Overview
  This migration optimizes RLS policies by replacing `auth.uid()` calls with
  `(select auth.uid())` to prevent re-evaluation for each row, significantly
  improving query performance at scale.

  ## Changes
  1. Drop existing RLS policies that use direct `auth.uid()` calls
  2. Recreate policies with optimized `(select auth.uid())` subquery pattern
  3. This change reduces function calls from O(n) to O(1) per query

  ## Security
  - Maintains identical security constraints
  - Users can only access their own variants
  - All operations require authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own variants" ON variants;
DROP POLICY IF EXISTS "Users can insert own variants" ON variants;
DROP POLICY IF EXISTS "Users can update own variants" ON variants;
DROP POLICY IF EXISTS "Users can delete own variants" ON variants;

-- Recreate policies with optimized auth.uid() calls

-- SELECT: Users can only read their own variants
CREATE POLICY "Users can read own variants"
  ON variants
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- INSERT: Users can only create variants with their own user_id
CREATE POLICY "Users can insert own variants"
  ON variants
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own variants
CREATE POLICY "Users can update own variants"
  ON variants
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Users can only delete their own variants
CREATE POLICY "Users can delete own variants"
  ON variants
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
