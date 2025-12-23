-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create table to store stock alert schedules
CREATE TABLE public.stock_alert_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'disabled')),
  weekly_day INTEGER CHECK (weekly_day >= 0 AND weekly_day <= 6), -- 0=Sunday, 6=Saturday
  daily_hour INTEGER NOT NULL DEFAULT 9 CHECK (daily_hour >= 0 AND daily_hour <= 23),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.stock_alert_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company schedules"
ON public.stock_alert_schedules
FOR SELECT
USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Users can manage their company schedules"
ON public.stock_alert_schedules
FOR ALL
USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

-- Add updated_at trigger
CREATE TRIGGER update_stock_alert_schedules_updated_at
BEFORE UPDATE ON public.stock_alert_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index
CREATE INDEX idx_stock_alert_schedules_company ON public.stock_alert_schedules(company_id);
CREATE INDEX idx_stock_alert_schedules_active ON public.stock_alert_schedules(is_active) WHERE is_active = true;