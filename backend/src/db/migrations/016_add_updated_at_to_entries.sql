-- Add updated_at column to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have updated_at = created_at
UPDATE entries SET updated_at = created_at WHERE updated_at IS NULL;

-- Make updated_at NOT NULL after setting defaults
ALTER TABLE entries ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE entries ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to automatically update updated_at on row updates
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON COLUMN entries.updated_at IS 'Timestamp of last update to the entry';








