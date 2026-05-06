CREATE OR REPLACE FUNCTION public.guard_order_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_manager() OR public.is_server() OR public.is_kitchen() OR public.is_super_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.payment_confirmed IS DISTINCT FROM OLD.payment_confirmed THEN
    RAISE EXCEPTION 'Only managers can confirm payment';
  END IF;
  IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
    RAISE EXCEPTION 'Customers cannot modify total_amount';
  END IF;
  IF NEW.order_status IS DISTINCT FROM OLD.order_status THEN
    RAISE EXCEPTION 'Customers cannot change order_status';
  END IF;
  IF NEW.server_id IS DISTINCT FROM OLD.server_id
     OR NEW.accepted_by_server_id IS DISTINCT FROM OLD.accepted_by_server_id
     OR NEW.accepted_by_kitchen_name IS DISTINCT FROM OLD.accepted_by_kitchen_name
     OR NEW.kitchen_accepted_at IS DISTINCT FROM OLD.kitchen_accepted_at
     OR NEW.kitchen_prepared_at IS DISTINCT FROM OLD.kitchen_prepared_at
     OR NEW.server_accepted_at IS DISTINCT FROM OLD.server_accepted_at
     OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
     OR NEW.archived_at IS DISTINCT FROM OLD.archived_at THEN
    RAISE EXCEPTION 'Customers cannot modify staff/workflow fields';
  END IF;
  IF NEW.hotel_id IS DISTINCT FROM OLD.hotel_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify ownership fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_order_field_protection ON public.orders;
CREATE TRIGGER enforce_order_field_protection
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.guard_order_sensitive_fields();

-- Tighten locked_seats INSERT (drop any over-broad legacy policy if present)
DROP POLICY IF EXISTS "Authenticated users can insert locked seats" ON public.locked_seats;