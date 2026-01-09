/*
  # Add Effort and Confidence Fields to Variants

  1. New Columns
    - `effort` (text, nullable) - Effort level: S, M, L, or XL
    - `confidence` (integer, nullable) - Pre-test confidence level (0-100)

  2. Purpose
    - Support guided decision mode with simplified heuristic inputs
    - Allow users to track effort level for each variant
    - Allow users to record pre-test confidence levels for early-stage decisions

  3. Notes
    - Both fields are optional to maintain backward compatibility
    - These fields complement the statistical fields used by pro mode
    - effort constrained to: S (Small), M (Medium), L (Large), XL (Extra Large)
    - confidence constrained to range 0-100
    - No RLS changes needed as they inherit existing table policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'effort'
  ) THEN
    ALTER TABLE variants ADD COLUMN effort text CHECK (effort IN ('S', 'M', 'L', 'XL') OR effort IS NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'confidence'
  ) THEN
    ALTER TABLE variants ADD COLUMN confidence integer CHECK ((confidence >= 0 AND confidence <= 100) OR confidence IS NULL);
  END IF;
END $$;