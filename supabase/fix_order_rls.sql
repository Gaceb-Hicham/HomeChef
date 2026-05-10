-- =============================================
-- FIX: Add SECURITY DEFINER to allow customers
-- to place orders (updates chef's post quantity)
-- =============================================
-- Run this in: Supabase Dashboard → SQL Editor → New query

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
