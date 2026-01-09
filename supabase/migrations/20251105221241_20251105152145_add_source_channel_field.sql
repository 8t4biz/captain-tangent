/*
  # Add Source/Channel Field for Conversion Tracking

  ## 1. New Column
    - `source` (text, nullable)
      - Tracks the origin/channel of conversions for each variant
      - Helps isolate which channels drive successful experiments
      - Predefined values: Twitter, Email, Slack, Direct, Referral, Organic, Paid, Other
      - Nullable to maintain backward compatibility with existing variants

  ## 2. Constraints
    - source is constrained to valid predefined values
    - Field is optional (nullable) - existing variants unaffected
    - No default value - users explicitly choose source when relevant

  ## 3. Important Notes
    - Optional field enables conversion source tracking without requiring updates to existing data
    - Predefined list balances structure with flexibility (Other as catch-all)
    - Supports filtering and analytics by channel
    - Visual badges will be added in UI for quick scanning
*/

-- Add source column (nullable, for tracking conversion channel/origin)
ALTER TABLE variants 
  ADD COLUMN IF NOT EXISTS source text;

-- Add check constraint for source to ensure valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_source'
  ) THEN
    ALTER TABLE variants 
      ADD CONSTRAINT valid_source 
      CHECK (source IS NULL OR source IN ('Twitter', 'Email', 'Slack', 'Direct', 'Referral', 'Organic', 'Paid', 'Other'));
  END IF;
END $$;