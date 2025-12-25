-- Restore company creation logic in handle_new_user and include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    company_id UUID;
    business_name TEXT;
BEGIN
    -- 1. Create Profile
    INSERT INTO public.profiles (user_id, full_name, username, phone)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
        NEW.raw_user_meta_data ->> 'username',
        NEW.raw_user_meta_data ->> 'phone'
    );
    
    -- 2. Create Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role); -- Default to admin for the creator
    
    -- 3. Create Company if metadata exists
    business_name := NEW.raw_user_meta_data ->> 'business_name';
    
    IF business_name IS NOT NULL THEN
        INSERT INTO public.companies (
            name,
            phone,
            website,
            address,
            city,
            country,
            currency,
            timezone,
            financial_year_start
        ) VALUES (
            business_name,
            NEW.raw_user_meta_data ->> 'company_phone',
            NEW.raw_user_meta_data ->> 'website',
            NEW.raw_user_meta_data ->> 'address',
            NEW.raw_user_meta_data ->> 'city',
            COALESCE(NEW.raw_user_meta_data ->> 'country', 'مصر'),
            COALESCE(NEW.raw_user_meta_data ->> 'currency', 'EGP'),
            COALESCE(NEW.raw_user_meta_data ->> 'timezone', 'Africa/Cairo'),
            COALESCE((NEW.raw_user_meta_data ->> 'start_date')::DATE, CURRENT_DATE)
        ) RETURNING id INTO company_id;
        
        -- 4. Link User to Company as Owner
        INSERT INTO public.company_users (
            company_id,
            user_id,
            role,
            is_owner
        ) VALUES (
            company_id,
            NEW.id,
            'admin',
            true
        );
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log error details if needed, but ensure user creation doesn't fail
    RETURN NEW;
END;
$$;
