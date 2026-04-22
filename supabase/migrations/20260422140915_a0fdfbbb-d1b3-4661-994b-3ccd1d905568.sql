-- Restrict every staff-only / role-gated policy to the `authenticated` role
-- so the linter no longer flags them as "may be reachable by anon".

-- ===== hotel_members =====
DROP POLICY IF EXISTS "Super admin manages hotel members" ON public.hotel_members;
CREATE POLICY "Super admin manages hotel members" ON public.hotel_members
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Members view own membership" ON public.hotel_members;
CREATE POLICY "Members view own membership" ON public.hotel_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Hotel managers view their hotel members" ON public.hotel_members;
CREATE POLICY "Hotel managers view their hotel members" ON public.hotel_members
  FOR SELECT TO authenticated USING (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel managers insert members in their hotel" ON public.hotel_members;
CREATE POLICY "Hotel managers insert members in their hotel" ON public.hotel_members
  FOR INSERT TO authenticated WITH CHECK (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel managers delete members in their hotel" ON public.hotel_members;
CREATE POLICY "Hotel managers delete members in their hotel" ON public.hotel_members
  FOR DELETE TO authenticated USING (is_manager() AND hotel_id = current_hotel_id());

-- ===== hotels =====
DROP POLICY IF EXISTS "Super admin manages hotels" ON public.hotels;
CREATE POLICY "Super admin manages hotels" ON public.hotels
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_super_admin()) WITH CHECK (is_super_admin());
-- "Public can view active hotels" stays (anon + authenticated, public-facing landing/menu)

-- ===== kitchen_staff =====
DROP POLICY IF EXISTS "Hotel managers manage kitchen staff" ON public.kitchen_staff;
CREATE POLICY "Hotel managers manage kitchen staff" ON public.kitchen_staff
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_manager() AND hotel_id = current_hotel_id())
  WITH CHECK (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Kitchen views own record" ON public.kitchen_staff;
CREATE POLICY "Kitchen views own record" ON public.kitchen_staff
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== locked_seats =====
DROP POLICY IF EXISTS "Hotel managers manage locked seats" ON public.locked_seats;
CREATE POLICY "Hotel managers manage locked seats" ON public.locked_seats
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_manager() AND hotel_id = current_hotel_id())
  WITH CHECK (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel servers delete locked seats" ON public.locked_seats;
CREATE POLICY "Hotel servers delete locked seats" ON public.locked_seats
  FOR DELETE TO authenticated
  USING (is_server() AND hotel_id = current_hotel_id() AND table_number = ANY (get_server_tables()));

-- "Anyone view locked seats for active hotels" + "Users insert/delete locked seats for own orders" stay

-- ===== menu_items =====
DROP POLICY IF EXISTS "Hotel managers insert menu items" ON public.menu_items;
CREATE POLICY "Hotel managers insert menu items" ON public.menu_items
  FOR INSERT TO authenticated WITH CHECK (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel managers update menu items" ON public.menu_items;
CREATE POLICY "Hotel managers update menu items" ON public.menu_items
  FOR UPDATE TO authenticated
  USING (is_manager() AND hotel_id = current_hotel_id())
  WITH CHECK (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel managers delete menu items" ON public.menu_items;
CREATE POLICY "Hotel managers delete menu items" ON public.menu_items
  FOR DELETE TO authenticated USING (is_manager() AND hotel_id = current_hotel_id());

-- ===== orders =====
DROP POLICY IF EXISTS "Hotel managers view orders" ON public.orders;
CREATE POLICY "Hotel managers view orders" ON public.orders
  FOR SELECT TO authenticated USING (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel managers update orders" ON public.orders;
CREATE POLICY "Hotel managers update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (is_manager() AND hotel_id = current_hotel_id())
  WITH CHECK (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel managers delete orders" ON public.orders;
CREATE POLICY "Hotel managers delete orders" ON public.orders
  FOR DELETE TO authenticated USING (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel servers view orders" ON public.orders;
CREATE POLICY "Hotel servers view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (is_server() AND hotel_id = current_hotel_id() AND table_number = ANY (get_server_tables()));

DROP POLICY IF EXISTS "Hotel servers update orders" ON public.orders;
CREATE POLICY "Hotel servers update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (is_server() AND hotel_id = current_hotel_id() AND table_number = ANY (get_server_tables()));

DROP POLICY IF EXISTS "Hotel kitchen view orders" ON public.orders;
CREATE POLICY "Hotel kitchen view orders" ON public.orders
  FOR SELECT TO authenticated USING (is_kitchen() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel kitchen update orders" ON public.orders;
CREATE POLICY "Hotel kitchen update orders" ON public.orders
  FOR UPDATE TO authenticated USING (is_kitchen() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Super admin views all orders" ON public.orders;
CREATE POLICY "Super admin views all orders" ON public.orders
  FOR SELECT TO authenticated USING (is_super_admin());

-- "Users view/insert/update own orders" already TO authenticated

-- ===== profiles =====
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ===== reviews =====
DROP POLICY IF EXISTS "Super admin views reviews" ON public.reviews;
CREATE POLICY "Super admin views reviews" ON public.reviews
  FOR SELECT TO authenticated USING (is_super_admin());

DROP POLICY IF EXISTS "Hotel managers view reviews" ON public.reviews;
CREATE POLICY "Hotel managers view reviews" ON public.reviews
  FOR SELECT TO authenticated USING (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Hotel managers delete reviews" ON public.reviews;
CREATE POLICY "Hotel managers delete reviews" ON public.reviews
  FOR DELETE TO authenticated USING (is_manager() AND hotel_id = current_hotel_id());

-- "Anyone insert reviews for active hotels" stays (anon + authenticated)

-- ===== servers =====
DROP POLICY IF EXISTS "Hotel managers manage servers" ON public.servers;
CREATE POLICY "Hotel managers manage servers" ON public.servers
  AS PERMISSIVE FOR ALL TO authenticated
  USING (is_manager() AND hotel_id = current_hotel_id())
  WITH CHECK (is_manager() AND hotel_id = current_hotel_id());

DROP POLICY IF EXISTS "Servers view own record" ON public.servers;
CREATE POLICY "Servers view own record" ON public.servers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ===== user_roles =====
-- Already TO authenticated, but the linter is still flagging it. Re-create explicitly.
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);