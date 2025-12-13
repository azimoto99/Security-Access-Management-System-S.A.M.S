-- Create document_assignments table
CREATE TABLE IF NOT EXISTS document_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES hr_documents(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'declined', 'expired')),
    completed_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_assignments_document_id ON document_assignments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_assignments_employee_id ON document_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_document_assignments_status ON document_assignments(status);
CREATE INDEX IF NOT EXISTS idx_document_assignments_assigned_by ON document_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_document_assignments_due_date ON document_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_document_assignments_assigned_at ON document_assignments(assigned_at);

-- Add comment
COMMENT ON TABLE document_assignments IS 'Assignments of HR documents to employees for signing';



