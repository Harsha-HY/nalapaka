-- Add special flags to menu_items
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS is_special boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS special_note text;

-- Create daily_specials table for free-form one-off specials
CREATE TABLE IF NOT EXISTS public.daily_specials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_kn text,
  price numeric NOT NULL DEFAULT 0,
  note text,
  image_url text,
  special_date date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_specials ENABLE ROW LEVEL SECURITY;

-- Anyone can view active specials for today
CREATE POLICY "Anyone can view today's active specials"
ON public.daily_specials
FOR SELECT
USING (is_active = true AND special_date = CURRENT_DATE);

-- Managers of the hotel can do everything
CREATE POLICY "Managers manage daily specials"
ON public.daily_specials
FOR ALL
USING (
  public.is_manager() AND hotel_id = public.current_hotel_id()
)
WITH CHECK (
  public.is_manager() AND hotel_id = public.current_hotel_id()
);

CREATE TRIGGER update_daily_specials_updated_at
BEFORE UPDATE ON public.daily_specials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER TABLE public.daily_specials REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_specials;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

CREATE INDEX IF NOT EXISTS idx_daily_specials_hotel_date ON public.daily_specials(hotel_id, special_date);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_special ON public.menu_items(hotel_id, is_special) WHERE is_special = true;