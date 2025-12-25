-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    thumbnail_path VARCHAR(500),
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_photos_entry_id ON photos(entry_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at);

-- Add comment
COMMENT ON TABLE photos IS 'Photo files associated with entry/exit records';











