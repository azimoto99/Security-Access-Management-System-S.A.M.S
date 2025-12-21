-- Add 'client' role to users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('guard', 'admin', 'employee', 'client'));

-- Update comment
COMMENT ON TABLE users IS 'User accounts for security guards, administrators, employees, and clients';

