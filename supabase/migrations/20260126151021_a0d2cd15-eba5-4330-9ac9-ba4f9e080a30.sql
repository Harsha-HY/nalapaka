-- Add order_type enum
DO $$ BEGIN
  CREATE TYPE public.order_type AS ENUM ('dine-in', 'parcel');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_type order_type DEFAULT 'dine-in',
ADD COLUMN IF NOT EXISTS wait_time_minutes integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS confirmed_at timestamp with time zone DEFAULT NULL;

-- Create locked_tables table to track which tables are currently in use
CREATE TABLE IF NOT EXISTS public.locked_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text NOT NULL UNIQUE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  locked_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on locked_tables
ALTER TABLE public.locked_tables ENABLE ROW LEVEL SECURITY;

-- RLS policies for locked_tables
CREATE POLICY "Anyone can view locked tables"
  ON public.locked_tables FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert locked tables"
  ON public.locked_tables FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can delete locked tables"
  ON public.locked_tables FOR DELETE
  USING (is_manager());

CREATE POLICY "Managers can update locked tables"
  ON public.locked_tables FOR UPDATE
  USING (is_manager());