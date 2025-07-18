/*
  # Add start_date column to tickets table

  1. Schema Changes
    - Add `start_date` column to `tickets` table
    - Column is nullable since not all tickets may have a defined start date
    - Use timestamp with time zone for consistency with other date fields

  2. Data Migration
    - For existing tickets without start_date, we'll use created_date as fallback
    - This ensures backward compatibility during the transition
*/

-- Add start_date column to tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE tickets ADD COLUMN start_date timestamptz;
  END IF;
END $$;

-- Update existing tickets to use created_date as start_date fallback
UPDATE tickets 
SET start_date = created_date 
WHERE start_date IS NULL;

-- Add index for start_date for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_start_date ON tickets USING btree (start_date);