-- Create failed_login_attempts table for tracking login failures
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_username ON failed_login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at ON failed_login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip_address ON failed_login_attempts(ip_address);

-- Add comment
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for security monitoring and account lockout';




