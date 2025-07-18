/*
  # Add parent_issue_key column for sub-task support

  1. Schema Changes
    - Add `parent_issue_key` column to `tickets` table
    - Column is nullable since not all tickets are sub-tasks
    - Use text type to store the parent issue key (e.g., "PROJ-123")

  2. Indexing
    - Add index on parent_issue_key for efficient sub-task queries
*/

-- Add parent_issue_key column to tickets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'parent_issue_key'
  ) THEN
    ALTER TABLE tickets ADD COLUMN parent_issue_key text;
  END IF;
END $$;

-- Add index for parent_issue_key for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_parent_issue_key ON tickets USING btree (parent_issue_key);