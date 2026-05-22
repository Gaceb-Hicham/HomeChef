-- =============================================================
-- HomeChef — Full Schema Upgrade Migration (IDEMPOTENT)
-- Safe to re-run multiple times — uses DROP IF EXISTS + CREATE
-- Run this in Supabase SQL Editor AFTER the initial migration
-- =============================================================

-- ========================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ========================

-- Users: add latitude/longitude for location
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS latitude DECIMAL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS longitude DECIMAL;

-- Chef profiles: add is_verified badge
ALTER TABLE public.chef_profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Orders: add order_type and reference_id for multi-mode support
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'instant';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Reviews: add multi-category ratings and chef reply
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS taste_rating INTEGER;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS packaging_rating INTEGER;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS accuracy_rating INTEGER;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS chef_reply TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT '{}';


-- ========================
-- PREP MENU ITEMS TABLE (Mode 2)
-- ========================
CREATE TABLE IF NOT EXISTS public.prep_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  base_price INTEGER NOT NULL CHECK (base_price > 0),
  price_negotiable BOOLEAN DEFAULT FALSE,
  min_order_qty INTEGER DEFAULT 1,
  min_notice_hours INTEGER DEFAULT 24,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prep_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active prep items" ON public.prep_menu_items;
CREATE POLICY "Anyone can view active prep items"
  ON public.prep_menu_items FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Chef can manage own prep items" ON public.prep_menu_items;
CREATE POLICY "Chef can manage own prep items"
  ON public.prep_menu_items FOR ALL USING (auth.uid() = chef_id);


-- ========================
-- PREP REQUESTS TABLE (Mode 2)
-- ========================
CREATE TABLE IF NOT EXISTS public.prep_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.prep_menu_items(id) ON DELETE CASCADE,
  requested_date TIMESTAMPTZ NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  offered_price INTEGER,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  chef_response_note TEXT,
  counter_price INTEGER,
  counter_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.prep_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer can view own prep requests" ON public.prep_requests;
CREATE POLICY "Customer can view own prep requests"
  ON public.prep_requests FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Chef can view incoming prep requests" ON public.prep_requests;
CREATE POLICY "Chef can view incoming prep requests"
  ON public.prep_requests FOR SELECT USING (auth.uid() = chef_id);

DROP POLICY IF EXISTS "Customer can create prep requests" ON public.prep_requests;
CREATE POLICY "Customer can create prep requests"
  ON public.prep_requests FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Chef can update prep requests" ON public.prep_requests;
CREATE POLICY "Chef can update prep requests"
  ON public.prep_requests FOR UPDATE USING (auth.uid() = chef_id);

DROP POLICY IF EXISTS "Customer can update own prep requests" ON public.prep_requests;
CREATE POLICY "Customer can update own prep requests"
  ON public.prep_requests FOR UPDATE USING (auth.uid() = customer_id);


-- ========================
-- CHEF SPECIALTIES TABLE (Mode 3)
-- ========================
CREATE TABLE IF NOT EXISTS public.chef_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  price_range_min INTEGER NOT NULL CHECK (price_range_min > 0),
  price_range_max INTEGER NOT NULL CHECK (price_range_max >= price_range_min),
  prep_time_hours INTEGER DEFAULT 24,
  availability TEXT DEFAULT 'always' CHECK (availability IN ('always', 'seasonal', 'on_request')),
  category TEXT DEFAULT 'other',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chef_specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active specialties" ON public.chef_specialties;
CREATE POLICY "Anyone can view active specialties"
  ON public.chef_specialties FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Chef can manage own specialties" ON public.chef_specialties;
CREATE POLICY "Chef can manage own specialties"
  ON public.chef_specialties FOR ALL USING (auth.uid() = chef_id);


-- ========================
-- CHEF AVAILABILITY TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.chef_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  note TEXT,
  UNIQUE(chef_id, date)
);

ALTER TABLE public.chef_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view chef availability" ON public.chef_availability;
CREATE POLICY "Anyone can view chef availability"
  ON public.chef_availability FOR SELECT USING (true);

DROP POLICY IF EXISTS "Chef can manage own availability" ON public.chef_availability;
CREATE POLICY "Chef can manage own availability"
  ON public.chef_availability FOR ALL USING (auth.uid() = chef_id);


