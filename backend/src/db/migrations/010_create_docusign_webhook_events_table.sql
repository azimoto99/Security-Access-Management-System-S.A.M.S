-- Create docusign_webhook_events table
CREATE TABLE IF NOT EXISTS docusign_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    envelope_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_docusign_webhook_events_envelope_id ON docusign_webhook_events(envelope_id);
CREATE INDEX IF NOT EXISTS idx_docusign_webhook_events_event_type ON docusign_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_docusign_webhook_events_processed ON docusign_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_docusign_webhook_events_created_at ON docusign_webhook_events(created_at);

-- Add comment
COMMENT ON TABLE docusign_webhook_events IS 'DocuSign webhook events for tracking envelope status changes';
COMMENT ON COLUMN docusign_webhook_events.event_data IS 'JSON object containing full webhook event data';












