-- Make entry_time nullable to support manual exits
-- Manual exits don't have an entry_time since the vehicle/truck wasn't logged in
ALTER TABLE entries ALTER COLUMN entry_time DROP NOT NULL;

-- Update the index to handle NULL values
DROP INDEX IF EXISTS idx_entries_entry_time;
CREATE INDEX IF NOT EXISTS idx_entries_entry_time ON entries(entry_time) WHERE entry_time IS NOT NULL;

-- Add comment
COMMENT ON COLUMN entries.entry_time IS 'Entry timestamp. NULL for manual exits (vehicles/trucks not logged in)';