-- ========================
-- COMMENTS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.daily_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE USING (auth.uid() = user_id);


-- ========================
-- COMMENT LIKES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view likes" ON public.comment_likes;
CREATE POLICY "Anyone can view likes"
  ON public.comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can toggle likes" ON public.comment_likes;
CREATE POLICY "Users can toggle likes"
  ON public.comment_likes FOR ALL USING (auth.uid() = user_id);


-- ========================
-- PAYMENT METHODS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_last4 TEXT,
  card_brand TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own payment methods" ON public.payment_methods;
CREATE POLICY "Users can manage own payment methods"
  ON public.payment_methods FOR ALL USING (auth.uid() = user_id);


-- ========================
-- EARNINGS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chef can view own earnings" ON public.earnings;
CREATE POLICY "Chef can view own earnings"
  ON public.earnings FOR SELECT USING (auth.uid() = chef_id);


-- ========================
-- WITHDRAWALS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  bank_info JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chef can view own withdrawals" ON public.withdrawals;
CREATE POLICY "Chef can view own withdrawals"
  ON public.withdrawals FOR SELECT USING (auth.uid() = chef_id);

DROP POLICY IF EXISTS "Chef can request withdrawals" ON public.withdrawals;
CREATE POLICY "Chef can request withdrawals"
  ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = chef_id);


-- ========================
-- FLASH SALES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.daily_posts(id) ON DELETE CASCADE,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 80),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active flash sales" ON public.flash_sales;
CREATE POLICY "Anyone can view active flash sales"
  ON public.flash_sales FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Chef can manage own flash sales" ON public.flash_sales;
CREATE POLICY "Chef can manage own flash sales"
  ON public.flash_sales FOR ALL USING (auth.uid() = chef_id);


-- ========================
-- GROUP ORDERS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.group_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.prep_menu_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_quantity INTEGER NOT NULL CHECK (target_quantity > 0),
  current_quantity INTEGER DEFAULT 0,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reached', 'submitted', 'cancelled')),
  invite_code TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.group_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view open group orders" ON public.group_orders;
CREATE POLICY "Anyone can view open group orders"
  ON public.group_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create group orders" ON public.group_orders;
CREATE POLICY "Users can create group orders"
  ON public.group_orders FOR INSERT WITH CHECK (auth.uid() = initiator_id);

DROP POLICY IF EXISTS "Initiator can manage group order" ON public.group_orders;
CREATE POLICY "Initiator can manage group order"
  ON public.group_orders FOR UPDATE USING (auth.uid() = initiator_id);


-- ========================
-- GROUP ORDER PARTICIPANTS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.group_order_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_order_id UUID NOT NULL REFERENCES public.group_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_order_id, customer_id)
);

ALTER TABLE public.group_order_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view participants" ON public.group_order_participants;
CREATE POLICY "Anyone can view participants"
  ON public.group_order_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join group orders" ON public.group_order_participants;
CREATE POLICY "Users can join group orders"
  ON public.group_order_participants FOR INSERT WITH CHECK (auth.uid() = customer_id);


-- ========================
-- WAITLIST TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.daily_posts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  UNIQUE(post_id, customer_id)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own waitlist" ON public.waitlist;
CREATE POLICY "Users can view own waitlist"
  ON public.waitlist FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can join waitlist" ON public.waitlist;
CREATE POLICY "Users can join waitlist"
  ON public.waitlist FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Users can leave waitlist" ON public.waitlist;
CREATE POLICY "Users can leave waitlist"
  ON public.waitlist FOR DELETE USING (auth.uid() = customer_id);


-- ========================
-- SUBSCRIPTIONS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_title TEXT NOT NULL,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly')),
  preferred_day TEXT DEFAULT 'monday',
  quantity INTEGER DEFAULT 1,
  price INTEGER NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  next_order_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, chef_id, item_title)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Customer can view own subscriptions"
  ON public.subscriptions FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Chef can view incoming subscriptions" ON public.subscriptions;
CREATE POLICY "Chef can view incoming subscriptions"
  ON public.subscriptions FOR SELECT USING (auth.uid() = chef_id);

DROP POLICY IF EXISTS "Customer can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Customer can manage subscriptions"
  ON public.subscriptions FOR ALL USING (auth.uid() = customer_id);


