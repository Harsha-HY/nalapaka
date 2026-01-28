-- Drop existing locked_tables table and recreate as locked_seats
DROP TABLE IF EXISTS public.locked_tables;

-- Create locked_seats table for seat-based locking
CREATE TABLE public.locked_seats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number text NOT NULL,
  seat text NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  locked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(table_number, seat)
);

-- Enable RLS
ALTER TABLE public.locked_seats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view locked seats"
  ON public.locked_seats FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert locked seats"
  ON public.locked_seats FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can delete locked seats"
  ON public.locked_seats FOR DELETE
  USING (is_manager());

CREATE POLICY "Managers can update locked seats"
  ON public.locked_seats FOR UPDATE
  USING (is_manager());

-- Enable realtime for locked_seats
ALTER PUBLICATION supabase_realtime ADD TABLE public.locked_seats;

-- Add seats column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seats text[] DEFAULT '{}';

-- Add order_stage column for session resume tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_stage text DEFAULT 'cart' CHECK (order_stage IN ('cart', 'order_confirmed', 'finished_eating', 'payment_selected', 'completed'));

-- Add extra_items and extra_items_timestamps for kitchen print tracking
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS base_items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS extra_items jsonb DEFAULT '[]'::jsonb;