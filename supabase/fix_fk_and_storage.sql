-- =============================================================
-- HomeChef — Fix: FK, Storage & Photos
-- Run this in Supabase SQL Editor
-- =============================================================

-- ─── 1. OPTIONAL: Add direct FK from daily_posts to chef_profiles ───
-- This creates a direct relationship for cleaner queries.
-- Not required — the app now uses nested joins that work without it.
DO $$ BEGIN
  ALTER TABLE public.daily_posts
    ADD CONSTRAINT daily_posts_chef_profile_fkey
    FOREIGN KEY (chef_id) REFERENCES public.chef_profiles(user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Storage Buckets — ensure they exist and are PUBLIC ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('kitchens', 'kitchens', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('reviews', 'reviews', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ─── 3. Storage Policies — public read, authenticated upload ───
DO $$ BEGIN
  CREATE POLICY "Public read posts" ON storage.objects
    FOR SELECT USING (bucket_id = 'posts');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Auth upload posts" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Auth update posts" ON storage.objects
    FOR UPDATE USING (bucket_id = 'posts' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public read avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Auth upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 4. Add sample photos to seed posts (Unsplash food images) ───
-- These are real, working URLs so the feed shows actual food photos
UPDATE public.daily_posts SET photos = ARRAY[
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop'
] WHERE title = 'Couscous Royal' AND photos = '{}';

UPDATE public.daily_posts SET photos = ARRAY[
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop'
] WHERE title = 'Tajine Zitoune' AND photos = '{}';

UPDATE public.daily_posts SET photos = ARRAY[
  'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=600&h=400&fit=crop'
] WHERE title = 'Baklava Box' AND photos = '{}';

UPDATE public.daily_posts SET photos = ARRAY[
  'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop'
] WHERE title = 'Makrout' AND photos = '{}';

UPDATE public.daily_posts SET photos = ARRAY[
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop'
] WHERE title = 'Chorba Frik' AND photos = '{}';

UPDATE public.daily_posts SET photos = ARRAY[
  'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&h=400&fit=crop'
] WHERE title = 'Grilled Chicken Plate' AND photos = '{}';

UPDATE public.daily_posts SET photos = ARRAY[
  'https://images.unsplash.com/photo-1549931319-a545753467c8?w=600&h=400&fit=crop'
] WHERE title = 'Fresh Baguettes' AND photos = '{}';
