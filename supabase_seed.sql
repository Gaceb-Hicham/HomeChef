-- ============================================================
-- HomeChef — Complete Database Schema + Seed Data
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- ============================================================
-- 1. CREATE TABLES
-- ============================================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'chef')),
  profile_photo_url TEXT,
  city TEXT,
  area TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);

-- Chef profiles
CREATE TABLE IF NOT EXISTS public.chef_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  kitchen_name TEXT NOT NULL,
  bio TEXT,
  specialty_tags TEXT[] DEFAULT '{}',
  cover_photo_url TEXT,
  rating_average NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders_fulfilled INTEGER DEFAULT 0,
  response_rate NUMERIC(5,2) DEFAULT 100,
  is_open BOOLEAN DEFAULT true,
  delivery_radius_km INTEGER DEFAULT 5,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily posts (dishes)
CREATE TABLE IF NOT EXISTS public.daily_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  price NUMERIC(10,2) NOT NULL,
  available_quantity INTEGER NOT NULL DEFAULT 10,
  remaining_quantity INTEGER NOT NULL DEFAULT 10,
  order_deadline TIMESTAMPTZ,
  delivery_available BOOLEAN DEFAULT true,
  pickup_available BOOLEAN DEFAULT true,
  preorder_allowed BOOLEAN DEFAULT false,
  is_sold_out BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE DEFAULT CURRENT_DATE
);

-- Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  chef_id UUID REFERENCES public.users(id) NOT NULL,
  post_id UUID REFERENCES public.daily_posts(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  customer_note TEXT,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'cash')) DEFAULT 'cash',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'pending')) DEFAULT 'pending',
  order_status TEXT NOT NULL CHECK (order_status IN ('received', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')) DEFAULT 'received',
  scheduled_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) NOT NULL,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  chef_id UUID REFERENCES public.users(id) NOT NULL,
  post_id UUID REFERENCES public.daily_posts(id) NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  taste_rating INTEGER CHECK (taste_rating BETWEEN 1 AND 5),
  packaging_rating INTEGER CHECK (packaging_rating BETWEEN 1 AND 5),
  accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  chef_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  full_address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_default BOOLEAN DEFAULT false
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved items
CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('chef', 'dish')),
  reference_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Followers
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  chef_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, chef_id)
);

-- ============================================================
-- 2. DISABLE RLS FOR TESTING (re-enable for production!)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chef_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for testing (REMOVE in production)
CREATE POLICY IF NOT EXISTS "Allow all for testing" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for testing" ON public.chef_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for testing" ON public.daily_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for testing" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for testing" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for testing" ON public.addresses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for testing" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for testing" ON public.saved_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all for testing" ON public.followers FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 3. SEED DATA — Realistic Algerian Test Data
-- ============================================================

-- === CHEF USERS ===
INSERT INTO public.users (id, full_name, email, phone, role, city, area, is_verified, is_active) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Fatima Benali', 'fatima@homechef.test', '0555123456', 'chef', 'Algiers', 'Bab El Oued', true, true),
  ('c1000000-0000-0000-0000-000000000002', 'Sarah Khelifi', 'sarah@homechef.test', '0661987654', 'chef', 'Algiers', 'Hydra', true, true),
  ('c1000000-0000-0000-0000-000000000003', 'Karim Boudiaf', 'karim@homechef.test', '0770456789', 'chef', 'Algiers', 'Didouche Mourad', true, true)
ON CONFLICT (email) DO NOTHING;

-- === CUSTOMER USERS ===
INSERT INTO public.users (id, full_name, email, phone, role, city, area, is_verified, is_active) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Ahmed Mansouri', 'ahmed@homechef.test', '0555000111', 'customer', 'Algiers', 'Kouba', true, true),
  ('d1000000-0000-0000-0000-000000000002', 'Nadia Saidi', 'nadia@homechef.test', '0661000222', 'customer', 'Algiers', 'El Biar', true, true)
ON CONFLICT (email) DO NOTHING;

-- === CHEF PROFILES (with REAL Algiers coordinates) ===
INSERT INTO public.chef_profiles (user_id, kitchen_name, bio, specialty_tags, rating_average, total_reviews, total_orders_fulfilled, is_open, delivery_radius_km, latitude, longitude) VALUES
  (
    'c1000000-0000-0000-0000-000000000001',
    'مطبخ الأصيل',
    'Authentic home-cooked Algerian cuisine. Couscous every Friday, Tajine daily. 20 years of family recipes passed down through generations.',
    ARRAY['Couscous', 'Tajine', 'Chorba', 'Traditional'],
    4.7, 23, 89, true, 8,
    36.7920, 3.0513  -- Bab El Oued
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'حلويات سارة',
    'Premium handmade pastries and desserts. Specializing in Baklava, Makroud, and custom celebration cakes.',
    ARRAY['Baklava', 'Makroud', 'Cakes', 'Desserts'],
    4.9, 45, 156, true, 12,
    36.7455, 3.0325  -- Hydra
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'بيتزا دار',
    'Fresh wood-fired pizza and Bourek. Fast, tasty, and affordable. Open for lunch and dinner.',
    ARRAY['Pizza', 'Bourek', 'Fast Food', 'Sandwiches'],
    4.3, 12, 45, false, 5,
    36.7660, 3.0540  -- Didouche Mourad
  )
