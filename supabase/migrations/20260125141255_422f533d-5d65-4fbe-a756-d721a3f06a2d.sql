-- Add 'Cancelled' to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'Cancelled';

-- Add eating_finished column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS eating_finished BOOLEAN NOT NULL DEFAULT false;

-- Add payment_confirmed column (manager confirms payment)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_confirmed BOOLEAN NOT NULL DEFAULT false;

-- Create menu_items table for availability control
CREATE TABLE IF NOT EXISTS public.menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_kn TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read menu items
CREATE POLICY "Anyone can view menu items"
  ON public.menu_items
  FOR SELECT
  USING (true);

-- Only managers can update menu item availability
CREATE POLICY "Managers can update menu items"
  ON public.menu_items
  FOR UPDATE
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- Only managers can insert menu items
CREATE POLICY "Managers can insert menu items"
  ON public.menu_items
  FOR INSERT
  WITH CHECK (public.is_manager());

-- Trigger to update updated_at (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_menu_items_updated_at') THEN
    CREATE TRIGGER update_menu_items_updated_at
      BEFORE UPDATE ON public.menu_items
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Insert all menu items with default availability
INSERT INTO public.menu_items (id, name, name_kn, price, category, time_slot, is_available) VALUES
-- South Indian - Morning
('idli', 'Idli (2 pcs)', 'ಇಡ್ಲಿ (2 ಪೀಸ್)', 40, 'south-indian', 'morning', true),
('vada', 'Vada (2 pcs)', 'ವಡೆ (2 ಪೀಸ್)', 50, 'south-indian', 'morning', true),
('idli-vada', 'Idli Vada Combo', 'ಇಡ್ಲಿ ವಡೆ ಕಾಂಬೊ', 70, 'south-indian', 'morning', true),
('pongal', 'Ven Pongal', 'ವೆಣ್ ಪೊಂಗಲ್', 60, 'south-indian', 'morning', true),
('upma', 'Upma', 'ಉಪ್ಪಿಟ್ಟು', 45, 'south-indian', 'morning', true),
('kesari-bath', 'Kesari Bath', 'ಕೇಸರಿ ಬಾತ್', 50, 'south-indian', 'morning', true),
-- South Indian - All day
('plain-dosa', 'Plain Dosa', 'ಸಾದಾ ದೋಸೆ', 60, 'south-indian', 'all', true),
('masala-dosa', 'Masala Dosa', 'ಮಸಾಲೆ ದೋಸೆ', 80, 'south-indian', 'all', true),
('set-dosa', 'Set Dosa (3 pcs)', 'ಸೆಟ್ ದೋಸೆ (3 ಪೀಸ್)', 70, 'south-indian', 'all', true),
('rava-dosa', 'Rava Dosa', 'ರವೆ ದೋಸೆ', 75, 'south-indian', 'all', true),
('onion-dosa', 'Onion Dosa', 'ಈರುಳ್ಳಿ ದೋಸೆ', 70, 'south-indian', 'all', true),
('mysore-masala-dosa', 'Mysore Masala Dosa', 'ಮೈಸೂರು ಮಸಾಲೆ ದೋಸೆ', 90, 'south-indian', 'all', true),
('bisi-bele-bath', 'Bisi Bele Bath', 'ಬಿಸಿ ಬೇಳೆ ಬಾತ್', 80, 'south-indian', 'all', true),
-- South Indian - Afternoon
('full-meals', 'Full Meals', 'ಊಟ (ಪೂರ್ಣ)', 120, 'south-indian', 'afternoon', true),
('mini-meals', 'Mini Meals', 'ಮಿನಿ ಊಟ', 90, 'south-indian', 'afternoon', true),
('curd-rice', 'Curd Rice', 'ಮೊಸರು ಅನ್ನ', 60, 'south-indian', 'afternoon', true),
('sambar-rice', 'Sambar Rice', 'ಸಾಂಬಾರ್ ಅನ್ನ', 70, 'south-indian', 'afternoon', true),
-- North Indian
('paneer-butter-masala', 'Paneer Butter Masala', 'ಪನೀರ್ ಬಟರ್ ಮಸಾಲ', 180, 'north-indian', 'all', true),
('palak-paneer', 'Palak Paneer', 'ಪಾಲಕ್ ಪನೀರ್', 170, 'north-indian', 'all', true),
('dal-fry', 'Dal Fry', 'ದಾಲ್ ಫ್ರೈ', 120, 'north-indian', 'all', true),
('dal-tadka', 'Dal Tadka', 'ದಾಲ್ ತಡ್ಕಾ', 130, 'north-indian', 'all', true),
('mixed-veg', 'Mixed Vegetable Curry', 'ಮಿಕ್ಸ್ಡ್ ವೆಜಿಟೇಬಲ್', 140, 'north-indian', 'all', true),
('aloo-gobi', 'Aloo Gobi', 'ಆಲೂ ಗೋಬಿ', 130, 'north-indian', 'all', true),
('chana-masala', 'Chana Masala', 'ಚನಾ ಮಸಾಲ', 140, 'north-indian', 'all', true),
('butter-roti', 'Butter Roti', 'ಬಟರ್ ರೋಟಿ', 30, 'north-indian', 'all', true),
('plain-naan', 'Plain Naan', 'ಸಾದಾ ನಾನ್', 40, 'north-indian', 'all', true),
('butter-naan', 'Butter Naan', 'ಬಟರ್ ನಾನ್', 50, 'north-indian', 'all', true),
('garlic-naan', 'Garlic Naan', 'ಗಾರ್ಲಿಕ್ ನಾನ್', 60, 'north-indian', 'all', true),
('jeera-rice', 'Jeera Rice', 'ಜೀರಾ ರೈಸ್', 100, 'north-indian', 'all', true),
-- Chinese
('veg-fried-rice', 'Veg Fried Rice', 'ವೆಜ್ ಫ್ರೈಡ್ ರೈಸ್', 120, 'chinese', 'all', true),
('schezwan-fried-rice', 'Schezwan Fried Rice', 'ಶೆಜ್ವಾನ್ ಫ್ರೈಡ್ ರೈಸ್', 140, 'chinese', 'all', true),
('veg-noodles', 'Veg Noodles', 'ವೆಜ್ ನೂಡಲ್ಸ್', 110, 'chinese', 'all', true),
('hakka-noodles', 'Hakka Noodles', 'ಹಕ್ಕಾ ನೂಡಲ್ಸ್', 120, 'chinese', 'all', true),
('schezwan-noodles', 'Schezwan Noodles', 'ಶೆಜ್ವಾನ್ ನೂಡಲ್ಸ್', 130, 'chinese', 'all', true),
('manchurian-dry', 'Gobi Manchurian Dry', 'ಗೋಬಿ ಮಂಚೂರಿಯನ್ ಡ್ರೈ', 140, 'chinese', 'all', true),
('manchurian-gravy', 'Gobi Manchurian Gravy', 'ಗೋಬಿ ಮಂಚೂರಿಯನ್ ಗ್ರೇವಿ', 150, 'chinese', 'all', true),
('paneer-chilli', 'Chilli Paneer', 'ಚಿಲ್ಲಿ ಪನೀರ್', 180, 'chinese', 'all', true),
('spring-roll', 'Veg Spring Roll', 'ವೆಜ್ ಸ್ಪ್ರಿಂಗ್ ರೋಲ್', 100, 'chinese', 'all', true),
('sweet-corn-soup', 'Sweet Corn Soup', 'ಸ್ವೀಟ್ ಕಾರ್ನ್ ಸೂಪ್', 80, 'chinese', 'all', true),
-- Tandoor
('paneer-tikka', 'Paneer Tikka', 'ಪನೀರ್ ಟಿಕ್ಕಾ', 200, 'tandoor', 'evening', true),
('malai-paneer-tikka', 'Malai Paneer Tikka', 'ಮಲಾಯಿ ಪನೀರ್ ಟಿಕ್ಕಾ', 220, 'tandoor', 'evening', true),
('tandoori-roti', 'Tandoori Roti', 'ತಂದೂರಿ ರೋಟಿ', 35, 'tandoor', 'evening', true),
('rumali-roti', 'Rumali Roti', 'ರುಮಾಲಿ ರೋಟಿ', 40, 'tandoor', 'evening', true),
('kulcha', 'Stuffed Kulcha', 'ಸ್ಟಫ್ಡ್ ಕುಲ್ಚಾ', 70, 'tandoor', 'evening', true),
('mushroom-tikka', 'Mushroom Tikka', 'ಮಶ್ರೂಮ್ ಟಿಕ್ಕಾ', 180, 'tandoor', 'evening', true),
('veg-seekh-kebab', 'Veg Seekh Kebab', 'ವೆಜ್ ಸೀಖ್ ಕಬಾಬ್', 160, 'tandoor', 'evening', true),
('hara-bhara-kebab', 'Hara Bhara Kebab', 'ಹರಾ ಭರಾ ಕಬಾಬ್', 150, 'tandoor', 'evening', true),
-- Evening snacks
('samosa', 'Samosa (2 pcs)', 'ಸಮೋಸ (2 ಪೀಸ್)', 40, 'south-indian', 'evening', true),
('mirchi-bajji', 'Mirchi Bajji (4 pcs)', 'ಮಿರ್ಚಿ ಬಜ್ಜಿ (4 ಪೀಸ್)', 50, 'south-indian', 'evening', true),
('onion-pakoda', 'Onion Pakoda', 'ಈರುಳ್ಳಿ ಪಕೋಡ', 60, 'south-indian', 'evening', true),
('bread-pakoda', 'Bread Pakoda', 'ಬ್ರೆಡ್ ಪಕೋಡ', 50, 'south-indian', 'evening', true),
('masala-chai', 'Masala Chai', 'ಮಸಾಲ ಚಹಾ', 25, 'south-indian', 'evening', true),
('filter-coffee', 'Filter Coffee', 'ಫಿಲ್ಟರ್ ಕಾಫಿ', 30, 'south-indian', 'evening', true),
-- Night specials
('roti-sabji', 'Roti Sabji Combo', 'ರೋಟಿ ಸಬ್ಜಿ ಕಾಂಬೊ', 100, 'north-indian', 'night', true),
('chapathi-kurma', 'Chapathi Kurma', 'ಚಪಾತಿ ಕುರ್ಮಾ', 90, 'south-indian', 'night', true),
('paratha-curry', 'Paratha with Curry', 'ಪರೋಟಾ ಕರಿ', 80, 'south-indian', 'night', true)
ON CONFLICT (id) DO NOTHING;