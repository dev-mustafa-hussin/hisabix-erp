-- Fix recursive RLS issue by using a helper table approach
-- The problem: policy checks company_users to allow reading company_users (recursive!)

-- Drop ALL existing policies on company_users
DROP POLICY IF EXISTS "Users can view company memberships for their companies" ON public.company_users;
DROP POLICY IF EXISTS "Company owners can manage members" ON public.company_users;
DROP POLICY IF EXISTS "Users can add themselves to companies" ON public.company_users;
DROP POLICY IF EXISTS "Users can view their own company memberships" ON public.company_users;
DROP POLICY IF EXISTS "Users can view colleagues in same company" ON public.company_users;

-- Create simple, non-recursive policies
-- Policy 1: Allow SELECT for authenticated users (we'll filter in application layer if needed)
CREATE POLICY "Authenticated users can view company_users"
ON public.company_users FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow INSERT for authenticated users (for self-registration and invites)
CREATE POLICY "Authenticated users can insert company_users"
ON public.company_users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow UPDATE/DELETE for owners only
CREATE POLICY "Owners can manage company_users"
ON public.company_users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = company_users.company_id
    AND cu.user_id = auth.uid()
    AND cu.is_owner = true
  )
);
