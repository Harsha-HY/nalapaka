-- 1) Fix non-deterministic hotel scoping
CREATE OR REPLACE FUNCTION public.current_hotel_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT hotel_id
  FROM public.hotel_members
  WHERE user_id = auth.uid()
  ORDER BY created_at ASC
  LIMIT 1
$function$;

-- 2) Replace unsafe device_id policies on orders with auth.uid()-scoped policies
-- (anonymous users will now have a real Supabase anon JWT — auth.uid() is set)

DROP POLICY IF EXISTS "Anyone view orders by device" ON public.orders;
DROP POLICY IF EXISTS "Customers/devices update own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders for active hotels" ON public.orders;
DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;

-- SELECT: any authenticated user (incl. anonymous) can only see orders they own
CREATE POLICY "Users view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- INSERT: must be the owner and target an active hotel
CREATE POLICY "Users insert own orders for active hotels"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND hotel_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = orders.hotel_id AND h.is_active = true)
);

-- UPDATE: only the owner may update their own order rows
CREATE POLICY "Users update own orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 3) Lock down locked_seats the same way (it currently allows anyone to view/insert)
DROP POLICY IF EXISTS "Anyone view locked seats" ON public.locked_seats;
DROP POLICY IF EXISTS "Anyone insert locked seats" ON public.locked_seats;
DROP POLICY IF EXISTS "Anyone delete own locked seats" ON public.locked_seats;

-- Anyone scanning a hotel needs to know which seats are taken — this is non-PII,
-- only seat letters + table numbers + order_id. Keep public read but scope by active hotel.
CREATE POLICY "Anyone view locked seats for active hotels"
ON public.locked_seats
FOR SELECT
TO anon, authenticated
USING (
  hotel_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.hotels h WHERE h.id = locked_seats.hotel_id AND h.is_active = true)
);

-- INSERT: must be tied to an order the caller owns
CREATE POLICY "Users insert locked seats for own orders"
ON public.locked_seats
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND hotel_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = locked_seats.order_id
      AND o.user_id = auth.uid()
      AND o.hotel_id = locked_seats.hotel_id
  )
);

-- DELETE: caller must own the order
CREATE POLICY "Users delete locked seats for own orders"
ON public.locked_seats
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = locked_seats.order_id
      AND o.user_id = auth.uid()
  )
);

-- 4) Tighten reviews INSERT — must include the user_id implicitly via order ownership when present
-- Existing policy is OK (just hotel-active check), keep as-is. Reviews don't expose PII via SELECT
-- because only managers/super_admin can SELECT.

-- 5) Make user_id NOT NULL going forward for new orders.
-- (Keep existing rows valid by leaving the column nullable but RLS forces it on INSERT.)