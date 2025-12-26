-- Create hr_documents table
CREATE TABLE IF NOT EXISTS hr_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('onboarding', 'policy', 'contract', 'other')),
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hr_documents_document_type ON hr_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_hr_documents_is_required ON hr_documents(is_required);
CREATE INDEX IF NOT EXISTS idx_hr_documents_created_by ON hr_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_hr_documents_is_active ON hr_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_hr_documents_created_at ON hr_documents(created_at);

-- Add comment
COMMENT ON TABLE hr_documents IS 'HR documents available for employee onboarding and management';
