-- ========================
-- TEASER POSTS TABLE (Coming Soon)
-- ========================
CREATE TABLE IF NOT EXISTS public.teaser_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  planned_date DATE,
  interested_count INTEGER DEFAULT 0,
  published_post_id UUID REFERENCES public.daily_posts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teaser_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view teasers" ON public.teaser_posts;
CREATE POLICY "Anyone can view teasers"
  ON public.teaser_posts FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Chef can manage own teasers" ON public.teaser_posts;
CREATE POLICY "Chef can manage own teasers"
  ON public.teaser_posts FOR ALL USING (auth.uid() = chef_id);


-- ========================
-- TEASER INTERESTS TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.teaser_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teaser_id UUID NOT NULL REFERENCES public.teaser_posts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teaser_id, customer_id)
);

ALTER TABLE public.teaser_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view interests" ON public.teaser_interests;
CREATE POLICY "Anyone can view interests"
  ON public.teaser_interests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can toggle interest" ON public.teaser_interests;
CREATE POLICY "Users can toggle interest"
  ON public.teaser_interests FOR ALL USING (auth.uid() = customer_id);


-- ========================
-- DISPUTES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  chef_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('not_delivered', 'wrong_order', 'quality_issue', 'late_delivery', 'other')),
  description TEXT,
  evidence_photos TEXT[] DEFAULT '{}',
  chef_response TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'chef_responded', 'resolved', 'refunded', 'escalated')),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  chef_response_deadline TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer can view own disputes" ON public.disputes;
CREATE POLICY "Customer can view own disputes"
  ON public.disputes FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Chef can view own disputes" ON public.disputes;
CREATE POLICY "Chef can view own disputes"
  ON public.disputes FOR SELECT USING (auth.uid() = chef_id);

DROP POLICY IF EXISTS "Customer can create disputes" ON public.disputes;
CREATE POLICY "Customer can create disputes"
  ON public.disputes FOR INSERT WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Chef can respond to disputes" ON public.disputes;
CREATE POLICY "Chef can respond to disputes"
  ON public.disputes FOR UPDATE USING (auth.uid() = chef_id);


-- ========================
-- ADDRESSES TABLE
-- ========================
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_address TEXT NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses"
  ON public.addresses FOR ALL USING (auth.uid() = user_id);


-- ========================
-- INDEXES FOR PERFORMANCE
-- ========================
CREATE INDEX IF NOT EXISTS idx_prep_menu_chef ON public.prep_menu_items(chef_id);
CREATE INDEX IF NOT EXISTS idx_prep_requests_customer ON public.prep_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_prep_requests_chef ON public.prep_requests(chef_id);
CREATE INDEX IF NOT EXISTS idx_specialties_chef ON public.chef_specialties(chef_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_earnings_chef ON public.earnings(chef_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_post ON public.flash_sales(post_id);
CREATE INDEX IF NOT EXISTS idx_group_orders_chef ON public.group_orders(chef_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_post ON public.waitlist(post_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON public.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_chef ON public.subscriptions(chef_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_teaser_posts_chef ON public.teaser_posts(chef_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);


-- ========================
-- RPC FUNCTIONS
-- ========================

-- Increment group order quantity atomically
CREATE OR REPLACE FUNCTION public.increment_group_quantity(p_group_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.group_orders
  SET current_quantity = current_quantity + p_qty,
      status = CASE
        WHEN current_quantity + p_qty >= target_quantity THEN 'reached'
        ELSE status
      END
  WHERE id = p_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment teaser interest count
CREATE OR REPLACE FUNCTION public.increment_teaser_interest(p_teaser_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.teaser_posts
  SET interested_count = interested_count + 1
  WHERE id = p_teaser_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement teaser interest count
CREATE OR REPLACE FUNCTION public.decrement_teaser_interest(p_teaser_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.teaser_posts
  SET interested_count = GREATEST(0, interested_count - 1)
  WHERE id = p_teaser_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================
-- ENABLE REALTIME ON KEY TABLES
-- (These will error if already added — that's OK, ignore errors)
-- ========================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.prep_requests;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.flash_sales;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_orders;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.group_order_participants;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.disputes;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
