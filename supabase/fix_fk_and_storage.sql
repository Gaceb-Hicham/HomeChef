-- =============================================================
-- HomeChef — Fix: Add proper FK + Storage permissions
-- Run this in Supabase SQL Editor
-- =============================================================

-- 1. Add a direct foreign key from daily_posts.chef_id to chef_profiles.user_id
-- This creates a PROPER relationship so PostgREST can do direct joins
-- (The existing FK to users.id stays — this adds a SECOND path)
DO $$ BEGIN
  ALTER TABLE public.daily_posts
    ADD CONSTRAINT daily_posts_chef_profile_fkey
    FOREIGN KEY (chef_id) REFERENCES public.chef_profiles(user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Make the 'posts' storage bucket PUBLIC so images load
-- (If it doesn't exist, create it)
INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Also ensure 'avatars' bucket is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Storage access policies (allow public read, authenticated upload)
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
