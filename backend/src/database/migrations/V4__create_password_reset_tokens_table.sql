-- Create password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    used BOOLEAN NOT NULL DEFAULT FALSE
);

-- Add index on token for faster lookups
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Add index on user_id for faster lookups
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Add index on expiry for cleanup operations
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);