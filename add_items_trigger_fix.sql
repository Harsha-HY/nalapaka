-- Update trigger function to allow customers to update total_amount before payment is confirmed
CREATE OR REPLACE FUNCTION public.guard_order_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Staff bypass
  IF public.is_manager() OR public.is_server() OR public.is_kitchen() OR public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  -- Payment confirmation guard
  IF NEW.payment_confirmed IS DISTINCT FROM OLD.payment_confirmed THEN
    RAISE EXCEPTION 'Only managers can confirm payment';
  END IF;

  -- Allow total_amount updates ONLY before payment is confirmed (to support adding items)
  IF NEW.total_amount IS DISTINCT FROM OLD.total_amount AND OLD.payment_confirmed = true THEN
    RAISE EXCEPTION 'Customers cannot modify total_amount after payment is confirmed';
  END IF;

  -- Order status guard
  IF NEW.order_status IS DISTINCT FROM OLD.order_status THEN
    RAISE EXCEPTION 'Customers cannot change order_status';
  END IF;

  -- Staff workflow fields guard
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

  -- Ownership fields guard
  IF NEW.hotel_id IS DISTINCT FROM OLD.hotel_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Cannot modify ownership fields';
  END IF;

  RETURN NEW;
END;
$$;
