// =============================================================
// Payment Service — Native version with Stripe React Native
// This file is loaded ONLY on iOS/Android via Metro's
// platform-specific file resolution (.native.ts > .ts)
// =============================================================

import { initStripe, presentPaymentSheet, initPaymentSheet } from '@stripe/stripe-react-native';

const STRIPE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

/** Initialize Stripe on native */
export async function initializePayments() {
  if (!STRIPE_KEY) {
    console.log('[Payments] No Stripe key configured — card payments disabled');
    return;
  }
  try {
    await initStripe({
      publishableKey: STRIPE_KEY,
      merchantIdentifier: 'merchant.com.homechef',
      urlScheme: 'homechef',
    });
    console.log('[Payments] Stripe initialized');
  } catch (e) {
    console.log('[Payments] Stripe init failed:', e);
  }
}

/** Create payment intent via Supabase Edge Function */
export async function createPaymentIntent(
  amount: number, customerId: string, chefId: string, orderId: string,
) {
  try {
    const { supabase } = require('@/lib/supabase');
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { amount: amount * 100, currency: 'dzd', customer_id: customerId, chef_id: chefId, order_id: orderId },
    });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Failed to create payment intent' };
  }
}

/** Process card payment using Stripe Payment Sheet */
export async function processCardPayment(clientSecret: string): Promise<PaymentResult> {
  try {
    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'HomeChef',
      style: 'automatic',
      appearance: {
        colors: { primary: '#8d4b00', background: '#FEFBF6' },
        shapes: { borderRadius: 14 },
      },
    });

    if (initError) return { success: false, error: initError.message };

    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      if (presentError.code === 'Canceled') return { success: false, error: 'Payment cancelled' };
      return { success: false, error: presentError.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || 'Payment failed' };
  }
}

/** Process cash on delivery */
export function processCashPayment(orderId: string): PaymentResult {
  return { success: true, paymentIntentId: `cash_${orderId}` };
}

/** Full checkout flow */
export async function processCheckout(params: {
  method: 'card' | 'cash'; amount: number; customerId: string; chefId: string; orderId: string;
}): Promise<PaymentResult> {
  if (params.method === 'cash') return processCashPayment(params.orderId);

  const { data: intent, error } = await createPaymentIntent(
    params.amount, params.customerId, params.chefId, params.orderId,
  );
  if (error || !intent) return { success: false, error: error || 'Failed to initialize payment' };

  return processCardPayment(intent.clientSecret);
}

/** Refund a payment */
export async function refundPayment(paymentIntentId: string, amount?: number) {
  try {
    const { supabase } = require('@/lib/supabase');
    const { error } = await supabase.functions.invoke('refund-payment', {
      body: { payment_intent_id: paymentIntentId, amount: amount ? amount * 100 : undefined },
    });
    return { success: !error, error: error?.message };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** Get chef payout balance */
export async function getChefPayoutBalance(chefId: string) {
  try {
    const { supabase } = require('@/lib/supabase');
    const { data, error } = await supabase.functions.invoke('get-payout-balance', { body: { chef_id: chefId } });
    if (error) return { available: 0, pending: 0, error: error.message };
    return { available: data?.available || 0, pending: data?.pending || 0 };
  } catch (e: any) {
    return { available: 0, pending: 0, error: e.message };
  }
}

/** Request payout */
export async function requestPayout(chefId: string, amount: number) {
  try {
    const { supabase } = require('@/lib/supabase');
    const { error } = await supabase.functions.invoke('request-payout', { body: { chef_id: chefId, amount: amount * 100 } });
    return { success: !error, error: error?.message };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
