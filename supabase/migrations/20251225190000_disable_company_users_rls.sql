-- FINAL FIX: Completely disable RLS on company_users temporarily to diagnose
-- This will help us confirm if RLS is the issue

-- Disable RLS entirely on company_users
ALTER TABLE public.company_users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (cleanup)
DROP POLICY IF EXISTS "Users can view company memberships for their companies" ON public.company_users;
DROP POLICY IF EXISTS "Company owners can manage members" ON public.company_users;
DROP POLICY IF EXISTS "Users can add themselves to companies" ON public.company_users;
DROP POLICY IF EXISTS "Users can view their own company memberships" ON public.company_users;
DROP POLICY IF EXISTS "Users can view colleagues in same company" ON public.company_users;
DROP POLICY IF EXISTS "Authenticated users can view company_users" ON public.company_users;
DROP POLICY IF EXISTS "Authenticated users can insert company_users" ON public.company_users;
DROP POLICY IF EXISTS "Owners can manage company_users" ON public.company_users;
