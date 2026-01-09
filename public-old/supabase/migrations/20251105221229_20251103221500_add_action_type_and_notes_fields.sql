/*
  # Add Action Type and Notes fields

  ## 1. New Columns
    - `action_type` (text, nullable)
      - Categorizes the type of action needed (Ship, Iterate, Analyze, Fix, Pause)
      - Provides quick visual categorization for decision-making
      - Defaults to NULL, can be set by user
    
    - `notes` (text, nullable)
      - Long-form comment field for context, reasoning, and details
      - Supports multi-line text with preserved whitespace
      - Provides overflow space when Next Action exceeds 120 characters
      - Allows detailed documentation without cluttering primary views

  ## 2. Constraints
    - action_type is constrained to valid values: 'Ship', 'Iterate', 'Analyze', 'Fix', 'Pause'
    - Both fields are nullable to maintain backward compatibility
    - No length restrictions on notes field to allow detailed documentation

  ## 3. Important Notes
    - Action Type provides visual categorization without requiring data
    - Notes field supports collapsible display in UI for progressive disclosure
    - These fields enhance decision clarity while maintaining simplicity
    - Existing variants will have NULL for both fields (optional enhancements)
*/

-- Add action_type column (nullable, for categorizing action types)
ALTER TABLE variants 
  ADD COLUMN IF NOT EXISTS action_type text;

-- Add notes column (nullable, for long-form comments and context)
ALTER TABLE variants 
  ADD COLUMN IF NOT EXISTS notes text;

-- Add check constraint for action_type to ensure valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_action_type'
  ) THEN
    ALTER TABLE variants 
      ADD CONSTRAINT valid_action_type 
      CHECK (action_type IS NULL OR action_type IN ('Ship', 'Iterate', 'Analyze', 'Fix', 'Pause'));
  END IF;
END $$;