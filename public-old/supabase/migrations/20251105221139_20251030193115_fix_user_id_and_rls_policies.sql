/*
  # Fix user_id column and RLS policies

  ## Problem Summary
  The variants table has conflicting RLS policies and all existing data has null user_id values.
  This prevents authenticated users from accessing or modifying any data.

  ## 1. Changes to Data
    - Delete all existing variants with null user_id (test data that cannot be accessed)
    - This is safe because these are orphaned records that no user can access

  ## 2. Schema Changes
    - Make user_id column NOT NULL with a default value
    - The default ensures new records always have a user_id
    - Uses auth.uid() function to automatically set the current user

  ## 3. Security Changes (RLS Policies)
    - Drop ALL existing conflicting policies on variants table
    - Create clean, secure policies that:
      - Allow authenticated users to SELECT only their own variants (user_id = auth.uid())
      - Allow authenticated users to INSERT with their own user_id
      - Allow authenticated users to UPDATE only their own variants
      - Allow authenticated users to DELETE only their own variants
    - All policies enforce strict user_id matching for data isolation

  ## 4. Important Notes
    - After this migration, each user will only see their own variants
    - New variants will automatically get the correct user_id
    - The app will start fresh with no test data
    - Users must be authenticated to perform any operations
*/

-- Step 1: Clean up orphaned data with null user_id
DELETE FROM variants WHERE user_id IS NULL;

-- Step 2: Make user_id NOT NULL with a default
-- Set default to auth.uid() for automatic user_id assignment
ALTER TABLE variants 
  ALTER COLUMN user_id SET DEFAULT auth.uid(),
  ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Drop ALL existing RLS policies
DROP POLICY IF EXISTS "All users can view variants" ON variants;
DROP POLICY IF EXISTS "All users can create variants" ON variants;
DROP POLICY IF EXISTS "All users can update variants" ON variants;
DROP POLICY IF EXISTS "All users can delete variants" ON variants;
DROP POLICY IF EXISTS "Users can read own variants" ON variants;
DROP POLICY IF EXISTS "Users can insert own variants" ON variants;
DROP POLICY IF EXISTS "Users can update own variants" ON variants;
DROP POLICY IF EXISTS "Users can delete own variants" ON variants;
DROP POLICY IF EXISTS "Authenticated users can view all variants" ON variants;
DROP POLICY IF EXISTS "Authenticated users can create variants" ON variants;
DROP POLICY IF EXISTS "Authenticated users can update variants" ON variants;
DROP POLICY IF EXISTS "Authenticated users can delete variants" ON variants;
DROP POLICY IF EXISTS "Allow anonymous read access to variants" ON variants;
DROP POLICY IF EXISTS "Allow anonymous insert access to variants" ON variants;
DROP POLICY IF EXISTS "Allow anonymous update access to variants" ON variants;
DROP POLICY IF EXISTS "Allow anonymous delete access to variants" ON variants;

-- Step 4: Create clean, secure RLS policies

-- SELECT: Users can only read their own variants
CREATE POLICY "Users can read own variants"
  ON variants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can only create variants with their own user_id
CREATE POLICY "Users can insert own variants"
  ON variants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own variants
CREATE POLICY "Users can update own variants"
  ON variants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own variants
CREATE POLICY "Users can delete own variants"
  ON variants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);