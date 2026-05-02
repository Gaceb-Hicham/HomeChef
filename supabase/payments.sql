-- =============================================================
-- Supabase Edge Function: create-payment-intent
-- Deploy: supabase functions deploy create-payment-intent
-- =============================================================
-- File: supabase/functions/create-payment-intent/index.ts

/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.6.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const { amount, currency, customer_id, chef_id, order_id, metadata } = await req.json()

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || 'dzd',
      metadata: {
        ...metadata,
        customer_id,
        chef_id,
        order_id,
      },
      automatic_payment_methods: { enabled: true },
    })

    return new Response(
      JSON.stringify({
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
*/

-- =============================================================
-- Supabase Edge Function: refund-payment
-- =============================================================
-- File: supabase/functions/refund-payment/index.ts

/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.6.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  const { payment_intent_id, amount } = await req.json()

  try {
    const refund = await stripe.refunds.create({
      payment_intent: payment_intent_id,
      amount: amount || undefined, // full refund if no amount
    })

    return new Response(
      JSON.stringify({ id: refund.id, status: refund.status }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
*/

-- =============================================================
-- Payments table for tracking transactions
-- Run in SQL Editor AFTER the initial migration
-- =============================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.users(id),
  chef_id uuid REFERENCES public.users(id),
  stripe_payment_intent_id text,
  amount integer NOT NULL, -- in centimes
  currency text DEFAULT 'dzd',
  method text NOT NULL CHECK (method IN ('card', 'cash')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  refund_id text,
  refund_amount integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payouts table for chef withdrawals
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id uuid REFERENCES public.users(id) NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'dzd',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  bank_info jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = chef_id);

CREATE POLICY "Chefs can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = chef_id);

CREATE POLICY "Chefs can request payouts" ON public.payouts
  FOR INSERT WITH CHECK (auth.uid() = chef_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_chef ON public.payouts(chef_id);
