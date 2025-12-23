-- Create notification_logs table for storing sent notification history
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'stock_alert', 'invoice_reminder'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT,
  metadata JSONB, -- Additional data like invoice_id, product counts, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view notification logs for their companies"
ON public.notification_logs
FOR SELECT
USING (company_id IN (SELECT get_user_company_ids(auth.uid())));

CREATE POLICY "Service role can insert notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_notification_logs_company_id ON public.notification_logs(company_id);
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_type ON public.notification_logs(notification_type);