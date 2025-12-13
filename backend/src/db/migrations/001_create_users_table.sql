-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('guard', 'admin', 'employee')),
    job_site_access JSONB DEFAULT '[]'::jsonb,
    employee_id VARCHAR(255),
    onboarding_status VARCHAR(20) CHECK (onboarding_status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add comment
COMMENT ON TABLE users IS 'User accounts for security guards, administrators, and employees';
COMMENT ON COLUMN users.job_site_access IS 'Array of job site IDs the user has access to';
COMMENT ON COLUMN users.employee_id IS 'External employee ID for HR system integration';
COMMENT ON COLUMN users.onboarding_status IS 'Onboarding status for employees';




