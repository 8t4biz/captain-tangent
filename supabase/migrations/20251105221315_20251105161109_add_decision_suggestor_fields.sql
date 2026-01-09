/*
  # Add Decision Suggestor Fields

  1. New Columns
    - `exposure_n` (integer, nullable) - Sample size for statistical significance testing
    - `baseline_pct` (numeric, nullable) - Baseline percentage for uplift calculations
    - `decision_rule` (jsonb, nullable) - Stores decision rule configuration with mode and thresholds
  
  2. Purpose
    - Enable statistical guardrails for decision suggestions
    - Support confidence interval and hypothesis testing calculations
    - Allow per-variant decision rule configuration for flexible analysis
  
  3. Notes
    - All fields are optional to maintain backward compatibility
    - exposure_n is used as sample size guard (minimum 30 recommended)
    - baseline_pct enables uplift-based decision rules
    - decision_rule stores: { mode: 'absolute' | 'uplift' | 'uplift+sig', thresholdPct: number, sig?: number }
*/

-- Add exposure_n column for sample size tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'exposure_n'
  ) THEN
    ALTER TABLE variants ADD COLUMN exposure_n integer;
  END IF;
END $$;

-- Add baseline_pct column for uplift calculations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'baseline_pct'
  ) THEN
    ALTER TABLE variants ADD COLUMN baseline_pct numeric;
  END IF;
END $$;

-- Add decision_rule column for rule configuration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'decision_rule'
  ) THEN
    ALTER TABLE variants ADD COLUMN decision_rule jsonb;
  END IF;
END $$;