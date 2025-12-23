-- Add scheduling fields to movement_change_alerts table
ALTER TABLE public.movement_change_alerts 
ADD COLUMN IF NOT EXISTS schedule_type TEXT NOT NULL DEFAULT 'disabled',
ADD COLUMN IF NOT EXISTS schedule_hour INTEGER NOT NULL DEFAULT 9,
ADD COLUMN IF NOT EXISTS schedule_day INTEGER;