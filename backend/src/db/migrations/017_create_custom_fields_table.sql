-- Create entry_field_configs table for per-site field configurations (both standard and custom fields)
CREATE TABLE IF NOT EXISTS entry_field_configs (
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
CREATE INDEX IF NOT EXISTS idx_entry_field_configs_job_site_id ON entry_field_configs(job_site_id);
CREATE INDEX IF NOT EXISTS idx_entry_field_configs_entry_type ON entry_field_configs(entry_type);
CREATE INDEX IF NOT EXISTS idx_entry_field_configs_is_active ON entry_field_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_entry_field_configs_display_order ON entry_field_configs(job_site_id, entry_type, display_order);
CREATE INDEX IF NOT EXISTS idx_entry_field_configs_is_custom ON entry_field_configs(is_custom);

-- Add comment
COMMENT ON TABLE entry_field_configs IS 'Field configurations (both standard and custom) for entry forms per job site and entry type';
COMMENT ON COLUMN entry_field_configs.field_key IS 'The key used in entry_data JSON object (e.g., license_plate, driver_name, or custom_key)';
COMMENT ON COLUMN entry_field_configs.is_custom IS 'true for custom fields added by admin, false for standard system fields';
COMMENT ON COLUMN entry_field_configs.field_type IS 'Type of input field: text, number, select, date, boolean, textarea, email, phone';
COMMENT ON COLUMN entry_field_configs.options IS 'JSON array of options for select fields: [{"value": "val", "label": "Label"}]';
COMMENT ON COLUMN entry_field_configs.validation IS 'JSON object with validation rules: {"minLength": 2, "maxLength": 100, "pattern": "...", "min": 0, "max": 1000}';

