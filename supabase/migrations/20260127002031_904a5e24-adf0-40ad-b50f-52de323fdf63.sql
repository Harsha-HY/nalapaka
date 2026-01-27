-- Add payment_intent column to track customer's payment choice before manager confirms
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_intent text DEFAULT NULL;

-- Add archived_at column for history logic (when order moves to history)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL;