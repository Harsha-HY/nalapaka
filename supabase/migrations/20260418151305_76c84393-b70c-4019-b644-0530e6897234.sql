
-- ============================================================
-- 1. WIPE EXISTING TENANT DATA
-- ============================================================
DELETE FROM public.locked_seats;
DELETE FROM public.reviews;
DELETE FROM public.orders;
DELETE FROM public.kitchen_staff;
DELETE FROM public.servers;
DELETE FROM public.menu_items;
DELETE FROM public.user_roles;

-- ============================================================
-- 2. CREATE hotels TABLE
-- ============================================================
CREATE TABLE public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. CREATE hotel_members TABLE
-- ============================================================
CREATE TABLE public.hotel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.hotel_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_hotel_members_hotel ON public.hotel_members(hotel_id);
CREATE INDEX idx_hotel_members_user ON public.hotel_members(user_id);

-- ============================================================
-- 4. ADD hotel_id TO TENANT TABLES
-- ============================================================
ALTER TABLE public.orders         ADD COLUMN hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.menu_items     ADD COLUMN hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.servers        ADD COLUMN hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.kitchen_staff  ADD COLUMN hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.reviews        ADD COLUMN hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.locked_seats   ADD COLUMN hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE;

CREATE INDEX idx_orders_hotel        ON public.orders(hotel_id);
CREATE INDEX idx_menu_items_hotel    ON public.menu_items(hotel_id);
CREATE INDEX idx_servers_hotel       ON public.servers(hotel_id);
CREATE INDEX idx_kitchen_staff_hotel ON public.kitchen_staff(hotel_id);
CREATE INDEX idx_reviews_hotel       ON public.reviews(hotel_id);
CREATE INDEX idx_locked_seats_hotel  ON public.locked_seats(hotel_id);

-- ============================================================
-- 5. HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.current_hotel_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT hotel_id FROM public.hotel_members WHERE user_id = auth.uid() LIMIT 1
$$;

-- ============================================================
-- 6. UPDATE handle_new_user TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. RLS — hotels
-- ============================================================
CREATE POLICY "Super admin manages hotels"
  ON public.hotels FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Anyone authenticated can view active hotels"
  ON public.hotels FOR SELECT TO authenticated
  USING (is_active = true OR public.is_super_admin());

