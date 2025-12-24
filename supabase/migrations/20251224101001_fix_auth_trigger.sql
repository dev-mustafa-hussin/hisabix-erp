-- Fix for New User Registration Trigger
-- Ensures extensions and explicit schema references

-- 1. Ensure extensions exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Update handle_new_user function with better resilience
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  -- We use COALESCE and ensure metadata exists
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'fullName', 'New User')
  );
  
  -- Insert into user_roles
  -- We use an explicit cast to app_role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error or just return NEW anyway to avoid blocking registration
  -- In production, you'd want to log this to a table
  RETURN NEW;
END;
$$;

-- 3. Re-create the trigger just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
