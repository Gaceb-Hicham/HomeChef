-- =============================================================
-- HomeChef — Seed Data for Development
-- Run this AFTER migration.sql in the Supabase SQL Editor
-- =============================================================

-- NOTE: These seed users won't have auth.users entries unless you
-- create them via Supabase Auth first. For development, you can
-- use the Supabase Dashboard to create test users, then update
-- the IDs below to match.

-- EXAMPLE: Replace these UUIDs with actual auth.users IDs

-- Customer users
INSERT INTO public.users (id, full_name, email, phone, role, city, area, is_verified, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Ali Khelifi', 'ali@test.com', '0550123456', 'customer', 'Algiers', 'Bab El Oued', true, true),
  ('22222222-2222-2222-2222-222222222222', 'Nour Saidi', 'nour@test.com', '0551234567', 'customer', 'Algiers', 'Kouba', true, true),
  ('33333333-3333-3333-3333-333333333333', 'Riad Mekki', 'riad@test.com', '0552345678', 'customer', 'Algiers', 'El Harrach', true, true);

-- Chef users
INSERT INTO public.users (id, full_name, email, phone, role, city, area, is_verified, is_active) VALUES
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sarah Kaddour', 'sarah@chef.com', '0553456789', 'chef', 'Algiers', 'Hydra', true, true),
  ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ahmed Mansouri', 'ahmed@chef.com', '0554567890', 'chef', 'Algiers', 'Kouba', true, true),
  ('cccc3333-cccc-cccc-cccc-cccccccccccc', 'Fatima Ziani', 'fatima@chef.com', '0555678901', 'chef', 'Algiers', 'Bab El Oued', true, true),
  ('dddd4444-dddd-dddd-dddd-dddddddddddd', 'Karim Belkacemi', 'karim@chef.com', '0556789012', 'chef', 'Oran', 'Centre', true, true);

-- Add location columns if they don't exist
ALTER TABLE public.chef_profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.chef_profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Chef profiles (with real Algiers GPS coordinates)
INSERT INTO public.chef_profiles (user_id, kitchen_name, bio, specialty_tags, rating_average, total_reviews, total_orders_fulfilled, response_rate, is_open, delivery_radius_km, latitude, longitude) VALUES
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mama Sarah Kitchen', 'Traditional Algerian cuisine made with love. Specializing in couscous and tajines.', ARRAY['Couscous', 'Tajine', 'Traditional'], 4.8, 156, 342, 0.97, true, 5, 36.7455, 3.0325),
  ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sweet Ahmed', 'Artisan pastries and traditional Algerian desserts.', ARRAY['Baklava', 'Makrout', 'Pastries'], 4.6, 89, 201, 0.92, true, 3, 36.7240, 3.0850),
  ('cccc3333-cccc-cccc-cccc-cccccccccccc', 'Fatima''s Fresh Kitchen', 'Fresh daily meals with seasonal ingredients.', ARRAY['Chorba', 'Salads', 'Healthy'], 4.9, 210, 450, 0.99, true, 7, 36.7920, 3.0513),
  ('dddd4444-dddd-dddd-dddd-dddddddddddd', 'Karim Bakery', 'Freshly baked bread and traditional Algerian baked goods.', ARRAY['Bread', 'Bourek', 'Bakery'], 4.5, 67, 150, 0.88, false, 4, 36.7660, 3.0540);

-- Daily posts (today's specials)
INSERT INTO public.daily_posts (chef_id, title, description, price, available_quantity, remaining_quantity, order_deadline, delivery_available, pickup_available, preorder_allowed, date) VALUES
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Couscous Royal', 'Traditional Friday couscous with lamb, chickpeas, and seven vegetables. Served with spicy sauce.', 850, 15, 5, (CURRENT_DATE + TIME '14:00')::timestamptz, true, true, false, CURRENT_DATE),
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tajine Zitoune', 'Chicken tajine with green olives and preserved lemons. A classic Algerian comfort dish.', 700, 10, 7, (CURRENT_DATE + TIME '13:30')::timestamptz, true, true, false, CURRENT_DATE),
  ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Baklava Box', 'Assorted box of 12 hand-made baklava pieces with pistachio and almond filling.', 450, 20, 12, (CURRENT_DATE + TIME '16:00')::timestamptz, true, true, true, CURRENT_DATE),
  ('bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Makrout', 'Traditional date-filled semolina cookies, fried and dipped in honey.', 350, 25, 18, (CURRENT_DATE + TIME '15:00')::timestamptz, true, false, false, CURRENT_DATE),
  ('cccc3333-cccc-cccc-cccc-cccccccccccc', 'Chorba Frik', 'Hearty traditional soup with crushed wheat and lamb. Perfect for lunch.', 400, 20, 15, (CURRENT_DATE + TIME '12:30')::timestamptz, true, true, false, CURRENT_DATE),
  ('cccc3333-cccc-cccc-cccc-cccccccccccc', 'Grilled Chicken Plate', 'Marinated grilled chicken with rice and grilled vegetables.', 750, 12, 3, (CURRENT_DATE + TIME '13:00')::timestamptz, true, true, false, CURRENT_DATE),
  ('dddd4444-dddd-dddd-dddd-dddddddddddd', 'Fresh Baguettes', 'Crispy French-style baguettes baked fresh every morning.', 150, 30, 20, (CURRENT_DATE + TIME '11:00')::timestamptz, false, true, false, CURRENT_DATE);

-- Sample orders
INSERT INTO public.orders (customer_id, chef_id, post_id, quantity, unit_price, total_price, delivery_type, payment_method, payment_status, order_status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   (SELECT id FROM public.daily_posts WHERE title = 'Couscous Royal' LIMIT 1),
   2, 850, 1700, 'delivery', 'card', 'paid', 'preparing'),
  ('22222222-2222-2222-2222-222222222222', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   (SELECT id FROM public.daily_posts WHERE title = 'Baklava Box' LIMIT 1),
   1, 450, 450, 'pickup', 'cash', 'pending', 'received'),
  ('33333333-3333-3333-3333-333333333333', 'cccc3333-cccc-cccc-cccc-cccccccccccc',
   (SELECT id FROM public.daily_posts WHERE title = 'Chorba Frik' LIMIT 1),
   3, 400, 1200, 'delivery', 'card', 'paid', 'delivered');

-- Sample reviews
INSERT INTO public.reviews (order_id, customer_id, chef_id, post_id, overall_rating, taste_rating, packaging_rating, accuracy_rating, comment) VALUES
  ((SELECT id FROM public.orders WHERE customer_id = '33333333-3333-3333-3333-333333333333' LIMIT 1),
   '33333333-3333-3333-3333-333333333333', 'cccc3333-cccc-cccc-cccc-cccccccccccc',
   (SELECT id FROM public.daily_posts WHERE title = 'Chorba Frik' LIMIT 1),
   5, 5, 5, 5, 'Absolutely delicious! Just like my grandmother used to make. Will order again!');

-- Sample notifications
INSERT INTO public.notifications (user_id, type, title, body, is_read) VALUES
  ('11111111-1111-1111-1111-111111111111', 'order', 'Order Confirmed 🎉', 'Your Couscous Royal order is being prepared by Sarah K.', false),
  ('11111111-1111-1111-1111-111111111111', 'promo', '20% Off Weekend Special', 'Use code WEEKEND20 for 20% off your next order!', true),
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'order', 'New Order! 📱', 'Ali K. ordered 2x Couscous Royal.', false),
  ('aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'review', 'New 5-Star Review ⭐', 'Riad M. loved your Chorba Frik!', false);

-- Sample saved items
INSERT INTO public.saved_items (user_id, type, reference_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'chef', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('11111111-1111-1111-1111-111111111111', 'dish', (SELECT id FROM public.daily_posts WHERE title = 'Baklava Box' LIMIT 1)),
  ('22222222-2222-2222-2222-222222222222', 'chef', 'cccc3333-cccc-cccc-cccc-cccccccccccc');

-- Sample followers
INSERT INTO public.followers (follower_id, chef_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('11111111-1111-1111-1111-111111111111', 'cccc3333-cccc-cccc-cccc-cccccccccccc'),
  ('22222222-2222-2222-2222-222222222222', 'aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('33333333-3333-3333-3333-333333333333', 'cccc3333-cccc-cccc-cccc-cccccccccccc');

-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SECURITY: Enable RLS on messages (safe to re-run)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Add policies (skip if already exist from migration.sql)
DO $$ BEGIN
  CREATE POLICY "Users read own messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users send own messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create promo codes table if not exists
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SECURITY: Enable RLS on promo codes (safe to re-run)
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone reads active promos" ON public.promo_codes
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed promo codes
INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order, is_active) VALUES
  ('HOMECHEF10', 'percentage', 10, 300, true),
  ('WELCOME50', 'fixed', 50, 200, true),
  ('FREEDEL', 'free_delivery', 100, 0, true)
ON CONFLICT (code) DO NOTHING;
