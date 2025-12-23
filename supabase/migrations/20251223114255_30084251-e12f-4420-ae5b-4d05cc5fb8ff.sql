-- Create table for movement change alert settings
CREATE TABLE public.movement_change_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  threshold_percent INTEGER NOT NULL DEFAULT 50,
  comparison_days INTEGER NOT NULL DEFAULT 7,
  recipient_email TEXT,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE public.movement_change_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their company movement alerts" 
ON public.movement_change_alerts 
FOR SELECT 
USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Users can manage their company movement alerts" 
ON public.movement_change_alerts 
FOR ALL 
USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

-- Add trigger for updated_at
CREATE TRIGGER update_movement_change_alerts_updated_at
BEFORE UPDATE ON public.movement_change_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();