-- Create emergency_mode table
CREATE TABLE IF NOT EXISTS emergency_mode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_site_id UUID REFERENCES job_sites(id) ON DELETE CASCADE,
    activated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    activated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deactivated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deactivated_at TIMESTAMP,
    reason TEXT,
    actions_taken JSONB DEFAULT '[]'::jsonb,
    summary_report TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_emergency_mode_job_site_id ON emergency_mode(job_site_id);
CREATE INDEX IF NOT EXISTS idx_emergency_mode_is_active ON emergency_mode(is_active);
CREATE INDEX IF NOT EXISTS idx_emergency_mode_activated_at ON emergency_mode(activated_at);

-- Add comment
COMMENT ON TABLE emergency_mode IS 'Tracks emergency mode activations and deactivations';
COMMENT ON COLUMN emergency_mode.actions_taken IS 'JSON array of actions taken during emergency';
COMMENT ON COLUMN emergency_mode.summary_report IS 'Summary report generated when emergency mode ends';








