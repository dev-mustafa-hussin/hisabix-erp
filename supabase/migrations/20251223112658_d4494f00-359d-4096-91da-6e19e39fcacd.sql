-- Create email_templates table for storing custom email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL, -- 'stock_alert', 'invoice_reminder', 'low_stock', 'out_of_stock'
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, template_type)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view email templates for their companies"
ON public.email_templates
FOR SELECT
USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Users can manage email templates for their companies"
ON public.email_templates
FOR ALL
USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index
CREATE INDEX idx_email_templates_company_type ON public.email_templates(company_id, template_type);