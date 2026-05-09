-- =============================================================
-- HomeChef — Database UPGRADE Script
-- Run this if you already have the base tables from migration.sql
-- This only adds NEW tables (messages, promo_codes) + location columns
-- =============================================================

-- Add location columns (safe to re-run)
ALTER TABLE public.chef_profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.chef_profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- ========================
-- MESSAGES TABLE (In-App Chat)
-- ========================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

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

-- ========================
-- PROMO CODES TABLE
-- ========================
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

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone reads active promos" ON public.promo_codes
    FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========================
-- SEED PROMO CODES
-- ========================
INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order, is_active) VALUES
  ('HOMECHEF10', 'percentage', 10, 300, true),
  ('WELCOME50', 'fixed', 50, 200, true),
  ('FREEDEL', 'free_delivery', 100, 0, true)
ON CONFLICT (code) DO NOTHING;
