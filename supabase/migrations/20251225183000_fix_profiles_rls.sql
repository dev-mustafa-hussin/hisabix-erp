-- Fix RLS policy for profiles to allow viewing colleagues in same company
-- This is required for the Users management page to show all users

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a more permissive policy that allows viewing profiles of users in the same company
CREATE POLICY "Users can view profiles in their company"
ON public.profiles FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  user_id IN (
    SELECT cu.user_id 
    FROM public.company_users cu
    WHERE cu.company_id IN (
      SELECT public.get_user_company_ids(auth.uid())
    )
  )
);
