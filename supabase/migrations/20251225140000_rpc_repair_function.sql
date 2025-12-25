-- RPC Function to repair orphaned account (link to company)
-- This function is called from the frontend when a user is logged in but has no company_id

CREATE OR REPLACE FUNCTION public.repair_my_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    current_email TEXT;
    new_company_id UUID;
    existing_company_id UUID;
BEGIN
    current_user_id := auth.uid();
    current_email := auth.jwt() ->> 'email';

    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- 1. Check if user already has a company
    SELECT company_id INTO existing_company_id
    FROM public.company_users
    WHERE user_id = current_user_id
    LIMIT 1;

    IF existing_company_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already linked', 'company_id', existing_company_id);
    END IF;

    -- 2. Create Company
    INSERT INTO public.companies (
        name,
        currency,
        timezone,
        financial_year_start
    ) VALUES (
        COALESCE(current_email || '''s Company', 'My Company'),
        'EGP',
        'Africa/Cairo',
        CURRENT_DATE
    )
    RETURNING id INTO new_company_id;

    -- 3. Link User as Owner
    INSERT INTO public.company_users (
        company_id,
        user_id,
        role,
        is_owner
    ) VALUES (
        new_company_id,
        current_user_id,
        'admin',
        true
    );

    -- 4. Ensure Profile exists
    INSERT INTO public.profiles (user_id, full_name, username)
    VALUES (
        current_user_id,
        COALESCE(auth.jwt() ->> 'name', split_part(current_email, '@', 1)),
        split_part(current_email, '@', 1)
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 5. Ensure User Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'message', 'Repaired successfully', 'fixed', true, 'company_id', new_company_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
