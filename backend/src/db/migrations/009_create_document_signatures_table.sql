-- Create document_signatures table
CREATE TABLE IF NOT EXISTS document_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES document_assignments(id) ON DELETE CASCADE,
    docusign_envelope_id VARCHAR(255) UNIQUE NOT NULL,
    docusign_envelope_status VARCHAR(50) NOT NULL,
    signing_url TEXT,
    signed_at TIMESTAMP,
    declined_at TIMESTAMP,
    declined_reason TEXT,
    signer_email VARCHAR(255) NOT NULL,
    signer_name VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_signatures_assignment_id ON document_signatures(assignment_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_envelope_id ON document_signatures(docusign_envelope_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_envelope_status ON document_signatures(docusign_envelope_status);
CREATE INDEX IF NOT EXISTS idx_document_signatures_signer_email ON document_signatures(signer_email);
CREATE INDEX IF NOT EXISTS idx_document_signatures_created_at ON document_signatures(created_at);

-- Add comment
COMMENT ON TABLE document_signatures IS 'DocuSign signature records for document assignments';
COMMENT ON COLUMN document_signatures.docusign_envelope_id IS 'Unique DocuSign envelope identifier';