ON CONFLICT (user_id) DO NOTHING;

-- === DAILY POSTS (dishes) ===
INSERT INTO public.daily_posts (id, chef_id, title, description, price, available_quantity, remaining_quantity, delivery_available, pickup_available, preorder_allowed, is_active, date) VALUES
  -- Fatima's dishes
  (
    'p1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'كسكس بالخضر واللحم',
    'Couscous with seven vegetables and tender lamb. Served with buttermilk (lben). Feeds 2-3 people.',
    800, 15, 8, true, true, true, true, CURRENT_DATE
  ),
  (
    'p1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'شوربة فريك',
    'Traditional Chorba Frik soup with lamb and hand-rolled wheat. Perfect for dinner.',
    400, 20, 14, true, true, false, true, CURRENT_DATE
  ),
  -- Sarah's desserts
  (
    'p1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000002',
    'بقلاوة تقليدية',
    'Handmade baklava with pistachios and honey syrup. Box of 12 pieces.',
    1200, 10, 6, true, true, true, true, CURRENT_DATE
  ),
  (
    'p1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000002',
    'مقروط بالتمر',
    'Classic Makroud with premium Deglet Nour dates, deep fried and dipped in honey. Box of 20.',
    900, 12, 9, true, true, false, true, CURRENT_DATE
  ),
  -- Karim's food
  (
    'p1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000003',
    'بيتزا مارغريتا',
    'Wood-fired Margherita pizza. Fresh mozzarella, basil, and San Marzano sauce.',
    600, 25, 18, true, true, false, true, CURRENT_DATE
  ),
  (
    'p1000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000003',
    'بوراك باللحم',
    'Crispy Bourek rolls stuffed with seasoned ground beef, onions, and herbs. Pack of 6.',
    500, 30, 22, true, true, false, true, CURRENT_DATE
  )
ON CONFLICT (id) DO NOTHING;

-- === SAMPLE ORDERS ===
INSERT INTO public.orders (id, customer_id, chef_id, post_id, quantity, unit_price, total_price, delivery_type, payment_method, payment_status, order_status, created_at) VALUES
  -- Ahmed ordered couscous (delivered)
  (
    'o1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'p1000000-0000-0000-0000-000000000001',
    2, 800, 1600, 'delivery', 'cash', 'paid', 'delivered',
    now() - interval '2 days'
  ),
  -- Nadia ordered baklava (preparing)
  (
    'o1000000-0000-0000-0000-000000000002',
    'd1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000002',
    'p1000000-0000-0000-0000-000000000003',
    1, 1200, 1200, 'pickup', 'cash', 'pending', 'preparing',
    now() - interval '1 hour'
  ),
  -- Ahmed ordered pizza (received)
  (
    'o1000000-0000-0000-0000-000000000003',
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000003',
    'p1000000-0000-0000-0000-000000000005',
    3, 600, 1800, 'delivery', 'cash', 'pending', 'received',
    now() - interval '30 minutes'
  )
ON CONFLICT (id) DO NOTHING;

-- === SAMPLE REVIEW ===
INSERT INTO public.reviews (order_id, customer_id, chef_id, post_id, overall_rating, taste_rating, packaging_rating, accuracy_rating, comment) VALUES
  (
    'o1000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'p1000000-0000-0000-0000-000000000001',
    5, 5, 4, 5,
    'Best couscous in Algiers! Perfectly seasoned, generous portion. Will order again. ممتاز!'
  )
ON CONFLICT DO NOTHING;

-- === SAMPLE NOTIFICATIONS ===
INSERT INTO public.notifications (user_id, type, title, body, reference_id, reference_type, is_read) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'new_order', '🔔 New Order!', 'Ahmed ordered 2× Couscous', 'o1000000-0000-0000-0000-000000000001', 'order', true),
  ('c1000000-0000-0000-0000-000000000001', 'review', '⭐ New Review!', 'Ahmed gave you 5 stars', 'o1000000-0000-0000-0000-000000000001', 'review', false),
  ('d1000000-0000-0000-0000-000000000001', 'order_status', '✅ Order Delivered', 'Your couscous order has been delivered', 'o1000000-0000-0000-0000-000000000001', 'order', true),
  ('c1000000-0000-0000-0000-000000000002', 'new_order', '🔔 New Order!', 'Nadia ordered Baklava', 'o1000000-0000-0000-0000-000000000002', 'order', false)
ON CONFLICT DO NOTHING;

-- === CUSTOMER ADDRESS ===
INSERT INTO public.addresses (user_id, label, full_address, latitude, longitude, is_default) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Home', 'Rue Didouche Mourad, Kouba, Algiers', 36.7240, 3.0850, true),
  ('d1000000-0000-0000-0000-000000000002', 'Home', '12 Rue des Frères, El Biar, Algiers', 36.7680, 3.0300, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. CREATE STORAGE BUCKETS (run separately in Supabase dashboard)
-- ============================================================
-- Go to Storage > Create bucket:
--   ✅ avatars  (public)
--   ✅ posts    (public)
--   ✅ reviews  (public)
--   ✅ kitchens (public)
