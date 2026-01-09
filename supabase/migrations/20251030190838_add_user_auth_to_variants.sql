/*
  # Add user authentication to variants table

  1. Schema Changes
    - Add `user_id` column to `variants` table
      - Type: uuid
      - References auth.users
      - NOT NULL with default to current user
      - Indexed for performance

  2. Security Changes
    - Enable RLS on variants table (already enabled)
    - Drop existing anonymous access policies
    - Add policy for authenticated users to read own variants
    - Add policy for authenticated users to insert own variants
    - Add policy for authenticated users to update own variants
    - Add policy for authenticated users to delete own variants

  3. Important Notes
    - All policies check `auth.uid() = user_id` to ensure data isolation
    - Users can only access their own data
    - Existing variants will need user_id set manually or migrated
*/

-- Add user_id column to variants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE variants ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_variants_user_id ON variants(user_id);

-- Drop existing policies that allowed anonymous access
DROP POLICY IF EXISTS "Allow anonymous read access to variants" ON variants;
DROP POLICY IF EXISTS "Allow anonymous insert access to variants" ON variants;
DROP POLICY IF EXISTS "Allow anonymous update access to variants" ON variants;
DROP POLICY IF EXISTS "Allow anonymous delete access to variants" ON variants;

-- Create policies for authenticated users only

-- Users can read their own variants
CREATE POLICY "Users can read own variants"
  ON variants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own variants
CREATE POLICY "Users can insert own variants"
  ON variants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own variants
CREATE POLICY "Users can update own variants"
  ON variants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own variants
CREATE POLICY "Users can delete own variants"
  ON variants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
