-- Allow guests and servers to delete table requests
DROP POLICY IF EXISTS "Anyone can delete table requests" ON public.table_requests;

CREATE POLICY "Anyone can delete table requests"
  ON public.table_requests FOR DELETE
  TO anon, authenticated
  USING (true);
