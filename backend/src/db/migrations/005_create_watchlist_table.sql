-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('person', 'vehicle')),
    identifier VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    alert_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (alert_level IN ('low', 'medium', 'high')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_type ON watchlist(type);
CREATE INDEX IF NOT EXISTS idx_watchlist_identifier ON watchlist(identifier);
CREATE INDEX IF NOT EXISTS idx_watchlist_alert_level ON watchlist(alert_level);
CREATE INDEX IF NOT EXISTS idx_watchlist_is_active ON watchlist(is_active);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_by ON watchlist(created_by);

-- Add comment
COMMENT ON TABLE watchlist IS 'Blacklist/watchlist for restricted individuals or vehicles';










