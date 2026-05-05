ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS upi_bank_name text,
  ADD COLUMN IF NOT EXISTS upi_scanner_url text;

CREATE POLICY "Hotel managers can update their hotel payment settings"
ON public.hotels
FOR UPDATE
TO authenticated
USING (public.is_manager() AND id = public.current_hotel_id())
WITH CHECK (public.is_manager() AND id = public.current_hotel_id());