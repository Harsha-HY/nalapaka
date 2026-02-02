-- Create servers table for server accounts managed by manager
CREATE TABLE public.servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone_number TEXT,
  assigned_tables TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on servers table
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- Managers can do everything with servers
CREATE POLICY "Managers can view all servers"
  ON public.servers FOR SELECT
  USING (is_manager());

CREATE POLICY "Managers can insert servers"
  ON public.servers FOR INSERT
  WITH CHECK (is_manager());

CREATE POLICY "Managers can update servers"
  ON public.servers FOR UPDATE
  USING (is_manager());

CREATE POLICY "Managers can delete servers"
  ON public.servers FOR DELETE
  USING (is_manager());

-- Servers can view their own record
CREATE POLICY "Servers can view own record"
  ON public.servers FOR SELECT
  USING (auth.uid() = user_id);

-- Add server_id and server_name to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS server_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS server_name TEXT;

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID,
  customer_name TEXT NOT NULL,
  phone_number TEXT,
  table_number TEXT NOT NULL,
  seats TEXT[] DEFAULT '{}',
  server_name TEXT,
  food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  hotel_rating INTEGER CHECK (hotel_rating >= 1 AND hotel_rating <= 5),
  website_rating INTEGER CHECK (website_rating >= 1 AND website_rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert reviews (customers after payment)
CREATE POLICY "Anyone authenticated can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Managers can view all reviews
CREATE POLICY "Managers can view reviews"
  ON public.reviews FOR SELECT
  USING (is_manager());

-- Managers can delete reviews
CREATE POLICY "Managers can delete reviews"
  ON public.reviews FOR DELETE
  USING (is_manager());

-- Create function to check if user is a server
CREATE OR REPLACE FUNCTION public.is_server()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'server')
$$;

-- Create function to get server's assigned tables
CREATE OR REPLACE FUNCTION public.get_server_tables()
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(assigned_tables, '{}')
  FROM public.servers
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- Add policy for servers to view orders for their assigned tables
CREATE POLICY "Servers can view assigned table orders"
  ON public.orders FOR SELECT
  USING (is_server() AND table_number = ANY(get_server_tables()));

-- Trigger to update updated_at on servers
CREATE TRIGGER update_servers_updated_at
  BEFORE UPDATE ON public.servers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for servers and reviews tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.servers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;