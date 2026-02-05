-- Add columns for server acceptance tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS accepted_by_server_id uuid,
ADD COLUMN IF NOT EXISTS accepted_by_server_name text,
ADD COLUMN IF NOT EXISTS server_accepted_at timestamp with time zone;

-- Add comment for clarity
COMMENT ON COLUMN public.orders.accepted_by_server_id IS 'Server who accepted the order';
COMMENT ON COLUMN public.orders.accepted_by_server_name IS 'Name of server who accepted';
COMMENT ON COLUMN public.orders.server_accepted_at IS 'Timestamp when server accepted';