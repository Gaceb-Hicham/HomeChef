-- Add location columns to chef_profiles
-- Run this in Supabase SQL Editor

ALTER TABLE public.chef_profiles 
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
