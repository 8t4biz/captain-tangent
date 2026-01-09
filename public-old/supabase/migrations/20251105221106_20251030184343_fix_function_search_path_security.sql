/*
  # Fix Function Search Path Security Issue

  ## Overview
  Fixes the security vulnerability where the function `update_updated_at_column` 
  has a mutable search_path. This prevents potential SQL injection attacks.

  ## Changes
  - Drop and recreate the `update_updated_at_column()` function with a secure search_path
  - Set the search_path to empty string to prevent schema poisoning attacks
  - Fully qualify all references (e.g., pg_catalog.now() instead of now())

  ## Security
  - Implements immutable search_path to prevent malicious schema injection
  - Follows PostgreSQL security best practices for trigger functions
*/

-- Drop existing function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recreate function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

-- Recreate the trigger
CREATE TRIGGER update_variants_updated_at
  BEFORE UPDATE ON variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();