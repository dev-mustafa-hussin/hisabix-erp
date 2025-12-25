-- Add missing columns to companies table for Company Settings page
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS default_profit_percent NUMERIC(5,2) DEFAULT 25.00,
ADD COLUMN IF NOT EXISTS currency_symbol_placement TEXT DEFAULT 'before', -- 'before', 'after'
ADD COLUMN IF NOT EXISTS stock_accounting_method TEXT DEFAULT 'FIFO', -- 'FIFO', 'LIFO', 'AVCO'
ADD COLUMN IF NOT EXISTS transaction_edit_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'mm/dd/yyyy',
ADD COLUMN IF NOT EXISTS time_format TEXT DEFAULT '24h', -- '12h', '24h'
ADD COLUMN IF NOT EXISTS currency_precision INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS quantity_precision INTEGER DEFAULT 2;
