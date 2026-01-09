/*
  # Create variants table for MVP Decision Dashboard

  ## Overview
  Single table to store all variant experiments with their metrics, targets, and decision data.

  ## 1. New Tables
    - `variants`
      - `id` (uuid, primary key) - Unique identifier for each variant
      - `name` (text) - Display name of the variant/experiment
      - `status` (text) - Current state: Inbox, Running, Review, or Decided
      - `metric` (text) - What we're measuring (e.g., "Conversion %")
      - `target` (numeric) - Target percentage for success
      - `result` (numeric, nullable) - Actual percentage achieved
      - `week` (date) - Monday of the decision week
      - `verdict` (text, nullable) - Override verdict: Double-Down, Iterate, Kill, or —
      - `next_action` (text, nullable) - What to do next
      - `owner` (text, nullable) - Who's responsible
      - `due` (date, nullable) - When action is due
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
    - Enable RLS on `variants` table
    - For MVP, allow all authenticated users to read/write their variants
    - Policies enforce authentication for all operations

  ## 3. Important Notes
    - Status values constrained to: 'Inbox', 'Running', 'Review', 'Decided'
    - Verdict values constrained to: 'Double-Down', 'Iterate', 'Kill', '—'
    - Week dates should be Mondays for consistency
    - Updated_at automatically updates on row changes
*/

CREATE TABLE IF NOT EXISTS variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'Inbox',
  metric text NOT NULL,
  target numeric NOT NULL,
  result numeric,
  week date NOT NULL,
  verdict text,
  next_action text,
  owner text,
  due date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT status_check CHECK (status IN ('Inbox', 'Running', 'Review', 'Decided')),
  CONSTRAINT verdict_check CHECK (verdict IN ('Double-Down', 'Iterate', 'Kill', '—') OR verdict IS NULL)
);

-- Enable RLS
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select their variants
-- For MVP simplicity, all authenticated users can see all variants
CREATE POLICY "Authenticated users can view all variants"
  ON variants
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert variants
CREATE POLICY "Authenticated users can create variants"
  ON variants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update variants
CREATE POLICY "Authenticated users can update variants"
  ON variants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete variants
CREATE POLICY "Authenticated users can delete variants"
  ON variants
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_variants_updated_at
  BEFORE UPDATE ON variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO variants (name, status, metric, target, result, week, next_action, owner, due) VALUES
  ('Paywall: 7-day trial', 'Review', 'Free→Paid %', 12, 10, '2025-10-27', 'Ship to 100% if ≥12%', 'You', '2025-10-31'),
  ('Onboarding checklist v2', 'Review', 'Activation %', 40, 38, '2025-10-27', 'Add tooltip on step 2', 'You', '2025-11-01'),
  ('Pricing: $9 → $12', 'Running', 'MRR %', 15, NULL, '2025-11-03', 'Finish A/B split', 'You', '2025-11-05')
ON CONFLICT DO NOTHING;
