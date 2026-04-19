
-- Wipe all hotel-scoped data first (FK-safe order)
DELETE FROM public.locked_seats;
DELETE FROM public.reviews;
DELETE FROM public.orders;
DELETE FROM public.menu_items;
DELETE FROM public.servers;
DELETE FROM public.kitchen_staff;
DELETE FROM public.hotel_members;
DELETE FROM public.hotels;
DELETE FROM public.profiles;
DELETE FROM public.user_roles;

-- Wipe auth users (cascade)
DELETE FROM auth.users;
