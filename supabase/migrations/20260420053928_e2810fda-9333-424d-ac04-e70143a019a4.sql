-- 1) Hotel branding fields
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS tagline text;

-- 2) Per-device guest tracking on orders (no auth required)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS device_id text;

CREATE INDEX IF NOT EXISTS idx_orders_device_id ON public.orders(device_id);

-- 3) Allow user_id to be null (anonymous orders)
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- 4) RLS — make hotels & menu readable by anyone (public landing/menu)
DROP POLICY IF EXISTS "Anyone authenticated can view active hotels" ON public.hotels;
CREATE POLICY "Public can view active hotels"
  ON public.hotels FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR is_super_admin());

DROP POLICY IF EXISTS "Authenticated view menu items" ON public.menu_items;
CREATE POLICY "Public can view menu items"
  ON public.menu_items FOR SELECT
  TO anon, authenticated
  USING (
    hotel_id IS NULL
    OR EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = menu_items.hotel_id AND h.is_active = true)
  );

-- 5) Orders — allow anonymous insert with device_id, allow read by device
DROP POLICY IF EXISTS "Customers insert own orders" ON public.orders;
CREATE POLICY "Anyone can insert orders for active hotels"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    hotel_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = orders.hotel_id AND h.is_active = true)
    AND (
      (auth.uid() IS NOT NULL AND user_id = auth.uid())
      OR (auth.uid() IS NULL AND device_id IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
CREATE POLICY "Customers view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone view orders by device"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (device_id IS NOT NULL);

DROP POLICY IF EXISTS "Customers update own orders" ON public.orders;
CREATE POLICY "Customers/devices update own orders"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND device_id IS NOT NULL)
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND device_id IS NOT NULL)
  );

-- 6) Locked seats — allow anonymous insert/delete for active hotels
DROP POLICY IF EXISTS "Authenticated view locked seats" ON public.locked_seats;
CREATE POLICY "Anyone view locked seats"
  ON public.locked_seats FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated insert locked seats" ON public.locked_seats;
CREATE POLICY "Anyone insert locked seats"
  ON public.locked_seats FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    hotel_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = locked_seats.hotel_id AND h.is_active = true)
  );

DROP POLICY IF EXISTS "Customers delete own locked seats" ON public.locked_seats;
CREATE POLICY "Anyone delete own locked seats"
  ON public.locked_seats FOR DELETE
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = locked_seats.order_id
        AND (
          (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
          OR (auth.uid() IS NULL AND o.device_id IS NOT NULL)
        )
    )
  );

-- 7) Reviews — allow anonymous insert
DROP POLICY IF EXISTS "Authenticated insert reviews" ON public.reviews;
CREATE POLICY "Anyone insert reviews for active hotels"
  ON public.reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    hotel_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = reviews.hotel_id AND h.is_active = true)
  );