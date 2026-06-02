-- Create table_requests table
CREATE TABLE IF NOT EXISTS public.table_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  request_type TEXT NOT NULL, -- e.g., 'Hot Water', 'Spoon', 'Sauces', 'Clean Table', 'Call Server'
  status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending', 'Completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.table_requests ENABLE ROW LEVEL SECURITY;

-- Enable Realtime
ALTER TABLE public.table_requests REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.table_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Drop existing policies if they exist (to allow safe re-runs)
DROP POLICY IF EXISTS "Guests can insert table requests" ON public.table_requests;
DROP POLICY IF EXISTS "Servers view assigned table requests" ON public.table_requests;
DROP POLICY IF EXISTS "Servers update assigned table requests" ON public.table_requests;
DROP POLICY IF EXISTS "Managers manage table requests" ON public.table_requests;
DROP POLICY IF EXISTS "Anyone can delete table requests" ON public.table_requests;

-- Policies for table_requests
-- Allow both anon and authenticated users to insert table requests
CREATE POLICY "Guests can insert table requests"
  ON public.table_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (hotel_id IS NOT NULL);

CREATE POLICY "Servers view assigned table requests"
  ON public.table_requests FOR SELECT TO authenticated
  USING (
    is_server() 
    AND table_number = ANY(get_server_tables()) 
    AND hotel_id = current_hotel_id()
  );

CREATE POLICY "Servers update assigned table requests"
  ON public.table_requests FOR UPDATE TO authenticated
  USING (
    is_server() 
    AND table_number = ANY(get_server_tables()) 
    AND hotel_id = current_hotel_id()
  );

CREATE POLICY "Managers manage table requests"
  ON public.table_requests FOR ALL TO authenticated
  USING (is_manager() AND hotel_id = current_hotel_id());

CREATE POLICY "Anyone can delete table requests"
  ON public.table_requests FOR DELETE
  TO anon, authenticated
  USING (true);

