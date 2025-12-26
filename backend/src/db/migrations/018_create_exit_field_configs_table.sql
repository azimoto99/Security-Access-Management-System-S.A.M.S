-- Create exit_field_configs table for per-site exit field configurations
CREATE TABLE IF NOT EXISTS exit_field_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_site_id UUID NOT NULL REFERENCES job_sites(id) ON DELETE CASCADE,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('vehicle', 'visitor', 'truck')),
    field_key VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'select', 'date', 'boolean', 'textarea', 'email', 'phone')),
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_custom BOOLEAN NOT NULL DEFAULT false, -- true for custom fields, false for standard fields
    options JSONB DEFAULT '[]'::jsonb, -- For select fields: [{"value": "option1", "label": "Option 1"}]
    validation JSONB DEFAULT '{}'::jsonb, -- Validation rules: {"minLength": 2, "maxLength": 100, "pattern": "...", "min": 0, "max": 1000}
    display_order INTEGER NOT NULL DEFAULT 0,
    placeholder TEXT,
    help_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_site_id, entry_type, field_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exit_field_configs_job_site_id ON exit_field_configs(job_site_id);
CREATE INDEX IF NOT EXISTS idx_exit_field_configs_entry_type ON exit_field_configs(entry_type);
CREATE INDEX IF NOT EXISTS idx_exit_field_configs_is_active ON exit_field_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_exit_field_configs_display_order ON exit_field_configs(job_site_id, entry_type, display_order);
CREATE INDEX IF NOT EXISTS idx_exit_field_configs_is_custom ON exit_field_configs(is_custom);

-- Add comment
COMMENT ON TABLE exit_field_configs IS 'Exit field configurations (both standard and custom) for exit forms per job site and entry type';
COMMENT ON COLUMN exit_field_configs.field_key IS 'The key used to store the exit data (e.g., exit_trailer_number, exit_notes, or custom_key)';
COMMENT ON COLUMN exit_field_configs.is_custom IS 'true for custom fields added by admin, false for standard system fields';
COMMENT ON COLUMN exit_field_configs.field_type IS 'Type of input field: text, number, select, date, boolean, textarea, email, phone';
COMMENT ON COLUMN exit_field_configs.options IS 'JSON array of options for select fields: [{"value": "val", "label": "Label"}]';
COMMENT ON COLUMN exit_field_configs.validation IS 'JSON object with validation rules: {"minLength": 2, "maxLength": 100, "pattern": "...", "min": 0, "max": 1000}';

-- Initialize default exit fields for truck type (exit_trailer_number)
-- Note: This will be done programmatically in the controller, but we can add a default here if needed

