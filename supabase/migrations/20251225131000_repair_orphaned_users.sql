-- Repair script to fix users who have a profile but no company_users entry
-- This handles the case where the previous trigger failed to create the company link

DO $$
DECLARE
    r RECORD;
    new_company_id UUID;
BEGIN
    -- Iterate through users who exist in profiles but NOT in company_users
    FOR r IN
        SELECT p.user_id, p.full_name
        FROM public.profiles p
        WHERE NOT EXISTS (
            SELECT 1 FROM public.company_users cu WHERE cu.user_id = p.user_id
        )
    LOOP
        -- Create a new company for this orphaned user
        INSERT INTO public.companies (name, currency, timezone, financial_year_start)
        VALUES (
            COALESCE(r.full_name || ' Company', 'My Company'),
            'EGP',
            'Africa/Cairo',
            CURRENT_DATE
        )
        RETURNING id INTO new_company_id;

        -- Link user to the new company as Owner/Admin
        INSERT INTO public.company_users (company_id, user_id, role, is_owner)
        VALUES (new_company_id, r.user_id, 'admin', true);
        
        -- Ensure they have the admin role in user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (r.user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Repaired user % with new Company ID %', r.user_id, new_company_id;
    END LOOP;
END$$;
