-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for tables with updated_at columns
CREATE TRIGGER update_hr_documents_updated_at
    BEFORE UPDATE ON hr_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_signatures_updated_at
    BEFORE UPDATE ON document_signatures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates updated_at timestamp on row update';











