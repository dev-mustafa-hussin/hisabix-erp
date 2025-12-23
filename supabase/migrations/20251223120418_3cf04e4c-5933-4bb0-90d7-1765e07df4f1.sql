-- Add expires_at column to company_users table
ALTER TABLE public.company_users 
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for expired users queries
CREATE INDEX idx_company_users_expires_at ON public.company_users(expires_at) WHERE expires_at IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.company_users.expires_at IS 'Optional expiration date for user access. NULL means no expiration.';