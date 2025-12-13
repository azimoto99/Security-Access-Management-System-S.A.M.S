-- Create job_sites table
CREATE TABLE IF NOT EXISTS job_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    contact_info JSONB DEFAULT '{}'::jsonb,
    vehicle_capacity INTEGER NOT NULL DEFAULT 0,
    visitor_capacity INTEGER NOT NULL DEFAULT 0,
    truck_capacity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_sites_name ON job_sites(name);
CREATE INDEX IF NOT EXISTS idx_job_sites_is_active ON job_sites(is_active);

-- Add comment
COMMENT ON TABLE job_sites IS 'Job sites/locations where security access is managed';
COMMENT ON COLUMN job_sites.contact_info IS 'JSON object containing contact information';





