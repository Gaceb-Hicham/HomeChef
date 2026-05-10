-- =============================================================
-- HomeChef — Supabase Database Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New)
-- =============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- 1. USERS TABLE
-- ========================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'chef')) DEFAULT 'customer',
  profile_photo_url TEXT,
  city TEXT,
  area TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view basic user info"
  ON public.users FOR SELECT USING (true);


-- ========================
-- 2. CHEF PROFILES TABLE
-- ========================
CREATE TABLE public.chef_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  kitchen_name TEXT NOT NULL,
  bio TEXT,
  specialty_tags TEXT[] DEFAULT '{}',
  cover_photo_url TEXT,
  rating_average NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders_fulfilled INTEGER DEFAULT 0,
  response_rate NUMERIC(3,2) DEFAULT 0,
  is_open BOOLEAN DEFAULT FALSE,
  delivery_radius_km INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chef_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chef profiles"
  ON public.chef_profiles FOR SELECT USING (true);

CREATE POLICY "Chef can update own profile"
  ON public.chef_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Chef can insert own profile"
  ON public.chef_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ========================
-- 3. DAILY POSTS TABLE
-- ========================
CREATE TABLE public.daily_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  price INTEGER NOT NULL CHECK (price > 0),
  available_quantity INTEGER NOT NULL CHECK (available_quantity > 0),
  remaining_quantity INTEGER NOT NULL,
  order_deadline TIMESTAMPTZ NOT NULL,
  delivery_available BOOLEAN DEFAULT TRUE,
  pickup_available BOOLEAN DEFAULT TRUE,
  preorder_allowed BOOLEAN DEFAULT FALSE,
  is_sold_out BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.daily_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active posts"
  ON public.daily_posts FOR SELECT USING (is_active = true);

CREATE POLICY "Chef can manage own posts"
  ON public.daily_posts FOR ALL USING (auth.uid() = chef_id);

-- Index for feed queries
CREATE INDEX idx_daily_posts_date ON public.daily_posts(date DESC, is_active);
CREATE INDEX idx_daily_posts_chef ON public.daily_posts(chef_id, date DESC);


-- ========================
-- 4. ORDERS TABLE
-- ========================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.daily_posts(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  customer_note TEXT,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'refunded')),
  order_status TEXT DEFAULT 'received' CHECK (order_status IN ('received', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  scheduled_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer can view own orders"
  ON public.orders FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Chef can view their orders"
  ON public.orders FOR SELECT USING (auth.uid() = chef_id);

CREATE POLICY "Customer can create orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Chef can update order status"
  ON public.orders FOR UPDATE USING (auth.uid() = chef_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Indexes
CREATE INDEX idx_orders_customer ON public.orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_chef ON public.orders(chef_id, created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(order_status);


-- ========================
-- 5. REVIEWS TABLE
-- ========================
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.daily_posts(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  taste_rating INTEGER CHECK (taste_rating BETWEEN 1 AND 5),
  packaging_rating INTEGER CHECK (packaging_rating BETWEEN 1 AND 5),
  accuracy_rating INTEGER CHECK (accuracy_rating BETWEEN 1 AND 5),
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  chef_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Customer can create review"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Chef can reply to reviews"
  ON public.reviews FOR UPDATE USING (auth.uid() = chef_id);

-- Trigger: update chef_profiles.rating_average on new review
CREATE OR REPLACE FUNCTION update_chef_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chef_profiles
  SET rating_average = (
    SELECT COALESCE(AVG(overall_rating), 0)
    FROM public.reviews
    WHERE chef_id = NEW.chef_id
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM public.reviews
    WHERE chef_id = NEW.chef_id
  )
  WHERE user_id = NEW.chef_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_insert
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_chef_rating();


-- ========================
-- 6. ADDRESSES TABLE
-- ========================
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses"
  ON public.addresses FOR ALL USING (auth.uid() = user_id);


-- ========================
-- 7. NOTIFICATIONS TABLE
-- ========================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);


-- ========================
-- 8. SAVED ITEMS TABLE
-- ========================
CREATE TABLE public.saved_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('chef', 'dish')),
  reference_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, type, reference_id)
);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved items"
  ON public.saved_items FOR ALL USING (auth.uid() = user_id);


-- ========================
-- 9. FOLLOWERS TABLE
-- ========================
CREATE TABLE public.followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, chef_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follow counts"
  ON public.followers FOR SELECT USING (true);

CREATE POLICY "Users manage own follows"
  ON public.followers FOR ALL USING (auth.uid() = follower_id);


-- ========================
-- 10. STORAGE BUCKETS
-- ========================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('reviews', 'reviews', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('kitchens', 'kitchens', true);

-- Storage policies
CREATE POLICY "Anyone can view public images"
  ON storage.objects FOR SELECT USING (bucket_id IN ('avatars', 'posts', 'reviews', 'kitchens'));

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);


-- ========================
-- 11. REALTIME SUBSCRIPTIONS
-- ========================
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ========================
-- 12. DECREMENT REMAINING QTY FUNCTION (called on order)
-- ========================
CREATE OR REPLACE FUNCTION decrement_remaining_quantity(p_post_id UUID, p_qty INTEGER)
RETURNS void
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.daily_posts
  SET remaining_quantity = remaining_quantity - p_qty,
      is_sold_out = (remaining_quantity - p_qty <= 0)
  WHERE id = p_post_id AND remaining_quantity >= p_qty;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not enough quantity remaining';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- 13. MESSAGES TABLE (In-App Chat)
-- ========================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) NOT NULL,
  receiver_id UUID REFERENCES public.users(id) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ========================
-- 14. PROMO CODES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promos"
  ON public.promo_codes FOR SELECT
  USING (is_active = true);
