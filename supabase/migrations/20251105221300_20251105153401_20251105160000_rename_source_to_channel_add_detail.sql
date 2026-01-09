/*
  # Rename source to channel and add channel_detail field

  ## 1. Changes
    - Rename `source` column to `channel` for clarity
    - Add `channel_detail` (text, nullable) for additional context like "List A", "IH DMs"
    - Update constraint to new column name with expanded channel types
    - Maintain backward compatibility - both fields nullable

  ## 2. New Columns
    - `channel` (text, nullable)
      - Renamed from `source`
      - Valid values: Twitter, Email, Slack group, Direct outreach, Referral, Organic, Paid, Other
      - Tracks the marketing/distribution channel for each experiment
    
    - `channel_detail` (text, nullable)
      - Free-text field for additional channel context
      - Examples: "List A", "IndieHackers DM", "Cohort 2", "Product Hunt"
      - Complements channel with specific campaign or segment info

  ## 3. Important Notes
    - Existing data in `source` column will be preserved in `channel`
    - No data loss during migration
    - Both fields remain optional for backward compatibility
    - Updated constraint uses expanded channel names for clarity
*/

-- Rename source column to channel
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'variants' AND column_name = 'source'
  ) THEN
    ALTER TABLE variants RENAME COLUMN source TO channel;
  END IF;
END $$;

-- Drop old constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_source'
  ) THEN
    ALTER TABLE variants DROP CONSTRAINT valid_source;
  END IF;
END $$;

-- Add channel_detail column (nullable, for additional channel context)
ALTER TABLE variants 
  ADD COLUMN IF NOT EXISTS channel_detail text;

-- Add new check constraint for channel with expanded names
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_channel'
  ) THEN
    ALTER TABLE variants 
      ADD CONSTRAINT valid_channel 
      CHECK (channel IS NULL OR channel IN ('Twitter', 'Email', 'Slack group', 'Direct outreach', 'Referral', 'Organic', 'Paid', 'Other'));
  END IF;
END $$;