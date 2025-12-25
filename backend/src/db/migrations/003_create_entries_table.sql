-- Create entries table
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_site_id UUID NOT NULL REFERENCES job_sites(id) ON DELETE CASCADE,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('vehicle', 'visitor', 'truck')),
    entry_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    entry_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP,
    guard_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    photos JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exited', 'emergency_exit')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_entries_job_site_id ON entries(job_site_id);
CREATE INDEX IF NOT EXISTS idx_entries_entry_type ON entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_entries_guard_id ON entries(guard_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_entry_time ON entries(entry_time);
CREATE INDEX IF NOT EXISTS idx_entries_exit_time ON entries(exit_time);
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);

-- Add comment
COMMENT ON TABLE entries IS 'Entry/exit records for vehicles, visitors, and trucks';
COMMENT ON COLUMN entries.entry_data IS 'JSON object containing type-specific entry data';
COMMENT ON COLUMN entries.photos IS 'Array of photo IDs associated with this entry';











