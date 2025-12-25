-- RPC to create company and link user safely
CREATE OR REPLACE FUNCTION public.create_company_setting(
  _name text,
  _start_date date,
  _currency text,
  _default_profit_percent numeric DEFAULT 25.0,
  _currency_symbol_placement text DEFAULT 'before',
  _timezone text DEFAULT 'Africa/Cairo',
  _financial_year_start text DEFAULT 'January',
  _stock_accounting_method text DEFAULT 'FIFO',
  _transaction_edit_days int DEFAULT 30,
  _date_format text DEFAULT 'mm/dd/yyyy',
  _time_format text DEFAULT '24h',
  _currency_precision int DEFAULT 2,
  _quantity_precision int DEFAULT 2,
  _logo_url text DEFAULT null
) 
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- 1. Insert Company
  INSERT INTO companies (
    name, 
    start_date, 
    currency, 
    default_profit_percent, 
    currency_symbol_placement, 
    timezone,
    financial_year_start,
    stock_accounting_method,
    transaction_edit_days,
    date_format,
    time_format,
    currency_precision,
    quantity_precision,
    logo_url
  )
  VALUES (
    _name, 
    COALESCE(_start_date, CURRENT_DATE), 
    _currency, 
    _default_profit_percent, 
    _currency_symbol_placement, 
    _timezone,
    _financial_year_start,
    _stock_accounting_method,
    _transaction_edit_days,
    _date_format,
    _time_format,
    _currency_precision,
    _quantity_precision,
    _logo_url
  )
  RETURNING id INTO new_company_id;

  -- 2. Link User (The Caller) to this Company as Owner
  INSERT INTO company_users (company_id, user_id, role, is_owner)
  VALUES (new_company_id, auth.uid(), 'admin', true);

  -- 3. Ensure Profile Exists (Just in case)
  INSERT INTO profiles (user_id, full_name)
  VALUES (auth.uid(), split_part(current_setting('request.jwt.claim.email', true), '@', 1))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new_company_id;
END;
$$;
