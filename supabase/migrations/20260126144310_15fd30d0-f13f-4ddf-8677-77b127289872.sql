-- Add DELETE policy for managers
CREATE POLICY "Managers can delete orders"
  ON public.orders
  FOR DELETE
  USING (public.is_manager());