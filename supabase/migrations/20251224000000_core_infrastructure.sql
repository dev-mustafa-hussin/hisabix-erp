-- Core Infrastructure Migration
-- Description: Adds tables for Business Locations, Online Store, Stock Management, and Finance.

-- 1. Business Locations (فروع النشاط)
CREATE TABLE IF NOT EXISTS public.business_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_ar TEXT,
    location_id TEXT, -- Custom identifier
    landmark TEXT,
    city TEXT,
    zip_code TEXT,
    state TEXT,
    country TEXT DEFAULT 'مصر',
    mobile TEXT,
    alternate_number TEXT,
    email TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Online Store Settings
CREATE TABLE IF NOT EXISTS public.online_store_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#000000',
    secondary_color TEXT DEFAULT '#ffffff',
    theme_mode TEXT CHECK (theme_mode IN ('light', 'dark')) DEFAULT 'light',
    whatsapp_number TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_slider_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings_id UUID NOT NULL REFERENCES public.online_store_settings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Stock Management
CREATE TYPE public.stock_transfer_status AS ENUM ('pending', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    from_location_id UUID NOT NULL REFERENCES public.business_locations(id),
    to_location_id UUID NOT NULL REFERENCES public.business_locations(id),
    ref_no TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    status stock_transfer_status DEFAULT 'pending',
    shipping_charges DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,
    additional_notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Stock Adjustments (Damaged Stock)
CREATE TYPE public.adjustment_type AS ENUM ('normal', 'abnormal');

CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.business_locations(id),
    ref_no TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    adjustment_type adjustment_type DEFAULT 'normal',
    total_amount DECIMAL(12,2) DEFAULT 0,
    recovered_amount DECIMAL(12,2) DEFAULT 0,
    additional_notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.stock_adjustment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_id UUID NOT NULL REFERENCES public.stock_adjustments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity DECIMAL(12,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Finance (Expenses & Checks)
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.business_locations(id),
    category_id UUID REFERENCES public.expense_categories(id),
    ref_no TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    payment_status TEXT CHECK (payment_status IN ('paid', 'due', 'partial')) DEFAULT 'paid',
    notes TEXT,
    attachment_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TYPE public.check_status AS ENUM ('pending', 'collected', 'rejected', 'cancelled');
CREATE TYPE public.check_transaction_type AS ENUM ('payment', 'collection');

CREATE TABLE IF NOT EXISTS public.bank_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    check_number TEXT NOT NULL,
    transaction_type check_transaction_type NOT NULL,
    entity_name TEXT, -- From/To who
    due_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status check_status DEFAULT 'pending',
    bank_name TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS (Row Level Security)
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_slider_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_checks ENABLE ROW LEVEL SECURITY;

-- Policies (Generic for simplicity matching the current schema style)
CREATE POLICY "Users can manage their company's business_locations" ON public.business_locations FOR ALL USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Users can manage their company's online_store_settings" ON public.online_store_settings FOR ALL USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Users can manage their company's store_slider_images" ON public.store_slider_images FOR ALL USING (settings_id IN (SELECT id FROM public.online_store_settings WHERE company_id IN (SELECT public.get_user_company_ids(auth.uid()))));
CREATE POLICY "Users can manage their company's stock_transfers" ON public.stock_transfers FOR ALL USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Users can manage their company's stock_transfer_items" ON public.stock_transfer_items FOR ALL USING (transfer_id IN (SELECT id FROM public.stock_transfers WHERE company_id IN (SELECT public.get_user_company_ids(auth.uid()))));
CREATE POLICY "Users can manage their company's stock_adjustments" ON public.stock_adjustments FOR ALL USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Users can manage their company's stock_adjustment_items" ON public.stock_adjustment_items FOR ALL USING (adjustment_id IN (SELECT id FROM public.stock_adjustments WHERE company_id IN (SELECT public.get_user_company_ids(auth.uid()))));
CREATE POLICY "Users can manage their company's expense_categories" ON public.expense_categories FOR ALL USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Users can manage their company's expenses" ON public.expenses FOR ALL USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));
CREATE POLICY "Users can manage their company's bank_checks" ON public.bank_checks FOR ALL USING (company_id IN (SELECT public.get_user_company_ids(auth.uid())));

-- Triggers for updated_at (only for tables that need it)
CREATE TRIGGER update_business_locations_updated_at BEFORE UPDATE ON public.business_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_online_store_settings_updated_at BEFORE UPDATE ON public.online_store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
