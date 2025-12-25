-- Create user_invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, expired
    invited_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view invitations for their company"
    ON public.user_invitations FOR SELECT
    USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

CREATE POLICY "Admins can create invitations"
    ON public.user_invitations FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM public.company_users 
            WHERE user_id = auth.uid() AND (role = 'admin' OR is_owner = true)
        )
    );

CREATE POLICY "Admins can update invitations"
    ON public.user_invitations FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM public.company_users 
            WHERE user_id = auth.uid() AND (role = 'admin' OR is_owner = true)
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_user_invitations_updated_at
    BEFORE UPDATE ON public.user_invitations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
