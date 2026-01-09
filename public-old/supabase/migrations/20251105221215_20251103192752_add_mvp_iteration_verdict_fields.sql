/*
  # Add MVP, Iteration, and Manual Verdict fields

  ## 1. New Columns
    - `mvp` (text, NOT NULL, default '')
      - Identifies which MVP/product area this variant belongs to
      - Examples: "Paywall", "Onboarding", "Pricing"
    
    - `iteration` (integer, default 1)
      - Tracks version number when duplicating variants
      - Increments each time a variant is duplicated
    
    - `verdict_manual` (text, nullable)
      - Allows manual override of auto-calculated verdict
      - Possible values: 'Double-Down', 'Iterate', 'Kill', or NULL (auto)
      - When NULL, verdict is calculated automatically from result vs target

  ## 2. Important Notes
    - mvp is required to help organize variants by product area
    - iteration defaults to 1 for new variants
    - verdict_manual being NULL means use auto-calculation
    - These fields enhance the MVP decision-making workflow
*/

-- Add mvp column (required field, default to empty string for existing rows)
ALTER TABLE variants 
  ADD COLUMN IF NOT EXISTS mvp text NOT NULL DEFAULT '';

-- Add iteration column (tracks version numbers, default to 1)
ALTER TABLE variants 
  ADD COLUMN IF NOT EXISTS iteration integer DEFAULT 1;

-- Add verdict_manual column (nullable, allows manual verdict override)
ALTER TABLE variants 
  ADD COLUMN IF NOT EXISTS verdict_manual text;

-- Add check constraint for verdict_manual to ensure valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_verdict_manual'
  ) THEN
    ALTER TABLE variants 
      ADD CONSTRAINT valid_verdict_manual 
      CHECK (verdict_manual IS NULL OR verdict_manual IN ('Double-Down', 'Iterate', 'Kill'));
  END IF;
END $$;