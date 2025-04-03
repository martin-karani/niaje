-- Create sessions table for Better Auth
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address VARCHAR(45)
);

-- Add index on user_id for faster lookups
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Add index on token for faster authentication
CREATE INDEX idx_sessions_token ON sessions(token);

-- Add index on expiry for cleanup operations
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);