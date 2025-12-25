-- Fix company_users RLS policy to prevent 500 errors
-- The existing policy causes recursive issues

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view company memberships for their companies" ON public.company_users;

-- Create a simpler, more direct policy
-- Allow users to see rows where they are the user
CREATE POLICY "Users can view their own company memberships"
ON public.company_users FOR SELECT
USING (user_id = auth.uid());

-- Allow users to see OTHER users in the SAME company
CREATE POLICY "Users can view colleagues in same company"
ON public.company_users FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_users 
    WHERE user_id = auth.uid()
  )
);
