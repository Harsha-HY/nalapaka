-- Create trigger function to delete user from auth.users when server/kitchen account is deleted
CREATE OR REPLACE FUNCTION public.handle_delete_staff_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Delete the user from auth.users (cascades to user_roles, hotel_members, etc.)
  DELETE FROM auth.users WHERE id = OLD.user_id;
  RETURN OLD;
END;
$$;

-- Triggers for servers and kitchen_staff
DROP TRIGGER IF EXISTS on_server_deleted ON public.servers;
CREATE TRIGGER on_server_deleted
  AFTER DELETE ON public.servers
  FOR EACH ROW EXECUTE FUNCTION public.handle_delete_staff_user();

DROP TRIGGER IF EXISTS on_kitchen_deleted ON public.kitchen_staff;
CREATE TRIGGER on_kitchen_deleted
  AFTER DELETE ON public.kitchen_staff
  FOR EACH ROW EXECUTE FUNCTION public.handle_delete_staff_user();
