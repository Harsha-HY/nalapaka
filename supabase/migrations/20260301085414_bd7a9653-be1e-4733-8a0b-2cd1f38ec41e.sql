
-- Create profiles table for customer auto-fill
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text,
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create kitchen_staff table
CREATE TABLE public.kitchen_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  phone_number text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kitchen_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view kitchen staff" ON public.kitchen_staff FOR SELECT USING (is_manager());
CREATE POLICY "Managers can insert kitchen staff" ON public.kitchen_staff FOR INSERT WITH CHECK (is_manager());
CREATE POLICY "Managers can update kitchen staff" ON public.kitchen_staff FOR UPDATE USING (is_manager());
CREATE POLICY "Managers can delete kitchen staff" ON public.kitchen_staff FOR DELETE USING (is_manager());
CREATE POLICY "Kitchen staff can view own record" ON public.kitchen_staff FOR SELECT USING (auth.uid() = user_id);

-- Add kitchen-related columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_accepted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS accepted_by_kitchen_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS kitchen_prepared_at timestamptz;

-- Create is_kitchen function
CREATE OR REPLACE FUNCTION public.is_kitchen()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'kitchen')
$$;

-- Kitchen can view and update all orders
CREATE POLICY "Kitchen can view all orders" ON public.orders FOR SELECT USING (is_kitchen());
CREATE POLICY "Kitchen can update orders" ON public.orders FOR UPDATE USING (is_kitchen());

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kitchen_staff_updated_at
  BEFORE UPDATE ON public.kitchen_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