-- ============================================================
-- 8. RLS — hotel_members
-- ============================================================
CREATE POLICY "Super admin manages hotel members"
  ON public.hotel_members FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Members view own membership"
  ON public.hotel_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Hotel managers view their hotel members"
  ON public.hotel_members FOR SELECT
  USING (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel managers insert members in their hotel"
  ON public.hotel_members FOR INSERT
  WITH CHECK (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel managers delete members in their hotel"
  ON public.hotel_members FOR DELETE
  USING (public.is_manager() AND hotel_id = public.current_hotel_id());

-- ============================================================
-- 9. RLS — orders
-- ============================================================
DROP POLICY IF EXISTS "Customers can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can update their order payment" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Kitchen can update orders" ON public.orders;
DROP POLICY IF EXISTS "Kitchen can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Managers can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Managers can update orders" ON public.orders;
DROP POLICY IF EXISTS "Managers can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Servers can update assigned table orders" ON public.orders;
DROP POLICY IF EXISTS "Servers can view assigned table orders" ON public.orders;

CREATE POLICY "Customers insert own orders"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND hotel_id IS NOT NULL);

CREATE POLICY "Customers view own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Customers update own orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Hotel managers view orders"
  ON public.orders FOR SELECT
  USING (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel managers update orders"
  ON public.orders FOR UPDATE
  USING (public.is_manager() AND hotel_id = public.current_hotel_id())
  WITH CHECK (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel managers delete orders"
  ON public.orders FOR DELETE
  USING (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel servers view orders"
  ON public.orders FOR SELECT
  USING (public.is_server() AND hotel_id = public.current_hotel_id() AND table_number = ANY (public.get_server_tables()));

CREATE POLICY "Hotel servers update orders"
  ON public.orders FOR UPDATE
  USING (public.is_server() AND hotel_id = public.current_hotel_id() AND table_number = ANY (public.get_server_tables()));

CREATE POLICY "Hotel kitchen view orders"
  ON public.orders FOR SELECT
  USING (public.is_kitchen() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel kitchen update orders"
  ON public.orders FOR UPDATE
  USING (public.is_kitchen() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Super admin views all orders"
  ON public.orders FOR SELECT
  USING (public.is_super_admin());

-- ============================================================
-- 10. RLS — menu_items
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Managers can insert menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Managers can update menu items" ON public.menu_items;

CREATE POLICY "Authenticated view menu items"
  ON public.menu_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Hotel managers insert menu items"
  ON public.menu_items FOR INSERT
  WITH CHECK (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel managers update menu items"
  ON public.menu_items FOR UPDATE
  USING (public.is_manager() AND hotel_id = public.current_hotel_id())
  WITH CHECK (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel managers delete menu items"
  ON public.menu_items FOR DELETE
  USING (public.is_manager() AND hotel_id = public.current_hotel_id());

-- ============================================================
-- 11. RLS — servers
-- ============================================================
DROP POLICY IF EXISTS "Managers can delete servers" ON public.servers;
DROP POLICY IF EXISTS "Managers can insert servers" ON public.servers;
DROP POLICY IF EXISTS "Managers can update servers" ON public.servers;
DROP POLICY IF EXISTS "Managers can view all servers" ON public.servers;
DROP POLICY IF EXISTS "Servers can view own record" ON public.servers;

CREATE POLICY "Hotel managers manage servers"
  ON public.servers FOR ALL
  USING (public.is_manager() AND hotel_id = public.current_hotel_id())
  WITH CHECK (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Servers view own record"
  ON public.servers FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 12. RLS — kitchen_staff
-- ============================================================
DROP POLICY IF EXISTS "Kitchen staff can view own record" ON public.kitchen_staff;
DROP POLICY IF EXISTS "Managers can delete kitchen staff" ON public.kitchen_staff;
DROP POLICY IF EXISTS "Managers can insert kitchen staff" ON public.kitchen_staff;
DROP POLICY IF EXISTS "Managers can update kitchen staff" ON public.kitchen_staff;
DROP POLICY IF EXISTS "Managers can view kitchen staff" ON public.kitchen_staff;

CREATE POLICY "Hotel managers manage kitchen staff"
  ON public.kitchen_staff FOR ALL
  USING (public.is_manager() AND hotel_id = public.current_hotel_id())
  WITH CHECK (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Kitchen views own record"
  ON public.kitchen_staff FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 13. RLS — reviews
-- ============================================================
DROP POLICY IF EXISTS "Anyone authenticated can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Managers can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Managers can view reviews" ON public.reviews;

CREATE POLICY "Authenticated insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND hotel_id IS NOT NULL);

CREATE POLICY "Hotel managers view reviews"
  ON public.reviews FOR SELECT
  USING (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel managers delete reviews"
  ON public.reviews FOR DELETE
  USING (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Super admin views reviews"
  ON public.reviews FOR SELECT
  USING (public.is_super_admin());

-- ============================================================
-- 14. RLS — locked_seats
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view locked seats" ON public.locked_seats;
DROP POLICY IF EXISTS "Authenticated users can insert locked seats" ON public.locked_seats;
DROP POLICY IF EXISTS "Customers can delete own locked seats" ON public.locked_seats;
DROP POLICY IF EXISTS "Managers can delete locked seats" ON public.locked_seats;
DROP POLICY IF EXISTS "Managers can update locked seats" ON public.locked_seats;
DROP POLICY IF EXISTS "Servers can delete assigned table locked seats" ON public.locked_seats;

CREATE POLICY "Authenticated view locked seats"
  ON public.locked_seats FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated insert locked seats"
  ON public.locked_seats FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND hotel_id IS NOT NULL);

CREATE POLICY "Customers delete own locked seats"
  ON public.locked_seats FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = locked_seats.order_id AND orders.user_id = auth.uid()
  ));

CREATE POLICY "Hotel managers manage locked seats"
  ON public.locked_seats FOR ALL
  USING (public.is_manager() AND hotel_id = public.current_hotel_id())
  WITH CHECK (public.is_manager() AND hotel_id = public.current_hotel_id());

CREATE POLICY "Hotel servers delete locked seats"
  ON public.locked_seats FOR DELETE
  USING (public.is_server() AND hotel_id = public.current_hotel_id() AND table_number = ANY (public.get_server_tables()));
