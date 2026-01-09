/*
  # Fix RLS Policies for Anonymous Access

  ## Overview
  Updates Row Level Security policies on the variants table to allow anonymous (unauthenticated) users
  to perform all operations. This enables the MVP to function without requiring authentication.

  ## Changes Made
    1. Drop existing restrictive RLS policies that only allowed authenticated users
    2. Create new policies that allow both anonymous and authenticated users
    3. Maintain RLS enabled for future authentication implementation

  ## Security Impact
    - Anonymous users can now read, create, update, and delete variants
    - This is acceptable for MVP/demo purposes
    - RLS remains enabled for easy migration to user-specific access later

  ## Important Notes
    - All policies now use `TO anon, authenticated` instead of `TO authenticated`
    - This change allows the application to work without a login system
    - Future enhancement: Add user_id column and restrict access per user
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view all variants" ON variants;
DROP POLICY IF EXISTS "Authenticated users can create variants" ON variants;
DROP POLICY IF EXISTS "Authenticated users can update variants" ON variants;
DROP POLICY IF EXISTS "Authenticated users can delete variants" ON variants;

-- Create new policies that allow anonymous access

-- Allow all users (anon + authenticated) to select variants
CREATE POLICY "All users can view variants"
  ON variants
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow all users to insert variants
CREATE POLICY "All users can create variants"
  ON variants
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow all users to update variants
CREATE POLICY "All users can update variants"
  ON variants
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all users to delete variants
CREATE POLICY "All users can delete variants"
  ON variants
  FOR DELETE
  TO anon, authenticated
  USING (true);