
-- 1) Allow customers to DELETE their own locked_seats (via order ownership)
CREATE POLICY "Customers can delete own locked seats"
ON public.locked_seats
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = locked_seats.order_id
      AND orders.user_id = auth.uid()
  )
);

-- 2) Allow servers to DELETE locked_seats for their assigned tables
CREATE POLICY "Servers can delete assigned table locked seats"
ON public.locked_seats
FOR DELETE
USING (
  is_server() AND table_number = ANY(get_server_tables())
);

-- 3) Allow servers to UPDATE orders for their assigned tables (for accepting orders)
CREATE POLICY "Servers can update assigned table orders"
ON public.orders
FOR UPDATE
USING (
  is_server() AND table_number = ANY(get_server_tables())
);
